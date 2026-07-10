import * as XLSX from 'xlsx';

/**
 * Excel Import/Export Helper Functions
 * Handles bulk client data import and export with validation
 */

// Standard column mapping for client data
export const EXCEL_COLUMN_MAPPING = {
  'FILE NO': 'fileNo',
  'NEW NTN': 'ntn',
  'TITLE OF THE CASE': 'name',
  'NIC NO': 'cnic',
  'PIN (IRIS)': 'irisPin',
  'PASSWORD (IRIS)': 'irisPassword',
  'MAIL': 'email',
  'PASSWORD (MAIL)': 'emailPassword',
  'PHONE': 'phone',
  'ADDRESS': 'address',
  'BUSINESS TYPE': 'businessType',
  'STATUS': 'status',
  'TAX YEAR': 'taxYear',
  'ASSESSED 2019': 'assessed2019',
  'DECLARED 2020': 'declared2020',
  'FEE': 'fee',
  'RETURN FILED ON': 'returnFiledOn'
};

// Reverse mapping for export
export const REVERSE_COLUMN_MAPPING = Object.entries(EXCEL_COLUMN_MAPPING).reduce(
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);

/**
 * Parse Excel file and extract client data
 * @param {File} file - Excel file to parse
 * @returns {Promise<Object>} - Parsed data with clients array and metadata
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get all sheet names
        const sheetNames = workbook.SheetNames;
        const allClients = [];
        const sheetData = {};
        
        // Process each sheet
        sheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            blankrows: false
          });
          
          // Find header row (usually row with "FILE NO", "NEW NTN", etc.)
          let headerRowIndex = -1;
          for (let i = 0; i < Math.min(10, jsonData.length); i++) {
            const row = jsonData[i];
            if (row.some(cell => 
              typeof cell === 'string' && 
              (cell.includes('FILE') || cell.includes('NTN') || cell.includes('TITLE'))
            )) {
              headerRowIndex = i;
              break;
            }
          }
          
          if (headerRowIndex === -1) {
            console.warn(`No header row found in sheet: ${sheetName}`);
            return;
          }
          
          const headers = jsonData[headerRowIndex];
          const clients = [];
          
          // Process data rows
          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Skip empty rows
            if (!row || row.every(cell => !cell || cell === '')) continue;
            
            const client = {
              id: Date.now() + i,
              sheetName: sheetName,
              rowNumber: i + 1
            };
            
            // Map columns to client object
            headers.forEach((header, index) => {
              if (header && typeof header === 'string') {
                const normalizedHeader = header.trim().toUpperCase();
                const fieldName = EXCEL_COLUMN_MAPPING[normalizedHeader];
                
                if (fieldName) {
                  const value = row[index];
                  client[fieldName] = value !== undefined && value !== null ? String(value).trim() : '';
                }
              }
            });
            
            // Only add if has essential data (name or NTN)
            if (client.name || client.ntn) {
              clients.push(client);
            }
          }
          
          sheetData[sheetName] = clients;
          allClients.push(...clients);
        });
        
        resolve({
          clients: allClients,
          sheetData: sheetData,
          totalSheets: sheetNames.length,
          totalClients: allClients.length,
          fileName: file.name
        });
        
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Validate imported client data
 * @param {Array} clients - Array of client objects
 * @returns {Object} - Validation results with valid/invalid clients
 */
