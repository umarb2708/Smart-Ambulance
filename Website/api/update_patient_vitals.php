<?php
/**
 * Smart Ambulance System - Update Patient Vitals
 * 
 * This API updates sensor data for an existing patient record by row ID
 * Does NOT create new patients or change patient_id
 * 
 * Expected POST parameters:
 * - patient_row_id: Primary key ID of the patient record
 * - temperature, oxygenLevel, heartRate, speed, longitude, latitude
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

// Check if patient_row_id is provided
if (!isset($_POST['patient_row_id']) || empty($_POST['patient_row_id']) || $_POST['patient_row_id'] <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Valid patient_row_id is required'
    ]);
    exit;
}

$patient_row_id = (int)$_POST['patient_row_id'];

// Get sensor data (with defaults)
$temperature = isset($_POST['temperature']) ? floatval($_POST['temperature']) : 0.0;
$oxygenLevel = isset($_POST['oxygenLevel']) ? intval($_POST['oxygenLevel']) : 0;
$heartRate = isset($_POST['heartRate']) ? intval($_POST['heartRate']) : 0;
$speed = isset($_POST['speed']) ? floatval($_POST['speed']) : 0.0;
$longitude = isset($_POST['longitude']) ? floatval($_POST['longitude']) : 0.0;
$latitude = isset($_POST['latitude']) ? floatval($_POST['latitude']) : 0.0;

// Optional fields - only update if provided
$blood_pressure = isset($_POST['blood_pressure']) ? $_POST['blood_pressure'] : null;
$patient_status = isset($_POST['patient_status']) ? $_POST['patient_status'] : 'Normal';

try {
    // First, verify the patient record exists and is not done
    $check_sql = "SELECT id, patient_id, done FROM patients WHERE id = ?";
    $check_stmt = $conn->prepare($check_sql);
    
    if (!$check_stmt) {
        throw new Exception("Database error: " . $conn->error);
    }
    
    $check_stmt->bind_param("i", $patient_row_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Patient record not found with ID: ' . $patient_row_id
        ]);
        $check_stmt->close();
        exit;
    }
    
    $patient_data = $check_result->fetch_assoc();
    
    if ($patient_data['done'] == 1) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Patient record is marked as done. Cannot update.',
            'patient_id' => $patient_data['patient_id']
        ]);
        $check_stmt->close();
        exit;
    }
    
    $check_stmt->close();
    
    // Build dynamic UPDATE query - only update blood_pressure if explicitly provided
    if ($blood_pressure !== null) {
        $update_sql = "UPDATE patients SET 
                       temperature = ?,
                       oxygen_level = ?,
                       heart_rate = ?,
                       speed = ?,
                       longitude = ?,
                       latitude = ?,
                       blood_pressure = ?,
                       patient_status = ?,
                       updated_at = CURRENT_TIMESTAMP
                       WHERE id = ? AND done = 0";
        
        $stmt = $conn->prepare($update_sql);
        
        if (!$stmt) {
            throw new Exception("Update error: " . $conn->error);
        }
        
        $stmt->bind_param("ddiiddssi", 
            $temperature, 
            $oxygenLevel, 
            $heartRate, 
            $speed, 
            $longitude, 
            $latitude,
            $blood_pressure,
            $patient_status,
            $patient_row_id
        );
    } else {
        // Don't update blood_pressure if not provided
        $update_sql = "UPDATE patients SET 
                       temperature = ?,
                       oxygen_level = ?,
                       heart_rate = ?,
                       speed = ?,
                       longitude = ?,
                       latitude = ?,
                       patient_status = ?,
                       updated_at = CURRENT_TIMESTAMP
                       WHERE id = ? AND done = 0";
        
        $stmt = $conn->prepare($update_sql);
        
        if (!$stmt) {
            throw new Exception("Update error: " . $conn->error);
        }
        
        $stmt->bind_param("ddiiddsi", 
            $temperature, 
            $oxygenLevel, 
            $heartRate, 
            $speed, 
            $longitude, 
            $latitude,
            $patient_status,
            $patient_row_id
        );
    }
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            // Log the update
            error_log("Patient vitals updated - Row ID: $patient_row_id, Temp: $temperature, HR: $heartRate, SpO2: $oxygenLevel");
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Patient vitals updated successfully',
                'patient_row_id' => $patient_row_id,
                'patient_id' => $patient_data['patient_id'],
                'updated' => true
            ]);
        } else {
            // No rows affected - patient might have been marked as done
            http_response_code(200);
            echo json_encode([
                'success' => false,
                'message' => 'No update performed. Patient may be marked as done.',
                'patient_row_id' => $patient_row_id,
                'updated' => false
            ]);
        }
    } else {
        throw new Exception("Execute error: " . $stmt->error);
    }
    
    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
