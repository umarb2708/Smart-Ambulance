/**
 * Smart Ambulance Dashboard - JavaScript
 * Handles data fetching, rendering, and real-time updates
 */

const API_BASE = 'api/';

let currentPatientID = null;
let refreshInterval = null;
let patientData = {};
let allPatientsData = {};

// Load on page load
window.addEventListener('load', function() {
  document.getElementById('loadingOverlay').classList.add('hidden');
  loadActivePatients();
});

/**
 * Load all active patients from database
 */
function loadActivePatients() {
  console.log('Loading active patients...');
  
  fetch(API_BASE + 'get_patients.php')
    .then(response => response.json())
    .then(result => {
      console.log('Received:', result);
      
      if (result.error) {
        alert('Error: ' + result.error);
        return;
      }
      
      allPatientsData = result.patients || {};
      console.log('Loaded ' + Object.keys(allPatientsData).length + ' active patients');
      
      const select = document.getElementById('patientSelect');
      select.innerHTML = '<option value="">-- Choose Patient ID --</option>';
      
      const patientIDs = Object.keys(allPatientsData);
      if (patientIDs.length === 0) {
        select.innerHTML += '<option value="" disabled>No active patients found</option>';
        return;
      }
      
      // Sort by patient ID
      patientIDs.sort();
      
      patientIDs.forEach(patientID => {
        const patient = allPatientsData[patientID];
        const option = document.createElement('option');
        option.value = patientID;
        option.textContent = patientID + ' - ' + (patient.patientName || 'No Name');
        select.appendChild(option);
      });
      
      console.log('Successfully loaded ' + patientIDs.length + ' patients into dropdown');
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to load patients: ' + error.message);
    });
}

/**
 * Load patient data from prefetched cache
 */
function loadPatientData() {
  const patientID = document.getElementById('patientSelect').value;
  
  if (!patientID) {
    document.getElementById('dashboardContent').innerHTML = 
      '<div class="no-data">Please select a patient from the dropdown above</div>';
    currentPatientID = null;
    stopAutoRefresh();
    return;
  }

  currentPatientID = patientID;
  const data = allPatientsData[patientID];
  
  if (!data) {
    alert('Patient not found in cache');
    return;
  }
  
  patientData = data;
  renderDashboard(data);
  startAutoRefresh();
}

/**
 * Render dashboard with patient data
 */
function renderDashboard(data) {
  const html = `
    <div class="section-title">Real-Time Vitals (Read-Only)</div>
    <section class="grid-3">
      <div class="card read-only">
        <div class="card-header">
          <div class="card-title">Body Temperature</div>
          <span class="status-badge status-${(data.tempStatus || 'normal').toLowerCase()}">${data.tempStatus || 'Normal'}</span>
        </div>
        <div class="card-value">${(data.temperature && data.temperature > 0) ? parseFloat(data.temperature).toFixed(1) + '°C' : 'Not Updated'}</div>
        <div class="card-subtext">From MLX90614 sensor</div>
      </div>

      <div class="card read-only">
        <div class="card-header">
          <div class="card-title">Heart Rate</div>
          <span class="status-badge status-${(data.heartRateStatus || 'normal').toLowerCase()}">${data.heartRateStatus || 'Normal'}</span>
        </div>
        <div class="card-value">${(data.heartRate && data.heartRate > 0) ? data.heartRate + ' BPM' : 'Not Updated'}</div>
        <div class="card-subtext">From MAX30102 sensor</div>
      </div>

      <div class="card read-only">
        <div class="card-header">
          <div class="card-title">Oxygen Level</div>
          <span class="status-badge status-${(data.oxygenStatus || 'normal').toLowerCase()}">${data.oxygenStatus || 'Normal'}</span>
        </div>
        <div class="card-value">${(data.oxygenLevel && data.oxygenLevel > 0) ? data.oxygenLevel + '%' : 'Not Updated'}</div>
        <div class="card-subtext">SpO₂ from MAX30102</div>
      </div>
    </section>

    <div class="section-title">Patient Information (Editable)</div>
    <section class="grid-2">
      ${renderEditableCard('patientName', 'Patient Name', data.patientName || 'Not Updated', 'text')}
      ${renderEditableCard('patientAge', 'Age', data.patientAge || 'Not Updated', 'number')}
      ${renderEditableCard('bloodGroup', 'Blood Group', data.bloodGroup || 'Not Updated', 'select', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])}
      ${renderEditableCard('patientStatus', 'Patient Status', data.patientStatus || 'Not Updated', 'select', ['Normal', 'Medium', 'Critical'])}
    </section>

    <div class="section-title">Medical Data (Editable)</div>
    <section class="grid-2">
      ${renderEditableCard('bloodPressure', 'Blood Pressure', data.bloodPressure || 'Not Updated', 'text')}
      ${renderEditableCard('diabeticsLevel', 'Blood Sugar Level', data.diabeticsLevel || 'Not Updated', 'number', null, 'mg/dL')}
    </section>

    <div class="section-title">Ambulance Details (Editable)</div>
    <section class="grid-2">
      ${renderEditableCard('ambulanceID', 'Ambulance ID', data.ambulanceID || 'Not Updated', 'text')}
      ${renderEditableCard('hospital', 'Destination Hospital', data.hospital || 'Not Updated', 'select', ['Hospital 1', 'Hospital 2', 'Hospital 3', 'Hospital 4'])}
    </section>

    <div class="card-subtext" style="text-align: center; margin-top: 20px; padding: 10px;">
      Last updated: ${data.date ? new Date(data.date).toLocaleString() : 'Not Updated'}
    </div>
  `;

  document.getElementById('dashboardContent').innerHTML = html;
}

