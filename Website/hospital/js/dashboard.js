/**
 * Hospital Dashboard JavaScript
 */

const API_BASE = 'api/';

let currentHospitalID = null;
let currentHospitalName = null;
let refreshInterval = null;
let currentAmbulanceID = null; // Store current ambulance ID
let incomingCallData = null; // Store current incoming call data

// Load on page load
window.addEventListener('load', function() {
  checkSessionAndLoad();
});

/**
 * Check session and load dashboard
 */
function checkSessionAndLoad() {
  fetch(API_BASE + 'check_hospital_session.php', {
    method: 'GET',
    credentials: 'same-origin'
  })
  .then(response => response.json())
  .then(result => {
    if (result.success && result.loggedIn) {
      currentHospitalID = result.hospital.hospital_id;
      currentHospitalName = result.hospital.name;
      
      // Update header
      document.getElementById('hospitalName').textContent = result.hospital.name;
      document.getElementById('hospitalID').textContent = 'ID: ' + result.hospital.hospital_id;
      
      // Load patient data
      loadPatientData();
      
      // Start auto-refresh
      startAutoRefresh();
    } else {
      // Redirect to login
      window.location.href = 'index.html';
    }
  })
  .catch(error => {
    console.error('Session check error:', error);
    window.location.href = 'index.html';
  });
}

/**
 * Load patient data for this hospital
 */
function loadPatientData() {
  console.log('Loading patient data for hospital:', currentHospitalName);
  
  fetch(API_BASE + 'get_hospital_patients.php', {
    method: 'GET',
    credentials: 'same-origin'
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      if (result.patients && result.patients.length > 0) {
        renderDashboard(result.patients);
      } else {
        showNoData();
      }
    } else {
      console.error('Failed to load patient data:', result.message);
      showNoData();
    }
  })
  .catch(error => {
    console.error('Error loading patient data:', error);
    showNoData();
  });
}

/**
 * Render dashboard with patient data
 */
function renderDashboard(patients) {
  // Assuming single active patient for now
  const patient = patients[0];
  
  // Store ambulance ID for video calls
  currentAmbulanceID = patient.ambulanceID;
  
  // Section 1: Patient Vitals
  const vitalsGrid = document.getElementById('vitalsGrid');
  vitalsGrid.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">Heart Rate</div>
        <span class="status-badge ${getVitalStatus(patient.heartRate, 60, 100)}">${getVitalStatusText(patient.heartRate, 60, 100)}</span>
      </div>
      <div class="card-value">${patient.heartRate || '--'} bpm</div>
      <div class="card-subtext">Normal: 60-100 bpm</div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Oxygen Level</div>
        <span class="status-badge ${getOxygenStatus(patient.oxygenLevel)}">${getOxygenStatusText(patient.oxygenLevel)}</span>
      </div>
      <div class="card-value">${patient.oxygenLevel || '--'}%</div>
      <div class="card-subtext">Blood Oxygen Level</div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Body Temperature</div>
        <span class="status-badge ${getTempStatus(patient.temperature)}">${getTempStatusText(patient.temperature)}</span>
      </div>
      <div class="card-value">${patient.temperature || '--'}°C</div>
      <div class="card-subtext">Normal: 36-38°C</div>
    </div>
  `;
  
  // Section 2: Patient Medical Info
  const medicalGrid = document.getElementById('medicalGrid');
  medicalGrid.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">Blood Pressure</div>
        <span class="status-badge status-active">Normal</span>
      </div>
      <div class="card-value">${patient.bloodPressure || '--'}</div>
      <div class="card-subtext">Systolic/Diastolic</div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Diabetics Level</div>
      </div>
      <div class="card-value" style="font-size: 22px;">${patient.diabeticsLevel || '--'}</div>
      <div class="card-subtext">Blood Sugar Level</div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Patient Status</div>
      </div>
      <div class="card-value" style="font-size: 18px;">${patient.patientStatus || 'Stable'}</div>
      <div class="card-subtext">Current Condition</div>
    </div>
  `;
  
  // Section 3: Patient Personal Info
  const personalGrid = document.getElementById('personalGrid');
  personalGrid.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">Patient ID</div>
      </div>
      <div class="card-value" style="font-size: 22px;">${patient.patientID || 'Not Assigned'}</div>
      <div class="card-subtext">Unique Identifier</div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Patient Name</div>
      </div>
      <div class="card-value" style="font-size: 22px;">${patient.patientName || 'Not Entered'}</div>
      <div class="card-subtext">Full Name</div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Age</div>
      </div>
      <div class="card-value">${patient.patientAge || '--'}</div>
      <div class="card-subtext">Years old</div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Blood Group</div>
      </div>
      <div class="card-value" style="font-size: 22px;">${patient.bloodGroup || 'Not Specified'}</div>
      <div class="card-subtext">Patient Blood Type</div>
    </div>
  `;
  
  // Section 4: Ambulance Data
  const ambulanceGrid = document.getElementById('ambulanceGrid');
  ambulanceGrid.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">GPS Location</div>
      </div>
      <div style="font-size: 16px; line-height: 1.8; margin: 10px 0;">
        <div><strong>Lat:</strong> ${patient.latitude || '0.0000000'}</div>
        <div><strong>Long:</strong> ${patient.longitude || '0.0000000'}</div>
      </div>
      <div class="card-subtext">Current Position</div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Ambulance Speed</div>
      </div>
      <div class="card-value">${patient.speed || '0'} km/h</div>
      <div class="card-subtext">Current Speed</div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Estimated Time of Arrival</div>
      </div>
      <div class="card-value">15 min</div>
      <div class="card-subtext">Approximate ETA</div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title">Ambulance ID</div>
      </div>
      <div class="card-value" style="font-size: 22px;">${patient.ambulanceID || '--'}</div>
      <div class="card-subtext">Assigned Ambulance</div>
    </div>
  `;
}

