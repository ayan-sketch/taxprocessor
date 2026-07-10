/**
 * Excel Template Import/Export Utility
 * Handles reading from and writing to the "Client Data" sheet in the template format
 */

import * as XLSX from 'xlsx';
import { 
  clientToTemplateFormat, 
  templateFormatToClient,
  validateClientData,
  createStandardClientObject 
} from './clientDataMigration';

/**
 * Template sheet name constant
 */
export const TEMPLATE_SHEET_NAME = 'Client Data';

/**
 * Template column headers (must match exactly)
 */
export const TEMPLATE_HEADERS = [
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
  'CITY',
  'PERSON',
  'SOURCE OF INCOME',
  'BUSINESS CLASSIFICATION',
  'STATUS',
  'TAX YEAR'
];

/**
 * Import clients from Excel template file
 * @param {File} file - The Excel file to import
 * @returns {Promise<{clients: Array, errors: Array, warnings: Array}>}
 */
export const importClientsFromTemplate = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Check if "Client Data" sheet exists
        if (!workbook.SheetNames.includes(TEMPLATE_SHEET_NAME)) {
          const availableSheets = workbook.SheetNames.join(', ');
          reject(new Error(
            `Sheet "${TEMPLATE_SHEET_NAME}" not found in the Excel file.\n\n` +
            `Available sheets: ${availableSheets}\n\n` +
            `Please use the template file downloaded from the Template button, ` +
            `or ensure your Excel file has a sheet named exactly "Client Data".`
          ));
          return;
        }
        
        const worksheet = workbook.Sheets[TEMPLATE_SHEET_NAME];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (jsonData.length === 0) {
          reject(new Error(
            `No data found in the "Client Data" sheet.\n\n` +
            `The sheet appears to be empty. Please add client data before importing.\n\n` +
            `Required column: "TITLE OF THE CASE *" (client name)`
          ));
          return;
        }
        
        const clients = [];
        const errors = [];
        const warnings = [];
        
        // Check if headers match
        const firstRow = jsonData[0];
        const hasRequiredHeaders = TEMPLATE_HEADERS.some(header => 
          Object.keys(firstRow).some(key => 
            key.toUpperCase().includes(header.split(' ')[0])
          )
        );
        
        if (!hasRequiredHeaders) {
          reject(new Error(
            `Invalid column headers in "Client Data" sheet.\n\n` +
            `Expected headers like: FILE NO, NEW NTN, TITLE OF THE CASE *, etc.\n\n` +
            `Found headers: ${Object.keys(firstRow).slice(0, 5).join(', ')}...\n\n` +
            `Please use the template file downloaded from the Template button.`
          ));
          return;
        }
        
        jsonData.forEach((row, index) => {
          const rowNumber = index + 2; // +2 because Excel is 1-indexed and has header row
          
          try {
            // Convert template format to client object
            const client = templateFormatToClient(row);
            
            // Check if row is completely empty
            const isEmpty = !client.name && !client.ntn && !client.cnic && !client.email;
            if (isEmpty) {
              warnings.push({
                row: rowNumber,
                warnings: ['Row is empty - skipped']
              });
              return; // Skip empty rows
            }
            
            // Validate the client data
            const validation = validateClientData(client);
            
            if (!validation.isValid) {
              errors.push({
                row: rowNumber,
                errors: validation.errors,
                data: {
                  name: client.name || '(empty)',
                  ntn: client.ntn || '(empty)',
                  cnic: client.cnic || '(empty)'
                }
              });
            }
            
            if (validation.warnings.length > 0) {
              warnings.push({
                row: rowNumber,
                warnings: validation.warnings,
                data: {
                  name: client.name,
                  issue: validation.warnings[0]
                }
              });
            }
            
            clients.push(client);
          } catch (error) {
            errors.push({
              row: rowNumber,
              errors: [`Failed to parse row: ${error.message}`],
              data: {
                rawData: JSON.stringify(row).substring(0, 100)
              }
            });
          }
        });
        
        resolve({
          clients,
          errors,
          warnings,
          totalRows: jsonData.length,
          successCount: clients.length - errors.length,
          fileName: file.name
        });
        
      } catch (error) {
        if (error.message.includes('Unsupported file')) {
          reject(new Error(
            `Unsupported file format.\n\n` +
            `Please ensure the file is a valid Excel file (.xlsx or .xlsm).\n\n` +
            `Error details: ${error.message}`
          ));
        } else if (error.message.includes('encrypted') || error.message.includes('password')) {
          reject(new Error(
            `The Excel file appears to be password protected.\n\n` +
            `Please remove the password protection and try again.`
          ));
        } else {
          reject(new Error(
            `Failed to read Excel file.\n\n` +
            `Error details: ${error.message}\n\n` +
            `Please ensure:\n` +
            `• The file is not corrupted\n` +
            `• The file is a valid Excel format (.xlsx or .xlsm)\n` +
            `• The file is not open in another program`
          ));
        }
      }
    };
    
    reader.onerror = () => {
      reject(new Error(
        `Failed to read the file.\n\n` +
        `This could be due to:\n` +
        `• File access permissions\n` +
        `• File is corrupted\n` +
        `• Browser security restrictions\n\n` +
        `Please try again or use a different file.`
      ));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Export clients to Excel template format
 * @param {Array} clients - Array of client objects
 * @param {string} filename - Output filename (default: 'clients_export.xlsx')
 */
export const exportClientsToTemplate = (clients, filename = 'clients_export.xlsx') => {
  try {
    // Convert clients to template format
    const templateData = clients.map(client => clientToTemplateFormat(client));
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Create worksheet from template data
    const worksheet = XLSX.utils.json_to_sheet(templateData, {
      header: TEMPLATE_HEADERS
    });
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 10 },  // FILE NO
      { wch: 15 },  // NEW NTN
      { wch: 30 },  // TITLE OF THE CASE
      { wch: 18 },  // NIC NO (CNIC)
      { wch: 12 },  // PIN (IRIS)
      { wch: 15 },  // PASSWORD (IRIS)
      { wch: 25 },  // MAIL
      { wch: 15 },  // PASSWORD (MAIL)
      { wch: 15 },  // PHONE
      { wch: 40 },  // ADDRESS
      { wch: 15 },  // CITY
      { wch: 12 },  // PERSON
      { wch: 20 },  // SOURCE OF INCOME
      { wch: 25 },  // BUSINESS CLASSIFICATION
      { wch: 10 },  // STATUS
      { wch: 10 }   // TAX YEAR
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATE_SHEET_NAME);
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, filename);
    
    return {
      success: true,
      message: `Exported ${clients.length} clients successfully`
    };
    
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      message: `Export failed: ${error.message}`
    };
  }
};

