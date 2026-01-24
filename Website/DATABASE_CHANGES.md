# 🔄 Database Schema Changes - Smart Ambulance System

## Summary of Changes

This document outlines the database schema changes made to improve hardware-software synchronization using `ambulance_id` as the primary identifier.

---

## 📊 Changes Made

### 1️⃣ New Table: `ambulance`

**Purpose**: Store ambulance authentication and hardware tracking information.

```sql
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
);
```

**Columns**:
- `id` - Auto-increment primary key (internal use)
- `ambulance_id` - Unique ambulance identifier (e.g., "AMB-001")
- `password` - Authentication password for ambulance login
- `attendar_name` - Name of the attendant inside the ambulance
- `hardware_code` - MAC address of ESP32 in format "50_84_92_BD_47_19" (underscores instead of colons)
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp

**Sample Data**:
```sql
INSERT INTO ambulance (id, ambulance_id, password, attendar_name, hardware_code) 
VALUES (1, 'AMB-001', 'Amb@123', 'XYZ', '50_84_92_BD_47_19');
```

---

### 2️⃣ Modified Table: `patients`

**Key Change**: `ambulance_id` is now the **PRIMARY KEY** instead of `patient_id`.

**Rationale**: 
- One ambulance can only carry one patient at a time
- Eliminates the need for separate patient lookup
- Simplifies ESP32 firmware (only needs to know ambulance_id)
- Ensures hardware-software synchronization

**Before**:
```sql
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- Old primary key
    patient_id VARCHAR(50) UNIQUE NOT NULL,     -- Old unique identifier
    ambulance_id VARCHAR(50) DEFAULT '',        -- Just a regular field
    ...
);
```

**After**:
```sql
CREATE TABLE patients (
    ambulance_id VARCHAR(50) PRIMARY KEY,       -- NEW primary key
    patient_id VARCHAR(50) DEFAULT '',          -- Now optional field
    ...
    FOREIGN KEY (ambulance_id) REFERENCES ambulance(ambulance_id) 
        ON DELETE CASCADE ON UPDATE CASCADE
);
```

**Key Points**:
- ✅ `ambulance_id` is now PRIMARY KEY
- ✅ Foreign key relationship to `ambulance` table
- ✅ `patient_id` is now an optional field (can be entered manually)
- ✅ CASCADE delete/update ensures data integrity
- ❌ Removed auto-increment `id` column

---

### 3️⃣ Modified Table: `activity_log`

**Change**: Added `ambulance_id` column and foreign key reference.

```sql
CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ambulance_id VARCHAR(50),                    -- NEW column
    patient_id VARCHAR(50),
    action VARCHAR(50),
    field_name VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ambulance_id (ambulance_id),       -- NEW index
    INDEX idx_patient_id (patient_id),
    INDEX idx_timestamp (timestamp),
    
    FOREIGN KEY (ambulance_id) REFERENCES patients(ambulance_id) 
        ON DELETE CASCADE                         -- NEW foreign key
);
```

**Purpose**: Track which ambulance performed each action.

---

## 🔧 Code Changes Required

### PHP API Files Updated:

#### 1. `api/upload.php`
- ✅ Changed validation from `patientID` to `ambulanceID` required field
- ✅ Query checks `WHERE ambulance_id = ?` instead of `WHERE patient_id = ?`
- ✅ INSERT/UPDATE uses `ambulance_id` as primary key
- ✅ Added `patient_id` as optional field in UPDATE

#### 2. `api/get_patients.php`
- ✅ SELECT includes `ambulance_id` as first column
- ✅ Array key changed from `$row['patient_id']` to `$row['ambulance_id']`
- ✅ Response includes both `ambulanceID` and `patientID` fields

