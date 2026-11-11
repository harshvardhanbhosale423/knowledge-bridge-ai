import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileCheck, 
  RefreshCw, 
  Clock, 
  Layers, 
  HardDrive, 
  Info, 
  Lock,
  ArrowRight,
  FileText
} from 'lucide-react';
import { BackupRecord, BackupValidationResult, BackupRestoreResult } from '../types';
import * as api from '../api';

interface BackupRestoreCenterProps {
  onRefreshData?: () => void;
  onShowToast: (text: string, type?: 'success' | 'error') => void;
}

export const BackupRestoreCenter: React.FC<BackupRestoreCenterProps> = ({
  onRefreshData,
  onShowToast
}) => {
  const [history, setHistory] = useState<BackupRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [parsedBackupData, setParsedBackupData] = useState<any | null>(null);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const records = await api.fetchBackupHistory();
      setHistory(records);
    } catch (err: any) {
      console.error('Failed to load backup history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Handle Export Backup
  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const blob = await api.exportBackup();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge_bridge_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onShowToast('Database backup archive exported and downloaded successfully.');
      loadHistory();
    } catch (err: any) {
      onShowToast(err.message || 'Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle File Selection for Validation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setValidationResult(null);
    setParsedBackupData(null);

    try {
      setIsValidating(true);
      // Validate with server
      const res = await api.validateBackup(file);
      setValidationResult(res);

      // Parse JSON client-side to prepare for restore payload if valid
      const text = await file.text();
      const parsed = JSON.parse(text);
      setParsedBackupData(parsed);

      if (res.valid) {
        onShowToast('Backup file verified: Schema and SHA-256 checksum matched.');
      } else {
        onShowToast('Backup validation warning: Verify integrity report below.', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to parse or validate backup file', 'error');
      setValidationResult({
        valid: false,
        errors: [err.message || 'Failed to parse backup archive JSON']
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Handle Restore Execution
  const handleExecuteRestore = async () => {
    if (!parsedBackupData) return;
    try {
      setIsRestoring(true);
      const result = await api.restoreBackup(parsedBackupData, true);
      setRestoreConfirmOpen(false);
      onShowToast(`Restore successful: ${result.message}`);
      loadHistory();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      onShowToast(err.message || 'Transactional restore failed. Changes rolled back.', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Storage Architecture Disclosure */}
      <div className="bg-navy-900/80 border border-navy-750/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl shadow-glow-blue">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Backup & Disaster Recovery Center</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Atomic JSON Backups • SHA-256 Integrity Manifest • Automated Rollback Snapshots
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadHistory}
              disabled={loadingHistory}
              className="p-2.5 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-300 border border-navy-700 text-xs transition-colors flex items-center space-x-1.5"
              title="Refresh backup history"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleExportBackup}
              disabled={isExporting}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-glow-blue flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating Archive...' : 'Export Complete Backup (JSON)'}</span>
            </button>
          </div>
        </div>

        {/* Honest Architecture Disclosure Notice */}
        <div className="mt-6 p-4 bg-navy-850/70 border border-navy-700/60 rounded-xl flex items-start space-x-3">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed space-y-1">
            <p className="font-semibold text-white">
              Storage Architecture & Disaster Recovery Guarantee
            </p>
            <p className="text-slate-400">
              Knowledge Bridge AI runs on serverless compute where local disk (<code className="text-cyan-300 font-mono">/tmp</code>) is ephemeral across cold starts. All relational records, knowledge items, verification logs, and extracted document texts are permanently persisted in <strong>Neon PostgreSQL Cloud Database</strong>.
            </p>
            <p className="text-slate-400">
              Exporting a backup compiles all projects, extracted documents, verified knowledge, handovers, and audit trails into a self-contained, tamper-evident JSON archive with an embedded SHA-256 checksum.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Section: Export Summary & Validation / Restore */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Backup Validation & Restore Pipeline */}
        <div className="bg-navy-900/80 border border-navy-750/90 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Validate & Restore Backup Archive</h3>
                <p className="text-xs text-slate-400">Verify archive checksum & structure before transactional commit</p>
              </div>
            </div>

            {/* Upload Zone */}
            <div className="mt-4 border-2 border-dashed border-navy-700 hover:border-blue-500/50 rounded-2xl p-6 text-center transition-colors bg-navy-950/40">
              <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-200">
                Select a previously exported Knowledge Bridge AI backup file (.json)
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                The file will be analyzed for SHA-256 integrity and relational schema consistency
              </p>

              <label className="mt-4 inline-block px-4 py-2 bg-navy-800 hover:bg-navy-750 text-blue-400 border border-navy-700 hover:border-blue-500/40 rounded-xl text-xs font-bold cursor-pointer transition-all">
                <span>Browse JSON File</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {selectedFile && (
                <div className="mt-3 text-xs text-slate-300 font-mono">
                  Selected: <span className="text-white font-semibold">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {/* Validation Feedback */}
            {isValidating && (
              <div className="mt-4 p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center space-x-2 text-xs text-blue-300">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying archive integrity and SHA-256 signature...</span>
              </div>
            )}

            {validationResult && (
              <div className={`mt-4 p-4 rounded-xl border ${validationResult.valid ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-rose-950/30 border-rose-500/30'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {validationResult.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span className={`text-xs font-bold ${validationResult.valid ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {validationResult.valid ? 'Archive Integrity Verified' : 'Validation Issues Detected'}
                  </span>
                </div>

                {validationResult.valid ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 mt-2 font-mono">
                    <div className="bg-navy-900/80 p-2 rounded-lg border border-navy-800">
                      <span className="text-slate-500 block">Projects</span>
                      <span className="text-white font-bold">{validationResult.project_count || 0}</span>
                    </div>
                    <div className="bg-navy-900/80 p-2 rounded-lg border border-navy-800">
                      <span className="text-slate-500 block">Documents</span>
                      <span className="text-white font-bold">{validationResult.document_count || 0}</span>
                    </div>
                    <div className="bg-navy-900/80 p-2 rounded-lg border border-navy-800">
                      <span className="text-slate-500 block">Knowledge Items</span>
                      <span className="text-white font-bold">{validationResult.knowledge_item_count || 0}</span>
                    </div>
                    <div className="bg-navy-900/80 p-2 rounded-lg border border-navy-800">
                      <span className="text-slate-500 block">Handover Reports</span>
                      <span className="text-white font-bold">{validationResult.handover_report_count || 0}</span>
                    </div>
                    <div className="bg-navy-900/80 p-2 rounded-lg border border-navy-800 col-span-2">
                      <span className="text-slate-500 block">SHA-256 Checksum</span>
                      <span className="text-emerald-400 truncate block text-[10px]">{validationResult.computed_sha256}</span>
                    </div>
                  </div>
                ) : (
                  <ul className="list-disc list-inside text-xs text-rose-300 space-y-1">
                    {validationResult.errors?.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Restore Action Button */}
          {validationResult?.valid && (
            <div className="mt-6 pt-4 border-t border-navy-800 flex justify-end">
              <button
                onClick={() => setRestoreConfirmOpen(true)}
                disabled={isRestoring}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-card flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                <HardDrive className="w-4 h-4" />
                <span>Initiate Safe Restore Pipeline</span>
              </button>
            </div>
          )}
        </div>

        {/* Card 2: Safe Transactional Restore Protocol Explanation */}
        <div className="bg-navy-900/80 border border-navy-750/90 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Zero-Data-Loss Restore Protocol</h3>
                <p className="text-xs text-slate-400">Guaranteed rollback and automatic pre-restore snapshots</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="p-3 bg-navy-850/60 rounded-xl border border-navy-800 flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <h4 className="font-semibold text-white">Automated Pre-Restore Snapshot</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Before altering any table, the backend automatically generates an emergency pre-restore snapshot (<code className="text-cyan-300">pre_restore_snapshot</code>) saved into backup history.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-navy-850/60 rounded-xl border border-navy-800 flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <h4 className="font-semibold text-white">Single Atomic SQL Transaction</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    All entities (Projects, Documents with raw extracted text, Knowledge Items with evidence links, and Handover Reports) are restored inside one atomic database transaction.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-navy-850/60 rounded-xl border border-navy-800 flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <h4 className="font-semibold text-white">Instant Safe Rollback</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    If any constraint, invalid foreign key, or corrupted payload is detected during restoration, the entire database transaction rolls back instantly. Zero corrupted records will remain.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-navy-950/70 border border-navy-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Role Required</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-400">Neon PostgreSQL Cloud</span>
          </div>
        </div>
      </div>

      {/* Backup History Table */}
      <div className="bg-navy-900/80 border border-navy-750/90 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Backup & Snapshot Audit History</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {history.length} Record{history.length === 1 ? '' : 's'}
          </span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No backup archives exported yet. Click "Export Complete Backup (JSON)" above to create your first archive.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-navy-750 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Filename / Identifier</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">SHA-256 Checksum</th>
                  <th className="py-3 px-3">Created By</th>
                  <th className="py-3 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-navy-850/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-white flex items-center space-x-2">
                      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate max-w-[200px]" title={rec.filename}>{rec.filename}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        rec.backup_type === 'pre_restore_snapshot'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                      }`}>
                        {rec.backup_type === 'pre_restore_snapshot' ? 'Pre-Restore Snapshot' : 'Manual Export'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-mono">
                      {(rec.file_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400 text-[10px]">
                      <span className="truncate max-w-[150px] block" title={rec.sha256_checksum}>
                        {rec.sha256_checksum.slice(0, 16)}...
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {rec.created_by}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(rec.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Restore */}
      {restoreConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1224] border border-amber-500/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Confirm Transactional Restore</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to restore database state from the selected backup archive (<code className="text-white font-mono">{selectedFile?.name}</code>).
            </p>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 leading-relaxed">
              <strong className="block mb-1">Safety Guarantee:</strong>
              An automatic pre-restore snapshot backup of your current database will be saved immediately prior to applying changes. If any constraint fails, all modifications will be rolled back.
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRestoreConfirmOpen(false)}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-card flex items-center space-x-2 disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Restore...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Execute Restore</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
