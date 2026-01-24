<?php
/**
 * Get All Active Patients Endpoint
 * 
 * Returns all patients where done != 1 with calculated vital statuses
 * URL: http://localhost/smart_ambulance/api/get_patients.php
 */

// Start output buffering
ob_start();

// Set JSON header first
header('Content-Type: application/json; charset=utf-8');

define('API_ACCESS', true);
require_once 'config.php';

$conn = getDBConnection();

// Get all active patients (done = 0)
$sql = "SELECT 
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
    speed,
    longitude,
    latitude,
    next_traffic_int,
    past_traffic_int,
    hospital,
    done,
    updated_at
FROM patients 
WHERE done = 0 
ORDER BY updated_at DESC";

$result = $conn->query($sql);

if (!$result) {
    sendJSON([
        'error' => 'Database query failed',
        'details' => $conn->error
    ], 500);
}

$patients = [];

while ($row = $result->fetch_assoc()) {
    // Calculate vital status based on thresholds
    $temp = floatval($row['temperature']);
    $hr = intval($row['heart_rate']);
    $o2 = intval($row['oxygen_level']);
    
    // Temperature status
    $tempStatus = 'Normal';
    if ($temp > 38) {
        $tempStatus = 'High';
    } else if ($temp < 36 && $temp > 0) {
        $tempStatus = 'Low';
    }
    
    // Heart rate status
    $heartRateStatus = 'Normal';
    if ($hr > 100) {
        $heartRateStatus = 'High';
    } else if ($hr < 60 && $hr > 0) {
        $heartRateStatus = 'Low';
    }
    
    // Oxygen level status
    $oxygenStatus = 'Normal';
    if ($o2 < 95 && $o2 > 0) {
        $oxygenStatus = 'Low';
    }
    
    // Build patient object with all fields
    $patients[$row['ambulance_id']] = [
        'ambulanceID' => $row['ambulance_id'],
        'patientID' => $row['patient_id'],
        'patientName' => $row['patient_name'] ?: '',
        'patientAge' => $row['patient_age'] ?: '',
        'bloodGroup' => $row['blood_group'] ?: '',
        'patientStatus' => $row['patient_status'] ?: '',
        'temperature' => $temp,
        'oxygenLevel' => $o2,
        'heartRate' => $hr,
        'bloodPressure' => $row['blood_pressure'] ?: '',
        'diabeticsLevel' => $row['diabetics_level'] ?: '',
        'speed' => $row['speed'] ?: '',
        'longitude' => $row['longitude'] ?: '',
        'latitude' => $row['latitude'] ?: '',
        'nextTrafficInt' => $row['next_traffic_int'] ?: '',
        'pastTrafficInt' => $row['past_traffic_int'] ?: '',
        'hospital' => $row['hospital'] ?: '',
        'done' => intval($row['done']),
        'date' => $row['updated_at'],
        'tempStatus' => $tempStatus,
        'heartRateStatus' => $heartRateStatus,
        'oxygenStatus' => $oxygenStatus
    ];
}

sendJSON([
    'patients' => $patients,
    'count' => count($patients),
    'timestamp' => date('Y-m-d H:i:s')
]);

$conn->close();
?>
