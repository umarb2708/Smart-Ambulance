/**
 * Smart Ambulance Dashboard - JavaScript (Session-Based)
 * Handles authenticated dashboard for logged-in attendant
 */

const API_BASE = 'api/';

let currentAmbulanceID = null;
let currentAttendarName = null;
let refreshInterval = null;
let patientData = {};
let hospitalsList = []; // Store hospitals from database
let incomingCallData = null; // Store current incoming call data

// Load on page load
window.addEventListener('load', function() {
  checkSessionAndLoad();
  loadHospitals(); // Load hospitals on page load
});

/**
 * Check session and load dashboard
 */
function checkSessionAndLoad() {
  fetch(API_BASE + 'check_session.php', {
    credentials: 'same-origin'
  })
    .then(response => response.json())
    .then(result => {
      if (!result.logged_in) {
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
        return;
      }
      
      currentAmbulanceID = result.ambulance_id;
      currentAttendarName = result.attendar_name;
      
      // Update header
      document.getElementById('headerAmbulanceID').textContent = currentAmbulanceID;
      document.getElementById('headerAttendarName').textContent = currentAttendarName;
      
      // Load patient data
      loadPatientData();
      startAutoRefresh();
    })
    .catch(error => {
      console.error('Session check failed:', error);
      window.location.href = 'index.html';
    });
}

/**
 * Load hospitals from database
 */
function loadHospitals() {
  fetch(API_BASE + 'get_hospitals.php', {
    credentials: 'same-origin'
  })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        hospitalsList = result.hospitals || [];
        console.log('Hospitals loaded:', hospitalsList.length);
      } else {
        console.error('Failed to load hospitals:', result.error);
      }
    })
    .catch(error => {
      console.error('Error loading hospitals:', error);
    });
}

/**
 * Load patient data for logged-in ambulance
 */
function loadPatientData() {
  console.log('Loading patient data for ambulance:', currentAmbulanceID);
  
  fetch(API_BASE + 'get_patients.php', {
    credentials: 'same-origin'
  })
    .then(response => response.json())
    .then(result => {
      if (result.error) {
        console.error('Error:', result.error);
        return;
      }
      
      const allPatients = result.patients || {};
      const myPatient = allPatients[currentAmbulanceID];
      
      if (!myPatient) {
        console.log('No active patient for this ambulance');
        showNoPatientMessage();
        return;
      }
      
      patientData = myPatient;
      renderDashboard(myPatient);
    })
    .catch(error => {
      console.error('Error loading patient:', error);
    });
}

/**
 * Show message when no active patient
 */
function showNoPatientMessage() {
  // Keep showing placeholder data
  patientData = {};
}

/**
 * Restore card to normal view (from edit mode)
 */
function restoreCard(fieldName, cardTitle, displayValue) {
  const card = document.getElementById('card-' + fieldName);
  if (!card) return;
  
  // Check if card is in edit mode (has input field)
  const isEditMode = card.querySelector('.card-input') || card.querySelector('.card-select');
  
  if (isEditMode) {
    // Restore original card structure
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${cardTitle}</div>
        <button class="edit-btn" onclick="editField('${fieldName}')">EDIT</button>
      </div>
      <div class="card-value" id="value-${fieldName}">${displayValue}</div>
    `;
  } else {
    // Card is already in normal mode, just update value
    const valueEl = document.getElementById('value-' + fieldName);
    if (valueEl) {
      valueEl.textContent = displayValue;
    }
  }
}

/**
 * Render dashboard with patient data
 */
function renderDashboard(data) {
  // Section 1: Real-Time Vitals
  const temp = parseFloat(data.temperature) || 0;
  const hr = parseInt(data.heartRate) || 0;
  const o2 = parseInt(data.oxygenLevel) || 0;
  
  const tempEl = document.getElementById('temperature');
  const hrEl = document.getElementById('heartRate');
  const o2El = document.getElementById('oxygenLevel');
  
  if (tempEl) tempEl.textContent = temp > 0 ? temp.toFixed(1) + '°C' : 'Not Updated';
  if (hrEl) hrEl.textContent = hr > 0 ? hr + ' BPM' : 'Not Updated';
  if (o2El) o2El.textContent = o2 > 0 ? o2 + '%' : 'Not Updated';
  
  // Update status badges
  updateStatusBadge('tempStatus', temp, 36, 38);
  updateStatusBadge('heartRateStatus', hr, 60, 100);
  updateStatusBadge('oxygenStatus', o2, 95, 100, true); // Reverse: low is bad
  
  // Section 2: Editable Medical Data - restore cards if in edit mode
  restoreCard('bloodPressure', 'Blood Pressure', data.bloodPressure || 'Not Updated');
  restoreCard('diabeticsLevel', 'Blood Sugar Level', data.diabeticsLevel ? data.diabeticsLevel + ' mg/dL' : 'Not Updated');
  restoreCard('patientStatus', 'Patient Status', data.patientStatus || 'Normal');
  
  // Section 3: Patient Information
  const pidEl = document.getElementById('patientID');
  const pnameEl = document.getElementById('patientName');
  const pageEl = document.getElementById('patientAge');
  const bgEl = document.getElementById('bloodGroup');
  
  if (pidEl) {
    pidEl.textContent = data.patientID || 'Not Assigned';
    pidEl.className = data.patientID ? 'info-value' : 'info-value empty';
  }
  
  if (pnameEl) {
    pnameEl.textContent = data.patientName || 'Not Entered';
    pnameEl.className = data.patientName ? 'info-value' : 'info-value empty';
  }
  
  if (pageEl) {
    pageEl.textContent = data.patientAge || '--';
    pageEl.className = data.patientAge ? 'info-value' : 'info-value empty';
  }
  
  if (bgEl) {
    bgEl.textContent = data.bloodGroup || '--';
    bgEl.className = data.bloodGroup ? 'info-value' : 'info-value empty';
  }
  
  // Section 4: Ambulance & Location
  const lat = parseFloat(data.latitude) || 0;
  const lng = parseFloat(data.longitude) || 0;
  const spd = parseFloat(data.speed) || 0;
  
  const latEl = document.getElementById('latitude');
  const lngEl = document.getElementById('longitude');
  const spdEl = document.getElementById('speed');
  const gpsEl = document.getElementById('gpsPosition');
  const hospEl = document.getElementById('value-hospital');
  
  if (latEl) latEl.textContent = lat.toFixed(7);
  if (lngEl) lngEl.textContent = lng.toFixed(7);
  if (spdEl) spdEl.textContent = spd.toFixed(1) + ' km/h';
  
  // GPS position description
  if (gpsEl) {
    if (lat !== 0 && lng !== 0) {
      gpsEl.textContent = `Position: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
    } else {
      gpsEl.textContent = 'GPS data not available';
    }
  }
  
  // Hospital field - restore if in edit mode
  restoreCard('hospital', 'Destination Hospital', data.hospital || 'Not Selected');
}

