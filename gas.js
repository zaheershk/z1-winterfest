// ---- CODE FOR UI BACKEND ----
const registrationWorkbookId = '1k6k68Upe41ct_hwa-1VQbnCN6rtFiPZXSal_uPYMOfg';

// Sheet names
const formDataSheetName = 'FormData';
const competitionDataSheetName = 'CompetitionData';
const paymentDataSheetName = 'PaymentData';
const foodStallDataSheetName = 'FoodStallData';
const ageOutlierDataSheetName = 'AgeOutlierData';
const reimbursementsSheetName = 'Expenses';
const winnerEntriesSheetName = 'WinnerEntries';
const winnerUnregisteredSheetName = 'WinnerUnregistered';

// Google Drive folder IDs
const registrationPaymentProofsFolderId = '1epCI3H_dnfvsORby2YAt5fZfvRKrQVh9';
const expenseAttachmentsFolderId = '1up5fQYQSvPShfkyKDgLq-lfc7FUUX0F1';

// Hardcoded list of volunteer email addresses
const VOLUNTEER_EMAILS = [
  'zaheer.azad@gmail.com',
  'simi.nazeem@gmail.com',
  'mail2mamatamanjaribehera@gmail.com',
  'prateekagr1988@gmail.com',
  'sudeep00890@gmail.com',
  'sunitasatpathy@gmail.com',
  'mvedullapalli@gmail.com',
  'swetabinani@gmail.com',
  // Add other volunteer emails here
];

function doGet(e) {
  try {
    // Check if this is an access code validation request
    if (e.parameter && e.parameter.validate_access_code) {
      const code = e.parameter.validate_access_code;
      const validation = validateAccessCode(code);

      return ContentService.createTextOutput(JSON.stringify({
        valid: validation.valid,
        reason: validation.reason || null
      }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Check if this is a volunteer status check
    if (e.parameter && e.parameter.action === 'checkVolunteerStatus') {
      return checkVolunteerStatus();
    }

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

    // Check if this is a registration data request for autocomplete
    if (e.parameter && e.parameter.type === 'registrationData') {
      if (e.parameter.property === 'name') {
        return getNamesList();
      } else if (e.parameter.property === 'apartment') {
        return getApartmentsList();
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

    // Check if this is an action request (like volunteer check)
    if (requestData.action) {
      switch (requestData.action) {
        case 'checkVolunteerByEmail':
          return checkVolunteerByEmail(requestData.email);
        default:
          return errorResponse('Unknown action: ' + requestData.action);
      }
    }

    // Check if this is a form submission (refund, expense, winner)
    if (requestData.formType) {
      switch (requestData.formType) {
        case 'refund':
          return submitRefund(requestData);
        case 'expense':
          return submitExpense(requestData);
        case 'winner':
          return submitWinner(requestData);
        case 'getWinners':
          return getWinnersData();
        case 'getFeedback':
          return getFeedbackData();
        case 'submitFeedback':
          return submitFeedbackData(requestData);
        default:
          return errorResponse('Unknown form type: ' + requestData.formType);
      }
    }

    // Check if this is an update request
    if (requestData.updateParticipant) {
      Logger.log('Processing participant update');
      return updateParticipantRegistration(requestData.updateParticipant);
    }

    // Check if this is a batch submission (has participants array)
    if (requestData.participants && Array.isArray(requestData.participants)) {
      Logger.log('Processing batch submission with ' + requestData.participants.length + ' participants');

      // Validate access code if provided
      if (requestData.accessCode) {
        const validation = validateAccessCode(requestData.accessCode);
        if (!validation.valid) {
          return errorResponse('Invalid or expired access code: ' + validation.reason);
        }
        Logger.log('Access code validated: ' + requestData.accessCode);
      }

      const result = processBatchSubmission(requestData);

      // Mark access code as used if registration was successful and access code was provided
      if (requestData.accessCode && result.getContent().includes('"status":"success"')) {
        try {
          const firstParticipant = requestData.participants[0];
          const userInfo = firstParticipant ? `${firstParticipant.name} (${firstParticipant.email})` : 'Unknown';
          markAccessCodeUsed(requestData.accessCode, userInfo);
          Logger.log('Marked access code as used: ' + requestData.accessCode);
        } catch (codeError) {
          Logger.log('Error marking access code as used: ' + codeError.toString());
          // Don't fail the registration if code marking fails
        }
      }

      return result;
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
    const folder = DriveApp.getFolderById(registrationPaymentProofsFolderId);
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

function getNamesList() {
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
    const nameIndex = headers.indexOf('Name');

    let names = new Set();

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const name = row[nameIndex];

      if (name && name.trim()) {
        names.add(name.trim().toUpperCase());
      }
    }

    // Convert to sorted array
    const sortedNames = Array.from(names).sort();

    return dataResponse({ status: 'success', data: sortedNames });
  } catch (error) {
    Logger.log('Get names error: ' + error.toString());
    return errorResponse('Failed to get names: ' + error.toString());
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
  const competitionSheet = spreadsheet.getSheetByName(competitionDataSheetName);

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
        comp.category,        // Competition Category
        comp.name,           // Competition Name
        "'" + group.ageGroup, // Age Group (forced as string)
        group.age,           // Age
        group.gender,        // Gender
        group.name,          // Name
        group.apartment,     // Apartment
        group.email,         // Email
        group.phone,         // Phone
        teamInfo             // Team Info
      ]);
    });
  });

  // Sort output rows by: Competition Category, Competition Name, Age Group (custom order), Age, Gender, Name
  const ageGroupOrder = ["3-5", "6-9", "10-13", "14-17", "18-35", "36-55", "56+"];
  outputRows.sort((a, b) => {
    // First sort by Competition Category
    const categoryCompare = (a[0] || '').localeCompare(b[0] || '');
    if (categoryCompare !== 0) return categoryCompare;

    // Then by Competition Name
    const nameCompare = (a[1] || '').localeCompare(b[1] || '');
    if (nameCompare !== 0) return nameCompare;

    // Then by Age Group (custom order)
    const ageGroupA = (a[2] || '').replace("'", ''); // Remove the ' prefix for comparison
    const ageGroupB = (b[2] || '').replace("'", ''); // Remove the ' prefix for comparison
    const indexA = ageGroupOrder.indexOf(ageGroupA);
    const indexB = ageGroupOrder.indexOf(ageGroupB);
    
    // If both age groups are in the order array, use their indices
    if (indexA !== -1 && indexB !== -1) {
      if (indexA !== indexB) return indexA - indexB;
    } else if (indexA !== -1) {
      return -1; // a comes first if it's in the order
    } else if (indexB !== -1) {
      return 1; // b comes first if it's in the order
    } else {
      // Neither is in the order, use string comparison
      const ageGroupCompare = ageGroupA.localeCompare(ageGroupB);
      if (ageGroupCompare !== 0) return ageGroupCompare;
    }

    // Then by Age (numeric)
    const ageA = parseInt(a[3]) || 0;
    const ageB = parseInt(b[3]) || 0;
    if (ageA !== ageB) return ageA - ageB;

    // Then by Gender
    const genderCompare = (a[4] || '').localeCompare(b[4] || '');
    if (genderCompare !== 0) return genderCompare;

    // Finally by Name
    return (a[5] || '').localeCompare(b[5] || '');
  });

  // Write to CompetitionData
  if (outputRows.length > 0) {
    competitionSheet.getRange(2, 1, outputRows.length, 10).setValues(outputRows);
  }
}

// Function to process and load data into PaymentData sheet
function processPaymentData() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const formDataSheet = spreadsheet.getSheetByName(formDataSheetName);
  const paymentSheet = spreadsheet.getSheetByName(paymentDataSheetName);

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
  const foodStallSheet = spreadsheet.getSheetByName(foodStallDataSheetName);

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

  // Define date headers
  const dateHeaders = [
    "Sunday, 9 Nov",
    "Saturday, 15 Nov",
    "Sunday, 16 Nov",
    "Saturday, 22 Nov",
    "Sunday, 23 Nov",
    "Saturday, 29 Nov",
    "Sunday, 30 Nov",
    "Saturday, 6 Dec",
    "Sunday, 7 Dec"
  ];

  // Set headers in FoodStallData sheet
  const sheetHeaders = dateHeaders.concat(['Name', 'Contact Info']);
  foodStallSheet.getRange(1, 1, 1, sheetHeaders.length).setValues([sheetHeaders]);

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

  // Helper function to format menu
  function formatMenu(menu) {
    if (!menu) return '';
    const items = menu.split(',').map(item => item.trim()).filter(item => item);
    if (items.length <= 1) return menu;
    return items.map(item => '• ' + item).join('\n');
  }

  // Prepare output rows
  const outputRows = [];
  Object.values(groupedData).forEach(group => {
    group.foodStalls.forEach(stallJson => {
      const stall = JSON.parse(stallJson);
      const formattedMenu = formatMenu(stall.menu);
      const contactInfo = `• Apartment: ${group.apartment}\n• Phone: ${group.phone}\n• Email: ${group.email}`;
      
      // Create row with date columns
      const row = [];
      dateHeaders.forEach(date => {
        row.push(stall.dates && stall.dates.includes(date) ? formattedMenu : '');
      });
      
      // Add remaining columns
      row.push(group.name, contactInfo);
      
      outputRows.push(row);
    });
  });

  // Sort output rows alphabetically by Contact Info (11th column, index 10)
  outputRows.sort((a, b) => a[10].localeCompare(b[10]));

  // Write to FoodStallData
  if (outputRows.length > 0) {
    foodStallSheet.getRange(2, 1, outputRows.length, 11).setValues(outputRows);
  }
}

