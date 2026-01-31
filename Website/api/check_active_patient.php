<?php
/**
 * Smart Ambulance System - Check Active Patient
 * 
 * This API checks if there's an active patient (done=0) for a given ambulance
 * and returns the patient row ID (primary key)
 * 
 * Expected GET parameter: ambulance_id
 * Returns: JSON with patient_row_id (0 if no active patient)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

// Check if ambulance_id is provided
if (!isset($_GET['ambulance_id']) || empty($_GET['ambulance_id'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Ambulance ID is required',
        'patient_row_id' => 0,
        'patient_id' => ''
    ]);
    exit;
}

$ambulance_id = $_GET['ambulance_id'];

try {
    // Query to find active patient (done=0) for this ambulance
    // Order by created_at to get the oldest active patient first
    $sql = "SELECT id, patient_id, patient_name, hospital 
            FROM patients 
            WHERE ambulance_id = ? AND done = 0 
            ORDER BY created_at ASC 
            LIMIT 1";
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Database error: " . $conn->error);
    }
    
    $stmt->bind_param("s", $ambulance_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        
        // Log the request (optional)
        error_log("Active patient found - Ambulance: $ambulance_id, Row ID: " . $row['id'] . ", Patient: " . $row['patient_id']);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'patient_row_id' => (int)$row['id'],
            'patient_id' => $row['patient_id'],
            'patient_name' => $row['patient_name'],
            'hospital' => $row['hospital'],
            'message' => 'Active patient found'
        ]);
    } else {
        // No active patient found
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'patient_row_id' => 0,
            'patient_id' => '',
            'patient_name' => '',
            'hospital' => '',
            'message' => 'No active patient found for this ambulance'
        ]);
    }
    
    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage(),
        'patient_row_id' => 0,
        'patient_id' => ''
    ]);
}

$conn->close();
?>
