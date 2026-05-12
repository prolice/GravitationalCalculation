<?php
declare(strict_types=1);
header('Content-Type: text/plain; charset=utf-8');

$target = $_GET['target'] ?? '199';               // 199=Mercure
$date   = $_GET['date']   ?? '2025-09-12 12:00';  // format libre
$params = [
  'format'      => 'json',
  'COMMAND'     => "'$target'",
  'EPHEM_TYPE'  => "'ELEMENTS'",
  'CENTER'      => "'@sun'",
  'REF_PLANE'   => "'ECLIPTIC'",
  'REF_SYSTEM'  => "'J2000'",
  'CSV_FORMAT'  => "'YES'",
  'OBJ_DATA'    => "'NO'",
  'TLIST'       => "'$date'",
  'TIME_TYPE'   => "'TDB'",         // <= requis pour éléments osculateurs
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
$err  = $raw === false ? curl_error($ch) : null;
curl_close($ch);

echo "HTTP: $http\nURL: $url\nERR: " . ($err ?: 'none') . "\n\n";
echo $raw ?: "(no body)";
