# 🔐 Login System Implementation - Smart Ambulance

## Overview

Complete session-based authentication system for ambulance attendants with emergency service workflow.

---

## 🎯 System Flow

```
1. Open index.html (Login Page)
   ↓
2. Enter Ambulance ID + Password
   ↓
3. Session Created (lasts until browser closes)
   ↓
4. Show "Start Emergency Service" Button
   ↓
5. Click Button → Create Patient Row (done=0)
   ↓
6. Auto-redirect to dashboard.html
   ↓
7. Dashboard auto-refreshes every 10 seconds
   ↓
8. Logout → Returns to Login Page
```

---

## 📁 New Files Created

### 1. **api/login.php** (Authentication)
**Purpose**: Validates ambulance credentials and creates session

**POST Parameters**:
- `ambulance_id` - Required (e.g., "AMB-001")
- `password` - Required (e.g., "Amb@123")

**Response Success**:
```json
{
  "success": true,
  "message": "Login successful",
  "ambulance_id": "AMB-001",
  "attendar_name": "XYZ",
  "timestamp": "2026-01-23 14:30:00"
}
```

**Response Error**:
```json
{
  "success": false,
  "message": "Invalid Ambulance ID"
}
```

**Session Variables Created**:
- `$_SESSION['logged_in']` = true
- `$_SESSION['ambulance_id']` = "AMB-001"
- `$_SESSION['attendar_name']` = "XYZ"
- `$_SESSION['hardware_code']` = "50_84_92_BD_47_19"
- `$_SESSION['login_time']` = timestamp

---

### 2. **api/check_session.php** (Session Verification)
**Purpose**: Checks if user is logged in

**Response Logged In**:
```json
{
  "success": true,
  "logged_in": true,
  "ambulance_id": "AMB-001",
  "attendar_name": "XYZ",
  "hardware_code": "50_84_92_BD_47_19",
  "login_time": 1737632400
}
```

**Response Not Logged In**:
```json
{
  "success": false,
  "logged_in": false,
  "message": "Not authenticated"
}
```

---

### 3. **api/start_service.php** (Emergency Service Initiation)
**Purpose**: Creates new patient row for logged-in ambulance

**POST Parameters**: None (uses session)

**Response Success**:
```json
{
  "success": true,
  "message": "Emergency service started successfully",
  "ambulance_id": "AMB-001",
  "redirect": "dashboard.html",
  "timestamp": "2026-01-23 14:35:00"
}
```

**Response Error** (Already has active patient):
```json
{
  "success": false,
  "message": "Ambulance already has an active patient. Please complete current service first.",
  "ambulance_id": "AMB-001"
}
```

**What It Does**:
- Checks if ambulance already has active patient (done=0)
- If not, creates new row in `patients` table:
  - `ambulance_id` = logged-in ambulance
  - `done` = 0 (active)
  - All other fields = default/empty
- Logs activity in `activity_log`

---

