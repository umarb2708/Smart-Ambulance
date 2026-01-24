<?php
/**
 * Smart Ambulance System - Database Configuration
 * 
 * This file contains database connection settings and helper functions
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    define('API_ACCESS', true);
}

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');  // Default XAMPP password is empty
define('DB_NAME', 'smart_ambulance');

// Timezone
date_default_timezone_set('Asia/Kolkata');

/**
 * Get database connection
 * @return mysqli Database connection object
 */
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        http_response_code(500);
        die(json_encode([
            'error' => 'Database connection failed',
            'details' => $conn->connect_error
        ]));
    }
    
    $conn->set_charset('utf8mb4');
    return $conn;
}

/**
 * Send JSON response
 * @param array $data Data to send
 * @param int $httpCode HTTP status code
 */
function sendJSON($data, $httpCode = 200) {
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');
    
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Sanitize input
 * @param string $data Input data
 * @return string Sanitized data
 */
function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * Log activity
 * @param mysqli $conn Database connection
 * @param string $ambulanceID Ambulance ID
 * @param string $patientID Patient ID
 * @param string $action Action performed
 * @param string $fieldName Field name
 * @param mixed $oldValue Old value
 * @param mixed $newValue New value
 */
function logActivity($conn, $ambulanceID, $patientID, $action, $fieldName = '', $oldValue = '', $newValue = '') {
    $stmt = $conn->prepare("INSERT INTO activity_log (ambulance_id, patient_id, action, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssss", $ambulanceID, $patientID, $action, $fieldName, $oldValue, $newValue);
    $stmt->execute();
    $stmt->close();
}

// Note: Headers are now set in individual API files to avoid conflicts with session_start()
// Keeping this code commented for reference:
/*
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
*/
?>