/**
 * Show no data message
 */
function showNoData() {
  const sections = ['vitalsGrid', 'medicalGrid', 'personalGrid', 'ambulanceGrid'];
  sections.forEach(id => {
    document.getElementById(id).innerHTML = '<div class="no-data">No active patients assigned to this hospital</div>';
  });
}

/**
 * Get vital status class
 */
function getVitalStatus(value, min, max) {
  if (!value) return 'status-warning';
  const val = parseInt(value);
  if (val < min || val > max) return 'status-critical';
  return 'status-active';
}

/**
 * Get vital status text
 */
function getVitalStatusText(value, min, max) {
  if (!value) return 'No Data';
  const val = parseInt(value);
  if (val < min || val > max) return 'Critical';
  return 'Normal';
}

/**
 * Get Oxygen status
 */
function getOxygenStatus(value) {
  if (!value) return 'status-warning';
  const val = parseInt(value);
  if (val < 90) return 'status-critical';
  if (val < 95) return 'status-warning';
  return 'status-active';
}

/**
 * Get Oxygen status text
 */
function getOxygenStatusText(value) {
  if (!value) return 'No Data';
  const val = parseInt(value);
  if (val < 90) return 'Critical';
  if (val < 95) return 'Low';
  return 'Normal';
}

/**
 * Get Temperature status
 */
function getTempStatus(value) {
  if (!value) return 'status-warning';
  const val = parseFloat(value);
  if (val > 38 || val < 36) return 'status-critical';
  return 'status-active';
}

/**
 * Get Temperature status text
 */
function getTempStatusText(value) {
  if (!value) return 'No Data';
  const val = parseFloat(value);
  if (val > 38) return 'High';
  if (val < 36) return 'Low';
  return 'Normal';
}

/**
 * Start auto-refresh every 10 seconds
 */
function startAutoRefresh() {
  stopAutoRefresh();
  refreshInterval = setInterval(() => {
    console.log('Auto-refreshing patient data...');
    loadPatientData();
    checkIncomingCalls(); // Check for incoming calls from ambulance
  }, 10000);
}

/**
 * Stop auto-refresh
 */
function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

/**
 * Logout function
 */
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    fetch(API_BASE + 'hospital_logout.php', {
      method: 'POST',
      credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(result => {
      window.location.href = 'index.html';
    })
    .catch(error => {
      console.error('Logout error:', error);
      window.location.href = 'index.html';
    });
  }
}

/**
 * Start Video Call with Ambulance
 */
