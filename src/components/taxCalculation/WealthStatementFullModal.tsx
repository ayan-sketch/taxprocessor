import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Plus, Search, Printer, ChevronDown, RotateCcw, FileText } from 'lucide-react';
import './WealthStatementFullModal.css';

interface WealthStatementData {
  values: Record<string, number>;
  entries: Record<string, Array<Record<string, unknown>>>;
  giftEntries: Record<string, Array<{
    id: number;
    idType: string;
    idno: string;
    name: string;
    desc: string;
    amt: number;
  }>>;
  contentEntries: Record<string, Array<{
    id: number;
    contents: string;
    amt: number;
  }>>;
  assetEntries: Record<string, Array<{
    id: number;
    property?: string;
    desc?: string;
    name?: string;
    amt: number;
  }>>;
}

interface WealthStatementFullModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnData: {
    clientName: string;
    cnic: string;
    taxYear: string;
  };
  initialData?: WealthStatementData;
  onSave?: (data: WealthStatementData) => void;
}

const EXPENSES = [
  { code: '7089', desc: 'Personal Expenses', isTotal: true, totalKey: 'personalExpTotal' },
  { code: '7051', desc: 'Rent', sub: true },
  { code: '7052', desc: 'Rates / Taxes / Charge / Cess', sub: true },
  { code: '7055', desc: 'Vehicle Running / Maintenance', sub: true },
  { code: '7056', desc: 'Travelling', sub: true },
  { code: '7058', desc: 'Electricity', sub: true },
  { code: '7059', desc: 'Water', sub: true },
  { code: '7060', desc: 'Gas', sub: true },
  { code: '7061', desc: 'Telephone', sub: true },
  { code: '7066', desc: 'Asset Insurance / Security', sub: true },
  { code: '7070', desc: 'Medical', sub: true },
  { code: '7071', desc: 'Educational', sub: true },
  { code: '7072', desc: 'Club', sub: true },
  { code: '7073', desc: 'Functions / Gatherings', sub: true },
  { code: '7076', desc: 'Donation, Zakat, Annuity, Profit on Debt, Life Insurance Premium, etc.', sub: true },
  { code: '7087', desc: 'Other Personal / Household Expenses', sub: true },
  { code: '7088', desc: 'Contribution in Expenses by Family Members', sub: true, deduct: true },
];

const ASSETS = [
  { code: '7001', desc: 'Agricultural Property', hasPlus: true },
  { code: '7002', desc: 'Commercial, Industrial, Residential Property (Non-Business)', hasPlus: true },
  { code: '7003', desc: 'Business Capital', hasPlus: true },
  { code: '7004', desc: 'Equipment (Non-Business)' },
  { code: '7005', desc: 'Animal (Non-Business)' },
  { code: '7006', desc: 'Investment (Non-Business) (Account / Annuity / Bond / Certificate / Debenture / Deposit / Fund / Instrument / Policy / Share / Stock / Unit, etc.)', hasPlus: true },
  { code: '7007', desc: 'Debt (Non-Business) (Advance / Debt / Deposit / Prepayment / Receivable / Security)', hasPlus: true },
  { code: '7008', desc: 'Motor Vehicle (Non-Business)', hasPlus: true },
  { code: '7009', desc: 'Precious Possession', hasPlus: true },
  { code: '7010', desc: 'Household Effect' },
  { code: '7011', desc: 'Personal Item' },
  { code: '7012', desc: 'Cash (Non-Business)' },
  { code: '7013', desc: 'Any Other Asset', hasPlus: true },
  { code: '7013a', desc: '  Any Other Asset – Easypaisa Account', indent: true },
  { code: '7013b', desc: '  Any Other Asset – Allied Bank', indent: true },
  { code: '7014', desc: 'Assets held on others name (including non-filer Spouse/Dependents)', hasPlus: true },
  { code: '7015', desc: 'Total Assets Inside Pakistan', isSubTotal: true, totalKey: 'assetsInside' },
  { code: '7016', desc: 'Assets held outside Pakistan', hasPlus: true },
  { code: '7018', desc: 'Capital or voting rights in foreign company' },
  { code: '7020', desc: 'Total Assets held outside Pakistan', isSubTotal: true, totalKey: 'assetsOutside' },
  { code: '7019', desc: 'Total Assets', isGrandTotal: true, totalKey: 'totalAssets' },
  { code: '7021', desc: 'Credit (Non-Business) (Advance / Borrowing / Credit / Deposit / Loan / Mortgage / Overdraft / Payable)', hasPlus: true },
  { code: '7022', desc: 'Foreign Liabilities' },
  { code: '7029', desc: 'Total Liabilities', isSubTotal: true, totalKey: 'totalLiabilities' },
  { code: '703001', desc: 'Net Assets Current Year', isNetAssets: true },
];

const RECON = [
  { code: '703001', desc: 'Net Assets Current Year', isGrandTotal: true, totalKey: 'netAssetsCY' },
  { code: '703002', desc: 'Net Assets Previous Year' },
  { code: '703003', desc: 'Increase / Decrease in Assets', isSubTotal: true, totalKey: 'increaseAssets' },
  { code: '7049', desc: 'Inflows', isSubTotal: true, totalKey: 'totalInflows' },
  { code: '7031', desc: 'Income Declared as per Return for the year subject to Normal Tax', indent: true },
  { code: '7032', desc: 'Income Declared as per Return for the year Exempt from Tax', indent: true },
  { code: '7033', desc: 'Income Attributable to Receipts, etc. Declared as per Return for the year subject to Final / Fixed Tax', indent: true },
  { code: '7034', desc: 'Adjustments in Inflows', indent: true, hasContent: true },
  { code: '7035', desc: 'Foreign Remittance', indent: true },
  { code: '7036', desc: 'Inheritance', indent: true, hasContent: true },
  { code: '7037', desc: 'Gift', indent: true },
  { code: '7038', desc: 'Gain on Disposal of Assets, excluding Capital Gain on Immovable Property', indent: true },
  { code: '7039', desc: 'Income Attributable to Receipts (Builders/Developers)', indent: true },
  { code: '7048', desc: 'Others', indent: true },
  { code: '7043', desc: 'Deemed Income declared as per Return for the year', indent: true },
  { code: '7099', desc: 'Outflows', isSubTotal: true, totalKey: 'totalOutflows' },
  { code: '7089', desc: 'Personal Expenses', indent: true, readonlyFromExp: true },
  { code: '7098', desc: 'Adjustments in Outflows', indent: true },
  { code: '7091', desc: 'Gift', indent: true },
  { code: '7092', desc: 'Loss on Disposal of Assets', indent: true },
  { code: '703000', desc: 'Unreconciled Amount', isUnreconciled: true, totalKey: 'unreconciled' },
  { code: '703004', desc: 'Assets Transferred / Sold / Gifted / Donated during the year' },
];

