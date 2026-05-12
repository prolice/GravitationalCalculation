<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

$cacheDir = __DIR__ . '/../../var/cache';
@is_dir($cacheDir) || @mkdir($cacheDir, 0777, true);
$cacheWritable = @file_put_contents($cacheDir . '/_probe.tmp', 'ok') !== false;
@unlink($cacheDir . '/_probe.tmp');

$ca = __DIR__ . '/../../var/certs/cacert.pem';

function curlTest(?string $cafile): array {
  if (!function_exists('curl_init')) return ['available'=>false];
  $ch = curl_init('https://ssd.jpl.nasa.gov/sats/elem/');
  $opts = [
    CURLOPT_RETURNTRANSFER=>true,
    CURLOPT_FOLLOWLOCATION=>true,
    CURLOPT_SSL_VERIFYPEER=>true,
    CURLOPT_SSL_VERIFYHOST=>2,
    CURLOPT_TIMEOUT=>15,
    CURLOPT_USERAGENT=>'moons-app/diag'
  ];
  if ($cafile) $opts[CURLOPT_CAINFO] = $cafile;
  curl_setopt_array($ch, $opts);
  $data = curl_exec($ch);
  $err  = curl_error($ch);
  $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  curl_close($ch);
  return ['ok'=>($data!==false && $code>0 && $code<400), 'code'=>$code, 'error'=>$err ?: null];
}

echo json_encode([
  'php_version'=>PHP_VERSION,
  'extensions'=>[
    'dom'=>class_exists('DOMDocument'),
    'libxml'=>extension_loaded('libxml'),
    'curl'=>function_exists('curl_init'),
  ],
  'allow_url_fopen'=>(bool)ini_get('allow_url_fopen'),
  'cache_dir'=>realpath($cacheDir),
  'cache_writable'=>$cacheWritable,
  'ini_curl.cainfo'=>ini_get('curl.cainfo'),
  'ini_openssl.cafile'=>ini_get('openssl.cafile'),
  'openssl_locations'=>openssl_get_cert_locations(),
  'curl_test_with_ini'=>curlTest(null),           // utilise les .ini (système + .user.ini)
  'curl_test_with_local_bundle'=>curlTest($ca),   // force /var/certs/cacert.pem
], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
