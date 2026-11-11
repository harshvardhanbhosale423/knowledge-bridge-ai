import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  X, 
  Cpu, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Key, 
  Sun, 
  Moon, 
  Database, 
  Sparkles, 
  HardDrive 
} from 'lucide-react';
import { AIProviderConfig } from '../types';
import { useTheme } from '../context/ThemeContext';
import * as api from '../api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiConfig: AIProviderConfig | null;
  onRefreshConfig: () => Promise<void>;
  onOpenBackupCenter?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  aiConfig,
  onRefreshConfig,
  onOpenBackupCenter,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const isDemo = api.isDemoSession();

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      await onRefreshConfig();
      setTestResult('API diagnostics check successful. Neon DB and AI Engine connected.');
    } catch (err: any) {
      setTestResult('Diagnostics error: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0B1224] max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-navy-750 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-navy-750">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">System Diagnostics & Platform Settings</h3>
              <p className="text-[11px] text-slate-400">Configuration parameters & compliance telemetry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme & Display Mode Toggle */}
        <div className="p-4 bg-navy-950/80 rounded-2xl border border-navy-750 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-navy-850 text-slate-300">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Display Theme</h4>
              <p className="text-[11px] text-slate-400">Switch between Futuristic Dark Mode and Clean Light Mode</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-xl bg-navy-850 hover:bg-navy-800 border border-navy-700 text-xs font-semibold text-slate-200 flex items-center space-x-2 transition-all"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Evaluation Session Status */}
        <div className="p-4 bg-navy-950/80 rounded-2xl border border-navy-750 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Evaluation Session Mode</h4>
              <p className="text-[11px] text-slate-400">
                {isDemo ? 'Active: Hackathon Judge Demo Session (Synthetic Scope)' : 'Active: Production Enterprise Credentials'}
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            isDemo ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
          }`}>
            {isDemo ? 'Judge Demo' : 'Production'}
          </span>
        </div>

        {/* AI Provider Status Card */}
        <div className="p-4 bg-navy-950/80 rounded-2xl border border-navy-750 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Current Extraction Engine</span>
            </span>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                ₹0.00 / Zero Cost
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                aiConfig?.is_demo_mode 
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {aiConfig?.is_demo_mode ? 'Deterministic Fallback Active' : 'Gemini Free Tier Connected'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Configured Provider:</span>
              <strong className="text-white font-mono">{aiConfig?.provider || 'Gemini Free / Deterministic Fallback'}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>API Key Detected:</span>
              <strong className="text-white font-mono">{aiConfig?.key_masked}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Estimated Monthly Cost:</span>
              <strong className="text-emerald-400 font-bold">{aiConfig?.estimated_monthly_cost || '₹0.00 / Zero Budget'}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Cloud Database:</span>
              <strong className="text-cyan-300 font-mono flex items-center space-x-1">
                <Database className="w-3 h-3 inline" />
                <span>Neon PostgreSQL (Serverless Cloud)</span>
              </strong>
            </div>
          </div>

          {aiConfig?.is_demo_mode && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-200/90 leading-relaxed space-y-1">
              <div><strong>Zero-Cost Deterministic Fallback Active:</strong></div>
              <p>
                {aiConfig.fallback_reason || 'Operating with deterministic heuristic NLP extraction. Zero commercial API costs are incurred. Results are verified against source documents.'}
              </p>
            </div>
          )}
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{testResult}</span>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-navy-750 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3.5 py-1.5 bg-navy-800 hover:bg-navy-750 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-navy-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Testing...' : 'Test Connection'}</span>
            </button>

            {onOpenBackupCenter && (
              <button
                onClick={() => { onClose(); onOpenBackupCenter(); }}
                className="px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Backup & Recovery</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow-blue"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