const fmtPKR = (v: number) => {
  if (v === 0) return '';
  const abs = Math.round(Math.abs(v)).toLocaleString('en-PK');
  return v < 0 ? '-' + abs : abs;
};

const parseV = (v: string | number) => parseFloat(String(v || '').replace(/,/g, '')) || 0;

const assetFieldConfigs: Record<string, Array<{ id: string; label: string; type: 'input' | 'textarea'; placeholder: string; height?: string }>> = {
  '7001': [
    { id: 'am-property', label: 'Property*', type: 'textarea', placeholder: 'Property address / description', height: '40px' },
    { id: 'am-desc', label: 'Description*', type: 'textarea', placeholder: 'Additional description' },
    { id: 'am-amount', label: 'Amount (PKR)*', type: 'input', placeholder: 'Enter amount' }
  ],
  '7002': [
    { id: 'am-property', label: 'Property*', type: 'textarea', placeholder: 'Property address / description', height: '40px' },
    { id: 'am-desc', label: 'Description*', type: 'textarea', placeholder: 'Additional description' },
    { id: 'am-amount', label: 'Amount (PKR)*', type: 'input', placeholder: 'Enter amount' }
  ],
  '7003': [
    { id: 'am-name', label: 'Name*', type: 'input', placeholder: 'Business / entity name' },
    { id: 'am-amount', label: 'Amount (PKR)*', type: 'input', placeholder: 'Enter amount' }
  ],
  'default': [
    { id: 'am-desc', label: 'Description*', type: 'textarea', placeholder: 'Description*' },
    { id: 'am-amount', label: 'Amount (PKR)*', type: 'input', placeholder: 'Enter amount' }
  ]
};

