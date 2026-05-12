<?php
declare(strict_types=1);

// --------- Headers ---------
header('Content-Type: application/json; charset=utf-8');

ini_set('display_errors', '1');
error_reporting(E_ALL);
set_error_handler(function($no,$str,$file,$line){
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['php_error'=>compact('no','str','file','line')], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
  exit;
});
set_exception_handler(function($e){
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['php_exception'=>[
    'msg'=>$e->getMessage(),'file'=>$e->getFile(),'line'=>$e->getLine()
  ]], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
  exit;
});

// (Optionnel) activer le debug verbeux avec ?debug=on (n'affecte pas la sortie JSON)
$DEBUG_VERBOSE = isset($_GET['debug']) && $_GET['debug'] === 'on';
if ($DEBUG_VERBOSE) {
  ini_set('display_errors', '1');
  error_reporting(E_ALL);
}

// ini_set('log_errors', '1');
// ini_set('error_log', $root . '/var/cache/jpl_planets/php-error.log');

// --------- Bootstrapping minimal ---------
$root = dirname(__DIR__, 2); // …/GravitationalCalculation
$bootstrap = $root . '/src/bootstrap.php';
if (is_file($bootstrap)) { @require $bootstrap; }

// Dossiers
$cacheDir = $root . '/var/cache/jpl_planets';
if (!is_dir($cacheDir)) @mkdir($cacheDir, 0775, true);

// --------- Constantes ---------
/** FR -> Horizons IDs (barycentres planétaires + Pluton) */
const H_TARGET = [
  'Mercure'=>'199','Vénus'=>'299','Terre'=>'399','Mars'=>'499',
  'Jupiter'=>'599','Saturne'=>'699','Uranus'=>'799','Neptune'=>'899',
  'Pluton'=>'999',
];

// --------- Utilitaires ---------
function json_out(array $data, int $http = 200): void {
  http_response_code($http);
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
  exit;
}

function julianDateUTC(\DateTime $dtUTC): float {
  return $dtUTC->getTimestamp() / 86400 + 2440587.5;
}

// --------- Parser Horizons ---------
/**
 * Parse EC, A, MA, W depuis le texte Horizons (CSV global, bloc $$SOE, ou lignes libellées).
 * Retourne ['e','a_au','M_deg','w_deg', 'raw_csv_header'=>?string]
 */
