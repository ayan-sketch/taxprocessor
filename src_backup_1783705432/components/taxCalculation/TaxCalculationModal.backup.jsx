import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, ArrowLeft, ArrowRight, CheckCircle, FileText, Clock, SkipForward, AlertCircle, HelpCircle, History, Download, Mail } from 'lucide-react';
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

// This is a backup of the original multi-step modal
// Created: 2026-06-03
