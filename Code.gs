// ===== KONFIGURASI =====
const CONFIG = {
  GEMINI_API_KEY: '<APIKEY-GEMINI>',
  GEMINI_MODEL: 'gemini-2.0-flash',
  SPREADSHEET_ID: '<SPREADSHEET-ID>',
  SHEETS: {
    LOG: 'log',
    METADATA: 'metadata',
    DOCUMENTS: 'data_dokumen'
  },
  FOLDER_ID: '<FOLDER-ID>',
  API_VERSION: '1.0.0'
};

// ===== PROMPT TEMPLATE =====
const PROMPT_TEMPLATE = `<prompt bisa dicheckout https://lynk.id/classyid>`;

// ===== MAIN API HANDLER =====
function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  try {
    // Set CORS headers
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    // Parse request
    const path = e.parameter.action || e.pathInfo || '';
    const params = e.parameter || {};
    
    let response;
    
    // Route requests
    switch (path) {
      case 'health':
        response = handleHealthCheck();
        break;
      case 'upload':
        if (method !== 'POST') {
          response = createErrorResponse('Method not allowed', 405);
        } else {
          response = handleDocumentUpload(e);
        }
        break;
      case 'documents':
        response = handleGetDocuments(params);
        break;
      case 'document':
        response = handleGetDocument(params);
        break;
      case 'search':
        response = handleSearchDocuments(params);
        break;
      case 'stats':
        response = handleGetStats();
        break;
      case 'logs':
        response = handleGetLogs(params);
        break;
      default:
        response = createErrorResponse('Endpoint not found', 404);
    }
    
    output.setContent(JSON.stringify(response));
    return output;
    
  } catch (error) {
    logAction('API Error', `Request error: ${error.toString()}`, 'ERROR');
    const errorResponse = createErrorResponse('Internal server error', 500, error.toString());
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== API ENDPOINTS =====

/**
 * Health Check Endpoint
 * GET /health
 */
function handleHealthCheck() {
  return createSuccessResponse({
    status: 'OK',
    version: CONFIG.API_VERSION,
    timestamp: new Date().toISOString(),
    services: {
      gemini: 'Connected',
      spreadsheet: 'Connected',
      drive: 'Connected'
    }
  }, 'API is healthy');
}

/**
 * Upload Document Endpoint
 * POST /upload
 */
function handleDocumentUpload(e) {
  try {
    // Parse multipart form data or JSON
    let fileData, fileName, mimeType;
    
    if (e.postData && e.postData.contents) {
      const postData = JSON.parse(e.postData.contents);
      fileData = postData.fileData;
      fileName = postData.fileName;
      mimeType = postData.mimeType;
    } else {
      // Handle form data
      const params = e.parameter;
      fileData = params.fileData;
      fileName = params.fileName;
      mimeType = params.mimeType;
    }
    
    if (!fileData || !fileName) {
      return createErrorResponse('Missing required fields: fileData, fileName', 400);
    }
    
    // Process document
    const result = processDocument(fileData, fileName, mimeType);
    
    if (result.success) {
      return createSuccessResponse({
        document: {
          fileName: fileName,
          fileUrl: result.fileUrl,
          description: result.description,
          dataSaved: result.dataSaved,
          processedAt: new Date().toISOString()
        }
      }, 'Document processed successfully');
    } else {
      return createErrorResponse('Document processing failed', 422, result.error);
    }
    
  } catch (error) {
    logAction('Upload Error', `Upload error: ${error.toString()}`, 'ERROR');
    return createErrorResponse('Upload processing failed', 500, error.toString());
  }
}

/**
 * Get Documents Endpoint
 * GET /documents?limit=10&offset=0&type=all
 */
function handleGetDocuments(params) {
  try {
    const limit = parseInt(params.limit) || 10;
    const offset = parseInt(params.offset) || 0;
    const type = params.type || 'all';
    
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const dataSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.DOCUMENTS);
    
    if (!dataSheet) {
      return createErrorResponse('Documents sheet not found', 404);
    }
    
    const data = dataSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Filter by type if specified
    let filteredRows = rows;
    if (type !== 'all') {
      const typeIndex = headers.indexOf('Jenis Dokumen');
      if (typeIndex !== -1) {
        filteredRows = rows.filter(row => 
          row[typeIndex] && row[typeIndex].toLowerCase().includes(type.toLowerCase())
        );
      }
    }
    
    // Apply pagination
    const paginatedRows = filteredRows.slice(offset, offset + limit);
    
    // Convert to objects
    const documents = paginatedRows.map(row => {
      const doc = {};
      headers.forEach((header, index) => {
        doc[header.toLowerCase().replace(/[^a-z0-9]/g, '_')] = row[index] || '';
      });
      return doc;
    });
    
    return createSuccessResponse({
      documents: documents,
      pagination: {
        total: filteredRows.length,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < filteredRows.length
      }
    }, `Retrieved ${documents.length} documents`);
    
  } catch (error) {
    logAction('Get Documents Error', error.toString(), 'ERROR');
    return createErrorResponse('Failed to retrieve documents', 500, error.toString());
  }
}

