import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import WealthStatementFull from '../taxCalculation/WealthStatementFull';

const WealthStatementPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-4 sm:px-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Tax Automation</p>
          <h1 className="text-xl font-semibold text-white">116 – Wealth Statement</h1>
          <p className="mt-1 text-sm text-slate-400">Full IRIS-style wealth statement with calculations, expense/assets sections, and print support.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-slate-100 p-3 sm:p-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
          <FileText className="h-4 w-4" />
          Legacy wealth statement imported into the web app
        </div>
        <WealthStatementFull />
      </div>
    </div>
  );
};

export default WealthStatementPage;
