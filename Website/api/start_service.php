<?php
/**
 * Start Emergency Service Endpoint
 * 
 * Creates new patient row with ambulance_id from session
 * Sets done = 0 to mark as active
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
require_once 'config.php';

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
    sendJSON(['success' => false, 'message' => 'Not authenticated. Please login first.'], 401);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(['success' => false, 'message' => 'Only POST requests are allowed'], 405);
}

$conn = getDBConnection();

$ambulanceID = $_SESSION['ambulance_id'];

// Check if ambulance already has an active patient (done=0)
$stmt = $conn->prepare("SELECT id FROM patients WHERE ambulance_id = ? AND done = 0");
$stmt->bind_param("s", $ambulanceID);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    sendJSON([
        'success' => false, 
        'message' => 'Emergency service already active. Please complete current service first.',
        'ambulance_id' => $ambulanceID
    ], 400);
}

$stmt->close();

// Create new patient record (always INSERT)
$sql = "INSERT INTO patients (
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
            done
        ) VALUES (?, '', '', NULL, '', 'Normal', 0.0, 0, 0, '', NULL, 0.0, 0.0, 0.0, '', '', '', 0)";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $ambulanceID);

if ($stmt->execute()) {
    $patientId = $stmt->insert_id;
    
    // Log activity
    logActivity($conn, $ambulanceID, '', 'service_started', '', '', 'Emergency service started');
    
    sendJSON([
        'success' => true,
        'message' => 'Emergency service started successfully',
        'ambulance_id' => $ambulanceID,
        'patient_db_id' => $patientId,
        'redirect' => 'dashboard.html',
        'timestamp' => date('Y-m-d H:i:s')
    ], 201);
} else {
    sendJSON([
        'success' => false,
        'message' => 'Failed to start emergency service',
        'error' => $stmt->error
    ], 500);
}

$stmt->close();
$conn->close();
?>