// Main function to load data into both sheets
function loadDataToSheets() {
  try {
    Logger.log('Starting data load process...');

    // Clear and load CompetitionData
    clearSheetData(competitionDataSheetName);
    processCompetitionData();
    Logger.log('CompetitionData loaded successfully');

    // Clear and load PaymentData
    clearSheetData(paymentDataSheetName);
    processPaymentData();
    Logger.log('PaymentData loaded successfully');

    // Clear and load FoodStallData
    clearSheetData(foodStallDataSheetName);
    processFoodStallData();
    Logger.log('FoodStallData loaded successfully');

    Logger.log('Data load process completed');
  } catch (error) {
    Logger.log('Error in loadDataToSheets: ' + error.toString());
    throw error;
  }
}

// ---- AGE OUTLIER DETECTION ----

// Function to identify age outliers in CompetitionData and log to AgeOutlierData sheet
function identifyAgeOutliers() {
  try {
    Logger.log('Starting age outlier detection process...');

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const competitionSheet = spreadsheet.getSheetByName(competitionDataSheetName);

    if (!competitionSheet) {
      throw new Error('CompetitionData sheet not found');
    }

    const data = competitionSheet.getDataRange().getValues();
    if (data.length < 2) {
      Logger.log('No data found in CompetitionData sheet');
      return;
    }

    const headers = data[0];
    const colIndices = {
      competitionCategory: headers.indexOf('Competition Category'),
      competitionName: headers.indexOf('Competition Name'),
      ageGroup: headers.indexOf('Age Group'),
      age: headers.indexOf('Age'),
      gender: headers.indexOf('Gender'),
      name: headers.indexOf('Name'),
      apartment: headers.indexOf('Apartment'),
      email: headers.indexOf('Email'),
      phone: headers.indexOf('Phone'),
      teamInfo: headers.indexOf('Team Info')
    };

    // Helper function to parse age group range
    function parseAgeGroup(ageGroupStr) {
      if (!ageGroupStr || typeof ageGroupStr !== 'string') return { min: 0, max: Infinity };

      const cleanStr = ageGroupStr.replace("'", ''); // Remove any leading quote
      if (cleanStr.endsWith('+')) {
        const min = parseInt(cleanStr.replace('+', ''));
        return { min: min, max: Infinity };
      } else if (cleanStr.includes('-')) {
        const [minStr, maxStr] = cleanStr.split('-');
        const min = parseInt(minStr);
        const max = parseInt(maxStr);
        return { min: min, max: max };
      }
      return { min: 0, max: Infinity };
    }

    // Collect outliers (use Set to ensure uniqueness)
    const outliersSet = new Set();
    const outliers = [];

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const ageGroupStr = row[colIndices.ageGroup];
      const age = parseInt(row[colIndices.age]);

      if (isNaN(age)) continue; // Skip if age is not a number

      const { min, max } = parseAgeGroup(ageGroupStr);

      // Check if age is within range
      if (age < min || age > max) {
        // Create unique key for deduplication
        const uniqueKey = `${row[colIndices.name]}|${row[colIndices.apartment]}|${ageGroupStr}`;
        
        if (!outliersSet.has(uniqueKey)) {
          outliersSet.add(uniqueKey);
          outliers.push({
            ageGroup: ageGroupStr,
            age: age,
            gender: row[colIndices.gender],
            name: row[colIndices.name],
            apartment: row[colIndices.apartment],
            email: row[colIndices.email],
            phone: row[colIndices.phone]
          });
        }
      }
    }

    Logger.log(`Found ${outliers.length} age outliers`);

    // Prepare AgeOutlierData sheet
    let outlierSheet = spreadsheet.getSheetByName(ageOutlierDataSheetName);
    if (!outlierSheet) {
      Logger.log('Creating AgeOutlierData sheet');
      outlierSheet = spreadsheet.insertSheet(ageOutlierDataSheetName);
    } else {
      // Clear existing data rows (excluding header)
      const lastRow = outlierSheet.getLastRow();
      if (lastRow > 1) {
        outlierSheet.getRange(2, 1, lastRow - 1, outlierSheet.getLastColumn()).clearContent();
      }
      Logger.log('Cleared existing data in AgeOutlierData sheet');
    }

    // Set headers
    const outlierHeaders = ['Age Group', 'Age', 'Gender', 'Name', 'Apartment', 'Email', 'Phone'];
    outlierSheet.getRange(1, 1, 1, outlierHeaders.length).setValues([outlierHeaders]);

    // Write outlier data
    if (outliers.length > 0) {
      const outputRows = outliers.map(outlier => [
        "'" + outlier.ageGroup, // Age Group (forced as string)
        outlier.age,
        outlier.gender,
        outlier.name,
        outlier.apartment,
        outlier.email,
        outlier.phone
      ]);

      // Sort by Name alphabetically
      outputRows.sort((a, b) => (a[3] || '').localeCompare(b[3] || ''));

      outlierSheet.getRange(2, 1, outputRows.length, 7).setValues(outputRows);
      Logger.log(`Wrote ${outputRows.length} outlier records to AgeOutlierData sheet`);
    } else {
      Logger.log('No outliers found');
    }

    Logger.log('Age outlier detection process completed');

  } catch (error) {
    Logger.log('Error in identifyAgeOutliers: ' + error.toString());
    throw error;
  }
}

