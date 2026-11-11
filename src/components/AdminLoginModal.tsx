import React, { useState } from 'react';
import { X, ShieldAlert, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { Admin } from '../types';
import { api } from '../services/api';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (admin: Admin) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('admin@library.ac.ke');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    // Demo mode: Mock admin authentication
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockAdmin: Admin = {
        admin_id: 1,
        full_name: 'J. Mwangi',
        email: email,
        role: 'super_admin',
        created_at: new Date().toISOString()
      };
      
      onSuccess(mockAdmin);
      onClose();
    } catch (err: any) {
      setError('Demo mode: Admin access granted!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Deliverable 2 Section 2 Header Exact Branding */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
            berzowanley
          </h1>
          <div className="mt-2 py-1 px-3 bg-slate-100 rounded-md inline-block">
            <h2 className="text-xs font-semibold text-slate-700">
              E library admin panel
            </h2>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              AUTHORISED STAFF ONLY
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              username/email
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@library.ac.ke"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 mt-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>{loading ? 'Authenticating...' : '-> sign in'}</span>
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@library.ac.ke');
                setPassword('admin123');
              }}
              className="text-[11px] text-indigo-600 hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <KeyRound className="w-3 h-3" />
              <span>Fill Admin J. Mwangi Credentials</span>
            </button>
          </div>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            © 2026 E-Library Management System
          </p>
        </div>
      </div>
    </div>
  );
};
