import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, CheckCircle2, AlertCircle, Clock, BookOpen, AlertTriangle } from 'lucide-react';
import { Borrowing } from '../types';
import { api } from '../services/api';

export const IssueReturnDesk: React.FC = () => {
  const [activeLoans, setActiveLoans] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Issue Book State matching Section 3.6 Left Box
  const [issueMemberId, setIssueMemberId] = useState('M0012');
  const [issueBookId, setIssueBookId] = useState('978-0-00-00000');
  const [issuing, setIssuing] = useState(false);

  // Return Book State matching Section 3.6 Right Box
  const [returnBookId, setReturnBookId] = useState('');
  const [returnCondition, setReturnCondition] = useState('Good');
  const [damageFee, setDamageFee] = useState<number>(0);
  const [returning, setReturning] = useState(false);

  const loadLoans = async () => {
    setLoading(true);
    try {
      const loans = await api.getActiveLoans();
      setActiveLoans(loans);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const notify = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIssuing(true);
    try {
      const res = await api.issueBook(issueMemberId, issueBookId);
      notify(`Successfully issued "${res.book_title}" to ${res.member_name}. Due: ${res.due_date}`);
      setIssueMemberId('');
      setIssueBookId('');
      loadLoans();
    } catch (err: any) {
      setError(err.message || 'Issuance failed');
    } finally {
      setIssuing(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnBookId) {
      setError('Please provide a Book ISBN or ID to return.');
      return;
    }
    setError(null);
    setReturning(true);
    try {
      const res = await api.returnBook(returnBookId, returnCondition, damageFee);
      let fineNotice = '';
      if (res.fine_amount > 0) {
        fineNotice = ` (Assessed Fine: KES ${res.fine_amount.toFixed(2)})`;
      }
      notify(`Book "${res.book_title}" successfully returned by ${res.member_name}!${fineNotice}`);
      setReturnBookId('');
      setDamageFee(0);
      loadLoans();
    } catch (err: any) {
      setError(err.message || 'Return failed');
    } finally {
      setReturning(false);
    }
  };

  const handleQuickReturn = (loan: Borrowing) => {
    setReturnBookId(loan.book_isbn || String(loan.book_id));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Issue / Return Books
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Deliverable 2 Section 3.6 · Real-Time Circulation Management & Fine Assessment
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Two-Column Cards strictly matching Deliverable 2 Section 3.6 Wireframe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Box: Issue a Book */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Issue a Book</span>
          </h2>

          <form onSubmit={handleIssueSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Member ID / Email
              </label>
              <input
                type="text"
                required
                placeholder="e.g. M0012 or beatrice.w@student.ac.ke"
                value={issueMemberId}
                onChange={(e) => setIssueMemberId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Book ISBN / Copy ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 978-0-00-00000 or 1"
                value={issueBookId}
                onChange={(e) => setIssueBookId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono"
              />
            </div>

            <div className="py-2 px-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
              <span className="text-slate-500">Due date:</span>
              <span className="font-semibold text-slate-800">14 days from today (auto)</span>
            </div>

            <button
              type="submit"
              disabled={issuing}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-60"
            >
              {issuing ? 'Processing Issue...' : 'Issue Book'}
            </button>
          </form>
        </div>

        {/* Right Box: Return a Book */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
            <span>Return a Book</span>
          </h2>

          <form onSubmit={handleReturnSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Book ISBN / Copy ID
              </label>
              <input
                type="text"
                required
                placeholder="Scan or enter code"
                value={returnBookId}
                onChange={(e) => setReturnBookId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Condition
              </label>
              <select
                value={returnCondition}
                onChange={(e) => {
                  setReturnCondition(e.target.value);
                  if (e.target.value === 'Damaged') setDamageFee(500);
                  else if (e.target.value === 'Minor Wear') setDamageFee(100);
                  else setDamageFee(0);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Good">Good v</option>
                <option value="Minor Wear">Minor Wear (KES 100 fee)</option>
                <option value="Damaged">Damaged (KES 500 fee)</option>
                <option value="Lost">Lost Item Replacement</option>
              </select>
            </div>

            <div className="py-2 px-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
              <span className="text-slate-500">Fine (if overdue / condition):</span>
              <span className="font-bold font-mono text-slate-900">
                KES {damageFee.toFixed(2)}
              </span>
            </div>

            <button
              type="submit"
              disabled={returning}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs disabled:opacity-60"
            >
              {returning ? 'Processing Return...' : 'Return Book'}
            </button>
          </form>
        </div>
      </div>

      {/* Currently Issued Books Table matching Section 3.6 wireframe */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Currently Issued Books
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {activeLoans.length} active loans in circulation
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Member</th>
                <th className="py-3 px-5">Book Title</th>
                <th className="py-3 px-5 font-mono">Issued</th>
                <th className="py-3 px-5 font-mono">Due</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Loading active loans...
                  </td>
                </tr>
              ) : activeLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No active book borrowings recorded right now.
                  </td>
                </tr>
              ) : (
                activeLoans.map((loan) => {
                  const isOverdue = loan.status === 'overdue' || loan.is_overdue;

                  return (
                    <tr key={loan.borrowing_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5 font-semibold text-slate-800">
                        {loan.member_name}
                      </td>
                      <td className="py-3 px-5 text-slate-700 max-w-xs truncate font-medium">
                        {loan.book_title}
                      </td>
                      <td className="py-3 px-5 font-mono text-slate-500">
                        {loan.issue_date}
                      </td>
                      <td className="py-3 px-5 font-mono text-slate-500">
                        {loan.due_date}
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            isOverdue
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {isOverdue ? 'Overdue' : 'On loan'}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => handleQuickReturn(loan)}
                          className="px-3 py-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors shadow-2xs whitespace-nowrap"
                        >
                          Mark Return
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
