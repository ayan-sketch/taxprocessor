/**
 * PDF Processor Panel Component
 * Integrated PDF processing UI for the Dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Loader, 
  FolderOpen,
  Play,
  RefreshCw,
  AlertCircle,
  Eye,
  Download,
  Share2,
  Edit3,
  Clock,
  Trash2,
  BarChart3,
  Link,
  Copy,
  Settings
} from 'lucide-react';
import apiClient from '../utils/apiClient';
import io from 'socket.io-client';
import PDFPreviewModal from './common/PDFPreviewModal';
import ShareModal from './common/ShareModal';
import EditReturnModal from './common/EditReturnModal';
import StatisticsDashboard from './common/StatisticsDashboard';
import SearchAndFilter from './common/SearchAndFilter';
import StatusTrackingModal from './common/StatusTrackingModal';
import ClientLinkingModal from './common/ClientLinkingModal';
import { extractDataFromPDF, validateExtractedData } from '../utils/pdfExtractor';

const PDFProcessorPanel = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [config, setConfig] = useState(null);
  const [scannedFiles, setScannedFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [currentFile, setCurrentFile] = useState(null);
  const [results, setResults] = useState([]);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderHandle, setFolderHandle] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [processingHistory, setProcessingHistory] = useState([]);
  const [lastFolderPath, setLastFolderPath] = useState(localStorage.getItem('lastFolderPath') || null);
  
  // New states for preview and sharing
  const [previewModal, setPreviewModal] = useState({ isOpen: false, pdfUrl: null, fileName: null, returnId: null });
  const [shareModal, setShareModal] = useState({ isOpen: false, selectedReturns: [] });
  const [processedReturns, setProcessedReturns] = useState([]);
  const [selectedReturnIds, setSelectedReturnIds] = useState([]);
  
  // New states for advanced features
  const [editModal, setEditModal] = useState({ isOpen: false, returnData: null });
  const [statusModal, setStatusModal] = useState({ isOpen: false, returnData: null });
  const [clientLinkModal, setClientLinkModal] = useState({ isOpen: false, returnData: null });
  const [showStatistics, setShowStatistics] = useState(false);
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'stats'
  
  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Initialize WebSocket connection
  useEffect(() => {
    // Backend removed - socket.io no longer needed
    // const newSocket = io('http://localhost:5000');
    
    // newSocket.on('connect', () => {
    //   console.log('Connected to API server');
    //   setIsConnected(true);
    //   loadConfig();
    //   loadProcessedReturns();
    // });

    // newSocket.on('disconnect', () => {
    //   console.log('Disconnected from API server');
    //   setIsConnected(false);
    // });

    // newSocket.on('batch_progress', (data) => {
    //   setProgress({
    //     current: data.current,
    //     total: data.total,
    //     percentage: data.percentage
    //   });
    //   setCurrentFile(data.filename);
    // });

    // newSocket.on('batch_complete', (data) => {
    //   setIsProcessing(false);
    //   setResults(data.results);
    //   setProgress({ current: data.total, total: data.total, percentage: 100 });
    //   
    //   // Show success notification
    //   alert(`✅ Processing Complete!\n\nSuccessful: ${data.successful}\nFailed: ${data.failed}\nTotal: ${data.total}`);
    //   
    //   // Refresh the scanned files list and processed returns
    //   handleScanFolder();
    //   loadProcessedReturns();
    // });

    // newSocket.on('batch_error', (data) => {
    //   setIsProcessing(false);
    //   setError(data.error);
    //   alert(`❌ Processing Error: ${data.error}`);
    // });

    // setSocket(newSocket);

    // Cleanup function to prevent memory leaks
    // return () => {
    //   console.log('Cleaning up WebSocket connection');
    //   newSocket.off('connect');
    //   newSocket.off('disconnect');
    //   newSocket.off('batch_progress');
    //   newSocket.off('batch_complete');
    //   newSocket.off('batch_error');
    //   newSocket.close();
    // };
  }, []); // Empty dependency array - only run once on mount

  // Load configuration
  const loadConfig = async () => {
    try {
      const data = await apiClient.getConfig();
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  // Load processed returns
  const loadProcessedReturns = async () => {
    try {
      const data = await apiClient.getReturns();
      setProcessedReturns(data.returns || []);
      setFilteredReturns(data.returns || []);
    } catch (error) {
      console.error('Error loading returns:', error);
    }
  };

  // Scan folder for PDFs
  const handleScanFolder = async () => {
    if (!folderHandle) {
      alert('⚠️ Please select a folder first.');
      return;
    }
    
    await scanFolderForPDFs(folderHandle);
  };

  // Select custom folder using File System Access API
  const handleSelectFolder = async () => {
    try {
      // Check if File System Access API is supported
      if (!('showDirectoryPicker' in window)) {
        alert('❌ Folder Selection Not Supported\n\nYour browser does not support folder selection.\n\nPlease use:\n• Chrome 86+\n• Edge 86+\n• Opera 72+\n\nOr any Chromium-based browser.');
        return;
      }

      // Request directory access with better error handling
      let dirHandle;
      try {
        dirHandle = await window.showDirectoryPicker({
          mode: 'readwrite',
          startIn: lastFolderPath || 'documents'
        });
      } catch (permError) {
        if (permError.name === 'AbortError') {
          console.log('Folder selection cancelled by user');
          return;
        } else if (permError.name === 'NotAllowedError') {
          alert('❌ Permission Denied\n\nPlease grant permission to access the folder.\n\nTry again and click "Allow" when prompted.');
          return;
        } else {
          throw permError;
        }
      }
      
      // Save folder path to localStorage
      const folderPath = dirHandle.name;
      localStorage.setItem('lastFolderPath', folderPath);
      setLastFolderPath(folderPath);
      
      setSelectedFolder(folderPath);
      setFolderHandle(dirHandle);
      
      // Show success message with folder path
      alert(`✅ Folder Selected Successfully\n\nFolder: ${folderPath}\n\nClick "Scan Folder" to find PDF files.`);
      
    } catch (error) {
      console.error('Error selecting folder:', error);
      alert(`❌ Error Selecting Folder\n\n${error.message}\n\nPlease try again or select a different folder.`);
    }
  };

  // Cancel operation
  const handleCancelOperation = () => {
    setIsCancelling(true);
    alert('⚠️ Cancelling operation...\n\nCurrent file will finish processing, then operation will stop.');
  };
  
  // Toggle file selection
  const toggleFileSelection = (fileName) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileName)) {
        return prev.filter(f => f !== fileName);
      } else {
        return [...prev, fileName];
      }
    });
  };
  
  // Select all files
  const selectAllFiles = () => {
    setSelectedFiles(scannedFiles.map(f => f.name));
  };
  
  // Deselect all files
  const deselectAllFiles = () => {
    setSelectedFiles([]);
  };

  // Scan folder for PDFs and rename them with automatic extraction
  const scanFolderForPDFs = async (dirHandle) => {
    setIsScanning(true);
    setError(null);
    setIsCancelling(false);
    const pdfFiles = [];
    
    try {
      console.log('Starting folder scan...');
      
      // Iterate through all files in the directory
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.pdf')) {
          console.log('Found PDF:', entry.name);
          pdfFiles.push({
            name: entry.name,
            handle: entry
          });
        }
      }
      
      console.log(`Found ${pdfFiles.length} PDF files`);
      
      if (pdfFiles.length === 0) {
        alert('ℹ️ No PDF files found in the selected folder.');
        setScannedFiles([]);
        setIsScanning(false);
        return;
      }
      
      // Create "completed" subfolder if it doesn't exist
      let completedFolderHandle;
      try {
        completedFolderHandle = await dirHandle.getDirectoryHandle('completed', { create: true });
        console.log('Created/accessed "completed" subfolder');
      } catch (error) {
        console.error('Error creating completed folder:', error);
        alert('❌ Failed to create "completed" subfolder. Please check folder permissions.');
        setIsScanning(false);
        return;
      }
      
      // Process each PDF for extraction and renaming
      const processedFiles = [];
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < pdfFiles.length; i++) {
        // Check if operation was cancelled
        if (isCancelling) {
          console.log('Operation cancelled by user');
          alert(`⚠️ Operation Cancelled\n\nProcessed: ${successCount}\nRemaining: ${pdfFiles.length - i}`);
          break;
        }
        
        const pdfFile = pdfFiles[i];
        
        try {
          console.log(`\n=== Processing file ${i + 1}/${pdfFiles.length}: ${pdfFile.name} ===`);
          
          setCurrentFile(`Processing ${i + 1}/${pdfFiles.length}: ${pdfFile.name}`);
          setProgress({
            current: i + 1,
            total: pdfFiles.length,
            percentage: Math.round(((i + 1) / pdfFiles.length) * 100)
          });
          
          // Read the PDF file
          console.log('Reading PDF file...');
          const file = await pdfFile.handle.getFile();
          console.log('File read successfully:', file.name, file.size, 'bytes');
          
          // Check for duplicate file in completed folder
          try {
            const completedFiles = [];
            for await (const entry of completedFolderHandle.values()) {
              if (entry.kind === 'file') {
                completedFiles.push(entry.name);
              }
            }
            
            // Check if a file with similar name exists
            const similarFile = completedFiles.find(name => 
              name.toLowerCase().includes(pdfFile.name.toLowerCase().replace('.pdf', ''))
            );
            
            if (similarFile) {
              const overwrite = confirm(
                `⚠️ Duplicate File Detected\n\n` +
                `A similar file already exists in the completed folder:\n"${similarFile}"\n\n` +
                `Current file: "${pdfFile.name}"\n\n` +
                `Do you want to overwrite it?`
              );
              
              if (!overwrite) {
                console.log('Skipping duplicate file:', pdfFile.name);
                processedFiles.push({
                  originalName: pdfFile.name,
                  status: 'skipped',
                  reason: 'Duplicate file - user chose not to overwrite'
                });
                continue;
              }
            }
          } catch (dupError) {
            console.warn('Could not check for duplicates:', dupError);
          }
          
          // Extract data from PDF
          console.log('Starting data extraction...');
          const extractedData = await extractDataFromPDF(file);
          console.log('Extraction complete:', extractedData);
          
          let name = extractedData.name;
          let cnicNtn = extractedData.cnicNtn;
          let taxYear = extractedData.taxYear;
          
          // Validate extracted data
          const validation = validateExtractedData(extractedData);
          
          // If extraction failed or validation failed, ask user for manual input
          if (!extractedData.success || !validation.isValid) {
            console.warn(`Extraction issues for ${pdfFile.name}:`, validation.errors);
            
            const userConfirm = confirm(
              `⚠️ Could not fully extract data from "${pdfFile.name}".\n\n` +
              `Extracted:\n` +
              `- Name: ${name || 'Not found'}\n` +
              `- CNIC/NTN: ${cnicNtn || 'Not found'}\n` +
              `- Tax Year: ${taxYear || 'Not found'}\n\n` +
              `Issues: ${validation.errors.join(', ')}\n\n` +
              `Would you like to enter the data manually?`
            );
            
            if (!userConfirm) {
              failCount++;
              processedFiles.push({
                originalName: pdfFile.name,
                status: 'skipped',
                reason: 'User skipped manual entry'
              });
              continue;
            }
            
            // Manual input
            if (!name || name.length < 3) {
              name = prompt(`Enter Name for "${pdfFile.name}":`, name || '');
              if (!name) {
                failCount++;
                processedFiles.push({
                  originalName: pdfFile.name,
                  status: 'failed',
                  reason: 'Name not provided'
                });
                continue;
              }
            }
            
            if (!cnicNtn) {
              cnicNtn = prompt(`Enter CNIC/NTN for "${pdfFile.name}":`, cnicNtn || '');
              if (!cnicNtn) {
                failCount++;
                processedFiles.push({
                  originalName: pdfFile.name,
                  status: 'failed',
                  reason: 'CNIC/NTN not provided'
                });
                continue;
              }
            }
            
            if (!taxYear) {
              taxYear = prompt(`Enter Tax Year for "${pdfFile.name}":`, taxYear || new Date().getFullYear().toString());
              if (!taxYear) {
                failCount++;
                processedFiles.push({
                  originalName: pdfFile.name,
                  status: 'failed',
                  reason: 'Tax Year not provided'
                });
                continue;
              }
            }
          }
          
          // Import sanitizeFilename function
          const { sanitizeFilename } = await import('../utils/pdfExtractor');
          
          // Sanitize filename components with improved function
          const sanitizedName = sanitizeFilename(name);
          // Remove dashes from CNIC/NTN for filename
          const sanitizedCnicNtn = sanitizeFilename(cnicNtn.replace(/-/g, ''));
          const sanitizedTaxYear = sanitizeFilename(taxYear);
          
          // Create new filename in format: name-cnic/ntn-tax year.pdf
          const newFileName = `${sanitizedName}-${sanitizedCnicNtn}-${sanitizedTaxYear}.pdf`;
          console.log('Creating new file with name:', newFileName);
          
          // Create new file in "completed" subfolder
          console.log('Writing file to completed folder...');
          const newFileHandle = await completedFolderHandle.getFileHandle(newFileName, { create: true });
          const writable = await newFileHandle.createWritable();
          await writable.write(file);
          await writable.close();
          console.log('File written successfully');
          
          // Delete the original file from parent folder
          console.log('Deleting original file...');
          await dirHandle.removeEntry(pdfFile.name);
          console.log('Original file deleted');
          
          successCount++;
          processedFiles.push({
            originalName: pdfFile.name,
            newName: newFileName,
            name: sanitizedName,
            cnicNtn: sanitizedCnicNtn,
            taxYear: sanitizedTaxYear,
            status: 'success',
            autoExtracted: extractedData.success
          });
          
          console.log(`✅ Successfully processed: ${pdfFile.name} → ${newFileName}`);
          
        } catch (error) {
          console.error(`❌ Error processing ${pdfFile.name}:`, error);
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
          
          failCount++;
          processedFiles.push({
            originalName: pdfFile.name,
            status: 'failed',
            reason: error.message
          });
          
          // Show error alert for debugging
          alert(`❌ Error processing "${pdfFile.name}":\n\n${error.message}\n\nCheck console for details.`);
        }
      }
      
      setScannedFiles(processedFiles.filter(f => f.status === 'success'));
      setCurrentFile(null);
      
      // Show summary
      const summary = 
        `✅ Processing Complete!\n\n` +
        `Successful: ${successCount}\n` +
        `Failed/Skipped: ${failCount}\n` +
        `Total: ${pdfFiles.length}\n\n` +
        `Files have been moved to the "completed" subfolder.`;
      
      alert(summary);
      
    } catch (error) {
      console.error('Error scanning folder:', error);
      setError(error.message);
      alert(`❌ Error scanning folder: ${error.message}`);
    } finally {
      setIsScanning(false);
      setCurrentFile(null);
      setProgress({ current: 0, total: 0, percentage: 0 });
    }
  };

  // Start batch processing
  const handleProcessBatch = async () => {
    if (scannedFiles.length === 0) {
      alert('No files to process. Please scan the folder first.');
      return;
    }

    // Check for potential duplicates before processing
    try {
      const duplicateChecks = await Promise.all(
        scannedFiles.map(async (file) => {
          try {
            const result = await apiClient.checkDuplicates({
              filename: file.filename,
              // We don't have CNIC/NTN yet, will check after extraction
            });
            return { file: file.filename, duplicates: result.duplicates || [] };
          } catch (error) {
            console.error('Duplicate check error:', error);
            return { file: file.filename, duplicates: [] };
          }
        })
      );

      const filesWithDuplicates = duplicateChecks.filter(check => check.duplicates.length > 0);
      
      if (filesWithDuplicates.length > 0) {
        const duplicateList = filesWithDuplicates
          .map(check => `• ${check.file} (${check.duplicates.length} potential duplicate(s))`)
          .join('\n');
        
        const proceed = confirm(
          `⚠️ Potential duplicates detected:\n\n${duplicateList}\n\nDo you want to continue processing?`
        );
        
        if (!proceed) {
          return;
        }
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
      // Continue processing even if duplicate check fails
    }

    if (!confirm(`Process ${scannedFiles.length} PDF file(s)?`)) {
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: scannedFiles.length, percentage: 0 });
    setResults([]);
    setError(null);

    try {
      await apiClient.processBatch(selectedFolder);
    } catch (error) {
      setIsProcessing(false);
      setError(error.message);
      alert(`❌ Error starting batch process: ${error.message}`);
    }
  };

  // Preview PDF
  const handlePreviewPDF = (returnItem) => {
    const pdfUrl = apiClient.getPDFViewURL(returnItem.id);
    setPreviewModal({
      isOpen: true,
      pdfUrl: pdfUrl,
      fileName: returnItem.renamed_filename || returnItem.original_filename,
      returnId: returnItem.id
    });
  };

  // Download PDF
  const handleDownloadPDF = (returnId) => {
    apiClient.downloadPDF(returnId);
  };

  // Share single PDF
  const handleShareSingle = (returnItem) => {
    setShareModal({
      isOpen: true,
      selectedReturns: [returnItem.id]
    });
  };

  // Share multiple PDFs
  const handleShareMultiple = (returnIds) => {
    setShareModal({
      isOpen: true,
      selectedReturns: returnIds
    });
  };

  // Handle share submission
  const handleShareSubmit = async (shareData) => {
    try {
      const result = await apiClient.sharePDF(shareData);
      
      if (result.method === 'whatsapp' && result.whatsapp_url) {
        // Open WhatsApp in new window
        window.open(result.whatsapp_url, '_blank');
      }
      
      alert(`✅ ${result.message}`);
    } catch (error) {
      console.error('Share error:', error);
      throw error;
    }
  };

  // Toggle selection
  const toggleSelection = (returnId) => {
    setSelectedReturnIds(prev => {
      if (prev.includes(returnId)) {
        return prev.filter(id => id !== returnId);
      } else {
        return [...prev, returnId];
      }
    });
  };

  // Select all
  const selectAll = () => {
    setSelectedReturnIds(processedReturns.map(r => r.id));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedReturnIds([]);
  };

  // Bulk download
  const handleBulkDownload = async () => {
    if (selectedReturnIds.length === 0) {
      alert('Please select returns to download');
      return;
    }

    try {
      await apiClient.bulkDownloadPDFs(selectedReturnIds);
      alert(`✅ Downloaded ${selectedReturnIds.length} file(s)`);
    } catch (error) {
      console.error('Bulk download error:', error);
      alert(`❌ Error downloading files: ${error.message}`);
    }
  };

  // Bulk share
  const handleBulkShare = () => {
    if (selectedReturnIds.length === 0) {
      alert('Please select returns to share');
      return;
    }

    setShareModal({
      isOpen: true,
      selectedReturns: selectedReturnIds
    });
  };

  // Edit return
  const handleEditReturn = (returnItem) => {
    setEditModal({
      isOpen: true,
      returnData: returnItem
    });
  };

  // Save edited return
  const handleSaveEdit = async (returnId, updatedData) => {
    try {
      await apiClient.updateReturn(returnId, updatedData);
      await loadProcessedReturns();
      alert('✅ Return updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      alert(`❌ Error updating return: ${error.message}`);
      throw error;
    }
  };

  // Open status tracking
  const handleStatusTracking = (returnItem) => {
    setStatusModal({
      isOpen: true,
      returnData: returnItem
    });
  };

  // Update status
  const handleUpdateStatus = async (statusData) => {
    try {
      const returnId = statusModal.returnData.id;
      const currentReturn = processedReturns.find(r => r.id === returnId);
      
      // Build status history
      const statusHistory = currentReturn.status_history || [];
      statusHistory.push({
        status: statusData.status,
        notes: statusData.notes,
        timestamp: statusData.timestamp,
        deadline: statusData.deadline
      });

      await apiClient.updateReturn(returnId, {
        status: statusData.status,
        status_history: statusHistory,
        deadline: statusData.deadline
      });

      await loadProcessedReturns();
      alert('✅ Status updated successfully');
    } catch (error) {
      console.error('Status update error:', error);
      alert(`❌ Error updating status: ${error.message}`);
      throw error;
    }
  };

  // Delete single return
  const handleDeleteReturn = async (returnId) => {
    if (!confirm('Are you sure you want to delete this return?')) {
      return;
    }

    try {
      await apiClient.deleteReturn(returnId);
      await loadProcessedReturns();
      alert('✅ Return deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      alert(`❌ Error deleting return: ${error.message}`);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedReturnIds.length === 0) {
      alert('Please select returns to delete');
      return;
    }

    if (!confirm(`Delete ${selectedReturnIds.length} return(s)? This cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.bulkDeleteReturns(selectedReturnIds);
      await loadProcessedReturns();
      setSelectedReturnIds([]);
      alert(`✅ Deleted ${selectedReturnIds.length} return(s)`);
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert(`❌ Error deleting returns: ${error.message}`);
    }
  };

  // Handle search and filter results
  const handleFilteredResults = (filtered) => {
    setFilteredReturns(filtered);
  };

  // Open client linking modal
  const handleLinkClient = (returnItem) => {
    setClientLinkModal({
      isOpen: true,
      returnData: returnItem
    });
  };

  // Link return to client
  const handleLinkToClient = async (returnId, clientId) => {
    try {
      await apiClient.linkClient(returnId, clientId);
      await loadProcessedReturns();
      alert('✅ Client linked successfully');
    } catch (error) {
      console.error('Link client error:', error);
      alert(`❌ Error linking client: ${error.message}`);
      throw error;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ========== DRAG AND DROP HANDLERS ==========
  
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.name.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length > 0) {
      handleIndividualFiles(pdfFiles);
    } else {
      alert('⚠️ Please drop PDF files only');
    }
  }, []);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleIndividualFiles(files);
    }
  }, []);

  // Process individual uploaded files
  const handleIndividualFiles = async (files) => {
    setIsScanning(true);
    setError(null);
    setIsCancelling(false);
    const processedFiles = [];
    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        if (isCancelling) {
          alert(`⚠️ Operation Cancelled\n\nProcessed: ${successCount}\nRemaining: ${files.length - i}`);
          break;
        }

        const file = files[i];

        try {
          setCurrentFile(`Processing ${i + 1}/${files.length}: ${file.name}`);
          setProgress({
            current: i + 1,
            total: files.length,
            percentage: Math.round(((i + 1) / files.length) * 100)
          });

          // Extract data from PDF
          const extractedData = await extractDataFromPDF(file);
          
          let name = extractedData.name;
          let cnicNtn = extractedData.cnicNtn;
          let taxYear = extractedData.taxYear;
          
          // Validate extracted data
          const validation = validateExtractedData(extractedData);
          
          // If extraction failed or validation failed, ask user for manual input
          if (!extractedData.success || !validation.isValid) {
            const userConfirm = confirm(
              `⚠️ Could not fully extract data from "${file.name}".\n\n` +
              `Extracted:\n` +
              `- Name: ${name || 'Not found'}\n` +
              `- CNIC/NTN: ${cnicNtn || 'Not found'}\n` +
              `- Tax Year: ${taxYear || 'Not found'}\n\n` +
              `Issues: ${validation.errors.join(', ')}\n\n` +
              `Would you like to enter the data manually?`
            );
            
            if (!userConfirm) {
              failCount++;
              processedFiles.push({
                originalName: file.name,
                status: 'skipped',
                reason: 'User skipped manual entry'
              });
              continue;
            }
            
            // Manual input
            if (!name || name.length < 3) {
              name = prompt(`Enter Name for "${file.name}":`, name || '');
              if (!name) {
                failCount++;
                processedFiles.push({
                  originalName: file.name,
                  status: 'failed',
                  reason: 'Name not provided'
                });
                continue;
              }
            }
            
            if (!cnicNtn) {
              cnicNtn = prompt(`Enter CNIC/NTN for "${file.name}":`, cnicNtn || '');
              if (!cnicNtn) {
                failCount++;
                processedFiles.push({
                  originalName: file.name,
                  status: 'failed',
                  reason: 'CNIC/NTN not provided'
                });
                continue;
              }
            }
            
            if (!taxYear) {
              taxYear = prompt(`Enter Tax Year for "${file.name}":`, taxYear || new Date().getFullYear().toString());
              if (!taxYear) {
                failCount++;
                processedFiles.push({
                  originalName: file.name,
                  status: 'failed',
                  reason: 'Tax Year not provided'
                });
                continue;
              }
            }
          }
          
          // Import sanitizeFilename function
          const { sanitizeFilename } = await import('../utils/pdfExtractor');
          
          // Sanitize filename components
          const sanitizedName = sanitizeFilename(name);
          const sanitizedCnicNtn = sanitizeFilename(cnicNtn.replace(/-/g, ''));
          const sanitizedTaxYear = sanitizeFilename(taxYear);
          
          // Create new filename
          const newFileName = `${sanitizedName}-${sanitizedCnicNtn}-${sanitizedTaxYear}.pdf`;
          
          successCount++;
          processedFiles.push({
            originalName: file.name,
            newName: newFileName,
            name: sanitizedName,
            cnicNtn: sanitizedCnicNtn,
            taxYear: sanitizedTaxYear,
            status: 'success',
            autoExtracted: extractedData.success,
            file: file // Keep the file object for later use
          });
          
        } catch (error) {
          console.error(`❌ Error processing ${file.name}:`, error);
          failCount++;
          processedFiles.push({
            originalName: file.name,
            status: 'failed',
            reason: error.message
          });
        }
      }

      setScannedFiles(processedFiles.filter(f => f.status === 'success'));
      setUploadedFiles(processedFiles.filter(f => f.status === 'success'));
      setCurrentFile(null);
      
      // Show summary
      const summary = 
        `✅ Processing Complete!\n\n` +
        `Successful: ${successCount}\n` +
        `Failed/Skipped: ${failCount}\n` +
        `Total: ${files.length}`;
      
      alert(summary);
      
    } catch (error) {
      console.error('Error processing files:', error);
      setError(error.message);
      alert(`❌ Error processing files: ${error.message}`);
    } finally {
      setIsScanning(false);
      setCurrentFile(null);
      setProgress({ current: 0, total: 0, percentage: 0 });
    }
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 rounded-xl">
            <Upload className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">PDF Processor</h2>
            <p className="text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                {isScanning || isProcessing ? 'Processing...' : 'Ready'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSelectFolder}
            disabled={isScanning || isProcessing}
            className="px-4 py-2 bg-orange-600/20 text-orange-400 font-semibold rounded-xl hover:bg-orange-600/30 transition-all flex items-center gap-2 border border-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FolderOpen className="w-4 h-4" />
            {selectedFolder ? 'Change Folder' : 'Select Folder'}
          </button>

          <button
            onClick={handleScanFolder}
            disabled={isScanning || isProcessing || !folderHandle}
            className="px-4 py-2 bg-purple-600/20 text-purple-400 font-semibold rounded-xl hover:bg-purple-600/30 transition-all flex items-center gap-2 border border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScanning ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {scannedFiles.length > 0 ? 'Rescan' : 'Scan Folder'}
              </>
            )}
          </button>

          {(isScanning || isProcessing) && (
            <button
              onClick={handleCancelOperation}
              disabled={isCancelling}
              className="px-4 py-2 bg-red-600/20 text-red-400 font-semibold rounded-xl hover:bg-red-600/30 transition-all flex items-center gap-2 border border-red-500/30 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              {isCancelling ? 'Cancelling...' : 'Cancel'}
            </button>
          )}

          {!isScanning && !isProcessing && scannedFiles.length > 0 && (
            <button
              onClick={handleProcessBatch}
              disabled={selectedFiles.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              Process {selectedFiles.length > 0 ? `Selected (${selectedFiles.length})` : `All (${scannedFiles.length})`}
            </button>
          )}
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-gray-600/20 text-gray-400 font-semibold rounded-xl hover:bg-gray-600/30 transition-all flex items-center gap-2 border border-gray-500/30"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Folder Path Display */}
      {selectedFolder && (
        <div className="mb-4 p-3 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Selected Folder:</span>
            <span className="text-sm text-blue-300 font-mono">{selectedFolder}</span>
          </div>
          {lastFolderPath && (
            <span className="text-xs text-gray-500">Remembered from last session</span>
          )}
        </div>
      )}

      {/* Quick Stats Toolbar */}
      {scannedFiles.length > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/30 rounded-xl">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Files</p>
              <p className="text-2xl font-bold text-purple-400">{scannedFiles.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Selected</p>
              <p className="text-2xl font-bold text-blue-400">{selectedFiles.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-green-400">
                {scannedFiles.length > 0 ? Math.round((scannedFiles.filter(f => f.status === 'success').length / scannedFiles.length) * 100) : 0}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Auto-Extracted</p>
              <p className="text-2xl font-bold text-emerald-400">
                {scannedFiles.filter(f => f.autoExtracted).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Info */}
      {config && (
        <div className="mb-6 p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">Watch Folder:</span>
              <p className="text-gray-300 font-mono text-xs mt-1 break-all">{config.watch_folder}</p>
            </div>
            <div>
              <span className="text-gray-400">Processed Folder:</span>
              <p className="text-gray-300 font-mono text-xs mt-1 break-all">{config.processed_folder}</p>
            </div>
          </div>
          {selectedFolder && (
            <div className="mt-2 pt-2 border-t border-blue-500/20">
              <span className="text-gray-400">Selected Folder:</span>
              <p className="text-blue-300 font-mono text-xs mt-1 break-all">{selectedFolder}</p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-600/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-400 mb-1">Error</h3>
            <p className="text-sm text-gray-300">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Unified Upload Area - Drag & Drop OR Select Folder/Files */}
      {scannedFiles.length === 0 && !isScanning && !isProcessing && (
        <div className="mb-6">
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-600/20 scale-[1.02]'
                : 'border-white/20 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.05]'
            }`}
          >
            {/* Drag Overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-blue-500/20 rounded-2xl flex items-center justify-center z-10 backdrop-blur-sm">
                <div className="text-center">
                  <Upload className="w-20 h-20 mx-auto text-blue-400 animate-bounce mb-4" />
                  <p className="text-blue-300 font-bold text-xl">Drop PDF files here</p>
                </div>
              </div>
            )}

            {/* Upload Content */}
            <div className="text-center">
              <Upload className="w-16 h-16 mx-auto text-gray-400 mb-6" />
              
              <h3 className="text-2xl font-bold text-white mb-2">
                Upload Tax Returns
              </h3>
              
              <p className="text-gray-400 mb-6">
                Drag & drop PDF files here, or use the buttons below
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4 mb-6">
                {/* Browse Individual Files */}
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={isScanning || isProcessing}
                  />
                  <span className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 cursor-pointer inline-flex items-center gap-2 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed">
                    <FileText className="w-5 h-5" />
                    Select PDF Files
                  </span>
                </label>

                {/* OR Divider */}
                <div className="flex items-center gap-3">
                  <div className="h-px w-12 bg-white/20"></div>
                  <span className="text-gray-500 text-sm font-medium">OR</span>
                  <div className="h-px w-12 bg-white/20"></div>
                </div>

                {/* Select Folder */}
                <button
                  onClick={handleSelectFolder}
                  disabled={isScanning || isProcessing}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all inline-flex items-center gap-2 shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FolderOpen className="w-5 h-5" />
                  Select Folder
                </button>
              </div>

              {/* Info Text */}
              <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  PDF format only
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Multiple files supported
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Auto data extraction
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Progress */}
      <AnimatePresence>
        {(isProcessing || isScanning) && progress.total > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-6 bg-green-600/10 border border-green-500/30 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Loader className="w-5 h-5 text-green-400 animate-spin" />
                <div>
                  <h3 className="font-semibold text-green-400">
                    {isScanning ? 'Extracting & Processing PDFs...' : 'Processing PDFs...'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {currentFile || 'Preparing...'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">{progress.percentage}%</p>
                <p className="text-xs text-gray-400">
                  {progress.current} / {progress.total} files
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanned Files List */}
      {scannedFiles.length > 0 && !isProcessing && !isScanning && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Successfully Processed Files ({scannedFiles.length})
            </h3>
            <div className="flex gap-2">
              {selectedFiles.length === 0 ? (
                <button
                  onClick={selectAllFiles}
                  className="px-3 py-1.5 bg-blue-600/20 text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-600/30 transition-all"
                >
                  Select All
                </button>
              ) : (
                <>
                  <span className="text-sm text-gray-400 px-3 py-1.5">
                    {selectedFiles.length} selected
                  </span>
                  <button
                    onClick={deselectAllFiles}
                    className="px-3 py-1.5 bg-gray-600/20 text-gray-400 text-sm font-medium rounded-lg hover:bg-gray-600/30 transition-all"
                  >
                    Clear Selection
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scannedFiles.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 border rounded-xl hover:bg-green-600/20 transition-all cursor-pointer ${
                  selectedFiles.includes(file.name)
                    ? 'bg-green-600/20 border-green-500'
                    : 'bg-green-600/10 border-green-500/30'
                }`}
                onClick={() => toggleFileSelection(file.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.name)}
                      onChange={() => toggleFileSelection(file.name)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-green-600 focus:ring-green-500 focus:ring-offset-gray-900"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{file.newName}</p>
                        {file.autoExtracted && (
                          <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs font-medium rounded border border-blue-500/30">
                            Auto-extracted
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        Original: {file.originalName}
                      </p>
                      <p className="text-xs text-green-400 mt-1">
                        {file.name} • {file.cnicNtn} • {file.taxYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="p-2 hover:bg-blue-600/20 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4 text-blue-400" />
                    </button>
                    <button
                      className="p-2 hover:bg-green-600/20 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-green-400" />
                    </button>
                    <button
                      className="p-2 hover:bg-purple-600/20 rounded-lg transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4 text-purple-400" />
                    </button>
                    <button
                      className="p-2 hover:bg-yellow-600/20 rounded-lg transition-colors"
                      title="Re-extract"
                    >
                      <RefreshCw className="w-4 h-4 text-yellow-400" />
                    </button>
                    <button
                      className="p-2 hover:bg-indigo-600/20 rounded-lg transition-colors"
                      title="Copy Data"
                    >
                      <Copy className="w-4 h-4 text-indigo-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Results Summary */}
      {results.length > 0 && !isProcessing && (
        <div className="mt-6">
          <h3 className="font-semibold mb-4">Processing Results</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-green-600/10 border border-green-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">Successful</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {results.filter(r => r.success).length}
              </p>
            </div>
            <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-sm text-gray-400">Failed</span>
              </div>
              <p className="text-2xl font-bold text-red-400">
                {results.filter(r => !r.success).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Processed Returns List */}
      {processedReturns.length > 0 && (
        <div className="mt-6">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Processed Returns ({processedReturns.length})
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'stats' : 'list')}
                className="px-3 py-1.5 bg-blue-600/20 text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-600/30 transition-all flex items-center gap-1.5"
              >
                {viewMode === 'list' ? (
                  <>
                    <BarChart3 className="w-3.5 h-3.5" />
                    Statistics
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    List View
                  </>
                )}
              </button>
              {selectedReturnIds.length > 0 && (
                <>
                  <span className="text-sm text-gray-400">
                    {selectedReturnIds.length} selected
                  </span>
                  <button
                    onClick={handleBulkDownload}
                    className="px-3 py-1.5 bg-green-600/20 text-green-400 text-sm font-medium rounded-lg hover:bg-green-600/30 transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={handleBulkShare}
                    className="px-3 py-1.5 bg-purple-600/20 text-purple-400 text-sm font-medium rounded-lg hover:bg-purple-600/30 transition-all flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1.5 bg-red-600/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-600/30 transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-3 py-1.5 bg-gray-600/20 text-gray-400 text-sm font-medium rounded-lg hover:bg-gray-600/30 transition-all"
                  >
                    Clear
                  </button>
                </>
              )}
              {selectedReturnIds.length === 0 && processedReturns.length > 0 && (
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 bg-blue-600/20 text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-600/30 transition-all"
                >
                  Select All
                </button>
              )}
              <button
                onClick={loadProcessedReturns}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Statistics Dashboard View */}
          {viewMode === 'stats' && (
            <StatisticsDashboard returns={processedReturns} />
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <>
              {/* Search and Filter */}
              <SearchAndFilter
                returns={processedReturns}
                onFilteredResults={handleFilteredResults}
              />

              {/* Returns List */}
              <div className="space-y-2 max-h-96 overflow-y-auto mt-4">
                {filteredReturns.slice(0, 10).map((ret, index) => (
                  <motion.div
                    key={ret.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-4 border rounded-xl hover:bg-black/30 transition-all cursor-pointer ${
                      selectedReturnIds.includes(ret.id)
                        ? 'bg-blue-600/20 border-blue-500'
                        : 'bg-black/20 border-white/10'
                    }`}
                    onClick={() => toggleSelection(ret.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedReturnIds.includes(ret.id)}
                          onChange={() => toggleSelection(ret.id)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <FileText className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{ret.client_name}</p>
                            {ret.linked_client_id && (
                              <span className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 text-xs font-medium rounded border border-indigo-500/30 flex items-center gap-1">
                                <Link className="w-3 h-3" />
                                Linked
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            {ret.tax_year} • {ret.cnic || ret.ntn || 'N/A'}
                          </p>
                          {ret.total_income && (
                            <p className="text-xs text-blue-400 mt-1">
                              Income: Rs. {ret.total_income} {ret.refund_amount && `• Refund: Rs. ${ret.refund_amount}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleLinkClient(ret)}
                          className="p-2 hover:bg-indigo-600/20 rounded-lg transition-colors"
                          title="Link to Client"
                        >
                          <Link className="w-4 h-4 text-indigo-400" />
                        </button>
                        <button
                          onClick={() => handleEditReturn(ret)}
                          className="p-2 hover:bg-yellow-600/20 rounded-lg transition-colors"
                          title="Edit Return"
                        >
                          <Edit3 className="w-4 h-4 text-yellow-400" />
                        </button>
                        <button
                          onClick={() => handleStatusTracking(ret)}
                          className="p-2 hover:bg-orange-600/20 rounded-lg transition-colors"
                          title="Status Tracking"
                        >
                          <Clock className="w-4 h-4 text-orange-400" />
                        </button>
                        <button
                          onClick={() => handlePreviewPDF(ret)}
                          className="p-2 hover:bg-blue-600/20 rounded-lg transition-colors"
                          title="Preview PDF"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(ret.id)}
                          className="p-2 hover:bg-green-600/20 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4 text-green-400" />
                        </button>
                        <button
                          onClick={() => handleShareSingle(ret)}
                          className="p-2 hover:bg-purple-600/20 rounded-lg transition-colors"
                          title="Share PDF"
                        >
                          <Share2 className="w-4 h-4 text-purple-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteReturn(ret.id)}
                          className="p-2 hover:bg-red-600/20 rounded-lg transition-colors"
                          title="Delete Return"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty State */}
      {scannedFiles.length === 0 && !isScanning && !isProcessing && (
        <div className="text-center py-12 text-gray-500">
          <Upload className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-2">No PDFs Loaded</p>
          <p className="text-sm mb-4">Upload files or select a folder to get started</p>
        </div>
      )}

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, pdfUrl: null, fileName: null, returnId: null })}
        pdfUrl={previewModal.pdfUrl}
        fileName={previewModal.fileName}
        onDownload={() => handleDownloadPDF(previewModal.returnId)}
        onShare={() => {
          setPreviewModal({ isOpen: false, pdfUrl: null, fileName: null, returnId: null });
          handleShareSingle({ id: previewModal.returnId });
        }}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ isOpen: false, selectedReturns: [] })}
        selectedReturns={shareModal.selectedReturns}
        onShare={handleShareSubmit}
      />

      {/* Edit Return Modal */}
      <EditReturnModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, returnData: null })}
        returnData={editModal.returnData}
        onSave={handleSaveEdit}
      />

      {/* Status Tracking Modal */}
      <StatusTrackingModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ isOpen: false, returnData: null })}
        returnData={statusModal.returnData}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Client Linking Modal */}
      <ClientLinkingModal
        isOpen={clientLinkModal.isOpen}
        onClose={() => setClientLinkModal({ isOpen: false, returnData: null })}
        returnData={clientLinkModal.returnData}
        onLink={handleLinkToClient}
      />
    </div>
  );
};

export default PDFProcessorPanel;
