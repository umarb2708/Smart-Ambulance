<?php
/**
 * Update Patient Field Endpoint
 * 
 * Updates a single field for a patient (for dashboard editing)
 * URL: http://localhost/smart_ambulance/api/update_patient.php
 */

define('API_ACCESS', true);
require_once 'config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(['error' => 'Only POST requests are allowed'], 405);
}

$conn = getDBConnection();

// Get POST data
$patientID = sanitize($_POST['patientID'] ?? '');
$fieldName = sanitize($_POST['fieldName'] ?? '');
$newValue = $_POST['newValue'] ?? '';

// Validate required fields
if (empty($patientID)) {
    sendJSON(['success' => false, 'message' => 'Patient ID is required'], 400);
}

if (empty($fieldName)) {
    sendJSON(['success' => false, 'message' => 'Field name is required'], 400);
}

// Field mapping for security - only allow specific fields to be updated
$allowedFields = [
    'patientName' => 'patient_name',
    'patientAge' => 'patient_age',
    'bloodGroup' => 'blood_group',
    'patientStatus' => 'patient_status',
    'bloodPressure' => 'blood_pressure',
    'diabeticsLevel' => 'diabetics_level',
    'ambulanceID' => 'ambulance_id',
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
$stmt = $conn->prepare("SELECT $dbField FROM patients WHERE patient_id = ?");
$stmt->bind_param("s", $patientID);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    sendJSON(['success' => false, 'message' => 'Patient not found'], 404);
}

$row = $result->fetch_assoc();
$oldValue = $row[$dbField];
$stmt->close();

// Update patient field
$sql = "UPDATE patients SET $dbField = ?, updated_at = NOW() WHERE patient_id = ?";
$stmt = $conn->prepare($sql);

// Sanitize new value
$newValue = sanitize($newValue);

$stmt->bind_param("ss", $newValue, $patientID);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        // Log the change
        logActivity($conn, $patientID, 'field_update', $fieldName, $oldValue, $newValue);
        
        sendJSON([
            'success' => true,
            'message' => 'Field updated successfully',
            'field' => $fieldName,
            'oldValue' => $oldValue,
            'newValue' => $newValue,
            'patientID' => $patientID,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        sendJSON([
            'success' => true,
            'message' => 'No changes made (value was already the same)',
            'field' => $fieldName,
            'value' => $newValue,
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