function startVideoCall() {
  if (!currentAmbulanceID) {
    alert('No active ambulance found. Please wait for a patient to be assigned.');
    return;
  }
  
  const videoUrl = 'https://meet.google.com/cbe-xybk-vdx';
  
  const formData = new FormData();
  formData.append('ambulanceID', currentAmbulanceID);
  formData.append('url', videoUrl);
  
  fetch(API_BASE + 'start_video_call.php', {
    method: 'POST',
    credentials: 'same-origin',
    body: formData
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      console.log('Video conference entry created:', result.conferenceID);
      // Open video call in new tab
      window.open(videoUrl, '_blank');
    } else {
      alert('Failed to start video call: ' + result.message);
    }
  })
  .catch(error => {
    console.error('Error starting video call:', error);
    alert('An error occurred while starting the video call.');
  });
}

/**
 * Check for incoming video calls from ambulance
 */
function checkIncomingCalls() {
  fetch(API_BASE + 'check_incoming_calls.php', {
    method: 'GET',
    credentials: 'same-origin'
  })
  .then(response => response.json())
  .then(result => {
    if (result.success && result.hasIncomingCall) {
      // Store the call data and show popup
      incomingCallData = result.call;
      showIncomingCallPopup();
    }
  })
  .catch(error => {
    console.error('Error checking incoming calls:', error);
  });
}

/**
 * Show incoming call popup
 */
function showIncomingCallPopup() {
  const popup = document.getElementById('incomingCallPopup');
  const overlay = document.getElementById('callPopupOverlay');
  
  if (popup && overlay) {
    popup.classList.add('show');
    overlay.classList.add('show');
  }
}

/**
 * Hide incoming call popup
 */
function hideIncomingCallPopup() {
  const popup = document.getElementById('incomingCallPopup');
  const overlay = document.getElementById('callPopupOverlay');
  
  if (popup && overlay) {
    popup.classList.remove('show');
    overlay.classList.remove('show');
  }
  
  incomingCallData = null;
}

/**
 * Answer the incoming call
 */
function answerCall() {
  if (!incomingCallData) {
    alert('No incoming call data found.');
    return;
  }
  
  const callID = incomingCallData.id;
  const callURL = incomingCallData.url;
  
  // Update call_picked status to 1
  const formData = new FormData();
  formData.append('callID', callID);
  
  fetch(API_BASE + 'update_call_status.php', {
    method: 'POST',
    credentials: 'same-origin',
    body: formData
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      console.log('Call status updated successfully');
      // Hide popup
      hideIncomingCallPopup();
      // Open video call in new tab
      window.open(callURL, '_blank');
    } else {
      alert('Failed to update call status: ' + result.message);
    }
  })
  .catch(error => {
    console.error('Error updating call status:', error);
    alert('An error occurred while joining the call.');
  });
}

// Stop refresh when page unloads
window.addEventListener('beforeunload', stopAutoRefresh);

/**
 * Mark patient as reached hospital (done=1)
 */
function markPatientReachedHospital() {
  if (!currentAmbulanceID) {
    alert('No active patient found to mark as complete.');
    return;
  }
  
  // Fetch current patient to get patient_row_id
  fetch(API_BASE + 'get_hospital_patients.php?hospital=' + currentHospitalID, {
    credentials: 'same-origin'
  })
  .then(response => response.json())
  .then(result => {
    if (result.success && result.patients.length > 0) {
      const patient = result.patients[0];
      
      if (confirm('Mark patient as reached hospital?\n\nPatient: ' + (patient.patientName || patient.patientID) + '\n\nThis will stop all updates for this patient.')) {
        const formData = new FormData();
        formData.append('patient_row_id', patient.id);
        
        fetch('../api/mark_patient_done.php', {
          method: 'POST',
          credentials: 'same-origin',
          body: formData
        })
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            alert('✓ Patient successfully marked as reached hospital!\n\nPatient ID: ' + result.patient_id);
            // Reload patient data to reflect changes
            loadPatientData();
          } else {
            alert('Failed to mark patient as done:\n' + result.message);
          }
        })
        .catch(error => {
          console.error('Error marking patient as done:', error);
          alert('An error occurred while updating patient status.');
        });
      }
    } else {
      alert('No active patient found.');
    }
  })
  .catch(error => {
    console.error('Error fetching patient data:', error);
    alert('An error occurred while fetching patient data.');
  });
}

