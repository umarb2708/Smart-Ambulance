<?php
/**
 * Update Call Picked Status for Hospital
 * Updates call_picked to 1 when hospital joins the call
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
require_once '../../api/config.php';

// Security: Check if hospital is logged in
if (!isset($_SESSION['hospital_logged_in']) || $_SESSION['hospital_logged_in'] !== true) {
    sendJSON(['success' => false, 'message' => 'Unauthorized'], 401);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(['success' => false, 'message' => 'Only POST requests are allowed'], 405);
}

$conn = getDBConnection();

// Get POST data
$callID = intval($_POST['callID'] ?? 0);

// Validation
if (empty($callID)) {
    sendJSON(['success' => false, 'message' => 'Call ID is required'], 400);
}

try {
    // Update call_picked to 1
    $stmt = $conn->prepare("UPDATE video_conference SET call_picked = 1 WHERE id = ?");
    $stmt->bind_param("i", $callID);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to update call status: " . $stmt->error);
    }
    
    $stmt->close();
    $conn->close();
    
    sendJSON([
        'success' => true,
        'message' => 'Call status updated successfully'
    ]);
    
} catch (Exception $e) {
    sendJSON([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ], 500);
}
?>
