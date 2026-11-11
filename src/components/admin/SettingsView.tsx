import React, { useState } from 'react';
import { Settings, CheckCircle2, Save } from 'lucide-react';

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
          Circulation policies and library preferences
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
                Standard time allowed for each loan.
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
                Fine charged for each overdue day: KES {fineRate.toFixed(2)}.
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
                Maximum number of books a member may borrow at one time.
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