/** Parse EC, A, MA, W depuis le texte Horizons (CSV global, bloc $$SOE, ou lignes libellées). */
/** Parse EC, A, MA, W depuis le texte Horizons (CSV global, bloc $$SOE, ou lignes libellées). */
function parse_elements_from_result(string $text): ?array {
  $lines = preg_split('/\R/', $text);

  // Helper: true si non-null ET fini (évite is_finite(null))
  $finite = function (?float $x): bool {
    return $x !== null && is_finite($x);
  };

  // Helper CSV -> map
  $mkMap = function(string $hdr, string $val): array {
    $H = array_map('trim', explode(',', $hdr));
    $V = array_map('trim', explode(',', $val));
    $map = [];
    foreach ($H as $i => $k) {
      $k = preg_replace('/\s+/', '', $k);
      if ($k === '') continue;
      $map[$k] = $V[$i] ?? null;
    }
    return $map;
  };

  // 1) CSV GLOBAL (header présent au-dessus de $$SOE)
  $hdrIdx = null; $hdrStr = null;
  foreach ($lines as $i => $L) {
    if (strpos($L, ',') === false) continue;
    $S = strtoupper($L);
    if (strpos($S, 'JDTDB') !== false && strpos($S, 'EC') !== false &&
        preg_match('/\bA\b/', $S) && strpos($S, 'MA') !== false && preg_match('/\bW\b/', $S)) {
      $hdrIdx = $i; $hdrStr = trim($L); break;
    }
  }
  if ($hdrIdx !== null) {
    // Valeurs = première ligne CSV après header, en ignorant '*' (séparateurs) ET '$' (ex: $$SOE)
    for ($j = $hdrIdx + 1; $j < count($lines); $j++) {
      $val = trim($lines[$j]);
      if ($val === '' || $val[0] === '*' || $val[0] === '$') continue;
      if (strpos($val, ',') === false) continue; // sécurité: doit ressembler à une ligne CSV
      $map = $mkMap($hdrStr, $val);
      $ec = isset($map['EC']) ? (float)$map['EC'] : null;
      $a  = isset($map['A'])  ? (float)$map['A']  : null;
      $ma = isset($map['MA']) ? (float)$map['MA'] : null;
      $w  = isset($map['W'])  ? (float)$map['W']  : null;

      if ((!$finite($a)) && isset($map['QR']) && $finite($ec)) {
        $qr = (float)$map['QR'];
        if ($finite($qr) && $ec < 1.0) $a = $qr / (1 - $ec);
      }
      if ($finite($ec) && $finite($a) && $finite($ma) && $finite($w)) {
        return ['e'=>$ec, 'a_au'=>$a, 'M_deg'=>$ma, 'w_deg'=>$w, 'raw_csv_header'=>$hdrStr];
      }
      break; // header ok mais ligne de valeurs non parseable -> on tentera $$SOE plus bas
    }
  }

  // 2) Bloc $$SOE / $$EOE : la ligne d'entête est AVANT $$SOE ; ici on prend la 1ère ligne CSV du bloc
  $start = null; $end = null;
  foreach ($lines as $i => $L) {
    if (strpos($L, '$$SOE') !== false) $start = $i;
    if (strpos($L, '$$EOE') !== false) { $end = $i; break; }
  }
  if ($start !== null && $end !== null && $end > $start + 1) {
    $block = array_slice($lines, $start + 1, $end - $start - 1);
    // Cherche la première "vraie" ligne CSV de données (ignore vides et séparateurs)
    $dataLine = null;
    foreach ($block as $L) {
      $S = trim($L);
      if ($S === '' || $S[0] === '*' || $S[0] === '$') continue;
      if (strpos($S, ',') !== false) { $dataLine = $S; break; }
    }
    if ($dataLine) {
      // Si on a l'entête global capté plus haut, on mappe avec lui
      if ($hdrStr) {
        $map = $mkMap($hdrStr, $dataLine);
        $ec = isset($map['EC']) ? (float)$map['EC'] : null;
        $a  = isset($map['A'])  ? (float)$map['A']  : null;
        $ma = isset($map['MA']) ? (float)$map['MA'] : null;
        $w  = isset($map['W'])  ? (float)$map['W']  : null;
        if ((!$finite($a)) && isset($map['QR']) && $finite($ec)) {
          $qr = (float)$map['QR'];
          if ($finite($qr) && $ec < 1.0) $a = $qr / (1 - $ec);
        }
        if ($finite($ec) && $finite($a) && $finite($ma) && $finite($w)) {
          return ['e'=>$ec, 'a_au'=>$a, 'M_deg'=>$ma, 'w_deg'=>$w, 'raw_csv_header'=>$hdrStr];
        }
      }
      // Fallback **par index** (format 10 Horizons): JDTDB(0), CalDate(1), EC(2), QR(3), IN(4), OM(5), W(6), Tp(7), N(8), MA(9), TA(10), A(11), AD(12), PR(13)
      $V = array_map('trim', explode(',', $dataLine));
      $ec = isset($V[2])  ? (float)$V[2]  : null;
      $a  = isset($V[11]) ? (float)$V[11] : null;
      $ma = isset($V[9])  ? (float)$V[9]  : null;
      $w  = isset($V[6])  ? (float)$V[6]  : null;
      if ((!$finite($a)) && isset($V[3]) && $finite($ec)) { // QR index 3
        $qr = (float)$V[3];
        if ($finite($qr) && $ec < 1.0) $a = $qr / (1 - $ec);
      }
      if ($finite($ec) && $finite($a) && $finite($ma) && $finite($w)) {
        return ['e'=>$ec, 'a_au'=>$a, 'M_deg'=>$ma, 'w_deg'=>$w, 'raw_csv_header'=>null];
      }
    }
  }

  // 3) Lignes libellées (rare avec format=10, mais on garde en secours)
  $out = ['a_au'=>null,'e'=>null,'M_deg'=>null,'w_deg'=>null];
  foreach ($lines as $L) {
    if (preg_match('/\bEC=\s*([\-0-9.E+]+)/', $L, $m)) $out['e']     = (float)$m[1];
    if (preg_match('/\bA=\s*([\-0-9.E+]+)/',  $L, $m)) $out['a_au']  = (float)$m[1];
    if (preg_match('/\bMA=\s*([\-0-9.E+]+)/', $L, $m)) $out['M_deg'] = (float)$m[1];
    if (preg_match('/\bW\s*=\s*([\-0-9.E+]+)/', $L, $m)) $out['w_deg']= (float)$m[1];
  }
  if ((!$finite($out['a_au'])) && $finite($out['e'] ?? null)) {
    foreach ($lines as $L) {
      if (preg_match('/\bQR=\s*([\-0-9.E+]+)/', $L, $m)) {
        $qr = (float)$m[1]; $e = $out['e'];
        if ($finite($qr) && $e < 1.0) $out['a_au'] = $qr / (1 - $e);
        break;
      }
    }
  }
  if ($finite($out['e'] ?? null) && $finite($out['a_au'] ?? null)
      && $finite($out['M_deg'] ?? null) && $finite($out['w_deg'] ?? null)) {
    return $out + ['raw_csv_header'=>null];
  }

  return null;
}


