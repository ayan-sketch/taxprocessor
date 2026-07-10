import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ToastNotification, { useToast } from './components/common/ToastNotification';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  LogIn,
  TrendingUp,
  DollarSign,
  Calendar,
  Bell,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  User,
  Shield,
  Lock,
  Palette,
  X,
  Plus,
  Trash2,
  Clock,
  Edit3,
  Save,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  FileText as FileIcon,
  Timer,
  Download,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid3x3,
  List,
  Activity,
  Briefcase,
  UserCheck,
  Send,
  MessageSquare,
  CheckSquare,
  Tag,
  UserPlus,
  Zap,
  TrendingDown,
  BarChart3,
  Target,
  Award,
  FileWarning,
  Upload,
  FolderOpen,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCheck,
  Copy,
  RefreshCw,
  MoreVertical,
  Paperclip,
  Printer,
  History,
  Undo,
  Redo,
  AlignJustify,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clientsData from './clientsData.json';
import taxReturnsDataImport from './taxReturnsData.json';
import * as XLSX from 'xlsx';
import { validateAllClients } from './utils/clientValidation';
import { 
  parseExcelFile, 
  validateImportedClients, 
  exportClientsToExcel, 
  generateImportTemplate, 
  convertToAppFormat 
} from './utils/excelHelpers';
import { exportTaxReturns, getExportFormats, EXPORT_FORMATS } from './utils/taxReturnExcelExport';
import { generateSingleSheetTemplate } from './utils/excelTemplateSingleSheet';
import { generateValidatedTemplate } from './utils/excelTemplateWithValidation';
import {
  loadDocumentsFromStorage,
  saveDocumentsToStorage,
  createDocumentObject,
  deleteDocumentFromStorage,
  getDocumentStats,
  validateFileType,
  validateFileSize,
  formatFileSize,
  calculateDaysUntilExpiry,
  getExpiryStatus,
  filterDocumentsByCategory,
  searchDocuments,
  sortDocuments
} from './utils/documentHelpers';
import PDFPreviewModal from './components/common/PDFPreviewModal';
import DragDropUpload from './components/common/DragDropUpload';
import DashboardAnalytics from './components/common/DashboardAnalytics';
import ThemeToggle from './components/common/ThemeToggle';
import ReportsModal from './components/common/ReportsModal';
import AdvancedSearchPanel from './components/common/AdvancedSearchPanel';
import DuplicateDetectionPanel from './components/common/DuplicateDetectionPanel';
import EmailModal from './components/common/EmailModal';
import { useTheme } from './contexts/ThemeContext';
import ClientLinkingModal from './components/common/ClientLinkingModal';
import ExcelSettingsModal from './components/ExcelSettingsModal';
import AddReturnModal from './components/AddReturnModal';
import TaxCalculationModal from './components/taxCalculation/TaxCalculationModal';
import SimpleTaxCalculationModal from './components/taxCalculation/SimpleTaxCalculationModal';
import { openExcelForClient, getWorkbookRecommendation } from './utils/excelOpener';
import { EXCEL_WORKBOOKS, getAvailableWorkbooks } from './utils/excelConfig';
import { openExcelForNewReturn } from './utils/excelReturnManager';
import { searchReturns } from './utils/advancedSearch';

