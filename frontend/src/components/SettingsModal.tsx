import React, { useState } from 'react';
import { Settings as SettingsIcon, X, Cpu, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw, Key } from 'lucide-react';
import { AIProviderConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiConfig: AIProviderConfig | null;
  onRefreshConfig: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  aiConfig,
  onRefreshConfig,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      await onRefreshConfig();
      setTestResult('API diagnostics check successful. Connection active.');
    } catch (err: any) {
      setTestResult('Diagnostics error: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card max-w-xl w-full p-6 sm:p-8 rounded-2xl border border-navy-700 shadow-card space-y-6 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-navy-750">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">System Diagnostics & AI Engine</h3>
              <p className="text-[11px] text-slate-400">Configuration parameters & compliance settings</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Provider Status Card */}
        <div className="p-4 bg-navy-950/80 rounded-xl border border-navy-750 space-y-3">
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
                {aiConfig?.is_demo_mode ? 'Zero-Cost Fallback Active' : 'Gemini Free Tier Connected'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Configured Provider:</span>
              <strong className="text-white font-mono">{aiConfig?.provider || 'Detecting...'}</strong>
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
              <span>Configured Model:</span>
              <strong className="text-white font-mono">{aiConfig?.model_id || 'gemini-3.8-flash'}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Quota Policy:</span>
              <span className="text-slate-200 font-mono">Dynamic API Quota (Zero Billing)</span>
            </div>
            {aiConfig?.quota_status && (
              <div className="flex items-center justify-between text-slate-400">
                <span>API Quota Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy-800 text-cyan-300 border border-navy-700 font-mono">
                  {aiConfig.quota_status}
                </span>
              </div>
            )}
            {aiConfig?.live_ai_status && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Live AI Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${
                  aiConfig.live_ai_status === 'TESTED_ACTIVE' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                }`}>
                  {aiConfig.live_ai_status === 'NOT_TESTED' ? 'Not Tested (No Key)' : aiConfig.live_ai_status}
                </span>
              </div>
            )}
          </div>

          {aiConfig?.is_demo_mode && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-200/90 leading-relaxed space-y-1">
              <div><strong>Zero-Cost Deterministic Fallback Mode:</strong></div>
              <p>
                {aiConfig.fallback_reason || 'Operating with deterministic heuristic NLP extraction. Zero commercial API costs are incurred. Results are verified against source documents.'}
              </p>
            </div>
          )}
        </div>

        {/* Free Tier Configuration Guide */}
        <div className="space-y-2 text-xs text-slate-300">
          <h4 className="font-bold text-white flex items-center space-x-1.5">
            <Key className="w-4 h-4 text-blue-400" />
            <span>Zero-Budget AI: Google Gemini Free Tier</span>
          </h4>
          <p className="text-[11px] text-slate-400">
            Get a 100% Free Gemini API key via <strong>Google AI Studio</strong> (requires NO credit card, NO billing, and NO subscription):
          </p>
          <div className="p-3 bg-navy-950 rounded-lg border border-navy-750 font-mono text-[11px] text-blue-300 space-y-1">
            <div># 1. Obtain free key at: https://aistudio.google.com/app/apikey</div>
            <div>export GEMINI_API_KEY="AIzaSy..."  # Model: gemini-3.8-flash (Free Tier)</div>
            <div className="text-slate-400 text-[10px]"># Dynamic quota handling: If free quota is exhausted (HTTP 429), system gracefully falls back to ₹0 offline mode.</div>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{testResult}</span>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-navy-750 flex items-center justify-between">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-3.5 py-1.5 bg-navy-800 hover:bg-navy-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-navy-600 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

