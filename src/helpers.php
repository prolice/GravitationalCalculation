<?php
declare(strict_types=1);

function esc($s): string { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

function sanitize_float(string $s): ?float {
  $s = str_replace([' ', "\u{00A0}", ','], ['', '', '.'], trim($s));
  if ($s === '' || !is_numeric($s)) return null;
  return (float)$s;
}

function parse_mass_list(string $raw): array {
  $raw = trim($raw);
  if ($raw === '') return [];
  if ($raw[0] === '[') {
      $arr = json_decode($raw, true);
      if (is_array($arr)) {
          return array_values(array_filter(array_map(fn($v)=> is_numeric($v) ? (float)$v : null, $arr), fn($v)=> $v!==null));
      }
  }
  $raw = str_replace(["\r\n", "\r"], "\n", $raw);
  $parts = preg_split('/[,\n;]+/', $raw);
  $vals = [];
  foreach ($parts as $p) { $v = sanitize_float($p); if ($v !== null) $vals[] = $v; }
  return $vals;
}

function a_to_m(float $a, string $u): float { return $u==='m' ? $a : ($u==='km' ? $a*1e3 : ($u==='au' ? $a*AU_M : $a)); }
function m_to_unit(float $m, string $u): float { return $u==='m' ? $m : ($u==='km' ? $m/1e3 : ($u==='au' ? $m/AU_M : $m)); }
function masses_to_kg(array $arr, string $u): array { return $u==='kg' ? $arr : array_map(fn($x)=>$x*M_SUN, $arr); }
function mu_from_stars(array $m_kg): array { $M = array_sum($m_kg); return [$M, G_SI*$M]; }
