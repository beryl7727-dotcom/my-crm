import React, { useCallback, useRef, useState } from 'react';
import { toast } from '../../utils/toast';

// Maps common CSV column headers to our contact fields
const COLUMN_MAP = {
  name: 'full_name',
  'full name': 'full_name',
  'full_name': 'full_name',
  contact: 'full_name',
  email: 'email',
  'email address': 'email',
  phone: 'phone',
  mobile: 'phone',
  telephone: 'phone',
  tel: 'phone',
  company: 'company_name',
  organization: 'company_name',
  organisation: 'company_name',
  title: 'job_title',
  'job title': 'job_title',
  'job_title': 'job_title',
  position: 'job_title',
  role: 'job_title',
  tags: 'tags',
  labels: 'tags',
  categories: 'tags',
};

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (!lines.length) return { headers: [], rows: [] };

  const parseRow = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(parseRow).filter((row) => row.some((cell) => cell !== ''));
  return { headers, rows };
}

function autoMapColumns(headers) {
  const mapping = {};
  headers.forEach((header, idx) => {
    const key = header.toLowerCase().trim();
    if (COLUMN_MAP[key]) {
      mapping[idx] = COLUMN_MAP[key];
    }
  });
  return mapping;
}

const FIELD_OPTIONS = [
  { value: '', label: '— skip —' },
  { value: 'full_name', label: 'Full Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'company_name', label: 'Company' },
  { value: 'job_title', label: 'Job Title' },
  { value: 'tags', label: 'Tags' },
];

export default function ImportContactsModal({ onClose, onImport }) {
  const fileRef = useRef(null);
  const [step, setStep] = useState('upload'); // upload | map | preview | importing
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [importing, setImporting] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers: h, rows: r } = parseCSV(e.target.result);
      if (!h.length) {
        toast.error('Could not parse CSV — check the file format');
        return;
      }
      setHeaders(h);
      setRows(r);
      setColumnMapping(autoMapColumns(h));
      setStep('map');
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const previewRows = rows.slice(0, 5);

  const buildContactRows = () => {
    return rows.map((row) => {
      const contact = {};
      Object.entries(columnMapping).forEach(([colIdx, field]) => {
        if (field) contact[field] = row[Number(colIdx)] || '';
      });
      return contact;
    });
  };

  const handleImport = async () => {
    const contactRows = buildContactRows().filter((c) => c.full_name || c.email);
    if (!contactRows.length) {
      toast.error('No valid rows to import (need at least a name or email)');
      return;
    }
    setImporting(true);
    try {
      await onImport(contactRows);
      toast.success(`Imported ${contactRows.length} contact${contactRows.length !== 1 ? 's' : ''}`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-semibold">Import Contacts</h2>
            <p className="text-sm text-slate-500">Upload a CSV file to bulk-import contacts.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900">
            ✕
          </button>
        </div>

        {/* Step: upload */}
        {step === 'upload' && (
          <div
            className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center transition hover:border-blue-400 cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
          >
            <p className="text-4xl mb-3">📄</p>
            <p className="text-lg font-semibold text-slate-700">Drop a CSV file here</p>
            <p className="mt-1 text-sm text-slate-500">or click to browse</p>
            <p className="mt-3 text-xs text-slate-400">
              Columns detected automatically: Name, Email, Phone, Company, Title, Tags
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>
        )}

        {/* Step: map columns */}
        {step === 'map' && (
          <div className="flex flex-col gap-4 overflow-y-auto">
            <p className="text-sm text-slate-600">
              {rows.length} rows found. Map each CSV column to a contact field.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {headers.map((header, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-medium text-slate-700 min-w-[100px] truncate">{header}</span>
                  <span className="text-slate-400">→</span>
                  <select
                    value={columnMapping[idx] || ''}
                    onChange={(e) =>
                      setColumnMapping((prev) => ({ ...prev, [idx]: e.target.value }))
                    }
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {FIELD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Preview (first {previewRows.length} rows)
              </p>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">
                          {columnMapping[i] ? (
                            <span className="text-blue-600">
                              {FIELD_OPTIONS.find((o) => o.value === columnMapping[i])?.label || h}
                            </span>
                          ) : (
                            <span className="text-slate-400 line-through">{h}</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className={`px-3 py-2 max-w-[140px] truncate ${
                              columnMapping[ci] ? 'text-slate-800' : 'text-slate-400'
                            }`}
                          >
                            {cell || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {importing ? 'Importing…' : `Import ${rows.length} contacts`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
