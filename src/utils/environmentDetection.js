/**
 * Environment Detection Utility
 * Detects whether the app is running in Electron or browser
 */

/**
 * Check if running in Electron environment
 * @returns {boolean} True if running in Electron
 */
export const isElectron = () => {
  // Check if window.electronAPI is available (injected by preload.js)
  if (typeof window !== 'undefined' && window.electronAPI) {
    return true;
  }

  // Additional checks for Electron environment
  if (typeof window !== 'undefined') {
    // Check for electron in user agent
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('electron') > -1) {
      return true;
    }

    // Check for process.versions.electron
    if (window.process && window.process.versions && window.process.versions.electron) {
      return true;
    }
  }

  return false;
};

/**
 * Check if specific Electron API is available
 * @param {string} apiName - Name of the API to check
 * @returns {boolean} True if API is available
 */
export const hasElectronAPI = (apiName) => {
  if (!isElectron()) {
    return false;
  }

  if (typeof window !== 'undefined' && window.electronAPI) {
    return typeof window.electronAPI[apiName] === 'function';
  }

  return false;
};

/**
 * Get environment type
 * @returns {string} 'electron' or 'browser'
 */
export const getEnvironment = () => {
  return isElectron() ? 'electron' : 'browser';
};

/**
 * Check if all required Electron APIs are available
 * @returns {Object} Object with availability status for each API
 */
export const checkElectronAPIs = () => {
  const apis = {
    createClientFolderAndOpenExcel: false,
    getDefaultClientRoot: false,
    selectClientRootDirectory: false,
    openExcelFile: false,
    createClientFolder: false,
    selectDirectory: false,
    renameNoticeFile: false,
    createClientFolderAndMove: false,
    getFileInfo: false
  };

  if (!isElectron() || !window.electronAPI) {
    return {
      isElectron: false,
      apis
    };
  }

  // Check each API
  Object.keys(apis).forEach(apiName => {
    apis[apiName] = typeof window.electronAPI[apiName] === 'function';
  });

  return {
    isElectron: true,
    apis
  };
};

/**
 * Get user-friendly error message for missing Electron environment
 * @returns {string} Error message
 */
export const getElectronRequiredMessage = () => {
  return '⚠️ This feature requires the Electron desktop application. Please close the browser and run start-electron.bat to launch the desktop app.';
};

/**
 * Log environment information to console
 */
export const logEnvironmentInfo = () => {
  console.log('=== Environment Information ===');
  console.log('Environment:', getEnvironment());
  console.log('Is Electron:', isElectron());
  
  if (isElectron()) {
    const apiStatus = checkElectronAPIs();
    console.log('Electron APIs:', apiStatus.apis);
  } else {
    console.log('Running in browser mode - Electron features not available');
  }
  console.log('==============================');
};

export default {
  isElectron,
  hasElectronAPI,
  getEnvironment,
  checkElectronAPIs,
  getElectronRequiredMessage,
  logEnvironmentInfo
};
