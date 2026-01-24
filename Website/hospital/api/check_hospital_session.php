<?php
/**
 * Check Hospital Session API
 * Verifies if hospital is logged in
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

// Check if hospital is logged in
if (isset($_SESSION['hospital_logged_in']) && $_SESSION['hospital_logged_in'] === true) {
    echo json_encode([
        'success' => true,
        'loggedIn' => true,
        'hospital' => [
            'hospital_id' => $_SESSION['hospital_id'] ?? '',
            'name' => $_SESSION['hospital_name'] ?? '',
            'doctor_name' => $_SESSION['doctor_name'] ?? ''
        ]
    ]);
} else {
    echo json_encode([
        'success' => true,
        'loggedIn' => false
    ]);
}

// Flush output
ob_end_flush();
?>
