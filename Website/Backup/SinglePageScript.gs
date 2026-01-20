/*
 * Smart Ambulance System - Single Page Dashboard (Google Apps Script)
 * 
 * Features:
 * - Single page dashboard with patient selector
 * - Editable manual fields
 * - Read-only NodeMCU sensor data
 * - Auto-refresh every 10 seconds
 */

// REPLACE THIS with your actual Sheet ID
const SHEET_ID = '1WjA7BY2YwZ1ajugWZ_nSZNeK3lwlnczdBURp-DtBgOQ';
const SHEET_NAME = 'DataBase';

// Serve HTML page
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Smart Ambulance Dashboard')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Handle data upload from ESP32 (unchanged from original)
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

// Handle ESP32 sensor data upload (optimized with batch update)
function handleESP32Upload(params) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    var patientID = params.patientID || '';
    var temperature = params.temperature || '';
    var oxygenLevel = params.oxygenLevel || '';
    var heartRate = params.heartRate || '';
    var ambulanceID = params.ambulanceID || '';
    var speed = params.speed || '';
    var longitude = params.longitude || '';
    var latitude = params.latitude || '';
    var nextTrafficInt = params.nextTrafficInt || '';
    var pastTrafficInt = params.pastTrafficInt || '';
    var hospital = params.hospital || '';
    
    // Single read of all data
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;
    
    // Find existing row with this Patient ID (case-insensitive search)
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][4]).trim().toLowerCase() === String(patientID).trim().toLowerCase()) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      // New patient - create new row
      var newRow = [
        new Date(), '', '', '', patientID, '', temperature, oxygenLevel, heartRate,
        '', '', ambulanceID, speed, longitude, latitude, nextTrafficInt, pastTrafficInt, hospital, 0
      ];
      sheet.appendRow(newRow);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'New patient created',
        patientID: patientID
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      // Batch update - all NodeMCU fields at once
      var updates = [
        [new Date(), temperature, oxygenLevel, heartRate, ambulanceID, 
         speed, longitude, latitude, nextTrafficInt, pastTrafficInt, hospital]
      ];
      
      // Update columns A, G, H, I, L, M, N, O, P, Q, R in one operation
      sheet.getRange(rowIndex, 1, 1, 1).setValue(new Date());
      sheet.getRange(rowIndex, 7, 1, 3).setValues([[temperature, oxygenLevel, heartRate]]);
      sheet.getRange(rowIndex, 12, 1, 7).setValues([[ambulanceID, speed, longitude, latitude, nextTrafficInt, pastTrafficInt, hospital]]);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Patient data updated',
        patientID: patientID
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('Error in handleESP32Upload: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Get all active patients with full data (prefetch optimization)
function getAllActivePatientsData() {
  try {
    Logger.log('getAllActivePatientsData called');
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      Logger.log('Sheet not found');
      return { error: 'Sheet not found' };
    }
    
    var range = sheet.getDataRange();
    if (!range) {
      Logger.log('No data range');
      return { patients: {} };
    }
    
    var data = range.getValues();
    Logger.log('Data rows: ' + data.length);
    
    if (!data || data.length < 2) {
      Logger.log('No patient data (only header or empty)');
      return { patients: {} };
    }
    
    var patientsData = {};
    
    // Process all active patients
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row) continue;
      
      var done = row[18]; // Column S (Done)
      var patientID = row[4]; // Column E (Patient ID)
      
      Logger.log('Row ' + i + ': PatientID=' + patientID + ', Done=' + done);
      
      if (!patientID || done == 1) continue;
      
      // Calculate status for vitals
      var temperature = parseFloat(row[6]) || 0;
      var heartRate = parseInt(row[8]) || 0;
      var oxygenLevel = parseInt(row[7]) || 0;
      
      var tempStatus = 'Normal';
      if (temperature > 38) tempStatus = 'High';
      else if (temperature < 36 && temperature > 0) tempStatus = 'Low';
      
      var heartRateStatus = 'Normal';
      if (heartRate > 100) heartRateStatus = 'High';
      else if (heartRate < 60 && heartRate > 0) heartRateStatus = 'Low';
      
      var oxygenStatus = 'Normal';
      if (oxygenLevel < 95 && oxygenLevel > 0) oxygenStatus = 'Low';
      
      // Store complete patient data by ID
      patientsData[String(patientID).trim()] = {
        date: row[0] || new Date(),
        patientName: String(row[1] || ''),
        patientAge: String(row[2] || ''),
        bloodGroup: String(row[3] || ''),
        patientID: String(row[4] || ''),
        patientStatus: String(row[5] || ''),
        temperature: temperature,
        oxygenLevel: oxygenLevel,
        heartRate: heartRate,
        bloodPressure: String(row[9] || ''),
        diabeticsLevel: String(row[10] || ''),
        ambulanceID: String(row[11] || ''),
        speed: String(row[12] || ''),
        longitude: String(row[13] || ''),
        latitude: String(row[14] || ''),
        nextTrafficInt: String(row[15] || ''),
        pastTrafficInt: String(row[16] || ''),
        hospital: String(row[17] || ''),
        done: row[18] || 0,
        tempStatus: tempStatus,
        heartRateStatus: heartRateStatus,
        oxygenStatus: oxygenStatus
      };
    }
    
    Logger.log('Found ' + Object.keys(patientsData).length + ' active patients');
    return { patients: patientsData };
  } catch (error) {
    Logger.log('Error in getAllActivePatientsData: ' + error.message + ' - Stack: ' + error.stack);
    return { error: error.message };
  }
}