### 4. **api/logout.php** (Session Destruction)
**Purpose**: Destroys session and logs out user

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully",
  "ambulance_id": "AMB-001",
  "timestamp": "2026-01-23 15:00:00"
}
```

---

## 🌐 Frontend Pages

### **index.html** - Login & Service Start Page

#### **View 1: Login Form**
Shown when not logged in:
- Ambulance ID input
- Password input (masked)
- Login button

#### **View 2: Service Start Screen**
Shown after successful login:
- Welcome message with attendant name
- Ambulance ID display
- Large "Start Emergency Service" button
- Logout button

**Features**:
- Checks session on load (auto-shows service screen if logged in)
- Beautiful gradient design
- Responsive layout
- Error message display

---

### **dashboard.html** - Emergency Service Dashboard

#### **Layout Structure**:

**Header**:
- Title: "Emergency Service Dashboard"
- Shows: Ambulance ID & Attendant Name
- Auto-refresh indicator (10s)
- Logout button

**Section 1: Real-Time Vital Signs** 📊
- 3 cards (read-only):
  1. Body Temperature (°C) - with status badge
  2. Heart Rate (BPM) - with status badge
  3. Oxygen Level (%) - with status badge

**Section 2: Medical Data** 💊
- 3 editable cards:
  1. Blood Pressure (text input)
  2. Blood Sugar Level (number input, mg/dL)
  3. Patient Status (dropdown: Normal/Medium/Critical)

**Section 3: Patient Information** 👤
- Non-card layout with 4 fields:
  1. Patient ID
  2. Patient Name
  3. Age
  4. Blood Group
- "Update Patient Details" button → Opens modal form

**Section 4: Ambulance & Location** 🚑
- 3 cards:
  1. GPS Location (read-only) - shows Lat/Long/Position
  2. Ambulance Speed (read-only) - km/h
  3. Destination Hospital (editable dropdown)

---

## 🔐 Session Management

### Session Lifetime:
- **Duration**: Until browser closes (session cookie, not persistent)
- **Storage**: PHP `$_SESSION` (server-side)
- **Security**: No session data stored in browser

### Session Flow:
1. Login → Creates session
2. Every dashboard page load → Checks session via `check_session.php`
3. If session invalid → Redirect to `index.html`
4. Logout → Destroys session + redirects to `index.html`

---

## 🎨 Dashboard Features

### Auto-Refresh System:
```javascript
// Refreshes every 10 seconds
setInterval(() => {
  loadPatientData(); // Only for logged-in ambulance
}, 10000);
```

### Status Badge Logic:
| Vital | Normal Range | High | Low |
|-------|-------------|------|-----|
| Temperature | 36-38°C | >38°C | <36°C |
| Heart Rate | 60-100 BPM | >100 BPM | <60 BPM |
| Oxygen | ≥95% | - | <95% |

### Patient Details Modal:
- Opens with "Update Patient Details" button
- Pre-fills with current data
- Updates multiple fields sequentially
- Closes after successful save

---

## 🧪 Testing Guide

### Test 1: Login
```bash
# Navigate to http://localhost/smart_ambulance/

# Try logging in with:
Ambulance ID: AMB-001
Password: Amb@123

# Expected: Shows "Welcome, XYZ" with Start Service button
```

### Test 2: Start Service
```bash
# Click "Start Emergency Service"

# Expected:
# - Loading spinner appears
# - Redirects to dashboard.html
# - Header shows "AMB-001 | XYZ"
```

### Test 3: Dashboard Auto-Refresh
```bash
# Open browser console (F12)
# Watch for console logs every 10 seconds:
"Auto-refreshing patient data..."
"Loading patient data for ambulance: AMB-001"
```

### Test 4: Edit Medical Data
```bash
# Click "EDIT" on Blood Pressure card
# Enter: "120/80"
# Click "SAVE"

# Expected: Card shows "120/80", auto-refreshes
```

### Test 5: Update Patient Details
```bash
# Click "Update Patient Details" button
# Fill form:
Patient ID: P123
Name: John Doe
Age: 45
Blood Group: O+

# Click "Save Details"

# Expected: Modal closes, info updates, shows new values
```

### Test 6: Logout
```bash
# Click "Logout" button in header
# Confirm dialog → Yes

# Expected: Redirects to index.html (login page)
```

### Test 7: Session Persistence
```bash
# After logging in, close browser tab
# Reopen: http://localhost/smart_ambulance/

# Expected: Shows login form (session destroyed)
```

### Test 8: Direct Dashboard Access (Not Logged In)
```bash
# Open: http://localhost/smart_ambulance/dashboard.html
# (without logging in)

