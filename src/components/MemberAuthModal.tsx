import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Member } from '../types';
import { api } from '../services/api';
import { isDemoMode } from '../services/supabaseClient';

interface MemberAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (member: Member) => void;
  isPasswordRecovery: boolean;
  onPasswordResetComplete: () => void;
}

export const MemberAuthModal: React.FC<MemberAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isPasswordRecovery,
  onPasswordResetComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form
  const [loginEmail, setLoginEmail] = useState(isDemoMode ? 'beatrice.w@student.ac.ke' : '');
  const [loginPassword, setLoginPassword] = useState(isDemoMode ? 'member123' : '');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    setResetMode(isPasswordRecovery);
  }, [isPasswordRecovery]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      const member = await api.loginMember(loginEmail, loginPassword);
      onSuccess(member);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      const member = await api.registerMember({
        full_name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      });
      if (member) {
        onSuccess(member);
        onClose();
      } else {
        setSuccess('Check your email for a confirmation link, then return here to sign in.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError(null);
    setSuccess(null);
    if (!loginEmail.trim()) {
      setError('Enter your email address first.');
      return;
    }
    setLoading(true);
    try {
      await api.sendPasswordReset(loginEmail.trim());
      setSuccess('If an account exists for that email, a password reset link will be sent.');
    } catch (err: any) {
      setError(err.message || 'Could not send the password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.updatePassword(newPassword);
      setResetMode(false);
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Your password has been updated. Sign in with your new password.');
      onPasswordResetComplete();
    } catch (err: any) {
      setError(err.message || 'Could not update your password.');
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
          <h2 className="text-xl font-bold text-slate-900 mt-1">{resetMode ? 'Choose a new password' : 'Member Access & Registration'}</h2>
          <p className="text-xs text-slate-500 mt-1">Corresponds strictly to Deliverable 2 Section 1 Front-End Wireframe</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800" role="status">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {resetMode ? (
          <form onSubmit={handleUpdatePassword} className="mx-auto max-w-sm space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">New password</label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Confirm new password</label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60">
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        ) : (
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

              {!isDemoMode && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handlePasswordReset}
                  className="text-[11px] font-medium text-indigo-600 hover:underline disabled:opacity-60"
                >
                  Forgot password?
                </button>
              )}

              {isDemoMode && <div className="pt-2">
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
              </div>}
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
                  minLength={8}
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
        )}
      </div>
    </div>
  );
};
