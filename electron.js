const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { fork } = require('child_process');
const { fileURLToPath } = require('url');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
let backendProcess;

function startPdfExtractionServer() {
  const serverPath = path.join(__dirname, 'pdf-extraction-server.js');
  backendProcess = fork(serverPath, [], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  backendProcess.on('error', (error) => {
    console.error('PDF extraction backend failed:', error);
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`PDF extraction backend exited with code=${code} signal=${signal}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'public/favicon.ico'), // Add your app icon
    show: false
  });

  // Load the React app
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173'); // Vite dev server
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startPdfExtractionServer();
  createWindow();
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for file operations
ipcMain.handle('rename-notice-file', async (event, { originalPath, newFileName }) => {
  try {
    let resolvedPath = originalPath;
    if (resolvedPath.startsWith('file://')) {
      resolvedPath = fileURLToPath(resolvedPath);
    }
    resolvedPath = path.normalize(resolvedPath);

    const directory = path.dirname(resolvedPath);
    const newPath = path.join(directory, newFileName);

    // Check if target file already exists
    try {
      await fs.access(newPath);
      throw new Error('A file with this name already exists');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Rename the file
    await fs.rename(resolvedPath, newPath);

    return {
      success: true,
      newPath: newPath,
      message: `File renamed to ${newFileName}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// IPC handler for opening Excel files
ipcMain.handle('open-excel-file', async (event, filePath) => {
  try {
    const { shell } = require('electron');
    
    // Normalize the path
    const normalizedPath = path.normalize(filePath);
    
    // Check if file exists
    try {
      await fs.access(normalizedPath);
    } catch (error) {
      throw new Error(`File not found: ${normalizedPath}`);
    }
    
    // Open the file with the default application (Excel)
    const result = await shell.openPath(normalizedPath);
    
    if (result) {
      // If result is not empty, it means there was an error
      throw new Error(result);
    }
    
    return {
      success: true,
      path: normalizedPath,
      message: 'Excel file opened successfully'
    };
    
  } catch (error) {
    console.error('Error opening Excel file:', error);
    return {
      success: false,
      error: error.message,
      message: `Failed to open Excel file: ${error.message}`
    };
  }
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('get-file-info', async (event, filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      modified: stats.mtime,
      created: stats.birthtime
    };
  } catch (error) {
    return null;
  }
});

ipcMain.handle('create-client-folder-and-move', async (event, { originalPath, newFileName, clientName, basePath }) => {
  try {
    let resolvedPath = originalPath;
    if (resolvedPath.startsWith('file://')) {
      resolvedPath = fileURLToPath(resolvedPath);
    }
    resolvedPath = path.normalize(resolvedPath);

    // Create client folder
    const clientFolderPath = path.join(basePath, clientName);
    await fs.mkdir(clientFolderPath, { recursive: true });

    // New file path in client folder
    const newPath = path.join(clientFolderPath, newFileName);

    // Check if target file already exists
    try {
      await fs.access(newPath);
      throw new Error('A file with this name already exists in the client folder');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Move and rename the file
    await fs.rename(resolvedPath, newPath);

    return {
      success: true,
      newPath: newPath,
      clientFolder: clientFolderPath,
      message: `File moved to ${clientName} folder and renamed to ${newFileName}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('create-client-folder', async (event, { clientName, basePath }) => {
  try {
    if (!basePath) {
      throw new Error('Base path is required');
    }
    const clientFolderPath = path.join(basePath, clientName);
    await fs.mkdir(clientFolderPath, { recursive: true });
    return {
      success: true,
      clientFolder: clientFolderPath,
      message: `Client folder created successfully: ${clientName}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// IPC handler for creating client folder and opening Excel template with default save location
ipcMain.handle('create-client-folder-and-open-excel', async (event, { cnic, clientName, taxYear, templatePath, rootDirectory }) => {
  try {
    const { shell } = require('electron');
    
    console.log('[Electron] Creating client folder and opening Excel template...');
    console.log('[Electron] CNIC:', cnic);
    console.log('[Electron] Client Name:', clientName);
    console.log('[Electron] Tax Year:', taxYear);
    console.log('[Electron] Template Path:', templatePath);
    console.log('[Electron] Root Directory:', rootDirectory);

    // Validate inputs
    if (!cnic || !clientName || !templatePath || !rootDirectory) {
      throw new Error('Missing required parameters: cnic, clientName, templatePath, or rootDirectory');
    }

    // Normalize the root directory
    const normalizedRootDir = path.normalize(rootDirectory);

    // Create folder name: [CNIC] - [Client Name]
    const folderName = `${cnic} - ${clientName}`;
    const clientFolderPath = path.join(normalizedRootDir, folderName);

    console.log('[Electron] Client folder path:', clientFolderPath);

    // Check if folder already exists
    let folderExists = false;
    try {
      await fs.access(clientFolderPath);
      folderExists = true;
      console.log('[Electron] Client folder already exists, reusing it');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Folder doesn't exist, create it
        console.log('[Electron] Creating new client folder...');
        await fs.mkdir(clientFolderPath, { recursive: true });
        console.log('[Electron] Client folder created successfully');
      } else {
        throw error;
      }
    }

    // Normalize template path
    const normalizedTemplatePath = path.normalize(templatePath);

    // Check if template exists
    try {
      await fs.access(normalizedTemplatePath);
      console.log('[Electron] Template file found');
    } catch (error) {
      throw new Error(`Template file not found: ${normalizedTemplatePath}`);
    }

    // Create a copy of the template in the client folder with a meaningful name
    const fileName = `Tax Return ${taxYear} - ${clientName}.xlsm`;
    const destinationPath = path.join(clientFolderPath, fileName);

    console.log('[Electron] Copying template to:', destinationPath);

    // Check if file already exists
    let fileExists = false;
    try {
      await fs.access(destinationPath);
      fileExists = true;
      console.log('[Electron] File already exists, will open existing file');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, copy template
        console.log('[Electron] Copying template file...');
        await fs.copyFile(normalizedTemplatePath, destinationPath);
        console.log('[Electron] Template copied successfully');
      } else {
        throw error;
      }
    }

    // Open the Excel file
    console.log('[Electron] Opening Excel file...');
    const result = await shell.openPath(destinationPath);

    if (result) {
      // If result is not empty, it means there was an error
      throw new Error(`Failed to open Excel: ${result}`);
    }

    console.log('[Electron] Excel file opened successfully');

    return {
      success: true,
      clientFolder: clientFolderPath,
      excelFilePath: destinationPath,
      folderExists: folderExists,
      fileExists: fileExists,
      message: folderExists 
        ? `Opened existing client folder and Excel file for ${clientName}` 
        : `Created new client folder and opened Excel template for ${clientName}`
    };

  } catch (error) {
    console.error('[Electron] Error in create-client-folder-and-open-excel:', error);
    return {
      success: false,
      error: error.message,
      message: `Failed to create folder and open Excel: ${error.message}`
    };
  }
});

// IPC handler to get default client root directory
ipcMain.handle('get-default-client-root', async () => {
  try {
    // Default root directory for client folders
    const defaultRoot = 'D:\\Tax Automation Clients';
    
    // Check if directory exists, if not create it
    try {
      await fs.access(defaultRoot);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('[Electron] Creating default client root directory:', defaultRoot);
        await fs.mkdir(defaultRoot, { recursive: true });
      }
    }

    return {
      success: true,
      rootDirectory: defaultRoot
    };
  } catch (error) {
    console.error('[Electron] Error getting default client root:', error);
    return {
      success: false,
      error: error.message,
      rootDirectory: null
    };
  }
});

// IPC handler to select custom client root directory
ipcMain.handle('select-client-root-directory', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Client Root Directory',
      buttonLabel: 'Select Folder'
    });

    if (result.canceled) {
      return {
        success: false,
        canceled: true,
        rootDirectory: null
      };
    }

    return {
      success: true,
      canceled: false,
      rootDirectory: result.filePaths[0]
    };
  } catch (error) {
    console.error('[Electron] Error selecting client root directory:', error);
    return {
      success: false,
      error: error.message,
      rootDirectory: null
    };
  }
});