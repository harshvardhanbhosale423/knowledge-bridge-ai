import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  ShieldCheck, 
  FileCode, 
  ExternalLink,
  Layers
} from 'lucide-react';
import * as api from '../api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (text: string, type?: 'success' | 'error') => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'markdown'>('pdf');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [loadingMarkdown, setLoadingMarkdown] = useState(false);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const blob = await api.downloadPdfReport();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'KNOWLEDGE_BRIDGE_AI_FINAL_REPORT.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onShowToast('Official 20-Section Black & White PDF Report downloaded.');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to download PDF report', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleFetchMarkdown = async () => {
    try {
      setLoadingMarkdown(true);
      setActiveTab('markdown');
      if (!markdownContent) {
        const res = await api.fetchMarkdownReport();
        setMarkdownContent(res.report_markdown);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load Markdown report', 'error');
    } finally {
      setLoadingMarkdown(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0B1224] border border-navy-750 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-navy-900 border-b border-navy-750 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold shadow-md">
              <Printer className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Official Comprehensive Project Report
              </h2>
              <p className="text-xs text-slate-400">
                20-Section Executive Document • Pure Black & White Print-Ready Format
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="px-6 py-3 bg-navy-950/80 border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'pdf'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Executive PDF Format</span>
            </button>
            <button
              onClick={handleFetchMarkdown}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'markdown'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Full Markdown Report</span>
            </button>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {downloadingPdf ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD PROJECT REPORT (PDF)</span>
              </>
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'pdf' ? (
            <div className="space-y-6">
              {/* PDF Preview Specification Banner */}
              <div className="p-5 bg-navy-900/90 border border-navy-700/80 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-300 rounded border border-slate-700">
                      Standard B&W ISO Print
                    </span>
                    <span className="text-xs font-bold text-white">20 Exhaustive Sections</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Engineered with custom two-pass ReportLab <code className="text-cyan-300">NumberedCanvas</code> for dynamic page counting ("Page X of Y"), clean typography, table borders, and zero-color-waste printing.
                  </p>
                </div>

                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center space-x-2 shrink-0 transition-transform transform hover:scale-105"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Document</span>
                </button>
              </div>

              {/* 20 Sections List Overview */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Report Structure & Table of Contents (20 Sections)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
                  {[
                    "1. Cover Page & Document Identification",
                    "2. Executive Summary & Purpose",
                    "3. Problem Statement & Mission Criticality",
                    "4. Core Solution Architecture & Workflow",
                    "5. Technology Stack & Free-Tier Zero-Budget Model",
                    "6. Authentication, Session Security & Zero-Trust RBAC",
                    "7. Document Ingestion Engine (PDF, DOCX, TXT)",
                    "8. AI Extraction & Intelligent Fallback System",
                    "9. Seven Knowledge Categories Taxonomy",
                    "10. Evidence-First Verification Engine",
                    "11. Human-in-the-Loop Review Center",
                    "12. Handover Package Generation & Formal Certification",
                    "13. Team Member Audited Knowledge Dashboard",
                    "14. Enterprise Backup, Restore & Disaster Recovery",
                    "15. Vercel Serverless & Neon PostgreSQL Topology",
                    "16. Strict Security Hardening Audit & Evidence",
                    "17. System Health, Monitoring & Diagnostic Telemetry",
                    "18. Live Production Verification & Test Results",
                    "19. Future Roadmap & Enterprise Scalability",
                    "20. Certification & Sign-Off Block"
                  ].map((sec, idx) => (
                    <div key={idx} className="p-2.5 bg-navy-950/60 border border-navy-800 rounded-xl flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{sec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {loadingMarkdown ? (
                <div className="flex items-center justify-center py-16 text-slate-400 text-xs space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Loading full Markdown report...</span>
                </div>
              ) : (
                <div className="bg-navy-950 p-6 rounded-2xl border border-navy-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
                  {markdownContent}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-navy-900 border-t border-navy-750 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ready for Hackathon Jury Evaluation and Executive Review</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-750 text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
