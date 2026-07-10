/**
 * Client Data Migration Utility
 * Maps existing client data to the template Excel format
 * Template fields from "Client Data" sheet:
 * FILE NO, NEW NTN, TITLE OF THE CASE, NIC NO (CNIC), PIN (IRIS), PASSWORD (IRIS),
 * MAIL, PASSWORD (MAIL), PHONE, ADDRESS, CITY, PERSON, SOURCE OF INCOME,
 * BUSINESS CLASSIFICATION, STATUS, TAX YEAR
 */

/**
 * Template field mapping
 */
export const TEMPLATE_FIELDS = {
  fileNo: 'FILE NO',
  ntn: 'NEW NTN',
  name: 'TITLE OF THE CASE *',
  cnic: 'NIC NO (CNIC)',
  irisPin: 'PIN (IRIS)',
  irisPassword: 'PASSWORD (IRIS)',
  email: 'MAIL',
  emailPassword: 'PASSWORD (MAIL)',
  phone: 'PHONE',
  address: 'ADDRESS',
  city: 'CITY',
  person: 'PERSON',
  sourceOfIncome: 'SOURCE OF INCOME',
  businessClassification: 'BUSINESS CLASSIFICATION',
  status: 'STATUS',
  taxYear: 'TAX YEAR'
};

/**
 * Standard client data structure matching the template
 */
export const createStandardClientObject = (data = {}) => {
  return {
    id: data.id || Date.now(),
    fileNo: data.fileNo || '',
    ntn: data.ntn || '',
    name: data.name || '',
    cnic: data.cnic || '',
    irisPin: data.irisPin || '',
    irisPassword: data.irisPassword || '',
    email: data.email || '',
    emailPassword: data.emailPassword || '',
    phone: data.phone || '',
    address: data.address || '',
    city: data.city || '',
    person: data.person || 'Individual',
    sourceOfIncome: data.sourceOfIncome || '',
    businessClassification: data.businessClassification || '',
    status: data.status || 'Active',
    taxYear: data.taxYear || new Date().getFullYear().toString(),
    // Additional fields for internal use
    returns: data.returns || 0,
    totalRevenue: data.totalRevenue || '$0',
    lastContact: data.lastContact || new Date().toISOString().split('T')[0],
    notes: data.notes || '',
    tags: data.tags || [],
    assignedTo: data.assignedTo || 'Admin User',
    avatar: data.avatar || null,
    timeline: data.timeline || []
  };
};

/**
 * Migrate old client data format to new template format
 */
export const migrateClientData = (oldClient) => {
  return createStandardClientObject({
    id: oldClient.id,
    fileNo: oldClient.fileNo || oldClient.file_no || '',
    ntn: oldClient.ntn || oldClient.NEW_NTN || '',
    name: oldClient.name || oldClient.title || oldClient['TITLE OF THE CASE'] || '',
    cnic: oldClient.cnic || oldClient.nic || oldClient['NIC NO (CNIC)'] || '',
    irisPin: oldClient.irisPin || oldClient.pin || oldClient['PIN (IRIS)'] || '',
    irisPassword: oldClient.irisPassword || oldClient.password || oldClient['PASSWORD (IRIS)'] || '',
    email: oldClient.email || oldClient.mail || oldClient.MAIL || '',
    emailPassword: oldClient.emailPassword || oldClient['PASSWORD (MAIL)'] || '',
    phone: oldClient.phone || oldClient.PHONE || '',
    address: oldClient.address || oldClient.ADDRESS || '',
    city: oldClient.city || oldClient.CITY || '',
    person: oldClient.person || oldClient.PERSON || 'Individual',
    sourceOfIncome: oldClient.sourceOfIncome || oldClient['SOURCE OF INCOME'] || '',
    businessClassification: oldClient.businessClassification || oldClient['BUSINESS CLASSIFICATION'] || '',
    status: oldClient.status || oldClient.STATUS || 'Active',
    taxYear: oldClient.taxYear || oldClient['TAX YEAR'] || new Date().getFullYear().toString(),
    returns: oldClient.returns || 0,
    totalRevenue: oldClient.totalRevenue || '$0',
    lastContact: oldClient.lastContact || new Date().toISOString().split('T')[0],
    notes: oldClient.notes || '',
    tags: oldClient.tags || [],
    assignedTo: oldClient.assignedTo || 'Admin User',
    avatar: oldClient.avatar || null,
    timeline: oldClient.timeline || []
  });
};

