-- Sample SQL to Add Ambulances with MAC Addresses
-- Execute this in phpMyAdmin to add ambulance records

-- Use the smart_ambulance database
USE smart_ambulance;

-- Sample Ambulance Records
-- Replace the hardware_code values with your actual ESP32 MAC addresses

-- Ambulance 1
INSERT INTO ambulance (ambulance_id, password, attendar_name, hardware_code)
VALUES ('AMB-001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Doe', '24:0A:C4:12:34:56')
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    attendar_name = VALUES(attendar_name),
    hardware_code = VALUES(hardware_code);

-- Ambulance 2
INSERT INTO ambulance (ambulance_id, password, attendar_name, hardware_code)
VALUES ('AMB-002', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Smith', 'AA:BB:CC:DD:EE:FF')
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    attendar_name = VALUES(attendar_name),
    hardware_code = VALUES(hardware_code);

-- Ambulance 3
INSERT INTO ambulance (ambulance_id, password, attendar_name, hardware_code)
VALUES ('AMB-003', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike Johnson', '11:22:33:44:55:66')
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    attendar_name = VALUES(attendar_name),
    hardware_code = VALUES(hardware_code);

-- Note: The password hash above is for 'password' - Change this for production!
-- To generate a new password hash in PHP:
-- echo password_hash('your_password', PASSWORD_DEFAULT);

-- ============================================================
-- How to find your ESP32 MAC Address:
-- ============================================================
-- 1. Upload this simple sketch to your ESP32:
--    #include <WiFi.h>
--    void setup() {
--      Serial.begin(115200);
--      Serial.println(WiFi.macAddress());
--    }
--    void loop() {}
--
-- 2. Open Serial Monitor at 115200 baud
-- 3. Copy the MAC address displayed
-- 4. Use it in the hardware_code field above
-- ============================================================

-- Query to view all ambulances and their MAC addresses
SELECT 
    id,
    ambulance_id,
    attendar_name,
    hardware_code,
    created_at,
    updated_at
FROM ambulance
ORDER BY ambulance_id;

-- Query to check if a specific MAC exists
-- SELECT * FROM ambulance WHERE hardware_code = '24:0A:C4:12:34:56';

-- Update hardware_code for existing ambulance
-- UPDATE ambulance 
-- SET hardware_code = 'YOUR:MAC:ADDRESS:HERE'
-- WHERE ambulance_id = 'AMB-001';
