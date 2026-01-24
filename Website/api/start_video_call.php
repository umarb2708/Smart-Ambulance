<?php
/**
 * Start Video Call API
 * Creates a new video conference entry and returns the URL
 */

// Start output buffering
ob_start();

// Set JSON header first
header('Content-Type: application/json; charset=utf-8');

// Start session for authentication
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

define('API_ACCESS', true);
require_once 'config.php';

// Security: Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    sendJSON(['success' => false, 'message' => 'Unauthorized. Please login first.'], 401);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(['success' => false, 'message' => 'Only POST requests are allowed'], 405);
}

$conn = getDBConnection();

// Get POST data
$ambulanceID = trim($_POST['ambulanceID'] ?? '');
$url = trim($_POST['url'] ?? '');

// Get hospital ID from session
$hospitalID = $_SESSION['selected_hospital_id'] ?? '';

// Validation
if (empty($ambulanceID)) {
    sendJSON(['success' => false, 'message' => 'Ambulance ID is required'], 400);
}

if (empty($hospitalID)) {
    sendJSON(['success' => false, 'message' => 'Please select a destination hospital first'], 400);
}

if (empty($url)) {
    sendJSON(['success' => false, 'message' => 'Video call URL is required'], 400);
}

try {
    // Insert video conference entry with hospital_id as entity_id
    $stmt = $conn->prepare("INSERT INTO video_conference (init_from, entity_id, url, created_at) VALUES (?, ?, ?, NOW())");
    $initFrom = 'AMB';
    $stmt->bind_param("sss", $initFrom, $hospitalID, $url);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to create video conference entry: " . $stmt->error);
    }
    
    $conferenceID = $conn->insert_id;
    
    $stmt->close();
    $conn->close();
    
    // Success response
    sendJSON([
        'success' => true,
        'message' => 'Video conference started successfully',
        'conferenceID' => $conferenceID,
        'url' => $url
    ]);
    
} catch (Exception $e) {
    sendJSON([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ], 500);
}
?>
