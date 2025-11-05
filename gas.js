// ---- CODE FOR UI BACKEND ----
const registrationWorkbookId = '1k6k68Upe41ct_hwa-1VQbnCN6rtFiPZXSal_uPYMOfg';
const formDataSheetName = 'FormData';

function doGet(e) {
  try {
    // Check if this is a search request
    if (e.parameter && (e.parameter.towerFlat || e.parameter.name || e.parameter.apartments)) {
      if (e.parameter.apartments === 'true') {
        // Return unique tower-flat combinations for dropdown
        return getApartmentsList();
      } else {
        // Perform search
        return searchRegistrations(e.parameter);
      }
    }

    // Default test endpoint
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'GAS script is working',
      timestamp: new Date().toISOString()
    }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('doGet error: ' + error.toString());
    return errorResponse('Internal server error: ' + error.toString());
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(3000); // Wait 3 seconds for others to release the lock

    Logger.log('doPost called with data: ' + JSON.stringify(e)); // Debug log

    // Parse JSON data
    var requestData;
    if (e.postData && e.postData.contents) {
      Logger.log('PostData type: ' + e.postData.type); // Debug log
      Logger.log('PostData length: ' + e.postData.contents.length); // Debug log

      try {
        requestData = JSON.parse(e.postData.contents);
        Logger.log('Parsed as JSON data'); // Debug log
      } catch (jsonError) {
        Logger.log('JSON parse failed: ' + jsonError.toString()); // Debug log
        return errorResponse('Invalid JSON data: ' + jsonError.toString());
      }
    } else {
      Logger.log('No postData found'); // Debug log
      return errorResponse('No data received');
    }

    Logger.log('Final requestData: ' + JSON.stringify(requestData)); // Debug log

    // Check if this is an update request
    if (requestData.updateParticipant) {
      Logger.log('Processing participant update');
      return updateParticipantRegistration(requestData.updateParticipant);
    }

    // Check if this is a batch submission (has participants array)
    if (requestData.participants && Array.isArray(requestData.participants)) {
      Logger.log('Processing batch submission with ' + requestData.participants.length + ' participants');
      return processBatchSubmission(requestData);
    } else {
      Logger.log('Invalid request format - expected batch submission');
      return errorResponse('Invalid request format. Expected batch submission with participants array.');
    }
  } catch (error) {
    Logger.log('doPost error: ' + error.toString()); // Debug log
    return errorResponse('Error processing request: ' + error.toString());
  } finally {
    lock.releaseLock();
  }
}

