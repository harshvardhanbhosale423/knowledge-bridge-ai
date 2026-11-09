import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, Key } from 'lucide-react';
import { UserRole } from '../types';
import * as api from '../api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: UserRole, userName: string) => void;
  defaultRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultRole = 'admin',
}) => {
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [credential, setCredential] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential.trim()) {
      setError('Please provide your secure access credential.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.authenticateSession(role, credential.trim());
      onSuccess(role, res.user_name);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credential.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0B1224] border border-navy-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-850 to-navy-900 p-6 border-b border-navy-750">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${role === 'admin' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'}`}>
              {role === 'admin' ? <ShieldCheck className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Enterprise Authentication</h2>
              <p className="text-xs text-slate-400">Zero-Trust Role-Based Session Sign-In</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Role Selection Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Session Role
            </label>
            <div className="grid grid-cols-2 gap-2 bg-navy-900/80 p-1.5 rounded-xl border border-navy-750">
              <button
                type="button"
                onClick={() => { setRole('admin'); setError(null); }}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  role === 'admin'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Administrator</span>
              </button>
              <button
                type="button"
                onClick={() => { setRole('team_member'); setError(null); }}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  role === 'team_member'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Team Member</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {role === 'admin'
                ? 'Full administrative control: upload documents, run AI extraction, review items, and certify handover packages.'
                : 'Audited member privileges: read-only access to approved handover records and project workspace documentation.'}
            </p>
          </div>

          {/* Credential Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {role === 'admin' ? 'Admin Access Token' : 'Team Member Access Token'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="Enter access token or secret credential"
                className="w-full pl-10 pr-10 py-2.5 bg-navy-900 border border-navy-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Security Note */}
          <div className="p-3 bg-navy-850/60 border border-navy-750 rounded-xl text-[11px] text-slate-400 leading-relaxed flex items-start space-x-2">
            <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <span>
              Signed, time-limited HMAC-SHA256 session tokens expire after 8 hours. Credentials are encrypted in transit and verified server-side.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-navy-800 hover:bg-navy-750 border border-navy-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-lg transition-all flex items-center space-x-2 ${
                role === 'admin'
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Authenticate & Sign In</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
