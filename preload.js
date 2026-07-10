const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  renameNoticeFile: (originalPath, newFileName) =>
    ipcRenderer.invoke('rename-notice-file', { originalPath, newFileName }),

  createClientFolderAndMove: (originalPath, newFileName, clientName, basePath) =>
    ipcRenderer.invoke('create-client-folder-and-move', { originalPath, newFileName, clientName, basePath }),

  createClientFolder: (clientName, basePath) =>
    ipcRenderer.invoke('create-client-folder', { clientName, basePath }),

  selectDirectory: () => ipcRenderer.invoke('select-directory'),

  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),

  openExcelFile: (filePath) => ipcRenderer.invoke('open-excel-file', filePath),

  // New methods for automatic client folder creation and Excel opening
  createClientFolderAndOpenExcel: (cnic, clientName, taxYear, templatePath, rootDirectory) =>
    ipcRenderer.invoke('create-client-folder-and-open-excel', { cnic, clientName, taxYear, templatePath, rootDirectory }),

  getDefaultClientRoot: () => ipcRenderer.invoke('get-default-client-root'),

  selectClientRootDirectory: () => ipcRenderer.invoke('select-client-root-directory'),

  // Platform info
  platform: process.platform,

  // Version info
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});