<?php
/**
 * Get Hospital Patient History
 * Returns all patients (including completed) for the logged-in hospital
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
require_once '../../api/config.php';

// Security: Check if hospital is logged in
if (!isset($_SESSION['hospital_logged_in']) || $_SESSION['hospital_logged_in'] !== true) {
    sendJSON(['success' => false, 'message' => 'Unauthorized. Please login first.'], 401);
}

$hospitalName = $_SESSION['hospital_name'] ?? '';

if (empty($hospitalName)) {
    sendJSON(['success' => false, 'message' => 'Hospital name not found in session'], 400);
}

$conn = getDBConnection();

// Get all patients for this hospital (including done=1)
$sql = "SELECT 
    id,
    ambulance_id,
    patient_id,
    patient_name,
    patient_age,
    blood_group,
    patient_status,
    temperature,
    oxygen_level,
    heart_rate,
    blood_pressure,
    diabetics_level,
    hospital,
    done,
    created_at,
    updated_at
FROM patients 
WHERE hospital = ?
ORDER BY updated_at DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $hospitalName);
$stmt->execute();
$result = $stmt->get_result();

$patients = [];

while ($row = $result->fetch_assoc()) {
    $patients[] = [
        'id' => $row['id'],
        'ambulance_id' => $row['ambulance_id'],
        'patient_id' => $row['patient_id'] ?: '',
        'patient_name' => $row['patient_name'] ?: '',
        'patient_age' => $row['patient_age'] ?: '',
        'blood_group' => $row['blood_group'] ?: '',
        'patient_status' => $row['patient_status'] ?: 'Normal',
        'temperature' => floatval($row['temperature']),
        'oxygen_level' => intval($row['oxygen_level']),
        'heart_rate' => intval($row['heart_rate']),
        'blood_pressure' => $row['blood_pressure'] ?: '',
        'diabetics_level' => $row['diabetics_level'] ?: '',
        'hospital' => $row['hospital'],
        'done' => intval($row['done']),
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at']
    ];
}

sendJSON([
    'success' => true,
    'patients' => $patients,
    'count' => count($patients),
    'hospital' => $hospitalName
]);

$stmt->close();
$conn->close();
?>
