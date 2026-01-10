// Google Apps Script untuk Sistem Pengurusan Aset HTAR
// Author: HTAR Emergency & Trauma Department
// Version: 1.0

// Configuration
const CONFIG = {
  SHEET_NAMES: {
    MEDICAL: 'medical_assets',
    NON_MEDICAL: 'non_medical_assets',
    MAINTENANCE: 'maintenance_logs',
    USERS: 'users'
  },
  HEADERS: {
    MEDICAL: ['id', 'assetNo', 'name', 'category', 'brand', 'model', 'location', 'status', 'lastPPM', 'nextPPM', 'notes', 'images', 'createdAt', 'updatedAt'],
    NON_MEDICAL: ['id', 'assetNo', 'name', 'category', 'brand', 'model', 'location', 'status', 'lastService', 'nextService', 'notes', 'images', 'createdAt', 'updatedAt']
  }
};

// Initialize the spreadsheet
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// Get or create sheet
function getOrCreateSheet(sheetName, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

// Convert array to object using headers
function rowToObject(row, headers) {
  const obj = {};
  headers.forEach((header, index) => {
    obj[header] = row[index] || '';
  });
  return obj;
}

// Convert object to array using headers
function objectToRow(obj, headers) {
  return headers.map(header => obj[header] || '');
}

// Get all data from sheet
function getAllData(sheetName) {
  try {
    const headers = sheetName === CONFIG.SHEET_NAMES.MEDICAL ? 
      CONFIG.HEADERS.MEDICAL : CONFIG.HEADERS.NON_MEDICAL;
    
    const sheet = getOrCreateSheet(sheetName, headers);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return []; // No data except headers
    
    const headersRow = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headersRow.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  } catch (error) {
    console.error('Error getting data:', error);
    return [];
  }
}

// Save data to sheet
function saveData(sheetName, data) {
  try {
    const headers = sheetName === CONFIG.SHEET_NAMES.MEDICAL ? 
      CONFIG.HEADERS.MEDICAL : CONFIG.HEADERS.NON_MEDICAL;
    
    const sheet = getOrCreateSheet(sheetName, headers);
    
    // Generate ID if not exists
    if (!data.id) {
      data.id = Utilities.getUuid();
    }
    
    // Set timestamps
    const now = new Date().toISOString();
    if (!data.createdAt) {
      data.createdAt = now;
    }
    data.updatedAt = now;
    
    // Convert images array to string if needed
    if (Array.isArray(data.images)) {
      data.images = JSON.stringify(data.images);
    }
    
    // Convert to row
    const row = objectToRow(data, headers);
    
    // Append to sheet
    sheet.appendRow(row);
    
    return {
      success: true,
      id: data.id,
      message: 'Data saved successfully'
    };
  } catch (error) {
    console.error('Error saving data:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Update data in sheet
function updateData(sheetName, assetId, newData) {
  try {
    const headers = sheetName === CONFIG.SHEET_NAMES.MEDICAL ? 
      CONFIG.HEADERS.MEDICAL : CONFIG.HEADERS.NON_MEDICAL;
    
    const sheet = getOrCreateSheet(sheetName, headers);
    const data = sheet.getDataRange().getValues();
    const headersRow = data[0];
    
    // Find the row index of the asset
    const idIndex = headersRow.indexOf('id');
    let rowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === assetId) {
        rowIndex = i;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return {
        success: false,
        error: 'Asset not found'
      };
    }
    
    // Get existing data
    const existingData = {};
    headersRow.forEach((header, index) => {
      existingData[header] = data[rowIndex][index] || '';
    });
    
    // Merge with new data
    const updatedData = { ...existingData, ...newData };
    updatedData.updatedAt = new Date().toISOString();
    
    // Convert images array to string if needed
    if (Array.isArray(updatedData.images)) {
      updatedData.images = JSON.stringify(updatedData.images);
    }
    
    // Update the row
    const updatedRow = objectToRow(updatedData, headers);
    sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([updatedRow]);
    
    return {
      success: true,
      id: assetId,
      message: 'Data updated successfully'
    };
  } catch (error) {
    console.error('Error updating data:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Delete data from sheet
function deleteData(sheetName, assetId) {
  try {
    const sheet = getOrCreateSheet(sheetName, 
      sheetName === CONFIG.SHEET_NAMES.MEDICAL ? 
      CONFIG.HEADERS.MEDICAL : CONFIG.HEADERS.NON_MEDICAL);
    
    const data = sheet.getDataRange().getValues();
    const headersRow = data[0];
    const idIndex = headersRow.indexOf('id');
    
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === assetId) {
        rowIndex = i;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return {
        success: false,
        error: 'Asset not found'
      };
    }
    
    // Delete the row
    sheet.deleteRow(rowIndex + 1);
    
    return {
      success: true,
      message: 'Data deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting data:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Main doGet function (for fetching data)
function doGet(e) {
  try {
    const params = e.parameter;
    const action = params.action || 'get';
    const sheetName = params.sheet;
    
    let response;
    
    if (action === 'get') {
      if (!sheetName) {
        throw new Error('Sheet name is required');
      }
      
      const data = getAllData(sheetName);
      response = {
        success: true,
        data: data,
        count: data.length,
        timestamp: new Date().toISOString()
      };
    } else {
      response = {
        success: false,
        error: 'Invalid action for GET request'
      };
    }
    
    return createJsonResponse(response);
  } catch (error) {
    console.error('Error in doGet:', error);
    return createJsonResponse({
      success: false,
      error: error.toString()
    }, 400);
  }
}

// Main doPost function (for saving/updating/deleting data)
function doPost(e) {
  try {
    const content = e.postData.contents;
    const data = JSON.parse(content);
    const action = data.action;
    const sheetName = data.sheet;
    
    if (!action || !sheetName) {
      throw new Error('Action and sheet name are required');
    }
    
    let response;
    
    switch (action) {
      case 'save':
        if (!data.data) {
          throw new Error('Data is required for save action');
        }
        response = saveData(sheetName, data.data);
        break;
        
      case 'update':
        if (!data.id || !data.data) {
          throw new Error('ID and data are required for update action');
        }
        response = updateData(sheetName, data.id, data.data);
        break;
        
      case 'delete':
        if (!data.id) {
          throw new Error('ID is required for delete action');
        }
        response = deleteData(sheetName, data.id);
        break;
        
      default:
        response = {
          success: false,
          error: 'Invalid action'
        };
    }
    
    return createJsonResponse(response);
  } catch (error) {
    console.error('Error in doPost:', error);
    return createJsonResponse({
      success: false,
      error: error.toString()
    }, 400);
  }
}

// Helper function to create JSON response
function createJsonResponse(data, statusCode = 200) {
  const response = ContentService.createTextOutput(JSON.stringify(data));
  response.setMimeType(ContentService.MimeType.JSON);
  
  // Set CORS headers for web access
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // For OPTIONS requests (preflight)
  if (statusCode !== 200) {
    response.setStatusCode(statusCode);
  }
  
  return response;
}

// Test function (run this in Apps Script editor to test)
function testAPI() {
  // Test getting data
  const testData = {
    assetNo: 'TEST001',
    name: 'Test Equipment',
    category: 'monitor',
    brand: 'Test Brand',
    model: 'Test Model',
    location: 'Red Zone',
    status: 'aktif',
    lastPPM: '2024-01-15',
    nextPPM: '2024-02-15',
    notes: 'Test equipment for development'
  };
  
  // Test save
  const saveResult = saveData(CONFIG.SHEET_NAMES.MEDICAL, testData);
  Logger.log('Save result:', saveResult);
  
  if (saveResult.success) {
    // Test get
    const allData = getAllData(CONFIG.SHEET_NAMES.MEDICAL);
    Logger.log('All data:', allData);
    
    // Test update
    const updateData = {
      status: 'baik pulih',
      notes: 'Updated during testing'
    };
    
    const updateResult = updateData(CONFIG.SHEET_NAMES.MEDICAL, saveResult.id, updateData);
    Logger.log('Update result:', updateResult);
    
    // Test delete
    const deleteResult = deleteData(CONFIG.SHEET_NAMES.MEDICAL, saveResult.id);
    Logger.log('Delete result:', deleteResult);
  }
}

// Initialize sheets on first run
function initializeSheets() {
  getOrCreateSheet(CONFIG.SHEET_NAMES.MEDICAL, CONFIG.HEADERS.MEDICAL);
  getOrCreateSheet(CONFIG.SHEET_NAMES.NON_MEDICAL, CONFIG.HEADERS.NON_MEDICAL);
  
  Logger.log('Sheets initialized successfully');
  return 'Sheets initialized successfully';
}