#### 3. `api/update_patient.php`
- ✅ Accepts both `ambulanceID` (required) and `patientID` parameters
- ✅ Query uses `WHERE ambulance_id = ?`
- ✅ Added `patientID` to allowed editable fields
- ✅ Removed `ambulanceID` from editable fields (it's the primary key)

#### 4. `api/config.php`
- ✅ Updated `logActivity()` function signature to accept both IDs
- ✅ Now logs: `logActivity($conn, $ambulanceID, $patientID, ...)`

---

### JavaScript Dashboard Updated:

#### `js/dashboard.js`
- ✅ Variable renamed: `currentPatientID` → `currentAmbulanceID`
- ✅ Dropdown shows ambulance IDs instead of patient IDs
- ✅ Dropdown text: "AMB-001 - John Doe (P001)"
- ✅ Cache key uses `ambulance_id`
- ✅ Moved "Ambulance ID" to read-only section (can't edit primary key)
- ✅ Added "Patient ID" as editable field
- ✅ Update requests send both `ambulanceID` and `patientID`

---

### HTML Dashboard Updated:

#### `index.html`
- ✅ Dropdown label: "Select Patient" → "Select Ambulance"
- ✅ Placeholder: "Choose Patient ID" → "Choose Ambulance ID"
- ✅ Help text: "Please select an ambulance from the dropdown"

---

## 🔄 Migration Steps

### Step 1: Backup Current Database
```bash
# In phpMyAdmin or MySQL command line
mysqldump -u root smart_ambulance > backup_before_changes.sql
```

### Step 2: Drop Old Tables (If Exists)
```sql
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS ambulance;
```

### Step 3: Import New Schema
1. Open phpMyAdmin → `http://localhost/phpmyadmin`
2. Select `smart_ambulance` database
3. Click "Import" tab
4. Choose file: `Website/database.sql`
5. Click "Go"

### Step 4: Verify Data
```sql
-- Check ambulance table
SELECT * FROM ambulance;

-- Expected output:
-- +----+-------------+----------+---------------+---------------------+
-- | id | ambulance_id| password | attendar_name | hardware_code       |
-- +----+-------------+----------+---------------+---------------------+
-- |  1 | AMB-001     | Amb@123  | XYZ           | 50_84_92_BD_47_19   |
-- |  2 | AMB-002     | Amb@456  | ABC           | 00_00_00_00_00_00   |
-- |  3 | AMB-003     | Amb@789  | PQR           | 11_22_33_44_55_66   |
-- +----+-------------+----------+---------------+---------------------+

-- Check patients table
SELECT ambulance_id, patient_id, patient_name FROM patients;

-- Expected output:
-- +-------------+------------+--------------+
-- | ambulance_id| patient_id | patient_name |
-- +-------------+------------+--------------+
-- | AMB-001     | P001       | John Doe     |
-- | AMB-002     | P002       | Jane Smith   |
-- | AMB-003     | P003       | Mike Johnson |
-- +-------------+------------+--------------+
```

### Step 5: Test API Endpoints

#### Test 1: Get Patients
```bash
curl http://localhost/smart_ambulance/api/get_patients.php
```

**Expected Response**:
```json
{
  "patients": {
    "AMB-001": {
      "ambulanceID": "AMB-001",
      "patientID": "P001",
      "patientName": "John Doe",
      ...
    }
  },
  "count": 3,
  "timestamp": "2026-01-23 12:30:45"
}
```

#### Test 2: Upload Data (Simulating ESP32)
```bash
curl -X POST http://localhost/smart_ambulance/api/upload.php \
  -d "ambulanceID=AMB-001" \
  -d "patientID=P123" \
  -d "temperature=37.5" \
  -d "oxygenLevel=98" \
  -d "heartRate=75"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Patient vitals updated successfully",
  "ambulanceID": "AMB-001",
  "patientID": "P123",
  "timestamp": "2026-01-23 12:31:00"
}
```

#### Test 3: Update Field
```bash
curl -X POST http://localhost/smart_ambulance/api/update_patient.php \
  -d "ambulanceID=AMB-001" \
  -d "patientID=P001" \
  -d "fieldName=patientName" \
  -d "newValue=John Updated Doe"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Field updated successfully",
  "field": "patientName",
  "oldValue": "John Doe",
  "newValue": "John Updated Doe",
  "ambulanceID": "AMB-001",
  "patientID": "P001"
}
```

---

## 📱 ESP32 Firmware Impact

### What Changed:
- ✅ ESP32 **MUST** send `ambulanceID` parameter (was optional before)
- ✅ `patientID` is now **optional** (will be auto-generated if not provided)
- ✅ No other firmware changes needed

### Current Firmware Status:
The existing `ambulance.ino` firmware already sends both parameters:
```cpp
String postData = "patientID=" + patientID + 
                  "&ambulanceID=" + ambulanceID + 
                  "&temperature=" + String(bodyTemp, 1) + ...
```

**Action Required**: ✅ No firmware changes needed - it already works!

---

## 🎯 Benefits of This Change

### 1. **Simplified Hardware-Software Sync**
- ESP32 only needs to know its `ambulance_id` (burned into firmware)
- No need to manage patient IDs on hardware side
- Automatic patient assignment when ambulance uploads data

### 2. **Better Data Integrity**
- One ambulance = One patient at a time
- Foreign key constraints prevent orphaned records
- Cascade delete ensures cleanup

### 3. **Authentication Ready**
- `ambulance` table stores passwords for future login system
- `hardware_code` tracks MAC address for device verification
- Ready for admin panel implementation

### 4. **Easier Dashboard Use**
- Doctors select by ambulance (not patient)
- Makes sense: "Check what's happening in AMB-001"
- Patient details shown after selection

---

## 🚀 Future Enhancements

### Admin Panel (Future Implementation)
```html
<!-- Future: Ambulance registration form -->
<form action="api/register_ambulance.php" method="POST">
  <input name="ambulance_id" placeholder="AMB-004">
  <input name="password" type="password" placeholder="Password">
  <input name="attendar_name" placeholder="Attendant Name">
  <input name="hardware_code" placeholder="50_84_92_BD_47_19">
  <button>Register Ambulance</button>
</form>
```

### Authentication Endpoint (Future)
```php
// api/login.php
$ambulanceID = $_POST['ambulanceID'];
$password = $_POST['password'];
$hardwareCode = $_POST['hardwareCode'];

// Verify credentials
$stmt = $conn->prepare("SELECT * FROM ambulance 
                        WHERE ambulance_id = ? 
                        AND password = ? 
                        AND hardware_code = ?");
// ... authenticate and return JWT token
```

---

## ✅ Verification Checklist

- [ ] Database schema imported successfully
- [ ] Sample data visible in phpMyAdmin
- [ ] API endpoint `/get_patients.php` returns ambulance IDs
- [ ] Dashboard dropdown shows "AMB-001", "AMB-002", "AMB-003"
- [ ] Selecting ambulance loads patient data
- [ ] Editing patient name/age saves successfully
- [ ] Ambulance ID shown as read-only (can't edit)
- [ ] Patient ID shown as editable field
- [ ] Auto-refresh works every 10 seconds
- [ ] ESP32 upload simulation works (test.html)
- [ ] Activity log records both ambulance_id and patient_id

---

## 🔙 Rollback Instructions (If Needed)

If you need to revert to the old schema:

```bash
# Step 1: Stop XAMPP
# Step 2: Restore backup
mysql -u root smart_ambulance < backup_before_changes.sql

# Step 3: Restore old files from Backup folder
# Step 4: Restart XAMPP
```

---

## 📞 Support

If you encounter issues:
1. Check phpMyAdmin for table structure
2. Verify foreign key constraints are created
3. Check browser console for JavaScript errors
4. Check `activity_log` table for debugging
5. Verify both `ambulanceID` and `patientID` are sent in POST requests

---

**✅ Changes Complete!** 

The system now uses `ambulance_id` as the primary identifier, making hardware-software synchronization seamless and preparing the foundation for future authentication features.
