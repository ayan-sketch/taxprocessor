import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Clock, AlertCircle, History, FileText, Briefcase, Building, Home, TrendingUp, DollarSign, Globe, ChevronRight, Calculator, Printer, PiggyBank } from 'lucide-react';
import TaxpayerInfoCard from './simple/TaxpayerInfoCard';
import SimpleSalaryIncomeSection from './simple/SimpleSalaryIncomeSection';
import SimpleBusinessIncomeSection from './simple/SimpleBusinessIncomeSection';
import SimplePropertyIncomeSection from './simple/SimplePropertyIncomeSection';
import SimpleCapitalGainsSection from './simple/SimpleCapitalGainsSection';
import SimpleOtherIncomeSection from './simple/SimpleOtherIncomeSection';
import SimpleForeignSourceSection from './simple/SimpleForeignSourceSection';
import SimpleTaxDeductionSection from './simple/SimpleTaxDeductionSection';
import IncomeSummaryCard from './simple/IncomeSummaryCard';
import { WealthStatementFullModal } from './WealthStatementFullModal';

const createDefaultFormData = (returnData) => ({
  personalInfo: { name: returnData?.clientName || '', cnic: returnData?.cnic || '', ntn: '', taxYear: returnData?.taxYear || new Date().getFullYear().toString(), personType: 'Individual' },
  salaryIncome: { hasIncome: false, entries: [] },
  businessIncome: { hasIncome: false, entries: [] },
  propertyIncome: { hasIncome: false, entries: [] },
  capitalGains: { hasIncome: false, entries: [] },
  otherIncome: { hasIncome: false, entries: [] },
  foreignSource: { hasIncome: false, entries: [] },
  taxDeduction: { hasIncome: false, entries: [] },
  wealthStatement: { hasIncome: false, values: {}, entries: {} }
});

const normalizeFormData = (data, returnData) => {
  const defaults = createDefaultFormData(returnData);
  const normalized = { ...defaults, ...(data || {}) };
  normalized.personalInfo = { ...defaults.personalInfo, ...(data?.personalInfo || {}) };
  ['salaryIncome', 'businessIncome', 'propertyIncome', 'capitalGains', 'otherIncome', 'foreignSource', 'taxDeduction', 'wealthStatement'].forEach((key) => {
    normalized[key] = { hasIncome: false, entries: [], values: {}, ...(data?.[key] || {}) };
  });
  return normalized;
};