function processBatchSubmission(batchData) {
  try {
    Logger.log('Processing batch submission: ' + JSON.stringify(batchData));

    // Handle payment proof upload once for the entire batch
    let paymentProofUrl = '';
    if (batchData.paymentProof && batchData.paymentProof.trim() !== '') {
      try {
        // Generate a batch ID for the image
        const batchId = 'batch_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 9);
        paymentProofUrl = uploadImageToDrive(batchData.paymentProof, batchData.paymentProofType || 'image/jpeg', batchId);
        Logger.log('Batch payment proof uploaded: ' + paymentProofUrl);
      } catch (uploadError) {
        Logger.log('Payment proof upload failed: ' + uploadError.toString());
        // Continue without payment proof - don't fail the entire batch
      }
    }

    // Process each participant
    const results = [];

    // Generate registration ID for this entire batch submission (same for all participants)
    const registrationId = Utilities.formatDate(new Date(), 'GMT', 'yyyyMMddHHmmss') + '_' + Math.floor(Math.random() * 1000);

    for (const participant of batchData.participants) {
      try {
        Logger.log('Processing participant: ' + JSON.stringify(participant));

        // Generate unique record ID for this participant
        const uniqueRecordId = Utilities.getUuid();

        // Determine registration type
        let registrationType = 'competition'; // Default to competition
        const hasFoodStalls = participant.foodStalls &&
          ((participant.foodStalls.Menu && participant.foodStalls.Menu.trim()) ||
            (participant.foodStalls.Dates && Array.isArray(participant.foodStalls.Dates) && participant.foodStalls.Dates.length > 0));

        if (hasFoodStalls) {
          registrationType = 'foodstall';
        }

        // Prepare the row data
        const rowData = [
          registrationId, // Use the same registration ID for all participants in this submission
          uniqueRecordId, // Unique ID for this specific record
          participant.email || '',
          participant.name || '',
          participant.phone || '',
          participant.tower || '',
          participant.flat || '',
          participant.gender || '',
          participant.age || '',
          participant.ageGroup ? "'" + participant.ageGroup : '', // Force as text to prevent date formatting
          JSON.stringify(participant.competitions || []),
          JSON.stringify(participant.foodStalls || {}),
          registrationType, // Type of registration
          batchData.acknowledgement || false,
          batchData.paymentMethod || '',
          paymentProofUrl, // Same URL for all participants in batch
          batchData.totalAmount || 0, // Total amount calculated on frontend
          new Date().toISOString(), // Registration Date
          'Received' // Status
        ];

        // Open the Google Sheet and append
        const ss = SpreadsheetApp.openById(registrationWorkbookId);
        let sheet = ss.getSheetByName(formDataSheetName);

        // Check if sheet exists, create it if not
        if (!sheet) {
          Logger.log('Sheet "' + formDataSheetName + '" not found, creating it...');
          sheet = ss.insertSheet(formDataSheetName);
          const headers = [
            'Registration ID', 'Unique Record ID', 'Email', 'Name', 'Phone', 'Tower', 'Flat', 'Gender', 'Age', 'Age Group',
            'Competitions', 'Food Stalls', 'Registration Type', 'Acknowledgement', 'Payment Method', 'Payment Proof URL',
            'Total Amount', 'Registration Date', 'Status'
          ];
          sheet.appendRow(headers);
          Logger.log('Sheet created with headers');
        } else {
          // Check if headers are up to date (should have 19 columns now)
          const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          if (existingHeaders.length < 19) {
            Logger.log('Sheet headers are outdated, updating...');
            // Clear existing headers and add new ones
            sheet.getRange(1, 1, 1, 19).setValues([[
              'Registration ID', 'Unique Record ID', 'Email', 'Name', 'Phone', 'Tower', 'Flat', 'Gender', 'Age', 'Age Group',
              'Competitions', 'Food Stalls', 'Registration Type', 'Acknowledgement', 'Payment Method', 'Payment Proof URL',
              'Total Amount', 'Registration Date', 'Status'
            ]]);
            Logger.log('Headers updated');
          }
        }

        // Append the row
        sheet.appendRow(rowData);
        Logger.log('Participant row appended successfully: ' + registrationId);

        results.push({
          participant: participant.name,
          status: 'success',
          registrationId: registrationId
        });

      } catch (participantError) {
        Logger.log('Error processing participant ' + participant.name + ': ' + participantError.toString());
        results.push({
          participant: participant.name,
          status: 'error',
          error: participantError.toString()
        });
      }
    }

    // Check if all participants were processed successfully
    const successCount = results.filter(r => r.status === 'success').length;
    const totalCount = batchData.participants.length;

    if (successCount === totalCount) {
      return dataResponse({
        status: 'success',
        message: `All ${totalCount} registrations processed successfully`,
        results: results
      });
    } else {
      return dataResponse({
        status: 'partial_success',
        message: `${successCount}/${totalCount} registrations processed successfully`,
        results: results
      });
    }

  } catch (error) {
    Logger.log('Error in processBatchSubmission: ' + error.toString());
    return errorResponse('Batch processing failed: ' + error.toString());
  }
}

function uploadImageToDrive(base64Image, mimeType, registrationId) {
  try {
    // Determine file extension based on MIME type
    let extension = 'jpg';
    if (mimeType === 'image/png') extension = 'png';
    else if (mimeType === 'image/gif') extension = 'gif';
    else if (mimeType === 'image/webp') extension = 'webp';

    // Decode base64 image
    const decodedBytes = Utilities.base64Decode(base64Image);
    const blob = Utilities.newBlob(decodedBytes, mimeType, `payment_proof_${registrationId}.${extension}`);

    // Upload to Google Drive (create file in a specific folder)
    const folderId = '1epCI3H_dnfvsORby2YAt5fZfvRKrQVh9';
    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(blob);

    // Set file permissions to anyone with link can view
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Return the public URL
    return file.getUrl();
  } catch (error) {
    Logger.log('Error uploading to Drive: ' + error.toString());
    throw new Error('Failed to upload image.');
  }
}