/**
 * Render editable card
 */
function renderEditableCard(fieldName, title, value, inputType, options, unit) {
  let displayValue = value;
  if (value !== 'Not Updated' && unit) displayValue += ' ' + unit;

  return `
    <div class="card editable" id="card-${fieldName}">
      <div class="card-header">
        <div class="card-title">${title}</div>
        <button class="edit-btn" onclick="editField('${fieldName}')">EDIT</button>
      </div>
      <div class="card-value" id="value-${fieldName}">${displayValue}</div>
      <div class="card-subtext">Click EDIT to modify</div>
    </div>
  `;
}

/**
 * Edit field inline
 */
function editField(fieldName) {
  const card = document.getElementById('card-' + fieldName);
  const currentValue = patientData[fieldName] || '';
  
  let inputHTML = '';
  
  if (fieldName === 'bloodGroup') {
    inputHTML = `
      <select class="card-select" id="input-${fieldName}">
        <option value="">Select...</option>
        <option value="A+" ${currentValue === 'A+' ? 'selected' : ''}>A+</option>
        <option value="A-" ${currentValue === 'A-' ? 'selected' : ''}>A-</option>
        <option value="B+" ${currentValue === 'B+' ? 'selected' : ''}>B+</option>
        <option value="B-" ${currentValue === 'B-' ? 'selected' : ''}>B-</option>
        <option value="AB+" ${currentValue === 'AB+' ? 'selected' : ''}>AB+</option>
        <option value="AB-" ${currentValue === 'AB-' ? 'selected' : ''}>AB-</option>
        <option value="O+" ${currentValue === 'O+' ? 'selected' : ''}>O+</option>
        <option value="O-" ${currentValue === 'O-' ? 'selected' : ''}>O-</option>
      </select>
    `;
  } else if (fieldName === 'patientStatus') {
    inputHTML = `
      <select class="card-select" id="input-${fieldName}">
        <option value="">Select...</option>
        <option value="Normal" ${currentValue === 'Normal' ? 'selected' : ''}>Normal</option>
        <option value="Medium" ${currentValue === 'Medium' ? 'selected' : ''}>Medium</option>
        <option value="Critical" ${currentValue === 'Critical' ? 'selected' : ''}>Critical</option>
      </select>
    `;
  } else if (fieldName === 'hospital') {
    inputHTML = `
      <select class="card-select" id="input-${fieldName}">
        <option value="">Select...</option>
        <option value="Hospital 1" ${currentValue === 'Hospital 1' ? 'selected' : ''}>Hospital 1</option>
        <option value="Hospital 2" ${currentValue === 'Hospital 2' ? 'selected' : ''}>Hospital 2</option>
        <option value="Hospital 3" ${currentValue === 'Hospital 3' ? 'selected' : ''}>Hospital 3</option>
        <option value="Hospital 4" ${currentValue === 'Hospital 4' ? 'selected' : ''}>Hospital 4</option>
      </select>
    `;
  } else {
    const inputTypeAttr = fieldName === 'patientAge' || fieldName === 'diabeticsLevel' ? 'number' : 'text';
    inputHTML = `<input type="${inputTypeAttr}" class="card-input" id="input-${fieldName}" value="${currentValue}">`;
  }

  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">${card.querySelector('.card-title').textContent}</div>
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
  const newValue = document.getElementById('input-' + fieldName).value;
  
  if (!newValue) {
    alert('Please enter a value');
    return;
  }

  document.getElementById('loadingOverlay').classList.remove('hidden');

  const formData = new FormData();
  formData.append('patientID', currentPatientID);
  formData.append('fieldName', fieldName);
  formData.append('newValue', newValue);

  fetch(API_BASE + 'update_patient.php', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      // Update local cache
      patientData[fieldName] = newValue;
      allPatientsData[currentPatientID][fieldName] = newValue;
      renderDashboard(patientData);
      console.log('Field updated:', result);
    } else {
      alert('Error: ' + result.message);
    }
    document.getElementById('loadingOverlay').classList.add('hidden');
  })
  .catch(error => {
    alert('Error saving: ' + error.message);
    document.getElementById('loadingOverlay').classList.add('hidden');
  });
}

/**
 * Cancel edit mode
 */
function cancelEdit(fieldName) {
  renderDashboard(patientData);
}

/**
 * Start auto-refresh every 10 seconds
 */
function startAutoRefresh() {
  stopAutoRefresh();
  refreshInterval = setInterval(() => {
    console.log('Auto-refreshing all patient data...');
    
    fetch(API_BASE + 'get_patients.php')
      .then(response => response.json())
      .then(result => {
        if (result.error) {
          console.error('Error during auto-refresh:', result.error);
          return;
        }
        
        allPatientsData = result.patients || {};
        console.log('Refreshed data for ' + Object.keys(allPatientsData).length + ' patients');
        
        // If current patient is still active, refresh display
        if (currentPatientID && allPatientsData[currentPatientID]) {
          patientData = allPatientsData[currentPatientID];
          renderDashboard(patientData);
        } else if (currentPatientID) {
          // Patient may have been marked as Done
          document.getElementById('dashboardContent').innerHTML = 
            '<div class="no-data" style="color: #e74c3c;">This patient is no longer active</div>';
          currentPatientID = null;
          loadActivePatients(); // Reload dropdown
        }
      })
      .catch(error => console.error('Auto-refresh failed:', error));
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

// Stop refresh when page unloads
window.addEventListener('beforeunload', stopAutoRefresh);
