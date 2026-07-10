import React, { useState, useCallback } from 'react';
import { extractDataFromPDF, sanitizeFilename } from '../../utils/pdfExtractor';

export default function DragDropUpload({ onFilesSelected, accept = '.pdf', multiple = true }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [isProcessingFolder, setIsProcessingFolder] = useState(false);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if leaving the drop zone entirely
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
    const acceptedFiles = accept 
      ? files.filter(file => {
          const extension = '.' + file.name.split('.').pop().toLowerCase();
          return accept.split(',').some(type => type.trim() === extension);
        })
      : files;

    if (acceptedFiles.length > 0) {
      handleFiles(acceptedFiles);
    } else {
      alert(`Please drop ${accept} files only`);
    }
  }, [accept]);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const handleFolderInput = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    const pdfFiles = files.filter(file => file.name.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      alert('No PDF files found in the selected folder');
      return;
    }

    setIsProcessingFolder(true);
    
    try {
      // Process all PDFs: extract data and rename
      const processedFiles = [];
      
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        
        // Update progress
        setUploadProgress([{
          id: i,
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'extracting'
        }]);
        
        try {
          console.log(`Processing file ${i + 1}/${pdfFiles.length}: ${file.name}`);
          
          // Extract data from PDF
          const extractedData = await extractDataFromPDF(file);
          console.log('Extracted data:', extractedData);
          
          // Generate new filename based on extracted data
          let newFileName = file.name;
          if (extractedData.success && extractedData.name && extractedData.cnicNtn && extractedData.taxYear) {
            const sanitizedName = sanitizeFilename(extractedData.name);
            newFileName = `${sanitizedName}_${extractedData.cnicNtn}_${extractedData.taxYear}.pdf`;
            console.log('Renamed to:', newFileName);
          } else {
            console.warn('Extraction incomplete, keeping original filename');
          }
          
          // Create a new File object with the new name
          const renamedFile = new File([file], newFileName, { type: file.type });
          
          // Attach extracted data to the file object
          renamedFile.extractedData = extractedData;
          
          processedFiles.push(renamedFile);
          
          // Update progress to complete
          setUploadProgress([{
            id: i,
            name: newFileName,
            size: file.size,
            progress: 100,
            status: 'success'
          }]);
          
          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          
          // Add original file even if extraction failed
          const fileWithError = new File([file], file.name, { type: file.type });
          fileWithError.extractedData = { success: false, error: error.message };
          processedFiles.push(fileWithError);
          
          setUploadProgress([{
            id: i,
            name: file.name,
            size: file.size,
            progress: 100,
            status: 'error'
          }]);
          
          // Small delay to show error
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress([]);
      }, 2000);
      
      // Call parent callback with processed files
      if (onFilesSelected && processedFiles.length > 0) {
        onFilesSelected(processedFiles);
      }
      
    } catch (error) {
      console.error('Error processing folder:', error);
      alert('Error processing folder: ' + error.message);
    } finally {
      setIsProcessingFolder(false);
    }
  }, [onFilesSelected]);

  const handleFiles = (files) => {
    // Initialize progress tracking
    const progress = files.map((file, index) => ({
      id: index,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading' // uploading, success, error
    }));
    setUploadProgress(progress);

    // Simulate upload progress (replace with actual upload logic)
    files.forEach((file, index) => {
      simulateUpload(file, index);
    });

    // Call parent callback
    if (onFilesSelected) {
      onFilesSelected(files);
    }
  };

  const simulateUpload = (file, index) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      
      setUploadProgress(prev => 
        prev.map((item, i) => 
          i === index 
            ? { ...item, progress: Math.min(progress, 100) }
            : item
        )
      );

      if (progress >= 100) {
        clearInterval(interval);
        setUploadProgress(prev => 
          prev.map((item, i) => 
            i === index 
              ? { ...item, status: 'success' }
              : item
          )
        );

        // Clear progress after 2 seconds
        setTimeout(() => {
          setUploadProgress(prev => prev.filter((_, i) => i !== index));
        }, 2000);
      }
    }, 200);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto text-blue-500 animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-blue-600 font-bold text-lg mt-2">Drop files here</p>
            </div>
          </div>
        )}

        {/* Upload Icon and Text */}
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drag & drop {multiple ? 'files' : 'a file'} here
          </p>
          <p className="text-sm text-gray-500 mb-4">
            or click to browse
          </p>
          
          {/* File and Folder Input Buttons */}
          <div className="flex gap-3 justify-center">
            {/* File Input */}
            <label className="inline-block">
              <input
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileInput}
                className="hidden"
              />
              <span className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block font-medium">
                Browse Files
              </span>
            </label>

            {/* Folder Input */}
            <label className="inline-block">
              <input
                type="file"
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleFolderInput}
                className="hidden"
                disabled={isProcessingFolder}
              />
              <span className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer inline-block font-medium ${isProcessingFolder ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isProcessingFolder ? 'Processing...' : 'Browse Folder'}
              </span>
            </label>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Supported formats: {accept || 'All files'}
            {multiple && ' • Multiple files allowed'}
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadProgress.map((file) => (
            <div
              key={file.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {file.status === 'success' ? (
                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : file.status === 'error' ? (
                      <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    ) : file.status === 'extracting' ? (
                      <svg className="w-6 h-6 text-yellow-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex-shrink-0 ml-4">
                  {file.status === 'success' ? (
                    <span className="text-xs font-medium text-green-600">Complete</span>
                  ) : file.status === 'error' ? (
                    <span className="text-xs font-medium text-red-600">Failed</span>
                  ) : file.status === 'extracting' ? (
                    <span className="text-xs font-medium text-yellow-600">Extracting...</span>
                  ) : (
                    <span className="text-xs font-medium text-blue-600">{file.progress}%</span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {file.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
