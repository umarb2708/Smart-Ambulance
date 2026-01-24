<?php
/**
 * Get Hospitals Endpoint
 * 
 * Returns all hospitals from database
 */

// Start output buffering
ob_start();

// Set JSON header first
header('Content-Type: application/json; charset=utf-8');

define('API_ACCESS', true);
require_once 'config.php';

$conn = getDBConnection();

// Get all hospitals
$sql = "SELECT hospital_id, name, doctor_name FROM hospitals ORDER BY name ASC";
$result = $conn->query($sql);

if (!$result) {
    sendJSON([
        'success' => false,
        'error' => 'Database query failed',
        'details' => $conn->error
    ], 500);
}

$hospitals = [];

while ($row = $result->fetch_assoc()) {
    $hospitals[] = [
        'hospital_id' => $row['hospital_id'],
        'name' => $row['name'],
        'doctor_name' => $row['doctor_name']
    ];
}

sendJSON([
    'success' => true,
    'hospitals' => $hospitals,
    'count' => count($hospitals)
]);

$conn->close();
?>
