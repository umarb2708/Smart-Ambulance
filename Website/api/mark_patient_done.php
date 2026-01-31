<?php
/**
 * Smart Ambulance System - Mark Patient as Reached Hospital
 * 
 * This API marks a patient as done (reached hospital) by updating done=1
 * 
 * Expected POST parameter: patient_row_id
 * Returns: JSON with success/failure status
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

try {
    // First, verify the patient record exists
    $check_sql = "SELECT id, patient_id, patient_name, ambulance_id, done FROM patients WHERE id = ?";
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
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Patient already marked as reached hospital',
            'patient_id' => $patient_data['patient_id'],
            'patient_name' => $patient_data['patient_name'],
            'already_done' => true
        ]);
        $check_stmt->close();
        exit;
    }
    
    $check_stmt->close();
    
    // Update the patient as done
    $update_sql = "UPDATE patients SET done = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    
    $stmt = $conn->prepare($update_sql);
    
    if (!$stmt) {
        throw new Exception("Update error: " . $conn->error);
    }
    
    $stmt->bind_param("i", $patient_row_id);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            // Log the completion
            error_log("Patient marked as done - Row ID: $patient_row_id, Patient: " . $patient_data['patient_id'] . ", Ambulance: " . $patient_data['ambulance_id']);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Patient successfully marked as reached hospital',
                'patient_row_id' => $patient_row_id,
                'patient_id' => $patient_data['patient_id'],
                'patient_name' => $patient_data['patient_name'],
                'ambulance_id' => $patient_data['ambulance_id'],
                'already_done' => false
            ]);
        } else {
            http_response_code(200);
            echo json_encode([
                'success' => false,
                'message' => 'No update performed',
                'patient_row_id' => $patient_row_id
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
