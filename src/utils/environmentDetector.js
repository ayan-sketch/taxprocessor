/**
 * Environment Detector Utility
 * Detects if the app is running in Electron or browser environment
 */

/**
 * Check if running in Electron environment
 * @returns {boolean} True if running in Electron
 */
export const isElectronEnvironment = () => {
  // Check for Electron-specific APIs
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for electronAPI exposed by preload script
  if (window.electronAPI && typeof window.electronAPI === 'object') {
    return true;
  }

  // Check for Electron user agent
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('electron')) {
    return true;
  }

  // Check for process.versions.electron (if available)
  if (window.process && window.process.versions && window.process.versions.electron) {
    return true;
  }

  return false;
};

/**
 * Check if specific Electron feature is available
 * @param {string} feature - Feature name (e.g., 'openExcelFile', 'selectDirectory')
 * @returns {boolean} True if feature is available
 */
export const isElectronFeatureAvailable = (feature) => {
  if (!isElectronEnvironment()) {
    return false;
  }

  if (!window.electronAPI) {
    return false;
  }

  return typeof window.electronAPI[feature] === 'function';
};

/**
 * Get environment information
 * @returns {Object} Environment details
 */
export const getEnvironmentInfo = () => {
  const isElectron = isElectronEnvironment();
  
  return {
    isElectron,
    isBrowser: !isElectron,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    url: window.location.href,
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    electronVersion: window.process?.versions?.electron || null,
    nodeVersion: window.process?.versions?.node || null,
    chromeVersion: window.process?.versions?.chrome || null,
    availableFeatures: isElectron ? getAvailableElectronFeatures() : []
  };
};

/**
 * Get list of available Electron features
 * @returns {Array<string>} List of available feature names
 */
const getAvailableElectronFeatures = () => {
  if (!window.electronAPI) {
    return [];
  }

  const features = [];
  const knownFeatures = [
    'openExcelFile',
    'selectDirectory',
    'renameNoticeFile',
    'createClientFolder',
    'createClientFolderAndMove',
    'getFileInfo'
  ];

  knownFeatures.forEach(feature => {
    if (typeof window.electronAPI[feature] === 'function') {
      features.push(feature);
    }
  });

  return features;
};

/**
 * Show environment warning if not in Electron
 * @returns {Object|null} Warning object or null if in Electron
 */
export const getEnvironmentWarning = () => {
  if (isElectronEnvironment()) {
    return null;
  }

  return {
    type: 'warning',
    title: 'Browser Mode Detected',
    message: 'You are running the app in browser mode. Some features like Excel integration and file operations will not work.',
    action: 'Please use start-electron-only.bat to launch the desktop app.',
    features: [
      'Excel file opening',
      'Client folder creation',
      'File system operations',
      'Notice file organization'
    ]
  };
};

/**
 * Require Electron environment or throw error
 * @param {string} featureName - Name of the feature requiring Electron
 * @throws {Error} If not in Electron environment
 */
export const requireElectron = (featureName = 'This feature') => {
  if (!isElectronEnvironment()) {
    throw new Error(
      `${featureName} requires Electron environment.\n\n` +
      `Please close this browser window and use the Electron desktop app.\n` +
      `Run: start-electron-only.bat`
    );
  }
};

/**
 * Require specific Electron feature or throw error
 * @param {string} feature - Feature name
 * @param {string} featureName - Human-readable feature name
 * @throws {Error} If feature is not available
 */
export const requireElectronFeature = (feature, featureName) => {
  requireElectron(featureName);

  if (!isElectronFeatureAvailable(feature)) {
    throw new Error(
      `${featureName} is not available.\n\n` +
      `The Electron API '${feature}' is not exposed.\n` +
      `Please restart the app using: start-electron-only.bat`
    );
  }
};

export default {
  isElectronEnvironment,
  isElectronFeatureAvailable,
  getEnvironmentInfo,
  getEnvironmentWarning,
  requireElectron,
  requireElectronFeature
};
