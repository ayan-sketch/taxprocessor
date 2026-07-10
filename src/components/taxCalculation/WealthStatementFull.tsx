import React, { useMemo } from 'react';
import legacyHtml from '../../../income tax return (114 )/index.html?raw';

const WealthStatementFull: React.FC = () => {
  const srcDoc = useMemo(() => {
    const html = typeof legacyHtml === 'string' ? legacyHtml : '';

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; background: #f5f5f5; }
      body { font-family: 'Segoe UI', sans-serif; }
    </style>
  </head>
  <body>${html}</body>
</html>`;
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <iframe
        title="116 Wealth Statement"
        srcDoc={srcDoc}
        className="min-h-[1300px] w-full border-0 bg-white"
      />
    </div>
  );
};

export default WealthStatementFull;