const SimpleTaxCalculationModal = ({ isOpen, onClose, returnData, onSave }) => {
  const [formData, setFormData] = useState(() => createDefaultFormData(returnData));
  const [selectedIncomeTab, setSelectedIncomeTab] = useState('salary');
  const [lastSaved, setLast, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showWealthStatementModal, setShowWealthStatementModal] = useState(false);

  const incomeSections = [
    { id: 'salary', title: 'Salary Income', icon: <Briefcase className="w-5 h-5" />, dataKey: 'salaryIncome', component: SimpleSalaryIncomeSection, color: 'from-blue-500 to-blue-600' },
    { id: 'business', title: 'Business Income', icon: <Building className="w-5 h-5" />, dataKey: 'businessIncome', component: SimpleBusinessIncomeSection, color: 'from-emerald-500 to-emerald-600' },
    { id: 'property', title: 'Property Income', icon: <Home className="w-5 h-5" />, dataKey: 'propertyIncome', component: SimplePropertyIncomeSection, color: 'from-amber-500 to-amber-600' },
    { id: 'capitalGains', title: 'Capital Gains', icon: <TrendingUp className="w-5 h-5" />, dataKey: 'capitalGains', component: SimpleCapitalGainsSection, color: 'from-rose-500 to-rose-600' },
    { id: 'otherIncome', title: 'Other Source', icon: <DollarSign className="w-5 h-5" />, dataKey: 'otherIncome', component: SimpleOtherIncomeSection, color: 'from-purple-500 to-purple-600' },
    { id: 'foreignSource', title: 'Foreign Source / Agriculture', icon: <Globe className="w-5 h-5" />, dataKey: 'foreignSource', component: SimpleForeignSourceSection, color: 'from-cyan-500 to-cyan-600' },
    { id: 'taxDeduction', title: 'Tax Deduction', icon: <Calculator className="w-5 h-5" />, dataKey: 'taxDeduction', component: SimpleTaxDeductionSection, color: 'from-violet-500 to-violet-600' },
  ];

  useEffect(() => {
    if (isOpen && returnData) {
      const savedDataKey = `tax_return_${returnData.cnic}_${returnData.taxYear}`;
      const savedData = localStorage.getItem(savedDataKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setFormData(normalizeFormData(parsed.formData, returnData));
          setSelectedIncomeTab(parsed.selectedIncomeTab || 'salary');
          setLastSaved(parsed.lastSaved ? new Date(parsed.lastSaved) : null);
        } catch (error) { console.error('Error loading saved data:', error); }
      }
    }
  }, [isOpen, returnData]);

  useEffect(() => {
    if (!isOpen) return;
    const autoSaveInterval = setInterval(() => handleAutoSave(), 30000);
    return () => clearInterval(autoSaveInterval);
  }, [isOpen, formData, selectedIncomeTab]);

  const handleAutoSave = () => {
    if (!returnData) return;
    const savedDataKey = `tax_return_${returnData.cnic}_${returnData.taxYear}`;
    localStorage.setItem(savedDataKey, JSON.stringify({ formData, selectedIncomeTab, lastSaved: new Date().toISOString() }));
    setLastSaved(new Date());
    setHasUnsavedChanges(false);
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    handleAutoSave();
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
    alert('Tax return data saved successfully!');
  };

  const updateFormData = (section, data) => {
    setFormData(prev => ({ ...prev, [section]: data }));
    setHasUnsavedChanges(true);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Your progress has been auto-saved. Are you sure you want to exit?')) {
        handleAutoSave(); onClose();
      }
    } else { handleAutoSave(); onClose(); }
  };

  const handleSubmit = () => {
    if (onSave) onSave(formData);
    localStorage.removeItem(`tax_return_${returnData.cnic}_${returnData.taxYear}`);
    alert('Tax return submitted successfully!');
    onClose();
  };

  const handlePrint = () => window.print();

  const handleCopyFromPreviousYear = () => {
    const previousYear = (parseInt(returnData?.taxYear) - 1).toString();
    const previousData = localStorage.getItem(`tax_return_${returnData.cnic}_${previousYear}`);
    if (previousData) {
      try {
        const parsed = JSON.parse(previousData);
        if (window.confirm(`Found data from tax year ${previousYear}. Copy to this year?`)) {
          setFormData(normalizeFormData({ ...parsed.formData, personalInfo: { ...(parsed.formData?.personalInfo || {}), taxYear: returnData?.taxYear } }, returnData));
          alert('Previous year data copied successfully!');
          setHasUnsavedChanges(true);
        }
      } catch (error) { console.error('Error copying previous year data:', error); alert('Failed to copy previous year data.'); }
    } else { alert(`No saved data found for tax year ${previousYear}.`); }
  };

  if (!isOpen) return null;

  const currentSection = incomeSections.find(s => s.id === selectedIncomeTab) || incomeSections[0];
  const SectionComponent = currentSection.component;
  const sectionData = formData?.[currentSection.dataKey] || { hasIncome: false, entries: [], values: {} };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full h-full max-w-7xl max-h-screen bg-white flex flex-col rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/20 rounded-lg"><FileText className="w-6 h-6" /></div>
                  <div>
                    <h1 className="text-2xl font-bold">Income Tax Return - {returnData?.taxYear}</h1>
                    <p className="text-blue-100 text-sm">Simplified Mode | {formData.personalInfo.name} \u2022 {formData.personalInfo.cnic}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {lastSaved && <div className="flex items-center gap-2 text-xs text-blue-100 font-mono"><Clock className="w-3.5 h-3.5" /> Last saved: {lastSaved.toLocaleTimeString()}</div>}
                  {hasUnsavedChanges && <div className="flex items-center gap-1 text-xs text-yellow-300"><AlertCircle className="w-3.5 h-3.5 animate-pulse" /> Unsaved changes</div>}
                  <div className="flex items-center gap-2 ml-2">
                    <button onClick={handleClose} className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-lg font-medium transition-colors">Cancel</button>
                    <button onClick={handleManualSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors disabled:opacity-50"><Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Draft'}</button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/80 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"><Printer className="w-4 h-4" /> Print</button>
                    <button onClick={handleSubmit} className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">Submit Return</button>
                  </div>
                  <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-lg transition-all" title="Close"><X className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex">
              <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white border-r border-gray-700 overflow-y-auto flex flex-col">
                <div className="p-4 flex-1 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Heads of Income</h3>
                  <nav className="space-y-2">
                    {incomeSections.map((section) => {
                      const isActive = selectedIncomeTab === section.id;
                      const sectionState = formData?.[section.dataKey] || { hasIncome: false, entries: [] };
                      const hasData = sectionState.hasIncome;
                      return (
                        <button key={section.id} onClick={() => setSelectedIncomeTab(section.id)} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all group ${isActive ? `bg-gradient-to-r ${section.color} text-white shadow-lg` : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}>
                          <div className="flex items-center gap-3 flex-1">
                            <span className="opacity-80 group-hover:opacity-100">{section.icon}</span>
                            <span className="text-sm font-medium text-left truncate">{section.title}</span>
                          </div>
                          {hasData && (
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${isActive ? 'bg-white/30 text-white' : 'bg-green-500/30 text-green-300'}`}>
                              ✓
                            </span>
                          )}
                          {isActive && <ChevronRight className="w-4 h-4 ml-1 opacity-70" />}
                        </button>
                      );
                    })}
                  </nav>
                </div>
                <div className="p-4 border-t border-gray-700 space-y-2">
                  <button onClick={handleCopyFromPreviousYear} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-colors font-medium" title="Copy data from previous year"><History className="w-3.5 h-3.5" /> Copy {parseInt(returnData?.taxYear) - 1}</button>
                  <button onClick={() => setShowWealthStatementModal(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors font-medium" title="Open Wealth Statement (116)"><PiggyBank className="w-3.5 h-3.5" /> Wealth Statement (116)</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-gray-50">
                <div className="max-w-4xl mx-auto p-8 space-y-6">
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <TaxpayerInfoCard name={formData.personalInfo.name} cnic={formData.personalInfo.cnic} ntn={formData.personalInfo.ntn} taxYear={formData.personalInfo.taxYear} personType={formData.personalInfo.personType} />
                    <IncomeSummaryCard formData={formData} />
                  </motion.div>
                  <motion.div key={selectedIncomeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-end border-b border-gray-100 pb-4 mb-6">
                      <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <input type="checkbox" checked={sectionData.hasIncome} onChange={(e) => updateFormData(currentSection.dataKey, { ...sectionData, hasIncome: e.target.checked, entries: e.target.checked ? sectionData.entries : [] })} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
                      </label>
                    </div>
                    <SectionComponent
                      formData={sectionData}
                      onUpdate={(data) => updateFormData(currentSection.dataKey, data)}
                    />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
      <WealthStatementFullModal
        isOpen={showWealthStatementModal}
        onClose={() => setShowWealthStatementModal(false)}
        clientName={formData.personalInfo.name}
        clientCnic={formData.personalInfo.cnic}
        taxYear={formData.personalInfo.taxYear}
      />
    </>
  );
};

export default SimpleTaxCalculationModal;