/**
 * Get Single Document Endpoint
 * GET /document?fileName=example.pdf
 */
function handleGetDocument(params) {
  try {
    const fileName = params.fileName;
    
    if (!fileName) {
      return createErrorResponse('fileName parameter is required', 400);
    }
    
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const dataSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.DOCUMENTS);
    
    if (!dataSheet) {
      return createErrorResponse('Documents sheet not found', 404);
    }
    
    const data = dataSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const fileNameIndex = headers.indexOf('File Name');
    if (fileNameIndex === -1) {
      return createErrorResponse('File Name column not found', 500);
    }
    
    const documentRow = rows.find(row => row[fileNameIndex] === fileName);
    
    if (!documentRow) {
      return createErrorResponse('Document not found', 404);
    }
    
    // Convert to object
    const document = {};
    headers.forEach((header, index) => {
      document[header.toLowerCase().replace(/[^a-z0-9]/g, '_')] = documentRow[index] || '';
    });
    
    return createSuccessResponse({ document }, 'Document retrieved successfully');
    
  } catch (error) {
    logAction('Get Document Error', error.toString(), 'ERROR');
    return createErrorResponse('Failed to retrieve document', 500, error.toString());
  }
}

/**
 * Search Documents Endpoint
 * GET /search?q=OJK&field=all&limit=10
 */
function handleSearchDocuments(params) {
  try {
    const query = params.q;
    const field = params.field || 'all';
    const limit = parseInt(params.limit) || 10;
    
    if (!query) {
      return createErrorResponse('Query parameter (q) is required', 400);
    }
    
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const dataSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.DOCUMENTS);
    
    if (!dataSheet) {
      return createErrorResponse('Documents sheet not found', 404);
    }
    
    const data = dataSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Search logic
    const searchResults = [];
    const searchTerm = query.toLowerCase();
    
    rows.forEach(row => {
      let match = false;
      
      if (field === 'all') {
        // Search in all fields
        match = row.some(cell => 
          cell && cell.toString().toLowerCase().includes(searchTerm)
        );
      } else {
        // Search in specific field
        const fieldIndex = headers.findIndex(header => 
          header.toLowerCase().replace(/[^a-z0-9]/g, '_') === field.toLowerCase()
        );
        if (fieldIndex !== -1 && row[fieldIndex]) {
          match = row[fieldIndex].toString().toLowerCase().includes(searchTerm);
        }
      }
      
      if (match) {
        const doc = {};
        headers.forEach((header, index) => {
          doc[header.toLowerCase().replace(/[^a-z0-9]/g, '_')] = row[index] || '';
        });
        searchResults.push(doc);
      }
    });
    
    // Apply limit
    const limitedResults = searchResults.slice(0, limit);
    
    return createSuccessResponse({
      results: limitedResults,
      total: searchResults.length,
      query: query,
      field: field
    }, `Found ${searchResults.length} matching documents`);
    
  } catch (error) {
    logAction('Search Error', error.toString(), 'ERROR');
    return createErrorResponse('Search failed', 500, error.toString());
  }
}

