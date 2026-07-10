// Document Management Helper Functions

export const validateFileType = (file) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file, maxSizeMB = 10) => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const generateFileName = (client, category, originalName) => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  const cleanName = client.name.replace(/[^a-zA-Z0-9]/g, '-');
  const cleanCategory = category.replace(/[^a-zA-Z0-9]/g, '-');
  return `${cleanName}-${cleanCategory}-${timestamp}.${extension}`;
};

export const calculateDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getExpiryStatus = (daysUntilExpiry) => {
  if (daysUntilExpiry === null) return { status: 'none', color: 'gray', label: 'No Expiry' };
  if (daysUntilExpiry < 0) return { status: 'expired', color: 'red', label: 'Expired' };
  if (daysUntilExpiry === 0) return { status: 'today', color: 'red', label: 'Expires Today' };
  if (daysUntilExpiry <= 7) return { status: 'critical', color: 'red', label: 'Expires Soon' };
  if (daysUntilExpiry <= 30) return { status: 'warning', color: 'yellow', label: 'Expiring' };
  return { status: 'valid', color: 'green', label: 'Valid' };
};

export const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  const iconMap = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    xls: '📊',
    xlsx: '📊',
    zip: '📦',
    default: '📎'
  };
  return iconMap[extension] || iconMap.default;
};

export const categorizeDocument = (fileName) => {
  const name = fileName.toLowerCase();
  if (name.includes('tax') || name.includes('return')) return 'Tax Returns';
  if (name.includes('notice')) return 'Notices';
  if (name.includes('financial') || name.includes('statement')) return 'Financial Statements';
  if (name.includes('id') || name.includes('cnic') || name.includes('passport')) return 'ID Proofs';
  if (name.includes('contract') || name.includes('agreement')) return 'Contracts';
  return 'Other';
};

export const sortDocuments = (documents, sortBy, sortOrder = 'asc') => {
  return [...documents].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'uploadDate' || sortBy === 'expiryDate') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    if (sortBy === 'size') {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

export const filterDocumentsByCategory = (documents, category) => {
  if (category === 'All' || !category) return documents;
  return documents.filter(doc => doc.category === category);
};

export const searchDocuments = (documents, query) => {
  if (!query) return documents;
  const lowerQuery = query.toLowerCase();
  return documents.filter(doc => 
    doc.name.toLowerCase().includes(lowerQuery) ||
    doc.category.toLowerCase().includes(lowerQuery) ||
    (doc.notes && doc.notes.toLowerCase().includes(lowerQuery)) ||
    (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
  );
};

// Storage functions for document management
export const saveDocumentsToStorage = (clientId, documents) => {
  try {
    const allDocs = JSON.parse(localStorage.getItem('clientDocuments') || '{}');
    allDocs[clientId] = documents;
    localStorage.setItem('clientDocuments', JSON.stringify(allDocs));
    return true;
  } catch (error) {
    console.error('Error saving documents:', error);
    return false;
  }
};

export const loadDocumentsFromStorage = (clientId) => {
  try {
    const allDocs = JSON.parse(localStorage.getItem('clientDocuments') || '{}');
    return allDocs[clientId] || [];
  } catch (error) {
    console.error('Error loading documents:', error);
    return [];
  }
};

export const getAllDocuments = () => {
  try {
    return JSON.parse(localStorage.getItem('clientDocuments') || '{}');
  } catch (error) {
    console.error('Error loading all documents:', error);
    return {};
  }
};

export const deleteDocumentFromStorage = (clientId, documentId) => {
  try {
    const allDocs = JSON.parse(localStorage.getItem('clientDocuments') || '{}');
    if (allDocs[clientId]) {
      allDocs[clientId] = allDocs[clientId].filter(doc => doc.id !== documentId);
      localStorage.setItem('clientDocuments', JSON.stringify(allDocs));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
};

// Get expiring documents across all clients
export const getExpiringDocuments = (daysThreshold = 30) => {
  try {
    const allDocs = getAllDocuments();
    const expiringDocs = [];
    
    Object.entries(allDocs).forEach(([clientId, documents]) => {
      documents.forEach(doc => {
        if (doc.expiryDate) {
          const daysUntil = calculateDaysUntilExpiry(doc.expiryDate);
          if (daysUntil !== null && daysUntil <= daysThreshold) {
            expiringDocs.push({
              ...doc,
              clientId,
              daysUntilExpiry: daysUntil
            });
          }
        }
      });
    });
    
    return expiringDocs.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  } catch (error) {
    console.error('Error getting expiring documents:', error);
    return [];
  }
};

// Convert file to base64 for storage
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Create document object
export const createDocumentObject = async (file, category, clientId, notes = '', expiryDate = null, tags = []) => {
  try {
    const base64Data = await fileToBase64(file);
    
    return {
      id: Date.now(),
      name: file.name,
      originalName: file.name,
      category,
      clientId,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      type: file.type,
      uploadDate: new Date().toISOString(),
      uploadedBy: 'Admin User',
      notes,
      expiryDate,
      tags,
      data: base64Data,
      icon: getFileIcon(file.name)
    };
  } catch (error) {
    console.error('Error creating document object:', error);
    throw error;
  }
};

// Get document statistics for a client
export const getDocumentStats = (clientId) => {
  const documents = loadDocumentsFromStorage(clientId);
  
  const stats = {
    total: documents.length,
    byCategory: {},
    totalSize: 0,
    expiring: 0,
    expired: 0
  };
  
  documents.forEach(doc => {
    // Count by category
    stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1;
    
    // Total size
    stats.totalSize += doc.size || 0;
    
    // Expiry status
    if (doc.expiryDate) {
      const daysUntil = calculateDaysUntilExpiry(doc.expiryDate);
      if (daysUntil !== null) {
        if (daysUntil < 0) stats.expired++;
        else if (daysUntil <= 30) stats.expiring++;
      }
    }
  });
  
  stats.totalSizeFormatted = formatFileSize(stats.totalSize);
  
  return stats;
};
