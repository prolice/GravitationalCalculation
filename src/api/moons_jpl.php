<?php
declare(strict_types=1);

// JSON: { "Mercure": [...], ..., "Pluton": [...] }  — FAST MODE
// - 1 seule requête: https://ssd.jpl.nasa.gov/sats/elem/sep.html
// - Parse robuste des tableaux "a (km)" & "e"
// - PAS de Horizons par défaut (toggle ci-dessous)
// - Cache 24h

header('Content-Type: application/json; charset=utf-8');

const ALLOWED_PLANETS = ['Mercure','Vénus','Terre','Mars','Jupiter','Saturne','Uranus','Neptune','Pluton'];
const FR2EN = [
  'Mercure'=>'Mercury','Vénus'=>'Venus','Terre'=>'Earth','Mars'=>'Mars','Jupiter'=>'Jupiter',
  'Saturne'=>'Saturn','Uranus'=>'Uranus','Neptune'=>'Neptune','Pluton'=>'Pluto'
];

// ====== Réglages réseau / TLS ======
const CA_BUNDLE         = __DIR__ . '/../../var/certs/cacert.pem';
const FETCH_TIMEOUT_S   = 12;      // timeout par GET
const USE_HORIZONS      = false;   // mettre true si tu veux compléter a/e manquants
const HORIZONS_MAX_CALL = 6;       // limite par requête API (si USE_HORIZONS=true)
const MOONS_INSECURE_SSL= false;   // dépannage uniquement (false en prod)

$cacheDir  = __DIR__ . '/../../var/cache';
@is_dir($cacheDir) || @mkdir($cacheDir, 0777, true);
$cacheFile = $cacheDir . '/moons_jpl_cache.json';
$ttlSeconds = 24 * 3600;

// --- Utils sortants
function out($data, int $code=200){ http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); exit; }
function curlAvailable(): bool { return function_exists('curl_init'); }
function curlTlsOptions(): array {
  $opts = [CURLOPT_SSL_VERIFYPEER => !MOONS_INSECURE_SSL, CURLOPT_SSL_VERIFYHOST => MOONS_INSECURE_SSL ? 0 : 2];
  if (!MOONS_INSECURE_SSL && is_file(CA_BUNDLE)) $opts[CURLOPT_CAINFO] = CA_BUNDLE;
  return $opts;
}
function streamTlsContext(int $timeout): array {
  $ssl = ['verify_peer'=>!MOONS_INSECURE_SSL, 'verify_peer_name'=>!MOONS_INSECURE_SSL, 'SNI_enabled'=>true, 'allow_self_signed'=>MOONS_INSECURE_SSL];
  if (!MOONS_INSECURE_SSL && is_file(CA_BUNDLE)) $ssl['cafile'] = CA_BUNDLE;
  return ['http'=>['method'=>'GET','timeout'=>$timeout,'header'=>"User-Agent: moons-app/1.0\r\nAccept: text/html,application/json\r\n"], 'https'=>$ssl];
}
function fetchUrl(string $url, int $timeout=FETCH_TIMEOUT_S): string {
  if (curlAvailable()) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER=>true, CURLOPT_FOLLOWLOCATION=>true,
      CURLOPT_CONNECTTIMEOUT=>min(5,$timeout), CURLOPT_TIMEOUT=>$timeout,
      CURLOPT_USERAGENT=>'moons-app/1.0 (+https://prolice.ovh)',
      CURLOPT_HTTPHEADER=>['Accept: text/html,application/json'],
    ] + curlTlsOptions());
    $data = curl_exec($ch);
    if ($data === false) {
      $err = curl_error($ch); $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE); curl_close($ch);
      throw new RuntimeException("cURL GET failed: $url (code=$code; $err)");
    }
    $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE); curl_close($ch);
    if ($code >= 400) throw new RuntimeException("HTTP $code: $url");
    return (string)$data;
  }
  $ctx = stream_context_create(streamTlsContext($timeout));
  $data = @file_get_contents($url, false, $ctx);
  if ($data === false) throw new RuntimeException("HTTP GET failed (streams): $url");
  return (string)$data;
}