/**
 * Get Statistics Endpoint
 * GET /stats
 */
function handleGetStats() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const dataSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.DOCUMENTS);
    
    if (!dataSheet) {
      return createErrorResponse('Documents sheet not found', 404);
    }
    
    const data = dataSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Calculate statistics
    const totalDocuments = rows.length;
    
    // Count by document type
    const typeIndex = headers.indexOf('Jenis Dokumen');
    const typeCounts = {};
    
    // Count by year
    const yearIndex = headers.indexOf('Tahun Terbit');
    const yearCounts = {};
    
    // Count by institution
    const institutionIndex = headers.indexOf('Instansi Penerbit');
    const institutionCounts = {};
    
    rows.forEach(row => {
      // Document type stats
      if (typeIndex !== -1 && row[typeIndex]) {
        const type = row[typeIndex];
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
      
      // Year stats
      if (yearIndex !== -1 && row[yearIndex]) {
        const year = row[yearIndex];
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      }
      
      // Institution stats
      if (institutionIndex !== -1 && row[institutionIndex]) {
        const institution = row[institutionIndex];
        institutionCounts[institution] = (institutionCounts[institution] || 0) + 1;
      }
    });
    
    return createSuccessResponse({
      totalDocuments: totalDocuments,
      byType: typeCounts,
      byYear: yearCounts,
      byInstitution: institutionCounts,
      lastUpdated: new Date().toISOString()
    }, 'Statistics retrieved successfully');
    
  } catch (error) {
    logAction('Stats Error', error.toString(), 'ERROR');
    return createErrorResponse('Failed to retrieve statistics', 500, error.toString());
  }
}

/**
 * Get Logs Endpoint
 * GET /logs?limit=50&level=all
 */
function handleGetLogs(params) {
  try {
    const limit = parseInt(params.limit) || 50;
    const level = params.level || 'all';
    
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const logSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.LOG);
    
    if (!logSheet) {
      return createErrorResponse('Log sheet not found', 404);
    }
    
    const data = logSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Filter by level if specified
    let filteredRows = rows;
    if (level !== 'all') {
      const levelIndex = headers.indexOf('Level');
      if (levelIndex !== -1) {
        filteredRows = rows.filter(row => 
          row[levelIndex] && row[levelIndex].toLowerCase() === level.toLowerCase()
        );
      }
    }
    
    // Sort by timestamp (newest first) and apply limit
    filteredRows.sort((a, b) => new Date(b[0]) - new Date(a[0]));
    const limitedRows = filteredRows.slice(0, limit);
    
    // Convert to objects
    const logs = limitedRows.map(row => ({
      timestamp: row[0],
      action: row[1],
      message: row[2],
      level: row[3]
    }));
    
    return createSuccessResponse({
      logs: logs,
      total: filteredRows.length,
      limit: limit,
      level: level
    }, `Retrieved ${logs.length} log entries`);
    
  } catch (error) {
    logAction('Get Logs Error', error.toString(), 'ERROR');
    return createErrorResponse('Failed to retrieve logs', 500, error.toString());
  }
}

// ===== CORE FUNCTIONS =====

/**
 * Process Document (Enhanced)
 */
