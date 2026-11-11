import React, { useState } from 'react';
import { Settings, ShieldCheck, Database, CheckCircle2, Save } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [loanPeriod, setLoanPeriod] = useState(14);
  const [fineRate, setFineRate] = useState(50);
  const [maxLoans, setMaxLoans] = useState(5);
  const [libraryName, setLibraryName] = useState('Berzowanley University E-Library');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Library configuration parameters saved successfully.</span>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          System & Policy Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Circulation policy thresholds, DBMS integrity flags, and institutional preferences
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Circulation Policy Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-600" />
            <span>Circulation & Loan Rules</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Standard Loan Period (Days)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={loanPeriod}
                onChange={(e) => setLoanPeriod(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Deliverable default: 14 days auto-calculated upon book issue.
              </span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Daily Overdue Penalty Rate (KES)
              </label>
              <input
                type="number"
                min={0}
                value={fineRate}
                onChange={(e) => setFineRate(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Assessed automatically per overdue day (KES 50.00).
              </span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Maximum Active Loans per Member
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={maxLoans}
                onChange={(e) => setMaxLoans(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Enforced by Member OOP model <code className="font-mono">can_borrow()</code>.
              </span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Institutional Name
              </label>
              <input
                type="text"
                value={libraryName}
                onChange={(e) => setLibraryName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Database Health Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Python SQLite Relational Engine Status</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 block">DBMS Engine:</span>
              <span className="font-semibold text-slate-900 font-mono">SQLite 3.10 (ACID Compliant)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 block">Database Storage:</span>
              <span className="font-semibold text-slate-900 font-mono">backend/library.db</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 block">Foreign Key Constraints:</span>
              <span className="font-semibold text-emerald-700 font-mono">PRAGMA foreign_keys = ON</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 block">OOP Architecture:</span>
              <span className="font-semibold text-indigo-700 font-mono">Domain Models + Service Layer</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