// --- Parsing helpers
function normnum(?string $s): ?float {
  if ($s===null) return null; $s=trim($s); if ($s==='') return null;
  $s = preg_replace('/[^\dEe+\-.,]/', '', $s);
  if (substr_count($s, ',') && str_contains($s, '.')) $s = str_replace(',', '', $s);
  if (!str_contains($s, '.') && substr_count($s, ',')===1 && preg_match('/\d,\d/', $s)) $s = str_replace(',', '.', $s);
  if (!preg_match('/^[+\-]?\d+(\.\d+)?([Ee][+\-]?\d+)?$/', $s)) return null;
  return (float)$s;
}
function textOf($node): string {
  return trim(preg_replace('/\s+/', ' ', strip_tags($node instanceof DOMNode ? $node->textContent : (string)$node)));
}
function detectPlanetNearTable(DOMElement $tbl, DOMXPath $xp): ?string {
  // caption
  $cap = $xp->query('./caption', $tbl);
  if ($cap && $cap->length) {
    $txt = textOf($cap->item(0));
    if (preg_match('/\b(Mercury|Venus|Earth|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)\b/i', $txt, $m)) return ucfirst(strtolower($m[1]));
  }
  // voisins amont
  $node = $tbl; $steps=0;
  while ($node && $steps < 10) {
    $node = $node->previousSibling ?: $node->parentNode; if (!$node) break;
    if ($node instanceof DOMElement && in_array(strtolower($node->nodeName), ['h1','h2','h3','h4','p','div'])) {
      $txt = textOf($node);
      if (preg_match('/\b(Mercury|Venus|Earth|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)\b/i', $txt, $m)) return ucfirst(strtolower($m[1]));
    }
    $steps++;
  }
  return null;
}
function parseSepHtml(string $html): array {
  if (!class_exists('DOMDocument')) throw new RuntimeException('DOMDocument not available');
  $dom = new DOMDocument(); libxml_use_internal_errors(true);
  $ok = $dom->loadHTML($html); libxml_clear_errors(); if (!$ok) throw new RuntimeException('DOM parse fail');
  $xp = new DOMXPath($dom);

  $result = [];
  /** @var DOMElement $tbl */
  foreach ($xp->query('//table') as $tbl) {
    $planetEn = detectPlanetNearTable($tbl, $xp);
    if (!$planetEn) continue;

    // headers (th sinon 1ère ligne td)
    $hdrs=[]; $th = $xp->query('.//thead//th | .//tr[1]/th', $tbl);
    if ($th && $th->length) foreach ($th as $i=>$n) $hdrs[$i]=textOf($n);
    else {
      $tdh=$xp->query('.//tr[1]/td', $tbl);
      if ($tdh && $tdh->length) foreach ($tdh as $i=>$n) $hdrs[$i]=textOf($n);
    }

    $idxName=null; $idxA=null; $idxE=null;
    foreach ($hdrs as $i=>$h) {
      $hL=strtolower($h);
      if ($idxName===null && (str_contains($hL,'name')||str_contains($hL,'satellite'))) $idxName=$i;
      if ($idxA===null && preg_match('/\ba\b/i',$h) && str_contains($hL,'km')) $idxA=$i;
      if ($idxE===null && preg_match('/\be\b/i',$h)) $idxE=$i;
    }
    if ($idxName===null) $idxName=0;

    foreach ($xp->query('.//tr[td]',$tbl) as $ri=>$tr) {
      $tds=$xp->query('./td',$tr); if(!$tds||$tds->length===0) continue;
      if ($ri===0 && $th->length===0) { // sauter éventuelle ligne d’en-tête
        $txt=strtolower(textOf($tr));
        if (str_contains($txt,'name')||str_contains($txt,'satellite')) continue;
      }
      $name=trim($tds->item($idxName)?->textContent??''); if($name==='') continue;
      $a_km=null; $e=null;
      if ($idxA!==null && $tds->item($idxA)) $a_km = normnum($tds->item($idxA)->textContent??'');
      if ($idxE!==null && $tds->item($idxE)) $e    = normnum($tds->item($idxE)->textContent??'');
      $result[$planetEn][]=['name'=>$name,'a_km'=>$a_km,'e'=>$e];
    }
  }
  return $result;
}

// --- (optionnel) Horizons fallback — limité et désactivé par défaut
function horizonsLookup(string $name): ?string {
  $url='https://ssd-api.jpl.nasa.gov/horizons_lookup.api?format=json&input='.urlencode($name);
  $json=json_decode(fetchUrl($url, 8), true);
  if (!empty($json['data'][0]['id'])) return (string)$json['data'][0]['id'];
  return null;
}
function horizonsElements(string $idOrName): array {
  $cmd = is_numeric($idOrName) ? $idOrName : "'$idOrName'";
  $url='https://ssd-api.jpl.nasa.gov/horizons.api?format=json&EPHEM_TYPE=ELEMENTS&MAKE_EPHEM=YES&COMMAND='.urlencode($cmd);
  $json=json_decode(fetchUrl($url, 8), true);
  $out=['a_km'=>null,'e'=>null];
  if (!$json || empty($json['result'])) return $out;
  $txt=$json['result'];
  if (preg_match('/a=\s*([0-9.]+)\s*AU/i',$txt,$m)) $out['a_km']=(float)$m[1]*149597870.7;
  if (preg_match('/e=\s*([0-9.]+)/i',$txt,$m))      $out['e']=(float)$m[1];
  return $out;
}

// ====== Cache (serve si frais) ======
$nocache = isset($_GET['nocache']);
if (!$nocache && file_exists($cacheFile) && (time()-filemtime($cacheFile) < $ttlSeconds)) {
  $data=json_decode((string)file_get_contents($cacheFile), true);
  if (is_array($data)) out($data);
}

// ====== Fetch & parse (FAST: sep.html only) ======
try {
  $html = fetchUrl('https://ssd.jpl.nasa.gov/sats/elem/sep.html', FETCH_TIMEOUT_S);
} catch (Throwable $ex) {
  out(['error'=>'JPL fetch failed','detail'=>$ex->getMessage()], 502);
}

try {
  $parsed = parseSepHtml($html);
} catch (Throwable $ex) {
  out(['error'=>'Parse failed','detail'=>$ex->getMessage()], 502);
}

// ====== Normalisation FR + restriction + (option) Horizons fill ======
$out=[];
$totalHorizonsCalls=0;
foreach (ALLOWED_PLANETS as $fr) {
  $en=FR2EN[$fr];
  $list=$parsed[$en] ?? [];
  $filled=[];
  foreach ($list as $m) {
    $a=$m['a_km']; $e=$m['e'];
    if (USE_HORIZONS && ($a===null || $e===null) && $totalHorizonsCalls < HORIZONS_MAX_CALL) {
      try {
        $id=horizonsLookup($m['name']) ?? $m['name'];
        $el=horizonsElements($id);
        if ($a===null && $el['a_km']!==null) $a=$el['a_km'];
        if ($e===null && $el['e']!==null)    $e=$el['e'];
        $totalHorizonsCalls++;
      } catch (Throwable $t) { /* garde nulls */ }
    }
    $filled[]=['name'=>$m['name'],'a_km'=>$a,'e'=>$e];
  }
  $out[$fr]=$filled;
}

// ====== Cache + sortie ======
@file_put_contents($cacheFile, json_encode($out, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
out($out);