function processDocument(fileData, fileName, mimeType) {
  try {
    logAction('Request', `Document processing request received: ${fileName} (${mimeType})`, 'INFO');
    
    // Save document to Drive
    const folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
    const blob = Utilities.newBlob(Utilities.base64Decode(fileData), mimeType, fileName);
    const file = folder.createFile(blob);
    const fileId = file.getId();
    const fileUrl = file.getUrl();
    
    logAction('File Upload', `File saved to Drive: ${fileName}, ID: ${fileId}`, 'INFO');
    
    let rawResponse;
    
    // Handle different file types
    if (mimeType.startsWith('image/')) {
      const requestBody = {
        contents: [{
          parts: [
            { text: PROMPT_TEMPLATE },
            { inline_data: { mime_type: mimeType, data: fileData } }
          ]
        }]
      };
      rawResponse = callGeminiAPI(requestBody);
      
    } else if (mimeType === 'application/pdf') {
      logAction('PDF Processing', 'Attempting PDF analysis', 'INFO');
      
      try {
        const directRequestBody = {
          contents: [{
            parts: [
              { text: PROMPT_TEMPLATE + '\n\nAnalisis dokumen PDF berikut:' },
              { inline_data: { mime_type: mimeType, data: fileData } }
            ]
          }]
        };
        rawResponse = callGeminiAPI(directRequestBody);
        logAction('PDF Processing', 'Direct PDF analysis successful', 'INFO');
        
      } catch (directError) {
        logAction('PDF Direct Error', `Direct PDF failed: ${directError.toString()}`, 'WARN');
        
        try {
          rawResponse = convertPDFToImageAndProcess(fileData, fileName, mimeType);
          logAction('PDF Processing', 'PDF to image conversion successful', 'INFO');
          
        } catch (conversionError) {
          logAction('PDF Conversion Error', `Conversion failed: ${conversionError.toString()}`, 'WARN');
          
          return {
            success: true,
            description: `PDF tidak dapat diproses secara otomatis. Silakan:
1. Convert PDF ke gambar (PNG/JPG) terlebih dahulu, atau
2. Screenshot halaman pertama PDF, atau  
3. Gunakan PDF yang tidak ter-enkripsi

File telah disimpan di Drive untuk referensi: ${fileName}`,
            fileUrl: fileUrl,
            dataSaved: false
          };
        }
      }
    } else {
      return {
        success: true,
        description: "Format dokumen ini belum didukung. Silakan gunakan PDF atau gambar (JPG/PNG/GIF).",
        fileUrl: fileUrl,
        dataSaved: false
      };
    }
    
    const cleanedResponse = cleanupResponse(rawResponse);
    
    if (cleanedResponse === "Dokumen ini bukan dokumen peraturan/regulasi") {
      logAction('Info', 'Document is not a regulation/legal document', 'INFO');
      return {
        success: true,
        description: cleanedResponse,
        fileUrl: fileUrl,
        dataSaved: false
      };
    }
    
    const docData = parseDocumentData(cleanedResponse);
    const dataSaved = saveDocumentDataToSheet(docData, fileName);
    
    const metadata = {
      timestamp: new Date().toISOString(),
      fileName: fileName,
      fileId: fileId,
      fileUrl: fileUrl,
      description: rawResponse
    };
    
    saveMetadata(metadata);
    logAction('Success', 'Document processed successfully', 'SUCCESS');
    
    return {
      success: true,
      description: cleanedResponse,
      fileUrl: fileUrl,
      dataSaved: dataSaved
    };
    
  } catch (error) {
    logAction('Error', `Error processing document: ${error.toString()}`, 'ERROR');
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Convert PDF to Image and Process
 */
function convertPDFToImageAndProcess(fileData, fileName, mimeType) {
  try {
    logAction('PDF Conversion', 'Converting PDF to image for analysis', 'INFO');
    
    const folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
    const blob = Utilities.newBlob(Utilities.base64Decode(fileData), mimeType, fileName);
    const pdfFile = folder.createFile(blob);
    
    const resource = {
      name: fileName + '_converted_slides',
      parents: [folder.getId()],
      mimeType: 'application/vnd.google-apps.presentation'
    };
    
    const convertedFile = Drive.Files.create(resource, pdfFile.getBlob(), {
      convert: true,
      ocrLanguage: 'id'
    });
    
    if (convertedFile && convertedFile.id) {
      const presentation = SlidesApp.openById(convertedFile.id);
      const slides = presentation.getSlides();
      
      if (slides.length > 0) {
        const slide = slides[0];
        const thumbnail = slide.getThumbnail({
          contentType: 'image/png',
          width: 1024,
          height: 1024
        });
        
        const imageBase64 = Utilities.base64Encode(thumbnail.getBytes());
        
        pdfFile.setTrashed(true);
        DriveApp.getFileById(convertedFile.id).setTrashed(true);
        
        const requestBody = {
          contents: [{
            parts: [
              { text: PROMPT_TEMPLATE + '\n\nCatatan: Dokumen ini dikonversi dari PDF ke gambar untuk analisis.' },
              { inline_data: { mime_type: 'image/png', data: imageBase64 } }
            ]
          }]
        };
        
        return callGeminiAPI(requestBody);
        
      } else {
        throw new Error('No slides found in converted presentation');
      }
    } else {
      throw new Error('Failed to convert PDF');
    }
    
  } catch (error) {
    logAction('PDF Conversion Error', `Error: ${error.toString()}`, 'ERROR');
    throw error;
  }
}

/**
 * Call Gemini API
 */
function callGeminiAPI(requestBody) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
  
  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  };
  
  logAction('API Call', 'Calling Gemini API', 'INFO');
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode !== 200) {
      const errorText = response.getContentText();
      logAction('API Error', `Error from Gemini API: ${errorText}`, 'ERROR');
      throw new Error(`API error: ${responseCode} - ${errorText}`);
    }
    
    const responseJson = JSON.parse(response.getContentText());
    
    if (!responseJson.candidates || responseJson.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }
    
    const text = responseJson.candidates[0].content.parts[0].text;
    return text;
  } catch (error) {
    logAction('API Error', `Error calling Gemini API: ${error.toString()}`, 'ERROR');
    throw error;
  }
}