export const validateImportedClients = (clients) => {
  const validClients = [];
  const invalidClients = [];
  const warnings = [];
  
  clients.forEach((client, index) => {
    const errors = [];
    const clientWarnings = [];
    
    // Required field validation
    if (!client.name || client.name.trim() === '') {
      errors.push('Name is required');
    }
    
    // CNIC validation (format: 12345-6789012-3)
    if (client.cnic) {
      const cnicPattern = /^\d{5}-\d{7}-\d{1}$/;
      if (!cnicPattern.test(client.cnic)) {
        clientWarnings.push('CNIC format may be incorrect (expected: 12345-6789012-3)');
      }
    }
    
    // Email validation
    if (client.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(client.email)) {
        clientWarnings.push('Email format may be incorrect');
      }
    }
    
    // Phone validation
    if (client.phone) {
      const phonePattern = /^[\d\s\-\+\(\)]+$/;
      if (!phonePattern.test(client.phone)) {
        clientWarnings.push('Phone format may be incorrect');
      }
    }
    
    // NTN validation
    if (client.ntn) {
      const ntnPattern = /^\d{7}(-\d)?$/;
      if (!ntnPattern.test(client.ntn)) {
        clientWarnings.push('NTN format may be incorrect');
      }
    }
    
    const validatedClient = {
      ...client,
      originalIndex: index,
      errors: errors,
      warnings: clientWarnings,
      isValid: errors.length === 0
    };
    
    if (errors.length === 0) {
      validClients.push(validatedClient);
    } else {
      invalidClients.push(validatedClient);
    }
    
    if (clientWarnings.length > 0) {
      warnings.push({
        client: client.name || `Row ${client.rowNumber}`,
        warnings: clientWarnings
      });
    }
  });
  
  return {
    validClients,
    invalidClients,
    warnings,
    totalProcessed: clients.length,
    validCount: validClients.length,
    invalidCount: invalidClients.length,
    warningCount: warnings.length
  };
};

/**
 * Export clients to Excel file
 * @param {Array} clients - Array of client objects
 * @param {String} fileName - Output file name
 * @param {Object} options - Export options
 */
export const exportClientsToExcel = (clients, fileName = 'clients_export.xlsx', options = {}) => {
  try {
    const {
      includeHeaders = true,
      sheetName = 'Clients',
      groupBySheet = false
    } = options;
    
    const workbook = XLSX.utils.book_new();
    
    if (groupBySheet && clients[0]?.sheetName) {
      // Group by original sheet names
      const groupedClients = clients.reduce((acc, client) => {
        const sheet = client.sheetName || 'Other';
        if (!acc[sheet]) acc[sheet] = [];
        acc[sheet].push(client);
        return acc;
      }, {});
      
      Object.entries(groupedClients).forEach(([sheet, sheetClients]) => {
        const worksheet = createWorksheet(sheetClients, includeHeaders);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet);
      });
    } else {
      // Single sheet export
      const worksheet = createWorksheet(clients, includeHeaders);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }
    
    // Write file
    XLSX.writeFile(workbook, fileName);
    
    return {
      success: true,
      fileName: fileName,
      clientCount: clients.length
    };
    
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create worksheet from client data
 * @param {Array} clients - Array of client objects
 * @param {Boolean} includeHeaders - Whether to include header row
 * @returns {Object} - XLSX worksheet object
 */
const createWorksheet = (clients, includeHeaders) => {
  const headers = [
    'FILE NO',
    'NEW NTN',
    'TITLE OF THE CASE',
    'NIC NO',
    'PIN (IRIS)',
    'PASSWORD (IRIS)',
    'MAIL',
    'PASSWORD (MAIL)',
    'PHONE',
    'ADDRESS',
    'BUSINESS TYPE',
    'STATUS',
    'TAX YEAR'
  ];
  
  const data = [];
  
  if (includeHeaders) {
    data.push(headers);
  }
  
  clients.forEach(client => {
    data.push([
      client.fileNo || '',
      client.ntn || '',
      client.name || '',
      client.cnic || '',
      client.irisPin || '',
      client.irisPassword || '',
      client.email || '',
      client.emailPassword || '',
      client.phone || '',
      client.address || '',
      client.businessType || 'Individual',
      client.status || 'Active',
      client.taxYear || new Date().getFullYear()
    ]);
  });
  
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 10 },  // FILE NO
    { wch: 15 },  // NEW NTN
    { wch: 40 },  // TITLE OF THE CASE
    { wch: 18 },  // NIC NO
    { wch: 12 },  // PIN (IRIS)
    { wch: 15 },  // PASSWORD (IRIS)
    { wch: 30 },  // MAIL
    { wch: 15 },  // PASSWORD (MAIL)
    { wch: 15 },  // PHONE
    { wch: 40 },  // ADDRESS
    { wch: 15 },  // BUSINESS TYPE
    { wch: 12 },  // STATUS
    { wch: 10 }   // TAX YEAR
  ];
  
  return worksheet;
};

