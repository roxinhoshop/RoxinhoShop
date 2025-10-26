<?php
// ===== ROOXYCE STORE - CONFIGURAÇÃO DO BANCO DE DADOS =====
// Desenvolvido por Gabriel (gabwvr)
// Arquivo de configuração para conexão com banco de dados MySQL

define('DB_HOST', 'ballast.proxy.rlwy.net');
define('DB_PORT', '45057');
define('DB_NAME', 'RoxinhoShop');
define('DB_USER', 'root');
define('DB_PASS', 'BDoSgwDbqkgEMGXZenKBbXvqlDPtuGEF');
define('DB_CHARSET', 'utf8mb4');

// Configurações da aplicação
define('APP_NAME', 'ROOXYCE Store');
define('APP_VERSION', '1.0.0');
define('APP_DEBUG', true);

// Configurações de segurança
define('SECRET_KEY', 'rooxyce_secret_key_2024');
define('PASSWORD_SALT', 'rooxyce_salt_2024');

// Configurações de sessão
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // Mude para 1 em HTTPS
session_start();

// Configurações de erro
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Configurações de timezone
date_default_timezone_set('America/Sao_Paulo');

// Headers para CORS (permitir requisições do frontend)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Responder a requisições OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
