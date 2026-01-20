<?php
/**
 * ESP32/NodeMCU Data Upload Endpoint
 * 
 * Receives sensor data from ambulance ESP32 and updates database
 * URL: http://localhost/smart_ambulance/api/upload.php
 */

define('API_ACCESS', true);
require_once 'config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(['error' => 'Only POST requests are allowed'], 405);
}

$conn = getDBConnection();

// Get POST data from ESP32
$patientID = sanitize($_POST['patientID'] ?? '');
$temperature = floatval($_POST['temperature'] ?? 0);
$oxygenLevel = intval($_POST['oxygenLevel'] ?? 0);
$heartRate = intval($_POST['heartRate'] ?? 0);
$ambulanceID = sanitize($_POST['ambulanceID'] ?? '');
$speed = floatval($_POST['speed'] ?? 0);
$longitude = floatval($_POST['longitude'] ?? 0);
$latitude = floatval($_POST['latitude'] ?? 0);
$nextTrafficInt = sanitize($_POST['nextTrafficInt'] ?? '');
$pastTrafficInt = sanitize($_POST['pastTrafficInt'] ?? '');
$hospital = sanitize($_POST['hospital'] ?? '');

// Validate required fields
if (empty($patientID)) {
    sendJSON(['success' => false, 'message' => 'Patient ID is required'], 400);
}

// Check if patient exists
$stmt = $conn->prepare("SELECT id FROM patients WHERE patient_id = ?");
$stmt->bind_param("s", $patientID);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    // Update existing patient - only update sensor data fields
    $sql = "UPDATE patients SET 
            temperature = ?, 
            oxygen_level = ?, 
            heart_rate = ?, 
            ambulance_id = ?, 
            speed = ?, 
            longitude = ?, 
            latitude = ?, 
            next_traffic_int = ?, 
            past_traffic_int = ?, 
            hospital = ?,
            updated_at = NOW()
            WHERE patient_id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param(
        "diiisddssss", 
        $temperature, 
        $oxygenLevel, 
        $heartRate, 
        $ambulanceID, 
        $speed, 
        $longitude, 
        $latitude, 
        $nextTrafficInt, 
        $pastTrafficInt, 
        $hospital, 
        $patientID
    );
    
    if ($stmt->execute()) {
        // Log activity
        logActivity($conn, $patientID, 'sensor_update', 'vitals', '', 
                   "Temp: $temperature, O2: $oxygenLevel, HR: $heartRate");
        
        sendJSON([
            'success' => true, 
            'message' => 'Patient vitals updated successfully',
            'patientID' => $patientID,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        sendJSON([
            'success' => false, 
            'message' => 'Database update failed',
            'error' => $stmt->error
        ], 500);
    }
} else {
    // Insert new patient record
    $sql = "INSERT INTO patients (
                patient_id, temperature, oxygen_level, heart_rate, 
                ambulance_id, speed, longitude, latitude, 
                next_traffic_int, past_traffic_int, hospital, done
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param(
        "sdiisddssss", 
        $patientID, 
        $temperature, 
        $oxygenLevel, 
        $heartRate, 
        $ambulanceID, 
        $speed, 
        $longitude, 
        $latitude, 
        $nextTrafficInt, 
        $pastTrafficInt, 
        $hospital
    );
    
    if ($stmt->execute()) {
        // Log activity
        logActivity($conn, $patientID, 'patient_created', '', '', $patientID);
        
        sendJSON([
            'success' => true, 
            'message' => 'New patient record created successfully',
            'patientID' => $patientID,
            'timestamp' => date('Y-m-d H:i:s')
        ], 201);
    } else {
        sendJSON([
            'success' => false, 
            'message' => 'Failed to create patient record',
            'error' => $stmt->error
        ], 500);
    }
}

$stmt->close();
$conn->close();
?>