/**
 * Parse Document Data
 */
function parseDocumentData(description) {
  const docData = {
    jenis_dokumen: '',
    nomor_peraturan: '',
    tahun_terbit: '',
    judul_tentang: '',
    instansi_penerbit: '',
    tanggal_ditetapkan: '',
    tanggal_diundangkan: '',
    nomor_lembaran_negara: '',
    nomor_tambahan_lembaran_negara: '',
    sumber_hukum: '',
    kata_kunci: '',
    bidang_sektor: '',
    status_dokumen: '',
    ringkasan_singkat: '',
    pasal_penting: ''
  };

  const extractField = (pattern, text) => {
    const match = text.match(pattern);
    return match ? match[1].trim() : '';
  };

  docData.jenis_dokumen = extractField(/Jenis Dokumen:\s*(.+?)(?:\n|$)/i, description);
  docData.nomor_peraturan = extractField(/Nomor Peraturan:\s*(.+?)(?:\n|$)/i, description);
  docData.tahun_terbit = extractField(/Tahun Terbit:\s*(.+?)(?:\n|$)/i, description);
  docData.judul_tentang = extractField(/Judul\/Tentang:\s*(.+?)(?:\n|$)/i, description);
  docData.instansi_penerbit = extractField(/Instansi Penerbit:\s*(.+?)(?:\n|$)/i, description);
  docData.tanggal_ditetapkan = extractField(/Tanggal Ditetapkan:\s*(.+?)(?:\n|$)/i, description);
  docData.tanggal_diundangkan = extractField(/Tanggal Diundangkan:\s*(.+?)(?:\n|$)/i, description);
  docData.nomor_lembaran_negara = extractField(/Nomor Lembaran Negara:\s*(.+?)(?:\n|$)/i, description);
  docData.nomor_tambahan_lembaran_negara = extractField(/Nomor Tambahan Lembaran Negara:\s*(.+?)(?:\n|$)/i, description);
  docData.sumber_hukum = extractField(/Sumber Hukum:\s*(.+?)(?:\n|$)/i, description);
  docData.kata_kunci = extractField(/Kata Kunci:\s*(.+?)(?:\n|$)/i, description);
  docData.bidang_sektor = extractField(/Bidang\/Sektor:\s*(.+?)(?:\n|$)/i, description);
  docData.status_dokumen = extractField(/Status Dokumen:\s*(.+?)(?:\n|$)/i, description);
  
  const ringkasanMatch = description.match(/Ringkasan Singkat:\s*(.+?)(?:\nPasal Penting:|$)/is);
  if (ringkasanMatch) {
    docData.ringkasan_singkat = ringkasanMatch[1].trim();
  }
  
  const pasalMatch = description.match(/Pasal Penting:\s*(.+?)$/is);
  if (pasalMatch) {
    docData.pasal_penting = pasalMatch[1].trim();
  }

  return docData;
}