/**
 * Update status badge color
 */
function updateStatusBadge(elementId, value, minNormal, maxNormal, reverseLogic = false) {
  const badge = document.getElementById(elementId);
  
  if (!badge) {
    console.error('Badge element not found:', elementId);
    return;
  }
  
  if (!value || value === 0) {
    badge.textContent = 'No Data';
    badge.className = 'status-badge status-normal';
    return;
  }
  
  let status = 'Normal';
  
  if (reverseLogic) {
    // For oxygen: below threshold is bad
    if (value < minNormal) {
      status = 'Low';
    }
  } else {
    // For temp/HR: outside range is bad
    if (value > maxNormal) {
      status = 'High';
    } else if (value < minNormal) {
      status = 'Low';
    }
  }
  
  badge.textContent = status;
  badge.className = 'status-badge status-' + status.toLowerCase();
}

/**
 * Edit field inline (for Section 2 cards)
 */
function editField(fieldName) {
  const card = document.getElementById('card-' + fieldName);
  const currentValue = patientData[fieldName] || '';
  const cardTitle = card.querySelector('.card-title').textContent;
  
  let inputHTML = '';
  
  if (fieldName === 'patientStatus') {
    inputHTML = `
      <select class="card-select" id="input-${fieldName}">
        <option value="Normal" ${currentValue === 'Normal' ? 'selected' : ''}>Normal</option>
        <option value="Medium" ${currentValue === 'Medium' ? 'selected' : ''}>Medium</option>
        <option value="Critical" ${currentValue === 'Critical' ? 'selected' : ''}>Critical</option>
      </select>
    `;
  } else if (fieldName === 'hospital') {
    // Build hospital dropdown from database
    let hospitalOptions = '<option value="">Select Hospital</option>';
    hospitalsList.forEach(hospital => {
      const selected = currentValue === hospital.name ? 'selected' : '';
      hospitalOptions += `<option value="${hospital.name}" data-hospital-id="${hospital.hospital_id}" ${selected}>${hospital.name}</option>`;
    });
    
    inputHTML = `
      <select class="card-select" id="input-${fieldName}">
        ${hospitalOptions}
      </select>
    `;
  } else if (fieldName === 'diabeticsLevel') {
    inputHTML = `<input type="number" class="card-input" id="input-${fieldName}" value="${currentValue}" placeholder="Enter blood sugar level">`;
  } else {
    inputHTML = `<input type="text" class="card-input" id="input-${fieldName}" value="${currentValue}" placeholder="Enter value">`;
  }

  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">${cardTitle}</div>
      <div>
        <button class="save-btn" onclick="saveField('${fieldName}')">SAVE</button>
        <button class="cancel-btn" onclick="cancelEdit('${fieldName}')">CANCEL</button>
      </div>
    </div>
    ${inputHTML}
    <div class="card-subtext">Editing mode</div>
  `;

  document.getElementById('input-' + fieldName).focus();
}

/**
 * Save edited field to database
 */
function saveField(fieldName) {
  const inputElement = document.getElementById('input-' + fieldName);
  if (!inputElement) {
    console.error('Input element not found for field:', fieldName);
    return;
  }
  
  const newValue = inputElement.value;
  
  if (!newValue && fieldName !== 'bloodPressure') {
    alert('Please enter a value');
    return;
  }

  // Extract hospital_id for hospital field
  let hospitalID = '';
  if (fieldName === 'hospital') {
    const selectedOption = inputElement.options[inputElement.selectedIndex];
    hospitalID = selectedOption.getAttribute('data-hospital-id') || '';
  }

  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.classList.remove('hidden');
  }

  const formData = new FormData();
  formData.append('ambulanceID', currentAmbulanceID);
  formData.append('patientID', patientData.patientID || '');
  formData.append('fieldName', fieldName);
  formData.append('newValue', newValue);
  if (hospitalID) {
    formData.append('hospitalID', hospitalID);
  }

  fetch(API_BASE + 'update_patient.php', {
    method: 'POST',
    body: formData,
    credentials: 'same-origin'
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      // Update local cache
      patientData[fieldName] = newValue;
      renderDashboard(patientData);
      console.log('Field updated:', result);
    } else {
      alert('Error: ' + result.message);
    }
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
  })
  .catch(error => {
    alert('Error saving: ' + error.message);
    console.error('Save error:', error);
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
  });
}

/**
 * Cancel edit mode
 */
function cancelEdit(fieldName) {
  renderDashboard(patientData);
}

/**
 * Open patient details modal
 */
function openPatientDetailsModal() {
  // Pre-fill form with current data
  document.getElementById('modal-patientID').value = patientData.patientID || '';
  document.getElementById('modal-patientName').value = patientData.patientName || '';
  document.getElementById('modal-patientAge').value = patientData.patientAge || '';
  document.getElementById('modal-bloodGroup').value = patientData.bloodGroup || '';
  
  document.getElementById('patientDetailsModal').classList.add('active');
}

/**
 * Close patient details modal
 */
function closePatientDetailsModal() {
  document.getElementById('patientDetailsModal').classList.remove('active');
}

/**
 * Save patient details from modal
 */
function savePatientDetails(event) {
  event.preventDefault();
  
  document.getElementById('loadingOverlay').classList.remove('hidden');
  
  const updates = [
    { field: 'patientID', value: document.getElementById('modal-patientID').value },
    { field: 'patientName', value: document.getElementById('modal-patientName').value },
    { field: 'patientAge', value: document.getElementById('modal-patientAge').value },
    { field: 'bloodGroup', value: document.getElementById('modal-bloodGroup').value }
  ];
  
  // Update all fields sequentially
  updateFieldsSequentially(updates, 0);
}

/**
 * Update multiple fields sequentially
 */
function updateFieldsSequentially(updates, index) {
  if (index >= updates.length) {
    // All updates complete
    document.getElementById('loadingOverlay').classList.add('hidden');
    closePatientDetailsModal();
    loadPatientData(); // Refresh
    return;
  }
  
  const update = updates[index];
  
  if (!update.value) {
    // Skip empty values
    updateFieldsSequentially(updates, index + 1);
    return;
  }
  
  const formData = new FormData();
  formData.append('ambulanceID', currentAmbulanceID);
  formData.append('patientID', patientData.patientID || '');
  formData.append('fieldName', update.field);
  formData.append('newValue', update.value);

  fetch(API_BASE + 'update_patient.php', {
    method: 'POST',
    body: formData,
    credentials: 'same-origin'
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      patientData[update.field] = update.value;
    }
    // Continue to next field
    updateFieldsSequentially(updates, index + 1);
  })
  .catch(error => {
    console.error('Error updating ' + update.field + ':', error);
    // Continue anyway
    updateFieldsSequentially(updates, index + 1);
  });
}

/**
 * Start auto-refresh every 10 seconds
 */
function startAutoRefresh() {
  stopAutoRefresh();
  refreshInterval = setInterval(() => {
    console.log('Auto-refreshing patient data...');
    loadPatientData();
    checkIncomingCalls(); // Check for incoming calls from hospital
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
    fetch(API_BASE + 'logout.php', {
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
 * Start Video Call with Doctor
 */
function startVideoCall() {
  // Check if hospital is selected
  const hospitalField = document.getElementById('value-hospital');
  const selectedHospital = hospitalField ? hospitalField.textContent.trim() : '';
  
  if (!selectedHospital || selectedHospital === 'Not Selected') {
    alert('Please select a destination hospital before starting a video call.');
    return;
  }
  
  if (!currentAmbulanceID) {
    alert('Unable to start video call. Ambulance ID not found.');
    return;
  }
  
  const videoUrl = 'https://meet.google.com/jor-dzjy-seo';
  
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
 * Check for incoming video calls from hospital
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
