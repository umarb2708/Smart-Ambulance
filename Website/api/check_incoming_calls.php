<?php
/**
 * Check Incoming Video Calls
 * Checks if any hospital is trying to call the ambulance
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

// Security: Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    sendJSON(['success' => false, 'message' => 'Unauthorized'], 401);
}

// Get the ambulance ID and selected hospital ID from session
$ambulanceID = $_SESSION['ambulance_id'] ?? '';
$hospitalID = $_SESSION['selected_hospital_id'] ?? '';

if (empty($ambulanceID)) {
    sendJSON(['success' => false, 'message' => 'Ambulance ID not found in session'], 400);
}

$conn = getDBConnection();

// Check for incoming calls from hospitals to this ambulance
// init_from = 'HOSP' and entity_id = ambulance_id and call_picked = 0
$stmt = $conn->prepare("SELECT id, entity_id, url, created_at FROM video_conference WHERE init_from = 'HOSP' AND entity_id = ? AND call_picked = 0 ORDER BY created_at DESC LIMIT 1");
$stmt->bind_param("s", $ambulanceID);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $call = $result->fetch_assoc();
    sendJSON([
        'success' => true,
        'hasIncomingCall' => true,
        'call' => [
            'id' => $call['id'],
            'hospitalID' => $call['entity_id'],
            'url' => $call['url'],
            'createdAt' => $call['created_at']
        ]
    ]);
} else {
    sendJSON([
        'success' => true,
        'hasIncomingCall' => false
    ]);
}

$stmt->close();
$conn->close();
?>