/**
 * Save Document Data to Sheet - FIXED VERSION
 * Menghapus kolom File URL dari header dan data untuk menyesuaikan dengan versi pertama
 */
function saveDocumentDataToSheet(docData, fileName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const dataSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.DOCUMENTS) || spreadsheet.insertSheet(CONFIG.SHEETS.DOCUMENTS);
    
    // Create headers if the sheet is empty - SAMA PERSIS dengan versi pertama
    if (dataSheet.getLastRow() === 0) {
      const headers = [
        'Timestamp', 
        'File Name',
        'Jenis Dokumen',
        'Nomor Peraturan',
        'Tahun Terbit',
        'Judul/Tentang',
        'Instansi Penerbit',
        'Tanggal Ditetapkan',
        'Tanggal Diundangkan',
        'Nomor Lembaran Negara',
        'Nomor Tambahan Lembaran Negara',
        'Sumber Hukum',
        'Kata Kunci',
        'Bidang/Sektor',
        'Status Dokumen',
        'Ringkasan Singkat',
        'Pasal Penting'
      ];
      
      dataSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      dataSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      dataSheet.setFrozenRows(1);
    }
    
    // Prepare data row - SAMA PERSIS dengan versi pertama (tanpa File URL)
    const dataRow = [
      new Date().toISOString(),
      fileName,
      docData.jenis_dokumen || 'Tidak disebutkan',
      docData.nomor_peraturan || 'Tidak disebutkan',
      docData.tahun_terbit || 'Tidak disebutkan',
      docData.judul_tentang || 'Tidak disebutkan',
      docData.instansi_penerbit || 'Tidak disebutkan',
      docData.tanggal_ditetapkan || 'Tidak disebutkan',
      docData.tanggal_diundangkan || 'Tidak disebutkan',
      docData.nomor_lembaran_negara || 'Tidak disebutkan',
      docData.nomor_tambahan_lembaran_negara || 'Tidak disebutkan',
      docData.sumber_hukum || 'Tidak disebutkan',
      docData.kata_kunci || 'Tidak disebutkan',
      docData.bidang_sektor || 'Tidak disebutkan',
      docData.status_dokumen || 'Tidak disebutkan',
      docData.ringkasan_singkat || 'Tidak disebutkan',
      docData.pasal_penting || 'Tidak disebutkan'
    ];
    
    // Append data
    dataSheet.appendRow(dataRow);
    
    // Auto-resize columns for better readability
    dataSheet.autoResizeColumns(1, dataRow.length);
    
    logAction('Data Save', `Document data saved successfully for: ${fileName}`, 'SUCCESS');
    return true;
    
  } catch (error) {
    logAction('Data Error', `Error saving document data: ${error.toString()}`, 'ERROR');
    return false;
  }
}

/**
 * Save Metadata
 */
function saveMetadata(metadata) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const metadataSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.METADATA) || spreadsheet.insertSheet(CONFIG.SHEETS.METADATA);
    
    if (metadataSheet.getLastRow() === 0) {
      const headers = ['Timestamp', 'FileName', 'FileID', 'FileURL', 'Description'];
      metadataSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      metadataSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      metadataSheet.setFrozenRows(1);
    }
    
    metadataSheet.appendRow([
      metadata.timestamp,
      metadata.fileName,
      metadata.fileId,
      metadata.fileUrl,
      metadata.description.substring(0, 1000)
    ]);
    
    metadataSheet.autoResizeColumns(1, 5);
    
  } catch (error) {
    logAction('Metadata Error', `Error saving metadata: ${error.toString()}`, 'ERROR');
    throw error;
  }
}

