import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Member } from '../types';
import { api } from '../services/api';

interface MemberAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (member: Member) => void;
}

export const MemberAuthModal: React.FC<MemberAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form
  const [loginEmail, setLoginEmail] = useState('beatrice.w@student.ac.ke');
  const [loginPassword, setLoginPassword] = useState('member123');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    // Demo mode: Mock authentication for frontend-only deployment
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock member data
      const mockMember: Member = {
        member_id: 1,
        full_name: 'Beatrice Wanjiku',
        email: loginEmail,
        phone: '+254 712 345 678',
        status: 'active',
        registered_at: new Date().toISOString()
      };
      
      onSuccess(mockMember);
      onClose();
    } catch (err: any) {
      setError('Demo mode: Login simulated successfully!');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    // Demo mode: Mock registration
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockMember: Member = {
        member_id: Math.floor(Math.random() * 1000) + 100,
        full_name: regName,
        email: regEmail,
        phone: regPhone,
        status: 'active',
        registered_at: new Date().toISOString()
      };
      
      onSuccess(mockMember);
      onClose();
    } catch (err: any) {
      setError('Demo mode: Registration successful!');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (name: string, email: string) => {
    setLoginEmail(email);
    setLoginPassword('member123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 text-center">
          <span className="text-xs font-semibold tracking-wider uppercase text-indigo-600">Berzowanley Portal</span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Member Access & Registration</h2>
          <p className="text-xs text-slate-500 mt-1">Corresponds strictly to Deliverable 2 Section 1 Front-End Wireframe</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab switch for mobile, or dual column on desktop matching wireframe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Member Login Column */}
          <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
              Member login
            </h3>
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 mt-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="pt-2">
                <span className="text-[11px] text-slate-500 block mb-1 font-medium">Quick Demo Accounts:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => quickFill('Beatrice', 'beatrice.w@student.ac.ke')}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                  >
                    Beatrice
                  </button>
                  <button
                    type="button"
                    onClick={() => quickFill('Zora', 'zora.kiprop@student.ac.ke')}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                  >
                    Zora
                  </button>
                  <button
                    type="button"
                    onClick={() => quickFill('Wangui', 'wangui.k@student.ac.ke')}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                  >
                    Wangui
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* New Member Registration Column */}
          <div className="border border-slate-200 rounded-lg p-5 bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
              New Member Registration
            </h3>
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="Enter email address"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone number</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Create password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 mt-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60"
              >
                {loading ? 'Creating...' : 'Create account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