// ---- ACCESS CODE MANAGEMENT ----

// Function to generate a new access code and return the complete shareable URL
function generateAccessCode() {
  try {
    Logger.log('Generating new access code...');

    // Generate a random 8-character code (alphanumeric)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Get existing codes or initialize empty object
    const scriptProperties = PropertiesService.getScriptProperties();
    let accessCodes = {};
    const existingCodes = scriptProperties.getProperty('access_codes');

    if (existingCodes) {
      try {
        accessCodes = JSON.parse(existingCodes);
      } catch (e) {
        Logger.log('Error parsing existing codes, starting fresh: ' + e.toString());
        accessCodes = {};
      }
    }

    // Add the new code
    accessCodes[code] = {
      created: new Date().toISOString(),
      expires: expiresAt,
      used: false,
      usedBy: null,
      usedAt: null
    };

    // Save back to properties
    scriptProperties.setProperty('access_codes', JSON.stringify(accessCodes));

    // Generate the complete shareable URL
    const baseUrl = 'https://tinyurl.com/z1wf25';
    const shareableUrl = baseUrl + '?access_code=' + code;

    Logger.log('Generated access code: ' + code + ', URL: ' + shareableUrl);

    return {
      code: code,
      url: shareableUrl,
      expires: expiresAt
    };

  } catch (error) {
    Logger.log('Error generating access code: ' + error.toString());
    throw error;
  }
}

// Function to validate an access code
function validateAccessCode(code) {
  try {
    if (!code) {
      return { valid: false, reason: 'No code provided' };
    }

    const scriptProperties = PropertiesService.getScriptProperties();
    const existingCodes = scriptProperties.getProperty('access_codes');

    if (!existingCodes) {
      return { valid: false, reason: 'No codes found' };
    }

    let accessCodes;
    try {
      accessCodes = JSON.parse(existingCodes);
    } catch (e) {
      Logger.log('Error parsing access codes: ' + e.toString());
      return { valid: false, reason: 'Invalid code storage' };
    }

    const codeData = accessCodes[code];
    if (!codeData) {
      return { valid: false, reason: 'Code not found' };
    }

    // Check if expired
    if (new Date() > new Date(codeData.expires)) {
      return { valid: false, reason: 'Code expired' };
    }

    // Check if already used
    if (codeData.used) {
      return { valid: false, reason: 'Code already used' };
    }

    return { valid: true, codeData: codeData };

  } catch (error) {
    Logger.log('Error validating access code: ' + error.toString());
    return { valid: false, reason: 'Validation error: ' + error.toString() };
  }
}

// Function to mark an access code as used
function markAccessCodeUsed(code, userInfo) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const existingCodes = scriptProperties.getProperty('access_codes');

    if (!existingCodes) {
      throw new Error('No codes found');
    }

    let accessCodes = JSON.parse(existingCodes);
    if (!accessCodes[code]) {
      throw new Error('Code not found');
    }

    // Mark as used
    accessCodes[code].used = true;
    accessCodes[code].usedBy = userInfo || 'Unknown';
    accessCodes[code].usedAt = new Date().toISOString();

    // Save back
    scriptProperties.setProperty('access_codes', JSON.stringify(accessCodes));

    Logger.log('Marked access code ' + code + ' as used by: ' + userInfo);

  } catch (error) {
    Logger.log('Error marking access code as used: ' + error.toString());
    throw error;
  }
}

