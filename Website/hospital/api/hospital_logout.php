<?php
/**
 * Hospital Logout API
 * Destroys hospital session
 */

// Start output buffering
ob_start();

// Set JSON header
header('Content-Type: application/json; charset=utf-8');

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

define('API_ACCESS', true);

// Destroy session
session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully'
]);

// Flush output
ob_end_flush();
?>