function dataResponse(object) {
  return ContentService.createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'error': msg.toString() }))
    .setMimeType(ContentService.MimeType.JSON);
}

function searchRegistrations(params) {
  try {
    const ss = SpreadsheetApp.openById(registrationWorkbookId);
    const sheet = ss.getSheetByName(formDataSheetName);

    if (!sheet) {
      return errorResponse(formDataSheetName + ' sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return dataResponse({ status: 'success', data: [] });
    }

    // Get headers
    const headers = data[0];
    const towerIndex = headers.indexOf('Tower');
    const flatIndex = headers.indexOf('Flat');
    const nameIndex = headers.indexOf('Name');
    const emailIndex = headers.indexOf('Email');
    const phoneIndex = headers.indexOf('Phone');
    const genderIndex = headers.indexOf('Gender');
    const ageIndex = headers.indexOf('Age');
    const ageGroupIndex = headers.indexOf('Age Group');
    const competitionsIndex = headers.indexOf('Competitions');
    const foodStallsIndex = headers.indexOf('Food Stalls');
    const registrationTypeIndex = headers.indexOf('Registration Type');
    const registrationDateIndex = headers.indexOf('Registration Date');
    const statusIndex = headers.indexOf('Status');

    let results = [];

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let match = false;

      // Check tower-flat search
      if (params.towerFlat) {
        const [searchTower, searchFlat] = params.towerFlat.split(' - ');
        if (row[towerIndex] === searchTower && row[flatIndex] == searchFlat) {
          match = true;
        }
      }

      // Check name search (case-insensitive, minimum 5 characters)
      if (params.name && params.name.length >= 5) {
        const searchName = params.name.toLowerCase();
        const rowName = (row[nameIndex] || '').toString().toLowerCase();
        if (rowName.includes(searchName)) {
          match = true;
        }
      }

      if (match) {
        results.push({
          registrationId: row[0], // Registration ID
          uniqueRecordId: row[1], // Unique Record ID
          email: row[emailIndex],
          name: row[nameIndex],
          phone: row[phoneIndex],
          tower: row[towerIndex],
          flat: row[flatIndex],
          gender: row[genderIndex],
          age: row[ageIndex],
          ageGroup: row[ageGroupIndex],
          competitions: row[competitionsIndex],
          foodStalls: row[foodStallsIndex],
          registrationType: row[registrationTypeIndex],
          registrationDate: row[registrationDateIndex],
          status: row[statusIndex]
        });
      }
    }

    return dataResponse({ status: 'success', data: results });
  } catch (error) {
    Logger.log('Search error: ' + error.toString());
    return errorResponse('Search failed: ' + error.toString());
  }
}

function getApartmentsList() {
  try {
    const ss = SpreadsheetApp.openById(registrationWorkbookId);
    const sheet = ss.getSheetByName(formDataSheetName);

    if (!sheet) {
      return errorResponse(formDataSheetName + ' sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return dataResponse({ status: 'success', data: [] });
    }

    // Get headers
    const headers = data[0];
    const towerIndex = headers.indexOf('Tower');
    const flatIndex = headers.indexOf('Flat');

    let apartments = new Set();

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const tower = row[towerIndex];
      const flat = row[flatIndex];

      if (tower && flat) {
        apartments.add(`${tower} - ${flat}`);
      }
    }

    // Convert to sorted array
    const sortedApartments = Array.from(apartments).sort();

    return dataResponse({ status: 'success', data: sortedApartments });
  } catch (error) {
    Logger.log('Get apartments error: ' + error.toString());
    return errorResponse('Failed to get apartments: ' + error.toString());
  }
}

