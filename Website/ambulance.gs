/*
 * Smart Ambulance System - Ambulance Dashboard (Google Apps Script)
 * 
 * Features:
 * - Start page with button
 * - Form to collect manual patient data
 * - Auto-sync with NodeMCU uploaded data
 * - Dashboard with real-time vitals
 * - Auto-refresh every 10 seconds
 */

// REPLACE THIS with your actual Sheet ID
const SHEET_ID = '1WjA7BY2YwZ1ajugWZ_nSZNeK3lwlnczdBURp-DtBgOQ';
const SHEET_NAME = 'DataBase';

// Serve HTML pages
function doGet(e) {
  var page = e.parameter.page || 'start';
  
  if (page === 'start') {
    return HtmlService.createHtmlOutputFromFile('AmbulanceStart')
        .setTitle('Smart Ambulance System')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (page === 'form') {
    return HtmlService.createHtmlOutputFromFile('AmbulanceForm')
        .setTitle('Patient Data Entry')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (page === 'dashboard') {
    return HtmlService.createHtmlOutputFromFile('AmbulanceDashboard')
        .setTitle('Ambulance Dashboard')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  // Default: return start page
  return HtmlService.createHtmlOutputFromFile('AmbulanceStart')
      .setTitle('Smart Ambulance System');
}

// Handle data upload from ESP32
function doPost(e) {
  try {
    var params = e.parameter;
    var action = params.action || '';
    
    if (action === 'upload') {
      return handleESP32Upload(params);
    }
    
    return ContentService.createTextOutput('Unknown action');
  } catch (error) {
    return ContentService.createTextOutput('Error: ' + error.message);
  }
}

// Handle ESP32 sensor data upload
function handleESP32Upload(params) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  var patientID = params.patientID || '';
  var ambulanceID = params.ambulanceID || '';
  var temperature = params.temperature || '';
  var heartRate = params.heartRate || '';
  var spo2 = params.spo2 || '';
  var latitude = params.latitude || '';
  var longitude = params.longitude || '';
  var speed = params.speed || '';
  
  // Find existing row with this Patient ID
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][4] === patientID && data[i][18] != 1) { // Column E (Patient ID), Column S (Done)
      rowIndex = i + 1;
      break;
    }
  }
  
  // If not found, create new row
  if (rowIndex === -1) {
    var newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 1).setValue(new Date()); // Date
    sheet.getRange(newRow, 5).setValue(patientID); // Patient ID
    rowIndex = newRow;
  }
  
  // Update sensor data
  sheet.getRange(rowIndex, 1).setValue(new Date()); // Date - Column A
  sheet.getRange(rowIndex, 7).setValue(temperature); // Temperature - Column G
  sheet.getRange(rowIndex, 8).setValue(spo2); // Oxygen Level - Column H
  sheet.getRange(rowIndex, 9).setValue(heartRate); // Heart Rate - Column I
  sheet.getRange(rowIndex, 12).setValue(ambulanceID); // Ambulance ID - Column L
  sheet.getRange(rowIndex, 13).setValue(speed); // Ambulance Speed - Column M
  sheet.getRange(rowIndex, 14).setValue(longitude); // Ambulance Long - Column N
  sheet.getRange(rowIndex, 15).setValue(latitude); // Ambulance Latti - Column O
  
  // Check if patient is marked as done
  var done = sheet.getRange(rowIndex, 19).getValue(); // Column S (Done)
  if (done == 1) {
    return ContentService.createTextOutput('DONE');
  }
  
  // Return hospital info
  var hospital = sheet.getRange(rowIndex, 18).getValue(); // Column R (Hospital)
  return ContentService.createTextOutput('OK|HOSPITAL:' + hospital);
}

// Get available Patient IDs (where Done is not 1)
function getAvailablePatientIDs() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  
  var availableIDs = [];
  
  for (var i = 1; i < data.length; i++) {
    var patientID = data[i][4]; // Column E (Patient ID)
    var done = data[i][18]; // Column S (Done)
    
    if (patientID && done != 1) {
      availableIDs.push(patientID);
    }
  }
  
  return availableIDs;
}

// Submit manual data from form
function submitManualData(formData) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();
    
    // Find row with matching Patient ID
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][4] === formData.patientID) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { success: false, message: 'Patient ID not found' };
    }
    
    // Update manual data fields
    sheet.getRange(rowIndex, 2).setValue(formData.patientName); // Column B
    sheet.getRange(rowIndex, 3).setValue(formData.patientAge); // Column C
    sheet.getRange(rowIndex, 4).setValue(formData.bloodGroup); // Column D
    sheet.getRange(rowIndex, 6).setValue(formData.patientStatus); // Column F
    sheet.getRange(rowIndex, 10).setValue(formData.bloodPressure); // Column J
    sheet.getRange(rowIndex, 11).setValue(formData.diabeticsLevel); // Column K
    sheet.getRange(rowIndex, 12).setValue(formData.ambulanceID); // Column L (override)
    sheet.getRange(rowIndex, 17).setValue(formData.attenderID); // Column Q
    sheet.getRange(rowIndex, 18).setValue(formData.hospital); // Column R
    
    return { success: true, message: 'Data submitted successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Get dashboard data for a specific Patient ID
function getDashboardData(patientID) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();
    
    // Find row with matching Patient ID
    for (var i = 1; i < data.length; i++) {
      if (data[i][4] === patientID) {
        var row = data[i];
        
        // Map to dashboard object
        var dashboardData = {
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
          
          // Determine status badges
          tempStatus: getTemperatureStatus(row[6]),
          heartRateStatus: getHeartRateStatus(row[8]),
          oxygenStatus: getOxygenStatus(row[7]),
          bpStatus: 'Normal',
          sugarStatus: getSugarStatus(row[10])
        };
        
        return dashboardData;
      }
    }
    
    return null;
  } catch (error) {
    return { error: error.message };
  }
}

// Get latest active Patient ID
function getLatestActivePatientID() {
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
