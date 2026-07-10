/**
 * Template Configuration based on client_import_template_validated.xlsx
 * This defines the standard structure for client data in the tax automation system
 */

export const TEMPLATE_CONFIG = {
  // Field mapping from template to internal structure
  FIELD_MAPPING: {
    'FILE NO': 'fileNo',
    'NEW NTN': 'ntn',
    'TITLE OF THE CASE *': 'name',
    'NIC NO (CNIC)': 'cnic',
    'PIN (IRIS)': 'irisPin',
    'PASSWORD (IRIS)': 'irisPassword',
    'MAIL': 'email',
    'PASSWORD (MAIL)': 'emailPassword',
    'PHONE': 'phone',
    'ADDRESS': 'address',
    'CITY': 'city',
    'PERSON': 'person',
    'SOURCE OF INCOME': 'sourceOfIncome',
    'BUSINESS CLASSIFICATION': 'businessClassification',
    'STATUS': 'status',
    'TAX YEAR': 'taxYear'
  },

  // Reverse mapping for export
  REVERSE_FIELD_MAPPING: {
    'fileNo': 'FILE NO',
    'ntn': 'NEW NTN',
    'name': 'TITLE OF THE CASE *',
    'cnic': 'NIC NO (CNIC)',
    'irisPin': 'PIN (IRIS)',
    'irisPassword': 'PASSWORD (IRIS)',
    'email': 'MAIL',
    'emailPassword': 'PASSWORD (MAIL)',
    'phone': 'PHONE',
    'address': 'ADDRESS',
    'city': 'CITY',
    'person': 'PERSON',
    'sourceOfIncome': 'SOURCE OF INCOME',
    'businessClassification': 'BUSINESS CLASSIFICATION',
    'status': 'STATUS',
    'taxYear': 'TAX YEAR'
  },

  // Required fields
  REQUIRED_FIELDS: ['name'],

  // Validation options from CONFIG_MASTER
  PERSON_TYPES: ['Company', 'AOP', 'Individual'],

  SOURCE_OF_INCOME: {
    Company: ['Company'],
    AOP: ['AOP', 'Distributor AOP'],
    Individual: [
      'Business',
      'Salary',
      'Property',
      'Other Source',
      'Foreign Source',
      'Capital Gain',
      'Agriculture',
      'Freelancer',
      'Commission',
      'Partnership'
    ]
  },

  STATUS_OPTIONS: ['Active', 'Inactive', 'Pending'],

  TAX_YEARS: ['2026', '2025', '2024', '2023', '2022', '2021', '2020'],

  CITIES: ['Abbottabad', 'Haripur', 'Havelian'],

  // Default values for new clients
  DEFAULT_VALUES: {
    person: 'Individual',
    status: 'Active',
    taxYear: '2026',
    returns: 0,
    totalRevenue: '$0',
    lastContact: new Date().toISOString().split('T')[0],
    notes: '',
    tags: [],
    assignedTo: 'Admin User',
    avatar: null,
    timeline: []
  },

  // Field labels for UI
  FIELD_LABELS: {
    fileNo: 'File No',
    ntn: 'NTN',
    name: 'Title of the Case',
    cnic: 'CNIC',
    irisPin: 'IRIS PIN',
    irisPassword: 'IRIS Password',
    email: 'Email',
    emailPassword: 'Email Password',
    phone: 'Phone',
    address: 'Address',
    city: 'City',
    person: 'Person Type',
    sourceOfIncome: 'Source of Income',
    businessClassification: 'Business Classification',
    status: 'Status',
    taxYear: 'Tax Year'
  },

  // Field order for forms and display
  FIELD_ORDER: [
    'fileNo',
    'name',
    'ntn',
    'cnic',
    'person',
    'sourceOfIncome',
    'businessClassification',
    'irisPin',
    'irisPassword',
    'email',
    'emailPassword',
    'phone',
    'address',
    'city',
    'status',
    'taxYear'
  ]
};

/**
 * Get source of income options based on person type
 */
export const getSourceOfIncomeOptions = (personType) => {
  return TEMPLATE_CONFIG.SOURCE_OF_INCOME[personType] || [];
};

/**
 * Validate client data against template structure
 */
export const validateClientData = (clientData) => {
  const errors = [];

  // Check required fields
  if (!clientData.name || clientData.name.trim() === '') {
    errors.push('Title of the Case is required');
  }

  // Validate person type
  if (clientData.person && !TEMPLATE_CONFIG.PERSON_TYPES.includes(clientData.person)) {
    errors.push(`Invalid person type: ${clientData.person}`);
  }

  // Validate status
  if (clientData.status && !TEMPLATE_CONFIG.STATUS_OPTIONS.includes(clientData.status)) {
    errors.push(`Invalid status: ${clientData.status}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Convert template row to internal client object
 */
export const templateRowToClient = (row, existingId = null) => {
  const client = { ...TEMPLATE_CONFIG.DEFAULT_VALUES };
  
  // Map template fields to internal structure
  Object.entries(TEMPLATE_CONFIG.FIELD_MAPPING).forEach(([templateField, internalField]) => {
    if (row[templateField] !== undefined && row[templateField] !== null && row[templateField] !== '') {
      client[internalField] = String(row[templateField]).trim();
    }
  });

  // Add or preserve ID
  if (existingId) {
    client.id = existingId;
  }

  return client;
};

/**
 * Convert internal client object to template row
 */
export const clientToTemplateRow = (client) => {
  const row = {};
  
  // Map internal fields to template structure
  Object.entries(TEMPLATE_CONFIG.REVERSE_FIELD_MAPPING).forEach(([internalField, templateField]) => {
    row[templateField] = client[internalField] || '';
  });

  return row;
};

export default TEMPLATE_CONFIG;