// --------- Requête Horizons ---------
/**
 * Requête un objet ; met en cache uniquement sur succès.
 * Retourne ['ok'=>bool, 'data'=>array]|['ok'=>false,'http'=>code,'error'=>msg,'body'=>snippet,'url'=>url]
 */
function jpl_fetch_elements(string $target, string $epochUtc, string $cacheDir): array {
  if (!isset(H_TARGET[$target])) return ['ok'=>false,'error'=>'Unknown target'];
  $cmd = H_TARGET[$target];

  // Cache par minute UTC
  $safeDate = preg_replace('/[^0-9TZ:\- ]/', '', $epochUtc);
  $key = $cmd . '_' . str_replace([' ',':'], ['_','-'], $safeDate);
  $cacheFile = $cacheDir . '/' . $key . '.json';

  if (is_file($cacheFile) && (time() - filemtime($cacheFile) < 86400)) {
    $cached = json_decode(@file_get_contents($cacheFile), true);
    if (is_array($cached)) return ['ok'=>true,'data'=>$cached,'cached'=>true];
  }

  // Paramètres Horizons (osculating elements)
  $params = [
    'format'      => 'json',
    'COMMAND'     => "'$cmd'",
    'EPHEM_TYPE'  => "'ELEMENTS'",
    'CENTER'      => "'@sun'",      // héliocentrique
    'REF_PLANE'   => "'ECLIPTIC'",
    'REF_SYSTEM'  => "'J2000'",
    'CSV_FORMAT'  => "'YES'",
    'OBJ_DATA'    => "'NO'",
    'TLIST'       => "'$epochUtc'", // 'YYYY-MM-DD HH:MM' (interprété avec TIME_TYPE)
    'TIME_TYPE'   => "'TDB'",       // <— requis par Horizons pour les éléments osculateurs
    'TP_TYPE'     => "'ABSOLUTE'",
    'MAKE_EPHEM'  => "'YES'",
    'OUT_UNITS'   => "'AU-D'",
  ];
  $url = 'https://ssd.jpl.nasa.gov/api/horizons.api?' . http_build_query($params);

  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS      => 3,
    CURLOPT_CONNECTTIMEOUT => 20,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_USERAGENT      => 'GravitationalCalculation/1.0 (+https://prolice.ovh/)',
  ]);
  $raw = curl_exec($ch);
  $http = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $curlErr = $raw === false ? curl_error($ch) : null;
  curl_close($ch);

  if ($raw === false) {
    return ['ok'=>false,'http'=>$http ?: 0,'error'=>"cURL error: $curlErr",'url'=>$url];
  }
  if ($http >= 400) {
    return ['ok'=>false,'http'=>$http,'error'=>"Horizons $http",'body'=>substr((string)$raw,0,600),'url'=>$url];
  }

  $json = json_decode((string)$raw, true);
  $resultText = is_array($json) && isset($json['result']) ? (string)$json['result'] : (string)$raw;

  // Erreur textuelle possible dans 'result' (même en 200)
  if (stripos($resultText, 'API ERROR') !== false || stripos($resultText, '*** error') !== false) {
    return ['ok'=>false,'http'=>400,'error'=>'Horizons error in result','body'=>substr($resultText,0,900),'url'=>$url];
  }

  $el = parse_elements_from_result($resultText);
  if (!$el) {
    @file_put_contents($cacheFile . '.err.txt', $resultText);
    return ['ok'=>false,'http'=>502,'error'=>'Parsing failed (missing fields).','body'=>substr($resultText,0,1200),'url'=>$url];
  }

  $out = ['name'=>$target,'epoch'=>$epochUtc] + $el;
  @file_put_contents($cacheFile, json_encode($out, JSON_UNESCAPED_UNICODE));
  return ['ok'=>true,'data'=>$out,'cached'=>false];
}

