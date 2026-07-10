import React, { useState } from 'react';

export default function EmailModal({ isOpen, onClose, returns = [], selectedReturns = [] }) {
  const [emailMode, setEmailMode] = useState('single'); // 'single' or 'bulk'
  const [emailConfig, setEmailConfig] = useState({
    service: 'gmail',
    email: '',
    password: '',
    configured: false
  });
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [bulkEmailData, setBulkEmailData] = useState({
    subject: '',
    body: ''
  });
  const [sending, setSending] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleConfigureEmail = async () => {
    setConfiguring(true);
    setResult(null);

    try {
      const response = await fetch('/api/email/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: emailConfig.service,
          email: emailConfig.email,
          password: emailConfig.password
        })
      });

      const data = await response.json();

      if (data.success) {
        setEmailConfig(prev => ({ ...prev, configured: true }));
        setResult({ type: 'success', message: 'Email configured successfully!' });
      } else {
        setResult({ type: 'error', message: data.error || 'Configuration failed' });
      }
    } catch (error) {
      setResult({ type: 'error', message: 'Failed to connect to email service: ' + error.message });
    } finally {
      setConfiguring(false);
    }
  };

  const handleTestEmail = async () => {
    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emailConfig.email })
      });

      const data = await response.json();

      if (data.success) {
        setResult({ type: 'success', message: 'Test email sent successfully!' });
      } else {
        setResult({ type: 'error', message: data.error || 'Test email failed' });
      }
    } catch (error) {
      setResult({ type: 'error', message: 'Failed to send test email: ' + error.message });
    } finally {
      setSending(false);
    }
  };

  const handleSendSingleEmail = async () => {
    if (!emailData.to || !emailData.subject || !emailData.body) {
      setResult({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      const data = await response.json();

      if (data.success) {
        setResult({ type: 'success', message: 'Email sent successfully!' });
        setEmailData({ to: '', subject: '', body: '' });
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to send email' });
      }
    } catch (error) {
      setResult({ type: 'error', message: 'Failed to send email: ' + error.message });
    } finally {
      setSending(false);
    }
  };

  const handleSendBulkEmail = async () => {
    if (!bulkEmailData.subject || !bulkEmailData.body) {
      setResult({ type: 'error', message: 'Please fill in subject and body' });
      return;
    }

    const recipients = selectedReturns
      .filter(ret => ret.email)
      .map(ret => ({
        email: ret.email,
        name: ret.name,
        cnicNtn: ret.cnicNtn,
        taxYear: ret.taxYear
      }));

    if (recipients.length === 0) {
      setResult({ type: 'error', message: 'No recipients with email addresses found' });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/email/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          subject: bulkEmailData.subject,
          body: bulkEmailData.body
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult({ 
          type: 'success', 
          message: `Bulk email sent! ${data.totalSent} sent, ${data.totalFailed} failed` 
        });
        setBulkEmailData({ subject: '', body: '' });
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to send bulk email' });
      }
    } catch (error) {
      setResult({ type: 'error', message: 'Failed to send bulk email: ' + error.message });
    } finally {
      setSending(false);
    }
  };

  const handleSendReminders = async () => {
    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/email/send-automated-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returns: returns,
          daysThreshold: 7
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult({ 
          type: 'success', 
          message: `Reminders sent! ${data.totalSent} sent, ${data.totalFailed} failed` 
        });
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to send reminders' });
      }
    } catch (error) {
      setResult({ type: 'error', message: 'Failed to send reminders: ' + error.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Email Management</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Result Message */}
          {result && (
            <div className={`p-4 rounded-lg ${
              result.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {result.message}
            </div>
          )}

          {/* Email Configuration */}
          {!emailConfig.configured && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-3">Configure Email Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Service
                  </label>
                  <select
                    value={emailConfig.service}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, service: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="gmail">Gmail</option>
                    <option value="outlook">Outlook</option>
                    <option value="yahoo">Yahoo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={emailConfig.email}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your.email@gmail.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    App Password
                  </label>
                  <input
                    type="password"
                    value={emailConfig.password}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="App-specific password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For Gmail, use an App Password (not your regular password). 
                    <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                      Learn how
                    </a>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfigureEmail}
                    disabled={configuring || !emailConfig.email || !emailConfig.password}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {configuring ? 'Configuring...' : 'Configure Email'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Email Actions (only show when configured) */}
          {emailConfig.configured && (
            <>
              {/* Mode Selector */}
              <div className="flex gap-2 border-b pb-4">
                <button
                  onClick={() => setEmailMode('single')}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    emailMode === 'single'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Single Email
                </button>
                <button
                  onClick={() => setEmailMode('bulk')}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    emailMode === 'bulk'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Bulk Email ({selectedReturns.filter(r => r.email).length})
                </button>
                <button
                  onClick={() => setEmailMode('reminders')}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    emailMode === 'reminders'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Auto Reminders
                </button>
              </div>

              {/* Single Email */}
              {emailMode === 'single' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To
                    </label>
                    <input
                      type="email"
                      value={emailData.to}
                      onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                      placeholder="recipient@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={emailData.subject}
                      onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Email subject"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={emailData.body}
                      onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="Email message (HTML supported)"
                      rows={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleSendSingleEmail}
                    disabled={sending}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              )}

              {/* Bulk Email */}
              {emailMode === 'bulk' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Recipients:</strong> {selectedReturns.filter(r => r.email).length} clients with email addresses
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Use placeholders: {'{name}'}, {'{cnicNtn}'}, {'{taxYear}'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={bulkEmailData.subject}
                      onChange={(e) => setBulkEmailData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Email subject"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Template
                    </label>
                    <textarea
                      value={bulkEmailData.body}
                      onChange={(e) => setBulkEmailData(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="Dear {name}, your tax return for {taxYear}..."
                      rows={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleSendBulkEmail}
                    disabled={sending || selectedReturns.filter(r => r.email).length === 0}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Sending...' : `Send to ${selectedReturns.filter(r => r.email).length} Recipients`}
                  </button>
                </div>
              )}

              {/* Auto Reminders */}
              {emailMode === 'reminders' && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h4 className="font-bold text-yellow-900 mb-2">Automated Deadline Reminders</h4>
                    <p className="text-sm text-yellow-800">
                      This will automatically send reminder emails to all clients with deadlines in the next 7 days.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-2">What will be sent:</h5>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Personalized reminder with client name</li>
                      <li>Tax year and deadline date</li>
                      <li>Days remaining until deadline</li>
                      <li>Urgent warning for deadlines within 3 days</li>
                    </ul>
                  </div>
                  <button
                    onClick={handleSendReminders}
                    disabled={sending}
                    className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Sending Reminders...' : 'Send Automated Reminders'}
                  </button>
                </div>
              )}

              {/* Test Email Button */}
              <div className="border-t pt-4">
                <button
                  onClick={handleTestEmail}
                  disabled={sending}
                  className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send Test Email'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
