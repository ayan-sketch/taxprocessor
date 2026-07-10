import ExcelJS from 'exceljs';

/**
 * Generate simplified single-sheet Excel template with enhanced formatting
 * Perfect for use with VBA validation button
 * @param {String} fileName - Template file name
 */
export const generateSingleSheetTemplate = async (fileName = 'client_import_template.xlsx') => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // ========== SINGLE SHEET: CLIENT DATA ==========
    const dataSheet = workbook.addWorksheet('Client Data', {
      properties: { 
        tabColor: { argb: 'FF4472C4' },
        defaultRowHeight: 20
      }
    });
    
    // ========== ROW 1: TITLE/INSTRUCTIONS ==========
    const titleRow = dataSheet.getRow(1);
    titleRow.height = 35;
    
    const titleCell = titleRow.getCell(1);
    titleCell.value = '📋 CLIENT DATA IMPORT TEMPLATE - Fill in your client information below';
    titleCell.font = { 
      bold: true, 
      size: 14, 
      color: { argb: 'FFFFFFFF' } 
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E75B5' }
    };
    titleCell.alignment = { 
      vertical: 'middle', 
      horizontal: 'left',
      indent: 1
    };
    
    // Merge title across all columns
    dataSheet.mergeCells('A1:M1');
    
    // ========== ROW 2: QUICK INSTRUCTIONS ==========
    const instructionRow = dataSheet.getRow(2);
    instructionRow.height = 25;
    
    const instructionCell = instructionRow.getCell(1);
    instructionCell.value = '💡 Instructions: Delete sample rows (4-10) before entering data | Use dropdowns for Business Type, Status, Tax Year | Only "Client Name" is required';
    instructionCell.font = { 
      size: 10, 
      color: { argb: 'FF7F7F7F' },
      italic: true
    };
    instructionCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2F2F2' }
    };
    instructionCell.alignment = { 
      vertical: 'middle', 
      horizontal: 'left',
      wrapText: true,
      indent: 1
    };
    
    // Merge instructions across all columns
    dataSheet.mergeCells('A2:M2');
    
    // ========== ROW 3: COLUMN HEADERS ==========
    const headers = [
      { name: 'FILE NO', width: 12, required: false, color: 'FFD9E1F2' },
      { name: 'NEW NTN', width: 15, required: false, color: 'FFFCE4D6' },
      { name: 'CLIENT NAME', width: 35, required: true, color: 'FFFFC7CE' },
      { name: 'CNIC', width: 18, required: false, color: 'FFFCE4D6' },
      { name: 'PIN (IRIS)', width: 14, required: false, color: 'FFD9E1F2' },
      { name: 'PASSWORD (IRIS)', width: 18, required: false, color: 'FFD9E1F2' },
      { name: 'EMAIL', width: 28, required: false, color: 'FFFCE4D6' },
      { name: 'PASSWORD (EMAIL)', width: 18, required: false, color: 'FFD9E1F2' },
      { name: 'PHONE', width: 18, required: false, color: 'FFFCE4D6' },
      { name: 'ADDRESS', width: 40, required: false, color: 'FFD9E1F2' },
      { name: 'BUSINESS TYPE', width: 18, required: false, color: 'FFE2EFDA' },
      { name: 'STATUS', width: 14, required: false, color: 'FFE2EFDA' },
      { name: 'TAX YEAR', width: 12, required: false, color: 'FFE2EFDA' }
    ];
    
    const headerRow = dataSheet.getRow(3);
    headerRow.height = 45;
    
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      
      // Set header text with required indicator
      if (header.required) {
        cell.value = {
          richText: [
            { text: header.name, font: { bold: true, size: 11 } },
            { text: '\n★ REQUIRED', font: { bold: true, size: 8, color: { argb: 'FFFF0000' } } }
          ]
        };
      } else {
        cell.value = header.name;
        cell.font = { bold: true, size: 11 };
      }
      
      // Header styling
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: header.required ? 'FFFF6B6B' : 'FF4472C4' }
      };
      cell.font = { 
        bold: true, 
        size: 11, 
        color: { argb: 'FFFFFFFF' } 
      };
      cell.alignment = { 
        vertical: 'middle', 
        horizontal: 'center',
        wrapText: true
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF2E75B5' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'medium', color: { argb: 'FF2E75B5' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
      };
      
      // Set column width
      dataSheet.getColumn(index + 1).width = header.width;
    });
    
    // ========== SAMPLE DATA ROWS (4-10) ==========
    const sampleData = [
      ['1', '1234567-8', 'John Smith', '12345-6789012-3', '2030', 'iris123', 'john@example.com', 'email123', '+92-300-1234567', '123 Main Street, Karachi', 'Individual', 'Active', '2025'],
      ['2', '7654321-9', 'ABC Corporation', '98765-4321098-7', '2030', 'iris456', 'info@abc.com', 'email456', '+92-321-9876543', '456 Business Plaza, Lahore', 'Corporation', 'Active', '2025'],
      ['3', '2468135', 'Sarah Johnson', '11111-2222222-3', '2030', 'iris789', 'sarah@example.com', 'email789', '0300-1111111', '789 Oak Avenue, Islamabad', 'Self-Employed', 'Active', '2025'],
      ['4', '9876543-2', 'XYZ Partnership', '33333-4444444-5', '2030', 'iris321', 'contact@xyz.pk', 'email321', '+92-333-5555555', '321 Trade Center, Faisalabad', 'Partnership', 'Active', '2024'],
      ['5', '5555555-1', 'Tech Solutions Ltd', '55555-6666666-7', '2030', 'iris654', 'admin@techsol.com', 'email654', '0345-7777777', '555 IT Park, Rawalpindi', 'Business', 'Active', '2025'],
      ['6', '3333333-4', 'New Client Onboarding', '77777-8888888-9', '', '', '', '', '0300-9999999', '', 'Individual', 'Pending', '2026'],
      ['7', '', '', 'Minimal Data Example', '', '', '', '', '', '', '', 'Individual', 'Active', '2025']
    ];
    
    sampleData.forEach((rowData, rowIndex) => {
      const row = dataSheet.getRow(rowIndex + 4);
      row.height = 22;
      
      rowData.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        cell.value = value;
        
        // Alternating row colors for better readability
        const bgColor = rowIndex % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA';
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        
        // Cell alignment
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: colIndex === 2 || colIndex === 9 ? 'left' : 'center' // Left align name and address
        };
        
        // Cell borders
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };
      });
    });
    
    // ========== ADD DATA VALIDATION ==========
    const startRow = 4;
    const endRow = 504; // Allow 500 rows of data
    
    // Freeze header rows (rows 1-3)
    dataSheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 3 }
    ];
    
    // 1. BUSINESS TYPE DROPDOWN (Column K = 11)
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 11);
      cell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Individual,Business,Self-Employed,Partnership,Corporation"'],
        showErrorMessage: true,
        errorStyle: 'error',
        errorTitle: 'Invalid Business Type',
        error: 'Please select from dropdown: Individual, Business, Self-Employed, Partnership, or Corporation',
        showInputMessage: true,
        promptTitle: 'Business Type',
        prompt: 'Click dropdown arrow to select'
      };
    }
    
    // 2. STATUS DROPDOWN (Column L = 12)
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 12);
      cell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Active,Inactive,Pending"'],
        showErrorMessage: true,
        errorStyle: 'error',
        errorTitle: 'Invalid Status',
        error: 'Please select from dropdown: Active, Inactive, or Pending',
        showInputMessage: true,
        promptTitle: 'Status',
        prompt: 'Click dropdown arrow to select'
      };
    }
    
    // 3. TAX YEAR DROPDOWN (Column M = 13)
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 13);
      cell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"2026,2025,2024,2023,2022,2021,2020"'],
        showErrorMessage: true,
        errorStyle: 'error',
        errorTitle: 'Invalid Tax Year',
        error: 'Please select from dropdown: 2020-2026',
        showInputMessage: true,
        promptTitle: 'Tax Year',
        prompt: 'Click dropdown arrow to select year'
      };
    }
    
    // 4. CNIC FORMAT HINT (Column D = 4)
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 4);
      cell.dataValidation = {
        type: 'custom',
        allowBlank: true,
        formulae: ['OR(LEN(D' + row + ')=15,LEN(D' + row + ')=0)'],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'CNIC Format',
        error: 'CNIC should be: 12345-6789012-3 (15 characters with dashes)',
        showInputMessage: true,
        promptTitle: 'CNIC Format',
        prompt: 'Format: 12345-6789012-3'
      };
    }
    
    // 5. EMAIL FORMAT HINT (Column G = 7)
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 7);
      cell.dataValidation = {
        type: 'custom',
        allowBlank: true,
        formulae: ['OR(ISNUMBER(FIND("@",G' + row + ')),LEN(G' + row + ')=0)'],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Email Format',
        error: 'Email must contain @ symbol (e.g., user@example.com)',
        showInputMessage: true,
        promptTitle: 'Email Address',
        prompt: 'Format: user@example.com'
      };
    }
    
    // 6. NTN FORMAT HINT (Column B = 2)
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 2);
      cell.dataValidation = {
        type: 'custom',
        allowBlank: true,
        formulae: ['OR(LEN(B' + row + ')=7,LEN(B' + row + ')=9,LEN(B' + row + ')=0)'],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'NTN Format',
        error: 'NTN should be 7 digits (1234567) or 9 characters (1234567-8)',
        showInputMessage: true,
        promptTitle: 'NTN Format',
        prompt: 'Format: 1234567 or 1234567-8'
      };
    }
    
    // 7. PHONE FORMAT HINT (Column I = 9)
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 9);
      cell.dataValidation = {
        type: 'custom',
        allowBlank: true,
        formulae: ['OR(LEFT(I' + row + ',3)="+92",LEFT(I' + row + ',1)="0",LEN(I' + row + ')=0)'],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Phone Format',
        error: 'Phone should start with +92 or 0 (e.g., +92-300-1234567 or 0300-1234567)',
        showInputMessage: true,
        promptTitle: 'Phone Number',
        prompt: 'Format: +92-300-1234567 or 0300-1234567'
      };
    }
    
    // 8. CLIENT NAME - INPUT MESSAGE (Column C = 3)
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 3);
      cell.dataValidation = {
        type: 'textLength',
        operator: 'greaterThan',
        allowBlank: true,
        formulae: [0],
        showErrorMessage: true,
        errorStyle: 'information',
        errorTitle: 'Client Name',
        error: 'This is the only required field. Please enter client or business name.',
        showInputMessage: true,
        promptTitle: 'Client Name (Required)',
        prompt: 'Enter full name or business name. This field is required for import.'
      };
    }
    
    // ========== ADD HELPFUL NOTES IN LAST ROW ==========
    const notesRow = dataSheet.getRow(endRow + 2);
    notesRow.height = 30;
    
    const notesCell = notesRow.getCell(1);
    notesCell.value = '📝 Format Guide: CNIC: 12345-6789012-3 | NTN: 1234567 or 1234567-8 | Email: user@example.com | Phone: +92-300-1234567 or 0300-1234567 | Use dropdowns for Business Type, Status, Tax Year';
    notesCell.font = { 
      size: 9, 
      color: { argb: 'FF7F7F7F' },
      italic: true
    };
    notesCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF4E6' }
    };
    notesCell.alignment = { 
      vertical: 'middle', 
      horizontal: 'left',
      wrapText: true,
      indent: 1
    };
    
    // Merge notes across all columns
    dataSheet.mergeCells(`A${endRow + 2}:M${endRow + 2}`);
    
    // ========== PROTECT HEADER ROWS ==========
    // Lock rows 1-3 (title, instructions, headers)
    for (let row = 1; row <= 3; row++) {
      dataSheet.getRow(row).eachCell((cell) => {
        cell.protection = { locked: true };
      });
    }
    
    // Write the file
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create download link
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
    
    return {
      success: true,
      fileName: fileName,
      message: 'Single-sheet template with enhanced formatting generated successfully'
    };
    
  } catch (error) {
    console.error('Template generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default generateSingleSheetTemplate;