// --------- Mode debug brut (pour diagnostiquer sans parsing) ---------
// /api/planets_jpl.php?debug=raw&target=Mercure&date=2025-09-12 12:00
if (isset($_GET['debug']) && $_GET['debug'] === 'raw') {
  $target = $_GET['target'] ?? 'Mercure';
  $dateParam = $_GET['date'] ?? '';
  try {
    $dateParam = str_replace('T', ' ', trim($dateParam));
    $dt = $dateParam ? new DateTime($dateParam, new DateTimeZone('UTC')) : new DateTime('now', new DateTimeZone('UTC'));
  } catch (\Throwable $e) {
    $dt = new DateTime('now', new DateTimeZone('UTC'));
  }
  $epochUtc = $dt->format('Y-m-d H:i');

  $params = [
    'format'      => 'json',
    'COMMAND'     => "'".(H_TARGET[$target] ?? '199')."'",
    'EPHEM_TYPE'  => "'ELEMENTS'",
    'CENTER'      => "'@sun'",
    'REF_PLANE'   => "'ECLIPTIC'",
    'REF_SYSTEM'  => "'J2000'",
    'CSV_FORMAT'  => "'YES'",
    'OBJ_DATA'    => "'NO'",
    'TLIST'       => "'$epochUtc'",
    'TIME_TYPE'   => "'TDB'",
    'TP_TYPE'     => "'ABSOLUTE'",
    'MAKE_EPHEM'  => "'YES'",
    'OUT_UNITS'   => "'AU-D'",
  ];
  $url = 'https://ssd.jpl.nasa.gov/api/horizons.api?' . http_build_query($params);
  $raw = @file_get_contents($url);
  header('Content-Type: text/plain; charset=utf-8');
  echo $raw ?: 'No response';
  exit;
}

// --------- Entrée ?date= ---------
$dateParam = $_GET['date'] ?? '';
try {
  $dateParam = str_replace('T', ' ', trim($dateParam));
  $dt = $dateParam ? new DateTime($dateParam, new DateTimeZone('UTC')) : new DateTime('now', new DateTimeZone('UTC'));
} catch (\Throwable $e) {
  $dt = new DateTime('now', new DateTimeZone('UTC'));
}
$epochUtc = $dt->format('Y-m-d H:i');

// --------- Batch (9 cibles) ---------
$targets = array_keys(H_TARGET);
$out = [];
$httpFail = 0; $firstErr = null;

foreach ($targets as $t) {
  $r = jpl_fetch_elements($t, $epochUtc, $cacheDir);
  if (!($r['ok'] ?? false)) {
    $httpFail = $r['http'] ?? 500;
    $firstErr = $firstErr ?: $r;
    $out[$t] = null;
  } else {
    $out[$t] = $r['data'];
  }
}

if ($firstErr) {
  json_out(['error'=>'JPL/Horizons failure','detail'=>$firstErr,'partial'=>$out], $httpFail ?: 502);
}

json_out($out, 200);
