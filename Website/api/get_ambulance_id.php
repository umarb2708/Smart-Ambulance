<?php
/**
 * Smart Ambulance System - Get Ambulance ID by MAC Address
 * 
 * This API endpoint receives a MAC address (hardware_code) from ESP32
 * and returns the corresponding ambulance_id from the database
 * 
 * Expected GET parameter: mac (MAC address of the ESP32)
 * Returns: JSON with ambulance_id or error message
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

// Check if MAC address is provided
if (!isset($_GET['mac']) || empty($_GET['mac'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'MAC address is required',
        'ambulance_id' => ''
    ]);
    exit;
}

$mac_address = $_GET['mac'];

// Clean and format MAC address (remove any special characters including underscores)
$mac_address = strtoupper(str_replace([':', '-', '.', ' ', '_'], '', $mac_address));

try {
    // Prepare SQL query to find ambulance by hardware_code
    // Remove all separators (colons, hyphens, dots, underscores) for comparison
    $sql = "SELECT ambulance_id, attendar_name FROM ambulance WHERE REPLACE(REPLACE(REPLACE(REPLACE(UPPER(hardware_code), ':', ''), '-', ''), '.', ''), '_', '') = ?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Database error: " . $conn->error);
    }
    
    $stmt->bind_param("s", $mac_address);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        
        // Log the request (optional)
        error_log("Ambulance ID requested - MAC: $mac_address, ID: " . $row['ambulance_id']);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'ambulance_id' => $row['ambulance_id'],
            'attendar_name' => $row['attendar_name'],
            'message' => 'Ambulance ID found successfully'
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'No ambulance found with this MAC address',
            'ambulance_id' => '',
            'hint' => 'Please register this device in the ambulance table with hardware_code: ' . $mac_address
        ]);
    }
    
    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage(),
        'ambulance_id' => ''
    ]);
}

$conn->close();
?>
