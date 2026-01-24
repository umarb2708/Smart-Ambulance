<?php
/**
 * Get Hospital Patients API
 * Returns patient data for patients assigned to this hospital where done=0
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
require_once '../../api/config.php';

// Check if hospital is logged in
if (!isset($_SESSION['hospital_logged_in']) || $_SESSION['hospital_logged_in'] !== true) {
    sendJSON(['success' => false, 'message' => 'Unauthorized'], 401);
}

$hospitalName = $_SESSION['hospital_name'] ?? '';

if (empty($hospitalName)) {
    sendJSON(['success' => false, 'message' => 'Hospital name not found in session'], 400);
}

$conn = getDBConnection();

try {
    // Get all patients where hospital matches and done = 0
    $stmt = $conn->prepare("
        SELECT 
            id, 
            ambulance_id, 
            patient_id, 
            patient_name, 
            patient_age, 
            blood_group, 
            heart_rate, 
            blood_pressure, 
            oxygen_level, 
            temperature, 
            patient_status, 
            diabetics_level, 
            hospital, 
            latitude, 
            longitude, 
            speed,
            done
        FROM patients 
        WHERE hospital = ? AND done = 0
        ORDER BY id DESC
    ");
    
    $stmt->bind_param("s", $hospitalName);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $patients = [];
    while ($row = $result->fetch_assoc()) {
        $patients[] = [
            'id' => $row['id'],
            'ambulanceID' => $row['ambulance_id'],
            'patientID' => $row['patient_id'],
            'patientName' => $row['patient_name'],
            'patientAge' => $row['patient_age'],
            'bloodGroup' => $row['blood_group'],
            'heartRate' => $row['heart_rate'],
            'bloodPressure' => $row['blood_pressure'],
            'oxygenLevel' => $row['oxygen_level'],
            'temperature' => $row['temperature'],
            'patientStatus' => $row['patient_status'],
            'diabeticsLevel' => $row['diabetics_level'],
            'hospital' => $row['hospital'],
            'latitude' => $row['latitude'],
            'longitude' => $row['longitude'],
            'speed' => $row['speed'],
            'done' => $row['done']
        ];
    }
    
    sendJSON([
        'success' => true,
        'patients' => $patients,
        'count' => count($patients)
    ]);
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    sendJSON(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
}
?>
