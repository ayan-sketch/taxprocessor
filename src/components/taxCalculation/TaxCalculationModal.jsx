import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, ArrowLeft, ArrowRight, CheckCircle, FileText, Clock, SkipForward, AlertCircle, HelpCircle, History, Download, Mail, Printer } from 'lucide-react';
import TaxFormSidebar from './TaxFormSidebar';
import TaxFormStepper from './TaxFormStepper';
import PersonalInfoSection from './sections/PersonalInfoSection';
import BusinessIncomeSection from './sections/BusinessIncomeSection';
import PropertyIncomeSection from './sections/PropertyIncomeSection';
import CapitalGainsSection from './sections/CapitalGainsSection';
import OtherIncomeSection from './sections/OtherIncomeSection';
import DeductionsSection from './sections/DeductionsSection';
import TaxComputationSection from './sections/TaxComputationSection';
import ReviewSubmitSection from './sections/ReviewSubmitSection';

const TaxCalculationModal = ({ 
  isOpen, 
  onClose, 
  returnData,
  onSave,
  skipPersonalInfo = false  // New prop to skip personal info section
}) => {
  const [currentStep, setCurrentStep] = useState(skipPersonalInfo ? 1 : 0);
  const [formData, setFormData] = useState({
    personalInfo: {
      name: returnData?.clientName || '',
      cnic: returnData?.cnic || '',
      ntn: '',
      taxYear: returnData?.taxYear || new Date().getFullYear().toString(),
      residentialStatus: 'Resident',
      address: '',
      city: '',
      phone: '',
      email: ''
    },
    salaryIncome: {
      hasIncome: false,
      entries: []
    },
    businessIncome: {
      hasIncome: false,
      entries: []
    },
    propertyIncome: {
      hasIncome: false,
      entries: []
    },
    capitalGains: {
      hasIncome: false,
      entries: []
    },
    otherIncome: {
      hasIncome: false,
      entries: []
    },
    deductions: {
      investments: [],
      donations: [],
      zakat: 0,
      other: []
    },
    taxComputation: {
      totalIncome: 0,
      totalDeductions: 0,
      taxableIncome: 0,
      taxChargeable: 0,
      taxPaid: 0,
      refundDue: 0
    }
  });

  const [completedSections, setCompletedSections] = useState(new Set());
  const [skippedSections, setSkippedSections] = useState(new Set());
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showTooltip, setShowTooltip] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [liveTaxPreview, setLiveTaxPreview] = useState(0);

  const sections = [
    { id: 'personal', label: 'Personal Information', icon: '👤', component: PersonalInfoSection, skippable: false },
    { id: 'business', label: 'Business Income', icon: '🏢', component: BusinessIncomeSection, skippable: true },
    { id: 'property', label: 'Property Income', icon: '🏠', component: PropertyIncomeSection, skippable: true },
    { id: 'capitalGains', label: 'Capital Gains', icon: '📈', component: CapitalGainsSection, skippable: true },
    { id: 'otherIncome', label: 'Other Income', icon: '💰', component: OtherIncomeSection, skippable: true },
    { id: 'deductions', label: 'Deductions', icon: '📊', component: DeductionsSection, skippable: true },
    { id: 'taxComputation', label: 'Tax Computation', icon: '🧮', component: TaxComputationSection, skippable: false },
    { id: 'review', label: 'Review & Submit', icon: '✓', component: ReviewSubmitSection, skippable: false }
  ];

  // Calculate progress percentage
  const progressPercentage = Math.round(((completedSections.size + skippedSections.size) / sections.length) * 100);

  // Live tax calculation
  useEffect(() => {
    const calculateLiveTax = () => {
      let totalIncome = 0;
      
      // Sum all income sources
      if (formData.salaryIncome?.entries) {
        totalIncome += formData.salaryIncome.entries.reduce((sum, entry) => sum + (parseFloat(entry.grossSalary) || 0), 0);
      }
      if (formData.businessIncome?.entries) {
        totalIncome += formData.businessIncome.entries.reduce((sum, entry) => sum + (parseFloat(entry.netProfit) || 0), 0);
      }
      if (formData.propertyIncome?.entries) {
        totalIncome += formData.propertyIncome.entries.reduce((sum, entry) => sum + (parseFloat(entry.rentalIncome) || 0), 0);
      }
      
      // Simple tax calculation (placeholder - replace with actual tax slabs)
      let tax = 0;
      if (totalIncome <= 600000) {
        tax = 0;
      } else if (totalIncome <= 1200000) {
        tax = (totalIncome - 600000) * 0.05;
      } else if (totalIncome <= 2400000) {
        tax = 30000 + (totalIncome - 1200000) * 0.15;
      } else {
        tax = 210000 + (totalIncome - 2400000) * 0.25;
      }
      
      setLiveTaxPreview(Math.round(tax));
    };
    
    calculateLiveTax();
  }, [formData]);

  // Auto-save functionality
  useEffect(() => {
    if (!isOpen) return;
    
    const autoSaveInterval = setInterval(() => {
      handleAutoSave();
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [isOpen, formData]);

  // Load saved data on mount
  useEffect(() => {
    if (isOpen && returnData) {
      const savedDataKey = `tax_return_${returnData.cnic}_${returnData.taxYear}`;
      const savedData = localStorage.getItem(savedDataKey);
      
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setFormData(parsed.formData);
          setCompletedSections(new Set(parsed.completedSections));
          setCurrentStep(parsed.currentStep || (skipPersonalInfo ? 1 : 0));
        } catch (error) {
          console.error('Error loading saved data:', error);
        }
      } else {
        // No saved data, start at appropriate step
        setCurrentStep(skipPersonalInfo ? 1 : 0);
      }
    }
  }, [isOpen, returnData, skipPersonalInfo]);

  const handleAutoSave = () => {
    if (!returnData) return;
    
    const savedDataKey = `tax_return_${returnData.cnic}_${returnData.taxYear}`;
    const dataToSave = {
      formData,
      completedSections: Array.from(completedSections),
      skippedSections: Array.from(skippedSections),
      currentStep,
      lastSaved: new Date().toISOString()
    };
    
    localStorage.setItem(savedDataKey, JSON.stringify(dataToSave));
    setLastSaved(new Date());
    setHasUnsavedChanges(false);
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    handleAutoSave();
    
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsSaving(false);
    
    // Show success message
    alert('Tax return data saved successfully!');
  };

  const updateFormData = (section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: data
    }));
    setHasUnsavedChanges(true);
  };

  const markSectionComplete = (sectionId) => {
    setCompletedSections(prev => new Set([...prev, sectionId]));
  };

  const handleSkipSection = () => {
    const currentSectionId = sections[currentStep].id;
    setSkippedSections(prev => new Set([...prev, currentSectionId]));
    handleNext();
  };

  const handleNext = () => {
    if (currentStep < sections.length - 1) {
      markSectionComplete(sections[currentStep].id);
      setCurrentStep(prev => prev + 1);
      handleAutoSave();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSectionClick = (index) => {
    setCurrentStep(index);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Your progress has been auto-saved. Are you sure you want to exit?'
      );
      
      if (confirmClose) {
        handleAutoSave();
        onClose();
      }
    } else {
      handleAutoSave();
      onClose();
    }
  };

  const handleSubmit = () => {
    // Mark all sections complete
    sections.forEach(section => markSectionComplete(section.id));
    
    // Save final data
    if (onSave) {
      onSave(formData);
    }
    
    // Clear the draft from localStorage
    const savedDataKey = `tax_return_${returnData.cnic}_${returnData.taxYear}`;
    localStorage.removeItem(savedDataKey);
    
    alert('Tax return submitted successfully!');
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyFromPreviousYear = () => {
    const previousYear = (parseInt(returnData?.taxYear) - 1).toString();
    const previousDataKey = `tax_return_${returnData.cnic}_${previousYear}`;
    const previousData = localStorage.getItem(previousDataKey);
    
    if (previousData) {
      try {
        const parsed = JSON.parse(previousData);
        const confirmCopy = window.confirm(
          `Found data from tax year ${previousYear}. Would you like to copy it to this year's return?`
        );
        
        if (confirmCopy) {
          // Copy all sections except personal info and update year
          setFormData({
            ...parsed.formData,
            personalInfo: {
              ...parsed.formData.personalInfo,
              taxYear: returnData?.taxYear
            }
          });
          alert('Previous year data copied successfully!');
        }
      } catch (error) {
        console.error('Error copying previous year data:', error);
        alert('Failed to copy previous year data.');
      }
    } else {
      alert(`No saved data found for tax year ${previousYear}.`);
    }
  };

  if (!isOpen) return null;

  const CurrentSectionComponent = sections[currentStep].component;
  const currentSection = sections[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full h-full max-w-[1920px] max-h-screen bg-gray-50 flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Income Tax Return - {returnData?.taxYear}</h1>
                  <p className="text-blue-100 text-sm">
                    {formData.personalInfo.name} • {formData.personalInfo.cnic}
                  </p>
                  {/* Progress Indicator */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-400 transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold">{progressPercentage}% Complete</span>
                    </div>
                    {liveTaxPreview > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-full border border-yellow-400/30">
                        <span className="text-xs">Estimated Tax:</span>
                        <span className="text-sm font-bold">Rs. {liveTaxPreview.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {lastSaved && (
                  <div className="flex items-center gap-2 text-xs text-blue-100">
                    <Clock className="w-3 h-3" />
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </div>
                )}
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-1 text-xs text-yellow-300">
                    <AlertCircle className="w-3 h-3" />
                    Unsaved changes
                  </div>
                )}
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={handleCopyFromPreviousYear}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors text-sm border border-purple-400/30"
                    title="Copy data from previous year's return"
                  >
                    <History className="w-4 h-4" />
                    Copy from {parseInt(returnData?.taxYear) - 1}
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleManualSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500/80 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Submit Return
                  </button>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Progress Stepper */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <TaxFormStepper
              sections={sections}
              currentStep={currentStep}
              completedSections={completedSections}
              onStepClick={handleSectionClick}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar */}
            <TaxFormSidebar
              sections={sections}
              currentStep={currentStep}
              completedSections={completedSections}
              onSectionClick={handleSectionClick}
            />

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="max-w-4xl mx-auto p-8">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <CurrentSectionComponent
                    data={formData[currentSection.id]}
                    allData={formData}
                    onUpdate={(data) => updateFormData(currentSection.id, data)}
                    onComplete={() => markSectionComplete(currentSection.id)}
                  />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600 font-medium">
                  Step {currentStep + 1} of {sections.length} • {progressPercentage}% Complete
                </div>
                {sections[currentStep].skippable && (
                  <button
                    onClick={handleSkipSection}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium transition-colors border border-yellow-200"
                  >
                    <SkipForward className="w-4 h-4" />
                    Skip Optional Section
                  </button>
                )}
              </div>

              {currentStep === sections.length - 1 ? (
                <button
                  disabled
                  className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" />
                  Review Complete
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaxCalculationModal;
