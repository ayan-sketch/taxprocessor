/**
 * PDF Data Extraction Utility
 * Extracts Name, CNIC/NTN, and Tax Year from PDF files
 */

import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker - try multiple sources
try {
  // Try to use the npm package worker first
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href;
} catch (e) {
  // Fallback to CDN with https protocol
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  console.warn('Using CDN worker for PDF.js:', pdfjsLib.GlobalWorkerOptions.workerSrc);
}

/**
 * Extract text from PDF file
 * @param {File} file - PDF file object
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromPDF(file) {
  try {
    console.log('Starting PDF text extraction for:', file.name);
    
    // Validate file size (max 50MB to prevent memory issues)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 50MB.`);
    }
    
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log('PDF loaded, pages:', pdf.numPages);
    
    let fullText = '';
    
    // Extract text from all pages with improved structure preservation
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // IMPROVED: Preserve line structure based on Y-coordinates
      let lastY = null;
      let pageText = '';
      
      textContent.items.forEach((item, index) => {
        const currentY = item.transform[5]; // Y coordinate
        
        // If Y position changed significantly, add line break
        if (lastY !== null && Math.abs(currentY - lastY) > 5) {
          pageText += '\n';
        } else if (index > 0 && item.str.trim()) {
          // Add space between items on same line
          pageText += ' ';
        }
        
        pageText += item.str;
        lastY = currentY;
      });
      
      fullText += pageText + '\n\n'; // Double line break between pages
    }
    
    console.log('Text extraction complete, length:', fullText.length);
    console.log('First 1500 chars:', fullText.substring(0, 1500));
    console.log('Looking for Name pattern in text...');
    
    // Debug: Show what's around "Name"
    const nameIndex = fullText.indexOf('Name');
    if (nameIndex !== -1) {
      console.log('Found "Name" at position', nameIndex);
      console.log('Text around Name:', fullText.substring(nameIndex, nameIndex + 300));
    }
    
    // Debug: Show what's around "Registration"
    const regIndex = fullText.indexOf('Registration');
    if (regIndex !== -1) {
      console.log('Found "Registration" at position', regIndex);
      console.log('Text around Registration:', fullText.substring(regIndex, regIndex + 200));
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract Name from PDF text
 * Looks for common patterns like "Name:", "Taxpayer Name:", etc.
 * @param {string} text - PDF text content
 * @returns {string|null} - Extracted name or null
 */
