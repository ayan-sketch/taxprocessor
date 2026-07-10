import * as pdfjsLib from 'pdfjs-dist';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

async function extractTextFromPDF(pdfPath) {
  try {
    const data = new Uint8Array(readFileSync(pdfPath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
        .replace(/\s+/g, ' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

const pdfPath = join(__dirname, 'return format', '114(1) (Return of Income filed voluntarily for complete year)_2025.pdf');
console.log('Extracting text from:', pdfPath);

extractTextFromPDF(pdfPath).then(text => {
  if (text) {
    console.log('\n=== EXTRACTED TEXT (First 2000 chars) ===\n');
    console.log(text.substring(0, 2000));
    console.log('\n=== END ===\n');
    
    // Save to file
    writeFileSync('extracted-text.txt', text);
    console.log('Full text saved to extracted-text.txt');
  }
});
