/*
 * Smart Ambulance System - Hospital Dashboard (Google Apps Script)
 * 
 * Features:
 * - Real-time patient monitoring from ambulance
 * - Display all vital signs and patient information
 * - Show ambulance location and speed
 * - Video call integration
 * - Auto-refresh dashboard
 */

// REPLACE THIS with your actual Sheet ID
const SHEET_ID = '1WjA7BY2YwZ1ajugWZ_nSZNeK3lwlnczdBURp-DtBgOQ';
const SHEET_NAME = 'DataBase';

// Serve Hospital Dashboard HTML
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('HospitalDashboard')
      .setTitle('Hospital Unit Dashboard')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Get all active patients
function getAllActivePatients() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();
    
    var patients = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      // Only include patients where Done != 1
      if (row[4] && row[18] != 1) {
        patients.push({
          date: row[0],
          patientName: row[1] || 'N/A',
          patientAge: row[2] || 'N/A',
          bloodGroup: row[3] || 'N/A',
          patientID: row[4],
          patientStatus: row[5] || 'Normal',
          temperature: row[6] || '0',
          oxygenLevel: row[7] || '0',
          heartRate: row[8] || '0',
          bloodPressure: row[9] || 'N/A',
          diabeticsLevel: row[10] || 'N/A',
          ambulanceID: row[11] || 'N/A',
          ambulanceSpeed: row[12] || '0',
          ambulanceLong: row[13] || '0',
          ambulanceLatti: row[14] || '0',
          nextTrafficInt: row[15] || 'N/A',
          pastTrafficInt: row[16] || 'N/A',
          attenderID: row[16] || 'N/A',
          hospital: row[17] || 'N/A',
          done: row[18] || 0,
          
          // Status indicators
          tempStatus: getTemperatureStatus(row[6]),
          heartRateStatus: getHeartRateStatus(row[8]),
          oxygenStatus: getOxygenStatus(row[7]),
          bpStatus: 'Normal',
          sugarStatus: getSugarStatus(row[10])
        });
      }
    }
    
    return patients;
  } catch (error) {
    return { error: error.message };
  }
}

// Get specific patient data by ID
function getPatientData(patientID) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][4] === patientID) {
        var row = data[i];
        
        return {
          date: row[0],
          patientName: row[1] || 'N/A',
          patientAge: row[2] || 'N/A',
          bloodGroup: row[3] || 'N/A',
          patientID: row[4],
          patientStatus: row[5] || 'Normal',
          temperature: row[6] || '0',
          oxygenLevel: row[7] || '0',
          heartRate: row[8] || '0',
          bloodPressure: row[9] || 'N/A',
          diabeticsLevel: row[10] || 'N/A',
          ambulanceID: row[11] || 'N/A',
          ambulanceSpeed: row[12] || '0',
          ambulanceLong: row[13] || '0',
          ambulanceLatti: row[14] || '0',
          nextTrafficInt: row[15] || 'N/A',
          pastTrafficInt: row[16] || 'N/A',
          attenderID: row[16] || 'N/A',
          hospital: row[17] || 'N/A',
          done: row[18] || 0,
          
          tempStatus: getTemperatureStatus(row[6]),
          heartRateStatus: getHeartRateStatus(row[8]),
          oxygenStatus: getOxygenStatus(row[7]),
          bpStatus: 'Normal',
          sugarStatus: getSugarStatus(row[10])
        };
      }
    }
    
    return null;
  } catch (error) {
    return { error: error.message };
  }
}

// Get latest active patient
function getLatestActivePatient() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  
  // Find most recent patient where Done != 1
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][4] && data[i][18] != 1) {
      return data[i][4];
    }
  }
  
  return null;
}

// Mark patient as done (reached hospital)
function markPatientAsDone(patientID) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][4] === patientID) {
        sheet.getRange(i + 1, 19).setValue(1); // Column S (Done)
        return { success: true, message: 'Patient marked as done' };
      }
    }
    
    return { success: false, message: 'Patient ID not found' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Status determination functions
function getTemperatureStatus(temp) {
  if (!temp || temp === 0) return 'Normal';
  temp = parseFloat(temp);
  if (temp >= 36.1 && temp <= 37.2) return 'Normal';
  if (temp > 37.2) return 'High';
  return 'Low';
}

function getHeartRateStatus(hr) {
  if (!hr || hr === 0) return 'Normal';
  hr = parseInt(hr);
  if (hr >= 60 && hr <= 100) return 'Normal';
  if (hr > 100) return 'High';
  return 'Low';
}

function getOxygenStatus(spo2) {
  if (!spo2 || spo2 === 0) return 'Normal';
  spo2 = parseInt(spo2);
  if (spo2 >= 95) return 'Normal';
  if (spo2 >= 90) return 'Low';
  return 'Critical';
}

function getSugarStatus(sugar) {
  if (!sugar || sugar === 0) return 'Normal';
  sugar = parseInt(sugar);
  if (sugar >= 80 && sugar <= 140) return 'Normal';
  if (sugar > 140) return 'High';
  return 'Low';
}

// Get ambulance location description
function getLocationDescription(latitude, longitude) {
  // This is a placeholder. In production, you could integrate with
  // Google Maps Geocoding API for reverse geocoding
  if (latitude && longitude && latitude != 0 && longitude != 0) {
    return 'Lat: ' + latitude + ', Long: ' + longitude;
  }
  return 'Location not available';
}
