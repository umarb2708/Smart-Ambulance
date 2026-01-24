<?php
/**
 * Check Incoming Video Calls for Hospital
 * Checks if any ambulance is trying to call the hospital
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

// Get the hospital ID from session
$hospitalID = $_SESSION['hospital_id'] ?? '';

if (empty($hospitalID)) {
    sendJSON(['success' => false, 'message' => 'Hospital ID not found in session'], 400);
}

$conn = getDBConnection();

// Check for incoming calls from ambulances to this hospital
// init_from = 'AMB' and entity_id = hospital_id and call_picked = 0
$stmt = $conn->prepare("SELECT id, entity_id, url, created_at FROM video_conference WHERE init_from = 'AMB' AND entity_id = ? AND call_picked = 0 ORDER BY created_at DESC LIMIT 1");
$stmt->bind_param("s", $hospitalID);
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