export const WealthStatementFullModal: React.FC<WealthStatementFullModalProps> = ({
  isOpen,
  onClose,
  returnData,
  initialData,
  onSave
}) => {
  if (!isOpen) return null;

  // State
  const [values, setValues] = useState<Record<string, number>>({});
  const [currentSection, setCurrentSection] = useState<'expenses' | 'assets' | 'recon'>('expenses');
  const [currentTab, setCurrentTab] = useState<'data' | 'wealth' | 'print'>('data');
  const [searchQuery, setSearchQuery] = useState('');
  const [wsMenuOpen, setWsMenuOpen] = useState(false);
  
  // Modal states
  const [giftModal, setGiftModal] = useState<{ open: boolean; code: string | null; editId: number | null }>({ open: false, code: null, editId: null });
  const [giftForm, setGiftForm] = useState({ idType: 'CNIC/NICOP', idno: '', name: '', desc: '', amount: '' });
  const [giftError, setGiftError] = useState('');
  const [giftEntries, setGiftEntries] = useState<Record<string, Array<{ id: number; idType: string; idno: string; name: string; desc: string; amt: number }>>>({
    '7037': [], '7091': []
  });

  const [contentModal, setContentModal] = useState<{ open: boolean; code: string | null; editId: number | null }>({ open: false, code: null, editId: null });
  const [contentForm, setContentForm] = useState({ contents: '', amount: '' });
  const [contentEntries, setContentEntries] = useState<Record<string, Array<{ id: number; contents: string; amt: number }>>>({
    '7034': [], '7036': []
  });

  const [assetModal, setAssetModal] = useState<{ open: boolean; code: string | null; editId: number | null }>({ open: false, code: null, editId: null });
  const [assetForm, setAssetForm] = useState<Record<string, string>>({});
  const [assetEntries, setAssetEntries] = useState<Record<string, Array<{ id: number; property?: string; desc?: string; name?: string; amt: number }>>>({
    '7001': [], '7002': [], '7003': [], '7006': [], '7007': [], 
    '7008': [], '7009': [], '7013': [], '7014': [], '7016': [], '7021': []
  });

  // Computed values
  const getVal = (code: string) => values[code] || 0;

  const calcExpenses = () => {
    let sub = 0;
    EXPENSES.forEach(r => {
      if (r.sub && r.code !== '7088') sub += getVal(r.code);
    });
    sub -= getVal('7088');
    setValues(prev => ({ ...prev, __expTotal: sub }));
    calcRecon();
  };

  const calcAssets = () => {
    const insideCodes = ['7001','7002','7003','7004','7005','7006','7007','7008','7009','7010','7011','7012','7013','7013a','7013b','7014'];
    let inside = insideCodes.reduce((s, c) => s + getVal(c), 0);
    setValues(prev => ({ ...prev, __assetsInside: inside }));

    const outsideCodes = ['7016','7018'];
    let outside = outsideCodes.reduce((s, c) => s + getVal(c), 0);
    setValues(prev => ({ ...prev, __assetsOutside: outside }));

    const total = inside + outside;
    setValues(prev => ({ ...prev, __totalAssets: total }));

    const liabCodes = ['7021','7022'];
    let liab = liabCodes.reduce((s, c) => s + getVal(c), 0);
    setValues(prev => ({ ...prev, __totalLiabilities: liab }));

    const netCA = total - liab;
    setValues(prev => ({ ...prev, __netAssetsCA: netCA }));
    calcRecon();
  };

  const calcRecon = () => {
    const netCY = values['__netAssetsCA'] || 0;
    const prevY = getVal('703002');
    const increase = netCY - prevY;
    setValues(prev => ({ ...prev, __increaseAssets: increase }));

    const inflowCodes = ['7031','7032','7033','7034','7035','7036','7037','7038','7039','7048','7043'];
    let inflows = inflowCodes.reduce((s, c) => s + getVal(c), 0);
    inflows += increase;
    setValues(prev => ({ ...prev, __totalInflows: inflows }));

    const expTotal = values['__expTotal'] || 0;
    const outflowEditable = ['7098','7091','7092'];
    let outflows = expTotal + outflowEditable.reduce((s, c) => s + getVal(c), 0);
    setValues(prev => ({ ...prev, __totalOutflows: outflows }));

    const unreconciled = inflows - outflows;
    setValues(prev => ({ ...prev, __unreconciled: unreconciled }));
  };

  const recalcAll = () => {
    calcExpenses();
    calcAssets();
    calcRecon();
  };

  // Initialize from initialData
  useEffect(() => {
    if (initialData) {
      setValues(initialData.values || {});
      if (initialData.giftEntries) setGiftEntries(initialData.giftEntries);
      if (initialData.contentEntries) setContentEntries(initialData.contentEntries);
      if (initialData.assetEntries) setAssetEntries(initialData.assetEntries);
      recalcAll();
    }
  }, [initialData]);

  // Input handler
  const handleInput = (code: string, rawValue: string) => {
    const allowNeg = currentSection === 'recon';
    const isNeg = allowNeg && rawValue.startsWith('-');
    let clean = rawValue.replace(/[^0-9.]/g, '');
    const dotIdx = clean.indexOf('.');
    if (dotIdx !== -1) {
      clean = clean.slice(0, dotIdx + 1) + clean.slice(dotIdx + 1).replace(/\./g, '');
    }
    if (isNeg) clean = '-' + clean;
    const num = parseFloat(clean) || 0;
    setValues(prev => ({ ...prev, [code]: num }));
    if (currentSection === 'expenses') calcExpenses();
    else if (currentSection === 'assets') calcAssets();
    else if (currentSection === 'recon') calcRecon();
  };

  // Gift modal handlers
  const openGiftModal = (code: string, editId?: number) => {
    setGiftModal({ open: true, code, editId: editId || null });
    if (editId) {
      const entry = giftEntries[code]?.find(e => e.id === editId);
      if (entry) {
        setGiftForm({ idType: entry.idType, idno: entry.idno, name: entry.name, desc: entry.desc, amount: String(entry.amt) });
      }
    } else {
      setGiftForm({ idType: 'CNIC/NICOP', idno: '', name: '', desc: '', amount: '' });
    }
    setGiftError('');
  };

  const closeGiftModal = () => setGiftModal({ open: false, code: null, editId: null });

  const updateGmLabel = () => {
    // Label updates handled by conditional rendering
  };

  const saveGiftEntry = () => {
    const { code, editId } = giftModal;
    if (!code) return;

    const idType = giftForm.idType;
    const idno = giftForm.idno.trim();
    const name = giftForm.name.trim();
    const desc = giftForm.desc.trim();
    const amt = parseFloat(giftForm.amount) || 0;

    if (!idno || !name || !desc || !amt) {
      setGiftError('Please fill in all required fields.');
      return;
    }

    if (idType === 'CNIC/NICOP' && !/^[0-9]{13}$/.test(idno)) {
      setGiftError('CNIC must be exactly 13 digits without dashes.');
      return;
    }
    if (idType === 'NTN' && !/^[0-9]{8}$/.test(idno)) {
      setGiftError('NTN must be exactly 8 digits without dashes.');
      return;
    }

    setGiftEntries(prev => {
      const entries = [...(prev[code] || [])];
      if (editId !== null) {
        const idx = entries.findIndex(e => e.id === editId);
        if (idx !== -1) entries[idx] = { idType, idno, name, desc, amt, id: editId };
      } else {
        entries.push({ idType, idno, name, desc, amt, id: Date.now() });
      }
      return { ...prev, [code]: entries };
    });

    // Update total in values
    const total = giftEntries[code]?.reduce((s, e) => s + e.amt, 0) + (editId ? 0 : amt);
    // Recalculate after state update
    setTimeout(() => {
      const newTotal = giftEntries[code]?.reduce((s, e) => s + e.amt, 0) + (editId ? 0 : amt);
      setValues(prev => ({ ...prev, [code]: newTotal }));
      calcRecon();
    }, 0);

    closeGiftModal();
    setCurrentSection('recon');
  };

  const deleteGiftEntry = (code: string, id: number) => {
    setGiftEntries(prev => {
      const entries = (prev[code] || []).filter(e => e.id !== id);
      return { ...prev, [code]: entries };
    });
    setTimeout(() => {
      const total = (giftEntries[code] || []).filter(e => e.id !== id).reduce((s, e) => s + e.amt, 0);
      setValues(prev => ({ ...prev, [code]: total }));
      calcRecon();
    }, 0);
  };

  // Content modal handlers
  const openContentModal = (code: string, editId?: number) => {
    setContentModal({ open: true, code, editId: editId || null });
    if (editId) {
      const entry = contentEntries[code]?.find(e => e.id === editId);
      if (entry) setContentForm({ contents: entry.contents, amount: String(entry.amt) });
    } else {
      setContentForm({ contents: '', amount: '' });
    }
  };

  const closeContentModal = () => setContentModal({ open: false, code: null, editId: null });

  const saveContentEntry = () => {
    const { code, editId } = contentModal;
    if (!code) return;

    const contents = contentForm.contents.trim();
    const amt = parseFloat(contentForm.amount) || 0;

    if (!contents || !amt) {
      alert('Please fill in all required fields.');
      return;
    }

    setContentEntries(prev => {
      const entries = [...(prev[code] || [])];
      if (editId !== null) {
        const idx = entries.findIndex(e => e.id === editId);
        if (idx !== -1) entries[idx] = { contents, amt, id: editId };
      } else {
        entries.push({ contents, amt, id: Date.now() });
      }
      return { ...prev, [code]: entries };
    });

    setTimeout(() => {
      const total = (contentEntries[code] || []).reduce((s, e) => s + e.amt, 0) + (editId ? 0 : amt);
      setValues(prev => ({ ...prev, [code]: total }));
      calcRecon();
    }, 0);

    closeContentModal();
    setCurrentSection('recon');
  };

  const deleteContentEntry = (code: string, id: number) => {
    setContentEntries(prev => {
      const entries = (prev[code] || []).filter(e => e.id !== id);
      return { ...prev, [code]: entries };
    });
    setTimeout(() => {
      const total = (contentEntries[code] || []).filter(e => e.id !== id).reduce((s, e) => s + e.amt, 0);
      setValues(prev => ({ ...prev, [code]: total }));
      calcRecon();
    }, 0);
  };

  // Asset modal handlers
  const openAssetModal = (code: string, editId?: number) => {
    setAssetModal({ open: true, code, editId: editId || null });
    const fields = assetFieldConfigs[code] || assetFieldConfigs['default'];
    const newForm: Record<string, string> = {};
    fields.forEach(f => newForm[f.id] = '');
    
    if (editId) {
      const entry = assetEntries[code]?.find(e => e.id === editId);
      if (entry) {
        if (code === '7001' || code === '7002') {
          newForm['am-property'] = entry.property || '';
          newForm['am-desc'] = entry.desc || '';
        } else if (code === '7003') {
          newForm['am-name'] = entry.name || '';
        } else {
          newForm['am-desc'] = entry.desc || '';
        }
        newForm['am-amount'] = entry.amt > 0 ? String(entry.amt) : '';
      }
    }
    setAssetForm(newForm);
  };

  const closeAssetModal = () => setAssetModal({ open: false, code: null, editId: null });

  const saveAssetEntry = () => {
    const { code, editId } = assetModal;
    if (!code) return;

    let desc = '', amt = 0, property = '', name = '';

    if (code === '7001' || code === '7002') {
      property = assetForm['am-property']?.trim() || '';
      desc = assetForm['am-desc']?.trim() || '';
      amt = parseFloat(assetForm['am-amount']) || 0;
      if (!property || !desc || !amt) { alert('Please fill in all required fields.'); return; }
    } else if (code === '7003') {
      name = assetForm['am-name']?.trim() || '';
      amt = parseFloat(assetForm['am-amount']) || 0;
      if (!name || !amt) { alert('Please fill in all required fields.'); return; }
    } else {
      desc = assetForm['am-desc']?.trim() || '';
      amt = parseFloat(assetForm['am-amount']) || 0;
      if (!desc || !amt) { alert('Please fill in all required fields.'); return; }
    }

    setAssetEntries(prev => {
      const entries = [...(prev[code] || [])];
      if (editId !== null) {
        const idx = entries.findIndex(e => e.id === editId);
        if (idx !== -1) {
          if (code === '7001' || code === '7002') entries[idx] = { property, desc, amt, id: editId };
          else if (code === '7003') entries[idx] = { name, amt, id: editId };
          else entries[idx] = { desc, amt, id: editId };
        }
      } else {
        if (code === '7001' || code === '7002') entries.push({ property, desc, amt, id: Date.now() });
        else if (code === '7003') entries.push({ name, amt, id: Date.now() });
        else entries.push({ desc, amt, id: Date.now() });
      }
      return { ...prev, [code]: entries };
    });

    setTimeout(() => {
      const total = (assetEntries[code] || []).reduce((s, e) => s + e.amt, 0) + (editId ? 0 : amt);
      setValues(prev => ({ ...prev, [code]: total }));
      calcAssets();
    }, 0);

    closeAssetModal();
    setCurrentSection('assets');
  };

  const deleteAssetEntry = (code: string, id: number) => {
    setAssetEntries(prev => {
      const entries = (prev[code] || []).filter(e => e.id !== id);
      return { ...prev, [code]: entries };
    });
    setTimeout(() => {
      const total = (assetEntries[code] || []).filter(e => e.id !== id).reduce((s, e) => s + e.amt, 0);
      setValues(prev => ({ ...prev, [code]: total }));
      calcAssets();
    }, 0);
  };

  // Search functionality
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    // This would filter rows - simplified for now
    return q;
  }, [searchQuery]);

  // Print handler
  const handlePrint = () => {
    // Add print date
    const printDateEl = document.getElementById('print-date');
    if (printDateEl) {
      printDateEl.textContent = new Date().toLocaleDateString('en-PK', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    }
    // Mark empty rows for print
    document.querySelectorAll('tr[data-row]').forEach(row => {
      const isSub = row.getAttribute('data-gift') === 'true' || row.getAttribute('data-sub') === 'true';
      const isTotal = row.classList.contains('subtotal') || row.classList.contains('grand-total') || row.classList.contains('unreconciled');
      if (isSub || isTotal) { row.classList.remove('print-empty'); return; }
      const inputs = row.querySelectorAll('input.amt-inp');
      const hasValue = Array.from(inputs).some((inp: Element) => (inp as HTMLInputElement).value.trim() !== '');
      if (hasValue) row.classList.remove('print-empty');
      else row.classList.add('print-empty');
    });
    window.print();
  };

  // Save handler
  const handleSave = () => {
    const data: WealthStatementData = {
      values: { ...values },
      entries: {},
      giftEntries,
      contentEntries,
      assetEntries
    };
    if (onSave) onSave(data);
    alert('Wealth Statement saved!');
  };

  // Render section tables
  const renderExpenses = () => (
    <table className="data-table">
      <thead>
        <tr><th>Description</th><th className="code">Code</th><th className="right">Amount</th></tr>
      </thead>
      <tbody>
        {EXPENSES.map(r => {
          if (r.isTotal) {
            return (
              <tr key={r.code} className="subtotal" data-row data-desc={r.desc} data-code={r.code}>
                <td>{r.desc}</td><td className="code">{r.code}</td>
                <td className="amt"><input className="amt-inp" id={`disp-${r.code}`} readOnly placeholder="" value={fmtPKR(values['__expTotal'] || 0)} /></td>
              </tr>
            );
          }
          return (
            <tr key={r.code} data-row data-desc={r.desc} data-code={r.code}>
              <td style={{ color: r.deduct ? '#b91c1c' : '' }}>
                {r.desc}
                {r.deduct && <span style={{ fontSize: '11px', color: '#b91c1c' }}> (deducted)</span>}
              </td>
              <td className="code">{r.code}</td>
              <td className="amt">
                <input
                  className="amt-inp"
                  id={`inp-${r.code}`}
                  placeholder=""
                  value={fmtPKR(getVal(r.code))}
                  onChange={(e) => handleInput(r.code, e.target.value)}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderAssets = () => (
    <table className="data-table">
      <thead>
        <tr><th>Description</th><th className="code">Code</th><th className="right">Amount</th></tr>
      </thead>
      <tbody>
        {ASSETS.map(r => {
          if (r.isGrandTotal) {
            return (
              <tr key={r.code} className="grand-total" data-row data-desc={r.desc} data-code={r.code}>
                <td style={{ color: '#fff' }}>{r.desc}</td>
                <td className="code" style={{ color: '#fff' }}>{r.code}</td>
                <td className="amt"><input className="amt-inp" id={`disp-${r.code}`} readOnly placeholder="" value={fmtPKR(values['__totalAssets'] || 0)} style={{ color: '#fff' }} /></td>
              </tr>
            );
          }
          if (r.isSubTotal) {
            const totalKey = r.totalKey ? values[`__${r.totalKey}`] : 0;
            return (
              <tr key={r.code} className="subtotal" data-row data-desc={r.desc} data-code={r.code}>
                <td>{r.desc}</td><td className="code">{r.code}</td>
                <td className="amt"><input className="amt-inp" id={`disp-${r.code}`} readOnly placeholder="" value={fmtPKR(totalKey)} /></td>
              </tr>
            );
          }
          if (r.hasPlus) {
            return (
              <tr key={r.code} data-row data-desc={r.desc} data-code={r.code}>
                <td style={{ paddingLeft: r.indent ? '28px' : '', color: r.indent ? 'var(--muted)' : '' }}>{r.desc}</td>
                <td className="code">{r.code}</td>
                <td className="amt">
                  <div className="amt-with-plus">
                    <input
                      className="amt-inp"
                      id={`inp-${r.code}`}
                      placeholder=""
                      readOnly
                      value={fmtPKR(getVal(r.code))}
                      onClick={() => openAssetModal(r.code)}
                      style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                    />
                    <button className="plus-btn" onClick={() => openAssetModal(r.code)} title="Add Entry">+</button>
                  </div>
                </td>
              </tr>
            );
          }
          if (r.isNetAssets) {
            return (
              <tr key={r.code} className="subtotal" data-row data-desc={r.desc} data-code={r.code} style={{ borderTop: '2px solid #1a3055' }}>
                <td style={{ color: 'var(--subtotal-color)', fontWeight: 700 }}>{r.desc}</td>
                <td className="code" style={{ color: 'var(--subtotal-color)' }}>{r.code}</td>
                <td className="amt"><input className="amt-inp" id="disp-assets-703001" readOnly placeholder="" value={fmtPKR(values['__netAssetsCA'] || 0)} style={{ fontWeight: 700, color: 'var(--subtotal-color)' }} /></td>
              </tr>
            );
          }
          return (
            <tr key={r.code} data-row data-desc={r.desc} data-code={r.code}>
              <td style={{ paddingLeft: r.indent ? '28px' : '', color: r.indent ? 'var(--muted)' : '' }}>{r.desc}</td>
              <td className="code">{r.code}</td>
              <td className="amt">
                <input
                  className="amt-inp"
                  id={`inp-${r.code}`}
                  placeholder=""
                  value={fmtPKR(getVal(r.code))}
                  onChange={(e) => handleInput(r.code, e.target.value)}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderRecon = () => (
    <table className="data-table">
      <thead>
        <tr><th>Description</th><th className="code">Code</th><th className="right">Amount</th></tr>
      </thead>
      <tbody>
        {RECON.map(r => {
          if (r.isGrandTotal) {
            return (
              <tr key={r.code} className="grand-total" data-row data-desc={r.desc} data-code={r.code}>
                <td style={{ color: '#fff' }}>{r.desc}</td>
                <td className="code" style={{ color: '#fff' }}>{r.code}</td>
                <td className="amt"><input className="amt-inp" id={`disp-${r.code}`} readOnly placeholder="" value={fmtPKR(values['__netAssetsCA'] || 0)} style={{ color: '#fff' }} /></td>
              </tr>
            );
          }
          if (r.isSubTotal) {
            const totalKey = r.totalKey ? values[`__${r.totalKey}`] : 0;
            return (
              <tr key={r.code} className="subtotal" data-row data-desc={r.desc} data-code={r.code}>
                <td>{r.desc}</td><td className="code">{r.code}</td>
                <td className="amt"><input className="amt-inp" id={`disp-${r.code}`} readOnly placeholder="" value={fmtPKR(totalKey)} /></td>
              </tr>
            );
          }
          if (r.isUnreconciled) {
            const unreconciled = values['__unreconciled'] || 0;
            return (
              <tr key={r.code} className="unreconciled" data-row data-desc={r.desc} data-code={r.code}>
                <td>{r.desc}</td><td className="code">{r.code}</td>
                <td className="amt"><input className="amt-inp" id={`disp-${r.code}`} readOnly placeholder="" value={fmtPKR(unreconciled)} /></td>
              </tr>
            );
          }
          if (r.readonlyFromExp) {
            return (
              <tr key={r.code} data-row data-desc={r.desc} data-code={r.code}>
                <td style={{ paddingLeft: r.indent ? '28px' : '' }}>{r.desc}</td>
                <td className="code">{r.code}</td>
                <td className="amt"><input className="amt-inp" id={`disp-recon-${r.code}`} readOnly placeholder="" value={fmtPKR(values['__expTotal'] || 0)} /></td>
              </tr>
            );
          }
          if (r.code === '703002') {
            return (
              <tr key={r.code} data-row data-desc={r.desc} data-code={r.code}>
                <td>{r.desc}</td><td className="code">{r.code}</td>
                <td className="amt">
                  <input className="amt-inp" id={`inp-${r.code}`} placeholder="" value={fmtPKR(getVal(r.code))} onChange={(e) => handleInput(r.code, e.target.value)} />
                </td>
              </tr>
            );
          }
          const isGift = r.code === '7037' || r.code === '7091';
          const isContent = r.hasContent === true;
          if (isGift) {
            return (
              <tr key={r.code} data-row data-desc={r.desc} data-code={r.code}>
                <td style={{ paddingLeft: r.indent ? '28px' : '', color: r.indent ? 'var(--muted)' : '' }}>{r.desc}</td>
                <td className="code">{r.code}</td>
                <td className="amt">
                  <div className="amt-with-plus">
                    <input
                      className="amt-inp"
                      id={`inp-${r.code}`}
                      placeholder=""
                      readOnly
                      onClick={() => openGiftModal(r.code)}
                      value={fmtPKR(getVal(r.code))}
                      style={{ flex: 1, minWidth: 0, cursor: 'pointer', background: 'transparent', caretColor: 'transparent', borderColor: 'transparent' }}
                    />
                    <button className="plus-btn" onClick={() => openGiftModal(r.code)} title="Add Gift">+</button>
                  </div>
                </td>
              </tr>
            );
          }
          if (isContent) {
            return (
              <tr key={r.code} data-row data-desc={r.desc} data-code={r.code}>
                <td style={{ paddingLeft: r.indent ? '28px' : '', color: r.indent ? 'var(--muted)' : '' }}>{r.desc}</td>
                <td className="code">{r.code}</td>
                <td className="amt">
                  <div className="amt-with-plus">
                    <input
                      className="amt-inp"
                      id={`inp-${r.code}`}
                      placeholder=""
                      readOnly
                      onClick={() => openContentModal(r.code)}
                      value={fmtPKR(getVal(r.code))}
                      style={{ flex: 1, minWidth: 0, cursor: 'pointer', background: 'transparent', caretColor: 'transparent', borderColor: 'transparent' }}
                    />
                    <button className="plus-btn" onClick={() => openContentModal(r.code)} title="Add Content">+</button>
                  </div>
                </td>
              </tr>
            );
          }
          return (
            <tr key={r.code} data-row data-desc={r.desc} data-code={r.code}>
              <td style={{ paddingLeft: r.indent ? '28px' : '', color: r.indent ? 'var(--muted)' : '' }}>{r.desc}</td>
              <td className="code">{r.code}</td>
              <td className="amt">
                <input
                  className="amt-inp"
                  id={`inp-${r.code}`}
                  placeholder=""
                  value={fmtPKR(getVal(r.code))}
                  onChange={(e) => handleInput(r.code, e.target.value)}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  // Render gift sub-rows for recon section
  const renderGiftSubRows = (code: string) => {
    const entries = giftEntries[code] || [];
    return entries.map(entry => (
      <tr key={entry.id} className="gift-entry" data-row data-gift="true" style={{ display: 'table-row' }}>
        <td style={{ paddingLeft: '28px', fontSize: '12px', color: '#333' }}>
          Gift - {entry.idno} - {entry.name} - {entry.desc}
        </td>
        <td className="code" style={{ fontSize: '12px', color: '#888' }}>{code}</td>
        <td className="amt">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
            <span style={{ color: '#1a3055', fontWeight: 600, fontSize: '12.5px' }}>{fmtPKR(entry.amt)}</span>
            <button className="gift-action-btn gift-edit-btn" onClick={() => openGiftModal(code, entry.id)} title="Edit">✏️</button>
            <button className="gift-action-btn gift-del-btn" onClick={() => deleteGiftEntry(code, entry.id)} title="Delete">✕</button>
          </div>
        </td>
      </tr>
    ));
  };

  const renderContentSubRows = (code: string) => {
    const entries = contentEntries[code] || [];
    const label = code === '7034' ? 'Adjustments in Inflows' : 'Inheritance';
    return entries.map(entry => (
      <tr key={entry.id} className="gift-entry" data-row data-gift="true" style={{ display: 'table-row' }}>
        <td style={{ paddingLeft: '28px', fontSize: '12px', color: '#333' }}>
          {label} - {entry.contents}
        </td>
        <td className="code" style={{ fontSize: '12px', color: '#888' }}>{code}</td>
        <td className="amt">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
            <span style={{ color: '#1a3055', fontWeight: 600, fontSize: '12.5px' }}>{fmtPKR(entry.amt)}</span>
            <button className="gift-action-btn gift-edit-btn" onClick={() => openContentModal(code, entry.id)} title="Edit">✏️</button>
            <button className="gift-action-btn gift-del-btn" onClick={() => deleteContentEntry(code, entry.id)} title="Delete">✕</button>
          </div>
        </td>
      </tr>
    ));
  };

  const renderAssetSubRows = (code: string) => {
    const entries = assetEntries[code] || [];
    return entries.map(entry => {
      let label = '';
      if (code === '7001' || code === '7002') label = `${entry.property} - ${entry.desc}`;
      else if (code === '7003') label = entry.name || '';
      else label = entry.desc || '';
      return (
        <tr key={entry.id} className="gift-entry" data-row data-gift="true" style={{ display: 'table-row' }}>
          <td style={{ paddingLeft: '28px', fontSize: '12px', color: '#333' }}>{label}</td>
          <td className="code" style={{ fontSize: '12px', color: '#888' }}>{code}</td>
          <td className="amt">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
              <span style={{ color: '#1a3055', fontWeight: 600, fontSize: '12.5px' }}>{fmtPKR(entry.amt)}</span>
              <button className="gift-action-btn gift-edit-btn" onClick={() => openAssetModal(code, entry.id)} title="Edit">✏️</button>
              <button className="gift-action-btn gift-del-btn" onClick={() => deleteAssetEntry(code, entry.id)} title="Delete">✕</button>
            </div>
          </td>
        </tr>
      );
    });
  };

  // Current section content
  const sectionContent = currentSection === 'expenses' ? renderExpenses() :
    currentSection === 'assets' ? renderAssets() : renderRecon();

  const unreconciledAmount = values['__unreconciled'] || 0;
  const isUnreconciledZero = unreconciledAmount === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full h-full max-w-7xl max-h-screen bg-white flex flex-col rounded-2xl overflow-hidden shadow-2xl iris-wrap" style={{ fontSize: '13px' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">116 – Wealth Statement</h1>
                <p className="text-blue-100 text-sm">
                  {returnData.clientName} • {returnData.cnic} • Tax Year {returnData.taxYear}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSave} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors">Save</button>
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/80 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-all" title="Close"><X className="w-5 h-5" /></button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-64 bg-[#17375e] flex-shrink-0 flex flex-col" style={{ borderLeft: '3px solid transparent' }}>
            <div 
              className="sb-title" 
              style={{ background: '#1a3055', color: '#fff', fontSize: '12px', fontWeight: '500', padding: '10px 14px', letterSpacing: '.3px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}
              onClick={() => setWsMenuOpen(!wsMenuOpen)}
            >
              <span>116 – Wealth Statement</span>
              <span style={{ fontSize: '11px', transition: 'transform .25s', display: 'inline-block', transform: wsMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </div>
            <div style={{ overflow: 'hidden', maxHeight: wsMenuOpen ? '200px' : '0', transition: 'max-height .3s ease' }}>
              <div className={`sb-item sub ${currentSection === 'expenses' ? 'active' : ''}`} onClick={() => { setCurrentSection('expenses'); setWsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', color: 'rgba(255,255,255,.8)', cursor: 'pointer', fontSize: '12.5px', borderLeft: '3px solid transparent', background: currentSection === 'expenses' ? '#6c5fc7' : 'transparent', color: currentSection === 'expenses' ? '#fff' : 'rgba(255,255,255,.8)', fontWeight: currentSection === 'expenses' ? '500' : 'normal', borderLeftColor: currentSection === 'expenses' ? '#fff' : 'transparent' }}>– Personal Expenses</div>
              <div className={`sb-item sub ${currentSection === 'assets' ? 'active' : ''}`} onClick={() => { setCurrentSection('assets'); setWsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', color: 'rgba(255,255,255,.8)', cursor: 'pointer', fontSize: '12.5px', borderLeft: '3px solid transparent', background: currentSection === 'assets' ? '#6c5fc7' : 'transparent', color: currentSection === 'assets' ? '#fff' : 'rgba(255,255,255,.8)', fontWeight: currentSection === 'assets' ? '500' : 'normal', borderLeftColor: currentSection === 'assets' ? '#fff' : 'transparent' }}>– Personal Assets / Liabilities</div>
              <div className={`sb-item sub ${currentSection === 'recon' ? 'active' : ''}`} onClick={() => { setCurrentSection('recon'); setWsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', color: 'rgba(255,255,255,.8)', cursor: 'pointer', fontSize: '12.5px', borderLeft: '3px solid transparent', background: currentSection === 'recon' ? '#6c5fc7' : 'transparent', color: currentSection === 'recon' ? '#fff' : 'rgba(255,255,255,.8)', fontWeight: currentSection === 'recon' ? '500' : 'normal', borderLeftColor: currentSection === 'recon' ? '#fff' : 'transparent' }}>– Reconciliation of Net Assets</div>
            </div>
          </div>

          {/* Main Panel */}
          <div className="flex-1 flex flex-col" style={{ background: '#f5f5f5' }}>
            {/* Top Tabs */}
            <div className="top-tabs" style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e0e0e0', overflowX: 'auto' }}>
              <button className={`top-tab ${currentTab === 'data' ? 'active' : ''}`} onClick={() => setCurrentTab('data')} style={{ padding: '9px 14px', fontSize: '12px', color: currentTab === 'data' ? '#1a3055' : '#666', cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: `2px solid ${currentTab === 'data' ? '#1a3055' : 'transparent'}`, flexShrink: 0 }}>Data</button>
              <button className={`top-tab ${currentTab === 'wealth' ? 'active' : ''}`} onClick={() => setCurrentTab('wealth')} style={{ padding: '9px 14px', fontSize: '12px', color: currentTab === 'wealth' ? '#1a3055' : '#666', cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: `2px solid ${currentTab === 'wealth' ? '#1a3055' : 'transparent'}`, flexShrink: 0 }}>Wealth Statement</button>
              <button className={`top-tab ${currentTab === 'print' ? 'active' : ''}`} onClick={handlePrint} style={{ marginLeft: 'auto', color: '#1a3055', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 14px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: '2px solid transparent', flexShrink: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Print Statement
              </button>
            </div>

            {/* Content Area */}
            <div className="content-area" style={{ flex: 1, padding: '14px 16px', overflowY: 'auto', background: '#f5f5f5', paddingBottom: '56px' }}>
              {/* Print Header */}
              <div id="print-header" style={{ display: 'none', textAlign: 'center', marginBottom: '18px', borderBottom: '2px solid #1a3055', paddingBottom: '10px' }}>
                <h1 style={{ fontSize: '15px', color: '#1a3055', marginBottom: '3px' }}>116 – Wealth Statement</h1>
                <p style={{ fontSize: '10.5px', color: '#555' }}>Federal Board of Revenue (FBR) – IRIS Portal &nbsp;|&nbsp; Printed: <span id="print-date"></span></p>
              </div>

              {/* Search Bar */}
              <div className="search-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  id="search-inp"
                  placeholder="Search across all sections by Code/Description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '380px', padding: '7px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '12.5px', color: '#222', outline: 'none', background: '#fff' }}
                />
                {searchQuery && <span id="search-hint" style={{ fontSize: '11px', color: '#6c5fc7' }}>Showing results from all sections</span>}
              </div>

              {/* Section Content */}
              <div id="section-expenses" style={{ display: currentSection === 'expenses' ? 'block' : 'none' }}>
                {sectionContent}
              </div>
              <div id="section-assets" style={{ display: currentSection === 'assets' ? 'block' : 'none' }}>
                {sectionContent}
                {/* Asset sub-rows */}
                {ASSETS.filter(a => a.hasPlus).map(a => renderAssetSubRows(a.code))}
              </div>
              <div id="section-recon" style={{ display: currentSection === 'recon' ? 'block' : 'none' }}>
                {sectionContent}
                {/* Gift sub-rows */}
                {renderGiftSubRows('7037')}
                {renderGiftSubRows('7091')}
                {/* Content sub-rows */}
                {renderContentSubRows('7034')}
                {renderContentSubRows('7036')}
              </div>
            </div>

            {/* Unreconciled Bar */}
            <div className={`unreconciled-bar ${isUnreconciledZero ? 'bar-green' : 'bar-red'}`} id="unreconciled-bar" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 20px', fontSize: '13px', fontWeight: 600, letterSpacing: '.2px',
              position: 'sticky', bottom: 0, left: 0, right: 0, zIndex: 999,
              borderTop: `2px solid ${isUnreconciledZero ? '#22c55e' : '#ef4444'}`,
              background: isUnreconciledZero ? '#f0fdf4' : '#fef2f2',
              color: isUnreconciledZero ? '#166534' : '#991b1b',
              flexShrink: 0
            }}>
              <div className="bar-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="bar-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, background: isUnreconciledZero ? '#22c55e' : '#ef4444' }}></span>
                <span>Unreconciled Amount <span style={{ fontWeight: 400, opacity: 0.8 }}> (Must be 0)</span></span>
                <span className="bar-code" style={{ fontSize: '11px', fontWeight: 400, opacity: 0.65, marginLeft: '4px' }}>703000</span>
              </div>
              <span className="bar-amount" style={{ fontSize: '15px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {isUnreconciledZero ? '0' : fmtPKR(unreconciledAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Gift Modal */}
        {giftModal.open && (
          <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/45 backdrop-blur-sm" style={{ animation: 'fadeIn .3s ease forwards' }}>
            <div className="bg-white rounded-2xl w-[420px] max-w-[95vw] shadow-[0_8px_32px_rgba(0,0,0,.22)] overflow-hidden" style={{ animation: 'slideDown .3s ease forwards' }}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <span className="font-semibold text-lg text-[#23233a]">
                  {giftModal.code === '7037' ? 'Gift – Inflow (7037)' : 'Gift – Outflow (7091)'}
                </span>
                <button onClick={closeGiftModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-6 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"><input type="radio" name="gmIdType" value="CNIC/NICOP" checked={giftForm.idType === 'CNIC/NICOP'} onChange={(e) => setGiftForm(prev => ({ ...prev, idType: e.target.value }))} className="w-4 h-4 accent-[#6c5fc7]" /> CNIC/NICOP</label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"><input type="radio" name="gmIdType" value="NTN" checked={giftForm.idType === 'NTN'} onChange={(e) => setGiftForm(prev => ({ ...prev, idType: e.target.value }))} className="w-4 h-4 accent-[#6c5fc7]" /> NTN</label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"><input type="radio" name="gmIdType" value="POC" checked={giftForm.idType === 'POC'} onChange={(e) => setGiftForm(prev => ({ ...prev, idType: e.target.value }))} className="w-4 h-4 accent-[#6c5fc7]" /> POC/Foreigner's Passport</label>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{giftForm.idType === 'CNIC/NICOP' ? 'CNIC/NICOP*' : giftForm.idType === 'NTN' ? 'NTN*' : "POC/Foreigner's Passport No.*"}</label>
                  <input
                    type="text"
                    value={giftForm.idno}
                    onChange={(e) => setGiftForm(prev => ({ ...prev, idno: e.target.value.replace(/[^0-9]/g, '') }))}
                    placeholder={giftForm.idType === 'CNIC/NICOP' ? 'Enter 13-digit CNIC without dashes' : giftForm.idType === 'NTN' ? 'Enter 8-digit NTN without dashes' : 'Passport or POC number'}
                    maxLength={giftForm.idType === 'CNIC/NICOP' ? 13 : giftForm.idType === 'NTN' ? 8 : 20}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#6c5fc7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name*</label>
                  <input type="text" value={giftForm.name} onChange={(e) => setGiftForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Name*" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#6c5fc7] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Description*</label>
                  <textarea value={giftForm.desc} onChange={(e) => setGiftForm(prev => ({ ...prev, desc: e.target.value }))} placeholder="Description*" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#6c5fc7] focus:outline-none" rows={3} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Amount*</label>
                  <input type="text" value={giftForm.amount} onChange={(e) => setGiftForm(prev => ({ ...prev, amount: e.target.value }))} placeholder="Amount*" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#6c5fc7] focus:outline-none" />
                </div>
                {giftError && <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{giftError}</div>}
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                <button onClick={closeGiftModal} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">Cancel</button>
                <button onClick={saveGiftEntry} className="px-4 py-2 bg-[#23233a] text-white rounded-lg hover:bg-[#6c5fc7]">{giftModal.editId ? 'UPDATE' : 'SAVE'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Content Modal */}
        {contentModal.open && (
          <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/45 backdrop-blur-sm" style={{ animation: 'fadeIn .3s ease forwards' }}>
            <div className="bg-white rounded-2xl w-[440px] max-w-[95vw] shadow-[0_8px_32px_rgba(0,0,0,.22)] overflow-hidden" style={{ animation: 'slideDown .3s ease forwards' }}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <span className="font-semibold text-lg text-[#23233a]">
                  {contentModal.editId ? 'Edit' : 'Add'} Content – {contentModal.code === '7034' ? 'Adjustments in Inflows' : 'Inheritance'}
                </span>
                <button onClick={closeContentModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Contents*</label>
                  <textarea value={contentForm.contents} onChange={(e) => setContentForm(prev => ({ ...prev, contents: e.target.value }))} placeholder="Contents*" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#6c5fc7] focus:outline-none" rows={5} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Amount*</label>
                  <input type="text" value={contentForm.amount} onChange={(e) => setContentForm(prev => ({ ...prev, amount: e.target.value }))} placeholder="Amount*" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#6c5fc7] focus:outline-none" />
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                <button onClick={closeContentModal} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">Cancel</button>
                <button onClick={saveContentEntry} className="px-4 py-2 bg-[#23233a] text-white rounded-lg hover:bg-[#6c5fc7]">{contentModal.editId ? 'UPDATE' : 'SUBMIT'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Asset Modal */}
        {assetModal.open && (
          <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/45 backdrop-blur-sm" style={{ animation: 'fadeIn .3s ease forwards' }}>
            <div className="bg-white rounded-2xl w-[440px] max-w-[95vw] shadow-[0_8px_32px_rgba(0,0,0,.22)] overflow-hidden" style={{ animation: 'slideDown .3s ease forwards' }}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <span className="font-semibold text-lg text-[#23233a]">
                  {assetModal.editId ? 'Edit' : 'Add'} – {ASSETS.find(a => a.code === assetModal.code)?.desc || assetModal.code}
                </span>
                <button onClick={closeAssetModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
              </div>
              <div className="p-4 space-y-4">
                {(assetFieldConfigs[assetModal.code || ''] || assetFieldConfigs['default']).map(field => (
                  <div key={field.id} className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea id={field.id} value={assetForm[field.id] || ''} onChange={(e) => setAssetForm(prev => ({ ...prev, [field.id]: e.target.value }))} placeholder={field.placeholder} style={{ minHeight: field.height || '90px' }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#6c5fc7] focus:outline-none" />
                    ) : (
                      <input type="text" id={field.id} value={assetForm[field.id] || ''} onChange={(e) => setAssetForm(prev => ({ ...prev, [field.id]: e.target.value }))} placeholder={field.placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#6c5fc7] focus:outline-none" />
                    )}
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                <button onClick={closeAssetModal} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">Cancel</button>
                <button onClick={saveAssetEntry} className="px-4 py-2 bg-[#23233a] text-white rounded-lg hover:bg-[#6c5fc7]">{assetModal.editId ? 'UPDATE' : 'SAVE'}</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WealthStatementFullModal;