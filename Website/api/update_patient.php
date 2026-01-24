<?php
/**
 * Update Patient Field Endpoint
 * 
 * Updates a single field for a patient (for dashboard editing)
 * URL: http://localhost/smart_ambulance/api/update_patient.php
 */

// Start output buffering
ob_start();

// Set JSON header first
header('Content-Type: application/json; charset=utf-8');

// Start session to update hospital_id if needed
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

define('API_ACCESS', true);
require_once 'config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(['error' => 'Only POST requests are allowed'], 405);
}

$conn = getDBConnection();

// Get POST data
$ambulanceID = sanitize($_POST['ambulanceID'] ?? '');
$patientID = sanitize($_POST['patientID'] ?? '');
$fieldName = sanitize($_POST['fieldName'] ?? '');
$newValue = $_POST['newValue'] ?? '';
$hospitalID = sanitize($_POST['hospitalID'] ?? ''); // Hospital ID when selecting hospital

// Validate required fields
if (empty($ambulanceID)) {
    sendJSON(['success' => false, 'message' => 'Ambulance ID is required'], 400);
}

if (empty($fieldName)) {
    sendJSON(['success' => false, 'message' => 'Field name is required'], 400);
}

// Field mapping for security - only allow specific fields to be updated
$allowedFields = [
    'patientID' => 'patient_id',
    'patientName' => 'patient_name',
    'patientAge' => 'patient_age',
    'bloodGroup' => 'blood_group',
    'patientStatus' => 'patient_status',
    'bloodPressure' => 'blood_pressure',
    'diabeticsLevel' => 'diabetics_level',
    'hospital' => 'hospital'
];

// Check if field is allowed
if (!isset($allowedFields[$fieldName])) {
    sendJSON([
        'success' => false, 
        'message' => 'Invalid field name',
        'allowedFields' => array_keys($allowedFields)
    ], 400);
}

$dbField = $allowedFields[$fieldName];

// Get old value for logging
$stmt = $conn->prepare("SELECT $dbField FROM patients WHERE ambulance_id = ? AND done = 0");
$stmt->bind_param("s", $ambulanceID);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    sendJSON(['success' => false, 'message' => 'No active patient found for this ambulance'], 404);
}

$row = $result->fetch_assoc();
$oldValue = $row[$dbField];
$stmt->close();

// Update patient field (only active patient)
$sql = "UPDATE patients SET $dbField = ?, updated_at = NOW() WHERE ambulance_id = ? AND done = 0";
$stmt = $conn->prepare($sql);

// Sanitize new value
$newValue = sanitize($newValue);

$stmt->bind_param("ss", $newValue, $ambulanceID);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        // If hospital field was updated, store hospital_id in session
        if ($fieldName === 'hospital' && !empty($hospitalID)) {
            $_SESSION['selected_hospital_id'] = $hospitalID;
            $_SESSION['selected_hospital_name'] = $newValue;
        }
        
        // Log the change
        logActivity($conn, $ambulanceID, $patientID, 'field_update', $fieldName, $oldValue, $newValue);
        
        $response = [
            'success' => true,
            'message' => 'Field updated successfully',
            'field' => $fieldName,
            'oldValue' => $oldValue,
            'newValue' => $newValue,
            'ambulanceID' => $ambulanceID,
            'patientID' => $patientID,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        // Include hospital_id in response if it was updated
        if ($fieldName === 'hospital' && !empty($hospitalID)) {
            $response['hospital_id'] = $hospitalID;
        }
        
        sendJSON($response);
    } else {
        sendJSON([
            'success' => true,
            'message' => 'No changes made (value was already the same)',
            'field' => $fieldName,
            'value' => $newValue,
            'ambulanceID' => $ambulanceID,
            'patientID' => $patientID
        ]);
    }
} else {
    sendJSON([
        'success' => false, 
        'message' => 'Database update failed',
        'error' => $stmt->error
    ], 500);
}

$stmt->close();
$conn->close();
?>
