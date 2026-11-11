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
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Award,
  Check
} from 'lucide-react';
import { Project } from '../types';
import * as api from '../api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (text: string, type?: 'success' | 'error') => void;
  project?: Project | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  project
}) => {
  const [activeTab, setActiveTab] = useState<'project_pdf' | 'project_markdown' | 'platform_pdf'>('project_pdf');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [loadingMarkdown, setLoadingMarkdown] = useState(false);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);

  if (!isOpen) return null;

  const projectTitle = project?.title || 'Project Apollo: Cloud Migration & K8s Architecture';
  const projectCode = project?.code || 'KB-APOLLO';
  const projectDept = project?.department || 'Platform Engineering';
  const projectLead = project?.lead_name || 'Marcus Vance';

  const handleDownloadProjectPdf = async () => {
    try {
      setDownloadingPdf(true);
      const blob = await api.downloadPdfReport(project?.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectCode}_OFFICIAL_HANDOVER_REPORT.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onShowToast(`Official Handover Report for ${projectTitle} (${projectCode}) downloaded successfully.`);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to download project report', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadPlatformPdf = async () => {
    try {
      setDownloadingPdf(true);
      const blob = await api.downloadPlatformPdfReport();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'KNOWLEDGE_BRIDGE_AI_MASTER_PLATFORM_REPORT.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onShowToast('Master 20-Section Knowledge Bridge AI Platform Architecture Report downloaded.');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to download platform report', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleFetchMarkdown = async () => {
    try {
      setLoadingMarkdown(true);
      setActiveTab('project_markdown');
      if (!markdownContent) {
        const res = await api.fetchMarkdownReport(project?.id);
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Official Project Handover Report
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                  {projectCode}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-lg">
                {projectTitle} • Pure Black & White Executive ISO Print-Ready Format
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="px-6 py-3 bg-navy-950/80 border-b border-navy-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('project_pdf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'project_pdf'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Project Handover (PDF)</span>
            </button>

            <button
              onClick={handleFetchMarkdown}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'project_markdown'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Handover Markdown</span>
            </button>

            <button
              onClick={() => setActiveTab('platform_pdf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'platform_pdf'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800'
              }`}
              title="View full Knowledge Bridge AI software platform architectural audit report"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Platform Audit Report</span>
            </button>
          </div>

          <button
            onClick={activeTab === 'platform_pdf' ? handleDownloadPlatformPdf : handleDownloadProjectPdf}
            disabled={downloadingPdf}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {downloadingPdf ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD {activeTab === 'platform_pdf' ? 'PLATFORM AUDIT' : projectCode} PDF</span>
              </>
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'project_pdf' ? (
            <div className="space-y-6">
              {/* Active Project Banner */}
              <div className="p-5 bg-navy-900 border border-navy-700/80 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                      Certified Handover Document
                    </span>
                    <span className="text-xs font-bold text-white">Pure B&W ISO Executive Specification</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-white">
                    {projectTitle}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Department: <strong className="text-slate-200">{projectDept}</strong> • Outgoing Lead: <strong className="text-slate-200">{projectLead}</strong> • Certifying Director: <strong className="text-slate-200">Alex Chen</strong>
                  </p>
                </div>

                <button
                  onClick={handleDownloadProjectPdf}
                  disabled={downloadingPdf}
                  className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center space-x-2 shrink-0 transition-transform transform hover:scale-105"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {projectCode} PDF</span>
                </button>
              </div>

              {/* Handover Sections Overview */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Official Project Handover Structure (Included in PDF)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  {[
                    {
                      num: "1",
                      title: "Executive Transition Overview",
                      desc: "Complete project baseline, transition scope, and business objectives"
                    },
                    {
                      num: "2",
                      title: "Ingested Engineering Documentation",
                      desc: "Provenance audit of primary engineering specs with hash validation"
                    },
                    {
                      num: "3",
                      title: "Key Architectural Decisions & Source Quotes",
                      desc: "100% verified quotations and exact page citations from original source files"
                    },
                    {
                      num: "4",
                      title: "Operational Responsibilities & Owners",
                      desc: "Subsystem ownership matrices, on-call points, and escalation channels"
                    },
                    {
                      num: "5",
                      title: "Critical Risks, Debt & Mitigation",
                      desc: "Severity ratings, blast radius analysis, and active mitigation plans"
                    },
                    {
                      num: "6",
                      title: "Immediate Next Actions & Runbooks",
                      desc: "Prioritized 30-day velocity roadmaps for incoming engineers"
                    },
                    {
                      num: "7",
                      title: "Cryptographic Certification & Seal",
                      desc: "Digitally signed by Alex Chen with SHA-256 handover integrity fingerprint"
                    }
                  ].map((sec, idx) => (
                    <div key={idx} className="p-3 bg-navy-950/60 border border-navy-800 rounded-xl space-y-1">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-bold text-white">{sec.num}. {sec.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 pl-5">{sec.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'platform_pdf' ? (
            <div className="space-y-6">
              {/* Platform Meta-Report Banner */}
              <div className="p-5 bg-navy-900 border border-navy-700/80 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-300 rounded border border-slate-700">
                      Master Audit Report
                    </span>
                    <span className="text-xs font-bold text-white">20 Exhaustive Sections</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-white">
                    KNOWLEDGE BRIDGE AI — System Architecture & Compliance Report
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comprehensive technical audit of the entire Knowledge Bridge AI software platform, zero-budget infrastructure, and security controls.
                  </p>
                </div>

                <button
                  onClick={handleDownloadPlatformPdf}
                  disabled={downloadingPdf}
                  className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center space-x-2 shrink-0 transition-transform transform hover:scale-105"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Platform PDF</span>
                </button>
              </div>

              {/* 20 Sections List Overview */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Platform Architecture Document Structure (20 Sections)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
                  {[
                    "1. Cover Page & System Identification",
                    "2. Executive Summary & Mission",
                    "3. Problem Statement & Criticality",
                    "4. Core Solution Architecture & Workflow",
                    "5. Technology Stack & Zero-Budget Model",
                    "6. Authentication & Zero-Trust RBAC",
                    "7. Document Ingestion Pipeline",
                    "8. AI Extraction & Fallback Architecture",
                    "9. Seven Knowledge Categories Taxonomy",
                    "10. Evidence-First Verification Engine",
                    "11. Human-in-the-Loop Review Center",
                    "12. Handover Package Certification Gate",
                    "13. Team Member Audited Dashboard",
                    "14. Backup, Restore & Disaster Recovery",
                    "15. Vercel & Neon PostgreSQL Topology",
                    "16. Strict Security Hardening Audit",
                    "17. System Health & Diagnostic Telemetry",
                    "18. Live Production Verification Tests",
                    "19. Future Scalability Roadmap",
                    "20. Final Sign-Off & Clearance Block"
                  ].map((sec, idx) => (
                    <div key={idx} className="p-2.5 bg-navy-950/60 border border-navy-800 rounded-xl flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
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
                  <span>Loading full Markdown handover report for {projectTitle}...</span>
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
            <span>Target: {projectTitle} • Zero-Trust Verified</span>
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