/**
 * Log Action
 */
function logAction(action, message, level) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const logSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.LOG) || spreadsheet.insertSheet(CONFIG.SHEETS.LOG);
    
    if (logSheet.getLastRow() === 0) {
      const headers = ['Timestamp', 'Action', 'Message', 'Level'];
      logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      logSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      logSheet.setFrozenRows(1);
    }
    
    const row = logSheet.getLastRow() + 1;
    logSheet.appendRow([new Date().toISOString(), action, message, level]);
    
    const range = logSheet.getRange(row, 1, 1, 4);
    switch(level) {
      case 'ERROR':
        range.setBackground('#ffebee');
        break;
      case 'WARN':
        range.setBackground('#fff3e0');
        break;
      case 'SUCCESS':
        range.setBackground('#e8f5e8');
        break;
      case 'INFO':
      default:
        break;
    }
    
  } catch (error) {
    console.error(`Error logging to spreadsheet: ${error.toString()}`);
  }
}

/**
 * Cleanup Response
 */
function cleanupResponse(response) {
  return response.trim();
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create Success Response
 */
function createSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    message: message,
    data: data,
    timestamp: new Date().toISOString(),
    version: CONFIG.API_VERSION
  };
}

/**
 * Create Error Response
 */
function createErrorResponse(message, code = 400, details = null) {
  const response = {
    success: false,
    error: {
      message: message,
      code: code,
      timestamp: new Date().toISOString()
    },
    version: CONFIG.API_VERSION
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return response;
}

// ===== MAINTENANCE FUNCTIONS =====

/**
 * Clean up old logs
 */
function cleanupOldLogs(daysToKeep = 30) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const logSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.LOG);
    
    if (!logSheet) return;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const dataRange = logSheet.getDataRange();
    const values = dataRange.getValues();
    
    let rowsToDelete = [];
    for (let i = 1; i < values.length; i++) {
      const timestamp = new Date(values[i][0]);
      if (timestamp < cutoffDate) {
        rowsToDelete.push(i + 1);
      }
    }
    
    rowsToDelete.reverse().forEach(rowIndex => {
      logSheet.deleteRow(rowIndex);
    });
    
    if (rowsToDelete.length > 0) {
      logAction('Cleanup', `Deleted ${rowsToDelete.length} old log entries`, 'INFO');
    }
    
  } catch (error) {
    logAction('Cleanup Error', `Error cleaning up logs: ${error.toString()}`, 'ERROR');
  }
}

/**
 * Check Data Consistency
 */
function checkDataConsistency() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const metadataSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.METADATA);
    const dataSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.DOCUMENTS);
    
    if (!metadataSheet || !dataSheet) {
      console.log('Required sheets not found');
      return;
    }
    
    const metadataData = metadataSheet.getDataRange().getValues();
    const dataData = dataSheet.getDataRange().getValues();
    
    console.log('=== DATA CONSISTENCY CHECK ===');
    console.log(`Metadata sheet has ${metadataData.length - 1} records`);
    console.log(`Data_dokumen sheet has ${dataData.length - 1} records`);
    
    const metaFileNames = metadataData.slice(1).map(row => row[1]);
    const dataFileNames = dataData.slice(1).map(row => row[1]);
    
    const missingInData = metaFileNames.filter(name => !dataFileNames.includes(name));
    const missingInMeta = dataFileNames.filter(name => !metaFileNames.includes(name));
    
    if (missingInData.length > 0) {
      console.log(`Files in metadata but missing in data_dokumen: ${missingInData.join(', ')}`);
    }
    
    if (missingInMeta.length > 0) {
      console.log(`Files in data_dokumen but missing in metadata: ${missingInMeta.join(', ')}`);
    }
    
    console.log('=== END CHECK ===');
    
  } catch (error) {
    console.error('Error checking consistency:', error);
  }
}
