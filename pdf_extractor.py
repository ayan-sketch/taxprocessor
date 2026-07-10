"""
PDF Data Extraction using pdfplumber
Extracts Name, Registration No, and Tax Year from Pakistani tax returns
"""

import pdfplumber
import re
import sys
import json
from pathlib import Path


def extract_name(text):
    """Extract name from PDF text"""
    patterns = [
        r'Name\s*:?\s*([A-Z][A-Za-z\s]{2,50}?)\s*(?:Registration|Address|CNIC|NTN|Tax Year)',
        r'Name\s*:\s*([A-Z\s]+?)\s+Registration',
        r'Name\s*:\s*([A-Z][A-Z\s]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            # Clean up
            name = re.sub(r'\s+', ' ', name)
            name = re.sub(r'[,;:.]+$', '', name)
            name = re.sub(r'\s*(Address|Registration|Contact|NEAR|Village|CNIC|NTN|Tax|Year|No).*$', '', name, flags=re.IGNORECASE)
            name = name.strip()
            
            # Convert to title case if all caps
            if name.isupper() and len(name) > 3:
                name = name.title()
            
            # Validate
            if 3 <= len(name) <= 50 and re.match(r'^[A-Za-z\s]+$', name):
                return name
    
    return None


def extract_cnic_ntn(text):
    """Extract CNIC or NTN/Registration Number"""
    patterns = [
        r'Registration\s+No\s*:?\s*(\d{10,13})',
        r'Registration\s+No[:\s]*(\d{10,13})',
        r'NTN\s*:?\s*(\d{7,13})',
        r'CNIC\s*:?\s*(\d{5}[-\s]?\d{7}[-\s]?\d{1})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            number = match.group(1).replace(' ', '')
            if 7 <= len(number) <= 13:
                return number
    
    return None


def extract_tax_year(text):
    """Extract tax year"""
    patterns = [
        r'Tax\s+Year\s*:?\s*(\d{4})',
        r'(?:Assessment|Income)\s+Year\s*:?\s*(\d{4})',
        r'(?:FY|F\.Y\.)\s*:?\s*(\d{4})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            year = int(match.group(1))
            if 2000 <= year <= 2027:
                return str(year)
    
    # Fallback: find any 4-digit year
    years = re.findall(r'\b(20\d{2})\b', text[:1000])
    if years:
        valid_years = [int(y) for y in years if 2000 <= int(y) <= 2027]
        if valid_years:
            return str(max(valid_years))
    
    return None


def extract_data_from_pdf(pdf_path):
    """Extract all data from PDF file"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            # Extract text from all pages
            full_text = ''
            for page in pdf.pages:
                full_text += page.extract_text() + '\n'
            
            # Extract fields
            name = extract_name(full_text)
            cnic_ntn = extract_cnic_ntn(full_text)
            tax_year = extract_tax_year(full_text)
            
            return {
                'success': bool(name and cnic_ntn and tax_year),
                'name': name or '',
                'cnicNtn': cnic_ntn or '',
                'taxYear': tax_year or '',
                'extractedText': full_text[:1000]  # First 1000 chars for debugging
            }
    
    except Exception as e:
        return {
            'success': False,
            'name': '',
            'cnicNtn': '',
            'taxYear': '',
            'error': str(e)
        }


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No PDF path provided'}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not Path(pdf_path).exists():
        print(json.dumps({'error': 'PDF file not found'}))
        sys.exit(1)
    
    result = extract_data_from_pdf(pdf_path)
    print(json.dumps(result, ensure_ascii=False))