// Debounce hook for search optimization
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [customMessage, setCustomMessage] = useState('Here\'s what\'s happening with your tax practice today.');
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [tempMessage, setTempMessage] = useState(customMessage);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateAppointments, setSelectedDateAppointments] = useState([]);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3)); // April 2026
  
  // Client Management State
  const [showClientModal, setShowClientModal] = useState(false);
  const [showClientDetailModal, setShowClientDetailModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [clientFormErrors, setClientFormErrors] = useState({});
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(clientSearchTerm, 300);
  const [clientStatusFilter, setClientStatusFilter] = useState('All Status');
  const [clientBusinessTypeFilter, setClientBusinessTypeFilter] = useState('All Types');
  const [clientIncomeCategoryFilter, setClientIncomeCategoryFilter] = useState('All Categories'); // Smart categorization filter
  const [clientViewMode, setClientViewMode] = useState('table'); // 'table' or 'grid'
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Smart Client Categorization Helper Function
  const getClientIncomeCategory = useCallback((client) => {
    const source = (client.sourceOfIncome || '').toLowerCase();
    const classification = (client.businessClassification || '').toLowerCase();
    
    // Categorize based on income source and business classification
    if (source.includes('salary') || source.includes('employment')) {
      return 'Salary Only';
    } else if (source.includes('business') || classification.includes('business')) {
      return 'Business Income';
    } else if (source.includes('rental') || source.includes('property')) {
      return 'Rental Income';
    } else if (source.includes('capital') || source.includes('investment')) {
      return 'Capital Gains';
    } else if (source.includes('mixed') || (source.includes('salary') && source.includes('business'))) {
      return 'Mixed Income';
    } else if (source) {
      return 'Other Income';
    }
    return 'Uncategorized';
  }, []);
  
  // Enhanced Client Features
  const [selectedClients, setSelectedClients] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showSMSComposer, setShowSMSComposer] = useState(false);
  const [savedFilters, setSavedFilters] = useState([
    { id: 1, name: 'Active Clients', filters: { status: 'Active' } },
    { id: 2, name: 'Needs Follow-Up', filters: { daysSinceContact: 30, status: 'Active' } },
    { id: 3, name: 'New Clients', filters: { daysSinceAdded: 30 } }
  ]);
  const [activeFilterPreset, setActiveFilterPreset] = useState(null);
  
  // Advanced Search & Filtering
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    taxId: '',
    address: '',
    dateFrom: '',
    dateTo: '',
    returnsMin: '',
    returnsMax: ''
  });
  const [activeFilterChips, setActiveFilterChips] = useState([]);
  
  // Quick Actions Menu
  const [quickActionMenuClient, setQuickActionMenuClient] = useState(null);
  
  // Column Customization
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    checkbox: true,
    client: true,
    contact: true,
    type: true,
    status: true,
    returns: true,
    revenue: false,
    health: true,
    tags: true,
    actions: true
  });
  const [tableDensity, setTableDensity] = useState('standard');
  
  // Inline Editing
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  
  // Client Segmentation & Tags
  const [availableTags, setAvailableTags] = useState([
    { id: 1, name: 'VIP', color: 'purple' },
    { id: 2, name: 'High Priority', color: 'red' },
    { id: 3, name: 'New Client', color: 'green' },
    { id: 4, name: 'Needs Attention', color: 'yellow' },
    { id: 5, name: 'Corporate', color: 'blue' },
    { id: 6, name: 'Referral', color: 'pink' }
  ]);
  const [showTagManager, setShowTagManager] = useState(false);
  const [selectedClientForTags, setSelectedClientForTags] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('blue');
  const [tagFilter, setTagFilter] = useState([]);
  const [riskLevelFilter, setRiskLevelFilter] = useState('All Risk Levels');
  const [industryFilter, setIndustryFilter] = useState('All Industries');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // Search Match Highlighting - tracks which fields matched the search
  const [searchMatchedFields, setSearchMatchedFields] = useState({});
  
  // Helper function to identify which fields matched the search term
  const getMatchedFields = useCallback((client, searchTerm) => {
    if (!searchTerm) return [];
    const matched = [];
    const searchLower = searchTerm.toLowerCase();
    
    if (client.name && client.name.toLowerCase().includes(searchLower)) matched.push('name');
    if (client.email && client.email.toLowerCase().includes(searchLower)) matched.push('email');
    if (client.phone && client.phone.includes(searchTerm)) matched.push('phone');
    if (client.cnic && client.cnic.includes(searchTerm)) matched.push('cnic');
    if (client.ntn && client.ntn.includes(searchTerm)) matched.push('ntn');
    if (client.fileNo && client.fileNo.toLowerCase().includes(searchLower)) matched.push('fileNo');
    if (client.address && client.address.toLowerCase().includes(searchLower)) matched.push('address');
    if (client.city && client.city.toLowerCase().includes(searchLower)) matched.push('city');
    
    return matched;
  }, []);
  
  // ========== PHASE 1: DOCUMENT MANAGEMENT SYSTEM ==========
  const [clientDocuments, setClientDocuments] = useState({});
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedClientForDocs, setSelectedClientForDocs] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentFilter, setDocumentFilter] = useState('All');
  const [documentCategories] = useState([
    'Tax Returns', 'Financial Statements', 
    'ID Proofs', 'Contracts', 'Correspondence', 'Other'
  ]);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [expiringDocuments, setExpiringDocuments] = useState([]);
  const [documentViewMode, setDocumentViewMode] = useState('grid');
  
  // ========== PHASE 2: RELATIONSHIP MANAGEMENT ==========
  const [clientRelationships, setClientRelationships] = useState({});
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [selectedClientForRelationship, setSelectedClientForRelationship] = useState(null);
  const [relationshipTypes] = useState(['Family', 'Business Partner', 'Referral', 'Professional', 'Spouse', 'Parent-Child']);
  const [clientMilestones, setClientMilestones] = useState({});
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [clientNotes, setClientNotes] = useState({});
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newNote, setNewNote] = useState({ content: '', category: 'General', isPinned: false });
  const [noteCategories] = useState(['General', 'Meeting Notes', 'Phone Call', 'Email Summary', 'Important']);
  const [clientFeedback, setClientFeedback] = useState({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedClientForNotes, setSelectedClientForNotes] = useState(null);
  
  // ========== PHASE 3: ENHANCED SEARCH & FILTERING ==========
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({ clients: [], documents: [], notes: [], tasks: [] });
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [queryConditions, setQueryConditions] = useState([]);
  const [searchScope, setSearchScope] = useState(['clients', 'documents', 'notes']);
  const [fuzzySearchEnabled, setFuzzySearchEnabled] = useState(true);
  
  // ========== PHASE 4: UI/UX POLISH ==========
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [hoveredClient, setHoveredClient] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [compareClients, setCompareClients] = useState([]);
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditFields, setBulkEditFields] = useState({});
  const [toastNotifications, setToastNotifications] = useState([]);
  const [dashboardLayout, setDashboardLayout] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  
  // Load saved preferences
  useEffect(() => {
    const savedColumns = localStorage.getItem('clientTableColumns');
    const savedDensity = localStorage.getItem('clientTableDensity');
    const savedItemsPerPage = localStorage.getItem('clientItemsPerPage');
    
    if (savedColumns) setVisibleColumns(JSON.parse(savedColumns));
    if (savedDensity) setTableDensity(savedDensity);
    if (savedItemsPerPage) setItemsPerPage(Number(savedItemsPerPage));
  }, []);
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [clientTasks, setClientTasks] = useState([
    { id: 1, title: 'Follow up on Q1 documents', clientId: 1, clientName: 'John Smith', dueDate: '2026-05-05', priority: 'high', status: 'pending', assignedTo: 'Admin User' },
    { id: 2, title: 'Schedule tax planning meeting', clientId: 2, clientName: 'Sarah Johnson', dueDate: '2026-05-10', priority: 'medium', status: 'pending', assignedTo: 'Admin User' },
    { id: 3, title: 'Review business expenses', clientId: 5, clientName: 'David Wilson', dueDate: '2026-05-03', priority: 'high', status: 'in-progress', assignedTo: 'Admin User' }
  ]);
  const [newTask, setNewTask] = useState({ title: '', assignedTo: 'Admin User', dueDate: '', priority: 'medium', clientId: null, status: 'pending' });
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Bulk Client Import State
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [clients, setClients] = useState(clientsData);
  const [taxReturnsData, setTaxReturnsData] = useState([]);
  
  // Tax Returns Search & Filter State
  const [returnSearchTerm, setReturnSearchTerm] = useState('');
  const debouncedReturnSearch = useDebounce(returnSearchTerm, 300);
  const [returnStatusFilter, setReturnStatusFilter] = useState('All Status');
  const [returnYearFilter, setReturnYearFilter] = useState('All Years');
  const [returnSortBy, setReturnSortBy] = useState('date-desc');
  
  // Tax Return Folder Configuration State
  const [showFolderConfigModal, setShowFolderConfigModal] = useState(false);
  const [watchFolder, setWatchFolder] = useState('');
  const [showFolderConfirmation, setShowFolderConfirmation] = useState(false);
  const [selectedFolderPath, setSelectedFolderPath] = useState('');
  
  // Tax Returns Display & Management State
  const [selectedReturns, setSelectedReturns] = useState([]);
  const [showEditReturnModal, setShowEditReturnModal] = useState(false);
  const [editingReturn, setEditingReturn] = useState(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [previewReturnPDF, setPreviewReturnPDF] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdateReturn, setStatusUpdateReturn] = useState(null);
  const [returnCurrentPage, setReturnCurrentPage] = useState(1);
  const [returnItemsPerPage, setReturnItemsPerPage] = useState(25);
  const [returnViewMode, setReturnViewMode] = useState('table');
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddReturnModal, setShowAddReturnModal] = useState(false);
  const [showTaxCalculationModal, setShowTaxCalculationModal] = useState(false);
  const [taxCalculationMode, setTaxCalculationMode] = useState('simple'); // 'simple' | 'advanced'
  const [selectedReturnData, setSelectedReturnData] = useState(null);
  const [showExcelLoginPopup, setShowExcelLoginPopup] = useState(false);
  const [excelLoginName, setExcelLoginName] = useState('');
  const [excelLoginCnic, setExcelLoginCnic] = useState('');
  const [excelIsLoggingIn, setExcelIsLoggingIn] = useState(false);
  const [excelLoginSuccess, setExcelLoginSuccess] = useState(false);
  const [excelClientSuggestions, setExcelClientSuggestions] = useState([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showCnicSuggestions, setShowCnicSuggestions] = useState(false);
  const [showNewClientPrompt, setShowNewClientPrompt] = useState(false);
  const [newReturn, setNewReturn] = useState({
    client_name: '',
    cnic_ntn: '',
    tax_year: new Date().getFullYear().toString(),
    return_type: 'Section 114(1) - Voluntary Return',
    filing_date: new Date().toISOString().split('T')[0],
    status: 'Pending'
  });
  
  // Add Return Modal State (IRIS-style legacy - for old modal compatibility)
  const [irisStep, setIrisStep] = useState(1);
  const [irisSearchTerm, setIrisSearchTerm] = useState('');
  const [showNewClientConfirm, setShowNewClientConfirm] = useState(false);
  const [pendingNewClientData, setPendingNewClientData] = useState(null);
  const [irisSelectedClient, setIrisSelectedClient] = useState(null);
  
  // Enhanced Features State (Tax Returns specific)
  const [inlineEditCell, setInlineEditCell] = useState(null); // {returnId, field}
  const [inlineEditValue, setInlineEditValue] = useState('');
  const [contextMenuReturn, setContextMenuReturn] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [advancedReturnFilters, setAdvancedReturnFilters] = useState({
    dateFrom: '',
    dateTo: '',
    returnTypes: [],
    clientName: ''
  });
  const [savedFilterPresets, setSavedFilterPresets] = useState([
    { id: 1, name: 'Recent Filed', filters: { status: 'Filed', dateFrom: new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0] } },
    { id: 2, name: 'Pending This Year', filters: { status: 'Pending', year: new Date().getFullYear().toString() } }
  ]);
  const [activeFilterPresetId, setActiveFilterPresetId] = useState(null);
  const [visibleReturnColumns, setVisibleReturnColumns] = useState({
    checkbox: true,
    clientName: true,
    cnicNtn: true,
    taxYear: true,
    totalIncome: true,
    taxableIncome: true,
    taxChargeable: true,
    refundAmount: true,
    returnType: true,
    filingDate: true,
    status: true,
    actions: true
  });
  const [returnTableDensity, setReturnTableDensity] = useState('standard'); // compact, standard, comfortable
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // saving, saved, error
  const [returnHistory, setReturnHistory] = useState({}); // {returnId: [{timestamp, changes, user}]}
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [lastUsedValues, setLastUsedValues] = useState({
    return_type: 'Section 114(1) - Voluntary Return',
    status: 'Pending'
  });
  
  const [newClient, setNewClient] = useState({
    fileNo: '',
    ntn: '',
    name: '',
    cnic: '',
    irisPin: '',
    irisPassword: '',
    email: '',
    emailPassword: '',
    phone: '',
    address: '',
    city: '',
    person: 'Individual',
    sourceOfIncome: '',
    businessClassification: '',
    businessType: 'Individual',
    status: 'Active',
    taxYear: '2026',
    preferredContact: 'email',
    notes: '',
    tags: [],
    assignedTo: 'Admin User',
    avatar: null,
    // Legacy field for compatibility
    taxId: ''
  });

  // New Features State
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showDuplicatePanel, setShowDuplicatePanel] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Initialize useToast hook
  const { showToast, dismissToast } = useToast(toastNotifications, setToastNotifications);
  
  // Use theme hook
  const { isDark, toggleTheme } = useTheme();
  
  const emailTemplates = [
    { id: 'none', name: 'Blank Email', subject: '', body: '' },
    { id: 'followup', name: 'Follow-up', subject: 'Following up on your tax matters', body: 'Hi [Client Name],\n\nI wanted to follow up regarding your tax situation. Please let me know if you have any questions or need assistance.\n\nBest regards,\nAdmin User' },
    { id: 'reminder', name: 'Appointment Reminder', subject: 'Upcoming Appointment Reminder', body: 'Hi [Client Name],\n\nThis is a reminder about your upcoming appointment on [Date]. Looking forward to speaking with you.\n\nBest regards,\nAdmin User' },
    { id: 'document', name: 'Document Request', subject: 'Documents Needed', body: 'Hi [Client Name],\n\nTo proceed with your tax return, we need the following documents:\n- [List documents]\n\nPlease send them at your earliest convenience.\n\nBest regards,\nAdmin User' }
  ];
  
  const smsTemplates = [
    { id: 'none', name: 'Blank SMS', message: '' },
    { id: 'reminder', name: 'Quick Reminder', message: 'Hi [Client Name], reminder about your appointment on [Date]. See you then!' },
    { id: 'followup', name: 'Follow-up', message: 'Hi [Client Name], just checking in. Let me know if you need anything!' },
    { id: 'document', name: 'Document Request', message: 'Hi [Client Name], we need some documents from you. Please reply when you can send them.' }
  ];

  // Client suggestion filtering for Excel Login popup
  useEffect(() => {
    const nameTerm = excelLoginName.trim().toLowerCase();
    const cnicTerm = excelLoginCnic.trim().toLowerCase();

    if (!nameTerm && !cnicTerm) {
      setExcelClientSuggestions([]);
      setShowNameSuggestions(false);
      setShowCnicSuggestions(false);
      return;
    }

    // Normalizing helper to strip dashes
    const normalizeCnic = (val) => val.replace(/-/g, '').trim();

    // Check if the current inputs exactly match an existing client
    const exactMatch = clients.find(c =>
      (c.name || '').toLowerCase() === nameTerm &&
      normalizeCnic(c.cnic || c.ntn || '') === normalizeCnic(excelLoginCnic)
    );

    if (exactMatch) {
      setExcelClientSuggestions([]);
      setShowNameSuggestions(false);
      setShowCnicSuggestions(false);
      return;
    }

    const matches = clients.filter(c => {
      const clientName = (c.name || '').toLowerCase();
      const clientCnic = (c.cnic || '').toString().toLowerCase();
      const clientCnicClean = normalizeCnic(clientCnic);
      const clientNtn = (c.ntn || '').toString().toLowerCase();
      const clientNtnClean = normalizeCnic(clientNtn);

      const cleanNameTerm = normalizeCnic(nameTerm);
      const cleanCnicTerm = normalizeCnic(cnicTerm);

      if (nameTerm && cnicTerm) {
        const nameMatches = clientName.includes(nameTerm) ||
                            clientCnic.includes(nameTerm) ||
                            clientCnicClean.includes(cleanNameTerm) ||
                            clientNtn.includes(nameTerm) ||
                            clientNtnClean.includes(cleanNameTerm);

        const cnicMatches = clientCnic.includes(cnicTerm) ||
                            clientCnicClean.includes(cleanCnicTerm) ||
                            clientNtn.includes(cnicTerm) ||
                            clientNtnClean.includes(cleanCnicTerm) ||
                            clientName.includes(cnicTerm);

        return nameMatches && cnicMatches;
      }
      if (nameTerm) {
        return clientName.includes(nameTerm) ||
               clientCnic.includes(nameTerm) ||
               clientCnicClean.includes(cleanNameTerm) ||
               clientNtn.includes(nameTerm) ||
               clientNtnClean.includes(cleanNameTerm);
      }
      if (cnicTerm) {
        return clientCnic.includes(cnicTerm) ||
               clientCnicClean.includes(cleanCnicTerm) ||
               clientNtn.includes(cnicTerm) ||
               clientNtnClean.includes(cleanCnicTerm) ||
               clientName.includes(cnicTerm);
      }
      return false;
    }).slice(0, 8);

    setExcelClientSuggestions(matches);

    if (nameTerm && !cnicTerm) {
      setShowNameSuggestions(matches.length > 0);
      setShowCnicSuggestions(false);
    } else if (cnicTerm && !nameTerm) {
      setShowCnicSuggestions(matches.length > 0);
      setShowNameSuggestions(false);
    } else {
      setShowNameSuggestions(matches.length > 0);
      setShowCnicSuggestions(false);
    }
  }, [excelLoginName, excelLoginCnic, clients]);

  // Handle selecting a client from Excel Login popup suggestions
  const handleExcelSelectClient = (client) => {
    setExcelLoginName(client.name || '');
    setExcelLoginCnic(client.cnic || client.ntn || '');
    setExcelClientSuggestions([]);
    setShowNameSuggestions(false);
    setShowCnicSuggestions(false);
  };

  // Handle bulk client selection
  const handleSelectClient = (clientId) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAllClients = () => {
    const filtered = getFilteredAndSortedClients();
    if (selectedClients.length === filtered.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filtered.map(c => c.id));
    }
  };

  // Apply saved filter preset
  const applyFilterPreset = (preset) => {
    if (activeFilterPreset === preset.id) {
      // If clicking the same preset, deactivate it
      setActiveFilterPreset(null);
    } else {
      setActiveFilterPreset(preset.id);
      // Apply preset filters
      if (preset.filters.status) {
        setClientStatusFilter(preset.filters.status);
      }
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setClientSearchTerm('');
    setClientStatusFilter('All Status');
    setClientBusinessTypeFilter('All Types');
    setClientIncomeCategoryFilter('All Categories');
    setActiveFilterPreset(null);
    setSelectedClients([]);
  };

  // Send bulk email
  const handleSendBulkEmail = () => {
    const selectedClientData = clients.filter(c => selectedClients.includes(c.id));
    setEmailData({
      ...emailData,
      to: selectedClientData.map(c => ({ name: c.name, email: c.email }))
    });
    setShowEmailComposer(true);
  };

  // Send bulk SMS
  const handleSendBulkSMS = () => {
    const selectedClientData = clients.filter(c => selectedClients.includes(c.id));
    setSmsData({
      ...smsData,
      to: selectedClientData.map(c => ({ name: c.name, phone: c.phone }))
    });
    setShowSMSComposer(true);
  };

  // Handle email template selection
  const handleEmailTemplateChange = (templateId) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setEmailData({
        ...emailData,
        template: templateId,
        subject: template.subject,
        body: template.body
      });
    }
  };

  // Handle SMS template selection
  const handleSMSTemplateChange = (templateId) => {
    const template = smsTemplates.find(t => t.id === templateId);
    if (template) {
      setSmsData({
        ...smsData,
        template: templateId,
        message: template.message
      });
    }
  };

  // Send email
  const handleSendEmail = () => {
    // In a real app, this would call an API
    alert(`Email sent to ${emailData.to.length} recipient(s):\n\nSubject: ${emailData.subject}\n\nThis is a demo - no actual emails were sent.`);
    setShowEmailComposer(false);
    setEmailData({ to: [], subject: '', body: '', template: 'none' });
    setSelectedClients([]);
  };

  // Send SMS
  const handleSendSMS = () => {
    // In a real app, this would call an API
    alert(`SMS sent to ${smsData.to.length} recipient(s):\n\n${smsData.message}\n\nThis is a demo - no actual SMS were sent.`);
    setShowSMSComposer(false);
    setSmsData({ to: [], message: '', template: 'none' });
    setSelectedClients([]);
  };

  // Add task
  const handleAddTask = () => {
    if (!newTask.title || !newTask.clientId || !newTask.dueDate) {
      alert('Please fill in all required fields');
      return;
    }
    
    const client = clients.find(c => c.id === parseInt(newTask.clientId));
    const task = {
      id: Date.now(),
      ...newTask,
      clientName: client.name
    };
    
    setClientTasks([...clientTasks, task]);
    setNewTask({ title: '', assignedTo: 'Admin User', dueDate: '', priority: 'medium', clientId: null, status: 'pending' });
    setShowTaskModal(false);
  };

  // Delete task
  const handleDeleteTask = (taskId) => {
    setClientTasks(clientTasks.filter(t => t.id !== taskId));
  };

  // Update task status
  const handleUpdateTaskStatus = (taskId, newStatus) => {
    setClientTasks(clientTasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ));
  };
  
  const [newAppointment, setNewAppointment] = useState({

    title: '',
    client: '',
    clientEmail: '',
    clientPhone: '',
    date: '',
    time: '',
    duration: '60',
    type: 'meeting',
    priority: 'medium',
    status: 'scheduled',
    location: '',
    notes: '',
    notification: '15min',
    repeat: 'none'
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const savedMessage = localStorage.getItem('dashboardMessage');
    if (savedMessage) {
      setCustomMessage(savedMessage);
      setTempMessage(savedMessage);
    }

    // Load tax returns data
    try {
      setTaxReturnsData(taxReturnsDataImport);
    } catch (error) {
      console.error('Error loading tax returns data:', error);
      setTaxReturnsData([]);
    }

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    navigate('/');
  };

  const handleSaveMessage = () => {
    setCustomMessage(tempMessage);
    localStorage.setItem('dashboardMessage', tempMessage);
    setIsEditingMessage(false);
  };

  const handleCancelMessageEdit = () => {
    setTempMessage(customMessage);
    setIsEditingMessage(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!newAppointment.title.trim()) errors.title = true;
    if (!newAppointment.client.trim()) errors.client = true;
    if (!newAppointment.date) errors.date = true;
    if (!newAppointment.time) errors.time = true;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAppointment = () => {
    if (!validateForm()) return;

    if (editingAppointment) {
      // Update existing appointment
      setAppointments(appointments.map(apt => 
        apt.id === editingAppointment.id ? { ...newAppointment, id: apt.id } : apt
      ));
      setEditingAppointment(null);
    } else {
      // Add new appointment
      const appointment = {
        id: Date.now(),
        ...newAppointment
      };
      setAppointments([...appointments, appointment]);
    }
    
    setNewAppointment({
      title: '',
      client: '',
      clientEmail: '',
      clientPhone: '',
      date: '',
      time: '',
      duration: '60',
      type: 'meeting',
      priority: 'medium',
      status: 'scheduled',
      location: '',
      notes: '',
      notification: '15min',
      repeat: 'none'
    });
    setFormErrors({});
    setShowAppointmentModal(false);
  };

  const handleEditAppointment = (apt) => {
    setEditingAppointment(apt);
    setNewAppointment({
      title: apt.title || '',
      client: apt.client || '',
      clientEmail: apt.clientEmail || '',
      clientPhone: apt.clientPhone || '',
      date: apt.date || '',
      time: apt.time || '',
      duration: apt.duration || '60',
      type: apt.type || 'meeting',
      priority: apt.priority || 'medium',
      status: apt.status || 'scheduled',
      location: apt.location || '',
      notes: apt.notes || '',
      notification: apt.notification || '15min',
      repeat: apt.repeat || 'none'
    });
    setSelectedDate(null);
    setSelectedDateAppointments([]);
    setShowAppointmentModal(true);
  };

  const handleCancelAppointment = () => {
    setNewAppointment({
      title: '',
      client: '',
      clientEmail: '',
      clientPhone: '',
      date: '',
      time: '',
      duration: '60',
      type: 'meeting',
      priority: 'medium',
      status: 'scheduled',
      location: '',
      notes: '',
      notification: '15min',
      repeat: 'none'
    });
    setFormErrors({});
    setEditingAppointment(null);
    setShowAppointmentModal(false);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth, year, month };
  };

  const handleDeleteAppointment = (id) => {
    setAppointments(appointments.filter(apt => apt.id !== id));
  };

  const handleDateClick = (dateStr) => {
    // Find appointments for this date
    const dateAppointments = appointments.filter(apt => apt.date === dateStr);
    
    if (dateAppointments.length > 0) {
      // Show existing appointments for this date
      setSelectedDate(dateStr);
      setSelectedDateAppointments(dateAppointments);
    } else {
      // No appointments, open modal with date pre-filled
      setNewAppointment({
        ...newAppointment,
        date: dateStr
      });
      setShowAppointmentModal(true);
    }
  };

  const closeSelectedDateView = () => {
    setSelectedDate(null);
    setSelectedDateAppointments([]);
  };

  const formatAppointmentTime = (date, time) => {
    const aptDate = new Date(date + 'T' + time);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (aptDate.toDateString() === today.toDateString()) {
      return `Today, ${time}`;
    } else if (aptDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${time}`;
    } else {
      return `${aptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
    }
  };

  // Client Management Functions
  const validateClientForm = () => {
    const errors = {};
    
    // Name is required
    if (!newClient.name.trim()) {
      errors.name = true;
    }
    
    // Email validation - if provided, must be valid format
    if (newClient.email && newClient.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newClient.email.trim())) {
        errors.email = true;
      }
    }
    
    // Phone validation - if provided, must be valid format (digits, spaces, hyphens, parentheses, plus)
    if (newClient.phone && newClient.phone.trim()) {
      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      const cleanPhone = newClient.phone.replace(/[\s\-\(\)\+]/g, '');
      if (!phoneRegex.test(newClient.phone) || cleanPhone.length < 10 || cleanPhone.length > 15) {
        errors.phone = true;
      }
    }
    
    // CNIC validation - if provided, must be 13 digits with optional hyphens
    if (newClient.cnic && newClient.cnic.trim()) {
      const cnicRegex = /^\d{5}-?\d{7}-?\d{1}$/;
      if (!cnicRegex.test(newClient.cnic.replace(/\s/g, ''))) {
        errors.cnic = true;
      }
    }
    
    // NTN validation - if provided, must be 7-13 digits
    if (newClient.ntn && newClient.ntn.trim()) {
      const ntnRegex = /^\d{7,13}$/;
      if (!ntnRegex.test(newClient.ntn.replace(/[\s\-]/g, ''))) {
        errors.ntn = true;
      }
    }
    
    setClientFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddClient = () => {
    if (!validateClientForm()) return;

    if (editingClient) {
      // When editing, check for duplicates excluding the current client
      const duplicate = clients.find(client => 
        client.id !== editingClient.id && (
          (newClient.cnic && client.cnic && client.cnic === newClient.cnic) ||
          (newClient.ntn && client.ntn && client.ntn === newClient.ntn)
        )
      );
      
      if (duplicate) {
        const duplicateField = newClient.cnic && duplicate.cnic === newClient.cnic ? 'CNIC' : 'NTN';
        alert(`⚠️ Duplicate Client Detected\n\nA client with the same ${duplicateField} already exists:\n\nName: ${duplicate.name}\nFile No: ${duplicate.fileNo}\n${duplicateField}: ${duplicateField === 'CNIC' ? duplicate.cnic : duplicate.ntn}\n\nPlease use a different ${duplicateField} or update the existing client.`);
        return;
      }
      
      setClients(clients.map(client => 
        client.id === editingClient.id ? { ...newClient, id: client.id, returns: client.returns, lastContact: client.lastContact, timeline: client.timeline } : client
      ));
      setEditingClient(null);
    } else {
      // Check for duplicate CNIC or NTN before adding new client
      const duplicate = clients.find(client => 
        (newClient.cnic && client.cnic && client.cnic === newClient.cnic) ||
        (newClient.ntn && client.ntn && client.ntn === newClient.ntn)
      );
      
      if (duplicate) {
        const duplicateField = newClient.cnic && duplicate.cnic === newClient.cnic ? 'CNIC' : 'NTN';
        const confirmAdd = confirm(
          `⚠️ Duplicate Client Detected\n\n` +
          `A client with the same ${duplicateField} already exists:\n\n` +
          `Name: ${duplicate.name}\n` +
          `File No: ${duplicate.fileNo}\n` +
          `${duplicateField}: ${duplicateField === 'CNIC' ? duplicate.cnic : duplicate.ntn}\n\n` +
          `Do you still want to add this client?\n\n` +
          `Click OK to add anyway, or Cancel to review.`
        );
        
        if (!confirmAdd) {
          return;
        }
      }
      
      // Generate fileNo if not provided
      const maxFileNo = clients.reduce((max, c) => {
        const num = parseInt(c.fileNo);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      
      const client = {
        id: Date.now(),
        ...newClient,
        fileNo: newClient.fileNo || String(maxFileNo + 1),
        returns: 0,
        lastContact: new Date().toISOString().split('T')[0],
        tags: [],
        assignedTo: 'Admin User',
        avatar: null,
        timeline: []
      };
      setClients([...clients, client]);

      // Create physical folder on disk if running in Electron
      const isElectron = typeof window !== 'undefined' && window.electronAPI && window.electronAPI.createClientFolder;
      if (isElectron) {
        const base = localStorage.getItem('noticeBasePath') || '';
        if (base) {
          const folderSuffix = client.ntn || client.cnic || client.fileNo;
          const folderName = `${client.name} (${folderSuffix})`.replace(/[<>:"/\\|?*]/g, '');
          window.electronAPI.createClientFolder(folderName, base)
            .then(res => {
              if (res.success) {
                console.log(`Folder created successfully: ${res.clientFolder}`);
              } else {
                console.error(`Folder creation failed: ${res.error}`);
              }
            })
            .catch(err => console.error(err));
        }
      }
    }
    
    // Reset form to template defaults
    setNewClient({
      fileNo: '',
      ntn: '',
      name: '',
      cnic: '',
      irisPin: '',
      irisPassword: '',
      email: '',
      emailPassword: '',
      phone: '',
      address: '',
      city: '',
      person: 'Individual',
      sourceOfIncome: '',
      businessClassification: '',
      businessType: 'Individual',
      status: 'Active',
      taxYear: '2026',
      preferredContact: 'email',
      notes: '',
      tags: [],
      assignedTo: 'Admin User',
      avatar: null,
      taxId: ''
    });
    setClientFormErrors({});
    setShowClientModal(false);
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setNewClient({
      fileNo: client.fileNo || '',
      ntn: client.ntn || '',
      name: client.name || '',
      cnic: client.cnic || '',
      irisPin: client.irisPin || '',
      irisPassword: client.irisPassword || '',
      email: client.email || '',
      emailPassword: client.emailPassword || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      person: client.person || 'Individual',
      sourceOfIncome: client.sourceOfIncome || '',
      businessClassification: client.businessClassification || '',
      businessType: client.businessType || 'Individual',
      status: client.status || 'Active',
      taxYear: client.taxYear || '2026',
      preferredContact: client.preferredContact || 'email',
      notes: client.notes || '',
      tags: client.tags || [],
      assignedTo: client.assignedTo || 'Admin User',
      avatar: client.avatar || null,
      taxId: client.taxId || ''
    });
    setShowClientModal(true);
  };

  const handleCancelClient = () => {
    setNewClient({
      fileNo: '',
      ntn: '',
      name: '',
      cnic: '',
      irisPin: '',
      irisPassword: '',
      email: '',
      emailPassword: '',
      phone: '',
      address: '',
      city: '',
      person: 'Individual',
      sourceOfIncome: '',
      businessClassification: '',
      businessType: 'Individual',
      status: 'Active',
      taxYear: '2026',
      preferredContact: 'email',
      notes: '',
      tags: [],
      assignedTo: 'Admin User',
      avatar: null,
      taxId: ''
    });
    setClientFormErrors({});
    setEditingClient(null);
    setShowClientModal(false);
  };

  const handleViewClientDetails = (client) => {
    setSelectedClient(client);
    setShowClientDetailModal(true);
  };

  const handleDeleteClient = (id) => {
    setClients(clients.filter(client => client.id !== id));
  };

  // Memoized client filtering and sorting with pagination
  // PERFORMANCE OPTIMIZED: Uses useMemo to prevent unnecessary recalculations
  // Combined with debounced search (300ms delay) to reduce filtering operations
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients;

    // Apply active filter preset
    if (activeFilterPreset) {
      const preset = savedFilters.find(f => f.id === activeFilterPreset);
      if (preset && preset.filters) {
        // Needs Follow-Up filter
        if (preset.filters.daysSinceContact) {
          filtered = filtered.filter(client => {
            const daysSinceContact = Math.floor(
              (new Date() - new Date(client.lastContact)) / (1000 * 60 * 60 * 24)
            );
            return daysSinceContact >= preset.filters.daysSinceContact;
          });
        }
        
        // New Clients filter
        if (preset.filters.daysSinceAdded) {
          filtered = filtered.filter(client => {
            // Assuming clients have a createdAt or similar field
            // If not, we'll use lastContact as a proxy
            const createdDate = client.createdAt ? new Date(client.createdAt) : new Date(client.lastContact);
            const daysSinceAdded = Math.floor(
              (new Date() - createdDate) / (1000 * 60 * 60 * 24)
            );
            return daysSinceAdded <= preset.filters.daysSinceAdded;
          });
        }
        
        // Status filter from preset
        if (preset.filters.status) {
          filtered = filtered.filter(client => client.status === preset.filters.status);
        }
      }
    }

    // Search filter using debounced term - ENHANCED to include all searchable fields
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      // Normalize search term by removing dashes for CNIC/NTN comparison
      const searchNormalized = debouncedSearchTerm.replace(/-/g, '');
      
      filtered = filtered.filter(client => {
        // Normalize CNIC and NTN by removing dashes
        const cnicNormalized = client.cnic ? client.cnic.replace(/-/g, '') : '';
        const ntnNormalized = client.ntn ? client.ntn.replace(/-/g, '') : '';
        
        return (
          client.name.toLowerCase().includes(searchLower) ||
          (client.email && client.email.toLowerCase().includes(searchLower)) ||
          (client.phone && client.phone.includes(debouncedSearchTerm)) ||
          (client.cnic && (client.cnic.includes(debouncedSearchTerm) || cnicNormalized.includes(searchNormalized))) ||
          (client.ntn && (client.ntn.includes(debouncedSearchTerm) || ntnNormalized.includes(searchNormalized))) ||
          (client.fileNo && client.fileNo.toLowerCase().includes(searchLower)) ||
          (client.address && client.address.toLowerCase().includes(searchLower)) ||
          (client.city && client.city.toLowerCase().includes(searchLower)) ||
          (client.sourceOfIncome && client.sourceOfIncome.toLowerCase().includes(searchLower)) ||
          (client.businessClassification && client.businessClassification.toLowerCase().includes(searchLower))
        );
      });
    }

    // Status filter
    if (clientStatusFilter !== 'All Status') {
      filtered = filtered.filter(client => client.status === clientStatusFilter);
    }

    // Business type filter
    if (clientBusinessTypeFilter !== 'All Types') {
      filtered = filtered.filter(client => client.businessType === clientBusinessTypeFilter);
    }
    
    // Income Category filter (Smart Categorization)
    if (clientIncomeCategoryFilter !== 'All Categories') {
      filtered = filtered.filter(client => getClientIncomeCategory(client) === clientIncomeCategoryFilter);
    }

    // Sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle numeric values
        if (sortConfig.key === 'returns') {
          aValue = parseInt(aValue);
          bValue = parseInt(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [clients, debouncedSearchTerm, clientStatusFilter, clientBusinessTypeFilter, clientIncomeCategoryFilter, sortConfig, activeFilterPreset, savedFilters, getClientIncomeCategory]);

  // Paginated clients
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedClients.slice(startIndex, endIndex);
  }, [filteredAndSortedClients, currentPage, itemsPerPage]);

  // Total pages calculation
  const totalPages = Math.ceil(filteredAndSortedClients.length / itemsPerPage);

  // Reset page when filters change (but NOT when sort changes - preserve page on sort)
  useEffect(() => {
    setCurrentPage(1);
  }, [clientSearchTerm, clientStatusFilter, clientBusinessTypeFilter]);

  // Legacy function for compatibility
  const getFilteredAndSortedClients = useCallback(() => {
    return filteredAndSortedClients;
  }, [filteredAndSortedClients]);

  // Tax Returns Filtering and Sorting
  const filteredAndSortedReturns = useMemo(() => {
    let filtered = taxReturnsData;

    // Search filter using advanced matching across names, amounts, codes, notes, and nested values
    if (debouncedReturnSearch) {
      filtered = searchReturns(filtered, debouncedReturnSearch, {
        includeHidden: true,
        includeArchived: true
      });
    }

    // Status filter
    if (returnStatusFilter !== 'All Status') {
      filtered = filtered.filter(r => r.status === returnStatusFilter);
    }

    // Year filter
    if (returnYearFilter !== 'All Years') {
      filtered = filtered.filter(r => r.tax_year === returnYearFilter);
    }

    // Advanced filters
    if (advancedReturnFilters.dateFrom) {
      filtered = filtered.filter(r => {
        const filingDate = new Date(r.filing_date);
        const fromDate = new Date(advancedReturnFilters.dateFrom);
        return filingDate >= fromDate;
      });
    }

    if (advancedReturnFilters.dateTo) {
      filtered = filtered.filter(r => {
        const filingDate = new Date(r.filing_date);
        const toDate = new Date(advancedReturnFilters.dateTo);
        return filingDate <= toDate;
      });
    }

    if (advancedReturnFilters.returnTypes.length > 0) {
      filtered = filtered.filter(r => 
        advancedReturnFilters.returnTypes.includes(r.return_type)
      );
    }

    if (advancedReturnFilters.clientName) {
      const clientNameLower = advancedReturnFilters.clientName.toLowerCase();
      filtered = filtered.filter(r => 
        r.client_name?.toLowerCase().includes(clientNameLower)
      );
    }

    // Sorting
    filtered = [...filtered].sort((a, b) => {
      switch (returnSortBy) {
        case 'name-asc':
          return (a.client_name || '').localeCompare(b.client_name || '');
        case 'name-desc':
          return (b.client_name || '').localeCompare(a.client_name || '');
        case 'date-asc':
          return new Date(a.processed_at || 0) - new Date(b.processed_at || 0);
        case 'date-desc':
          return new Date(b.processed_at || 0) - new Date(a.processed_at || 0);
        case 'year-asc':
          return (a.tax_year || '').localeCompare(b.tax_year || '');
        case 'year-desc':
          return (b.tax_year || '').localeCompare(a.tax_year || '');
        case 'pages-asc':
          return (a.total_pages || 0) - (b.total_pages || 0);
        case 'pages-desc':
          return (b.total_pages || 0) - (a.total_pages || 0);
        default:
          return new Date(b.processed_at || 0) - new Date(a.processed_at || 0);
      }
    });

    return filtered;
  }, [taxReturnsData, debouncedReturnSearch, returnStatusFilter, returnYearFilter, returnSortBy, advancedReturnFilters]);

  // Get unique tax years for filter dropdown
  const availableTaxYears = useMemo(() => {
    const years = [...new Set(taxReturnsData.map(r => r.tax_year).filter(Boolean))];
    return years.sort((a, b) => b.localeCompare(a)); // Sort descending
  }, [taxReturnsData]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-400" /> : 
      <ArrowDown className="w-4 h-4 text-blue-400" />;
  };

  // Download Excel Template
  const handleDownloadTemplate = async () => {
    try {
      const { downloadBlankTemplate } = await import('./utils/excelTemplateImportExport');
      downloadBlankTemplate();
      showToast('✅ Template downloaded successfully!\n\nThe template has a "Client Data" sheet with 16 columns.\nFill in your client data and import it back.', 'success');
    } catch (error) {
      console.error('Error generating template:', error);
      showToast('❌ Error generating template. Please try again.', 'error');
    }
  };

  // Export clients to Excel
  const handleExportClients = async () => {
    try {
      const { exportClientsToTemplate } = await import('./utils/excelTemplateImportExport');
      const filtered = getFilteredAndSortedClients();
      const filename = `clients_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      exportClientsToTemplate(filtered, filename);
      showToast(`✅ Successfully exported ${filtered.length} client${filtered.length !== 1 ? 's' : ''} to Excel!`, 'success');
    } catch (error) {
      console.error('Error exporting clients:', error);
      showToast('❌ Error exporting clients. Please try again.', 'error');
    }
  };

  // Handle Excel file upload
  const handleExcelFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportFile(file);
    setIsValidating(true);

    try {
      // Show loading toast
      showToast('Processing Excel file...', 'info');

      // Import using template format
      const { importClientsFromTemplate } = await import('./utils/excelTemplateImportExport');
      const result = await importClientsFromTemplate(file);

      // Check for errors
      if (result.errors && result.errors.length > 0) {
        // Build detailed error message
        let errorMessage = `❌ Import completed with ${result.errors.length} error(s):\n\n`;
        
        result.errors.slice(0, 5).forEach(err => {
          errorMessage += `Row ${err.row}: ${err.errors.join(', ')}\n`;
        });
        
        if (result.errors.length > 5) {
          errorMessage += `\n... and ${result.errors.length - 5} more errors`;
        }
        
        console.error('Import errors:', result.errors);
        showToast(errorMessage, 'error');
      }

      // Check for warnings
      if (result.warnings && result.warnings.length > 0) {
        let warningMessage = `⚠️ ${result.warnings.length} warning(s):\n\n`;
        
        result.warnings.slice(0, 3).forEach(warn => {
          warningMessage += `Row ${warn.row}: ${warn.warnings.join(', ')}\n`;
        });
        
        if (result.warnings.length > 3) {
          warningMessage += `\n... and ${result.warnings.length - 3} more warnings`;
        }
        
        console.warn('Import warnings:', result.warnings);
        showToast(warningMessage, 'warning');
      }

      // Import successful clients
      if (result.clients && result.clients.length > 0) {
        const validClients = result.clients.filter((_, index) => {
          return !result.errors.some(err => err.row === index + 2);
        });

        if (validClients.length > 0) {
          let addedCount = 0;
          let updatedCount = 0;
          const updatedClients = [...clients];

          validClients.forEach((importedClient) => {
            // Check if client already exists
            const existingIndex = updatedClients.findIndex(c => 
              (importedClient.ntn && c.ntn && c.ntn === importedClient.ntn) ||
              (importedClient.cnic && c.cnic && c.cnic === importedClient.cnic) ||
              (importedClient.name && c.name && c.name.toLowerCase() === importedClient.name.toLowerCase())
            );

            if (existingIndex !== -1) {
              // Update existing client
              updatedClients[existingIndex] = {
                ...updatedClients[existingIndex],
                ...importedClient,
                id: updatedClients[existingIndex].id,
                returns: updatedClients[existingIndex].returns,
                timeline: updatedClients[existingIndex].timeline,
                lastUpdated: new Date().toISOString()
              };
              updatedCount++;
            } else {
              // Add new client
              updatedClients.push(importedClient);
              addedCount++;
            }
          });

          setClients(updatedClients);

          // Success message
          let successMessage = '✅ Import completed!\n\n';
          if (addedCount > 0) {
            successMessage += `➕ Added: ${addedCount} new client${addedCount !== 1 ? 's' : ''}\n`;
          }
          if (updatedCount > 0) {
            successMessage += `🔄 Updated: ${updatedCount} existing client${updatedCount !== 1 ? 's' : ''}`;
          }

          showToast(successMessage, 'success');
        }
      } else {
        showToast('❌ No valid clients found in the Excel file', 'error');
      }

      setIsValidating(false);
      event.target.value = '';
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      
      // Provide specific error messages
      let errorMessage = '❌ Import failed:\n\n';
      
      if (error.message.includes('Sheet "Client Data" not found')) {
        errorMessage += 'The Excel file does not contain a "Client Data" sheet.\n\n';
        errorMessage += 'Please use the template file downloaded from the Template button.';
      } else if (error.message.includes('Failed to read')) {
        errorMessage += 'Unable to read the Excel file.\n\n';
        errorMessage += 'Please ensure:\n';
        errorMessage += '• The file is a valid Excel file (.xlsx or .xlsm)\n';
        errorMessage += '• The file is not corrupted\n';
        errorMessage += '• The file is not password protected';
      } else if (error.message.includes('No data found')) {
        errorMessage += 'The "Client Data" sheet is empty.\n\n';
        errorMessage += 'Please add client data to the sheet before importing.';
      } else {
        errorMessage += error.message;
      }
      
      showToast(errorMessage, 'error');
      setIsValidating(false);
      event.target.value = '';
    }
  };

  // Auto import clients without showing modal
  const autoImportClients = async (validation, parsedData) => {
    try {
      let addedCount = 0;
      let updatedCount = 0;
      const updatedClients = [...clients];

      // Process each valid client
      validation.valid.forEach((importedClient) => {
        // Check if client already exists (by NTN, CNIC, or name)
        const existingIndex = updatedClients.findIndex(c => 
          (importedClient.ntn && c.ntn === importedClient.ntn) ||
          (importedClient.cnic && c.cnic === importedClient.cnic) ||
          (importedClient.taxId && c.taxId === importedClient.taxId) ||
          (importedClient.name && c.name.toLowerCase() === importedClient.name.toLowerCase())
        );

        if (existingIndex !== -1) {
          // Update existing client - merge data
          const convertedClient = convertToAppFormat(importedClient, updatedClients[existingIndex].id);
          updatedClients[existingIndex] = {
            ...updatedClients[existingIndex],
            ...convertedClient,
            id: updatedClients[existingIndex].id, // Preserve original ID
            returns: updatedClients[existingIndex].returns, // Preserve returns count
            lastContact: updatedClients[existingIndex].lastContact, // Preserve last contact
            lastUpdated: new Date().toISOString()
          };
          updatedCount++;
        } else {
          // Add new client
          const newClient = convertToAppFormat(importedClient, Date.now() + addedCount);
          updatedClients.push(newClient);
          addedCount++;
        }
      });

      // Update clients state
      setClients(updatedClients);

      // Build success message
      let message = '✅ Import completed successfully!\n\n';
      if (addedCount > 0) {
        message += `➕ Added: ${addedCount} new client${addedCount !== 1 ? 's' : ''}\n`;
      }
      if (updatedCount > 0) {
        message += `🔄 Updated: ${updatedCount} existing client${updatedCount !== 1 ? 's' : ''}\n`;
      }
      if (validation.warnings.length > 0) {
        message += `⚠️ Warnings: ${validation.warnings.length}\n`;
      }
      if (validation.invalid.length > 0) {
        message += `❌ Skipped: ${validation.invalid.length} invalid record${validation.invalid.length !== 1 ? 's' : ''}`;
      }

      showToast(message, 'success');

      // Reset import state
      setImportFile(null);
      setImportData(null);
      setValidationResults(null);
    } catch (error) {
      console.error('Error importing clients:', error);
      showToast('Error importing clients. Please try again.', 'error');
    }
  };

  // Import validated clients
  const handleImportClients = () => {
    if (!validationResults || validationResults.valid.length === 0) {
      showToast('No valid clients to import', 'error');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      let addedCount = 0;
      let updatedCount = 0;
      const updatedClients = [...clients];

      // Process each valid client
      validationResults.valid.forEach((importedClient, index) => {
        setImportProgress(Math.round(((index + 1) / validationResults.valid.length) * 100));
        
        // Check if client already exists (by NTN or CNIC)
        const existingIndex = updatedClients.findIndex(c => 
          (importedClient.ntn && c.ntn === importedClient.ntn) ||
          (importedClient.cnic && c.cnic === importedClient.cnic) ||
          (importedClient.name && c.name.toLowerCase() === importedClient.name.toLowerCase())
        );

        if (existingIndex !== -1) {
          // Update existing client
          const convertedClient = convertToAppFormat(importedClient, updatedClients[existingIndex].id);
          updatedClients[existingIndex] = {
            ...updatedClients[existingIndex],
            ...convertedClient,
            id: updatedClients[existingIndex].id, // Preserve original ID
            lastUpdated: new Date().toISOString()
          };
          updatedCount++;
        } else {
          // Add new client
          const newClient = convertToAppFormat(importedClient, updatedClients.length + addedCount + 1);
          updatedClients.push(newClient);
          addedCount++;
        }
      });

      // Update clients state
      setClients(updatedClients);

      // Show success notification with toast
      const message = `Client data updated successfully!\n\n` +
                     `✅ Added: ${addedCount} new client${addedCount !== 1 ? 's' : ''}\n` +
                     `🔄 Updated: ${updatedCount} existing client${updatedCount !== 1 ? 's' : ''}\n` +
                     `⚠️ Warnings: ${validationResults.warnings.length}\n` +
                     `❌ Invalid: ${validationResults.invalid.length}`;
      
      showToast(message, 'success');

      // Reset import state
      setShowBulkImportModal(false);
      setImportFile(null);
      setImportData(null);
      setValidationResults(null);
      setIsImporting(false);
      setImportProgress(0);
    } catch (error) {
      console.error('Error importing clients:', error);
      showToast('Error importing clients. Please try again.', 'error');
      setIsImporting(false);
    }
  };

  // Cancel import
  const handleCancelImport = () => {
    setShowBulkImportModal(false);
    setImportFile(null);
    setImportData(null);
    setValidationResults(null);
    setIsValidating(false);
    setIsImporting(false);
    setImportProgress(0);
  };

  // Calculate client stats
  const getClientStats = () => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'Active').length;
    const totalReturns = clients.reduce((sum, c) => sum + c.returns, 0);

    return {
      totalClients,
      activeClients,
      totalReturns
    };
  };

  // Get client health indicator
  const getClientHealth = (client) => {
    const daysSinceContact = Math.floor(
      (new Date() - new Date(client.lastContact)) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceContact > 90) return { color: 'red', label: 'Needs Attention' };
    if (daysSinceContact > 30) return { color: 'yellow', label: 'Follow Up Soon' };
    return { color: 'green', label: 'Healthy' };
  };

  // Column Customization Functions
  const toggleColumn = (columnKey) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newVisibleColumns);
    localStorage.setItem('clientTableColumns', JSON.stringify(newVisibleColumns));
  };

  const handleTableDensityChange = (density) => {
    setTableDensity(density);
    localStorage.setItem('clientTableDensity', density);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
    localStorage.setItem('clientItemsPerPage', value);
  };

  // Get table row padding based on density
  const getTableRowPadding = () => {
    switch (tableDensity) {
      case 'compact': return 'py-2 px-4';
      case 'comfortable': return 'py-6 px-4';
      default: return 'py-4 px-4';
    }
  };

  // Advanced Filter Functions
  const applyAdvancedFilters = () => {
    const chips = [];
    
    if (advancedFilters.returnsMin) {
      chips.push({
        id: 'returnsMin',
        label: `Returns ≥ ${advancedFilters.returnsMin}`,
        type: 'returnsMin',
        value: advancedFilters.returnsMin
      });
    }
    
    if (advancedFilters.returnsMax) {
      chips.push({
        id: 'returnsMax',
        label: `Returns ≤ ${advancedFilters.returnsMax}`,
        type: 'returnsMax',
        value: advancedFilters.returnsMax
      });
    }
    
    setActiveFilterChips(chips);
    setShowAdvancedFilters(false);
  };

  const removeFilterChip = (chipId) => {
    const chip = activeFilterChips.find(c => c.id === chipId);
    if (chip) {
      setAdvancedFilters({
        ...advancedFilters,
        [chip.type]: ''
      });
    }
    setActiveFilterChips(activeFilterChips.filter(c => c.id !== chipId));
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      taxId: '',
      address: '',
      dateFrom: '',
      dateTo: '',
      returnsMin: '',
      returnsMax: ''
    });
    setActiveFilterChips([]);
  };

  // Tag Management Functions
  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    
    const newTag = {
      id: Date.now(),
      name: newTagName,
      color: newTagColor
    };
    
    setAvailableTags([...availableTags, newTag]);
    setNewTagName('');
    setNewTagColor('blue');
  };

  const handleToggleClientTag = (clientId, tagId) => {
    setClients(clients.map(client => {
      if (client.id === clientId) {
        const clientTags = client.tags || [];
        const hasTag = clientTags.includes(tagId);
        
        return {
          ...client,
          tags: hasTag 
            ? clientTags.filter(t => t !== tagId)
            : [...clientTags, tagId]
        };
      }
      return client;
    }));
  };

  const getClientTags = (client) => {
    if (!client.tags || client.tags.length === 0) return [];
    return availableTags.filter(tag => client.tags.includes(tag.id));
  };

  // Inline Editing Functions
  const handleStartEdit = (clientId, field, value) => {
    setEditingCell({ clientId, field });
    setEditingValue(value);
  };

  const handleSaveEdit = (clientId, field) => {
    setClients(clients.map(client => 
      client.id === clientId 
        ? { ...client, [field]: editingValue }
        : client
    ));
    setEditingCell(null);
    setEditingValue('');
  };

  const handleCancelClientEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // ========== TAX RETURNS MANAGEMENT FUNCTIONS ==========
  
  // Paginated tax returns
  const paginatedReturns = useMemo(() => {
    const startIndex = (returnCurrentPage - 1) * returnItemsPerPage;
    const endIndex = startIndex + returnItemsPerPage;
    return filteredAndSortedReturns.slice(startIndex, endIndex);
  }, [filteredAndSortedReturns, returnCurrentPage, returnItemsPerPage]);

  // Total pages for returns
  const totalReturnPages = Math.ceil(filteredAndSortedReturns.length / returnItemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setReturnCurrentPage(1);
  }, [returnSearchTerm, returnStatusFilter, returnYearFilter, returnSortBy]);

  // Update filtered returns when data changes
  useEffect(() => {
    setFilteredReturns(filteredAndSortedReturns);
  }, [filteredAndSortedReturns]);

  // Handle select return
  const handleSelectReturn = (returnId) => {
    const id = String(returnId);
    setSelectedReturns(prev => 
      prev.includes(id) 
        ? prev.filter(existingId => existingId !== id)
        : [...prev, id]
    );
  };

  // Handle select all returns
  const handleSelectAllReturns = () => {
    if (selectedReturns.length === paginatedReturns.length) {
      setSelectedReturns([]);
    } else {
      setSelectedReturns(paginatedReturns.map(r => String(r.id)));
    }
  };

  // Handle edit return
  const handleEditReturn = (returnItem) => {
    setEditingReturn(returnItem);
    setNewReturn({
      client_name: returnItem.client_name || '',
      cnic_ntn: returnItem.cnic_ntn || returnItem.cnic || returnItem.ntn || '',
      tax_year: returnItem.tax_year || '',
      return_type: returnItem.return_type || 'Section 114(1) - Voluntary Return',
      filing_date: returnItem.filing_date || new Date().toISOString().split('T')[0],
      status: returnItem.status || 'Pending'
    });
    setShowEditReturnModal(true);
  };

  // Handle save return
  const handleSaveReturn = () => {
    if (!newReturn.client_name || !newReturn.cnic_ntn || !newReturn.tax_year) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingReturn) {
      // Update existing return
      const oldData = taxReturnsData.find(r => r.id === editingReturn.id);
      
      // Save to undo stack
      addToUndoStack({
        type: 'edit',
        returnId: editingReturn.id,
        field: 'multiple',
        oldValue: oldData,
        newValue: newReturn
      });

      setTaxReturnsData(taxReturnsData.map(r => 
        r.id === editingReturn.id 
          ? { 
              ...r, 
              client_name: newReturn.client_name,
              cnic_ntn: newReturn.cnic_ntn,
              cnic: newReturn.cnic_ntn,
              ntn: newReturn.cnic_ntn,
              tax_year: newReturn.tax_year,
              return_type: newReturn.return_type,
              filing_date: newReturn.filing_date,
              status: newReturn.status
            } 
          : r
      ));

      // Track in history
      addToHistory(editingReturn.id, {
        client_name: { from: oldData.client_name, to: newReturn.client_name },
        cnic_ntn: { from: oldData.cnic_ntn, to: newReturn.cnic_ntn },
        tax_year: { from: oldData.tax_year, to: newReturn.tax_year },
        return_type: { from: oldData.return_type, to: newReturn.return_type },
        status: { from: oldData.status, to: newReturn.status }
      });
    } else {
      // Add new return
      const newReturnData = {
        id: Date.now(),
        ...newReturn,
        cnic: newReturn.cnic_ntn,
        ntn: newReturn.cnic_ntn,
        original_filename: `Manual_Entry_${Date.now()}.pdf`,
        processed_date: new Date().toISOString(),
        processed_at: new Date().toISOString()
      };
      setTaxReturnsData([...taxReturnsData, newReturnData]);

      // Save last used values for smart defaults
      updateLastUsedValues('return_type', newReturn.return_type);
      updateLastUsedValues('status', newReturn.status);
    }

    // Show auto-save indicator
    showAutoSaveIndicator();

    // Reset form
    setNewReturn({
      client_name: '',
      cnic_ntn: '',
      tax_year: new Date().getFullYear().toString(),
      return_type: 'Section 114(1) - Voluntary Return',
      filing_date: new Date().toISOString().split('T')[0],
      status: 'Pending'
    });
    setEditingReturn(null);
    setShowEditReturnModal(false);
    setShowAddReturnModal(false);
  };

  // Handle proceeding from AddReturnModal to TaxCalculationModal
  const handleAddReturnProceed = async (returnData) => {
    console.log('Add Return Proceed:', returnData);
    
    // Set the return data for TaxCalculationModal
    setSelectedReturnData({
      clientName: returnData.clientName,
      cnic: returnData.cnic,
      taxYear: returnData.taxYear,
      clientData: returnData.clientData,
      clientFolder: returnData.clientFolder,
      excelFilePath: returnData.excelFilePath,
      templateUsed: returnData.templateUsed
    });
    
    // Close AddReturnModal
    setShowAddReturnModal(false);
    
    // Open TaxCalculationModal
    setShowTaxCalculationModal(true);
  };
  
  // Handle saving tax calculation data
  const handleSaveTaxCalculation = (taxData) => {
    console.log('Tax Calculation Saved:', taxData);
    
    // Create new return entry
    const newReturnEntry = {
      id: Date.now(),
      client_name: taxData.personalInfo.name,
      cnic_ntn: taxData.personalInfo.cnic || taxData.personalInfo.ntn,
      tax_year: taxData.personalInfo.taxYear,
      total_income: taxData.taxComputation.totalIncome,
      taxable_income: taxData.taxComputation.taxableIncome,
      tax_chargeable: taxData.taxComputation.taxChargeable,
      refund_amount: taxData.taxComputation.refundDue,
      return_type: 'Section 114(1) - Voluntary Return',
      filing_date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      created_at: new Date().toISOString()
    };
    
    // Add to tax returns data
    setTaxReturnsData(prev => [...prev, newReturnEntry]);
    
    // Close TaxCalculationModal
    setShowTaxCalculationModal(false);
    setSelectedReturnData(null);
    
    // Show success message
    showToast({
      type: 'success',
      message: `Tax return created for ${taxData.personalInfo.name}`,
      duration: 5000
    });
    
    // Switch to returns tab
    setActiveTab('returns');
  };

  // Handle delete return
  const handleDeleteReturn = (returnId) => {
    if (confirm('Are you sure you want to delete this tax return?')) {
      setTaxReturnsData(taxReturnsData.filter(r => r.id !== returnId));
      setSelectedReturns(selectedReturns.filter(id => id !== String(returnId)));
    }
  };

  // Handle bulk delete returns
  const handleBulkDeleteReturns = () => {
    if (selectedReturns.length === 0) {
      alert('Please select returns to delete');
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedReturns.length} tax return(s)?`)) {
      setTaxReturnsData(taxReturnsData.filter(r => !selectedReturns.includes(String(r.id))));
      setSelectedReturns([]);
    }
  };

  // Handle status update
  const handleUpdateStatus = (returnItem) => {
    setStatusUpdateReturn(returnItem);
    setShowStatusModal(true);
  };

  // Handle save status
  const handleSaveStatus = (newStatus) => {
    if (statusUpdateReturn) {
      setTaxReturnsData(taxReturnsData.map(r => 
        r.id === statusUpdateReturn.id 
          ? { ...r, status: newStatus } 
          : r
      ));
      setStatusUpdateReturn(null);
      setShowStatusModal(false);
    }
  };

  // Handle PDF preview
  const handlePreviewPDF = (returnItem) => {
    setPreviewReturnPDF(returnItem);
    setShowPDFPreview(true);
  };

  // Handle file upload with error handling
  const handleReturnFileUpload = async (files) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      for (const file of files) {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          setUploadError('Only PDF files are allowed');
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setUploadError('File size must be less than 10MB');
          continue;
        }

        // Use client-side extraction (no server required)
        console.log('Extracting data from:', file.name);
        
        // Check if file already has extracted data (from folder processing)
        let extractedData = file.extractedData;
        
        if (!extractedData) {
          // Import the extraction function dynamically
          const { extractDataFromPDF } = await import('./utils/pdfExtractor');
          extractedData = await extractDataFromPDF(file);
        }
        
        console.log('Extracted data:', extractedData);
        
        if (extractedData.success || extractedData.name) {
          // Validate required fields
          if (!extractedData.name || extractedData.name === 'Unknown') {
            setUploadError(`Failed to extract client name from ${file.name}. Please ensure the PDF contains valid data.`);
            continue;
          }

          if (!extractedData.cnicNtn) {
            setUploadError(`Failed to extract CNIC/NTN from ${file.name}. Please ensure the PDF contains valid data.`);
            continue;
          }

          if (!extractedData.taxYear) {
            setUploadError(`Failed to extract tax year from ${file.name}. Please ensure the PDF contains valid data.`);
            continue;
          }

          // Check for duplicates (same client + same year)
          const duplicate = taxReturnsData.find(r => 
            r.cnic_ntn === extractedData.cnicNtn && 
            r.tax_year === extractedData.taxYear
          );

          if (duplicate) {
            setUploadError(`Duplicate detected: A return for ${extractedData.name} (${extractedData.cnicNtn}) for year ${extractedData.taxYear} already exists. Please review existing records.`);
            continue;
          }

          // Add to tax returns data with standardized field names
          const newReturn = {
            id: Date.now() + Math.random(),
            client_name: extractedData.name,
            cnic_ntn: extractedData.cnicNtn,
            cnic: extractedData.cnicNtn,
            ntn: extractedData.cnicNtn,
            tax_year: extractedData.taxYear,
            total_income: extractedData.total_income || '',
            taxable_income: extractedData.taxable_income || '',
            tax_chargeable: extractedData.tax_chargeable || '',
            refund_amount: extractedData.refund_amount || '',
            return_type: 'Section 114(1) - Voluntary Return',
            original_filename: file.name,
            filing_date: new Date().toISOString().split('T')[0],
            processed_date: new Date().toISOString(),
            processed_at: new Date().toISOString(),
            status: 'Processed'
          };
          
          setTaxReturnsData(prev => [...prev, newReturn]);
          setUploadSuccess(`Successfully processed: ${file.name}`);
        } else {
          setUploadError(extractedData.error || 'Failed to extract data from PDF');
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle export selected returns
  const handleExportSelectedReturns = () => {
    if (selectedReturns.length === 0) {
      alert('Please select returns to export');
      return;
    }

    const returnsToExport = taxReturnsData.filter(r => selectedReturns.includes(String(r.id)));

    try {
      const result = exportTaxReturns(returnsToExport, EXPORT_FORMATS.STANDARD);
      if (result.success) {
        alert(`Successfully exported ${result.recordCount} selected return(s) to ${result.fileName}`);
      } else {
        throw new Error(result.error || 'Unknown export error');
      }
    } catch (error) {
      console.error('Error exporting selected returns:', error);
      alert(`Failed to export selected returns: ${error.message}`);
    }
  };

  // Get return statistics
  const getReturnStats = () => {
    const total = taxReturnsData.length;
    const filed = taxReturnsData.filter(r => r.status === 'Filed').length;
    const pending = taxReturnsData.filter(r => r.status === 'Pending').length;
    const processed = taxReturnsData.filter(r => r.status === 'Processed').length;
    
    return { total, filed, pending, processed };
  };

  // ========== ENHANCED FEATURES FUNCTIONS ==========

  // Helper functions (must be defined first)
  const showAutoSaveIndicator = () => {
    setAutoSaveStatus('saving');
    setTimeout(() => {
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(''), 2000);
    }, 500);
  };

  const addToUndoStack = (action) => {
    setUndoStack(prev => [...prev, action]);
    setRedoStack([]); // Clear redo stack when new action is performed
  };

  const addToHistory = (returnId, changes) => {
    const historyEntry = {
      timestamp: new Date().toISOString(),
      changes,
      user: 'Admin User'
    };

    setReturnHistory(prev => ({
      ...prev,
      [returnId]: [...(prev[returnId] || []), historyEntry]
    }));
  };

  // 1. Inline Editing
  const handleStartInlineEdit = (returnId, field, value) => {
    setInlineEditCell({ returnId, field });
    setInlineEditValue(value || '');
  };

  const handleSaveInlineEdit = () => {
    if (!inlineEditCell) return;

    const { returnId, field } = inlineEditCell;
    const oldData = taxReturnsData.find(r => r.id === returnId);
    
    // Save to undo stack
    addToUndoStack({
      type: 'edit',
      returnId,
      field,
      oldValue: oldData[field],
      newValue: inlineEditValue
    });

    // Update data
    setTaxReturnsData(taxReturnsData.map(r => 
      r.id === returnId ? { ...r, [field]: inlineEditValue } : r
    ));

    // Track in history
    addToHistory(returnId, { [field]: { from: oldData[field], to: inlineEditValue } });

    // Show auto-save indicator
    showAutoSaveIndicator();

    setInlineEditCell(null);
    setInlineEditValue('');
  };

  const handleCancelInlineEdit = () => {
    setInlineEditCell(null);
    setInlineEditValue('');
  };

  // 2. Quick Actions Context Menu
  const handleContextMenu = (e, returnItem) => {
    e.preventDefault();
    setContextMenuReturn(returnItem);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleCloseContextMenu = () => {
    setContextMenuReturn(null);
  };

  // 3. Bulk Status Update
  const handleBulkStatusUpdate = (newStatus) => {
    if (selectedReturns.length === 0) {
      alert('Please select returns to update');
      return;
    }

    const oldData = taxReturnsData.filter(r => selectedReturns.includes(String(r.id)));
    
    // Save to undo stack
    addToUndoStack({
      type: 'bulkStatusUpdate',
      returns: oldData.map(r => ({ id: r.id, oldStatus: r.status })),
      newStatus
    });

    // Update statuses
    setTaxReturnsData(taxReturnsData.map(r => 
      selectedReturns.includes(String(r.id)) ? { ...r, status: newStatus } : r
    ));

    // Track in history for each return
    selectedReturns.forEach(id => {
      const oldReturn = oldData.find(r => String(r.id) === id);
      addToHistory(id, { status: { from: oldReturn?.status || 'Unknown', to: newStatus } });
    });

    showAutoSaveIndicator();
    setShowBulkStatusModal(false);
    setSelectedReturns([]);
  };

  // 4. Advanced Filters
  const applyAdvancedReturnFilters = () => {
    setShowAdvancedFilters(false);
    // Filters are applied automatically through filteredAndSortedReturns useMemo
  };

  const clearAdvancedReturnFilters = () => {
    setAdvancedReturnFilters({
      dateFrom: '',
      dateTo: '',
      returnTypes: [],
      clientName: ''
    });
  };

  // 5. Saved Filter Presets
  const applySavedPreset = (preset) => {
    setActiveFilterPresetId(preset.id);
    if (preset.filters.status) setReturnStatusFilter(preset.filters.status);
    if (preset.filters.year) setReturnYearFilter(preset.filters.year);
    if (preset.filters.dateFrom) {
      setAdvancedReturnFilters(prev => ({ ...prev, dateFrom: preset.filters.dateFrom }));
    }
  };

  const saveCurrentFiltersAsPreset = (name) => {
    const newPreset = {
      id: Date.now(),
      name,
      filters: {
        status: returnStatusFilter !== 'All Status' ? returnStatusFilter : null,
        year: returnYearFilter !== 'All Years' ? returnYearFilter : null,
        search: returnSearchTerm || null,
        ...advancedReturnFilters
      }
    };
    setSavedFilterPresets([...savedFilterPresets, newPreset]);
    localStorage.setItem('returnFilterPresets', JSON.stringify([...savedFilterPresets, newPreset]));
  };

  const deleteFilterPreset = (presetId) => {
    const updated = savedFilterPresets.filter(p => p.id !== presetId);
    setSavedFilterPresets(updated);
    localStorage.setItem('returnFilterPresets', JSON.stringify(updated));
    if (activeFilterPresetId === presetId) setActiveFilterPresetId(null);
  };

  // 6. Column Customization
  const toggleReturnColumn = (columnKey) => {
    const updated = { ...visibleReturnColumns, [columnKey]: !visibleReturnColumns[columnKey] };
    setVisibleReturnColumns(updated);
    localStorage.setItem('visibleReturnColumns', JSON.stringify(updated));
  };

  const resetColumns = () => {
    const defaultColumns = {
      checkbox: true,
      clientName: true,
      cnicNtn: true,
      taxYear: true,
      returnType: true,
      filingDate: true,
      status: true,
      actions: true
    };
    setVisibleReturnColumns(defaultColumns);
    localStorage.setItem('visibleReturnColumns', JSON.stringify(defaultColumns));
  };

  // 7. Table Density
  const changeTableDensity = (density) => {
    setReturnTableDensity(density);
    localStorage.setItem('returnTableDensity', density);
  };

  const getTableRowClass = () => {
    switch (returnTableDensity) {
      case 'compact': return 'py-2 px-3';
      case 'comfortable': return 'py-6 px-5';
      default: return 'py-4 px-4';
    }
  };

  // 9. Undo/Redo
  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const lastAction = undoStack[undoStack.length - 1];
    
    if (lastAction.type === 'edit') {
      setTaxReturnsData(taxReturnsData.map(r => 
        r.id === lastAction.returnId 
          ? { ...r, [lastAction.field]: lastAction.oldValue }
          : r
      ));
    } else if (lastAction.type === 'delete') {
      setTaxReturnsData([...taxReturnsData, lastAction.returnData]);
    } else if (lastAction.type === 'bulkStatusUpdate') {
      setTaxReturnsData(taxReturnsData.map(r => {
        const oldReturn = lastAction.returns.find(ret => ret.id === r.id);
        return oldReturn ? { ...r, status: oldReturn.oldStatus } : r;
      }));
    }

    setRedoStack([...redoStack, lastAction]);
    setUndoStack(undoStack.slice(0, -1));
    showAutoSaveIndicator();
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const lastRedo = redoStack[redoStack.length - 1];
    
    if (lastRedo.type === 'edit') {
      setTaxReturnsData(taxReturnsData.map(r => 
        r.id === lastRedo.returnId 
          ? { ...r, [lastRedo.field]: lastRedo.newValue }
          : r
      ));
    } else if (lastRedo.type === 'delete') {
      setTaxReturnsData(taxReturnsData.filter(r => r.id !== lastRedo.returnData.id));
    } else if (lastRedo.type === 'bulkStatusUpdate') {
      setTaxReturnsData(taxReturnsData.map(r => 
        lastRedo.returns.find(ret => ret.id === r.id) 
          ? { ...r, status: lastRedo.newStatus }
          : r
      ));
    }

    setUndoStack([...undoStack, lastRedo]);
    setRedoStack(redoStack.slice(0, -1));
    showAutoSaveIndicator();
  };

  // 10. Version History
  const getReturnHistory = (returnId) => {
    return returnHistory[returnId] || [];
  };

  // 11. Smart Defaults
  const applySmartDefaults = () => {
    setNewReturn(prev => ({
      ...prev,
      return_type: lastUsedValues.return_type,
      status: lastUsedValues.status
    }));
  };

  const updateLastUsedValues = (field, value) => {
    setLastUsedValues(prev => ({ ...prev, [field]: value }));
    localStorage.setItem('lastUsedReturnValues', JSON.stringify({ ...lastUsedValues, [field]: value }));
  };

  // 12. Search History
  const addToSearchHistory = (searchTerm) => {
    if (!searchTerm || searchHistory.includes(searchTerm)) return;
    const updated = [searchTerm, ...searchHistory.slice(0, 9)]; // Keep last 10
    setSearchHistory(updated);
    localStorage.setItem('returnSearchHistory', JSON.stringify(updated));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('returnSearchHistory');
  };

  // 13. Smart Suggestions
  const generateSearchSuggestions = (input) => {
    if (!input || input.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const suggestions = new Set();
    
    taxReturnsData.forEach(r => {
      if (r.client_name?.toLowerCase().includes(input.toLowerCase())) {
        suggestions.add(r.client_name);
      }
      if (r.cnic_ntn?.toLowerCase().includes(input.toLowerCase())) {
        suggestions.add(r.cnic_ntn);
      }
      if (r.tax_year?.includes(input)) {
        suggestions.add(r.tax_year);
      }
    });

    setSearchSuggestions(Array.from(suggestions).slice(0, 5));
  };

  // Load saved preferences on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem('visibleReturnColumns');
    const savedDensity = localStorage.getItem('returnTableDensity');
    const savedPresets = localStorage.getItem('returnFilterPresets');
    const savedSearchHistory = localStorage.getItem('returnSearchHistory');
    const savedLastUsed = localStorage.getItem('lastUsedReturnValues');

    if (savedColumns) setVisibleReturnColumns(JSON.parse(savedColumns));
    if (savedDensity) setReturnTableDensity(savedDensity);
    if (savedPresets) setSavedFilterPresets(JSON.parse(savedPresets));
    if (savedSearchHistory) setSearchHistory(JSON.parse(savedSearchHistory));
    if (savedLastUsed) setLastUsedValues(JSON.parse(savedLastUsed));
  }, []);

  // Update search suggestions when search term changes
  useEffect(() => {
    generateSearchSuggestions(returnSearchTerm);
  }, [returnSearchTerm, taxReturnsData]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => handleCloseContextMenu();
    if (contextMenuReturn) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenuReturn]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z or Cmd+Z for Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Y or Cmd+Shift+Z for Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        handleRedo();
      }
      // Escape to close inline edit
      if (e.key === 'Escape' && inlineEditCell) {
        handleCancelInlineEdit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, inlineEditCell]);

  // ========== DOCUMENT MANAGEMENT FUNCTIONS ==========
  
  // Load documents for a client
  useEffect(() => {
    const allDocs = loadDocumentsFromStorage();
    setClientDocuments(allDocs);
  }, []);

  // Open document manager for a client
  const handleOpenDocuments = (client) => {
    setSelectedClientForDocs(client);
    setShowDocumentModal(true);
  };

  // Handle document upload
  const handleUploadDocument = async (file, category, notes = '', expiryDate = null) => {
    if (!selectedClientForDocs) return;

    // Validate file
    if (!validateFileType(file)) {
      alert('Invalid file type. Please upload PDF, JPG, PNG, DOC, or DOCX files.');
      return;
    }

    if (!validateFileSize(file)) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    setUploadingDocument(true);

    try {
      // Create document object
      const document = await createDocumentObject(
        file,
        category,
        selectedClientForDocs.id,
        notes,
        expiryDate
      );

      // Get existing documents for this client
      const existingDocs = loadDocumentsFromStorage(selectedClientForDocs.id);
      const updatedDocs = [...existingDocs, document];

      // Save to storage
      saveDocumentsToStorage(selectedClientForDocs.id, updatedDocs);

      // Update state
      setClientDocuments({
        ...clientDocuments,
        [selectedClientForDocs.id]: updatedDocs
      });

      alert('Document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error uploading document. Please try again.');
    } finally {
      setUploadingDocument(false);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = (documentId) => {
    if (!selectedClientForDocs) return;

    if (!confirm('Are you sure you want to delete this document?')) return;

    deleteDocumentFromStorage(selectedClientForDocs.id, documentId);

    // Update state
    const updatedDocs = loadDocumentsFromStorage(selectedClientForDocs.id);
    setClientDocuments({
      ...clientDocuments,
      [selectedClientForDocs.id]: updatedDocs
    });

    alert('Document deleted successfully!');
  };

  // Handle document preview
  const handlePreviewDocument = (document) => {
    setPreviewDocument(document);
    setShowDocumentPreview(true);
  };

  // Handle document download
  const handleDownloadDocument = (document) => {
    // Create a download link
    const link = window.document.createElement('a');
    link.href = document.data;
    link.download = document.name;
    link.click();
  };

  // Get documents for current client
  const getCurrentClientDocuments = () => {
    if (!selectedClientForDocs) return [];
    
    let docs = clientDocuments[selectedClientForDocs.id] || [];
    
    // Apply category filter
    if (documentFilter !== 'All') {
      docs = filterDocumentsByCategory(docs, documentFilter);
    }
    
    return docs;
  };

  const stats = [
    { label: 'Total Clients', value: '1,234', change: '+12%', icon: Users, color: 'blue' },
    { label: 'Active Returns', value: '456', change: '+8%', icon: FileText, color: 'green' },
    { label: 'Pending Reviews', value: '89', change: '-5%', icon: Calendar, color: 'orange' },
  ];

  const recentActivity = [
    { client: 'John Smith', action: 'Tax Return Filed', time: '2 hours ago', status: 'completed' },
    { client: 'Sarah Johnson', action: 'Document Uploaded', time: '4 hours ago', status: 'pending' },
    { client: 'Mike Davis', action: 'Payment Received', time: '1 day ago', status: 'completed' },
    { client: 'Emily Brown', action: 'Consultation Scheduled', time: '2 days ago', status: 'upcoming' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] dark:bg-gray-900 text-white dark:text-gray-100 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-black/40 dark:bg-gray-800 backdrop-blur-xl border-r border-white/10 dark:border-gray-700 p-6 transition-colors duration-200">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Tax Suite</h2>
            <p className="text-xs text-gray-500">Admin Portal</p>
          </div>
        </div>

        <nav className="space-y-2 mb-6">
          {[
            { icon: LayoutDashboard, label: 'Overview', id: 'overview' },
            { icon: FileText, label: 'Tax Returns', id: 'returns' },
            { icon: Users, label: 'Clients', id: 'clients' },
            { icon: Calendar, label: 'Schedule', id: 'schedule' },

          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'hover:bg-white/5 text-gray-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="mb-6 px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Theme</span>
          </div>
          <ThemeToggle />
        </div>

        {/* Admin Profile Section */}
        <div className="absolute bottom-24 left-6 right-6">
          <div className="relative">
            <button
              onClick={() => setShowAdminMenu(!showAdminMenu)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-sm font-bold">
                  AD
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Admin User</p>
                  <p className="text-xs text-gray-500">admin@firm.com</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdminMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showAdminMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                >
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setShowAdminMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-gray-300"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setShowAdminMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-gray-300"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('security');
                      setShowAdminMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-gray-300"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Security</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('privacy');
                      setShowAdminMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-gray-300"
                  >
                    <Lock className="w-4 h-4" />
                    <span className="text-sm">Privacy</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('appearance');
                      setShowAdminMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-gray-300 border-t border-white/10"
                  >
                    <Palette className="w-4 h-4" />
                    <span className="text-sm">Appearance</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="absolute bottom-6 left-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-all border border-red-500/20"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Premium Header with 3D Icons */}
        {activeTab === 'overview' && (
          <div className="mb-8">
            {/* Premium Welcome Banner */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 rounded-3xl p-8 mb-6 text-white shadow-2xl relative overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-3 drop-shadow-lg">Welcome back, Admin</h1>
                    
                    {/* Custom Message Section */}
                    {!isEditingMessage ? (
                      <div className="flex items-start gap-3 group">
                        <p className="text-blue-50 text-lg leading-relaxed flex-1">{customMessage}</p>
                        <button
                          onClick={() => setIsEditingMessage(true)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/20 rounded-lg"
                          title="Edit message"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          value={tempMessage}
                          onChange={(e) => setTempMessage(e.target.value)}
                          className="w-full bg-white/20 backdrop-blur-sm text-white placeholder-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                          rows="2"
                          placeholder="Enter your custom message..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveMessage}
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors font-medium"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelMessageEdit}
                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 3D Time & Date Cards */}
                  <div className="flex gap-4">
                    {/* Clock Card with 3D Effect */}
                    <motion.div 
                      whileHover={{ scale: 1.05, rotateY: 5 }}
                      className="bg-white/15 backdrop-blur-md border border-white/20 px-6 py-4 rounded-2xl shadow-2xl transform transition-all duration-300"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-50 animate-pulse"></div>
                          <Clock className="w-8 h-8 relative z-10 drop-shadow-lg" strokeWidth={2.5} />
                        </div>
                        <div className="text-sm text-blue-100 font-medium">Current Time</div>
                      </div>
                      <div className="text-2xl font-bold tracking-wide drop-shadow-md">
                        {currentTime.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true 
                        })}
                      </div>
                    </motion.div>
                    
                    {/* Calendar Card with 3D Effect */}
                    <motion.div 
                      whileHover={{ scale: 1.05, rotateY: -5 }}
                      className="bg-white/15 backdrop-blur-md border border-white/20 px-6 py-4 rounded-2xl shadow-2xl transform transition-all duration-300"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="relative">
                          <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-50 animate-pulse"></div>
                          <Calendar className="w-8 h-8 relative z-10 drop-shadow-lg" strokeWidth={2.5} />
                        </div>
                        <div className="text-sm text-blue-100 font-medium">Today's Date</div>
                      </div>
                      <div className="text-2xl font-bold tracking-wide drop-shadow-md">
                        {currentTime.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Notifications Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <button className="relative p-2 bg-black/40 border border-white/10 rounded-xl hover:bg-white/5 transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        )}

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-${stat.color}-600/20`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                    </div>
                    <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Deadline Tracking Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Upcoming Deadlines */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-400" />
                    <h2 className="text-xl font-bold">Upcoming Deadlines</h2>
                  </div>
                  <button className="text-blue-400 text-sm hover:underline flex items-center gap-1">
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No upcoming deadlines</p>
                  </div>
                </div>
              </motion.div>

              {/* Deadline Statistics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-bold">Deadline Overview</h2>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Overdue</span>
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    </div>
                    <p className="text-3xl font-bold text-red-400">0</p>
                    <p className="text-xs text-red-400/60 mt-1">Requires immediate attention</p>
                  </div>

                  <div className="p-4 bg-orange-600/10 border border-orange-500/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Due in 3 Days</span>
                      <Zap className="w-4 h-4 text-orange-400" />
                    </div>
                    <p className="text-3xl font-bold text-orange-400">0</p>
                    <p className="text-xs text-orange-400/60 mt-1">Urgent action needed</p>
                  </div>

                  <div className="p-4 bg-yellow-600/10 border border-yellow-500/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">This Week</span>
                      <Clock className="w-4 h-4 text-yellow-400" />
                    </div>
                    <p className="text-3xl font-bold text-yellow-400">0</p>
                    <p className="text-xs text-yellow-400/60 mt-1">Plan ahead</p>
                  </div>

                  <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">This Month</span>
                      <Calendar className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold text-blue-400">0</p>
                    <p className="text-xs text-blue-400/60 mt-1">Good time to prepare</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Recent Activity</h2>
                <button className="text-blue-400 text-sm hover:underline flex items-center gap-1">
                  View All
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-black/20 rounded-xl hover:bg-black/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold">
                        {activity.client.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium">{activity.client}</p>
                        <p className="text-sm text-gray-400">{activity.action}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                        activity.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-blue-600/20 text-blue-400'
                      }`}>
                        {activity.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Dashboard Analytics */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Tax Returns Analytics</h2>
                <button 
                  onClick={() => setShowReportsModal(true)}
                  className="px-4 py-2 bg-blue-600/20 text-blue-400 font-semibold rounded-xl hover:bg-blue-600/30 transition-all flex items-center gap-2 border border-blue-500/30"
                >
                  <Download className="w-4 h-4" />
                  Export Reports
                </button>
              </div>
              <DashboardAnalytics returns={taxReturnsData} />
            </div>
          </>
        )}

        {/* Reports Modal */}
        {showReportsModal && (
          <ReportsModal
            returns={taxReturnsData}
            onClose={() => setShowReportsModal(false)}
          />
        )}

        {/* My Profile Tab Content - PREMIUM VERSION */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">My Profile</h1>
                <p className="text-gray-400">Manage your professional profile and account settings</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Premium Account
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Profile Completion Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-blue-400">Profile Strength</h3>
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-white/10" />
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray="351.86" strokeDashoffset="70.37" className="text-blue-500" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-bold text-blue-400">80%</span>
                    <span className="text-xs text-gray-400">Complete</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Add Bio</span>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Upload Avatar</span>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Add Credentials</span>
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Enable 2FA</span>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                </div>
              </motion.div>

              {/* Performance Stats */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-green-400">This Month</h3>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Clients Served</span>
                      <span className="text-2xl font-bold text-green-400">47</span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{width: '78%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Returns Filed</span>
                      <span className="text-2xl font-bold text-green-400">32</span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{width: '64%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Avg Response Time</span>
                      <span className="text-2xl font-bold text-green-400">2.4h</span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{width: '92%'}}></div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-purple-400">Achievements</h3>
                  <Award className="w-5 h-5 text-purple-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-yellow-600/20 flex items-center justify-center">
                      <Award className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Top Performer</p>
                      <p className="text-xs text-gray-400">Q1 2026</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Fast Responder</p>
                      <p className="text-xs text-gray-400">100+ quick replies</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Client Favorite</p>
                      <p className="text-xs text-gray-400">4.9/5.0 rating</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Main Profile Card */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6">
              <div className="flex items-start gap-6 mb-8">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-4xl font-bold relative overflow-hidden group cursor-pointer">
                    AD
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-black flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold">Admin User</h2>
                    <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-semibold">PRO</span>
                  </div>
                  <p className="text-gray-400 mb-1">System Administrator • Tax Consultant</p>
                  <p className="text-sm text-gray-500 mb-4">Member since January 2024 • 15 years experience</p>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all border border-blue-500/30 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Change Avatar
                    </button>
                    <button className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-all border border-purple-500/30 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download QR Code
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    value="Admin User"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                  <input
                    type="email"
                    value="admin@firm.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value="+1 (555) 123-4567"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                  <input
                    type="text"
                    value="System Administrator"
                    disabled
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">License Number</label>
                  <input
                    type="text"
                    value="TX-2024-12345"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Specialization</label>
                  <select className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                    <option>Corporate Tax Law</option>
                    <option>Individual Tax Planning</option>
                    <option>International Tax</option>
                    <option>Estate Planning</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Professional Bio</label>
                  <textarea
                    rows="3"
                    value="Experienced tax consultant with 15+ years in corporate and individual tax planning. Specialized in complex tax situations and IRS representation."
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button className="px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all">
                  Cancel
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Professional Credentials */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Professional Credentials
                  </h3>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">+ Add</button>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-black/20 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">CPA License</span>
                      <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Verified</span>
                    </div>
                    <p className="text-sm text-gray-400">License #: TX-CPA-12345</p>
                    <p className="text-xs text-gray-500 mt-1">Expires: Dec 31, 2026</p>
                  </div>
                  <div className="p-4 bg-black/20 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Bar Association</span>
                      <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Active</span>
                    </div>
                    <p className="text-sm text-gray-400">Member ID: BAR-2024-789</p>
                    <p className="text-xs text-gray-500 mt-1">Since: January 2010</p>
                  </div>
                  <div className="p-4 bg-black/20 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Tax Practitioner</span>
                      <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Current</span>
                    </div>
                    <p className="text-sm text-gray-400">Registration #: TP-2024-456</p>
                    <p className="text-xs text-gray-500 mt-1">Renewed: Jan 1, 2026</p>
                  </div>
                </div>
              </div>

              {/* Security & Privacy */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Lock className="w-5 h-5 text-green-400" />
                    Security & Privacy
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">Two-Factor Auth</p>
                        <p className="text-xs text-gray-400">Authenticator app</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-xs font-medium">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">Active Sessions</p>
                        <p className="text-xs text-gray-400">3 devices</p>
                      </div>
                    </div>
                    <button className="text-blue-400 hover:text-blue-300 text-sm">Manage</button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium">Last Login</p>
                        <p className="text-xs text-gray-400">Today at 2:45 PM</p>
                      </div>
                    </div>
                    <button className="text-purple-400 hover:text-purple-300 text-sm">History</button>
                  </div>
                  <button className="w-full px-4 py-3 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition-all border border-red-500/30 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-400" />
                  Recent Activity
                </h3>
                <button className="text-blue-400 hover:text-blue-300 text-sm">View All</button>
              </div>
              <div className="space-y-4">
                {[
                  { action: 'Updated client profile', client: 'John Smith', time: '2 hours ago', icon: User, color: 'blue' },
                  { action: 'Filed tax return', client: 'Sarah Johnson', time: '5 hours ago', icon: FileCheck, color: 'green' },
                  { action: 'Scheduled meeting', client: 'Mike Davis', time: '1 day ago', icon: Calendar, color: 'purple' },
                  { action: 'Generated response', client: 'David Wilson', time: '3 days ago', icon: FileText, color: 'indigo' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-black/20 rounded-xl hover:bg-black/30 transition-all">
                    <div className={`w-10 h-10 rounded-full bg-${activity.color}-600/20 flex items-center justify-center`}>
                      <activity.icon className={`w-5 h-5 text-${activity.color}-400`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-400">{activity.client}</p>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Clients Tab Content */}
        {activeTab === 'clients' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-1">Clients</h1>
                <p className="text-gray-400">Manage your client database</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowTaskModal(true)}
                  className="px-4 py-2 bg-purple-600/20 text-purple-400 font-semibold rounded-xl hover:bg-purple-600/30 transition-all flex items-center gap-2 border border-purple-500/30"
                >
                  <CheckSquare className="w-4 h-4" />
                  Tasks ({clientTasks.filter(t => t.status === 'pending').length})
                </button>
                <button 
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 bg-green-600/20 text-green-400 font-semibold rounded-xl hover:bg-green-600/30 transition-all flex items-center gap-2 border border-green-500/30"
                  title="Download Excel template for bulk import"
                >
                  <Download className="w-4 h-4" />
                  Template
                </button>
                <button 
                  onClick={() => document.getElementById('excel-upload-input').click()}
                  className="px-4 py-2 bg-orange-600/20 text-orange-400 font-semibold rounded-xl hover:bg-orange-600/30 transition-all flex items-center gap-2 border border-orange-500/30"
                  title="Import clients from Excel file"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </button>
                <input
                  id="excel-upload-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelFileUpload}
                  className="hidden"
                />
                <button 
                  onClick={handleExportClients}
                  className="px-4 py-2 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 border border-white/10"
                  title="Export clients to Excel"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button 
                  onClick={() => setShowClientModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Client
                </button>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
              {selectedClients.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 bg-blue-600/20 border border-blue-500/30 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckSquare className="w-5 h-5 text-blue-400" />
                      <span className="font-medium text-blue-400">
                        {selectedClients.length} client{selectedClients.length > 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSendBulkEmail}
                        className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-all flex items-center gap-2 border border-green-500/30"
                      >
                        <Mail className="w-4 h-4" />
                        Send Email
                      </button>
                      <button
                        onClick={handleSendBulkSMS}
                        className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-all flex items-center gap-2 border border-purple-500/30"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Send SMS
                      </button>
                      <button
                        onClick={() => setSelectedClients([])}
                        className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all flex items-center gap-2 border border-red-500/30"
                      >
                        <X className="w-4 h-4" />
                        Clear
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Saved Filter Presets */}
            <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-2">
              <span className="text-sm text-gray-400 whitespace-nowrap">Quick Filters:</span>
              {savedFilters.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyFilterPreset(preset)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeFilterPreset === preset.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Zap className="w-3 h-3 inline mr-1" />
                  {preset.name}
                </button>
              ))}
              
              {/* Smart Income Category Quick Filters */}
              <button
                onClick={() => setClientIncomeCategoryFilter(clientIncomeCategoryFilter === 'Salary Only' ? 'All Categories' : 'Salary Only')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  clientIncomeCategoryFilter === 'Salary Only'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <User className="w-3 h-3 inline mr-1" />
                Salary Only Clients
              </button>
              
              <button
                onClick={() => setClientIncomeCategoryFilter(clientIncomeCategoryFilter === 'Business Income' ? 'All Categories' : 'Business Income')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  clientIncomeCategoryFilter === 'Business Income'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Briefcase className="w-3 h-3 inline mr-1" />
                Business Clients
              </button>
              
              {(clientSearchTerm || clientStatusFilter !== 'All Status' || clientBusinessTypeFilter !== 'All Types' || clientIncomeCategoryFilter !== 'All Categories' || activeFilterPreset) && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-all whitespace-nowrap"
                >
                  <X className="w-3 h-3 inline mr-1" />
                  Clear All
                </button>
              )}
            </div>

            {/* Client Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {(() => {
                const clientStats = getClientStats();
                const inactiveClients = clients.filter(c => c.status === 'Inactive').length;
                const pendingClients = clients.filter(c => c.status === 'Pending').length;
                const needsFollowUp = clients.filter(c => {
                  const daysSinceContact = Math.floor((new Date() - new Date(c.lastContact)) / (1000 * 60 * 60 * 24));
                  return daysSinceContact > 30;
                }).length;
                const businessClients = clients.filter(c => c.businessType === 'Business' || c.businessType === 'Corporation').length;
                
                return [
                  { label: 'Total Clients', value: clientStats.totalClients, icon: Users, color: 'blue', change: '+12%' },
                  { label: 'Active Clients', value: clientStats.activeClients, icon: UserCheck, color: 'green', change: '+8%' },
                  { label: 'Needs Follow-Up', value: needsFollowUp, icon: AlertCircle, color: 'orange', change: `${needsFollowUp} clients` },
                  { label: 'Business Clients', value: businessClients, icon: Briefcase, color: 'purple', change: `${Math.round((businessClients/clients.length)*100)}%` },
                  { label: 'Total Returns', value: clientStats.totalReturns, icon: FileText, color: 'indigo', change: '+18%' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg bg-${stat.color}-600/20`}>
                        <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                      </div>
                      <span className="text-xs font-medium text-green-400">{stat.change}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{stat.value}</h3>
                    <p className="text-gray-400 text-xs">{stat.label}</p>
                  </motion.div>
                ));
              })()}
            </div>

            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              {/* Enhanced Filter Bar */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-6">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    placeholder="Search clients by name, email, or phone..."
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                
                <div className="flex gap-3 w-full lg:w-auto">
                  <select 
                    value={clientStatusFilter}
                    onChange={(e) => setClientStatusFilter(e.target.value)}
                    className="flex-1 lg:flex-none bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Pending</option>
                  </select>
                  
                  <select 
                    value={clientBusinessTypeFilter}
                    onChange={(e) => setClientBusinessTypeFilter(e.target.value)}
                    className="flex-1 lg:flex-none bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option>All Types</option>
                    <option>Individual</option>
                    <option>Business</option>
                    <option>Self-Employed</option>
                    <option>Partnership</option>
                    <option>Corporation</option>
                  </select>

                  {/* Advanced Filters Button */}
                  <button 
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="px-4 py-3 bg-purple-600/20 text-purple-400 rounded-xl hover:bg-purple-600/30 transition-all flex items-center gap-2 border border-purple-500/30"
                    title="Advanced Filters"
                  >
                    <Filter className="w-4 h-4" />
                    <span className="hidden lg:inline">Advanced</span>
                    {activeFilterChips.length > 0 && (
                      <span className="px-2 py-0.5 bg-purple-600 text-white rounded-full text-xs font-semibold">
                        {activeFilterChips.length}
                      </span>
                    )}
                  </button>

                  {/* Column Customizer Button */}
                  <button
                    onClick={() => setShowColumnCustomizer(!showColumnCustomizer)}
                    className="p-3 bg-black/40 border border-white/10 rounded-xl hover:bg-white/5 transition-all"
                    title="Customize Columns"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {/* View Toggle */}
                  <div className="flex bg-black/40 border border-white/10 rounded-xl p-1">
                    <button
                      onClick={() => setClientViewMode('table')}
                      className={`p-2 rounded-lg transition-all ${
                        clientViewMode === 'table' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="Table View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setClientViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${
                        clientViewMode === 'grid' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="Grid View"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-purple-600/10 border border-purple-500/30 rounded-xl p-6 mb-4 overflow-hidden"
                  >
                    <h3 className="font-semibold mb-4 text-purple-400 flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Advanced Filters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Returns Range */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Returns Range</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Min"
                            value={advancedFilters.returnsMin}
                            onChange={(e) => setAdvancedFilters({...advancedFilters, returnsMin: e.target.value})}
                            className="flex-1 bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                          />
                          <input
                            type="number"
                            placeholder="Max"
                            value={advancedFilters.returnsMax}
                            onChange={(e) => setAdvancedFilters({...advancedFilters, returnsMax: e.target.value})}
                            className="flex-1 bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                          />
                        </div>
                      </div>
                      
                      {/* Apply/Clear Buttons */}
                      <div className="flex items-end gap-2 md:col-span-2">
                        <button
                          onClick={applyAdvancedFilters}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                        >
                          Apply Filters
                        </button>
                        <button
                          onClick={clearAdvancedFilters}
                          className="flex-1 px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-all font-medium"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Column Customizer Panel */}
              <AnimatePresence>
                {showColumnCustomizer && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-6 mb-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-blue-400 flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Customize Visible Columns
                      </h3>
                      <button
                        onClick={() => {
                          const resetVals = {
                            checkbox: true,
                            client: true,
                            contact: true,
                            type: true,
                            status: true,
                            returns: true,
                            revenue: true,
                            health: true,
                            tags: true,
                            actions: true
                          };
                          setVisibleColumns(resetVals);
                          localStorage.setItem('clientTableColumns', JSON.stringify(resetVals));
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Reset to Default
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(visibleColumns).map(([key, visible]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={visible}
                            onChange={() => toggleColumn(key)}
                            className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-600 focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                          />
                          <span className="text-sm text-gray-300 capitalize">
                            {key === 'cnic' ? 'CNIC/NTN' : key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Filter Chips Display */}
              {activeFilterChips.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <AnimatePresence>
                    {activeFilterChips.map(chip => (
                      <motion.div
                        key={chip.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30"
                      >
                        <span className="text-sm font-medium">{chip.label}</span>
                        <button
                          onClick={() => removeFilterChip(chip.id)}
                          className="hover:text-red-400 transition-colors"
                          title="Remove filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <button
                    onClick={clearAdvancedFilters}
                    className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all text-sm font-medium flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear All Filters
                  </button>
                </div>
              )}

              {/* Table View */}
              {clientViewMode === 'table' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        {visibleColumns.checkbox && (
                          <th className="text-left py-4 px-4 text-gray-400 font-medium w-12">
                            <input
                              type="checkbox"
                              checked={selectedClients.length === getFilteredAndSortedClients().length && getFilteredAndSortedClients().length > 0}
                              onChange={handleSelectAllClients}
                              className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-600 focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                            />
                          </th>
                        )}
                        {visibleColumns.client && (
                          <th
                            onClick={() => handleSort('name')}
                            className="text-left py-4 px-4 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              Client
                              {getSortIcon('name')}
                            </div>
                          </th>
                        )}
                        {visibleColumns.contact && (
                          <th className="text-left py-4 px-4 text-gray-400 font-medium">Contact</th>
                        )}
                        {visibleColumns.type && (
                          <th
                            onClick={() => handleSort('businessType')}
                            className="text-left py-4 px-4 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              Type
                              {getSortIcon('businessType')}
                            </div>
                          </th>
                        )}
                        {visibleColumns.status && (
                          <th
                            onClick={() => handleSort('status')}
                            className="text-left py-4 px-4 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              Status
                              {getSortIcon('status')}
                            </div>
                          </th>
                        )}
                        {visibleColumns.returns && (
                          <th
                            onClick={() => handleSort('returns')}
                            className="text-left py-4 px-4 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              Returns
                              {getSortIcon('returns')}
                            </div>
                          </th>
                        )}
                        {visibleColumns.health && (
                          <th className="text-left py-4 px-4 text-gray-400 font-medium">Health</th>
                        )}
                        {visibleColumns.actions && (
                          <th className="text-left py-4 px-4 text-gray-400 font-medium">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedClients.map((client) => {
                        const health = getClientHealth(client);
                        const isSelected = selectedClients.includes(client.id);
                        const matchedFields = getMatchedFields(client, debouncedSearchTerm);
                        const hasMatch = matchedFields.length > 0;
                        return (
                          <tr key={client.id} className={`border-b border-white/5 hover:bg-white/5 transition-all group ${isSelected ? 'bg-blue-600/10' : ''}`}>
                            {visibleColumns.checkbox && (
                              <td className="py-4 px-4">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleSelectClient(client.id)}
                                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-600 focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                                />
                              </td>
                            )}
                            {visibleColumns.client && (
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold">
                                    {client.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div>
                                    <span className={`font-medium ${matchedFields.includes('name') ? 'text-yellow-400' : ''}`}>
                                      {client.name}
                                    </span>
                                    {hasMatch && (
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {matchedFields.includes('cnic') && <span className="text-yellow-400">CNIC: {client.cnic}</span>}
                                        {matchedFields.includes('ntn') && <span className="text-yellow-400 ml-2">NTN: {client.ntn}</span>}
                                        {matchedFields.includes('fileNo') && <span className="text-yellow-400 ml-2">File: {client.fileNo}</span>}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            )}
                            {visibleColumns.contact && (
                              <td className="py-4 px-4">
                                <div className="text-sm">
                                  <p className={`${matchedFields.includes('email') ? 'text-yellow-400 font-medium' : 'text-gray-400'}`}>
                                    {client.email}
                                  </p>
                                  <p className={`text-xs ${matchedFields.includes('phone') ? 'text-yellow-400 font-medium' : 'text-gray-500'}`}>
                                    {client.phone}
                                  </p>
                                  {(matchedFields.includes('address') || matchedFields.includes('city')) && (
                                    <p className="text-xs text-yellow-400 font-medium mt-1">
                                      {matchedFields.includes('city') && client.city}
                                      {matchedFields.includes('address') && ` - ${client.address}`}
                                    </p>
                                  )}
                                </div>
                              </td>
                            )}
                            {visibleColumns.type && (
                              <td className="py-4 px-4">
                                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-medium">
                                  {client.businessType}
                                </span>
                              </td>
                            )}
                            {visibleColumns.status && (
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  client.status === 'Active' ? 'bg-green-600/20 text-green-400' :
                                  client.status === 'Pending' ? 'bg-yellow-600/20 text-yellow-400' :
                                  'bg-gray-600/20 text-gray-400'
                                }`}>
                                  {client.status}
                                </span>
                              </td>
                            )}
                            {visibleColumns.returns && (
                              <td className="py-4 px-4 text-gray-400">{client.returns}</td>
                            )}
                            {visibleColumns.health && (
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    health.color === 'green' ? 'bg-green-400' :
                                    health.color === 'yellow' ? 'bg-yellow-400' :
                                    'bg-red-400'
                                  }`}></div>
                                  <span className="text-xs text-gray-400">{health.label}</span>
                                </div>
                              </td>
                            )}
                            {visibleColumns.actions && (
                              <td className="py-4 px-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleViewClientDetails(client)}
                                    className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all text-sm"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleEditClient(client)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-all"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClient(client.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {getFilteredAndSortedClients().length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium mb-2">No clients found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  )}
                </div>
              )}

              {/* Grid View */}
              {clientViewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedClients.map((client) => {
                    const health = getClientHealth(client);
                    return (
                      <motion.div
                        key={client.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black/20 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg font-bold">
                              {client.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <h3 className="font-semibold">{client.name}</h3>
                              <span className="text-xs text-gray-400">{client.businessType}</span>
                            </div>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${
                            health.color === 'green' ? 'bg-green-400' :
                            health.color === 'yellow' ? 'bg-yellow-400' :
                            'bg-red-400'
                          }`}></div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{client.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Phone className="w-3 h-3" />
                            <span>{client.phone}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                          <div>
                            <p className="text-xs text-gray-500">Returns</p>
                            <p className="font-semibold">{client.returns}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            client.status === 'Active' ? 'bg-green-600/20 text-green-400' : 
                            'bg-yellow-600/20 text-yellow-400'
                          }`}>
                            {client.status}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleViewClientDetails(client)}
                            className="flex-1 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all text-sm font-medium"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleEditClient(client)}
                            className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-all"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.id)}
                            className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {getFilteredAndSortedClients().length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium mb-2">No clients found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Pagination Controls */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Results Info */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedClients.length)} of {filteredAndSortedClients.length} clients
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-400">Per page:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-black/40 border border-white/10 rounded-lg py-1 px-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                      </select>
                    </div>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      {/* First Page */}
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="First page"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>

                      {/* Previous Page */}
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {(() => {
                          const pages = [];
                          const maxVisible = 5;
                          let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                          let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                          
                          if (endPage - startPage < maxVisible - 1) {
                            startPage = Math.max(1, endPage - maxVisible + 1);
                          }

                          if (startPage > 1) {
                            pages.push(
                              <button
                                key={1}
                                onClick={() => setCurrentPage(1)}
                                className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 transition-all text-sm"
                              >
                                1
                              </button>
                            );
                            if (startPage > 2) {
                              pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>);
                            }
                          }

                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <button
                                key={i}
                                onClick={() => setCurrentPage(i)}
                                className={`px-3 py-1 rounded-lg transition-all text-sm ${
                                  currentPage === i
                                    ? 'bg-blue-600 text-white border border-blue-500'
                                    : 'bg-black/40 border border-white/10 hover:bg-white/5'
                                }`}
                              >
                                {i}
                              </button>
                            );
                          }

                          if (endPage < totalPages) {
                            if (endPage < totalPages - 1) {
                              pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>);
                            }
                            pages.push(
                              <button
                                key={totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                                className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 transition-all text-sm"
                              >
                                {totalPages}
                              </button>
                            );
                          }

                          return pages;
                        })()}
                      </div>

                      {/* Next Page */}
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="Next page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Last Page */}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="Last page"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>

                      {/* Jump to Page */}
                      <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/10">
                        <span className="text-sm text-gray-400">Go to:</span>
                        <input
                          type="number"
                          min="1"
                          max={totalPages}
                          placeholder={currentPage.toString()}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const page = parseInt(e.target.value);
                              if (page >= 1 && page <= totalPages) {
                                setCurrentPage(page);
                                e.target.value = '';
                              }
                            }
                          }}
                          className="w-16 bg-black/40 border border-white/10 rounded-lg py-1 px-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Filter Status */}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {clientSearchTerm || clientStatusFilter !== 'All Status' || clientBusinessTypeFilter !== 'All Types' 
                      ? `Filters active • ${filteredAndSortedClients.length} of ${clients.length} clients match` 
                      : `Showing all ${clients.length} clients`}
                  </span>
                  {totalPages > 1 && (
                    <span>Page {currentPage} of {totalPages}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Schedule Tab Content */}
        {activeTab === 'schedule' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-1">Schedule</h1>
                <p className="text-gray-400">Manage appointments and deadlines</p>
              </div>
              <button 
                onClick={() => setShowAppointmentModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Appointment
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar View */}
              <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={goToPreviousMonth}
                      className="p-2 bg-black/40 border border-white/10 rounded-lg hover:bg-white/5 transition-all"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <button 
                      onClick={goToNextMonth}
                      className="p-2 bg-black/40 border border-white/10 rounded-lg hover:bg-white/5 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {(() => {
                    const { firstDay, daysInMonth, year, month } = getDaysInMonth(currentMonth);
                    const today = new Date();
                    const cells = [];
                    
                    // Empty cells before first day
                    for (let i = 0; i < firstDay; i++) {
                      cells.push(
                        <div key={`empty-${i}`} className="aspect-square p-2"></div>
                      );
                    }
                    
                    // Days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                      const hasEvent = appointments.some(apt => apt.date === dateStr);
                      
                      cells.push(
                        <button
                          key={day}
                          onClick={() => handleDateClick(dateStr)}
                          className={`aspect-square p-2 rounded-lg text-sm transition-all ${
                            isToday
                              ? 'bg-blue-600 text-white font-bold hover:bg-blue-700'
                              : hasEvent
                              ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    }
                    
                    return cells;
                  })()}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Upcoming Events</h3>
                  <span className="text-xs text-gray-500">{appointments.length} total</span>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {appointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No appointments scheduled</p>
                      <p className="text-sm mt-1">Click "New Appointment" to add one</p>
                    </div>
                  ) : (
                    appointments.map((apt) => (
                      <motion.div
                        key={apt.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-black/20 rounded-xl hover:bg-black/30 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              apt.type === 'deadline' ? 'bg-red-400' : 'bg-blue-400'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium mb-1 truncate">{apt.title}</p>
                              <p className="text-sm text-gray-400 mb-1 truncate">{apt.client}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{formatAppointmentTime(apt.date, apt.time)}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded text-xs">
                                  {apt.notification} before
                                </span>
                                {apt.repeat !== 'none' && (
                                  <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 rounded text-xs">
                                    {apt.repeat}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditAppointment(apt)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all"
                              title="Edit"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteAppointment(apt.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tax Returns Tab Content */}
        {activeTab === 'returns' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header with Actions */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-1">Tax Returns</h1>
                <p className="text-gray-400">Process and manage {taxReturnsData.length} tax returns</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddReturnModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Return
                </button>
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="px-4 py-2 bg-purple-600/20 text-purple-400 font-semibold rounded-xl hover:bg-purple-600/30 transition-all flex items-center gap-2 border border-purple-500/30"
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </button>
                <button
                  onClick={() => setShowReportsModal(true)}
                  className="px-4 py-2 bg-blue-600/20 text-blue-400 font-semibold rounded-xl hover:bg-blue-600/30 transition-all flex items-center gap-2 border border-blue-500/30"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <ThemeToggle />
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-300">Total Returns</span>
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">{getReturnStats().total}</p>
              </div>
              <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-green-300">Filed</span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">{getReturnStats().filed}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-yellow-300">Pending</span>
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-2xl font-bold text-white">{getReturnStats().pending}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-300">Processed</span>
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white">{getReturnStats().processed}</p>
              </div>
            </div>

            {/* Dashboard Analytics */}
            <AnimatePresence>
              {showAnalytics && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <DashboardAnalytics returns={taxReturnsData} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload Section with Error Handling */}
            <div className="mb-6">
              <DragDropUpload 
                onFilesSelected={handleReturnFileUpload}
              />
              {uploadError && (
                <div className="mt-3 p-3 bg-red-600/20 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{uploadError}</span>
                  <button onClick={() => setUploadError(null)} className="ml-auto">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {uploadSuccess && (
                <div className="mt-3 p-3 bg-green-600/20 border border-green-500/30 rounded-xl flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>{uploadSuccess}</span>
                  <button onClick={() => setUploadSuccess(null)} className="ml-auto">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {isUploading && (
                <div className="mt-3 p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center gap-2 text-blue-400">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing PDF...</span>
                </div>
              )}
            </div>

            {/* Toolbar with Enhanced Features */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-6">
              {/* Top Row: Search, Filters, and Actions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={returnSearchTerm}
                      onChange={(e) => {
                        setReturnSearchTerm(e.target.value);
                        if (e.target.value) addToSearchHistory(e.target.value);
                      }}
                      onFocus={() => setShowSearchHistory(true)}
                      placeholder="Search by name, amount, code, status, year, notes, or use status:pending"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                    <p className="mt-2 text-xs text-gray-500">Try amount:250000, code:A1, status:pending, or notes:refund</p>
                    
                    {/* Search History Dropdown */}
                    {showSearchHistory && searchHistory.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                        <div className="p-2 border-b border-white/10 flex items-center justify-between">
                          <span className="text-xs text-gray-400">Recent Searches</span>
                          <button onClick={clearSearchHistory} className="text-xs text-red-400 hover:text-red-300">
                            Clear
                          </button>
                        </div>
                        {searchHistory.map((term, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setReturnSearchTerm(term);
                              setShowSearchHistory(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm text-gray-300"
                          >
                            <Clock className="w-3 h-3 inline mr-2 text-gray-500" />
                            {term}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Smart Suggestions */}
                    {searchSuggestions.length > 0 && returnSearchTerm && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-50">
                        <div className="p-2 border-b border-white/10">
                          <span className="text-xs text-gray-400">Suggestions</span>
                        </div>
                        {searchSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setReturnSearchTerm(suggestion);
                              setSearchSuggestions([]);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm text-gray-300"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <select
                    value={returnStatusFilter}
                    onChange={(e) => setReturnStatusFilter(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="All Status">All Status</option>
                    <option value="Filed">Filed</option>
                    <option value="Pending">Pending</option>
                    <option value="Processed">Processed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <select
                    value={returnYearFilter}
                    onChange={(e) => setReturnYearFilter(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="All Years">All Years</option>
                    {availableTaxYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Second Row: Advanced Controls */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  {/* Advanced Filters Button */}
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="px-3 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-all flex items-center gap-2 border border-purple-500/30 text-sm"
                  >
                    <Filter className="w-4 h-4" />
                    Advanced Filters
                  </button>

                  {/* Saved Presets Dropdown */}
                  <div className="relative">
                    <select
                      value={activeFilterPresetId || ''}
                      onChange={(e) => {
                        const preset = savedFilterPresets.find(p => p.id === Number(e.target.value));
                        if (preset) applySavedPreset(preset);
                      }}
                      className="bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <option value="">Filter Presets</option>
                      {savedFilterPresets.map(preset => (
                        <option key={preset.id} value={preset.id}>{preset.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Column Customizer Button */}
                  <button
                    onClick={() => setShowColumnCustomizer(!showColumnCustomizer)}
                    className="px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all flex items-center gap-2 border border-blue-500/30 text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    Columns
                  </button>

                  {/* Table Density Selector */}
                  <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg p-1">
                    <button
                      onClick={() => changeTableDensity('compact')}
                      className={`px-2 py-1 rounded text-xs ${returnTableDensity === 'compact' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      title="Compact"
                    >
                      <AlignJustify className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => changeTableDensity('standard')}
                      className={`px-2 py-1 rounded text-xs ${returnTableDensity === 'standard' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      title="Standard"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => changeTableDensity('comfortable')}
                      className={`px-2 py-1 rounded text-xs ${returnTableDensity === 'comfortable' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      title="Comfortable"
                    >
                      <Menu className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Auto-save Indicator & Undo/Redo */}
                <div className="flex items-center gap-3">
                  {/* Auto-save Status */}
                  {autoSaveStatus && (
                    <div className="flex items-center gap-2 text-sm">
                      {autoSaveStatus === 'saving' && (
                        <>
                          <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                          <span className="text-blue-400">Saving...</span>
                        </>
                      )}
                      {autoSaveStatus === 'saved' && (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">Saved</span>
                        </>
                      )}
                      {autoSaveStatus === 'error' && (
                        <>
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-red-400">Error</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Undo/Redo Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleUndo}
                      disabled={undoStack.length === 0}
                      className="p-2 bg-black/40 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                      className="p-2 bg-black/40 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Redo (Ctrl+Y)"
                    >
                      <Redo className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-white/10"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">Date From</label>
                        <input
                          type="date"
                          value={advancedReturnFilters.dateFrom}
                          onChange={(e) => setAdvancedReturnFilters({...advancedReturnFilters, dateFrom: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">Date To</label>
                        <input
                          type="date"
                          value={advancedReturnFilters.dateTo}
                          onChange={(e) => setAdvancedReturnFilters({...advancedReturnFilters, dateTo: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">Client Name</label>
                        <input
                          type="text"
                          value={advancedReturnFilters.clientName}
                          onChange={(e) => setAdvancedReturnFilters({...advancedReturnFilters, clientName: e.target.value})}
                          placeholder="Filter by client..."
                          className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <button
                          onClick={applyAdvancedReturnFilters}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm"
                        >
                          Apply
                        </button>
                        <button
                          onClick={clearAdvancedReturnFilters}
                          className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all text-sm border border-red-500/30"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    
                    {/* Save Preset */}
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Preset name..."
                        id="presetName"
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                      <button
                        onClick={() => {
                          const name = document.getElementById('presetName').value;
                          if (name) {
                            saveCurrentFiltersAsPreset(name);
                            document.getElementById('presetName').value = '';
                          }
                        }}
                        className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-all text-sm border border-green-500/30"
                      >
                        Save as Preset
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Column Customizer Panel */}
              <AnimatePresence>
                {showColumnCustomizer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-white/10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-400">Customize visible columns</span>
                      <button onClick={resetColumns} className="text-xs text-blue-400 hover:text-blue-300">
                        Reset to Default
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(visibleReturnColumns).map(([key, visible]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={visible}
                            onChange={() => toggleReturnColumn(key)}
                            className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-600 focus:ring-2 focus:ring-blue-500/40"
                          />
                          <span className="text-sm text-gray-300 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bulk Actions Bar */}
              {selectedReturns.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    {selectedReturns.length} return(s) selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowBulkStatusModal(true)}
                      className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-xl hover:bg-purple-600/30 transition-all flex items-center gap-2 border border-purple-500/30"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Update Status
                    </button>
                    <button
                      onClick={handleExportSelectedReturns}
                      className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/30 transition-all flex items-center gap-2 border border-blue-500/30"
                    >
                      <Download className="w-4 h-4" />
                      Export Selected
                    </button>
                    <button
                      onClick={handleBulkDeleteReturns}
                      className="px-4 py-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition-all flex items-center gap-2 border border-red-500/30"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Selected
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tax Returns Table */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/40 border-b border-white/10">
                    <tr>
                      {visibleReturnColumns.checkbox && (
                        <th className="py-4 px-4 text-left">
                          <input
                            type="checkbox"
                            checked={selectedReturns.length === paginatedReturns.length && paginatedReturns.length > 0}
                            onChange={handleSelectAllReturns}
                            className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-600 focus:ring-2 focus:ring-blue-500/40"
                          />
                        </th>
                      )}
                      {visibleReturnColumns.clientName && (
                        <th className="py-4 px-4 text-left text-sm font-semibold text-gray-300">
                          <button
                            onClick={() => setReturnSortBy(returnSortBy === 'name-asc' ? 'name-desc' : 'name-asc')}
                            className="flex items-center gap-2 hover:text-white transition-colors"
                          >
                            Client Name
                            {returnSortBy === 'name-asc' ? <ArrowUp className="w-4 h-4" /> : returnSortBy === 'name-desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUpDown className="w-4 h-4 opacity-30" />}
                          </button>
                        </th>
                      )}
                      {visibleReturnColumns.cnicNtn && <th className="py-4 px-4 text-left text-sm font-semibold text-gray-300">CNIC/NTN</th>}
                      {visibleReturnColumns.taxYear && (
                        <th className="py-4 px-4 text-left text-sm font-semibold text-gray-300">
                          <button
                            onClick={() => setReturnSortBy(returnSortBy === 'year-asc' ? 'year-desc' : 'year-asc')}
                            className="flex items-center gap-2 hover:text-white transition-colors"
                          >
                            Tax Year
                            {returnSortBy === 'year-asc' ? <ArrowUp className="w-4 h-4" /> : returnSortBy === 'year-desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUpDown className="w-4 h-4 opacity-30" />}
                          </button>
                        </th>
                      )}
                      {visibleReturnColumns.totalIncome && <th className="py-4 px-4 text-left text-sm font-semibold text-gray-300">Total Income</th>}
                      {visibleReturnColumns.taxableIncome && <th className="py-4 px-4 text-left text-sm font-semibold text-gray-300">Taxable Income</th>}
                      {visibleReturnColumns.taxChargeable && <th className="py-4 px-4 text-left text-sm font-semibold text-gray-300">Tax Chargeable</th>}
                      {visibleReturnColumns.refundAmount && <th className="py-4 px-4 text-left text-sm font-semibold text-gray-300">Refund Amount</th>}
                      {visibleReturnColumns.returnType && <th className="py-4 px-4 text-left text-sm font-semibold text-gray-300">Return Type</th>}
                      {visibleReturnColumns.filingDate && (
                        <th className="py-4 px-4 text-left text-sm font-semibold text-gray-300">
                          <button
                            onClick={() => setReturnSortBy(returnSortBy === 'date-asc' ? 'date-desc' : 'date-asc')}
                            className="flex items-center gap-2 hover:text-white transition-colors"
                          >
                            Filing Date
                            {returnSortBy === 'date-asc' ? <ArrowUp className="w-4 h-4" /> : returnSortBy === 'date-desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUpDown className="w-4 h-4 opacity-30" />}
                          </button>
                        </th>
                      )}
                      {visibleReturnColumns.status && <th className="py-4 px-4 text-left text-sm font-semibold text-gray-300">Status</th>}
                      {visibleReturnColumns.actions && <th className="py-4 px-4 text-left text-sm font-semibold text-gray-300">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReturns.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center">
                          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
                          <p className="text-gray-400 text-lg mb-2">No tax returns found</p>
                          <p className="text-gray-500 text-sm">Upload PDFs or add returns manually to get started</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedReturns.map((returnItem, index) => (
                        <tr 
                          key={returnItem.id} 
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors ${getTableRowClass()}`}
                          onContextMenu={(e) => handleContextMenu(e, returnItem)}
                        >
                          {visibleReturnColumns.checkbox && (
                            <td className={getTableRowClass()}>
                              <input
                                type="checkbox"
                                checked={selectedReturns.includes(String(returnItem.id))}
                                onChange={() => handleSelectReturn(returnItem.id)}
                                className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-600 focus:ring-2 focus:ring-blue-500/40"
                              />
                            </td>
                          )}
                          {visibleReturnColumns.clientName && (
                            <td 
                              className={getTableRowClass()}
                              onDoubleClick={() => handleStartInlineEdit(returnItem.id, 'client_name', returnItem.client_name)}
                            >
                              {inlineEditCell?.returnId === returnItem.id && inlineEditCell?.field === 'client_name' ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={inlineEditValue}
                                    onChange={(e) => setInlineEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveInlineEdit();
                                      if (e.key === 'Escape') handleCancelInlineEdit();
                                    }}
                                    autoFocus
                                    className="flex-1 bg-black/60 border border-blue-500 rounded px-2 py-1 text-white text-sm focus:outline-none"
                                  />
                                  <button onClick={handleSaveInlineEdit} className="text-green-400 hover:text-green-300">
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button onClick={handleCancelInlineEdit} className="text-red-400 hover:text-red-300">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <div className="font-medium text-white">{returnItem.client_name || 'N/A'}</div>
                                  <div className="text-xs text-gray-500">{returnItem.original_filename}</div>
                                </div>
                              )}
                            </td>
                          )}
                          {visibleReturnColumns.cnicNtn && (
                            <td 
                              className={`${getTableRowClass()} text-gray-300`}
                              onDoubleClick={() => handleStartInlineEdit(returnItem.id, 'cnic_ntn', returnItem.cnic_ntn)}
                            >
                              {inlineEditCell?.returnId === returnItem.id && inlineEditCell?.field === 'cnic_ntn' ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={inlineEditValue}
                                    onChange={(e) => setInlineEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveInlineEdit();
                                      if (e.key === 'Escape') handleCancelInlineEdit();
                                    }}
                                    autoFocus
                                    className="flex-1 bg-black/60 border border-blue-500 rounded px-2 py-1 text-white text-sm focus:outline-none"
                                  />
                                  <button onClick={handleSaveInlineEdit} className="text-green-400 hover:text-green-300">
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button onClick={handleCancelInlineEdit} className="text-red-400 hover:text-red-300">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                returnItem.cnic_ntn || returnItem.cnic || returnItem.ntn || 'N/A'
                              )}
                            </td>
                          )}
                          {visibleReturnColumns.taxYear && (
                            <td 
                              className={`${getTableRowClass()} text-gray-300`}
                              onDoubleClick={() => handleStartInlineEdit(returnItem.id, 'tax_year', returnItem.tax_year)}
                            >
                              {inlineEditCell?.returnId === returnItem.id && inlineEditCell?.field === 'tax_year' ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={inlineEditValue}
                                    onChange={(e) => setInlineEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveInlineEdit();
                                      if (e.key === 'Escape') handleCancelInlineEdit();
                                    }}
                                    autoFocus
                                    className="flex-1 bg-black/60 border border-blue-500 rounded px-2 py-1 text-white text-sm focus:outline-none"
                                  />
                                  <button onClick={handleSaveInlineEdit} className="text-green-400 hover:text-green-300">
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button onClick={handleCancelInlineEdit} className="text-red-400 hover:text-red-300">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                returnItem.tax_year || 'N/A'
                              )}
                            </td>
                          )}
                          {visibleReturnColumns.totalIncome && (
                            <td className={`${getTableRowClass()} text-gray-300`}>
                              {returnItem.total_income || 'N/A'}
                            </td>
                          )}
                          {visibleReturnColumns.taxableIncome && (
                            <td className={`${getTableRowClass()} text-gray-300`}>
                              {returnItem.taxable_income || 'N/A'}
                            </td>
                          )}
                          {visibleReturnColumns.taxChargeable && (
                            <td className={`${getTableRowClass()} text-gray-300`}>
                              {returnItem.tax_chargeable || 'N/A'}
                            </td>
                          )}
                          {visibleReturnColumns.refundAmount && (
                            <td className={`${getTableRowClass()} text-gray-300`}>
                              {returnItem.refund_amount || 'N/A'}
                            </td>
                          )}
                          {visibleReturnColumns.returnType && (
                            <td className={`${getTableRowClass()} text-gray-300 text-sm`}>
                              {returnItem.return_type || 'N/A'}
                            </td>
                          )}
                          {visibleReturnColumns.filingDate && (
                            <td className={`${getTableRowClass()} text-gray-300`}>
                              {returnItem.filing_date ? new Date(returnItem.filing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                            </td>
                          )}
                          {visibleReturnColumns.status && (
                            <td className={getTableRowClass()}>
                              <button
                                onClick={() => handleUpdateStatus(returnItem)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                  returnItem.status === 'Filed' ? 'bg-green-600/20 text-green-400 border border-green-500/30' :
                                  returnItem.status === 'Pending' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' :
                                  returnItem.status === 'Processed' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' :
                                  'bg-red-600/20 text-red-400 border border-red-500/30'
                                }`}
                              >
                                {returnItem.status || 'Unknown'}
                              </button>
                            </td>
                          )}
                          {visibleReturnColumns.actions && (
                            <td className={getTableRowClass()}>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handlePreviewPDF(returnItem)}
                                  className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all"
                                  title="Preview PDF"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditReturn(returnItem)}
                                  className="p-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-all"
                                  title="Edit"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteReturn(returnItem.id)}
                                  className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalReturnPages > 1 && (
                <div className="bg-black/20 border-t border-white/10 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Show:</span>
                      <select
                        value={returnItemsPerPage}
                        onChange={(e) => setReturnItemsPerPage(Number(e.target.value))}
                        className="bg-black/40 border border-white/10 rounded-lg py-1 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                      <span className="text-sm text-gray-400">
                        Showing {((returnCurrentPage - 1) * returnItemsPerPage) + 1} to {Math.min(returnCurrentPage * returnItemsPerPage, filteredAndSortedReturns.length)} of {filteredAndSortedReturns.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReturnCurrentPage(1)}
                        disabled={returnCurrentPage === 1}
                        className="p-2 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setReturnCurrentPage(returnCurrentPage - 1)}
                        disabled={returnCurrentPage === 1}
                        className="p-2 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {(() => {
                          const pages = [];
                          const maxVisible = 5;
                          let startPage = Math.max(1, returnCurrentPage - Math.floor(maxVisible / 2));
                          let endPage = Math.min(totalReturnPages, startPage + maxVisible - 1);
                          
                          if (endPage - startPage < maxVisible - 1) {
                            startPage = Math.max(1, endPage - maxVisible + 1);
                          }

                          if (startPage > 1) {
                            pages.push(
                              <button
                                key={1}
                                onClick={() => setReturnCurrentPage(1)}
                                className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 transition-all text-sm"
                              >
                                1
                              </button>
                            );
                            if (startPage > 2) {
                              pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>);
                            }
                          }

                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <button
                                key={i}
                                onClick={() => setReturnCurrentPage(i)}
                                className={`px-3 py-1 rounded-lg transition-all text-sm ${
                                  returnCurrentPage === i
                                    ? 'bg-blue-600 text-white border border-blue-500'
                                    : 'bg-black/40 border border-white/10 hover:bg-white/5'
                                }`}
                              >
                                {i}
                              </button>
                            );
                          }

                          if (endPage < totalReturnPages) {
                            if (endPage < totalReturnPages - 1) {
                              pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>);
                            }
                            pages.push(
                              <button
                                key={totalReturnPages}
                                onClick={() => setReturnCurrentPage(totalReturnPages)}
                                className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 transition-all text-sm"
                              >
                                {totalReturnPages}
                              </button>
                            );
                          }

                          return pages;
                        })()}
                      </div>

                      <button
                        onClick={() => setReturnCurrentPage(returnCurrentPage + 1)}
                        disabled={returnCurrentPage === totalReturnPages}
                        className="p-2 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setReturnCurrentPage(totalReturnPages)}
                        disabled={returnCurrentPage === totalReturnPages}
                        className="p-2 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Reports Modal */}
            {showReportsModal && (
              <ReportsModal
                returns={taxReturnsData}
                onClose={() => setShowReportsModal(false)}
              />
            )}

            {/* Email Modal */}
            {showEmailModal && (
              <EmailModal
                returns={taxReturnsData}
                onClose={() => setShowEmailModal(false)}
              />
            )}

            {/* Context Menu */}
            {contextMenuReturn && (
              <div
                style={{
                  position: 'fixed',
                  top: contextMenuPosition.y,
                  left: contextMenuPosition.x,
                  zIndex: 1000
                }}
                className="bg-gray-900 border border-white/10 rounded-xl shadow-2xl py-2 min-w-[200px]"
              >
                <button
                  onClick={() => {
                    handleEditReturn(contextMenuReturn);
                    handleCloseContextMenu();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm text-gray-300 flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Return
                </button>
                <button
                  onClick={() => {
                    handlePreviewPDF(contextMenuReturn);
                    handleCloseContextMenu();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm text-gray-300 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview PDF
                </button>
                <button
                  onClick={() => {
                    handleUpdateStatus(contextMenuReturn);
                    handleCloseContextMenu();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm text-gray-300 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Update Status
                </button>
                <div className="border-t border-white/10 my-1"></div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(contextMenuReturn.cnic_ntn || '');
                    handleCloseContextMenu();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm text-gray-300 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy CNIC/NTN
                </button>
                <button
                  onClick={() => {
                    const history = getReturnHistory(contextMenuReturn.id);
                    alert(history.length > 0 ? JSON.stringify(history, null, 2) : 'No history available');
                    handleCloseContextMenu();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm text-gray-300 flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  View History
                </button>
                <div className="border-t border-white/10 my-1"></div>
                <button
                  onClick={() => {
                    handleDeleteReturn(contextMenuReturn.id);
                    handleCloseContextMenu();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm text-red-400 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Return
                </button>
              </div>
            )}

            {/* Bulk Status Update Modal */}
            <AnimatePresence>
              {showBulkStatusModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setShowBulkStatusModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-2xl p-6 max-w-md w-full"
                  >
                    <h3 className="text-xl font-bold mb-4 text-white">Update Status for {selectedReturns.length} Returns</h3>
                    <p className="text-gray-400 mb-6 text-sm">Select the new status for all selected returns:</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleBulkStatusUpdate('Filed')}
                        className="px-4 py-3 bg-green-600/20 text-green-400 rounded-xl hover:bg-green-600/30 transition-all border border-green-500/30 font-medium"
                      >
                        <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                        Filed
                      </button>
                      <button
                        onClick={() => handleBulkStatusUpdate('Pending')}
                        className="px-4 py-3 bg-yellow-600/20 text-yellow-400 rounded-xl hover:bg-yellow-600/30 transition-all border border-yellow-500/30 font-medium"
                      >
                        <Clock className="w-5 h-5 mx-auto mb-1" />
                        Pending
                      </button>
                      <button
                        onClick={() => handleBulkStatusUpdate('Processed')}
                        className="px-4 py-3 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/30 transition-all border border-blue-500/30 font-medium"
                      >
                        <Activity className="w-5 h-5 mx-auto mb-1" />
                        Processed
                      </button>
                      <button
                        onClick={() => handleBulkStatusUpdate('Rejected')}
                        className="px-4 py-3 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition-all border border-red-500/30 font-medium"
                      >
                        <XCircle className="w-5 h-5 mx-auto mb-1" />
                        Rejected
                      </button>
                    </div>

                    <button
                      onClick={() => setShowBulkStatusModal(false)}
                      className="w-full mt-4 px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all"
                    >
                      Cancel
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Excel Login Popup — shown when clicking Add Return */}
        <AnimatePresence>
          {showExcelLoginPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowExcelLoginPopup(false);
                setExcelLoginName('');
                setExcelLoginCnic('');
                setExcelIsLoggingIn(false);
                setExcelLoginSuccess(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-slate-900 to-slate-950 border border-green-500/20 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-green-700 to-emerald-700 px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                        <path d="M8 12h3v2H8v-2zm0 3h3v2H8v-2zm5-3h3v2h-3v-2zm5-3h3v2h-3v-2zm-5 3h3v2h-3v-2z" opacity="0.6"/>
                        <text x="7" y="18" fontSize="7" fontWeight="bold" fill="currentColor">X</text>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Excel Login</h2>
                      <p className="text-xs text-green-100">Sign in with IRIS credentials to access Excel</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowExcelLoginPopup(false);
                      setExcelLoginName('');
                      setExcelLoginCnic('');
                      setExcelIsLoggingIn(false);
                      setExcelLoginSuccess(false);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                  {!excelLoginSuccess ? (
                    <>
                      {/* IRIS Badge / Branding */}
                      <div className="flex items-center justify-center gap-2 py-2">
                        <div className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                          <span className="text-green-300 text-xs font-bold uppercase tracking-wider">IRIS Portal Connection</span>
                        </div>
                      </div>

                      {/* Taxpayer Name field */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Taxpayer Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                          <input
                            type="text"
                            autoFocus
                            value={excelLoginName}
                            onChange={(e) => setExcelLoginName(e.target.value)}
                            onFocus={() => excelLoginName && setShowNameSuggestions(excelClientSuggestions.length > 0)}
                            placeholder="e.g. Abdul Rashid"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                          />
                          {/* Name suggestions dropdown */}
                          {showNameSuggestions && excelClientSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-green-500/30 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                              {excelClientSuggestions.map((client) => (
                                <button
                                  key={client.id}
                                  onClick={() => handleExcelSelectClient(client)}
                                  className="w-full text-left px-4 py-2 hover:bg-green-600/20 transition-colors border-b border-white/5 last:border-b-0 flex flex-col"
                                >
                                  <span className="text-white font-medium">{client.name}</span>
                                  <span className="text-xs text-gray-400">{client.cnic || client.ntn || 'No CNIC/NTN'}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CNIC field */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          CNIC / NTN
                        </label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                          <input
                            type="text"
                            value={excelLoginCnic}
                            onChange={(e) => setExcelLoginCnic(e.target.value)}
                            onFocus={() => excelLoginCnic && setShowCnicSuggestions(excelClientSuggestions.length > 0)}
                            placeholder="e.g. 12345-1234567-1"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                          />
                          {/* CNIC suggestions dropdown */}
                          {showCnicSuggestions && excelClientSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-green-500/30 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                              {excelClientSuggestions.map((client) => (
                                <button
                                  key={client.id}
                                  onClick={() => handleExcelSelectClient(client)}
                                  className="w-full text-left px-4 py-2 hover:bg-green-600/20 transition-colors border-b border-white/5 last:border-b-0 flex flex-col"
                                >
                                  <span className="text-white font-medium">{client.name}</span>
                                  <span className="text-xs text-gray-400">{client.cnic || client.ntn || 'No CNIC/NTN'}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Login button */}
                      <button
                        onClick={() => {
                          if (!excelLoginName.trim() || !excelLoginCnic.trim()) {
                            alert('Please enter both name and CNIC.');
                            return;
                          }

                          // Normalize CNIC for comparison
                          const normalizeCnic = (val) => val.replace(/-/g, '').trim();
                          const inputNameLower = excelLoginName.trim().toLowerCase();
                          const inputCnicClean = normalizeCnic(excelLoginCnic);

                          // Check if client exists in dataset
                          const clientExists = clients.some(c => {
                            const clientNameLower = (c.name || '').toLowerCase();
                            const clientCnicClean = normalizeCnic(c.cnic || '');
                            const clientNtnClean = normalizeCnic(c.ntn || '');

                            return clientNameLower === inputNameLower &&
                                   (clientCnicClean === inputCnicClean || clientNtnClean === inputCnicClean);
                          });

                          if (!clientExists) {
                            // Show prompt to add new client
                            setShowNewClientPrompt(true);
                            return;
                          }

                          setExcelIsLoggingIn(true);
                          // Simulate login delay
                          setTimeout(() => {
                            setExcelIsLoggingIn(false);
                            setExcelLoginSuccess(true);
                          }, 2000);
                        }}
                        disabled={excelIsLoggingIn || !excelLoginName.trim() || !excelLoginCnic.trim()}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {excelIsLoggingIn ? (
                          <>
                            <svg className="animate-spin w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Signing in...
                          </>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4" />
                            Sign In to Excel
                          </>
                        )}
                      </button>

                      {/* Divider */}
                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="px-3 bg-slate-900 text-gray-500">or</span>
                        </div>
                      </div>

                      {/* Skip / Manual entry */}
                      <button
                        onClick={() => {
                          setShowExcelLoginPopup(false);
                          setExcelLoginName('');
                          setExcelLoginCnic('');
                          setShowAddReturnModal(true);
                        }}
                        className="w-full px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10"
                      >
                        <FileText className="w-4 h-4" />
                        Skip & Add Return Manually
                      </button>
                    </>
                  ) : (
                    /* Success state */
                    <div className="text-center space-y-4 py-4">
                      <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Successfully Connected!</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Logged in as <span className="text-green-400 font-medium">{excelLoginName}</span> ({excelLoginCnic})
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <button
                          onClick={async () => {
                            try {
                              // Find the client in the database
                              const client = clients.find(c => 
                                c.name === excelLoginName && 
                                (c.cnic === excelLoginCnic || c.ntn === excelLoginCnic)
                              );

                              if (!client) {
                                showToast('⚠️ Client not found in database. Please add the client first.', 'warning');
                                return;
                              }

                              // Open Excel for this client
                              showToast('📂 Opening Excel workbook...', 'info');
                              const result = await openExcelForClient(client);

                              if (result.success) {
                                showToast(`✅ ${result.message}`, 'success');
                                
                                // Populate newReturn with logged in details
                                setNewReturn(prev => ({
                                  ...prev,
                                  client_name: excelLoginName,
                                  cnic_ntn: excelLoginCnic,
                                }));
                                setShowExcelLoginPopup(false);
                                setExcelLoginName('');
                                setExcelLoginCnic('');
                                setExcelLoginSuccess(false);
                                
                                // Open add return modal, skip taxpayer search step directly to Step 2!
                                setIrisSelectedClient({
                                  name: excelLoginName,
                                  cnic: excelLoginCnic
                                });
                                setIrisStep(2);
                                setShowAddReturnModal(true);
                              } else {
                                showToast(`❌ ${result.error}`, 'error');
                              }
                            } catch (error) {
                              console.error('Error opening Excel:', error);
                              showToast(`❌ Failed to open Excel: ${error.message}`, 'error');
                            }
                          }}
                          className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Open Excel & Continue
                        </button>
                        <button
                          onClick={() => {
                            // Trigger Excel file upload
                            const uploadInput = document.getElementById('excel-upload-input');
                            if (uploadInput) uploadInput.click();
                            setShowExcelLoginPopup(false);
                            setExcelLoginName('');
                            setExcelLoginCnic('');
                            setExcelLoginSuccess(false);
                          }}
                          className="w-full px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10"
                        >
                          <Upload className="w-4 h-4" />
                          Import from Excel File
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-black/30 border-t border-white/5 text-center">
                  <p className="text-xs text-gray-500">
                    Secure connection using IRIS Taxpayer Profile
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Client Confirmation Popup */}
        <AnimatePresence>
          {showNewClientPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
              onClick={() => setShowNewClientPrompt(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-slate-900 to-slate-950 border border-yellow-500/30 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Client Not Found</h2>
                      <p className="text-xs text-yellow-100">This client is not in the database</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNewClientPrompt(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <p className="text-gray-300 text-sm mb-3">
                      The client <span className="text-white font-semibold">{excelLoginName}</span> with CNIC/NTN <span className="text-white font-semibold">{excelLoginCnic}</span> is not in the client dataset.
                    </p>
                    <p className="text-gray-400 text-sm">
                      Would you like to add this client to the database?
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        // Pre-fill the new client form
                        setNewClient(prev => ({
                          ...prev,
                          name: excelLoginName,
                          cnic: excelLoginCnic,
                          ntn: excelLoginCnic
                        }));
                        // Close all popups and open Add Client modal
                        setShowNewClientPrompt(false);
                        setShowExcelLoginPopup(false);
                        setShowClientModal(true);
                      }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Yes, Add Client
                    </button>
                    <button
                      onClick={() => setShowNewClientPrompt(false)}
                      className="flex-1 px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* IRIS-Style Add Tax Return Modal — Step 1: Search by Name/CNIC */}
        <AnimatePresence>
          {showAddReturnModal && !editingReturn && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowAddReturnModal(false);
                setIrisSearchTerm('');
                setIrisSelectedClient(null);
                setIrisStep(1);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-slate-900 to-slate-950 border border-blue-500/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
              >
                {/* IRIS-style header bar */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">New Tax Return</h2>
                      <p className="text-xs text-blue-100">
                        Step {irisStep} of 2 — {irisStep === 1 ? 'Select Taxpayer' : 'Return Details'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddReturnModal(false);
                      setIrisSearchTerm('');
                      setIrisSelectedClient(null);
                      setIrisStep(1);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Step 1 — Search taxpayer */}
                {irisStep === 1 && (
                  <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Search Taxpayer by Name or CNIC / NTN
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          autoFocus
                          value={irisSearchTerm}
                          onChange={(e) => {
                            setIrisSearchTerm(e.target.value);
                            setIrisSelectedClient(null);
                          }}
                          placeholder="e.g. Abdul Rashid  or  12345-1234567-1"
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Start typing to search the client register, or enter a new taxpayer manually below.
                      </p>
                    </div>

                    {/* Auto-suggestion list */}
                    {irisSearchTerm.trim().length >= 2 && (() => {
                      const term = irisSearchTerm.trim().toLowerCase();
                      const matches = clients.filter(c =>
                        (c.name || '').toLowerCase().includes(term) ||
                        (c.cnic || '').toLowerCase().includes(term) ||
                        (c.ntn || '').toLowerCase().includes(term)
                      ).slice(0, 8);

                      if (matches.length === 0) {
                        return (
                          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-300">
                            No matching taxpayer found. You can proceed to register a new return manually.
                          </div>
                        );
                      }

                      return (
                        <div className="bg-black/40 border border-white/10 rounded-xl max-h-64 overflow-y-auto">
                          {matches.map(c => {
                            const isSel = irisSelectedClient?.id === c.id;
                            return (
                              <button
                                key={c.id}
                                onClick={() => setIrisSelectedClient(c)}
                                className={`w-full text-left px-4 py-3 border-b border-white/5 last:border-b-0 transition-all ${
                                  isSel ? 'bg-blue-600/30' : 'hover:bg-white/5'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-white font-medium">{c.name || '—'}</p>
                                    <p className="text-xs text-gray-400">
                                      CNIC: {c.cnic || '—'} &nbsp;•&nbsp; NTN: {c.ntn || '—'}
                                    </p>
                                  </div>
                                  {isSel && <CheckCircle className="w-5 h-5 text-blue-400" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Selected summary */}
                    {irisSelectedClient && (
                      <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                        <p className="text-xs uppercase text-blue-300 mb-1">Selected Taxpayer</p>
                        <p className="text-white font-semibold">{irisSelectedClient.name}</p>
                        <p className="text-sm text-gray-400">
                          {irisSelectedClient.cnic || irisSelectedClient.ntn || 'No CNIC/NTN on file'}
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          // Use selected client or fall back to typed search term
                          if (irisSelectedClient) {
                            // Client exists - proceed directly to Step 2
                            setNewReturn({
                              ...newReturn,
                              client_name: irisSelectedClient.name || '',
                              cnic_ntn: irisSelectedClient.cnic || irisSelectedClient.ntn || '',
                              email: irisSelectedClient.email || '',
                              phone: irisSelectedClient.phone || '',
                              address: irisSelectedClient.address || '',
                              city: irisSelectedClient.city || '',
                              fileNo: irisSelectedClient.fileNo || '',
                              ntn: irisSelectedClient.ntn || '',
                              cnic: irisSelectedClient.cnic || '',
                              irisPin: irisSelectedClient.irisPin || '',
                              irisPassword: irisSelectedClient.irisPassword || '',
                              person: irisSelectedClient.person || '',
                              sourceOfIncome: irisSelectedClient.sourceOfIncome || '',
                              businessClassification: irisSelectedClient.businessClassification || '',
                              tax_year: irisSelectedClient.taxYear || new Date().getFullYear().toString(),
                              filing_date: new Date().toISOString().split('T')[0],
                              return_type: 'Section 114(1) - Voluntary Return',
                              status: 'Pending'
                            });
                            setIrisStep(2);
                          } else {
                            // No client selected - show confirmation for new client
                            const term = irisSearchTerm.trim();
                            const looksLikeId = /^[0-9\-]+$/.test(term);
                            const newClientData = {
                              client_name: looksLikeId ? '' : term,
                              cnic_ntn: looksLikeId ? term : '',
                              tax_year: new Date().getFullYear().toString(),
                              filing_date: new Date().toISOString().split('T')[0],
                              return_type: 'Section 114(1) - Voluntary Return',
                              status: 'Pending'
                            };
                            setPendingNewClientData(newClientData);
                            setShowNewClientConfirm(true);
                          }
                        }}
                        disabled={!irisSelectedClient && !irisSearchTerm.trim()}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        Proceed to Tax Calculation
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setShowAddReturnModal(false);
                          setIrisSearchTerm('');
                          setIrisSelectedClient(null);
                          setIrisStep(1);
                        }}
                        className="px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2 — Return details / Tax calculation entry */}
                {irisStep === 2 && (
                  <div className="p-6 space-y-4">
                    <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-xs uppercase text-blue-300">Taxpayer Information</p>
                          {irisSelectedClient && (
                            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full border border-green-500/30 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Auto-filled from Client Database
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setIrisStep(1)}
                          className="text-xs px-3 py-1.5 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-all"
                        >
                          Change
                        </button>
                      </div>
                      <div>
                        <p className="text-white font-medium">{newReturn.client_name || '(unnamed)'}</p>
                        <p className="text-xs text-gray-400">{newReturn.cnic_ntn || 'No CNIC/NTN'}</p>
                        {irisSelectedClient && (
                          <p className="text-xs text-gray-500 mt-1">
                            File No: {irisSelectedClient.fileNo || 'N/A'} • 
                            {irisSelectedClient.email && ` ${irisSelectedClient.email}`}
                            {irisSelectedClient.phone && ` • ${irisSelectedClient.phone}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Client Name *</label>
                        <input
                          type="text"
                          value={newReturn.client_name}
                          onChange={(e) => setNewReturn({ ...newReturn, client_name: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">CNIC / NTN *</label>
                        <input
                          type="text"
                          value={newReturn.cnic_ntn}
                          onChange={(e) => setNewReturn({ ...newReturn, cnic_ntn: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>
                      
                      {/* Auto-filled client information */}
                      {newReturn.email && (
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                          <input
                            type="email"
                            value={newReturn.email || ''}
                            onChange={(e) => setNewReturn({ ...newReturn, email: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          />
                        </div>
                      )}
                      {newReturn.phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
                          <input
                            type="text"
                            value={newReturn.phone || ''}
                            onChange={(e) => setNewReturn({ ...newReturn, phone: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          />
                        </div>
                      )}
                      {newReturn.address && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
                          <input
                            type="text"
                            value={newReturn.address || ''}
                            onChange={(e) => setNewReturn({ ...newReturn, address: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          />
                        </div>
                      )}
                      {newReturn.city && (
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">City</label>
                          <input
                            type="text"
                            value={newReturn.city || ''}
                            onChange={(e) => setNewReturn({ ...newReturn, city: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          />
                        </div>
                      )}
                      {newReturn.businessClassification && (
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Business Classification</label>
                          <input
                            type="text"
                            value={newReturn.businessClassification || ''}
                            onChange={(e) => setNewReturn({ ...newReturn, businessClassification: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          />
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Tax Year *</label>
                        <input
                          type="text"
                          value={newReturn.tax_year}
                          onChange={(e) => setNewReturn({ ...newReturn, tax_year: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Filing Date</label>
                        <input
                          type="date"
                          value={newReturn.filing_date}
                          onChange={(e) => setNewReturn({ ...newReturn, filing_date: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Return Type</label>
                        <select
                          value={newReturn.return_type}
                          onChange={(e) => setNewReturn({ ...newReturn, return_type: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        >
                          <option value="Section 114(1) - Voluntary Return">Section 114(1) - Voluntary Return</option>
                          <option value="Section 114(4) - Notice Return">Section 114(4) - Notice Return</option>
                          <option value="Section 120 - Amended Return">Section 120 - Amended Return</option>
                          <option value="Section 182 - Final Return">Section 182 - Final Return</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                        <select
                          value={newReturn.status}
                          onChange={(e) => setNewReturn({ ...newReturn, status: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processed">Processed</option>
                          <option value="Filed">Filed</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          handleSaveReturn();
                          setIrisSearchTerm('');
                          setIrisSelectedClient(null);
                          setIrisStep(1);
                        }}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                      >
                        Add Return
                      </button>
                      <button
                        onClick={() => setIrisStep(1)}
                        className="px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Tax Return Modal (kept simple — full form) */}
        <AnimatePresence>
          {showEditReturnModal && editingReturn && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowEditReturnModal(false);
                setEditingReturn(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-2xl w-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Edit Tax Return</h2>
                  <button
                    onClick={() => {
                      setShowEditReturnModal(false);
                      setEditingReturn(null);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Client Name *</label>
                      <input
                        type="text"
                        value={newReturn.client_name}
                        onChange={(e) => setNewReturn({ ...newReturn, client_name: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">CNIC / NTN *</label>
                      <input
                        type="text"
                        value={newReturn.cnic_ntn}
                        onChange={(e) => setNewReturn({ ...newReturn, cnic_ntn: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Tax Year *</label>
                      <input
                        type="text"
                        value={newReturn.tax_year}
                        onChange={(e) => setNewReturn({ ...newReturn, tax_year: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Filing Date</label>
                      <input
                        type="date"
                        value={newReturn.filing_date}
                        onChange={(e) => setNewReturn({ ...newReturn, filing_date: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Return Type</label>
                      <select
                        value={newReturn.return_type}
                        onChange={(e) => setNewReturn({ ...newReturn, return_type: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="Section 114(1) - Voluntary Return">Section 114(1) - Voluntary Return</option>
                        <option value="Section 114(4) - Notice Return">Section 114(4) - Notice Return</option>
                        <option value="Section 120 - Amended Return">Section 120 - Amended Return</option>
                        <option value="Section 182 - Final Return">Section 182 - Final Return</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                      <select
                        value={newReturn.status}
                        onChange={(e) => setNewReturn({ ...newReturn, status: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processed">Processed</option>
                        <option value="Filed">Filed</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handleSaveReturn}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                    >
                      Update Return
                    </button>
                    <button
                      onClick={() => {
                        setShowEditReturnModal(false);
                        setEditingReturn(null);
                      }}
                      className="px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Update Modal */}
        <AnimatePresence>
          {showStatusModal && statusUpdateReturn && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowStatusModal(false);
                setStatusUpdateReturn(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Update Status</h2>
                  <button
                    onClick={() => {
                      setShowStatusModal(false);
                      setStatusUpdateReturn(null);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-400 mb-2">Client: <span className="text-white font-medium">{statusUpdateReturn.client_name}</span></p>
                  <p className="text-gray-400 mb-4">Tax Year: <span className="text-white font-medium">{statusUpdateReturn.tax_year}</span></p>
                  <p className="text-gray-400 mb-4">Current Status: <span className="text-white font-medium">{statusUpdateReturn.status}</span></p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleSaveStatus('Pending')}
                    className="w-full px-6 py-3 bg-yellow-600/20 text-yellow-400 font-semibold rounded-xl hover:bg-yellow-600/30 transition-all border border-yellow-500/30 flex items-center justify-center gap-2"
                  >
                    <Clock className="w-5 h-5" />
                    Mark as Pending
                  </button>
                  <button
                    onClick={() => handleSaveStatus('Processed')}
                    className="w-full px-6 py-3 bg-blue-600/20 text-blue-400 font-semibold rounded-xl hover:bg-blue-600/30 transition-all border border-blue-500/30 flex items-center justify-center gap-2"
                  >
                    <Activity className="w-5 h-5" />
                    Mark as Processed
                  </button>
                  <button
                    onClick={() => handleSaveStatus('Filed')}
                    className="w-full px-6 py-3 bg-green-600/20 text-green-400 font-semibold rounded-xl hover:bg-green-600/30 transition-all border border-green-500/30 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Mark as Filed
                  </button>
                  <button
                    onClick={() => handleSaveStatus('Rejected')}
                    className="w-full px-6 py-3 bg-red-600/20 text-red-400 font-semibold rounded-xl hover:bg-red-600/30 transition-all border border-red-500/30 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Mark as Rejected
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PDF Preview Modal */}
        <AnimatePresence>
          {showPDFPreview && previewReturnPDF && (
            <PDFPreviewModal
              isOpen={showPDFPreview}
              onClose={() => {
                setShowPDFPreview(false);
                setPreviewReturnPDF(null);
              }}
              pdfPath={previewReturnPDF.file_path || previewReturnPDF.renamed_filename}
              title={`${previewReturnPDF.client_name} - ${previewReturnPDF.tax_year}`}
            />
          )}
        </AnimatePresence>

        {/* Settings Tab Content */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-gray-400 mb-8">Manage your application preferences and configurations</p>

            <div className="space-y-6">
              {/* General Settings */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-6">General Settings</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-400">Receive email updates about your account</p>
                    </div>
                    <button className="w-14 h-7 bg-blue-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-1 top-1"></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-gray-400">Get push notifications on your device</p>
                    </div>
                    <button className="w-14 h-7 bg-gray-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute left-1 top-1"></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-save Documents</p>
                      <p className="text-sm text-gray-400">Automatically save your work</p>
                    </div>
                    <button className="w-14 h-7 bg-blue-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-1 top-1"></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-6">Privacy & Security</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-400">Add an extra layer of security</p>
                    </div>
                    <button className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg border border-green-500/30">
                      Enabled
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Session Timeout</p>
                      <p className="text-sm text-gray-400">Auto logout after inactivity</p>
                    </div>
                    <select className="bg-black/40 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                      <option>15 minutes</option>
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>Never</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Activity Log</p>
                      <p className="text-sm text-gray-400">Track account activity</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all border border-blue-500/30">
                      View Log
                    </button>
                  </div>
                </div>
              </div>

              {/* Appearance Settings */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-6">Appearance</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block font-medium mb-3">Theme</label>
                    <div className="grid grid-cols-3 gap-4">
                      <button className="p-4 bg-black/40 border-2 border-blue-500 rounded-xl hover:bg-black/60 transition-all">
                        <div className="w-full h-20 bg-gradient-to-br from-gray-900 to-black rounded-lg mb-2"></div>
                        <p className="text-sm font-medium">Dark</p>
                      </button>
                      <button className="p-4 bg-black/40 border border-white/10 rounded-xl hover:bg-black/60 transition-all">
                        <div className="w-full h-20 bg-gradient-to-br from-gray-100 to-white rounded-lg mb-2"></div>
                        <p className="text-sm font-medium">Light</p>
                      </button>
                      <button className="p-4 bg-black/40 border border-white/10 rounded-xl hover:bg-black/60 transition-all">
                        <div className="w-full h-20 bg-gradient-to-br from-gray-600 to-gray-400 rounded-lg mb-2"></div>
                        <p className="text-sm font-medium">Auto</p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all">
                  Save All Settings
                </button>
                <button className="px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all">
                  Reset to Default
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Selected Date Appointments View */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeSelectedDateView}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Appointments</h2>
                  <p className="text-gray-400 mt-1">
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <button
                  onClick={closeSelectedDateView}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {selectedDateAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 bg-black/40 border border-white/10 rounded-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${
                            apt.type === 'deadline' ? 'bg-red-400' : 
                            apt.type === 'call' ? 'bg-blue-400' :
                            apt.type === 'review' ? 'bg-purple-400' :
                            'bg-green-400'
                          }`}></div>
                          <h3 className="font-semibold text-lg">{apt.title}</h3>
                        </div>
                        <p className="text-gray-400 mb-2">Client: {apt.client}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{apt.time}</span>
                          </div>
                          <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
                            {apt.type}
                          </span>
                          {apt.notification !== 'none' && (
                            <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs">
                              <Bell className="w-3 h-3 inline mr-1" />
                              {apt.notification} before
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditAppointment(apt)}
                          className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all"
                          title="Edit appointment"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteAppointment(apt.id);
                            const remaining = selectedDateAppointments.filter(a => a.id !== apt.id);
                            if (remaining.length === 0) {
                              closeSelectedDateView();
                            } else {
                              setSelectedDateAppointments(remaining);
                            }
                          }}
                          className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all"
                          title="Delete appointment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setNewAppointment({
                    ...newAppointment,
                    date: selectedDate
                  });
                  closeSelectedDateView();
                  setShowAppointmentModal(true);
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Another Appointment
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Appointment Modal */}
      <AnimatePresence>
        {showAppointmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAppointmentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
              style={{
                scrollBehavior: 'smooth'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingAppointment ? 'Edit Appointment' : 'New Appointment'}
                </h2>
                <button
                  onClick={handleCancelAppointment}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Basic Information Section */}
                <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <FileIcon className="w-4 h-4" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Title *</label>
                      <input
                        type="text"
                        value={newAppointment.title}
                        onChange={(e) => {
                          setNewAppointment({...newAppointment, title: e.target.value});
                          if (formErrors.title) setFormErrors({...formErrors, title: false});
                        }}
                        placeholder="e.g., Tax Consultation"
                        className={`w-full bg-black/40 border rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 transition-colors ${
                          formErrors.title 
                            ? 'border-red-500 focus:ring-red-500/40' 
                            : 'border-white/10 focus:ring-blue-500/40'
                        }`}
                      />
                      {formErrors.title && (
                        <p className="text-red-400 text-xs mt-1">Title is required</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Client Name *</label>
                      <input
                        type="text"
                        value={newAppointment.client}
                        onChange={(e) => {
                          setNewAppointment({...newAppointment, client: e.target.value});
                          if (formErrors.client) setFormErrors({...formErrors, client: false});
                        }}
                        placeholder="e.g., John Smith"
                        className={`w-full bg-black/40 border rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 transition-colors ${
                          formErrors.client 
                            ? 'border-red-500 focus:ring-red-500/40' 
                            : 'border-white/10 focus:ring-blue-500/40'
                        }`}
                      />
                      {formErrors.client && (
                        <p className="text-red-400 text-xs mt-1">Client name is required</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-green-400" />
                        Client Email
                      </label>
                      <input
                        type="email"
                        value={newAppointment.clientEmail}
                        onChange={(e) => setNewAppointment({...newAppointment, clientEmail: e.target.value})}
                        placeholder="client@email.com"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-400" />
                        Client Phone
                      </label>
                      <input
                        type="tel"
                        value={newAppointment.clientPhone}
                        onChange={(e) => setNewAppointment({...newAppointment, clientPhone: e.target.value})}
                        placeholder="+1 (555) 123-4567"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Date & Time Section */}
                <div className="bg-purple-600/10 border border-purple-500/30 rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date & Time
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Date *</label>
                      <input
                        type="date"
                        value={newAppointment.date}
                        onChange={(e) => {
                          setNewAppointment({...newAppointment, date: e.target.value});
                          if (formErrors.date) setFormErrors({...formErrors, date: false});
                        }}
                        className={`w-full bg-black/40 border rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 transition-colors ${
                          formErrors.date 
                            ? 'border-red-500 focus:ring-red-500/40' 
                            : 'border-white/10 focus:ring-blue-500/40'
                        }`}
                      />
                      {formErrors.date && (
                        <p className="text-red-400 text-xs mt-1">Date is required</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Time *</label>
                      <input
                        type="time"
                        value={newAppointment.time}
                        onChange={(e) => {
                          setNewAppointment({...newAppointment, time: e.target.value});
                          if (formErrors.time) setFormErrors({...formErrors, time: false});
                        }}
                        className={`w-full bg-black/40 border rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 transition-colors ${
                          formErrors.time 
                            ? 'border-red-500 focus:ring-red-500/40' 
                            : 'border-white/10 focus:ring-blue-500/40'
                        }`}
                      />
                      {formErrors.time && (
                        <p className="text-red-400 text-xs mt-1">Time is required</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                        <Timer className="w-4 h-4 text-orange-400" />
                        Duration
                      </label>
                      <select
                        value={newAppointment.duration}
                        onChange={(e) => setNewAppointment({...newAppointment, duration: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                        <option value="180">3 hours</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Appointment Details Section */}
                <div className="bg-green-600/10 border border-green-500/30 rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Appointment Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
                      <select
                        value={newAppointment.type}
                        onChange={(e) => setNewAppointment({...newAppointment, type: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="meeting">Meeting</option>
                        <option value="call">Call</option>
                        <option value="deadline">Deadline</option>
                        <option value="review">Review</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        Priority
                      </label>
                      <select
                        value={newAppointment.priority}
                        onChange={(e) => setNewAppointment({...newAppointment, priority: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                      <select
                        value={newAppointment.status}
                        onChange={(e) => setNewAppointment({...newAppointment, status: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rescheduled">Rescheduled</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-400" />
                      Location / Meeting Link
                    </label>
                    <input
                      type="text"
                      value={newAppointment.location}
                      onChange={(e) => setNewAppointment({...newAppointment, location: e.target.value})}
                      placeholder="Office address or Zoom/Teams link"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <FileIcon className="w-4 h-4 text-blue-400" />
                      Notes
                    </label>
                    <textarea
                      value={newAppointment.notes}
                      onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                      placeholder="Add any additional notes or details about this appointment..."
                      rows="3"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                    />
                  </div>
                </div>

                {/* Reminders Section */}
                <div className="bg-orange-600/10 border border-orange-500/30 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Reminders & Recurrence
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Notification</label>
                      <select
                        value={newAppointment.notification}
                        onChange={(e) => setNewAppointment({...newAppointment, notification: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="none">No notification</option>
                        <option value="5min">5 minutes before</option>
                        <option value="15min">15 minutes before</option>
                        <option value="30min">30 minutes before</option>
                        <option value="1hour">1 hour before</option>
                        <option value="1day">1 day before</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Repeat</label>
                      <select
                        value={newAppointment.repeat}
                        onChange={(e) => setNewAppointment({...newAppointment, repeat: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="none">Does not repeat</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Every 2 weeks</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={handleAddAppointment}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                  >
                    {editingAppointment ? 'Update Appointment' : 'Create Appointment'}
                  </button>
                  <button
                    onClick={handleCancelAppointment}
                    className="px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Client Modal */}
      <AnimatePresence>
        {showClientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancelClient}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingClient ? 'Edit Client' : 'Add New Client'}
                </h2>
                <button
                  onClick={handleCancelClient}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Template Structure Notice */}
                <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-blue-300">
                    Form follows the standard template structure for client data
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File No */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">File No</label>
                    <input
                      type="text"
                      value={newClient.fileNo}
                      onChange={(e) => setNewClient({...newClient, fileNo: e.target.value})}
                      placeholder="Auto-generated"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  {/* NTN */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">NTN (New NTN)</label>
                    <input
                      type="text"
                      value={newClient.ntn}
                      onChange={(e) => setNewClient({...newClient, ntn: e.target.value})}
                      placeholder="1234567-8"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  {/* Title of the Case (Name) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Title of the Case *</label>
                    <input
                      type="text"
                      value={newClient.name}
                      onChange={(e) => {
                        setNewClient({...newClient, name: e.target.value});
                        if (clientFormErrors.name) setClientFormErrors({...clientFormErrors, name: false});
                      }}
                      placeholder="John Smith or ABC Corporation"
                      className={`w-full bg-black/40 border rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 transition-colors ${
                        clientFormErrors.name 
                          ? 'border-red-500 focus:ring-red-500/40' 
                          : 'border-white/10 focus:ring-blue-500/40'
                      }`}
                    />
                    {clientFormErrors.name && (
                      <p className="text-red-400 text-xs mt-1">Title of the Case is required</p>
                    )}
                  </div>

                  {/* CNIC */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">NIC No (CNIC)</label>
                    <input
                      type="text"
                      value={newClient.cnic}
                      onChange={(e) => setNewClient({...newClient, cnic: e.target.value})}
                      placeholder="12345-6789012-3"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  {/* Person Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Person Type</label>
                    <select
                      value={newClient.person}
                      onChange={(e) => setNewClient({...newClient, person: e.target.value, sourceOfIncome: ''})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="Individual">Individual</option>
                      <option value="Company">Company</option>
                      <option value="AOP">AOP</option>
                    </select>
                  </div>

                  {/* Source of Income - Multiple Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Source of Income (Multiple Selection)</label>
                    <div className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 max-h-48 overflow-y-auto">
                      {newClient.person === 'Company' && (
                        <label className="flex items-center gap-2 py-1 cursor-pointer hover:bg-white/5 rounded px-2">
                          <input
                            type="checkbox"
                            checked={(newClient.sourceOfIncome || '').split(',').map(s => s.trim()).includes('Company')}
                            onChange={(e) => {
                              const sources = (newClient.sourceOfIncome || '').split(',').map(s => s.trim()).filter(s => s);
                              if (e.target.checked) {
                                sources.push('Company');
                              } else {
                                const index = sources.indexOf('Company');
                                if (index > -1) sources.splice(index, 1);
                              }
                              setNewClient({...newClient, sourceOfIncome: sources.join(', ')});
                            }}
                            className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-500 focus:ring-2 focus:ring-blue-500/40"
                          />
                          <span className="text-white text-sm">Company</span>
                        </label>
                      )}
                      {newClient.person === 'AOP' && (
                        <>
                          <label className="flex items-center gap-2 py-1 cursor-pointer hover:bg-white/5 rounded px-2">
                            <input
                              type="checkbox"
                              checked={(newClient.sourceOfIncome || '').split(',').map(s => s.trim()).includes('AOP')}
                              onChange={(e) => {
                                const sources = (newClient.sourceOfIncome || '').split(',').map(s => s.trim()).filter(s => s);
                                if (e.target.checked) {
                                  sources.push('AOP');
                                } else {
                                  const index = sources.indexOf('AOP');
                                  if (index > -1) sources.splice(index, 1);
                                }
                                setNewClient({...newClient, sourceOfIncome: sources.join(', ')});
                              }}
                              className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-500 focus:ring-2 focus:ring-blue-500/40"
                            />
                            <span className="text-white text-sm">AOP</span>
                          </label>
                          <label className="flex items-center gap-2 py-1 cursor-pointer hover:bg-white/5 rounded px-2">
                            <input
                              type="checkbox"
                              checked={(newClient.sourceOfIncome || '').split(',').map(s => s.trim()).includes('Distributor AOP')}
                              onChange={(e) => {
                                const sources = (newClient.sourceOfIncome || '').split(',').map(s => s.trim()).filter(s => s);
                                if (e.target.checked) {
                                  sources.push('Distributor AOP');
                                } else {
                                  const index = sources.indexOf('Distributor AOP');
                                  if (index > -1) sources.splice(index, 1);
                                }
                                setNewClient({...newClient, sourceOfIncome: sources.join(', ')});
                              }}
                              className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-500 focus:ring-2 focus:ring-blue-500/40"
                            />
                            <span className="text-white text-sm">Distributor AOP</span>
                          </label>
                        </>
                      )}
                      {newClient.person === 'Individual' && (
                        <>
                          {['Business', 'Salary', 'Property', 'Other Source', 'Foreign Source', 'Capital Gain', 'Agriculture', 'Freelancer', 'Commission', 'Partnership'].map(source => (
                            <label key={source} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-white/5 rounded px-2">
                              <input
                                type="checkbox"
                                checked={(newClient.sourceOfIncome || '').split(',').map(s => s.trim()).includes(source)}
                                onChange={(e) => {
                                  const sources = (newClient.sourceOfIncome || '').split(',').map(s => s.trim()).filter(s => s);
                                  if (e.target.checked) {
                                    sources.push(source);
                                  } else {
                                    const index = sources.indexOf(source);
                                    if (index > -1) sources.splice(index, 1);
                                  }
                                  setNewClient({...newClient, sourceOfIncome: sources.join(', ')});
                                }}
                                className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-500 focus:ring-2 focus:ring-blue-500/40"
                              />
                              <span className="text-white text-sm">{source}</span>
                            </label>
                          ))}
                        </>
                      )}
                      {!newClient.person && (
                        <p className="text-gray-500 text-sm py-2">Please select Person Type first</p>
                      )}
                    </div>
                  </div>

                  {/* Business Classification */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Business Classification</label>
                    <input
                      type="text"
                      value={newClient.businessClassification}
                      onChange={(e) => setNewClient({...newClient, businessClassification: e.target.value})}
                      placeholder="e.g., Retail, Manufacturing"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  {/* IRIS PIN */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">PIN (IRIS)</label>
                    <input
                      type="text"
                      value={newClient.irisPin}
                      onChange={(e) => setNewClient({...newClient, irisPin: e.target.value})}
                      placeholder="2030"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  {/* IRIS Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Password (IRIS)</label>
                    <input
                      type="password"
                      value={newClient.irisPassword}
                      onChange={(e) => setNewClient({...newClient, irisPassword: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Mail</label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => {
                        setNewClient({...newClient, email: e.target.value});
                        if (clientFormErrors.email) setClientFormErrors({...clientFormErrors, email: false});
                      }}
                      placeholder="john@example.com"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  {/* Email Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Password (Mail)</label>
                    <input
                      type="password"
                      value={newClient.emailPassword}
                      onChange={(e) => setNewClient({...newClient, emailPassword: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => {
                        setNewClient({...newClient, phone: e.target.value});
                        if (clientFormErrors.phone) setClientFormErrors({...clientFormErrors, phone: false});
                      }}
                      placeholder="+92-300-1234567"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">City</label>
                    <select
                      value={newClient.city}
                      onChange={(e) => setNewClient({...newClient, city: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <option value="">Select City</option>
                      <option value="Abbottabad">Abbottabad</option>
                      <option value="Haripur">Haripur</option>
                      <option value="Havelian">Havelian</option>
                    </select>
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
                    <input
                      type="text"
                      value={newClient.address}
                      onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                      placeholder="123 Main Street, Area"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                    <select
                      value={newClient.status}
                      onChange={(e) => setNewClient({...newClient, status: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  {/* Tax Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Tax Year</label>
                    <select
                      value={newClient.taxYear}
                      onChange={(e) => setNewClient({...newClient, taxYear: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                      <option value="2021">2021</option>
                      <option value="2020">2020</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Notes</label>
                    <textarea
                      value={newClient.notes}
                      onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                      placeholder="Add any additional notes about this client..."
                      rows="3"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handleAddClient}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                  >
                    {editingClient ? 'Update Client' : 'Add Client'}
                  </button>
                  <button
                    onClick={handleCancelClient}
                    className="px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Composer Modal */}
      <AnimatePresence>
        {showEmailComposer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEmailComposer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-600/20 rounded-xl">
                    <Mail className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Send Email</h2>
                    <p className="text-sm text-gray-400">Compose and send email to selected clients</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmailComposer(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Recipients ({emailData.to.length})</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-black/40 border border-white/10 rounded-xl min-h-[60px]">
                    {emailData.to.map((recipient, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg text-sm flex items-center gap-2">
                        {recipient.name}
                        <button
                          onClick={() => setEmailData({
                            ...emailData,
                            to: emailData.to.filter((_, i) => i !== index)
                          })}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Template</label>
                  <select
                    value={emailData.template}
                    onChange={(e) => handleEmailTemplateChange(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    {emailTemplates.map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Subject *</label>
                  <input
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                    placeholder="Email subject..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Message *</label>
                  <textarea
                    value={emailData.body}
                    onChange={(e) => setEmailData({...emailData, body: e.target.value})}
                    placeholder="Type your message here..."
                    rows="10"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Tip: Use [Client Name] and [Date] as placeholders
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSendEmail}
                    disabled={!emailData.subject || !emailData.body || emailData.to.length === 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    Send Email
                  </button>
                  <button
                    onClick={() => setShowEmailComposer(false)}
                    className="px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SMS Composer Modal */}
      <AnimatePresence>
        {showSMSComposer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSMSComposer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-2xl w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-600/20 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Send SMS</h2>
                    <p className="text-sm text-gray-400">Send text message to selected clients</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSMSComposer(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Recipients ({smsData.to.length})</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-black/40 border border-white/10 rounded-xl min-h-[60px]">
                    {smsData.to.map((recipient, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-lg text-sm flex items-center gap-2">
                        {recipient.name}
                        <button
                          onClick={() => setSmsData({
                            ...smsData,
                            to: smsData.to.filter((_, i) => i !== index)
                          })}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Template</label>
                  <select
                    value={smsData.template}
                    onChange={(e) => handleSMSTemplateChange(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    {smsTemplates.map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center justify-between">
                    <span>Message *</span>
                    <span className="text-xs text-gray-500">{smsData.message.length}/160 characters</span>
                  </label>
                  <textarea
                    value={smsData.message}
                    onChange={(e) => setSmsData({...smsData, message: e.target.value})}
                    placeholder="Type your SMS message here..."
                    rows="5"
                    maxLength="160"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Tip: Use [Client Name] and [Date] as placeholders
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSendSMS}
                    disabled={!smsData.message || smsData.to.length === 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    Send SMS
                  </button>
                  <button
                    onClick={() => setShowSMSComposer(false)}
                    className="px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Management Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTaskModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-600/20 rounded-xl">
                    <CheckSquare className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Client Tasks</h2>
                    <p className="text-sm text-gray-400">Manage tasks and follow-ups</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add New Task Form */}
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-blue-400 mb-3">Add New Task</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      placeholder="Task title..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <select
                      value={newTask.clientId || ''}
                      onChange={(e) => setNewTask({...newTask, clientId: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <option value="">Select Client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                  <div>
                    <button
                      onClick={handleAddTask}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Task
                    </button>
                  </div>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-3">
                {clientTasks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">No tasks yet</p>
                    <p className="text-sm">Add your first task above</p>
                  </div>
                ) : (
                  clientTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-black/20 border border-white/10 rounded-xl hover:bg-black/30 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={() => handleUpdateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                            className="w-5 h-5 mt-1 rounded border-white/20 bg-black/40 text-blue-600 focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                          />
                          <div className="flex-1">
                            <h4 className={`font-medium mb-1 ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {task.clientName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                task.priority === 'high' ? 'bg-red-600/20 text-red-400' :
                                task.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                                'bg-green-600/20 text-green-400'
                              }`}>
                                {task.priority}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                task.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                                task.status === 'in-progress' ? 'bg-blue-600/20 text-blue-400' :
                                'bg-gray-600/20 text-gray-400'
                              }`}>
                                {task.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client Details Modal */}
      <AnimatePresence>
        {showClientDetailModal && selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowClientDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold">
                    {selectedClient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedClient.name}</h2>
                    <p className="text-gray-400">{selectedClient.businessType}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowClientDetailModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Email</span>
                  </div>
                  <p className="font-medium">{selectedClient.email}</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Phone</span>
                  </div>
                  <p className="font-medium">{selectedClient.phone}</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Address</span>
                  </div>
                  <p className="font-medium">{selectedClient.address}</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Tax ID</span>
                  </div>
                  <p className="font-medium">{selectedClient.taxId}</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Returns Filed</span>
                  </div>
                  <p className="font-medium">{selectedClient.returns} returns</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Last Contact</span>
                  </div>
                  <p className="font-medium">{new Date(selectedClient.lastContact).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Status</span>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    selectedClient.status === 'Active' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'
                  }`}>
                    {selectedClient.status}
                  </span>
                </div>
              </div>

              {selectedClient.notes && (
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <FileIcon className="w-4 h-4" />
                    <span className="text-sm">Notes</span>
                  </div>
                  <p className="text-gray-300">{selectedClient.notes}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowClientDetailModal(false);
                    handleEditClient(selectedClient);
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600/20 text-blue-400 font-semibold rounded-xl hover:bg-blue-600/30 transition-all border border-blue-500/30"
                >
                  Edit Client
                </button>
                <button
                  onClick={() => setShowClientDetailModal(false)}
                  className="px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Folder Configuration Modal */}
      <AnimatePresence>
        {showFolderConfigModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFolderConfigModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-2xl w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-600/20 rounded-xl">
                    <Settings className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Configure Watch Folder</h2>
                    <p className="text-sm text-gray-400">Set the folder to monitor for tax return PDFs</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFolderConfigModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Current Folder Display */}
                <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Current Configuration</span>
                  </div>
                  <p className="text-sm text-gray-300 font-mono">
                    {watchFolder || 'No folder configured yet'}
                  </p>
                </div>

                {/* Folder Input with Browse Button */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Watch Folder Path *
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={watchFolder}
                      onChange={(e) => setWatchFolder(e.target.value)}
                      placeholder="C:\Users\YourName\Documents\TaxReturns"
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 font-mono text-sm"
                    />
                    <button
                      onClick={async () => {
                        try {
                          // Check if the File System Access API is supported
                          if ('showDirectoryPicker' in window) {
                            const dirHandle = await window.showDirectoryPicker({
                              mode: 'read',
                              startIn: 'documents'
                            });
                            
                            // Try to get the full path using the handle
                            let folderPath = dirHandle.name;
                            
                            // For Electron or when full path is available
                            if (dirHandle.getPath) {
                              folderPath = await dirHandle.getPath();
                            }
                            
                            setWatchFolder(folderPath);
                            localStorage.setItem('taxReturnWatchFolder', folderPath);
                            
                            // Show minimalist custom confirmation
                            setSelectedFolderPath(folderPath);
                            setShowFolderConfirmation(true);
                            
                            // Auto-hide after 3 seconds
                            setTimeout(() => {
                              setShowFolderConfirmation(false);
                            }, 3000);
                          } else {
                            // Fallback for browsers that don't support the API
                            toast.error('Folder picker not supported in this browser. Please enter path manually.');
                          }
                        } catch (error) {
                          if (error.name !== 'AbortError') {
                            console.error('Error selecting folder:', error);
                            toast.error('Error selecting folder. Please try again.');
                          }
                        }
                      }}
                      className="px-6 py-3 bg-blue-600/20 text-blue-400 font-semibold rounded-xl hover:bg-blue-600/30 transition-all flex items-center gap-2 border border-blue-500/30 whitespace-nowrap"
                      title="Browse for folder"
                    >
                      <Search className="w-5 h-5" />
                      Browse
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Click "Browse" to select a folder or enter the full path manually
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-orange-600/10 border border-orange-500/30 rounded-xl p-4">
                  <h3 className="font-semibold text-orange-400 mb-3 flex items-center gap-2">
                    <FileIcon className="w-5 h-5" />
                    How It Works
                  </h3>
                  <ol className="space-y-2 text-sm text-gray-300">
                    <li className="flex gap-2">
                      <span className="text-orange-400 font-semibold">1.</span>
                      <span>Set your watch folder path above</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-orange-400 font-semibold">2.</span>
                      <span>Start the processor: <code className="bg-black/40 px-2 py-0.5 rounded text-xs">start_tax_return_processor.bat</code></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-orange-400 font-semibold">3.</span>
                      <span>Place PDF files in your watch folder</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-orange-400 font-semibold">4.</span>
                      <span>Files will be automatically renamed and processed</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-orange-400 font-semibold">5.</span>
                      <span>Click "Refresh" button to see new returns</span>
                    </li>
                  </ol>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      if (!watchFolder.trim()) {
                        alert('Please enter a valid folder path');
                        return;
                      }
                      localStorage.setItem('taxReturnWatchFolder', watchFolder);
                      setShowFolderConfigModal(false);
                      alert(`✅ Folder Configured!\n\nWatch Folder: ${watchFolder}\n\n📋 Next Steps:\n1. Start the processor: start_tax_return_processor.bat\n2. Place PDFs in: ${watchFolder}\n3. Files will be auto-processed\n4. Click "Refresh" to see new returns\n\n💡 Keep the processor running in background!`);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Configuration
                  </button>
                  <button
                    onClick={() => setShowFolderConfigModal(false)}
                    className="px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>

                {/* Additional Info */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="font-semibold mb-2 text-sm">💡 Pro Tips:</h4>
                  <ul className="space-y-1 text-xs text-gray-400">
                    <li>• Use a dedicated folder for tax returns only</li>
                    <li>• Keep the processor running in the background</li>
                    <li>• Processed files are moved to "Completed" subfolder</li>
                    <li>• Files are renamed: ClientName-CNIC-TaxYear-2025.pdf</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimalist Folder Confirmation Popup */}
      <AnimatePresence>
        {showFolderConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[60]"
          >
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl border border-green-400/30 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Folder Selected</p>
                  <p className="text-xs text-green-100 font-mono mt-1 max-w-md truncate">
                    {selectedFolderPath}
                  </p>
                </div>
                <button
                  onClick={() => setShowFolderConfirmation(false)}
                  className="ml-4 p-1 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Client Confirmation Modal */}
      <AnimatePresence>
        {showNewClientConfirm && pendingNewClientData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-white/10 p-6 max-w-md w-full"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-600/20 rounded-full">
                  <AlertCircle className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Client Not Found</h3>
                  <p className="text-sm text-gray-300 mb-4">
                    The client with the search term <strong className="text-white">"{irisSearchTerm}"</strong> does not exist in the system.
                  </p>
                  <p className="text-sm text-gray-400 mb-6">
                    Do you want to add this as a new client and proceed with creating the return?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowNewClientConfirm(false);
                        setPendingNewClientData(null);
                      }}
                      className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setNewReturn({
                          ...newReturn,
                          ...pendingNewClientData
                        });
                        setShowNewClientConfirm(false);
                        setPendingNewClientData(null);
                        setIrisStep(2);
                      }}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-medium transition-all"
                    >
                      Yes, Add Client
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Return Modal - New Component */}
      <AddReturnModal
        isOpen={showAddReturnModal}
        onClose={() => {
          setShowAddReturnModal(false);
          setIrisSearchTerm('');
          setIrisSelectedClient(null);
          setIrisStep(1);
        }}
        clients={clients}
        onProceed={handleAddReturnProceed}
      />

      {/* Tax Calculation Modal */}
      {showTaxCalculationModal && selectedReturnData && (
        taxCalculationMode === 'simple' ? (
          <SimpleTaxCalculationModal
            isOpen={showTaxCalculationModal}
            onClose={() => {
              setShowTaxCalculationModal(false);
              setSelectedReturnData(null);
            }}
            returnData={selectedReturnData}
            onSave={handleSaveTaxCalculation}
          />
        ) : (
          <TaxCalculationModal
            isOpen={showTaxCalculationModal}
            onClose={() => {
              setShowTaxCalculationModal(false);
              setSelectedReturnData(null);
            }}
            returnData={selectedReturnData}
            onSave={handleSaveTaxCalculation}
            skipPersonalInfo={true}
          />
        )
      )}

      {/* Toast Notifications */}
      <ToastNotification
        toasts={toastNotifications}
        onDismiss={dismissToast}
      />
    </div>
  );
};

export default Dashboard;