# Expected: Auto-redirects to index.html
```

---

## 🔒 Security Features

### Implemented:
1. ✅ **Session-based authentication** (not cookies)
2. ✅ **Password verification** (plain text - upgrade to `password_hash()` in production)
3. ✅ **Session validation** on every dashboard load
4. ✅ **Auto-redirect** if not authenticated
5. ✅ **SQL prepared statements** (prevents SQL injection)
6. ✅ **Input sanitization** via `sanitize()` function
7. ✅ **CORS headers** for API security

### Future Enhancements:
- [ ] Hash passwords using `password_hash()` and `password_verify()`
- [ ] Add CSRF token protection
- [ ] Implement session timeout (e.g., 30 minutes)
- [ ] Add "Remember Me" functionality (optional)
- [ ] Rate limiting for login attempts
- [ ] Two-factor authentication (2FA)

---

## 📊 Database Schema Impact

### New Login Credentials (from `ambulance` table):
| ambulance_id | password | attendar_name | hardware_code |
|-------------|----------|---------------|---------------|
| AMB-001 | Amb@123 | XYZ | 50_84_92_BD_47_19 |
| AMB-002 | Amb@456 | ABC | 00_00_00_00_00_00 |
| AMB-003 | Amb@789 | PQR | 11_22_33_44_55_66 |

### Patient Row Creation (on "Start Service"):
```sql
INSERT INTO patients (
  ambulance_id,  -- FROM SESSION
  patient_id,    -- ''
  patient_name,  -- ''
  patient_age,   -- NULL
  blood_group,   -- ''
  patient_status, -- 'Normal'
  temperature,   -- 0.0
  oxygen_level,  -- 0
  heart_rate,    -- 0
  done          -- 0 (ACTIVE)
) VALUES ('AMB-001', '', '', NULL, '', 'Normal', 0.0, 0, 0, 0);
```

---

## 🚀 Deployment Checklist

- [ ] Import updated `database.sql` (includes `ambulance` table)
- [ ] Verify 3 ambulances created with passwords
- [ ] Test login with AMB-001 / Amb@123
- [ ] Test "Start Service" button
- [ ] Verify dashboard loads for AMB-001
- [ ] Test auto-refresh (10 seconds)
- [ ] Test editing medical data
- [ ] Test patient details modal
- [ ] Test logout
- [ ] Test direct dashboard access (should redirect)
- [ ] Test session persistence (close/reopen browser)

---

## 🆚 Old vs New Comparison

| Feature | Old System | New System |
|---------|-----------|------------|
| **Login** | ❌ No login | ✅ Ambulance ID + Password |
| **Session** | ❌ None | ✅ Server-side PHP session |
| **Dashboard Access** | Public | Authenticated only |
| **Ambulance Selection** | Dropdown | Automatic (from login) |
| **Service Start** | Manual patient creation | "Start Service" button |
| **Patient Assignment** | Manual entry | Auto-assigned to ambulance |
| **Auto-Refresh** | All patients | Only logged-in ambulance |
| **Security** | ❌ None | ✅ Session-based |

---

## 📝 Usage Workflow

### For Ambulance Attendant:

1. **Start of Shift**:
   - Open `http://localhost/smart_ambulance/`
   - Login with ambulance credentials

2. **Emergency Call Received**:
   - Click "Start Emergency Service"
   - Redirected to dashboard
   - All vitals show "Not Updated" initially

3. **Patient Pickup**:
   - ESP32 starts sending sensor data
   - Vitals update automatically every 10 seconds
   - Click "Update Patient Details" → Enter patient info

4. **During Transport**:
   - Update Blood Pressure (manual entry)
   - Update Blood Sugar (if tested)
   - Change Patient Status (Normal/Medium/Critical)
   - Select Destination Hospital

5. **Patient Delivery**:
   - Logout (ends service)
   - Patient row remains in database (done=0)

6. **Admin Completes**:
   - Admin marks patient as `done=1`
   - Patient disappears from active list

---

## 🐛 Troubleshooting

### Issue: "Not authenticated" error
**Solution**: Clear browser cookies and login again

### Issue: Dashboard doesn't redirect
**Solution**: Check `api/check_session.php` returns `logged_in: true`

### Issue: "Already has active patient" error
**Solution**: 
```sql
-- Check database:
SELECT * FROM patients WHERE ambulance_id = 'AMB-001' AND done = 0;

-- To reset:
UPDATE patients SET done = 1 WHERE ambulance_id = 'AMB-001';
```

### Issue: Auto-refresh not working
**Solution**: Check browser console for errors, verify 10-second interval logs

### Issue: Patient details not saving
**Solution**: Check `update_patient.php` response, verify `ambulanceID` sent in POST

---

## 🎓 API Usage Examples

### Login (cURL):
```bash
curl -X POST http://localhost/smart_ambulance/api/login.php \
  -d "ambulance_id=AMB-001" \
  -d "password=Amb@123" \
  --cookie-jar cookies.txt
```

### Start Service (with session):
```bash
curl -X POST http://localhost/smart_ambulance/api/start_service.php \
  --cookie cookies.txt
```

### Check Session:
```bash
curl http://localhost/smart_ambulance/api/check_session.php \
  --cookie cookies.txt
```

### Logout:
```bash
curl -X POST http://localhost/smart_ambulance/api/logout.php \
  --cookie cookies.txt
```

---

**✅ Login System Complete!**

The system now provides secure, session-based authentication with a streamlined emergency service workflow. Attendants can login, start service with one click, and monitor their assigned patient in real-time.
