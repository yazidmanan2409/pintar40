<?php
// Test router for `php -S` (verify/check.mjs only, never deployed): serves
// site/ from the subfolder /test/pintar/, the way a host might, and runs the
// contact handler. Anything outside the subfolder is a 404, so a link written
// from the domain root fails here exactly as it would on the host.
$site = realpath(__DIR__ . '/../site');
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$prefix = '/test/pintar/';
if (strpos($path, $prefix) !== 0) { http_response_code(404); return true; }
$file = $site . '/' . substr($path, strlen($prefix));
if (is_dir($file)) $file = rtrim($file, '/') . '/index.html';
$real = realpath($file);
if ($real === false || strpos($real, $site) !== 0 || !is_file($real)) { http_response_code(404); return true; }
if (substr($real, -4) === '.php') {
    $_SERVER['DOCUMENT_ROOT'] = $site;
    chdir(dirname($real));
    require $real;
    return true;
}
$types = ['html' => 'text/html; charset=utf-8', 'css' => 'text/css', 'js' => 'text/javascript', 'svg' => 'image/svg+xml',
  'woff2' => 'font/woff2', 'png' => 'image/png', 'txt' => 'text/plain; charset=utf-8'];
$ext = pathinfo($real, PATHINFO_EXTENSION);
if ($ext === 'htaccess' || basename($real) === '.htaccess') { http_response_code(404); return true; }
header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
readfile($real);
return true;