// Function to list all active access codes (for admin purposes)
function listActiveAccessCodes() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const existingCodes = scriptProperties.getProperty('access_codes');

    if (!existingCodes) {
      return [];
    }

    const accessCodes = JSON.parse(existingCodes);
    const activeCodes = [];

    for (const [code, data] of Object.entries(accessCodes)) {
      if (!data.used && new Date() <= new Date(data.expires)) {
        activeCodes.push({
          code: code,
          created: data.created,
          expires: data.expires,
          url: 'https://tinyurl.com/z1wf25?access_code=' + code
        });
      }
    }

    return activeCodes;

  } catch (error) {
    Logger.log('Error listing active codes: ' + error.toString());
    return [];
  }
}

// Function to verify payments by analyzing screenshots with Google Cloud Vision AI
// NOTE: Ensure PaymentData sheet has headers: Apartment, Payment Proof URL, Due Amount, Paid Amount, Discrepancy
function verifyPayments() {
  try {
    // Logger.log('Starting payment verification process...');

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const paymentSheet = spreadsheet.getSheetByName(paymentDataSheetName);

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

// Check if current user is a volunteer
function checkVolunteerStatus() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const isVolunteer = VOLUNTEER_EMAILS.includes(userEmail);

    return dataResponse({
      authorized: isVolunteer,
      userEmail: userEmail
    });
  } catch (error) {
    Logger.log('Error in checkVolunteerStatus: ' + error.toString());
    return errorResponse('Unable to verify volunteer status');
  }
}

function checkVolunteerByEmail(email) {
  try {
    const isVolunteer = VOLUNTEER_EMAILS.includes(email.toLowerCase().trim());

    return dataResponse({
      authorized: isVolunteer,
      userEmail: email
    });
  } catch (error) {
    Logger.log('Error in checkVolunteerByEmail: ' + error.toString());
    return errorResponse('Unable to verify volunteer status');
  }
}

// Placeholder functions for admin forms
function submitRefund(data) {
  try {
    Logger.log('Refund submission received: ' + JSON.stringify(data));
    // TODO: Implement refund processing logic
    return dataResponse({
      status: 'success',
      message: 'Refund request submitted successfully (placeholder)',
      requestId: 'REF-' + new Date().getTime()
    });
  } catch (error) {
    Logger.log('Error in submitRefund: ' + error.toString());
    return errorResponse('Failed to submit refund request');
  }
}

