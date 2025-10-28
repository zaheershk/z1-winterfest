// ---- CODE FOR UI BACKEND ----
const registrationWorkbookId = '1k6k68Upe41ct_hwa-1VQbnCN6rtFiPZXSal_uPYMOfg';

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

        // Prepare the row data
        const rowData = [
          registrationId, // Use the same registration ID for all participants in this submission
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
          batchData.acknowledgement || false,
          batchData.paymentMethod || '',
          paymentProofUrl, // Same URL for all participants in batch
          batchData.totalAmount || 0, // Total amount calculated on frontend
          new Date().toISOString(), // Registration Date
          'Received' // Status
        ];

        // Open the Google Sheet and append
        const ss = SpreadsheetApp.openById(registrationWorkbookId);
        let sheet = ss.getSheetByName('FormData');

        // Check if sheet exists, create it if not
        if (!sheet) {
          Logger.log('Sheet "FormData" not found, creating it...');
          sheet = ss.insertSheet('FormData');
          const headers = [
            'Registration ID', 'Email', 'Name', 'Phone', 'Tower', 'Flat', 'Gender', 'Age', 'Age Group',
            'Competitions', 'Food Stalls', 'Acknowledgement', 'Payment Method', 'Payment Proof URL',
            'Total Amount', 'Registration Date', 'Status'
          ];
          sheet.appendRow(headers);
          Logger.log('Sheet created with headers');
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
    const sheet = ss.getSheetByName('FormData');

    if (!sheet) {
      return errorResponse('FormData sheet not found');
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
    const sheet = ss.getSheetByName('FormData');

    if (!sheet) {
      return errorResponse('FormData sheet not found');
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


