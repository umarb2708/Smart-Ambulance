<?php
/**
 * Ambulance Attendant Login Endpoint
 * 
 * Authenticates ambulance using ambulance_id and password
 * Creates session that lasts until browser closes
 */

// Start output buffering to prevent header errors
ob_start();

// Set JSON header first
header('Content-Type: application/json; charset=utf-8');

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

define('API_ACCESS', true);
require_once 'config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(['success' => false, 'message' => 'Only POST requests are allowed'], 405);
}

$conn = getDBConnection();

// Get POST data
$ambulanceID = sanitize($_POST['ambulance_id'] ?? '');
$password = $_POST['password'] ?? ''; // Don't sanitize password

// Validate required fields
if (empty($ambulanceID)) {
    sendJSON(['success' => false, 'message' => 'Ambulance ID is required'], 400);
}

if (empty($password)) {
    sendJSON(['success' => false, 'message' => 'Password is required'], 400);
}

// Check credentials
$stmt = $conn->prepare("SELECT id, ambulance_id, password, attendar_name, hardware_code FROM ambulance WHERE ambulance_id = ?");
$stmt->bind_param("s", $ambulanceID);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    sendJSON(['success' => false, 'message' => 'Invalid Ambulance ID'], 401);
}

$ambulance = $result->fetch_assoc();

// Verify password (plain text comparison - in production, use password_hash/verify)
if ($password !== $ambulance['password']) {
    sendJSON(['success' => false, 'message' => 'Invalid password'], 401);
}

// Create session
$_SESSION['logged_in'] = true;
$_SESSION['ambulance_id'] = $ambulance['ambulance_id'];
$_SESSION['attendar_name'] = $ambulance['attendar_name'];
$_SESSION['hardware_code'] = $ambulance['hardware_code'];
$_SESSION['login_time'] = time();

// Check if there's an active patient (done=0) for this ambulance
$check_patient_sql = "SELECT id, patient_id FROM patients WHERE ambulance_id = ? AND done = 0 LIMIT 1";
$patient_stmt = $conn->prepare($check_patient_sql);
$patient_stmt->bind_param("s", $ambulance['ambulance_id']);
$patient_stmt->execute();
$patient_result = $patient_stmt->get_result();
$has_active_patient = $patient_result->num_rows > 0;
$patient_stmt->close();

// Log login activity
logActivity($conn, $ambulance['ambulance_id'], '', 'login', 'attendar_name', '', $ambulance['attendar_name']);

sendJSON([
    'success' => true,
    'message' => 'Login successful',
    'ambulance_id' => $ambulance['ambulance_id'],
    'attendar_name' => $ambulance['attendar_name'],
    'has_active_patient' => $has_active_patient,
    'timestamp' => date('Y-m-d H:i:s')
]);

$stmt->close();
$conn->close();
?>