function updateParticipantRegistration(updateData) {
  try {
    Logger.log('Updating participant registration: ' + JSON.stringify(updateData));

    const ss = SpreadsheetApp.openById(registrationWorkbookId);
    const sheet = ss.getSheetByName(formDataSheetName);

    if (!sheet) {
      return errorResponse(formDataSheetName + ' sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return errorResponse('No data found in sheet');
    }

    // Get headers
    const headers = data[0];
    const uniqueRecordIdIndex = headers.indexOf('Unique Record ID');
    const competitionsIndex = headers.indexOf('Competitions');

    if (uniqueRecordIdIndex === -1 || competitionsIndex === -1) {
      return errorResponse('Required columns not found in sheet');
    }

    // Find the specific row to update by uniqueRecordId
    let targetRowIndex = -1;
    for (let i = 1; i < data.length; i++) { // Skip header row
      const row = data[i];
      if (row[uniqueRecordIdIndex] === updateData.uniqueRecordId) {
        targetRowIndex = i + 1; // +1 because sheet rows are 1-indexed
        break;
      }
    }

    if (targetRowIndex === -1) {
      return errorResponse('Participant not found with uniqueRecordId: ' + updateData.uniqueRecordId);
    }

    // Update only the competitions column
    const competitionsJson = JSON.stringify(updateData.competitions || []);
    sheet.getRange(targetRowIndex, competitionsIndex + 1).setValue(competitionsJson); // +1 because ranges are 1-indexed

    Logger.log('Successfully updated competitions for participant: ' + updateData.participantName);

    return dataResponse({
      status: 'success',
      message: 'Participant competitions updated successfully',
      participant: updateData.participantName
    });

  } catch (error) {
    Logger.log('Error updating participant: ' + error.toString());
    return errorResponse('Failed to update participant: ' + error.toString());
  }
}

// ---- NEW FUNCTIONS FOR DATA EXTRACTION ----

// Helper function to clear all data rows in a sheet except the header
function clearSheetData(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow > 1) {
    // Clear content and formatting for data rows
    const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    dataRange.clearContent();
    dataRange.clearFormat();
  }
}

// Helper function to derive Apartment from Tower and Flat
function deriveApartment(tower, flat) {
  return `${tower}-${flat}`.toUpperCase();
}

// Helper function to parse Competitions JSON
function parseCompetitionsJson(jsonString) {
  try {
    return JSON.parse(jsonString || '[]');
  } catch (e) {
    Logger.log('Error parsing competitions JSON: ' + e.toString());
    return [];
  }
}

// Helper function to parse Food Stalls JSON
function parseFoodStallsJson(jsonString) {
  try {
    const parsed = JSON.parse(jsonString || '{}');
    return {
      menu: (parsed.Menu || '').toUpperCase(),
      dates: Array.isArray(parsed.Dates) ? parsed.Dates.join(', ') : ''
    };
  } catch (e) {
    Logger.log('Error parsing food stalls JSON: ' + e.toString());
    return { menu: '', dates: '' };
  }
}

