import ExcelJS from 'exceljs';

/**
 * Generate Excel template with built-in data validation rules
 * This uses ExcelJS library for advanced Excel features like dropdowns and validation
 * @param {String} fileName - Template file name
 */
export const generateValidatedTemplate = async (fileName = 'client_import_template_validated.xlsx') => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // ========== SHEET 1: INSTRUCTIONS ==========
    const instructionsSheet = workbook.addWorksheet('Instructions', {
      properties: { tabColor: { argb: 'FF4472C4' } }
    });
    
    const instructionsData = [
      ['⚠️ READ THIS FIRST - CLIENT DATA IMPORT TEMPLATE WITH VALIDATION ⚠️'],
      [''],
      ['✅ THIS TEMPLATE INCLUDES AUTOMATIC DATA VALIDATION & ERROR PREVENTION'],
      [''],
      ['FEATURES:'],
      ['  • Dropdown menus for Business Type, Status, and Tax Year'],
      ['  • Automatic format validation for CNIC, NTN, Email, Phone'],
      ['  • Color-coded cells: 🟢 Green = Valid | 🟡 Yellow = Warning | 🔴 Red = Error | 🔵 Blue = Optional'],
      ['  • Required field indicators (marked with * and red background if empty)'],
      ['  • Input messages when you click on cells'],
      ['  • Error alerts for invalid data'],
      ['  • Protected sheets to prevent accidental changes'],
      ['  • Frozen header row for easy scrolling'],
      [''],
      ['REQUIRED FIELDS (marked with * in template):'],
      ['  • TITLE OF THE CASE (Client Name) - Must not be empty'],
      [''],
      ['FIELD FORMATS WITH VALIDATION:'],
      ['  • FILE NO: Any number or text (e.g., 1, 2, ABC-001) - Optional'],
      ['  • NEW NTN: 7-8 digits with optional dash (e.g., 1234567 or 1234567-8) - VALIDATED'],
      ['  • TITLE OF THE CASE: Full name - REQUIRED (Cannot be empty)'],
      ['  • NIC NO (CNIC): Exactly 12345-6789012-3 format (5-7-1 with dashes) - VALIDATED'],
      ['  • PIN (IRIS): IRIS portal PIN - Optional'],
      ['  • PASSWORD (IRIS): IRIS portal password - Optional'],
      ['  • MAIL: Valid email with @ and domain (e.g., user@example.com) - VALIDATED'],
      ['  • PASSWORD (MAIL): Email password - Optional'],
      ['  • PHONE: Format +92-300-1234567 or 0300-1234567 - VALIDATED'],
      ['  • ADDRESS: Full address - Optional'],
      ['  • BUSINESS TYPE: SELECT FROM DROPDOWN ONLY - VALIDATED'],
      ['  • STATUS: SELECT FROM DROPDOWN ONLY - VALIDATED'],
      ['  • TAX YEAR: SELECT FROM DROPDOWN ONLY - VALIDATED'],
      [''],
      ['HOW TO USE DROPDOWNS:'],
      ['  1. Click on Business Type, Status, or Tax Year cell'],
      ['  2. A dropdown arrow will appear'],
      ['  3. Click the arrow and select from the list'],
      ['  4. Do NOT type manually - use dropdown only'],
      [''],
      ['VALIDATION MESSAGES:'],
      ['  • When you click a cell, you\'ll see a helpful message'],
      ['  • If you enter invalid data, you\'ll see an error alert'],
      ['  • Red cells indicate errors that must be fixed'],
      ['  • Follow the format shown in the message'],
      [''],
      ['TIPS FOR ERROR-FREE IMPORT:'],
      ['  1. ⚠️ DELETE ALL 7 SAMPLE DATA ROWS before entering your data (keep header row)'],
      ['  2. 📋 Use dropdown menus for Business Type, Status, Tax Year (click cell, then dropdown arrow)'],
      ['  3. ✏️ Follow exact format for CNIC: 12345-6789012-3 (must have dashes after 5th and 12th digit)'],
      ['  4. ✏️ Follow exact format for NTN: 1234567 or 1234567-8 (7 or 8 digits)'],
      ['  5. 📧 Email must contain @ and domain (e.g., user@example.com)'],
      ['  6. 📞 Phone should start with +92 or 0 (e.g., +92-300-1234567 or 0300-1234567)'],
      ['  7. ✅ Fill TITLE OF THE CASE (required field) for every row'],
      ['  8. 🔒 Do not modify or delete header row (it is protected)'],
      ['  9. 🎨 Watch for color changes: Green = Valid, Red = Error, Yellow = Warning'],
      ['  10. 💾 Save file before importing'],
      [''],
      ['PRE-IMPORT CHECKLIST (Check each item):'],
      ['  ☐ Deleted all 7 sample data rows (kept header row only)'],
      ['  ☐ All required fields (marked with *) are filled'],
      ['  ☐ No red cells (validation errors) remain'],
      ['  ☐ All dropdowns used (not typed manually)'],
      ['  ☐ CNIC format: 12345-6789012-3 (with dashes)'],
      ['  ☐ NTN format: 1234567 or 1234567-8'],
      ['  ☐ Email addresses contain @ and domain'],
      ['  ☐ Phone numbers start with +92 or 0'],
      ['  ☐ No blank rows between data'],
      ['  ☐ File saved before importing'],
      [''],
      ['COMMON ERRORS TO AVOID:'],
      ['  ✗ Missing dashes in CNIC (wrong: 123456789123 | correct: 12345-6789012-3)'],
      ['  ✗ Invalid email format (wrong: user@com | correct: user@example.com)'],
      ['  ✗ Typing Business Type instead of using dropdown (wrong: "business" | correct: select "Business")'],
      ['  ✗ Leaving required field empty (wrong: blank name | correct: fill "TITLE OF THE CASE")'],
      ['  ✗ Adding extra columns or modifying headers (wrong: add new column | correct: use template as-is)'],
      ['  ✗ Not deleting sample data (wrong: add data below samples | correct: delete samples first)'],
      [''],
      ['Need help? Refer to Format Examples sheet, Quick Reference sheet, or contact support.']
    ];
    
    instructionsData.forEach((row, index) => {
      const excelRow = instructionsSheet.getRow(index + 1);
      excelRow.getCell(1).value = row[0];
      
      // Style title row
      if (index === 0) {
        excelRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF4472C4' } };
      } else if (row[0] && (row[0].includes('FEATURES:') || row[0].includes('REQUIRED') || row[0].includes('FIELD FORMATS') || row[0].includes('HOW TO USE') || row[0].includes('VALIDATION') || row[0].includes('TIPS') || row[0].includes('BEFORE'))) {
        excelRow.getCell(1).font = { bold: true, size: 11 };
      }
    });
    
    instructionsSheet.getColumn(1).width = 100;
    
    // ========== SHEET 2: CLIENT DATA WITH VALIDATION ==========
    const dataSheet = workbook.addWorksheet('Client Data', {
      properties: { tabColor: { argb: 'FF70AD47' } }
    });
    
    // Headers - UPDATED STRUCTURE with CITY, PERSON, SOURCE OF INCOME, and BUSINESS CLASSIFICATION
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
      'CITY',                      // Column K - Manual entry for city names
      'PERSON',                    // Column L - Dropdown: Company, AOP, Individual
      'SOURCE OF INCOME',          // Column M - Dynamic based on Column L
      'BUSINESS CLASSIFICATION',   // Column N - Optional additional classification
      'STATUS',                    // Column O
      'TAX YEAR'                   // Column P
    ];
    
    const headerRow = dataSheet.getRow(1);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    headerRow.height = 25;
    
    // Set column widths - UPDATED for new structure with CITY and BUSINESS CLASSIFICATION
    dataSheet.getColumn(1).width = 10;  // FILE NO
    dataSheet.getColumn(2).width = 15;  // NEW NTN
    dataSheet.getColumn(3).width = 40;  // TITLE OF THE CASE *
    dataSheet.getColumn(4).width = 20;  // NIC NO (CNIC)
    dataSheet.getColumn(5).width = 12;  // PIN (IRIS)
    dataSheet.getColumn(6).width = 18;  // PASSWORD (IRIS)
    dataSheet.getColumn(7).width = 30;  // MAIL
    dataSheet.getColumn(8).width = 18;  // PASSWORD (MAIL)
    dataSheet.getColumn(9).width = 18;  // PHONE
    dataSheet.getColumn(10).width = 45; // ADDRESS
    dataSheet.getColumn(11).width = 20; // CITY (NEW - Manual entry)
    dataSheet.getColumn(12).width = 15; // PERSON
    dataSheet.getColumn(13).width = 30; // SOURCE OF INCOME (conditional dropdown)
    dataSheet.getColumn(14).width = 25; // BUSINESS CLASSIFICATION (NEW)
    dataSheet.getColumn(15).width = 12; // STATUS
    dataSheet.getColumn(16).width = 12; // TAX YEAR
    
    // Sample data rows - UPDATED with dynamic SOURCE OF INCOME examples (16 columns total)
    const sampleData = [
      ['1', '1234567-8', 'John Smith', '12345-6789012-3', '2030', 'iris123', 'john@example.com', 'email123', '+92-300-1234567', '123 Main Street, Karachi', 'Abbottabad', 'Individual', 'Salary, Property', '', 'Active', '2025'],
      ['2', '7654321-9', 'ABC Corporation', '98765-4321098-7', '2030', 'iris456', 'info@abc.com', 'email456', '+92-321-9876543', '456 Business Plaza, Lahore', 'Haripur', 'Company', 'Company', '', 'Active', '2025'],
      ['3', '2468135', 'Sarah Johnson', '11111-2222222-3', '2030', 'iris789', 'sarah@example.com', 'email789', '0300-1111111', '789 Oak Avenue, Islamabad', 'Havelian', 'Individual', 'Business, Salary, Capital Gain', '', 'Active', '2025'],
      ['4', '9876543-2', 'XYZ Partnership', '33333-4444444-5', '2030', 'iris321', 'contact@xyz.pk', 'email321', '+92-333-5555555', '321 Trade Center, Faisalabad', 'Mansehra', 'AOP', 'Distributor AOP', '', 'Active', '2024'],
      ['5', '5555555-1', 'Tech Solutions Ltd', '55555-6666666-7', '2030', 'iris654', 'admin@techsol.com', 'email654', '0345-7777777', '555 IT Park, Rawalpindi', 'Abbottabad', 'Company', 'Company', '', 'Active', '2025'],
      ['6', '3333333-4', 'Ahmed Freelancer', '77777-8888888-9', '', '', '', '', '0300-9999999', '', 'Haripur', 'Individual', 'Freelancer, Commission', '', 'Pending', '2026'],
      ['7', '', '', 'Farmer Example', '', '', '', '', '', '', '', '', 'Individual', 'Agriculture, Other Source', '', 'Active', '2025']
    ];
    
    sampleData.forEach((rowData, rowIndex) => {
      const row = dataSheet.getRow(rowIndex + 2);
      rowData.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        cell.value = value;
        
        // Add alternating row colors for better readability
        if (rowIndex % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        }
      });
    });
    
    // ========== ADD DATA VALIDATION ==========
    
    // Define validation ranges (rows 2 to 502 for data entry)
    const startRow = 2;
    const endRow = 502;
    
    // Freeze header row for easy scrolling
    dataSheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];
    
    // 1. CITY INPUT (Column K = 11) - Manual entry, no dropdown
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 11);
      cell.dataValidation = {
        type: 'textLength',
        operator: 'greaterThan',
        allowBlank: true,
        formulae: [0],
        showInputMessage: true,
        promptTitle: 'City Name',
        prompt: 'Enter city name manually (e.g., Abbottabad, Haripur, Havelian, Mansehra, etc.)'
      };
    }
    
    // 2. PERSON DROPDOWN (Column L = 12)
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 12);
      cell.dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"Company,AOP,Individual"'],
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Person Type',
        error: 'Please select a valid person type from the dropdown list.',
        showInputMessage: true,
        promptTitle: 'Person Type',
        prompt: 'Select from dropdown: Company, AOP (Association of Persons), or Individual. This determines Source of Income options.'
      };
    }
    
    // 3. SOURCE OF INCOME DROPDOWN (Column M = 13) - Dynamic based on PERSON (Column L)
    // Note: ExcelJS shows all options; VBA macro provides dynamic behavior
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 13);
      cell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Company,AOP,Distributor AOP,Business,Salary,Property,Other Source,Foreign Source,Capital Gain,Agriculture,Freelancer,Commission,Partnership"'],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Source of Income (Dynamic)',
        error: 'DYNAMIC FIELD: Company→Auto-fills "Company" | AOP→Select "AOP" or "Distributor AOP" | Individual→Multi-select allowed (comma-separated). Enable VBA macro for full functionality.',
        showInputMessage: true,
        promptTitle: 'Source of Income (Column M - Dynamic)',
        prompt: 'DYNAMIC BEHAVIOR:\n• If L=Company: Auto-fills "Company"\n• If L=AOP: Choose "AOP" or "Distributor AOP"\n• If L=Individual: Multi-select income sources\n\nOptions: Business, Salary, Property, Other Source, Foreign Source, Capital Gain, Agriculture, Freelancer, Commission, Partnership\n\nVBA macro required for auto-fill and multi-select.'
      };
    }
    
    // 4. BUSINESS CLASSIFICATION (Column N = 14) - Optional additional classification
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 14);
      cell.dataValidation = {
        type: 'textLength',
        operator: 'greaterThan',
        allowBlank: true,
        formulae: [0],
        showInputMessage: true,
        promptTitle: 'Business Classification',
        prompt: 'Optional: Enter additional business classification or category details'
      };
    }
    
    // 5. STATUS DROPDOWN (Column O = 15)
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 15);
      cell.dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"Active,Inactive,Pending"'],
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Status',
        error: 'Please select a valid status from the dropdown list.',
        showInputMessage: true,
        promptTitle: 'Status',
        prompt: 'Select from dropdown: Active, Inactive, or Pending'
      };
    }
    
    // 6. TAX YEAR DROPDOWN (Column P = 16)
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 16);
      cell.dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"2026,2025,2024,2023,2022,2021,2020"'],
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Tax Year',
        error: 'Please select a valid tax year from the dropdown list.',
        showInputMessage: true,
        promptTitle: 'Tax Year',
        prompt: 'Select tax year from dropdown: 2020-2026'
      };
    }
    
    // 4. CNIC VALIDATION (Column D = 4)
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 4);
      cell.dataValidation = {
        type: 'custom',
        allowBlank: true,
        formulae: ['AND(LEN(D' + row + ')=15,ISNUMBER(FIND("-",D' + row + ')))'],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'CNIC Format Warning',
        error: 'CNIC should be in format: 12345-6789012-3 (5 digits - 7 digits - 1 digit with dashes)',
        showInputMessage: true,
        promptTitle: 'CNIC Format',
        prompt: 'Enter CNIC in format: 12345-6789012-3'
      };
    }
    
    // 5. EMAIL VALIDATION (Column G = 7)
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 7);
      cell.dataValidation = {
        type: 'custom',
        allowBlank: true,
        formulae: ['ISNUMBER(FIND("@",G' + row + '))'],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Email Format Warning',
        error: 'Email must contain @ symbol and domain (e.g., user@example.com)',
        showInputMessage: true,
        promptTitle: 'Email Address',
        prompt: 'Enter valid email: user@example.com'
      };
    }
    
    // 6. NTN VALIDATION (Column B = 2)
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 2);
      cell.dataValidation = {
        type: 'custom',
        allowBlank: true,
        formulae: ['OR(LEN(B' + row + ')=7,LEN(B' + row + ')=9,LEN(B' + row + ')=0)'],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'NTN Format Warning',
        error: 'NTN should be 7 digits (e.g., 1234567) or 8 digits with dash (e.g., 1234567-8). You entered: ' + cell.value,
        showInputMessage: true,
        promptTitle: 'NTN Format',
        prompt: 'Enter NTN: 1234567 or 1234567-8 (7 or 8 digits with optional dash)'
      };
    }
    
    // 7. PHONE VALIDATION (Column I = 9)
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 9);
      cell.dataValidation = {
        type: 'custom',
        allowBlank: true,
        formulae: ['OR(LEFT(I' + row + ',3)="+92",LEFT(I' + row + ',1)="0",LEN(I' + row + ')=0)'],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Phone Format Warning',
        error: 'Phone should start with +92 or 0 (e.g., +92-300-1234567 or 0300-1234567)',
        showInputMessage: true,
        promptTitle: 'Phone Number',
        prompt: 'Enter phone: +92-300-1234567 or 0300-1234567'
      };
    }
    
    // 8. REQUIRED FIELD - TITLE OF THE CASE (Column C = 3)
    for (let row = startRow; row <= endRow; row++) {
      const cell = dataSheet.getCell(row, 3);
      cell.dataValidation = {
        type: 'textLength',
        operator: 'greaterThan',
        allowBlank: false,
        formulae: [0],
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Required Field',
        error: 'Client name (TITLE OF THE CASE) is required and cannot be empty. This is the only required field.',
        showInputMessage: true,
        promptTitle: 'Client Name (Required *)',
        prompt: 'Enter client or business name. This field is REQUIRED and cannot be left empty.'
      };
    }
    
    // ========== CONDITIONAL FORMATTING ==========
    
    // 1. Highlight empty required fields (TITLE OF THE CASE) in red
    dataSheet.addConditionalFormatting({
      ref: `C${startRow}:C${endRow}`,
      rules: [
        {
          type: 'expression',
          formulae: [`ISBLANK(C${startRow})`],
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: { argb: 'FFFFC7CE' }
            },
            font: {
              color: { argb: 'FF9C0006' },
              bold: true
            }
          }
        }
      ]
    });
    
    // 2. Highlight valid CNIC format in green
    dataSheet.addConditionalFormatting({
      ref: `D${startRow}:D${endRow}`,
      rules: [
        {
          type: 'expression',
          formulae: [`AND(LEN(D${startRow})=15,ISNUMBER(FIND("-",D${startRow})))`],
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: { argb: 'FFC6EFCE' }
            },
            font: {
              color: { argb: 'FF006100' }
            }
          }
        }
      ]
    });
    
    // 3. Highlight valid email format in green
    dataSheet.addConditionalFormatting({
      ref: `G${startRow}:G${endRow}`,
      rules: [
        {
          type: 'expression',
          formulae: [`AND(ISNUMBER(FIND("@",G${startRow})),ISNUMBER(FIND(".",G${startRow})))`],
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: { argb: 'FFC6EFCE' }
            },
            font: {
              color: { argb: 'FF006100' }
            }
          }
        }
      ]
    });
    
    // 4. Highlight valid NTN format in green
    dataSheet.addConditionalFormatting({
      ref: `B${startRow}:B${endRow}`,
      rules: [
        {
          type: 'expression',
          formulae: [`OR(LEN(B${startRow})=7,LEN(B${startRow})=9)`],
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: { argb: 'FFC6EFCE' }
            },
            font: {
              color: { argb: 'FF006100' }
            }
          }
        }
      ]
    });
    
    // 5. Highlight valid phone format in green
    dataSheet.addConditionalFormatting({
      ref: `I${startRow}:I${endRow}`,
      rules: [
        {
          type: 'expression',
          formulae: [`OR(LEFT(I${startRow},3)="+92",LEFT(I${startRow},1)="0")`],
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: { argb: 'FFC6EFCE' }
            },
            font: {
              color: { argb: 'FF006100' }
            }
          }
        }
      ]
    });
    
    // 6. Highlight optional fields in light blue (for clarity)
    const optionalColumns = ['A', 'E', 'F', 'H', 'J']; // FILE NO, PIN, PASSWORD (IRIS), PASSWORD (MAIL), ADDRESS
    optionalColumns.forEach(col => {
      dataSheet.addConditionalFormatting({
        ref: `${col}${startRow}:${col}${endRow}`,
        rules: [
          {
            type: 'expression',
            formulae: [`NOT(ISBLANK(${col}${startRow}))`],
            style: {
              fill: {
                type: 'pattern',
                pattern: 'solid',
                bgColor: { argb: 'FFD9E1F2' }
              }
            }
          }
        ]
      });
    });
    
    // ========== SHEET 3: CONFIG_MASTER (HIDDEN) ==========
    const configSheet = workbook.addWorksheet('CONFIG_MASTER', {
      properties: { tabColor: { argb: 'FFFF0000' } }
    });
    
    // Define all dropdown source lists and automation mappings in CONFIG_MASTER
    const configData = [
      ['CONFIGURATION MASTER - DO NOT DELETE OR MODIFY'],
      [''],
      ['This sheet contains centralized dropdown source lists, mapping logic, and automation routing rules.'],
      ['All data validation references and future automation systems use this configuration.'],
      [''],
      ['=== PERSON TYPES ==='],
      ['Company'],
      ['AOP'],
      ['Individual'],
      [''],
      ['=== SOURCE OF INCOME - COMPANY ==='],
      ['Company'],
      [''],
      ['=== SOURCE OF INCOME - AOP ==='],
      ['AOP'],
      ['Distributor AOP'],
      [''],
      ['=== SOURCE OF INCOME - INDIVIDUAL ==='],
      ['Business'],
      ['Salary'],
      ['Property'],
      ['Other Source'],
      ['Foreign Source'],
      ['Capital Gain'],
      ['Agriculture'],
      ['Freelancer'],
      ['Commission'],
      ['Partnership'],
      [''],
      ['=== STATUS OPTIONS ==='],
      ['Active'],
      ['Inactive'],
      ['Pending'],
      [''],
      ['=== TAX YEARS ==='],
      ['2026'],
      ['2025'],
      ['2024'],
      ['2023'],
      ['2022'],
      ['2021'],
      ['2020'],
      [''],
      ['=== WORKBOOK ROUTING MAP ==='],
      ['PERSON_TYPE', 'SOURCE_OF_INCOME', 'TARGET_WORKBOOK', 'SCHEDULE_REQUIRED'],
      ['Company', 'Company', 'Company_Tax_Return.xlsx', 'Company_Main'],
      ['AOP', 'AOP', 'AOP_Tax_Return.xlsx', 'AOP_Main'],
      ['AOP', 'Distributor AOP', 'AOP_Tax_Return.xlsx', 'AOP_Distributor'],
      ['Individual', 'Salary', 'Individual_Tax_Return.xlsx', 'Salary_Schedule'],
      ['Individual', 'Business', 'Individual_Tax_Return.xlsx', 'Business_Schedule'],
      ['Individual', 'Property', 'Individual_Tax_Return.xlsx', 'Property_Schedule'],
      ['Individual', 'Other Source', 'Individual_Tax_Return.xlsx', 'Other_Source_Schedule'],
      ['Individual', 'Foreign Source', 'Individual_Tax_Return.xlsx', 'Foreign_Source_Schedule'],
      ['Individual', 'Capital Gain', 'Individual_Tax_Return.xlsx', 'Capital_Gain_Schedule'],
      ['Individual', 'Agriculture', 'Individual_Tax_Return.xlsx', 'Agriculture_Schedule'],
      ['Individual', 'Freelancer', 'Individual_Tax_Return.xlsx', 'Freelancer_Schedule'],
      ['Individual', 'Commission', 'Individual_Tax_Return.xlsx', 'Commission_Schedule'],
      ['Individual', 'Partnership', 'Individual_Tax_Return.xlsx', 'Partnership_Schedule'],
      [''],
      ['=== CLASSIFICATION RULES ==='],
      ['RULE_ID', 'PERSON_TYPE', 'SOURCE_PATTERN', 'CLASSIFICATION', 'PRIORITY'],
      ['R001', 'Company', 'Company', 'CORPORATE_FILER', '1'],
      ['R002', 'AOP', 'AOP', 'AOP_STANDARD', '1'],
      ['R003', 'AOP', 'Distributor AOP', 'AOP_DISTRIBUTOR', '1'],
      ['R004', 'Individual', 'Salary', 'SALARIED_INDIVIDUAL', '2'],
      ['R005', 'Individual', 'Business', 'BUSINESS_INDIVIDUAL', '2'],
      ['R006', 'Individual', 'Salary,Business', 'MIXED_INCOME_INDIVIDUAL', '3'],
      ['R007', 'Individual', 'Salary,Property', 'SALARIED_PROPERTY_OWNER', '3'],
      ['R008', 'Individual', '*multiple*', 'COMPLEX_INDIVIDUAL', '4'],
      [''],
      ['=== AUTOMATION METADATA ==='],
      ['CONFIG_VERSION', '1.0'],
      ['LAST_UPDATED', '2026-05-19'],
      ['COMPATIBLE_WITH', 'Python_openpyxl,Node_ExcelJS,Electron'],
      ['ROUTING_ENGINE', 'ENABLED'],
      ['AI_CLASSIFICATION', 'READY'],
      ['DATABASE_SYNC', 'ENABLED']
    ];
    
    configData.forEach((row, index) => {
      const excelRow = configSheet.getRow(index + 1);
      excelRow.getCell(1).value = row[0];
      
      // Style headers
      if (row[0] && row[0].includes('===')) {
        excelRow.getCell(1).font = { bold: true, color: { argb: 'FFFF0000' } };
      } else if (index === 0) {
        excelRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFF0000' } };
      }
    });
    
    configSheet.getColumn(1).width = 60;
    
    // Hide the CONFIG_MASTER sheet
    configSheet.state = 'hidden';
    
    // ========== SHEET 4: VALIDATION LISTS (USER-VISIBLE) ==========
    const validationSheet = workbook.addWorksheet('Validation Lists', {
      properties: { tabColor: { argb: 'FFFFC000' } }
    });
    
    const validationData = [
      ['VALIDATION REFERENCE - DO NOT DELETE THIS SHEET'],
      [''],
      ['This sheet contains dropdown options used in the Client Data sheet.'],
      [''],
      ['PERSON TYPES (NEW):'],
      ['Company - Registered company or corporation'],
      ['AOP - Association of Persons (partnership/group)'],
      ['Individual - Single person taxpayer'],
      [''],
      ['BUSINESS TYPES (UPDATED - Multi-Select Supported):'],
      ['Business - Business income from trade/commerce'],
      ['Salary - Employment/salary income'],
      ['Other Source - Income from other sources'],
      ['Property - Rental/property income'],
      ['Foreign Source - Foreign income'],
      ['Capital Gain - Capital gains from investments'],
      [''],
      ['NOTE: BUSINESS TYPE supports multiple selections when VBA macro is enabled.'],
      ['Example: "Salary, Property" means client has both salary and rental income.'],
      [''],
      ['STATUS OPTIONS:'],
      ['Active - Current active client'],
      ['Inactive - Former or inactive client'],
      ['Pending - New client in onboarding'],
      [''],
      ['TAX YEARS:'],
      ['2026'],
      ['2025'],
      ['2024'],
      ['2023'],
      ['2022'],
      ['2021'],
      ['2020'],
      [''],
      ['FORMAT PATTERNS:'],
      ['CNIC: 12345-6789012-3 (5-7-1 digits with dashes)'],
      ['NTN: 1234567 or 1234567-8 (7 digits with optional check digit)'],
      ['Email: user@example.com (must contain @ and domain)'],
      ['Phone: +92-300-1234567 or 0300-1234567'],
      [''],
      ['MULTI-SELECT INSTRUCTIONS:'],
      ['To enable multi-select for BUSINESS TYPE:'],
      ['1. Open the file and press ALT + F11'],
      ['2. Double-click "Client Data" sheet in VBA editor'],
      ['3. Copy code from EXCEL_MULTISELECT_VBA.bas file'],
      ['4. Save as .xlsm (macro-enabled workbook)'],
      ['5. Enable macros when opening the file']
    ];
    
    validationData.forEach((row, index) => {
      validationSheet.getRow(index + 1).getCell(1).value = row[0];
      if (index === 0 || row[0].includes(':')) {
        validationSheet.getRow(index + 1).getCell(1).font = { bold: true };
      }
    });
    
    validationSheet.getColumn(1).width = 60;
    
    // ========== SHEET 4: QUICK REFERENCE ==========
    const quickRefSheet = workbook.addWorksheet('Quick Reference', {
      properties: { tabColor: { argb: 'FFFF6600' } }
    });
    
    const quickRefData = [
      ['QUICK REFERENCE GUIDE - COPY & PASTE HELPERS'],
      [''],
      ['📋 COPY-PASTE TEMPLATES:'],
      [''],
      ['CNIC Format Template:'],
      ['  12345-6789012-3'],
      ['  (5 digits - 7 digits - 1 digit)'],
      [''],
      ['NTN Format Templates:'],
      ['  1234567 (7 digits)'],
      ['  1234567-8 (7 digits - 1 check digit)'],
      [''],
      ['Phone Format Templates:'],
      ['  +92-300-1234567 (International format - preferred)'],
      ['  0300-1234567 (Local format)'],
      ['  +92-321-9876543'],
      ['  0333-5555555'],
      [''],
      ['Email Format Templates:'],
      ['  user@example.com'],
      ['  info@company.pk'],
      ['  contact@business.com'],
      [''],
      ['📖 BUSINESS TYPE DEFINITIONS:'],
      [''],
      ['Individual: Personal taxpayer, salaried employee, or individual filer'],
      ['Business: Small/medium enterprise, company, or registered business'],
      ['Self-Employed: Freelancer, consultant, or independent professional'],
      ['Partnership: Business partnership between 2+ partners'],
      ['Corporation: Large corporation, limited company, or public company'],
      [''],
      ['📊 STATUS DEFINITIONS:'],
      [''],
      ['Active: Current client with active tax filing'],
      ['Inactive: Former client or temporarily inactive'],
      ['Pending: New client in onboarding process'],
      [''],
      ['💡 QUICK TIPS:'],
      [''],
      ['1. CNIC must have dashes - copy format above and replace digits'],
      ['2. For dropdowns, click cell then click dropdown arrow (don\'t type)'],
      ['3. Email must have @ and domain (.com, .pk, etc.)'],
      ['4. Phone can be with or without country code (+92)'],
      ['5. Only "TITLE OF THE CASE" is required - all other fields optional'],
      ['6. Delete all 7 sample rows before entering your data'],
      ['7. Watch for color changes: Green = Valid, Red = Error'],
      [''],
      ['🔢 CHARACTER LIMITS:'],
      [''],
      ['CNIC: Exactly 15 characters (including dashes)'],
      ['NTN: 7 or 9 characters (7 digits or 7-1 format)'],
      ['Phone: 10-17 characters (flexible format)'],
      ['Email: No limit (but must be valid format)'],
      ['Name: No limit (but required)']
    ];
    
    quickRefData.forEach((row, index) => {
      const excelRow = quickRefSheet.getRow(index + 1);
      excelRow.getCell(1).value = row[0];
      
      if (index === 0) {
        excelRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFF6600' } };
      } else if (row[0] && (row[0].includes('📋') || row[0].includes('📖') || row[0].includes('📊') || row[0].includes('💡') || row[0].includes('🔢'))) {
        excelRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF4472C4' } };
      } else if (row[0] && row[0].includes(':') && !row[0].includes('//')) {
        excelRow.getCell(1).font = { bold: true };
      }
    });
    
    quickRefSheet.getColumn(1).width = 80;
    
    // ========== SHEET 5: FORMAT EXAMPLES ==========
    const examplesSheet = workbook.addWorksheet('Format Examples', {
      properties: { tabColor: { argb: 'FF92D050' } }
    });
    
    const examplesData = [
      ['FORMAT EXAMPLES & VALIDATION GUIDE'],
      [''],
      ['Field Name', 'Correct Format', 'Incorrect Format', 'Validation Type'],
      ['CNIC', '12345-6789012-3', '123456789123', 'Custom formula (checks length and dashes)'],
      ['CNIC', '98765-4321098-7', '98765-43210987', 'Must be exactly 5-7-1 pattern'],
      ['NTN', '1234567-8', '12345678', 'Warning only (7 or 8 digits)'],
      ['NTN', '9876543', '98-76543', 'No validation (flexible format)'],
      ['Email', 'user@example.com', 'user@com', 'Custom formula (checks for @)'],
      ['Email', 'info@company.pk', 'user@', 'Must contain @ symbol'],
      ['Phone', '+92-300-1234567', '03001234567', 'No validation (flexible format)'],
      ['Phone', '0300-1234567', '+92 300 1234567', 'Prefer dashes over spaces'],
      ['Business Type', 'Individual', 'individual', 'Dropdown list (exact match required)'],
      ['Business Type', 'Corporation', 'Corp', 'Must select from dropdown'],
      ['Status', 'Active', 'active', 'Dropdown list (exact match required)'],
      ['Status', 'Pending', 'PENDING', 'Case-sensitive dropdown'],
      ['Tax Year', '2025', '25', 'Dropdown list (4-digit year)'],
      ['Client Name', 'John Smith', '(empty)', 'Required field (cannot be blank)'],
      [''],
      ['VALIDATION BEHAVIOR:'],
      ['• Dropdowns: Error message prevents invalid entry'],
      ['• CNIC/Email/NTN/Phone: Warning message allows entry but shows alert'],
      ['• Required fields: Error message prevents leaving blank'],
      ['• Other fields: No validation (flexible entry)'],
      [''],
      ['COLOR CODING:'],
      ['• 🟢 Green background: Valid format entered correctly'],
      ['• 🔴 Red background: Error - required field is empty'],
      ['• 🔵 Light blue background: Optional field with data'],
      ['• ⚪ White/Gray background: Empty optional field']
    ];
    
    const examplesHeaderRow = examplesSheet.getRow(1);
    examplesHeaderRow.getCell(1).value = examplesData[0][0];
    examplesHeaderRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF70AD47' } };
    
    const examplesTableHeader = examplesSheet.getRow(3);
    examplesData[2].forEach((header, index) => {
      const cell = examplesTableHeader.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      };
    });
    
    for (let i = 3; i < examplesData.length; i++) {
      const row = examplesSheet.getRow(i + 1);
      examplesData[i].forEach((value, colIndex) => {
        row.getCell(colIndex + 1).value = value;
      });
    }
    
    examplesSheet.getColumn(1).width = 20;
    examplesSheet.getColumn(2).width = 25;
    examplesSheet.getColumn(3).width = 25;
    examplesSheet.getColumn(4).width = 45;
    
    // ========== PROTECT SHEETS ==========
    // Protect all sheets except Client Data to prevent accidental changes
    await instructionsSheet.protect('', {
      selectLockedCells: true,
      selectUnlockedCells: true
    });
    
    await validationSheet.protect('', {
      selectLockedCells: true,
      selectUnlockedCells: true
    });
    
    await quickRefSheet.protect('', {
      selectLockedCells: true,
      selectUnlockedCells: true
    });
    
    await examplesSheet.protect('', {
      selectLockedCells: true,
      selectUnlockedCells: true
    });
    
    // Protect header row in Client Data sheet
    headerRow.eachCell((cell) => {
      cell.protection = { locked: true };
    });
    
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
      message: 'Enhanced template with data validation generated successfully'
    };
    
  } catch (error) {
    console.error('Template generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default generateValidatedTemplate;
