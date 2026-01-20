-- Smart Ambulance System Database Schema
-- Execute this in phpMyAdmin after creating the database

-- Create database (run this first)
CREATE DATABASE IF NOT EXISTS smart_ambulance;
USE smart_ambulance;

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(50) UNIQUE NOT NULL,
    patient_name VARCHAR(100) DEFAULT '',
    patient_age INT DEFAULT NULL,
    blood_group VARCHAR(10) DEFAULT '',
    patient_status ENUM('Normal', 'Medium', 'Critical') DEFAULT 'Normal',
    
    -- Vital signs (from sensors)
    temperature DECIMAL(4,1) DEFAULT 0.0,
    oxygen_level INT DEFAULT 0,
    heart_rate INT DEFAULT 0,
    
    -- Medical data
    blood_pressure VARCHAR(20) DEFAULT '',
    diabetics_level INT DEFAULT NULL,
    
    -- Ambulance data
    ambulance_id VARCHAR(50) DEFAULT '',
    speed DECIMAL(5,2) DEFAULT 0.0,
    longitude DECIMAL(10,7) DEFAULT 0.0,
    latitude DECIMAL(10,7) DEFAULT 0.0,
    next_traffic_int VARCHAR(50) DEFAULT '',
    past_traffic_int VARCHAR(50) DEFAULT '',
    hospital VARCHAR(100) DEFAULT '',
    
    -- Status
    done TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_done (done),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Activity log table for tracking changes
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(50),
    action VARCHAR(50),
    field_name VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_timestamp (timestamp),
    
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO patients (patient_id, patient_name, patient_age, blood_group, patient_status, 
                     temperature, oxygen_level, heart_rate, ambulance_id, hospital, done) 
VALUES 
('P001', 'John Doe', 45, 'O+', 'Normal', 37.2, 98, 75, 'AMB-001', 'Hospital 1', 0),
('P002', 'Jane Smith', 32, 'A+', 'Medium', 38.5, 94, 105, 'AMB-002', 'Hospital 2', 0),
('P003', 'Mike Johnson', 60, 'B+', 'Critical', 39.1, 88, 120, 'AMB-003', 'Hospital 3', 0)
ON DUPLICATE KEY UPDATE updated_at = NOW();