// Function to process and load data into CompetitionData sheet
function processCompetitionData() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const formDataSheet = spreadsheet.getSheetByName(formDataSheetName);
  const competitionSheet = spreadsheet.getSheetByName('CompetitionData');

  if (!formDataSheet || !competitionSheet) {
    throw new Error('Required sheets not found');
  }

  const data = formDataSheet.getDataRange().getValues();
  if (data.length < 2) return; // No data

  const headers = data[0];
  const colIndices = {
    uniqueId: headers.indexOf('Unique Record ID'),
    email: headers.indexOf('Email'),
    name: headers.indexOf('Name'),
    phone: headers.indexOf('Phone'),
    tower: headers.indexOf('Tower'),
    flat: headers.indexOf('Flat'),
    gender: headers.indexOf('Gender'),
    age: headers.indexOf('Age'),
    ageGroup: headers.indexOf('Age Group'),
    competitions: headers.indexOf('Competitions')
  };

  // Group by Apartment and Name
  const groupedData = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const apartment = deriveApartment(row[colIndices.tower], row[colIndices.flat]);
    const name = row[colIndices.name].toUpperCase(); // Convert name to uppercase
    const key = `${apartment}|${name}`;

    if (!groupedData[key]) {
      groupedData[key] = {
        apartment,
        name: name,
        email: row[colIndices.email],
        phone: row[colIndices.phone],
        gender: row[colIndices.gender],
        age: row[colIndices.age],
        ageGroup: row[colIndices.ageGroup],
        competitions: {}
      };
    }

    // Parse competitions
    const comps = parseCompetitionsJson(row[colIndices.competitions]);
    comps.forEach(comp => {
      const compKey = `${comp.Category}|${comp.Name}`;
      if (!groupedData[key].competitions[compKey]) {
        groupedData[key].competitions[compKey] = {
          category: comp.Category,
          name: comp.Name,
          teamInfos: []
        };
      }
      if (comp['Team Info']) {
        groupedData[key].competitions[compKey].teamInfos.push(comp['Team Info']);
      }
    });
  }

  // Prepare output rows
  const outputRows = [];
  Object.values(groupedData).forEach(group => {
    Object.values(group.competitions).forEach(comp => {
      const filteredTeamInfos = comp.teamInfos.filter(t => t !== 'N/A');
      const teamInfo = filteredTeamInfos.length > 0 ? filteredTeamInfos.join(', ').toUpperCase() : '';
      outputRows.push([
        group.apartment,
        group.name,
        group.email,
        group.phone,
        group.gender,
        group.age,
        "'" + group.ageGroup, // Force Age Group as string
        comp.category,
        comp.name,
        teamInfo
      ]);
    });
  });

  // Sort output rows alphabetically by Apartment (first column)
  outputRows.sort((a, b) => a[0].localeCompare(b[0]));

  // Write to CompetitionData
  if (outputRows.length > 0) {
    competitionSheet.getRange(2, 1, outputRows.length, 10).setValues(outputRows);
  }
}

// Function to process and load data into PaymentData sheet
function processPaymentData() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const formDataSheet = spreadsheet.getSheetByName(formDataSheetName);
  const paymentSheet = spreadsheet.getSheetByName('PaymentData');

  if (!formDataSheet || !paymentSheet) {
    throw new Error('Required sheets not found');
  }

  const data = formDataSheet.getDataRange().getValues();
  if (data.length < 2) return; // No data

  const headers = data[0];
  const colIndices = {
    tower: headers.indexOf('Tower'),
    flat: headers.indexOf('Flat'),
    paymentProof: headers.indexOf('Payment Proof URL'),
    totalAmount: headers.indexOf('Total Amount')
  };

  // Group by Apartment and Amount (to handle separate payments)
  const groupedData = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const apartment = deriveApartment(row[colIndices.tower], row[colIndices.flat]);
    const amount = parseFloat(row[colIndices.totalAmount]) || 0;
    const paymentProof = row[colIndices.paymentProof] || '';

    // Create unique key for apartment + amount combination
    const key = `${apartment}|${amount}`;

    if (!groupedData[key]) {
      groupedData[key] = {
        apartment,
        amount,
        paymentProofs: new Set() // Use Set to avoid duplicates
      };
    }

    if (paymentProof) {
      groupedData[key].paymentProofs.add(paymentProof);
    }
  }

  // Prepare output rows - one row per unique apartment-amount combination
  const outputRows = [];
  Object.values(groupedData).forEach(group => {
    const paymentProof = group.paymentProofs.size > 0 ? Array.from(group.paymentProofs)[0] : ''; // Take first unique payment proof

    // Logger.log(`Apartment ${group.apartment}: amount ${group.amount}, payment proofs: ${group.paymentProofs.size}`);

    outputRows.push([
      group.apartment,
      paymentProof,
      group.amount,
      '', // Paid Amount blank
      ''  // Discrepancy blank
    ]);
  });

  // Sort output rows alphabetically by Apartment (first column)
  outputRows.sort((a, b) => a[0].localeCompare(b[0]));

  // Write to PaymentData
  if (outputRows.length > 0) {
    paymentSheet.getRange(2, 1, outputRows.length, 5).setValues(outputRows);
  }
}