/**
 * Validate client data against template requirements
 */
export const validateClientData = (client) => {
  const errors = [];
  const warnings = [];

  // Required field: Name (TITLE OF THE CASE)
  if (!client.name || client.name.trim() === '') {
    errors.push('Client name (TITLE OF THE CASE) is required');
  }

  // Validate CNIC format if provided
  if (client.cnic && client.cnic.trim() !== '') {
    const cnicPattern = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicPattern.test(client.cnic)) {
      warnings.push('CNIC format should be: 12345-1234567-1');
    }
  }

  // Validate email format if provided
  if (client.email && client.email.trim() !== '') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(client.email)) {
      warnings.push('Invalid email format');
    }
  }

  // Validate phone format if provided
  if (client.phone && client.phone.trim() !== '') {
    const phonePattern = /^[0-9+\-\s()]+$/;
    if (!phonePattern.test(client.phone)) {
      warnings.push('Phone number contains invalid characters');
    }
  }

  // Validate person type
  const validPersonTypes = ['Individual', 'AOP', 'Company'];
  if (client.person && !validPersonTypes.includes(client.person)) {
    warnings.push(`Person type should be one of: ${validPersonTypes.join(', ')}`);
  }

  // Validate status
  const validStatuses = ['Active', 'Inactive', 'Pending'];
  if (client.status && !validStatuses.includes(client.status)) {
    warnings.push(`Status should be one of: ${validStatuses.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Convert client data to template Excel format
 */
export const clientToTemplateFormat = (client) => {
  return {
    'FILE NO': client.fileNo || '',
    'NEW NTN': client.ntn || '',
    'TITLE OF THE CASE *': client.name || '',
    'NIC NO (CNIC)': client.cnic || '',
    'PIN (IRIS)': client.irisPin || '',
    'PASSWORD (IRIS)': client.irisPassword || '',
    'MAIL': client.email || '',
    'PASSWORD (MAIL)': client.emailPassword || '',
    'PHONE': client.phone || '',
    'ADDRESS': client.address || '',
    'CITY': client.city || '',
    'PERSON': client.person || 'Individual',
    'SOURCE OF INCOME': client.sourceOfIncome || '',
    'BUSINESS CLASSIFICATION': client.businessClassification || '',
    'STATUS': client.status || 'Active',
    'TAX YEAR': client.taxYear || new Date().getFullYear().toString()
  };
};

/**
 * Convert template Excel format to client data
 */
export const templateFormatToClient = (row, existingId = null) => {
  return createStandardClientObject({
    id: existingId || Date.now(),
    fileNo: row['FILE NO'] || '',
    ntn: row['NEW NTN'] || '',
    name: row['TITLE OF THE CASE *'] || row['TITLE OF THE CASE'] || '',
    cnic: row['NIC NO (CNIC)'] || '',
    irisPin: row['PIN (IRIS)'] || '',
    irisPassword: row['PASSWORD (IRIS)'] || '',
    email: row['MAIL'] || '',
    emailPassword: row['PASSWORD (MAIL)'] || '',
    phone: row['PHONE'] || '',
    address: row['ADDRESS'] || '',
    city: row['CITY'] || '',
    person: row['PERSON'] || 'Individual',
    sourceOfIncome: row['SOURCE OF INCOME'] || '',
    businessClassification: row['BUSINESS CLASSIFICATION'] || '',
    status: row['STATUS'] || 'Active',
    taxYear: row['TAX YEAR'] || new Date().getFullYear().toString()
  });
};

/**
 * Batch migrate all clients
 */
export const migrateAllClients = (clients) => {
  return clients.map(client => migrateClientData(client));
};