function submitExpense(data) {
  try {
    Logger.log('Expense submission received: ' + JSON.stringify(data));

    // Generate unique expense ID
    const expenseId = 'EXP-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000);

    // Validate required fields
    if (!data.volunteerName || data.volunteerName.trim() === '') {
      return errorResponse('Missing required field: volunteerName');
    }
    if (!data.expenseFor || data.expenseFor.trim() === '') {
      return errorResponse('Missing required field: expenseFor');
    }
    if (!data.description || data.description.trim() === '') {
      return errorResponse('Missing required field: description');
    }
    if (!data.expenseAmount && data.expenseAmount !== 0) {
      return errorResponse('Missing required field: expenseAmount');
    }

    // Validate expense amount
    const amount = parseFloat(data.expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      return errorResponse('Invalid expense amount');
    }

    // Get or create expense sheet
    const ss = SpreadsheetApp.openById(registrationWorkbookId);
    let expenseSheet = ss.getSheetByName(reimbursementsSheetName);

    if (!expenseSheet) {
      expenseSheet = ss.insertSheet(reimbursementsSheetName);

      // Add headers
      const headers = [
        'Expense ID',
        'Volunteer Name',
        'Expense Amount',
        'Expense For',
        'Description',
        'Submitted By',
        'Submitted Date',
        'Status',
        'Attachment-1',
        'Attachment-2',
        'Attachment-3',
        'Attachment-4',
        'Attachment-5'
      ];
      expenseSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // Upload files to Google Drive
    const attachmentLinks = [];

    if (expenseAttachmentsFolderId && data.attachments && Array.isArray(data.attachments)) {
      try {
        const folder = DriveApp.getFolderById(expenseAttachmentsFolderId);

        // Process up to 5 attachments
        for (let i = 0; i < 5; i++) {
          const attachment = data.attachments[i];
          if (attachment && attachment.content && attachment.filename) {
            const blob = Utilities.newBlob(Utilities.base64Decode(attachment.content), attachment.contentType, attachment.filename);

            // Create unique filename with expense ID
            const uniqueFilename = `${expenseId}_${i + 1}_${attachment.filename}`;
            const uploadedFile = folder.createFile(blob.setName(uniqueFilename));

            // Make file viewable by anyone with link
            uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

            attachmentLinks.push(uploadedFile.getUrl());
          } else {
            attachmentLinks.push('');
          }
        }
      } catch (driveError) {
        Logger.log('Drive upload error: ' + driveError.toString());
        // Continue without attachments if Drive fails
        for (let i = 0; i < 5; i++) {
          attachmentLinks.push('');
        }
      }
    } else {
      // No drive folder configured or no attachments
      for (let i = 0; i < 5; i++) {
        attachmentLinks.push('');
      }
    }

    // Prepare row data
    const rowData = [
      expenseId,
      data.volunteerName.trim(),
      amount,
      data.expenseFor,
      data.description.trim(),
      data.submittedBy || 'Unknown',
      new Date().toISOString(),
      'Pending',
      ...attachmentLinks
    ];

    // Append to sheet
    expenseSheet.appendRow(rowData);

    Logger.log('Expense request submitted successfully: ' + expenseId);

    return dataResponse({
      status: 'success',
      message: 'Expense request submitted successfully',
      expenseId: expenseId
    });

  } catch (error) {
    Logger.log('Error in submitExpense: ' + error.toString());
    return errorResponse('Failed to submit expense request: ' + error.toString());
  }
}

function submitWinner(data) {
  try {
    Logger.log('Winner submission received: ' + JSON.stringify(data));

    // We'll need a separate sheet for winner entries
    // For now, let's use the existing formDataSheetName but we should create a separate sheet
    const ss = SpreadsheetApp.openById(registrationWorkbookId);
    let winnerSheet = ss.getSheetByName(winnerEntriesSheetName);

    // Create the sheet if it doesn't exist, or update headers if they don't match
    if (!winnerSheet) {
      winnerSheet = ss.insertSheet(winnerEntriesSheetName);

      // Add headers - separate sections for winners and runner-ups
      const headers = [
        'Submission ID',
        'Competition Category',
        'Competition Name',
        'Age Group',
        'Gender',
        'Had Tie',
        'Submission Date',
        'Submitted By'
      ];

      // Add winner columns (up to 10 winners to be safe)
      for (let i = 1; i <= 10; i++) {
        headers.push(`Winner ${i} Name`);
        headers.push(`Winner ${i} Apartment`);
      }

      // Add runner-up columns (up to 10 runner-ups to be safe)
      for (let i = 1; i <= 10; i++) {
        headers.push(`Runner-up ${i} Name`);
        headers.push(`Runner-up ${i} Apartment`);
      }

      winnerSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      winnerSheet.setFrozenRows(1); // Freeze header row
    } else {
      // Check if existing headers need to be updated (for backward compatibility)
      const currentHeaders = winnerSheet.getRange(1, 1, 1, winnerSheet.getLastColumn()).getValues()[0];
      const expectedHeaderCount = 8 + (10 * 2) + (10 * 2); // 8 base + 20 winner + 20 runner-up columns

      if (currentHeaders.length !== expectedHeaderCount) {
        // Update headers to match new structure
        const headers = [
          'Submission ID',
          'Competition Category',
          'Competition Name',
          'Age Group',
          'Gender',
          'Had Tie',
          'Submission Date',
          'Submitted By'
        ];

        // Add winner columns (up to 10 winners to be safe)
        for (let i = 1; i <= 10; i++) {
          headers.push(`Winner ${i} Name`);
          headers.push(`Winner ${i} Apartment`);
        }

        // Add runner-up columns (up to 10 runner-ups to be safe)
        for (let i = 1; i <= 10; i++) {
          headers.push(`Runner-up ${i} Name`);
          headers.push(`Runner-up ${i} Apartment`);
        }

        // Clear existing headers and set new ones
        winnerSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        winnerSheet.setFrozenRows(1); // Freeze header row
      }
    }

    // Generate submission ID
    const submissionId = 'WIN-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000);

    // Prepare the row data
    const rowData = [
      submissionId,
      data.competitionCategory || '',
      data.competitionName || '',
      data.ageGroup ? "'" + data.ageGroup : '',
      data.gender || '',
      data.hadTie ? 'Yes' : 'No',
      new Date().toISOString(),
      data.submittedBy || Session.getActiveUser().getEmail() || 'Unknown'
    ];

    // Add winner data
    if (data.winners && Array.isArray(data.winners)) {
      data.winners.forEach(winner => {
        rowData.push(winner.name || '');
        rowData.push(winner.apartment || '');
      });
    }

    // Fill remaining winner columns with empty strings if needed (10 winners × 2 columns = 20)
    const winnersNeeded = 20 - ((data.winners && data.winners.length * 2) || 0);
    for (let i = 0; i < winnersNeeded; i++) {
      rowData.push('');
    }

    // Add runner-up data
    if (data.runnerUps && Array.isArray(data.runnerUps)) {
      data.runnerUps.forEach(runnerUp => {
        rowData.push(runnerUp.name || '');
        rowData.push(runnerUp.apartment || '');
      });
    }

    // Fill remaining runner-up columns with empty strings if needed (10 runner-ups × 2 columns = 20)
    const runnerUpsNeeded = 20 - ((data.runnerUps && data.runnerUps.length * 2) || 0);
    for (let i = 0; i < runnerUpsNeeded; i++) {
      rowData.push('');
    }

    // Append the row
    winnerSheet.appendRow(rowData);

    Logger.log('Winner entry saved successfully: ' + submissionId);

    return dataResponse({
      status: 'success',
      message: 'Winner entry submitted successfully',
      requestId: submissionId
    });
  } catch (error) {
    Logger.log('Error in submitWinner: ' + error.toString());
    return errorResponse('Failed to submit winner entry: ' + error.toString());
  }
}

function getWinnersData() {
  try {
    const ss = SpreadsheetApp.openById(registrationWorkbookId);

    // Get WinnerEntries sheet
    const winnerSheet = ss.getSheetByName(winnerEntriesSheetName);
    if (!winnerSheet) {
      return dataResponse({
        status: 'success',
        winners: []
      });
    }

    // Get WinnerUnregistered sheet for invalid entries
    const unregisteredSheet = ss.getSheetByName(winnerUnregisteredSheetName);
    const invalidNames = new Set();

    if (unregisteredSheet) {
      const unregisteredData = unregisteredSheet.getDataRange().getValues();
      // Skip header row
      for (let i = 1; i < unregisteredData.length; i++) {
        const row = unregisteredData[i];
        // Name_WinnerEntries is in column 7 (index 6)
        if (row[6]) {
          const name = row[6].toString().trim().toLowerCase();
          invalidNames.add(name);
        }
      }
    }

    // Get winner data
    const winnerData = winnerSheet.getDataRange().getValues();
    const winners = [];

    // Skip header row
    for (let i = 1; i < winnerData.length; i++) {
      const row = winnerData[i];

      // Extract competition data
      const competition = {
        submissionId: row[0] || '',
        category: row[1] || '',
        name: row[2] || '',
        ageGroup: row[3] || '',
        gender: row[4] || '',
        hadTie: row[5] || '',
        submissionDate: row[6] || '',
        submittedBy: row[7] || '',
        winners: [],
        runnerUps: []
      };

      // Extract winners (columns 8-27: Winner 1-10 Name and Apartment)
      for (let j = 0; j < 10; j++) {
        const nameIndex = 8 + (j * 2);
        const apartmentIndex = 9 + (j * 2);

        const name = row[nameIndex] ? row[nameIndex].toString().trim() : '';
        const apartment = row[apartmentIndex] ? row[apartmentIndex].toString().trim() : '';

        if (name && apartment) {
          // Check if this person is in the invalid names list
          if (!invalidNames.has(name.toLowerCase())) {
            competition.winners.push({
              name: name,
              apartment: apartment,
              position: j + 1
            });
          }
        }
      }

      // Extract runner-ups (columns 28-47: Runner-up 1-10 Name and Apartment)
      for (let j = 0; j < 10; j++) {
        const nameIndex = 28 + (j * 2);
        const apartmentIndex = 29 + (j * 2);

        const name = row[nameIndex] ? row[nameIndex].toString().trim() : '';
        const apartment = row[apartmentIndex] ? row[apartmentIndex].toString().trim() : '';

        if (name && apartment) {
          // Check if this person is in the invalid names list
          if (!invalidNames.has(name.toLowerCase())) {
            competition.runnerUps.push({
              name: name,
              apartment: apartment,
              position: j + 1
            });
          }
        }
      }

      // Only include competitions that have winners or runner-ups
      if (competition.winners.length > 0 || competition.runnerUps.length > 0) {
        winners.push(competition);
      }
    }

    // Sort by submission date (most recent first)
    winners.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));

    return dataResponse({
      status: 'success',
      winners: winners
    });

  } catch (error) {
    Logger.log('Error in getWinnersData: ' + error.toString());
    return errorResponse('Failed to fetch winner data: ' + error.toString());
  }
}