// Function to process and load data into FoodStallData sheet
function processFoodStallData() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const formDataSheet = spreadsheet.getSheetByName(formDataSheetName);
  const foodStallSheet = spreadsheet.getSheetByName('FoodStallData');

  if (!formDataSheet || !foodStallSheet) {
    throw new Error('Required sheets not found');
  }

  const data = formDataSheet.getDataRange().getValues();
  if (data.length < 2) return; // No data

  const headers = data[0];
  const colIndices = {
    email: headers.indexOf('Email'),
    name: headers.indexOf('Name'),
    phone: headers.indexOf('Phone'),
    tower: headers.indexOf('Tower'),
    flat: headers.indexOf('Flat'),
    foodStalls: headers.indexOf('Food Stalls')
  };

  // Group by Apartment and Name
  const groupedData = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const apartment = deriveApartment(row[colIndices.tower], row[colIndices.flat]);
    const name = row[colIndices.name].toUpperCase(); // Convert name to uppercase
    const key = `${apartment}|${name}`;

    if (!groupedData[key]) {
      groupedData[key] = {
        apartment,
        name: name,
        email: row[colIndices.email],
        phone: row[colIndices.phone],
        foodStalls: new Set()
      };
    }

    // Parse food stalls
    const foodStall = parseFoodStallsJson(row[colIndices.foodStalls]);
    if (foodStall.menu) {
      groupedData[key].foodStalls.add(JSON.stringify(foodStall)); // Store as JSON string for uniqueness
    }
  }

  // Prepare output rows
  const outputRows = [];
  Object.values(groupedData).forEach(group => {
    group.foodStalls.forEach(stallJson => {
      const stall = JSON.parse(stallJson);
      outputRows.push([
        group.apartment,
        group.name,
        group.email,
        group.phone,
        stall.menu,
        stall.dates
      ]);
    });
  });

  // Sort output rows alphabetically by Apartment (first column)
  outputRows.sort((a, b) => a[0].localeCompare(b[0]));

  // Write to FoodStallData
  if (outputRows.length > 0) {
    foodStallSheet.getRange(2, 1, outputRows.length, 6).setValues(outputRows);
  }
}

// Main function to load data into both sheets
function loadDataToSheets() {
  try {
    Logger.log('Starting data load process...');

    // Clear and load CompetitionData
    clearSheetData('CompetitionData');
    processCompetitionData();
    Logger.log('CompetitionData loaded successfully');

    // Clear and load PaymentData
    clearSheetData('PaymentData');
    processPaymentData();
    Logger.log('PaymentData loaded successfully');

    // Clear and load FoodStallData
    clearSheetData('FoodStallData');
    processFoodStallData();
    Logger.log('FoodStallData loaded successfully');

    Logger.log('Data load process completed');
  } catch (error) {
    Logger.log('Error in loadDataToSheets: ' + error.toString());
    throw error;
  }
}

// ---- PAYMENT VERIFICATION USING GOOGLE CLOUD VISION AI ----