// Get all active patients (optimized - single read, returns JSON)
function getActivePatients() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    // Single batch read
    var range = sheet.getDataRange();
    var data = range.getValues();
    
    var patients = [];
    
    // Process in memory - much faster than multiple reads
    for (var i = 1; i < data.length; i++) {
      var done = data[i][18]; // Column S (Done)
      var patientID = data[i][4]; // Column E (Patient ID)
      var patientName = data[i][1]; // Column B (Patient Name)
      
      if (patientID && done != 1) {
        patients.push({
          id: String(patientID).trim(),
          name: patientName || 'No Name'
        });
      }
    }
    
    return patients;
  } catch (error) {
    Logger.log('Error in getActivePatients: ' + error.message);
    return [];
  }
}

// Get patient data by ID (optimized - single read, returns JSON object)
function getPatientData(patientID) {
  try {
    // Validate input
    if (!patientID) {
      return { error: 'Patient ID is required' };
    }
    
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return { error: 'Sheet not found' };
    }
    
    // Single batch read - read all data once
    var range = sheet.getDataRange();
    if (!range) {
      return { error: 'No data in sheet' };
    }
    
    var data = range.getValues();
    if (!data || data.length < 2) {
      return { error: 'No patient data available' };
    }
    
    var searchPatientID = String(patientID).trim().toLowerCase();
    
    // Search in memory - much faster
    for (var i = 1; i < data.length; i++) {
      if (!data[i] || !data[i][4]) continue;
      
      var sheetPatientID = String(data[i][4]).trim().toLowerCase();
      
      if (sheetPatientID === searchPatientID) {
        var row = data[i];
        
        // Calculate status for vitals in memory
        var temperature = parseFloat(row[6]) || 0;
        var heartRate = parseInt(row[8]) || 0;
        var oxygenLevel = parseInt(row[7]) || 0;
        
        var tempStatus = 'Normal';
        if (temperature > 38) tempStatus = 'High';
        else if (temperature < 36 && temperature > 0) tempStatus = 'Low';
        
        var heartRateStatus = 'Normal';
        if (heartRate > 100) heartRateStatus = 'High';
        else if (heartRate < 60 && heartRate > 0) heartRateStatus = 'Low';
        
        var oxygenStatus = 'Normal';
        if (oxygenLevel < 95 && oxygenLevel > 0) oxygenStatus = 'Low';
        
        // Return complete JSON object - never null
        return {
          date: row[0] || new Date(),
          patientName: String(row[1] || ''),
          patientAge: String(row[2] || ''),
          bloodGroup: String(row[3] || ''),
          patientID: String(row[4] || ''),
          patientStatus: String(row[5] || ''),
          temperature: temperature,
          oxygenLevel: oxygenLevel,
          heartRate: heartRate,
          bloodPressure: String(row[9] || ''),
          diabeticsLevel: String(row[10] || ''),
          ambulanceID: String(row[11] || ''),
          speed: String(row[12] || ''),
          longitude: String(row[13] || ''),
          latitude: String(row[14] || ''),
          nextTrafficInt: String(row[15] || ''),
          pastTrafficInt: String(row[16] || ''),
          hospital: String(row[17] || ''),
          done: row[18] || 0,
          tempStatus: tempStatus,
          heartRateStatus: heartRateStatus,
          oxygenStatus: oxygenStatus
        };
      }
    }
    
    return { error: 'Patient not found: ' + patientID };
  } catch (error) {
    Logger.log('Error in getPatientData: ' + error.message + ' - Stack: ' + error.stack);
    return { error: 'Error loading patient data: ' + error.message };
  }
}

// Update a specific patient field (optimized - single write operation)
function updatePatientField(patientID, fieldName, newValue) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    // Single batch read
    var data = sheet.getDataRange().getValues();
    var searchPatientID = String(patientID).trim().toLowerCase();
    
    // Find patient row in memory
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      var sheetPatientID = String(data[i][4]).trim().toLowerCase();
      if (sheetPatientID === searchPatientID) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { success: false, message: 'Patient not found: ' + patientID };
    }
    
    // Map field names to column numbers (1-indexed)
    var fieldMap = {
      'patientName': 2,      // Column B
      'patientAge': 3,       // Column C
      'bloodGroup': 4,       // Column D
      'patientStatus': 6,    // Column F
      'bloodPressure': 10,   // Column J
      'diabeticsLevel': 11,  // Column K
      'ambulanceID': 12,     // Column L
      'hospital': 18         // Column R
    };
    
    var columnIndex = fieldMap[fieldName];
    
    if (!columnIndex) {
      return { success: false, message: 'Invalid field name: ' + fieldName };
    }
    
    // Single write operation
    sheet.getRange(rowIndex, columnIndex).setValue(newValue);
    
    // Return JSON response
    return { 
      success: true, 
      message: 'Field updated successfully',
      field: fieldName,
      value: newValue,
      patientID: patientID
    };
  } catch (error) {
    Logger.log('Error in updatePatientField: ' + error.message);
    return { success: false, message: error.message };
  }
}