function extractName(text) {
  console.log('=== EXTRACTING NAME ===');
  console.log('Text length:', text.length);
  console.log('First 1000 chars:', text.substring(0, 1000));
  
  // Common patterns for name in tax returns - IMPROVED with more flexibility
  const namePatterns = [
    // Pattern 1: Name appears before "Registration No" (common in Pakistani tax returns)
    // Captures name that appears anywhere between address and "Registration No"
    /(?:Mansehra|Province|City|District|Address[^\n]*\n[^\n]*\n[^\n]*\n)\s*([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*)\s+Registration\s+No/i,
    
    // Pattern 2: Name on same line, followed by newline and Registration
    /Name\s*:?\s*\n?\s*([A-Z][A-Za-z\s.'-]{2,50}?)\s*\n\s*Registration/i,
    
    // Pattern 3: Name: followed by name on same or next line, then Registration
    /Name\s*:\s*\n?\s*([A-Z][A-Za-z\s.'-]{2,50}?)\s+Registration/i,
    
    // Pattern 4: Name followed by CNIC or Registration number (flexible spacing)
    /Name\s*:?\s*\n?\s*([A-Z][A-Za-z\s.'-]{2,50}?)\s+(?:CNIC|Registration|NTN)/i,
    
    // Pattern 5: Name followed by Address
    /Name\s*:?\s*\n?\s*([A-Z][A-Za-z\s.'-]{2,50}?)\s+Address/i,
    
    // Pattern 6: Name followed by newline and then another field
    /Name\s*:?\s*\n\s*([A-Z][A-Za-z\s.'-]{2,50}?)\s*\n\s*(?:Address|Registration|CNIC|Father|S\/o|D\/o|W\/o)/i,
    
    // Pattern 7: Taxpayer Name
    /Taxpayer\s+Name\s*:?\s*\n?\s*([A-Z][A-Za-z\s.'-]{2,50}?)\s*(?:\n|Registration|Address|CNIC|NTN|Tax)/i,
    
    // Pattern 8: Full Name
    /Full\s+Name\s*:?\s*\n?\s*([A-Z][A-Za-z\s.'-]{2,50}?)\s*(?:\n|Registration|Address|CNIC|NTN|Tax)/i,
    
    // Pattern 9: Name of Taxpayer
    /Name\s+of\s+(?:the\s+)?Taxpayer\s*:?\s*\n?\s*([A-Z][A-Za-z\s.'-]{2,50}?)\s*(?:\n|Registration|Address|CNIC|NTN|Tax)/i,
    
    // Pattern 10: Assessee Name
    /Assessee\s+Name\s*:?\s*\n?\s*([A-Z][A-Za-z\s.'-]{2,50}?)\s*(?:\n|Registration|Address|CNIC|NTN|Tax)/i,
    
    // Pattern 11: Name followed by multiple spaces or tab
    /Name\s*:?\s*\n?\s*([A-Z][A-Za-z\s.'-]{2,50}?)\s{2,}/i,
    
    // Pattern 12: ACKNOWLEDGEMENT SLIP format - name appears after address before Registration
    /Name\s*:[\s\S]{0,300}?([a-z]+\s+[a-z]+)\s+Registration\s+No/i,
    
    // Pattern 13: Very flexible - Name: followed by capital letters on next line
    /Name\s*:?\s*\n\s*([A-Z][A-Za-z\s.'-]+?)(?=\s*\n)/i,
    
    // Pattern 14: Name with colon, flexible whitespace, capture until next field
    /Name\s*:\s*([A-Z][A-Za-z\s.'-]+?)(?=\s*(?:Registration|Address|CNIC|NTN|Father|S\/o|D\/o|W\/o|\n\s*\n))/i,
    
    // Pattern 15: Name without colon (some PDFs)
    /\bName\s+([A-Z][A-Za-z\s.'-]{2,50}?)\s+(?:Registration|Address|CNIC)/i,
  ];
  
  for (let i = 0; i < namePatterns.length; i++) {
    const pattern = namePatterns[i];
    const match = text.match(pattern);
    if (match && match[1]) {
      console.log(`Pattern ${i + 1} matched:`, pattern.source);
      console.log('Raw match:', match[1]);
      
      // Clean up the name
      let name = match[1].trim();
      
      // Skip if it's a common field name that was incorrectly matched
      const invalidNames = ['Tax Year', 'Tax', 'Year', 'Registration', 'Address', 'CNIC', 'NTN', 'Father', 'Son', 'Daughter', 'Wife'];
      if (invalidNames.some(invalid => name.toLowerCase().includes(invalid.toLowerCase()))) {
        console.log('✗ Skipping invalid name (field label):', name);
        continue;
      }
      
      // Remove extra spaces
      name = name.replace(/\s+/g, ' ');
      // Remove trailing punctuation
      name = name.replace(/[,;:.]+$/, '');
      // Remove any labels that might have been captured
      name = name.replace(/\s*(Address|Registration|Contact|NEAR|Village|CNIC|NTN|Tax|Year|No|Father|S\/o|D\/o|W\/o).*$/i, '');
      
      // Capitalize properly (handle all caps names)
      if (name === name.toUpperCase() && name.length > 3) {
        // If all caps, convert to title case
        name = name.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
      
      // Final cleanup
      name = name.trim();
      
      // Validate: must be 2-50 chars and only letters/spaces/dots/apostrophes/hyphens
      // Also check it's not a number or contains mostly numbers
      if (name.length >= 2 && name.length <= 50 && /^[A-Za-z\s.'"-]+$/.test(name) && !/\d/.test(name)) {
        console.log('✓ Name extracted successfully:', name);
        return name;
      } else {
        console.log('✗ Name validation failed:', { length: name.length, name: name, valid: /^[A-Za-z\s.'"-]+$/.test(name), hasNumbers: /\d/.test(name) });
      }
    }
  }
  
  // Fallback: Look for any capitalized words near the beginning
  console.log('Trying fallback patterns...');
  
  // Try to find name after "Name:" label even if other patterns failed
  const simpleNameMatch = text.match(/Name\s*:\s*([A-Z][A-Za-z\s.'-]{2,50})/i);
  if (simpleNameMatch && simpleNameMatch[1]) {
    let name = simpleNameMatch[1].trim();
    
    // Clean up
    name = name.replace(/\s+/g, ' ');
    name = name.split(/\s+/).slice(0, 5).join(' '); // Take max 5 words
    name = name.replace(/\s*(Address|Registration|Contact|NEAR|Village|CNIC|NTN|Tax|Year|No|Father|S\/o|D\/o|W\/o).*$/i, '');
    name = name.trim();
    
    // Skip invalid names
    const invalidNames = ['Tax Year', 'Tax', 'Year', 'Registration', 'Address', 'CNIC', 'NTN'];
    if (!invalidNames.some(invalid => name.toLowerCase().includes(invalid.toLowerCase())) && 
        name.length >= 2 && name.length <= 50 && 
        /^[A-Za-z\s.'"-]+$/.test(name) && 
        !/\d/.test(name)) {
      console.log('✓ Name found using simple fallback:', name);
      return name;
    }
  }
  
  // Last resort: Look for capitalized words near the beginning (but not field labels)
  const fallbackPattern = /^[\s\S]{0,500}([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})/;
  const fallbackMatch = text.match(fallbackPattern);
  if (fallbackMatch && fallbackMatch[1]) {
    const name = fallbackMatch[1].trim();
    const invalidNames = ['Tax Year', 'Tax', 'Year', 'Registration', 'Address', 'CNIC', 'NTN', 'Acknowledgement', 'Slip'];
    if (!invalidNames.some(invalid => name.toLowerCase().includes(invalid.toLowerCase())) && 
        name.length >= 2 && name.length <= 50) {
      console.log('✓ Name found using fallback pattern:', name);
      return name;
    }
  }
  
  console.log('✗ No name pattern matched');
  console.log('Text sample for debugging (first 800 chars):', text.substring(0, 800));
  return null;
}

/**
 * Extract CNIC or NTN from PDF text
 * @param {string} text - PDF text content
 * @returns {string|null} - Extracted CNIC/NTN or null
 */
function extractCNICOrNTN(text) {
  console.log('=== EXTRACTING CNIC/NTN ===');
  
  // NTN pattern: 1234567-8 or 12345678 or longer registration numbers
  const ntnPatterns = [
    // Pattern 1: Tax Year followed by number (common in scrambled PDFs where layout is: "Tax Year : 1350315678103")
    /Tax\s+Year\s*:?\s*\n?\s*(\d{10,13})/i,
    
    // Pattern 2: Registration No with newline (value on next line)
    /Registration\s+No\.?\s*:?\s*\n\s*(\d{10,13})/i,
    
    // Pattern 3: "Registration No1310197775707" - no space/colon after "No"
    /Registration\s+No\.?\s*(\d{10,13})/i,
    
    // Pattern 4: "Registration No :" with flexible spacing
    /Registration\s+No\.?\s*:?\s*(\d{10,13})/i,
    
    // Pattern 5: Look for "Registration" then capture number (very flexible)
    /Registration[:\s]*No\.?[:\s\n]*(\d{10,13})/i,
    
    // Pattern 6: NTN with label
    /NTN\s*:?\s*\n?\s*(\d{7,13})/i,
    
    // Pattern 7: National Tax Number
    /(?:National\s+)?Tax\s+Number\s*:?\s*\n?\s*(\d{7,13})/i,
    
    // Pattern 8: Just look for 10-13 digit number after "Registration" (very flexible)
    /Registration[^0-9]{0,30}(\d{10,13})/i,
    
    // Pattern 9: Registration Number with various formats
    /Registration\s+Number\s*:?\s*\n?\s*(\d{10,13})/i,
    
    // Pattern 10: Reg No (abbreviated)
    /Reg\.?\s+No\.?\s*:?\s*\n?\s*(\d{10,13})/i,
  ];
  
  // Try NTN/Registration patterns first
  for (let i = 0; i < ntnPatterns.length; i++) {
    const pattern = ntnPatterns[i];
    const match = text.match(pattern);
    if (match && match[1]) {
      console.log(`Pattern ${i + 1} matched:`, pattern.source);
      console.log('Raw match:', match[1]);
      
      // Normalize format - remove spaces
      let ntn = match[1].replace(/\s/g, '');
      
      // Validate length
      if (ntn.length >= 7 && ntn.length <= 13) {
        console.log('✓ CNIC/NTN extracted successfully:', ntn);
        return ntn;
      }
    }
  }
  
  // CNIC pattern: 12345-1234567-1 or 1234512345671
  const cnicPatterns = [
    /CNIC\s*:?\s*(\d{5}[-\s]?\d{7}[-\s]?\d{1})/i,
    /(?:National\s+)?Identity\s+Card\s*:?\s*(\d{5}[-\s]?\d{7}[-\s]?\d{1})/i,
    /\b(\d{5}[-\s]?\d{7}[-\s]?\d{1})\b/,
  ];
  
  // Try CNIC if NTN not found
  for (let i = 0; i < cnicPatterns.length; i++) {
    const pattern = cnicPatterns[i];
    const match = text.match(pattern);
    if (match && match[1]) {
      console.log(`CNIC Pattern ${i + 1} matched:`, pattern.source);
      console.log('Raw match:', match[1]);
      
      // Normalize CNIC format (remove spaces, keep hyphens)
      let cnic = match[1].replace(/\s/g, '');
      // Ensure proper format with hyphens
      if (cnic.length === 13 && !cnic.includes('-')) {
        cnic = `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`;
      }
      console.log('✓ CNIC extracted successfully:', cnic);
      return cnic;
    }
  }
  
  console.log('✗ No CNIC/NTN pattern matched');
  return null;
}

/**
 * Extract Tax Year from PDF text
 * @param {string} text - PDF text content
 * @returns {string|null} - Extracted tax year or null
 */
function extractTaxYear(text) {
  console.log('=== EXTRACTING TAX YEAR ===');
  
  // Tax year patterns - IMPROVED with more flexibility
  const taxYearPatterns = [
    // Pattern 1: "Period : 2025" format (common in scrambled PDFs)
    /Period\s*:?\s*\n?\s*(\d{4})/i,
    
    // Pattern 2: Tax Year with newline (value on next line)
    /Tax\s+Year\s*:?\s*\n\s*(\d{4})/i,
    
    // Pattern 3: "Tax Year :" with spaces (exact format from sample)
    /Tax\s+Year\s*:\s*(\d{4})/i,
    
    // Pattern 4: Tax Year with label (flexible)
    /Tax\s+Year\s*[:\-]?\s*(\d{4})/i,
    
    // Pattern 5: Assessment/Income Year
    /(?:Assessment|Income)\s+Year\s*:?\s*\n?\s*(\d{4})/i,
    /Year\s+(?:of\s+)?(?:Assessment|Income)\s*:?\s*\n?\s*(\d{4})/i,
    
    // Pattern 6: Financial Year
    /(?:FY|F\.Y\.|Financial\s+Year)\s*:?\s*\n?\s*(\d{4})/i,
    
    // Pattern 7: Year ending
    /(?:for\s+the\s+year|year\s+ending)\s*:?\s*\n?\s*(\d{4})/i,
    
    // Pattern 8: Period/Year in format
    /(?:Period|Year)\s*:?\s*\n?\s*(?:from\s+)?(?:\d{1,2}[-/]\d{1,2}[-/])?(\d{4})/i,
    
    // Pattern 9: Tax year in various formats
    /(?:Tax|Income|Assessment)\s+(?:Year|Period)\s*:?\s*\n?\s*(\d{4})/i,
    
    // Pattern 10: Year without label (near beginning of document)
    /^[\s\S]{0,300}(?:Year|Tax|Assessment|Income)[:\s]+(\d{4})/i,
  ];
  
  for (let i = 0; i < taxYearPatterns.length; i++) {
    const pattern = taxYearPatterns[i];
    const match = text.match(pattern);
    if (match && match[1]) {
      console.log(`Pattern ${i + 1} matched:`, pattern.source);
      console.log('Raw match:', match[1]);
      
      const year = parseInt(match[1]);
      // Validate year is reasonable (between 2000 and current year + 1)
      const currentYear = new Date().getFullYear();
      if (year >= 2000 && year <= currentYear + 1) {
        console.log('✓ Tax year extracted successfully:', year.toString());
        return year.toString();
      } else {
        console.log('✗ Year out of valid range:', year);
      }
    }
  }
  
  // Fallback: look for any 4-digit year in reasonable range
  // Search in first 1000 characters (header area)
  console.log('Trying fallback year search...');
  const headerText = text.substring(0, 1000);
  const yearMatches = headerText.match(/\b(20\d{2})\b/g);
  if (yearMatches && yearMatches.length > 0) {
    const currentYear = new Date().getFullYear();
    // Return the most recent valid year found
    const validYears = yearMatches
      .map(y => parseInt(y))
      .filter(year => year >= 2000 && year <= currentYear + 1)
      .sort((a, b) => b - a); // Sort descending
    
    if (validYears.length > 0) {
      console.log('✓ Tax year found in fallback search:', validYears[0]);
      return validYears[0].toString();
    }
  }
  
  console.log('✗ No tax year pattern matched');
  return null;
}

function parseAmountString(value) {
  if (!value) return '';
  const cleaned = value
    .replace(/Rs\.?|PKR|Rupees|rupees|Rs|₹|,/g, '')
    .replace(/\s+/g, '')
    .replace(/[^0-9.\-]/g, '');

  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) return '';

  const num = parseFloat(match[0]);
  if (Number.isNaN(num)) return '';
  return Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.00$/, '');
}

function extractAmount(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const amount = parseAmountString(match[1]);
      if (amount) return amount;
    }
  }
  return '';
}

function extractTotalIncome(text) {
  return extractAmount(text, [
    /Total\s+Income\s*[:\-]?\s*\n?\s*Rs\.?\s*([0-9,\.\s]+)/i,
    /Total\s+Income\s*[:\-]?\s*\n?\s*([0-9,\.\s]+)/i,
    /Gross\s+Income\s*[:\-]?\s*\n?\s*Rs\.?\s*([0-9,\.\s]+)/i,
    /Gross\s+Income\s*[:\-]?\s*\n?\s*([0-9,\.\s]+)/i,
    /Income\s+Tax\s+Return[\s\S]{0,200}Total\s+Income\s*[:\-]?\s*\n?\s*([0-9,\.\s]+)/i
  ]);
}

function extractTaxableIncome(text) {
  return extractAmount(text, [
    /Taxable\s+Income\s*[:\-]?\s*\n?\s*Rs\.?\s*([0-9,\.\s]+)/i,
    /Taxable\s+Income\s*[:\-]?\s*\n?\s*([0-9,\.\s]+)/i,
    /Taxable\s+Amount\s*[:\-]?\s*\n?\s*Rs\.?\s*([0-9,\.\s]+)/i,
    /Taxable\s+Amount\s*[:\-]?\s*\n?\s*([0-9,\.\s]+)/i
  ]);
}

function extractTaxChargeable(text) {
  return extractAmount(text, [
    /Tax\s+Chargeable\s*[:\-]?\s*\n?\s*Rs\.?\s*([0-9,\.\s]+)/i,
    /Tax\s+Charged\s*[:\-]?\s*\n?\s*Rs\.?\s*([0-9,\.\s]+)/i,
    /Tax\s+Chargeable\s*[:\-]?\s*\n?\s*([0-9,\.\s]+)/i,
    /Tax\s+Charged\s*[:\-]?\s*\n?\s*([0-9,\.\s]+)/i,
    /Chargeable\s+Tax\s*[:\-]?\s*\n?\s*([0-9,\.\s]+)/i
  ]);
}

function extractRefundAmount(text) {
  return extractAmount(text, [
    /Refund(?:\s*\(if\s+any\))?\s*(?:Amount)?\s*[:\-]?\s*\n?\s*Rs\.?\s*([0-9,\.\s]+)/i,
    /Refund(?:\s*\(if\s+any\))?\s*(?:Amount)?\s*[:\-]?\s*\n?\s*([0-9,\.\s]+)/i,
    /Payable\s+Refund\s*[:\-]?\s*\n?\s*Rs\.?\s*([0-9,\.\s]+)/i,
    /Refund\s+due\s*[:\-]?\s*\n?\s*Rs\.?\s*([0-9,\.\s]+)/i,
    /Refund\s+due\s*[:\-]?\s*\n?\s*([0-9,\.\s]+)/i
  ]);
}

/**
 * Extract all required data from PDF - Client-side only (no server required)
 * @param {File} file - PDF file object
 * @returns {Promise<Object>} - Object containing name, cnicNtn, and taxYear
 */
export async function extractDataFromPDF(file) {
  try {
    console.log('=== Starting PDF data extraction (client-side) ===');
    console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Validate file is a PDF
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('File is not a PDF');
    }
    
    // Use client-side PDF.js extraction
    console.log('Using client-side PDF.js extraction...');
    const text = await extractTextFromPDF(file);
    console.log('Extracted text length:', text.length);
    
    const name = extractName(text);
    const cnicNtn = extractCNICOrNTN(text);
    const taxYear = extractTaxYear(text);
    const totalIncome = extractTotalIncome(text);
    const taxableIncome = extractTaxableIncome(text);
    const taxChargeable = extractTaxChargeable(text);
    const refundAmount = extractRefundAmount(text);

    return {
      name: name || '',
      cnicNtn: cnicNtn || '',
      taxYear: taxYear || '',
      total_income: totalIncome,
      taxable_income: taxableIncome,
      tax_chargeable: taxChargeable,
      refund_amount: refundAmount,
      extractedText: text.substring(0, 1000),
      success: !!(name && cnicNtn && taxYear)
    };
    
  } catch (error) {
    console.error('Error extracting data from PDF:', error);
    return {
      name: '',
      cnicNtn: '',
      taxYear: '',
      extractedText: '',
      success: false,
      error: error.message
    };
  }
}

/**
 * Sanitize filename to remove invalid characters
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export function sanitizeFilename(filename) {
  // Replace invalid characters with underscore
  let sanitized = filename.replace(/[<>:"/\\|?*]/g, '_');
  
  // Handle special characters like apostrophes
  sanitized = sanitized.replace(/'/g, '');
  
  // Remove multiple consecutive underscores
  sanitized = sanitized.replace(/_+/g, '_');
  
  // Remove leading/trailing underscores and spaces
  sanitized = sanitized.trim().replace(/^_+|_+$/g, '');
  
  // Limit length to 200 characters
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }
  
  return sanitized;
}

/**
 * Validate extracted data
 * @param {Object} data - Extracted data object
 * @returns {Object} - Validation result with errors
 */
export function validateExtractedData(data) {
  const errors = [];
  
  if (!data.name || data.name.length < 2) {
    errors.push('Name is missing or too short (minimum 2 characters)');
  }
  
  if (!data.cnicNtn) {
    errors.push('CNIC/NTN is missing');
  } else {
    // Validate CNIC format (13 digits with optional hyphens)
    const cnicRegex = /^\d{5}-?\d{7}-?\d{1}$/;
    // Validate NTN format (7-8 digits with optional hyphen)
    const ntnRegex = /^\d{7,8}-?\d{0,1}$/;
    // Validate Registration Number format (10-13 digits)
    const regNoRegex = /^\d{10,13}$/;
    
    if (!cnicRegex.test(data.cnicNtn) && !ntnRegex.test(data.cnicNtn) && !regNoRegex.test(data.cnicNtn)) {
      errors.push('CNIC/NTN/Registration Number format is invalid');
    }
  }
  
  if (!data.taxYear) {
    errors.push('Tax Year is missing');
  } else {
    const year = parseInt(data.taxYear);
    const currentYear = new Date().getFullYear();
    if (year < 2000 || year > currentYear + 1) {
      errors.push('Tax Year is out of valid range');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}