// Function to verify payments by analyzing screenshots with Google Cloud Vision AI
// NOTE: Ensure PaymentData sheet has headers: Apartment, Payment Proof URL, Due Amount, Paid Amount, Discrepancy
function verifyPayments() {
  try {
    // Logger.log('Starting payment verification process...');

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const paymentSheet = spreadsheet.getSheetByName('PaymentData');

    if (!paymentSheet) {
      throw new Error('PaymentData sheet not found');
    }

    const data = paymentSheet.getDataRange().getValues();
    if (data.length < 2) {
      Logger.log('No data in PaymentData sheet');
      return;
    }

    const headers = data[0];
    const colIndices = {
      apartment: headers.indexOf('Apartment'),
      paymentProofUrl: headers.indexOf('Payment Proof URL'),
      dueAmount: headers.indexOf('Due Amount'),
      paidAmount: headers.indexOf('Paid Amount'),
      discrepancy: headers.indexOf('Discrepancy')
    };

    // Process each row (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const paymentProofUrl = row[colIndices.paymentProofUrl];
      const paidAmount = row[colIndices.paidAmount];
      const discrepancy = row[colIndices.discrepancy];

      // Skip if no payment proof URL
      if (!paymentProofUrl) {
        continue;
      }

      try {
        // Logger.log(`Processing payment for apartment: ${row[colIndices.apartment]}`);

        // Extract file ID from Google Drive URL
        const fileId = extractFileIdFromUrl(paymentProofUrl);
        if (!fileId) {
          // Logger.log(`Invalid payment proof URL for apartment ${row[colIndices.apartment]}`);
          continue;
        }

        // Get image blob from Drive
        const imageBlob = DriveApp.getFileById(fileId).getBlob();

        // Analyze image with Vision AI
        const extractedAmount = analyzePaymentScreenshot(imageBlob);

        if (extractedAmount !== null) {
          const dueAmount = parseFloat(row[colIndices.dueAmount]) || 0;
          const amountsMatch = Math.abs(extractedAmount - dueAmount) <= 0.01; // Allow small floating point differences

          // Update the Paid Amount column
          paymentSheet.getRange(i + 1, colIndices.paidAmount + 1).setValue(extractedAmount);

          // Update the Discrepancy column - NO if amounts match (no discrepancy), YES if they don't (discrepancy)
          paymentSheet.getRange(i + 1, colIndices.discrepancy + 1).setValue(amountsMatch ? 'NO' : 'YES');

          // Logger.log(`Apartment ${row[colIndices.apartment]}: extracted ₹${extractedAmount}, due ₹${dueAmount}, discrepancy: ${amountsMatch ? 'NO' : 'YES'}`);
        } else {
          Logger.log(`Could not extract amount for apartment ${row[colIndices.apartment]}`);
        }

        // Add delay to avoid rate limits
        Utilities.sleep(1000);

      } catch (rowError) {
        Logger.log(`Error processing row for apartment ${row[colIndices.apartment]}: ${rowError.toString()}`);
      }
    }

    // Logger.log('Payment verification process completed');

  } catch (error) {
    Logger.log('Error in verifyPayments: ' + error.toString());
    throw error;
  }
}

// Helper function to extract file ID from Google Drive URL
function extractFileIdFromUrl(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Function to analyze payment screenshot using Google Gemini AI
function analyzePaymentScreenshot(imageBlob) {
  try {
    const base64Image = Utilities.base64Encode(imageBlob.getBytes());
    const payload = {
      contents: [{
        parts: [
          {
            text: "What is the payment amount shown in this image? Return only the number."
          },
          {
            inline_data: {
              mime_type: "image/jpeg", // or "image/png" as per your input
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 200
      }
    };

    // Use the correct vision-enabled model endpoint
    const geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey) throw new Error('Gemini API key not found.');

    const response = UrlFetchApp.fetch(geminiApiUrl + '?key=' + apiKey, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    });

    const result = JSON.parse(response.getContentText());

    // Logger.log('API Response: ' + JSON.stringify(result));

    // Log finish reason if available
    if (result.candidates && result.candidates[0] && result.candidates[0].finishReason) {
      // Logger.log('Response finish reason: ' + result.candidates[0].finishReason);
    }

    // Check if the response contains an error
    if (result.error) {
      Logger.log('API Error: ' + JSON.stringify(result.error));
      return null;
    }

    if (result.candidates && result.candidates[0]) {
      const candidate = result.candidates[0];

      // Check if response was truncated due to token limits
      if (candidate.finishReason === 'MAX_TOKENS') {
        Logger.log('Response was truncated due to token limit - consider increasing maxOutputTokens');
        return null;
      }

      // Check if content and parts exist
      if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
        const extractedText = candidate.content.parts[0].text.trim();
        // Logger.log('Gemini extracted text: ' + extractedText);

        const amount = parseFloat(extractedText.replace(/,/g, ''));
        if (!isNaN(amount) && amount > 0) return amount;

        if (extractedText.toLowerCase() === 'null') return null;
      } else {
        Logger.log('No content parts found in response');
      }
    } else {
      Logger.log('No candidates found in response');
    }
    return null;
  } catch (error) {
    Logger.log('Error in analyzePaymentScreenshot: ' + error.toString());
    return null;
  }
}