function validateWinnerRegistrations() {
  try {
    const ss = SpreadsheetApp.openById(registrationWorkbookId);

    // Get FormData sheet for validation
    const formDataSheet = ss.getSheetByName(formDataSheetName);
    if (!formDataSheet) {
      return errorResponse('FormData sheet not found');
    }

    // Get WinnerEntries sheet
    const winnerSheet = ss.getSheetByName(winnerEntriesSheetName);
    if (!winnerSheet) {
      return errorResponse('WinnerEntries sheet not found');
    }

    // Get WinnerUnregistered sheet (create if doesn't exist)
    let unregisteredSheet = ss.getSheetByName(winnerUnregisteredSheetName);
    if (!unregisteredSheet) {
      unregisteredSheet = ss.insertSheet(winnerUnregisteredSheetName);
      // Add headers: Age Group, Name, Apartment, Reason
      const headers = ['Age Group', 'Name', 'Apartment', 'Reason'];
      unregisteredSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      unregisteredSheet.setFrozenRows(1);
    } else {
      // Clear existing data (keep headers)
      const lastRow = unregisteredSheet.getLastRow();
      if (lastRow > 1) {
        unregisteredSheet.getRange(2, 1, lastRow - 1, 10).clearContent();
      }
    }

    // Load FormData into lookup structures for the new validation logic
    const formData = formDataSheet.getDataRange().getValues();
    const registeredParticipants = new Map();
    const apartmentSet = new Set(); // All normalized apartments from FormData
    const apartmentToNames = new Map(); // Apartment -> Set of registered names
    const allNames = new Set(); // All registered names

    // Get FormData headers to find correct column indices
    const formDataHeaders = formData[0];
    const formDataNameIndex = formDataHeaders.indexOf('Name');
    const formDataTowerIndex = formDataHeaders.indexOf('Tower');
    const formDataFlatIndex = formDataHeaders.indexOf('Flat');
    const formDataAgeGroupIndex = formDataHeaders.indexOf('Age Group');

    // Skip header row
    for (let i = 1; i < formData.length; i++) {
      const row = formData[i];
      if (row[formDataNameIndex] && row[formDataTowerIndex] && row[formDataFlatIndex]) {
        const name = row[formDataNameIndex].toString().trim().toUpperCase();
        const tower = row[formDataTowerIndex].toString().trim().toUpperCase();
        let flat = row[formDataFlatIndex].toString().trim().toUpperCase();

        // Pad flat number to 3 digits (only for 1 or 2 digit flats)
        const flatNum = parseInt(flat);
        if (!isNaN(flatNum) && flatNum >= 0 && flatNum <= 999) {
          flat = flatNum.toString().padStart(3, '0');
        }

        const apartment = `${tower}-${flat}`;

        // Normalize apartment format the same way as winner validation
        const normalizedApartment = apartment
          .toUpperCase()
          .replace(/\s*-\s*/g, '-')  // Replace " - " with "-"
          .replace(/\s+/g, '')       // Remove remaining spaces
          .replace(/-+/g, '-');      // Normalize multiple dashes to single dash

        // Add to apartment set
        apartmentSet.add(normalizedApartment);

        // Add to apartment-to-names mapping
        if (!apartmentToNames.has(normalizedApartment)) {
          apartmentToNames.set(normalizedApartment, new Set());
        }
        apartmentToNames.get(normalizedApartment).add(name);

        // Add to all names set
        allNames.add(name);

        // Create lookup key for backward compatibility
        const key = `${name}_${normalizedApartment}`;
        registeredParticipants.set(key, {
          name: row[formDataNameIndex].toString().trim(),
          apartment: apartment, // Keep original apartment for display
          normalizedApartment: normalizedApartment, // Store normalized version
          ageGroup: row[formDataAgeGroupIndex] ? row[formDataAgeGroupIndex].toString().trim() : '' // Age Group column
        });
      }
    }
    Logger.log(`Loaded ${registeredParticipants.size} registered participants from FormData`);

    // Load WinnerEntries data
    const winnerData = winnerSheet.getDataRange().getValues();
    const invalidEntries = [];
    const processedEntries = new Set(); // Track processed entries to avoid duplicates

    Logger.log('Validating winner entries...');
    // Skip header row
    for (let i = 1; i < winnerData.length; i++) {
      const row = winnerData[i];
      const ageGroup = row[3] || ''; // Age Group column
      const competitionName = row[2] || ''; // Competition Name for logging

      // Check winners (columns 8-27: Winner 1-10 Name and Apartment)
      for (let j = 0; j < 10; j++) {
        const nameIndex = 8 + (j * 2);
        const apartmentIndex = 9 + (j * 2);

        const winnerName = row[nameIndex] ? row[nameIndex].toString().trim() : '';
        const winnerApartment = row[apartmentIndex] ? row[apartmentIndex].toString().trim() : '';

        if (winnerName && winnerApartment) {
          // First, pad flat numbers in the winner apartment string
          let paddedWinnerApartment = winnerApartment;
          // Extract flat number and pad it (assuming format like "TOWER X - YYY" or "TOWERX-YYY")
          const flatMatch = winnerApartment.match(/-(\d+)$/);
          if (flatMatch) {
            const flatNum = parseInt(flatMatch[1]);
            if (!isNaN(flatNum) && flatNum >= 0 && flatNum <= 999) {
              const paddedFlat = flatNum.toString().padStart(3, '0');
              paddedWinnerApartment = winnerApartment.replace(/-(\d+)$/, `-${paddedFlat}`);
            }
          }

          // Normalize apartment format more robustly
          const normalizedApartment = paddedWinnerApartment
            .toUpperCase()
            .replace(/\s*-\s*/g, '-')  // Replace " - " with "-"
            .replace(/\s+/g, '')       // Remove remaining spaces
            .replace(/-+/g, '-');      // Normalize multiple dashes to single dash

          // Check if apartment exists in FormData
          if (apartmentSet.has(normalizedApartment)) {
            // Apartment exists - check name validation
            const winnerNameUpper = winnerName.toUpperCase();

            if (!allNames.has(winnerNameUpper)) {
              // Name not found in FormData at all - VALID
              // Reason: "At least one registration from apartment is present."
              // This is valid because someone from the apartment is registered
            } else {
              // Name exists in FormData - check if it's registered to this apartment
              const namesForApartment = apartmentToNames.get(normalizedApartment);
              if (!namesForApartment.has(winnerNameUpper)) {
                // Name exists but not for this apartment - INVALID (Name Mismatch)
                // Find closest match by name for debugging
                let closestMatch = null;
                for (let [key, participant] of registeredParticipants) {
                  if (participant.name.toUpperCase() === winnerNameUpper) {
                    closestMatch = participant;
                    break;
                  }
                }

                // Create unique key to prevent duplicates
                const entryKey = `${winnerName.toUpperCase()}_${winnerApartment.toUpperCase()}_${ageGroup}`;
                if (!processedEntries.has(entryKey)) {
                  processedEntries.add(entryKey);
                  invalidEntries.push({
                    formDataAgeGroup: closestMatch ? `'${closestMatch.ageGroup}` : '',
                    formDataName: closestMatch ? closestMatch.name : '',
                    formDataTower: closestMatch ? closestMatch.apartment.split('-')[0] : '',
                    formDataFlat: closestMatch ? closestMatch.apartment.split('-')[1] : '',
                    formDataApartment: closestMatch ? `${closestMatch.apartment.split('-')[0]} - ${closestMatch.apartment.split('-')[1]}` : '',
                    winnerAgeGroup: `'${ageGroup}`,
                    winnerName: winnerName,
                    winnerApartment: winnerApartment,
                    isValid: 'INVALID',
                    reason: 'Name Mismatch'
                  });
                }
              }
              // If name matches apartment, it's valid (no action needed)
            }
          } else {
            // Apartment not found in FormData - INVALID
            // Find closest match by name for debugging
            let closestMatch = null;
            for (let [key, participant] of registeredParticipants) {
              if (participant.name.toUpperCase() === winnerName.toUpperCase()) {
                closestMatch = participant;
                break;
              }
            }

            // Create unique key to prevent duplicates
            const entryKey = `${winnerName.toUpperCase()}_${winnerApartment.toUpperCase()}_${ageGroup}`;
            if (!processedEntries.has(entryKey)) {
              processedEntries.add(entryKey);
              invalidEntries.push({
                formDataAgeGroup: closestMatch ? `'${closestMatch.ageGroup}` : '',
                formDataName: closestMatch ? closestMatch.name : '',
                formDataTower: closestMatch ? closestMatch.apartment.split('-')[0] : '',
                formDataFlat: closestMatch ? closestMatch.apartment.split('-')[1] : '',
                formDataApartment: closestMatch ? `${closestMatch.apartment.split('-')[0]} - ${closestMatch.apartment.split('-')[1]}` : '',
                winnerAgeGroup: `'${ageGroup}`,
                winnerName: winnerName,
                winnerApartment: winnerApartment,
                isValid: 'INVALID',
                reason: 'No registration found from apartment.'
              });
            }
          }
        }
      }

      // Check runner-ups (columns 28-47: Runner-up 1-10 Name and Apartment)
      for (let j = 0; j < 10; j++) {
        const nameIndex = 28 + (j * 2);
        const apartmentIndex = 29 + (j * 2);

        const runnerName = row[nameIndex] ? row[nameIndex].toString().trim() : '';
        const runnerApartment = row[apartmentIndex] ? row[apartmentIndex].toString().trim() : '';

        if (runnerName && runnerApartment) {
          // First, pad flat numbers in the runner apartment string
          let paddedRunnerApartment = runnerApartment;
          // Extract flat number and pad it (assuming format like "TOWER X - YYY" or "TOWERX-YYY")
          const flatMatch = runnerApartment.match(/-(\d+)$/);
          if (flatMatch) {
            const flatNum = parseInt(flatMatch[1]);
            if (!isNaN(flatNum) && flatNum >= 0 && flatNum <= 999) {
              const paddedFlat = flatNum.toString().padStart(3, '0');
              paddedRunnerApartment = runnerApartment.replace(/-(\d+)$/, `-${paddedFlat}`);
            }
          }

          // Normalize apartment format more robustly
          const normalizedApartment = paddedRunnerApartment
            .toUpperCase()
            .replace(/\s*-\s*/g, '-')  // Replace " - " with "-"
            .replace(/\s+/g, '')       // Remove remaining spaces
            .replace(/-+/g, '-');      // Normalize multiple dashes to single dash

          // Check if apartment exists in FormData
          if (apartmentSet.has(normalizedApartment)) {
            // Apartment exists - check name validation
            const runnerNameUpper = runnerName.toUpperCase();

            if (!allNames.has(runnerNameUpper)) {
              // Name not found in FormData at all - VALID
              // Reason: "At least one registration from apartment is present."
              // This is valid because someone from the apartment is registered
            } else {
              // Name exists in FormData - check if it's registered to this apartment
              const namesForApartment = apartmentToNames.get(normalizedApartment);
              if (!namesForApartment.has(runnerNameUpper)) {
                // Name exists but not for this apartment - INVALID (Name Mismatch)
                // Find closest match by name for debugging
                let closestMatch = null;
                for (let [key, participant] of registeredParticipants) {
                  if (participant.name.toUpperCase() === runnerNameUpper) {
                    closestMatch = participant;
                    break;
                  }
                }

                // Create unique key to prevent duplicates
                const entryKey = `${runnerName.toUpperCase()}_${runnerApartment.toUpperCase()}_${ageGroup}`;
                if (!processedEntries.has(entryKey)) {
                  processedEntries.add(entryKey);
                  invalidEntries.push({
                    formDataAgeGroup: closestMatch ? `'${closestMatch.ageGroup}` : '',
                    formDataName: closestMatch ? closestMatch.name : '',
                    formDataTower: closestMatch ? closestMatch.apartment.split('-')[0] : '',
                    formDataFlat: closestMatch ? closestMatch.apartment.split('-')[1] : '',
                    formDataApartment: closestMatch ? `${closestMatch.apartment.split('-')[0]} - ${closestMatch.apartment.split('-')[1]}` : '',
                    winnerAgeGroup: `'${ageGroup}`,
                    winnerName: runnerName,
                    winnerApartment: runnerApartment,
                    isValid: 'INVALID',
                    reason: 'Name Mismatch'
                  });
                }
              }
              // If name matches apartment, it's valid (no action needed)
            }
          } else {
            // Apartment not found in FormData - INVALID
            // Find closest match by name for debugging
            let closestMatch = null;
            for (let [key, participant] of registeredParticipants) {
              if (participant.name.toUpperCase() === runnerName.toUpperCase()) {
                closestMatch = participant;
                break;
              }
            }

            // Create unique key to prevent duplicates
            const entryKey = `${runnerName.toUpperCase()}_${runnerApartment.toUpperCase()}_${ageGroup}`;
            if (!processedEntries.has(entryKey)) {
              processedEntries.add(entryKey);
              invalidEntries.push({
                formDataAgeGroup: closestMatch ? `'${closestMatch.ageGroup}` : '',
                formDataName: closestMatch ? closestMatch.name : '',
                formDataTower: closestMatch ? closestMatch.apartment.split('-')[0] : '',
                formDataFlat: closestMatch ? closestMatch.apartment.split('-')[1] : '',
                formDataApartment: closestMatch ? `${closestMatch.apartment.split('-')[0]} - ${closestMatch.apartment.split('-')[1]}` : '',
                winnerAgeGroup: `'${ageGroup}`,
                winnerName: runnerName,
                winnerApartment: runnerApartment,
                isValid: 'INVALID',
                reason: 'No registration found from apartment.'
              });
            }
          }
        }
      }
    }

    Logger.log(`Found ${invalidEntries.length} invalid entries total`);

    // Add headers to WinnerUnregistered sheet
    const headers = [
      'Age Group_FormData',
      'Name_FormData',
      'Tower_FormData',
      'Flat_FormData',
      'Apartment_FormData',
      'Age Group_WinnerEntries',
      'Name_WinnerEntries',
      'Apartment_WinnerEntries',
      'IsValid?',
      'Reason'
    ];
    unregisteredSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Add invalid entries to WinnerUnregistered sheet
    if (invalidEntries.length > 0) {
      // Since we cleared the sheet, we can add all entries directly
      const rowsToAppend = invalidEntries.map(entry => [
        entry.formDataAgeGroup,
        entry.formDataName,
        entry.formDataTower,
        entry.formDataFlat,
        entry.formDataApartment,
        entry.winnerAgeGroup,
        entry.winnerName,
        entry.winnerApartment,
        entry.isValid,
        entry.reason
      ]);
      unregisteredSheet.getRange(2, 1, invalidEntries.length, headers.length).setValues(rowsToAppend);

      Logger.log(`Added ${invalidEntries.length} invalid winner entries to WinnerUnregistered sheet`);
    }

    return dataResponse({
      status: 'success',
      message: `Validation completed. Found ${invalidEntries.length} invalid entries.`,
      invalidCount: invalidEntries.length
    });

  } catch (error) {
    Logger.log('Error in validateWinnerRegistrations: ' + error.toString());
    return errorResponse('Failed to validate winner registrations: ' + error.toString());
  }
}

