import React, { useState } from 'react';
import { 
  FileCheck, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Download, 
  Copy, 
  Printer, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  X,
  FileText,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Project, HandoverReport, KnowledgeItem } from '../types';
import * as api from '../api';

interface HandoverGeneratorProps {
  project: Project;
  handover: HandoverReport | null;
  items: KnowledgeItem[];
  onGenerate: (title?: string, summary?: string) => Promise<void>;
  onApprove: (approvedBy: string, signatureNotes?: string) => Promise<void>;
  isGenerating: boolean;
}

export const HandoverGenerator: React.FC<HandoverGeneratorProps> = ({
  project,
  handover,
  items,
  onGenerate,
  onApprove,
  isGenerating,
}) => {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approverName, setApproverName] = useState('Alex Chen (Lead Architect)');
  const [signatureNotes, setSignatureNotes] = useState('All decisions, operational dependencies, and 30-day next actions have been verified and confirmed.');
  const [isApproving, setIsApproving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const blob = await api.downloadPdfReport(project.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.code}_OFFICIAL_HANDOVER_REPORT.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const approvedItems = items.filter(i => i.status === 'approved');
  const pendingItems = items.filter(i => i.status === 'pending_review');
  const criticalRisks = items.filter(i => i.category === 'risk_blocker' && i.priority === 'critical');

  const handleCopyMarkdown = () => {
    if (!handover) return;
    navigator.clipboard.writeText(handover.markdown_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmApproval = async () => {
    if (!approverName.trim()) return;
    try {
      setIsApproving(true);
      await onApprove(approverName, signatureNotes);
      setShowApprovalModal(false);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Handover Readiness Status Card */}
      <div className="glass-panel p-6 rounded-2xl border border-navy-700/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Handover Certification Status
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              handover?.status === 'approved' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {handover?.status === 'approved' ? 'Certified & Approved' : 'Draft Handover Package'}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white">
            {handover ? handover.title : `Generate Official Handover for ${project.title}`}
          </h3>

          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            {handover 
              ? handover.executive_summary 
              : 'Compile all verified decisions, pending work, operational risks, and dependencies into a structured continuity document for incoming engineers.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <span>Approved Items: <strong className="text-emerald-400 font-bold">{approvedItems.length}</strong></span>
            <span>Pending Review: <strong className="text-amber-400 font-bold">{pendingItems.length}</strong></span>
            <span>Critical Risks: <strong className="text-rose-400 font-bold">{criticalRisks.length}</strong></span>
            {handover && <span>Version: <strong className="text-slate-200 font-mono">v{handover.version}</strong></span>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
          <button
            onClick={() => onGenerate()}
            disabled={isGenerating}
            className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-slate-200 rounded-xl text-xs font-bold border border-navy-600 flex items-center space-x-2 transition-all"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Compiling...' : handover ? 'Re-Generate Package' : 'Generate Handover'}</span>
          </button>

          {handover && handover.status !== 'approved' && (
            <button
              onClick={() => setShowApprovalModal(true)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-glow-emerald flex items-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Certify & Approve Handover</span>
            </button>
          )}

          {handover && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                title="Download Official Black & White PDF Handover Report"
              >
                <Download className={`w-3.5 h-3.5 ${downloadingPdf ? 'animate-bounce' : ''}`} />
                <span>PDF Handover</span>
              </button>
              <button
                onClick={handleCopyMarkdown}
                className="p-2 bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white rounded-xl border border-navy-700 text-xs transition-colors"
                title="Copy Handover Markdown to Clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handlePrint}
                className="p-2 bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white rounded-xl border border-navy-700 text-xs transition-colors"
                title="Print or Save as PDF"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Handover Report Document Preview */}
      {handover ? (
        <div className="glass-card p-6 sm:p-10 rounded-2xl border border-navy-700/80 space-y-6">
          {/* Header watermark/certification badge */}
          {handover.status === 'approved' && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="font-bold block">Certified Knowledge Handover Package</span>
                  <span className="text-[11px] text-emerald-400/80">
                    Officially reviewed and signed off by {handover.approved_by} on {new Date(handover.approved_at || handover.generated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                Audited & Verified
              </span>
            </div>
          )}

          {/* Render Markdown text in stylized container */}
          <div className="prose prose-invert max-w-none text-slate-200 text-xs leading-relaxed space-y-4">
            <pre className="whitespace-pre-wrap font-sans text-xs bg-navy-950 p-6 rounded-xl border border-navy-750 text-slate-200 leading-relaxed overflow-x-auto">
              {handover.markdown_content}
            </pre>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-16 text-center text-slate-400 rounded-2xl space-y-3">
          <FileCheck className="w-10 h-10 mx-auto text-blue-400 opacity-60" />
          <h4 className="text-base font-bold text-white">No Handover Package Generated Yet</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click "Generate Handover" above to synthesize all approved project decisions, responsibilities, risks, and next actions.
          </p>
          <button
            onClick={() => onGenerate()}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-glow-blue transition-all"
          >
            <span>Generate Initial Handover</span>
          </button>
        </div>
      )}

      {/* Human Approval Certification Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 sm:p-8 rounded-2xl border border-emerald-500/40 shadow-card space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-navy-750">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Mandatory Human Approval Gate</h3>
                  <p className="text-[11px] text-slate-400">Certification sign-off required prior to sharing</p>
                </div>
              </div>
              <button 
                onClick={() => setShowApprovalModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              By certifying this handover, you confirm that all architectural decisions, risks, dependencies, and next actions have been audited against authorized documents and are accurate for incoming team members.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Certifying Reviewer / Lead Name
                </label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Signature Statement & Notes
                </label>
                <textarea
                  rows={3}
                  value={signatureNotes}
                  onChange={(e) => setSignatureNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-navy-750 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproval}
                disabled={isApproving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-glow-emerald flex items-center space-x-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>{isApproving ? 'Certifying...' : 'Sign & Certify Handover'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

