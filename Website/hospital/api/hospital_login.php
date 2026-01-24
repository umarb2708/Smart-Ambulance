<?php
/**
 * Hospital Login API
 * Authenticates hospital credentials and creates session
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

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(['success' => false, 'message' => 'Only POST requests are allowed'], 405);
}

$conn = getDBConnection();

// Get POST data
$hospitalID = trim($_POST['hospitalID'] ?? '');
$password = trim($_POST['password'] ?? '');

// Validation
if (empty($hospitalID) || empty($password)) {
    sendJSON(['success' => false, 'message' => 'Hospital ID and password are required'], 400);
}

try {
    // Check credentials
    $stmt = $conn->prepare("SELECT id, hospital_id, name, doctor_name FROM hospitals WHERE hospital_id = ? AND password = ?");
    $stmt->bind_param("ss", $hospitalID, $password);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $hospital = $result->fetch_assoc();
        
        // Create session
        $_SESSION['hospital_logged_in'] = true;
        $_SESSION['hospital_id'] = $hospital['hospital_id'];
        $_SESSION['hospital_name'] = $hospital['name'];
        $_SESSION['doctor_name'] = $hospital['doctor_name'];
        $_SESSION['hospital_login_time'] = date('Y-m-d H:i:s');
        
        sendJSON([
            'success' => true,
            'message' => 'Login successful',
            'hospital' => [
                'hospital_id' => $hospital['hospital_id'],
                'name' => $hospital['name'],
                'doctor_name' => $hospital['doctor_name']
            ]
        ]);
    } else {
        sendJSON(['success' => false, 'message' => 'Invalid Hospital ID or password'], 401);
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    sendJSON(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
}
?>
