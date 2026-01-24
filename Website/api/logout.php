<?php
/**
 * Logout Endpoint
 * 
 * Destroys session and logs out user
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

$ambulanceID = $_SESSION['ambulance_id'] ?? 'Unknown';

// Destroy session
session_destroy();

sendJSON([
    'success' => true,
    'message' => 'Logged out successfully',
    'ambulance_id' => $ambulanceID,
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
