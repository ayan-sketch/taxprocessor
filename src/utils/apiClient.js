/**
 * API Client for Tax Automation Backend
 * Note: Backend has been removed. This file is kept for reference only.
 * All data operations now use local JSON files.
 */

const API_BASE_URL = 'http://localhost:5173/api';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Make HTTP request to API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return this.request('/health');
  }

  /**
   * Get API configuration
   */
  async getConfig() {
    return this.request('/config');
  }

  /**
   * Scan folder for PDF files
   */
  async scanFolder(folderPath = null) {
    return this.request('/scan-folder', {
      method: 'POST',
      body: JSON.stringify({ folderPath }),
    });
  }

  /**
   * Process a single PDF file
   */
  async processSinglePDF(pdfPath) {
    return this.request('/process-single', {
      method: 'POST',
      body: JSON.stringify({ pdfPath }),
    });
  }

  /**
   * Process multiple PDF files (batch)
   */
  async processBatch(folderPath = null) {
    return this.request('/process-batch', {
      method: 'POST',
      body: JSON.stringify({ folderPath }),
    });
  }

  /**
   * Get current processing status
   */
  async getProcessingStatus() {
    return this.request('/processing-status');
  }

  /**
   * Get all processed tax returns
   */
  async getReturns() {
    return this.request('/returns');
  }

  /**
   * Download a PDF file
   */
  async downloadPDF(returnId) {
    const url = `${this.baseURL}/download-pdf/${returnId}`;
    window.open(url, '_blank');
  }

  /**
   * Get PDF view URL
   */
  getPDFViewURL(returnId) {
    return `${this.baseURL}/view-pdf/${returnId}`;
  }

  /**
   * Select folder using native dialog
   */
  async selectFolder() {
    return this.request('/select-folder', {
      method: 'POST',
    });
  }

  /**
   * Share PDF via email or WhatsApp
   */
  async sharePDF(shareData) {
    return this.request('/share-pdf', {
      method: 'POST',
      body: JSON.stringify(shareData),
    });
  }

  /**
   * Bulk download multiple PDFs as ZIP
   */
  async bulkDownloadPDFs(returnIds) {
    const url = `${this.baseURL}/bulk-download`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ returns: returnIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to download files');
    }

    // Get the blob and trigger download
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `tax_returns_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  }

  /**
   * Update a tax return
   */
  async updateReturn(returnId, updateData) {
    return this.request(`/update-return/${returnId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Check for duplicate returns
   */
  async checkDuplicates(checkData) {
    return this.request('/check-duplicates', {
      method: 'POST',
      body: JSON.stringify(checkData),
    });
  }

  /**
   * Delete a single return
   */
  async deleteReturn(returnId) {
    return this.request(`/delete-return/${returnId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Bulk delete returns
   */
  async bulkDeleteReturns(returnIds) {
    return this.request('/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ returns: returnIds }),
    });
  }

  /**
   * Link a return to a client
   */
  async linkClient(returnId, clientId) {
    return this.request('/link-client', {
      method: 'POST',
      body: JSON.stringify({ return_id: returnId, client_id: clientId }),
    });
  }

  /**
   * Get all returns for a specific client
   */
  async getClientReturns(clientId) {
    return this.request(`/client-returns/${clientId}`);
  }
}

// Create singleton instance
const apiClient = new APIClient();

export default apiClient;

// Export individual methods for convenience
export const {
  healthCheck,
  getConfig,
  scanFolder,
  processSinglePDF,
  processBatch,
  getProcessingStatus,
  getReturns,
  downloadPDF,
  getPDFViewURL,
  selectFolder,
  sharePDF,
  bulkDownloadPDFs,
  updateReturn,
  checkDuplicates,
  deleteReturn,
  bulkDeleteReturns,
  linkClient,
  getClientReturns,
} = apiClient;