// Feedback functions
function getFeedbackData() {
  try {
    const ss = SpreadsheetApp.openById(registrationWorkbookId);
    const feedbackSheetName = 'Feedback';
    
    let feedbackSheet = ss.getSheetByName(feedbackSheetName);
    if (!feedbackSheet) {
      // Return empty array if sheet doesn't exist yet
      return dataResponse({
        status: 'success',
        feedback: []
      });
    }

    const data = feedbackSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      // Only headers or empty
      return dataResponse({
        status: 'success',
        feedback: []
      });
    }

    // Convert to objects (skip header row)
    const feedback = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[1] && row[2] && row[3]) { // Ensure required fields are present
        feedback.push({
          id: row[0], // Feedback ID
          type: row[1], // Feedback Type
          text: row[2], // Feedback Text
          timestamp: row[3], // Timestamp
          status: row[4] || 'New' // Status (default to 'New' if not set)
        });
      }
    }

    return dataResponse({
      status: 'success',
      feedback: feedback
    });

  } catch (error) {
    Logger.log('Error in getFeedbackData: ' + error.toString());
    return errorResponse('Failed to retrieve feedback: ' + error.toString());
  }
}

function submitFeedbackData(requestData) {
  try {
    const { feedbackType, feedbackText, timestamp } = requestData;

    if (!feedbackType || !feedbackText || !timestamp) {
      return errorResponse('Missing required feedback data');
    }

    const ss = SpreadsheetApp.openById(registrationWorkbookId);
    const feedbackSheetName = 'Feedback';
    
    let feedbackSheet = ss.getSheetByName(feedbackSheetName);
    if (!feedbackSheet) {
      // Create the sheet if it doesn't exist
      feedbackSheet = ss.insertSheet(feedbackSheetName);
      
      // Add headers
      const headers = [
        'Feedback ID',
        'Feedback Type',
        'Feedback Text', 
        'Timestamp',
        'Status'
      ];
      feedbackSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header row
      feedbackSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f8f9fa');
    }

    // Generate unique ID
    const feedbackId = Utilities.getUuid();
    
    // Add the feedback entry
    const newRow = [
      feedbackId,
      feedbackType,
      feedbackText,
      timestamp,
      'New' // Default status
    ];
    
    feedbackSheet.appendRow(newRow);

    return dataResponse({
      status: 'success',
      message: 'Feedback submitted successfully',
      feedbackId: feedbackId
    });

  } catch (error) {
    Logger.log('Error in submitFeedbackData: ' + error.toString());
    return errorResponse('Failed to submit feedback: ' + error.toString());
  }
}

