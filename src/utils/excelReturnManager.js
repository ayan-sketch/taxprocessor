/**
 * Excel Return Manager
 * Handles Excel-based tax return workflow including file management and folder creation
 */

import { selectWorkbookForClient, getWorkbookRecommendation } from './excelOpener';
import { getWorkbookPath } from './excelConfig';

/**
 * Generate folder name for tax return
 * @param {string} clientName - Client name
 * @param {string} cnic - Client CNIC/NTN
 * @param {string} taxYear - Tax year
 * @returns {string} Folder name
 */
export const generateReturnFolderName = (clientName, cnic, taxYear) => {
  // Sanitize client name (remove special characters)
  const sanitizedName = clientName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  
  // Sanitize CNIC (remove dashes)
  const sanitizedCnic = cnic.replace(/-/g, '');
  
  return `${sanitizedName}-${sanitizedCnic}-${taxYear}`;
};

/**
 * Generate return file name
 * @param {string} clientName - Client name
 * @param {string} taxYear - Tax year
 * @returns {string} File name
 */
export const generateReturnFileName = (clientName, taxYear) => {
  const sanitizedName = clientName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  
  return `Return-${sanitizedName}-${taxYear}.xlsm`;
};

/**
 * Open Excel workbook for new return
 * @param {Object} returnData - Return data object
 * @returns {Promise<Object>} Result object
 */
export const openExcelForNewReturn = async (returnData) => {
  try {
    const { clientName, cnic, taxYear, clientData } = returnData;
    
    // Check if running in Electron
    if (typeof window === 'undefined' || !window.require) {
      throw new Error('This feature requires Electron environment');
    }

    const { shell } = window.require('electron');
    const path = window.require('path');
    const fs = window.require('fs').promises;
    
    // Determine workbook type
    const workbookType = clientData 
      ? selectWorkbookForClient(clientData)
      : 'INDIVIDUAL_SIMPLE';
    
    // Get template path
    const templatePath = getWorkbookPath(workbookType);
    
    // Generate folder and file names
    const folderName = generateReturnFolderName(clientName, cnic, taxYear);
    const fileName = generateReturnFileName(clientName, taxYear);
    
    // Create return folder path
    const basePath = path.join(
      process.cwd(),
      'processed_returns',
      folderName
    );
    
    // Create folder if it doesn't exist
    await fs.mkdir(basePath, { recursive: true });
    
    // Destination file path
    const destPath = path.join(basePath, fileName);
    
    // Check if file already exists
    try {
      await fs.access(destPath);
      // File exists, ask user if they want to overwrite or open existing
      const overwrite = confirm(
        `A return file already exists for ${clientName} (${taxYear}).\n\nDo you want to open the existing file?\n\nClick OK to open existing, Cancel to create a new version.`
      );
      
      if (overwrite) {
        // Open existing file
        const result = await shell.openPath(destPath);
        if (result) {
          throw new Error(result);
        }
        
        return {
          success: true,
          path: destPath,
          folderPath: basePath,
          fileName,
          folderName,
          workbookType,
          isExisting: true,
          message: `Opened existing return for ${clientName}`
        };
      } else {
        // Create new version with timestamp
        const timestamp = new Date().getTime();
        const versionedFileName = `Return-${clientName.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-')}-${taxYear}-${timestamp}.xlsm`;
        const versionedDestPath = path.join(basePath, versionedFileName);
        
        // Copy template to new location
        await fs.copyFile(templatePath, versionedDestPath);
        
        // Open the new file
        const result = await shell.openPath(versionedDestPath);
        if (result) {
          throw new Error(result);
        }
        
        return {
          success: true,
          path: versionedDestPath,
          folderPath: basePath,
          fileName: versionedFileName,
          folderName,
          workbookType,
          isExisting: false,
          message: `Created new return version for ${clientName}`
        };
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      
      // File doesn't exist, create new one
      // Copy template to destination
      await fs.copyFile(templatePath, destPath);
      
      console.log(`Created return file: ${destPath}`);
      
      // Open the file
      const result = await shell.openPath(destPath);
      
      if (result) {
        throw new Error(result);
      }
      
      return {
        success: true,
        path: destPath,
        folderPath: basePath,
        fileName,
        folderName,
        workbookType,
        isExisting: false,
        message: `Successfully created and opened return for ${clientName}`
      };
    }
    
  } catch (error) {
    console.error('Error opening Excel for new return:', error);
    return {
      success: false,
      error: error.message,
      message: `Failed to open Excel: ${error.message}`
    };
  }
};

/**
 * Open existing return file
 * @param {string} filePath - Path to return file
 * @returns {Promise<Object>} Result object
 */
export const openExistingReturn = async (filePath) => {
  try {
    if (typeof window === 'undefined' || !window.require) {
      throw new Error('This feature requires Electron environment');
    }

    const { shell } = window.require('electron');
    const path = window.require('path');
    const fs = window.require('fs').promises;
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error('Return file not found. It may have been moved or deleted.');
    }
    
    // Open the file
    const result = await shell.openPath(filePath);
    
    if (result) {
      throw new Error(result);
    }
    
    return {
      success: true,
      path: filePath,
      message: 'Successfully opened return file'
    };
    
  } catch (error) {
    console.error('Error opening existing return:', error);
    return {
      success: false,
      error: error.message,
      message: `Failed to open return: ${error.message}`
    };
  }
};

