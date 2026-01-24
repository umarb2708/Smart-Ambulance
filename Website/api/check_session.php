<?php
/**
 * Check Session Endpoint
 * 
 * Verifies if user is logged in and returns session data
 */

// Start output buffering
ob_start();

// Set JSON header first
header('Content-Type: application/json; charset=utf-8');

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

define('API_ACCESS', true);
require_once 'config.php';

if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
    sendJSON([
        'success' => false,
        'logged_in' => false,
        'message' => 'Not authenticated'
    ], 401);
}

sendJSON([
    'success' => true,
    'logged_in' => true,
    'ambulance_id' => $_SESSION['ambulance_id'],
    'attendar_name' => $_SESSION['attendar_name'],
    'hardware_code' => $_SESSION['hardware_code'],
    'login_time' => $_SESSION['login_time']
]);
?>