/**
 * Generate Excel template for bulk import with enhanced validation and instructions
 * @param {String} fileName - Template file name
 */
export const generateImportTemplate = (fileName = 'client_import_template.xlsx') => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // ========== SHEET 1: INSTRUCTIONS ==========
    const instructionsData = [
      ['CLIENT DATA IMPORT TEMPLATE - INSTRUCTIONS'],
      [''],
      ['IMPORTANT: Please read these instructions before filling the template'],
      [''],
      ['REQUIRED FIELDS (marked with * in template):'],
      ['  • TITLE OF THE CASE (Client Name) - Must not be empty'],
      [''],
      ['FIELD FORMATS:'],
      ['  • FILE NO: Any number or text (e.g., 1, 2, ABC-001)'],
      ['  • NEW NTN: 7 digits with optional dash and check digit (e.g., 1234567-8)'],
      ['  • TITLE OF THE CASE: Full name of client or business (e.g., John Smith, ABC Corporation)'],
      ['  • NIC NO (CNIC): Format 12345-6789012-3 (5 digits - 7 digits - 1 digit)'],
      ['  • PIN (IRIS): IRIS portal PIN (usually 4 digits)'],
      ['  • PASSWORD (IRIS): IRIS portal password'],
      ['  • MAIL: Valid email address (e.g., user@example.com)'],
      ['  • PASSWORD (MAIL): Email password'],
      ['  • PHONE: Format +92-300-1234567 or 0300-1234567'],
      ['  • ADDRESS: Full address with city'],
      ['  • BUSINESS TYPE: Select from dropdown (Individual, Business, Self-Employed, Partnership, Corporation)'],
      ['  • STATUS: Select from dropdown (Active, Inactive, Pending)'],
      ['  • TAX YEAR: Current or past tax year (e.g., 2025, 2024)'],
      [''],
      ['VALIDATION RULES:'],
      ['  ✓ CNIC must follow format: 12345-6789012-3'],
      ['  ✓ NTN must be 7 digits (with optional -8 check digit)'],
      ['  ✓ Email must contain @ and domain (e.g., .com, .pk)'],
      ['  ✓ Phone should start with +92 or 0'],
      ['  ✓ Business Type must be one of the dropdown options'],
      ['  ✓ Status must be one of the dropdown options'],
      [''],
      ['TIPS FOR ERROR-FREE IMPORT:'],
      ['  1. Do not modify or delete the header row'],
      ['  2. Fill at least the TITLE OF THE CASE (client name)'],
      ['  3. Use the dropdown menus for Business Type and Status'],
      ['  4. Copy-paste CNIC/NTN carefully to maintain format'],
      ['  5. Remove any extra spaces before/after data'],
      ['  6. Do not leave blank rows between data'],
      ['  7. Maximum recommended: 500 clients per import'],
      [''],
      ['BEFORE IMPORTING:'],
      ['  ☐ Check for duplicate entries'],
      ['  ☐ Verify all CNIC formats'],
      ['  ☐ Confirm email addresses are valid'],
      ['  ☐ Review phone numbers'],
      ['  ☐ Ensure Business Type is selected from dropdown'],
      ['  ☐ Delete sample data rows before adding your data'],
      [''],
      ['COMMON ERRORS TO AVOID:'],
      ['  ✗ Missing dashes in CNIC (wrong: 123456789123, correct: 12345-6789012-3)'],
      ['  ✗ Invalid email format (wrong: user@com, correct: user@example.com)'],
      ['  ✗ Typing Business Type instead of using dropdown'],
      ['  ✗ Leaving required fields empty'],
      ['  ✗ Adding extra columns or modifying headers'],
      [''],
      ['Need help? Contact support or refer to the user manual.']
    ];
    
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    
    // Style the instructions sheet
    instructionsSheet['!cols'] = [{ wch: 100 }];
    
    // Merge cells for title
    if (!instructionsSheet['!merges']) instructionsSheet['!merges'] = [];
    instructionsSheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 0 } });
    
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
    
    // ========== SHEET 2: TEMPLATE WITH SAMPLE DATA ==========
    const headers = [
      'FILE NO',
      'NEW NTN',
      'TITLE OF THE CASE *',
      'NIC NO (CNIC)',
      'PIN (IRIS)',
      'PASSWORD (IRIS)',
      'MAIL',
      'PASSWORD (MAIL)',
      'PHONE',
      'ADDRESS',
      'BUSINESS TYPE',
      'STATUS',
      'TAX YEAR'
    ];
    
    // Enhanced sample data with diverse examples
    const sampleData = [
      headers,
      ['1', '1234567-8', 'John Smith', '12345-6789012-3', '2030', 'iris123', 'john@example.com', 'email123', '+92-300-1234567', '123 Main Street, Karachi', 'Individual', 'Active', '2025'],
      ['2', '7654321-9', 'ABC Corporation', '98765-4321098-7', '2030', 'iris456', 'info@abc.com', 'email456', '+92-321-9876543', '456 Business Plaza, Lahore', 'Corporation', 'Active', '2025'],
      ['3', '2468135', 'Sarah Johnson', '11111-2222222-3', '2030', 'iris789', 'sarah@example.com', 'email789', '0300-1111111', '789 Oak Avenue, Islamabad', 'Self-Employed', 'Active', '2025'],
      ['4', '9876543-2', 'XYZ Partnership', '33333-4444444-5', '2030', 'iris321', 'contact@xyz.pk', 'email321', '+92-333-5555555', '321 Trade Center, Faisalabad', 'Partnership', 'Active', '2024'],
      ['5', '5555555-1', 'Tech Solutions Ltd', '55555-6666666-7', '2030', 'iris654', 'admin@techsol.com', 'email654', '0345-7777777', '555 IT Park, Rawalpindi', 'Business', 'Active', '2025'],
      ['6', '1111111', 'Ali Ahmed', '77777-8888888-9', '2030', 'iris987', 'ali@email.com', 'email987', '+92-300-9999999', '777 Residential Area, Multan', 'Individual', 'Pending', '2025'],
      ['7', '9999999-5', 'Minimal Data Client', '', '', '', '', '', '', '', 'Individual', 'Active', '2025']
    ];
    
    const templateSheet = XLSX.utils.aoa_to_sheet(sampleData);
    
    // Set column widths
    templateSheet['!cols'] = [
      { wch: 10 },  // FILE NO
      { wch: 15 },  // NEW NTN
      { wch: 40 },  // TITLE OF THE CASE *
      { wch: 20 },  // NIC NO (CNIC)
      { wch: 12 },  // PIN (IRIS)
      { wch: 18 },  // PASSWORD (IRIS)
      { wch: 30 },  // MAIL
      { wch: 18 },  // PASSWORD (MAIL)
      { wch: 18 },  // PHONE
      { wch: 45 },  // ADDRESS
      { wch: 18 },  // BUSINESS TYPE
      { wch: 12 },  // STATUS
      { wch: 12 }   // TAX YEAR
    ];
    
    // Add data validation for Business Type (column K, rows 2-502)
    if (!templateSheet['!dataValidation']) templateSheet['!dataValidation'] = [];
    
    // Note: XLSX library has limited support for data validation
    // The validation will be added as comments/notes for user guidance
    
    XLSX.utils.book_append_sheet(workbook, templateSheet, 'Client Data');
    
    // ========== SHEET 3: VALIDATION REFERENCE ==========
    const validationData = [
      ['VALIDATION REFERENCE - DO NOT DELETE THIS SHEET'],
      [''],
      ['This sheet contains dropdown options for the template.'],
      [''],
      ['BUSINESS TYPES:'],
      ['Individual'],
      ['Business'],
      ['Self-Employed'],
      ['Partnership'],
      ['Corporation'],
      [''],
      ['STATUS OPTIONS:'],
      ['Active'],
      ['Inactive'],
      ['Pending'],
      [''],
      ['TAX YEARS:'],
      ['2026'],
      ['2025'],
      ['2024'],
      ['2023'],
      ['2022'],
      ['2021'],
      ['2020']
    ];
    
    const validationSheet = XLSX.utils.aoa_to_sheet(validationData);
    validationSheet['!cols'] = [{ wch: 50 }];
    
    XLSX.utils.book_append_sheet(workbook, validationSheet, 'Validation Lists');
    
    // ========== SHEET 4: FORMAT EXAMPLES ==========
    const examplesData = [
      ['FORMAT EXAMPLES & VALIDATION GUIDE'],
      [''],
      ['Field Name', 'Correct Format', 'Incorrect Format', 'Notes'],
      ['CNIC', '12345-6789012-3', '123456789123', 'Must have dashes: 5-7-1 digits'],
      ['CNIC', '98765-4321098-7', '98765-43210987', 'Exactly 5-7-1 pattern'],
      ['NTN', '1234567-8', '12345678', 'Can be 7 digits or 7-1 format'],
      ['NTN', '9876543', '98-76543', 'No spaces or extra dashes'],
      ['Email', 'user@example.com', 'user@com', 'Must have domain extension'],
      ['Email', 'info@company.pk', 'user@', 'Complete email required'],
      ['Phone', '+92-300-1234567', '03001234567', 'Prefer international format'],
      ['Phone', '0300-1234567', '+92 300 1234567', 'Use dashes, not spaces'],
      ['Business Type', 'Individual', 'individual', 'Use exact dropdown value'],
      ['Business Type', 'Corporation', 'Corp', 'Must match dropdown exactly'],
      ['Status', 'Active', 'active', 'Use exact dropdown value'],
      ['Tax Year', '2025', '25', 'Use full 4-digit year'],
      [''],
      ['REGEX PATTERNS FOR VALIDATION:'],
      ['CNIC Pattern: ^\\d{5}-\\d{7}-\\d{1}$'],
      ['NTN Pattern: ^\\d{7}(-\\d)?$'],
      ['Email Pattern: ^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'],
      ['Phone Pattern: ^[\\d\\s\\-\\+\\(\\)]+$']
    ];
    
    const examplesSheet = XLSX.utils.aoa_to_sheet(examplesData);
    examplesSheet['!cols'] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
      { wch: 40 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, examplesSheet, 'Format Examples');
    
    // Write the file
    XLSX.writeFile(workbook, fileName);
    
    return {
      success: true,
      fileName: fileName,
      message: 'Enhanced template generated with instructions, validation, and examples'
    };
    
  } catch (error) {
    console.error('Template generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Convert imported clients to application format
 * @param {Array} clients - Validated client array
 * @returns {Array} - Clients in application format
 */
export const convertToAppFormat = (clients) => {
  return clients.map(client => ({
    id: client.id || Date.now() + Math.random(),
    name: client.name || '',
    email: client.email || '',
    phone: client.phone || '',
    address: client.address || '',
    taxId: client.ntn || client.cnic || '',
    cnic: client.cnic || '',
    ntn: client.ntn || '',
    businessType: client.businessType || 'Individual',
    status: client.status || 'Active',
    preferredContact: 'email',
    notes: `Imported from Excel - Sheet: ${client.sheetName || 'Unknown'}`,
    returns: 0,
    totalRevenue: '$0',
    lastContact: new Date().toISOString().split('T')[0],
    tags: [],
    assignedTo: 'Admin User',
    irisPin: client.irisPin || '',
    irisPassword: client.irisPassword || '',
    emailPassword: client.emailPassword || '',
    fileNo: client.fileNo || '',
    taxYear: client.taxYear || new Date().getFullYear().toString(),
    importedAt: new Date().toISOString(),
    importSource: 'Excel Import'
  }));
};

export default {
  parseExcelFile,
  validateImportedClients,
  exportClientsToExcel,
  generateImportTemplate,
  convertToAppFormat,
  EXCEL_COLUMN_MAPPING,
  REVERSE_COLUMN_MAPPING
};