/**
 * Get return folder path
 * @param {string} clientName - Client name
 * @param {string} cnic - Client CNIC/NTN
 * @param {string} taxYear - Tax year
 * @returns {string} Folder path
 */
export const getReturnFolderPath = (clientName, cnic, taxYear) => {
  if (typeof window === 'undefined' || !window.require) {
    return null;
  }
  
  const path = window.require('path');
  const folderName = generateReturnFolderName(clientName, cnic, taxYear);
  
  return path.join(
    process.cwd(),
    'processed_returns',
    folderName
  );
};

/**
 * Check if return exists
 * @param {string} clientName - Client name
 * @param {string} cnic - Client CNIC/NTN
 * @param {string} taxYear - Tax year
 * @returns {Promise<Object>} Existence check result
 */
export const checkReturnExists = async (clientName, cnic, taxYear) => {
  try {
    if (typeof window === 'undefined' || !window.require) {
      return { exists: false };
    }

    const path = window.require('path');
    const fs = window.require('fs').promises;
    
    const folderPath = getReturnFolderPath(clientName, cnic, taxYear);
    
    try {
      const files = await fs.readdir(folderPath);
      const excelFiles = files.filter(f => f.endsWith('.xlsm') || f.endsWith('.xlsx'));
      
      if (excelFiles.length > 0) {
        return {
          exists: true,
          folderPath,
          files: excelFiles,
          count: excelFiles.length
        };
      }
      
      return { exists: false };
    } catch (error) {
      return { exists: false };
    }
    
  } catch (error) {
    console.error('Error checking return existence:', error);
    return { exists: false, error: error.message };
  }
};

/**
 * List all returns for a client
 * @param {string} clientName - Client name
 * @param {string} cnic - Client CNIC/NTN
 * @returns {Promise<Array>} List of returns
 */
export const listClientReturns = async (clientName, cnic) => {
  try {
    if (typeof window === 'undefined' || !window.require) {
      return [];
    }

    const path = window.require('path');
    const fs = window.require('fs').promises;
    
    const basePath = path.join(process.cwd(), 'processed_returns');
    const sanitizedName = clientName.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-');
    const sanitizedCnic = cnic.replace(/-/g, '');
    
    // List all folders that match the pattern
    const folders = await fs.readdir(basePath);
    const matchingFolders = folders.filter(f => 
      f.startsWith(`${sanitizedName}-${sanitizedCnic}-`)
    );
    
    const returns = [];
    
    for (const folder of matchingFolders) {
      const folderPath = path.join(basePath, folder);
      const files = await fs.readdir(folderPath);
      const excelFiles = files.filter(f => f.endsWith('.xlsm') || f.endsWith('.xlsx'));
      
      // Extract tax year from folder name
      const taxYear = folder.split('-').pop();
      
      for (const file of excelFiles) {
        const filePath = path.join(folderPath, file);
        const stats = await fs.stat(filePath);
        
        returns.push({
          taxYear,
          fileName: file,
          filePath,
          folderPath,
          folderName: folder,
          modifiedDate: stats.mtime,
          createdDate: stats.birthtime,
          size: stats.size
        });
      }
    }
    
    return returns;
    
  } catch (error) {
    console.error('Error listing client returns:', error);
    return [];
  }
};

export default {
  generateReturnFolderName,
  generateReturnFileName,
  openExcelForNewReturn,
  openExistingReturn,
  getReturnFolderPath,
  checkReturnExists,
  listClientReturns
};
