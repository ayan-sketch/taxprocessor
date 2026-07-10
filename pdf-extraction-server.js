/**
 * Simple Express server to handle PDF extraction using Python pdfplumber
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'temp_uploads/' });
const noticeRoutes = require('./api/noticeRoutes');

app.use(cors());
app.use(express.json());
app.use('/', noticeRoutes);

// Ensure directories exist
if (!fs.existsSync('temp_uploads')) {
  fs.mkdirSync('temp_uploads');
}
if (!fs.existsSync('Tax Returns/Incoming')) {
  fs.mkdirSync('Tax Returns/Incoming', { recursive: true });
}
if (!fs.existsSync('Tax Returns/Processed/completed')) {
  fs.mkdirSync('Tax Returns/Processed/completed', { recursive: true });
}

// Extract data from PDF using Python pdfplumber
app.post('/api/extract-pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }

  const pdfPath = req.file.path;
  const pythonPath = 'C:/Users/fgsdfg/AppData/Local/Programs/Python/Python311/python.exe';
  const scriptPath = path.join(__dirname, 'pdf_extractor.py');

  try {
    const python = spawn(pythonPath, [scriptPath, pdfPath]);
    
    let dataString = '';
    let errorString = '';

    python.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        // Clean up temp file
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }
        console.error('Python error:', errorString);
        return res.status(500).json({ error: 'PDF extraction failed', details: errorString });
      }

      try {
        const result = JSON.parse(dataString);
        
        // Get extracted data for renaming
        const clientName = result.clientName || 'Unknown';
        const cnicNtn = result.cnic || result.ntn || 'NoID';
        const taxYear = result.taxYear || 'NoYear';
        
        // Clean names for filename (remove special characters)
        const cleanName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanCnicNtn = cnicNtn.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanTaxYear = taxYear.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Create new filename: name-cnic/ntn-taxyear.pdf
        const newFileName = `${cleanName}-${cleanCnicNtn}-${cleanTaxYear}.pdf`;
        const originalFileName = req.file.originalname;
        
        console.log('Renaming:', originalFileName, '->', newFileName);
        
        // Copy original file to Incoming folder
        const incomingPath = path.join(__dirname, 'Tax Returns', 'Incoming', originalFileName);
        fs.copyFileSync(req.file.path, incomingPath);
        console.log('Copied to Incoming:', incomingPath);
        
        // Rename and move to completed folder
        const completedPath = path.join(__dirname, 'Tax Returns', 'Processed', 'completed', newFileName);
        fs.renameSync(incomingPath, completedPath);
        console.log('Moved to Completed:', completedPath);
        
        // Clean up temp file
        fs.unlinkSync(pdfPath);
        
        // Add file paths to result
        result.originalFileName = originalFileName;
        result.renamedFileName = newFileName;
        result.filePath = completedPath;
        
        res.json(result);
      } catch (e) {
        // Clean up temp file
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }
        console.error('Error processing file:', e);
        res.status(500).json({ error: 'Failed to process file', details: e.message });
      }
    });

  } catch (error) {
    // Clean up temp file
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`PDF Extraction Server running on http://localhost:${PORT}`);
});
