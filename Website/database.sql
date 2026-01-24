-- Smart Ambulance System Database Schema
-- Execute this in phpMyAdmin after creating the database

-- Create database (run this first)
CREATE DATABASE IF NOT EXISTS smart_ambulance;
USE smart_ambulance;

-- Ambulance table (must be created first for foreign key reference)
CREATE TABLE IF NOT EXISTS ambulance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ambulance_id VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    attendar_name VARCHAR(100) DEFAULT '',
    hardware_code VARCHAR(50) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_ambulance_id (ambulance_id),
    INDEX idx_hardware_code (hardware_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patients table (id is PRIMARY KEY, allows multiple records per ambulance)
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ambulance_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) DEFAULT '',
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
    
    -- Location and speed data
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
    
    INDEX idx_ambulance_id (ambulance_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_done (done),
    INDEX idx_ambulance_done (ambulance_id, done),
    INDEX idx_updated_at (updated_at),
    
    FOREIGN KEY (ambulance_id) REFERENCES ambulance(ambulance_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Activity log table for tracking changes
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ambulance_id VARCHAR(50),
    patient_id VARCHAR(50),
    action VARCHAR(50),
    field_name VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ambulance_id (ambulance_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_timestamp (timestamp),
    
    FOREIGN KEY (ambulance_id) REFERENCES ambulance(ambulance_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    doctor_name VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_hospital_id (hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Video Conference table
CREATE TABLE IF NOT EXISTS video_conference (
    id INT AUTO_INCREMENT PRIMARY KEY,
    init_from ENUM('AMB', 'HOSP') NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_entity_id (entity_id),
    INDEX idx_init_from (init_from),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample ambulance data first
INSERT INTO ambulance (id, ambulance_id, password, attendar_name, hardware_code) 
VALUES 
(1, 'AMB-001', 'Amb@123', 'XYZ', '50_84_92_BD_47_19'),
(2, 'AMB-002', 'Amb@456', 'ABC', '00_00_00_00_00_00'),
(3, 'AMB-003', 'Amb@789', 'PQR', '11_22_33_44_55_66')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Insert sample hospital data
INSERT INTO hospitals (id, hospital_id, password, name, doctor_name) 
VALUES 
(1, 'HOSP-001', 'Hosp@123', 'Hospital 1', 'CDEF');

-- Insert sample patient data (multiple records allowed per ambulance)
INSERT INTO patients (id, ambulance_id, patient_id, patient_name, patient_age, blood_group, patient_status, 
                     temperature, oxygen_level, heart_rate, hospital, done) 
VALUES 
(1, 'AMB-001', 'P001', 'John Doe', 45, 'O+', 'Normal', 37.2, 98, 75, 'Hospital 1', 1),
(2, 'AMB-002', 'P002', 'Jane Smith', 32, 'A+', 'Medium', 38.5, 94, 105, 'Hospital 2', 0),
(3, 'AMB-003', 'P003', 'Mike Johnson', 60, 'B+', 'Critical', 39.1, 88, 120, 'Hospital 3', 0);

-- Insert sample video conference data
INSERT INTO video_conference (id, init_from, entity_id, url) 
VALUES 
(1, 'AMB', 'AMB-001', 'https://meet.google.com/jor-dzjy-seo');