/**
 * Download the blank template file with data validation (dropdowns)
 */
export const downloadBlankTemplate = async () => {
  try {
    // Use ExcelJS for better dropdown support
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(TEMPLATE_SHEET_NAME);
    
    // Add headers
    worksheet.columns = [
      { header: 'FILE NO', key: 'fileNo', width: 10 },
      { header: 'NEW NTN', key: 'ntn', width: 15 },
      { header: 'TITLE OF THE CASE *', key: 'name', width: 30 },
      { header: 'NIC NO (CNIC)', key: 'cnic', width: 18 },
      { header: 'PIN (IRIS)', key: 'irisPin', width: 12 },
      { header: 'PASSWORD (IRIS)', key: 'irisPassword', width: 15 },
      { header: 'MAIL', key: 'email', width: 25 },
      { header: 'PASSWORD (MAIL)', key: 'emailPassword', width: 15 },
      { header: 'PHONE', key: 'phone', width: 15 },
      { header: 'ADDRESS', key: 'address', width: 40 },
      { header: 'CITY', key: 'city', width: 15 },
      { header: 'PERSON', key: 'person', width: 12 },
      { header: 'SOURCE OF INCOME', key: 'sourceOfIncome', width: 20 },
      { header: 'BUSINESS CLASSIFICATION', key: 'businessClassification', width: 25 },
      { header: 'STATUS', key: 'status', width: 10 },
      { header: 'TAX YEAR', key: 'taxYear', width: 10 }
    ];
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Add data validation (dropdowns) for rows 2-1000
    // PERSON column (L, column 12)
    for (let row = 2; row <= 1000; row++) {
      worksheet.getCell(`L${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Individual,Company,AOP"'],
        showErrorMessage: true,
        errorStyle: 'error',
        errorTitle: 'Invalid Person Type',
        error: 'Please select from the dropdown: Individual, Company, or AOP'
      };
    }
    
    // SOURCE OF INCOME column (M, column 13)
    // Allow multiple selections separated by commas
    // Add a note in row 2 as a comment
    worksheet.getCell('M2').note = {
      texts: [
        { 
          font: { bold: true, size: 10, color: { argb: 'FF000000' } },
          text: 'Multiple Income Sources:\n'
        },
        { 
          font: { size: 9, color: { argb: 'FF000000' } },
          text: 'You can enter multiple income sources separated by commas.\n\nExample: Business, Property\n\nAvailable options:\n• Individual: Business, Salary, Property, Other Source, Foreign Source, Capital Gain, Agriculture, Freelancer, Commission, Partnership\n• Company: Company\n• AOP: AOP, Distributor AOP'
        }
      ]
    };
    
    // No dropdown validation for SOURCE OF INCOME to allow multiple comma-separated values
    // Users can type: "Business, Property" or "Salary, Freelancer, Commission"
    
    // STATUS column (O, column 15)
    for (let row = 2; row <= 1000; row++) {
      worksheet.getCell(`O${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Active,Inactive"'],
        showErrorMessage: true,
        errorStyle: 'error',
        errorTitle: 'Invalid Status',
        error: 'Please select from the dropdown: Active or Inactive'
      };
    }
    
    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'client_data_template.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
    
    return {
      success: true,
      message: 'Template downloaded successfully with dropdowns'
    };
    
  } catch (error) {
    console.error('Template download error:', error);
    return {
      success: false,
      message: `Failed to download template: ${error.message}`
    };
  }
};

/**
 * Validate Excel file before import
 * @param {File} file - The Excel file to validate
 * @returns {Promise<{valid: boolean, message: string}>}
 */
export const validateTemplateFile = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Check if "Client Data" sheet exists
        if (!workbook.SheetNames.includes(TEMPLATE_SHEET_NAME)) {
          resolve({
            valid: false,
            message: `Sheet "${TEMPLATE_SHEET_NAME}" not found. Please use the correct template file.`
          });
          return;
        }
        
        const worksheet = workbook.Sheets[TEMPLATE_SHEET_NAME];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          resolve({
            valid: false,
            message: 'The Client Data sheet is empty'
          });
          return;
        }
        
        // Validate headers
        const fileHeaders = jsonData[0];
        const missingHeaders = TEMPLATE_HEADERS.filter(h => !fileHeaders.includes(h));
        
        if (missingHeaders.length > 0) {
          resolve({
            valid: false,
            message: `Missing required columns: ${missingHeaders.join(', ')}`
          });
          return;
        }
        
        resolve({
          valid: true,
          message: 'Template file is valid',
          rowCount: jsonData.length - 1 // Exclude header row
        });
        
      } catch (error) {
        resolve({
          valid: false,
          message: `Failed to validate file: ${error.message}`
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        valid: false,
        message: 'Failed to read file'
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Get import summary statistics
 */
export const getImportSummary = (importResult) => {
  const { clients, errors, warnings, totalRows } = importResult;
  
  return {
    total: totalRows,
    successful: clients.length - errors.length,
    failed: errors.length,
    warnings: warnings.length,
    successRate: ((clients.length - errors.length) / totalRows * 100).toFixed(1)
  };
};
