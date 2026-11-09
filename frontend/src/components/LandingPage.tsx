import React from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Link2, 
  Users, 
  Layers, 
  FileSearch, 
  Cpu, 
  Database,
  ArrowUpRight,
  GitPullRequest,
  Lock,
  Compass
} from 'lucide-react';
import { AIProviderConfig } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  onExploreProjects: () => void;
  aiConfig: AIProviderConfig | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onExploreProjects,
  aiConfig,
}) => {
  return (
    <div className="min-h-screen bg-[#060B17] text-slate-100 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Glow backdrop shapes */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[250px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-6 shadow-glow-blue animate-fade-in">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>NEVER LOSE CRITICAL KNOWLEDGE. KEEP EVERY PROJECT MOVING.</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight md:leading-[1.15]">
            Evidence-Linked Handover for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300">
              High-Stakes Engineering Teams
            </span>
          </h1>

          {/* Subtitle / Problem statement */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            When a team member leaves, architecture decisions, pending tasks, dependencies, and unseen risks vanish.
            <strong className="text-white font-semibold"> Knowledge Bridge AI</strong> extracts, verifies, and compiles authorized documents into an auditable, evidence-backed knowledge handover.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-glow-blue flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Launch Admin Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onExploreProjects}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-navy-800/80 hover:bg-navy-750 text-slate-200 border border-navy-700 font-semibold text-sm flex items-center justify-center space-x-2 transition-all"
            >
              <span>Explore Seeded Projects</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-slate-400">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Strict Evidence Verification (No Hallucinations)</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>PDF, DOCX & TXT Extraction</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Human Approval Gate Required</span>
            </div>
          </div>
        </div>
      </section>

      {/* The 6-Stage Core Workflow */}
      <section className="py-16 bg-navy-900/60 border-y border-navy-750/60 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-wider font-bold text-blue-400">Complete End-to-End Pipeline</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              How Knowledge Bridge AI Works
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
              From raw documentation to certified team handover in six verified, human-governed stages.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[
              { step: '01', title: 'Upload', desc: 'Authorized PDF, Word DOCX or TXT files', icon: FileText, color: 'text-blue-400' },
              { step: '02', title: 'Analyze', desc: 'AI extracts 7 core knowledge dimensions', icon: Sparkles, color: 'text-cyan-400' },
              { step: '03', title: 'Verify', desc: 'Match every item to exact source citations', icon: ShieldCheck, color: 'text-emerald-400' },
              { step: '04', title: 'Review', desc: 'Human lead edits, rejects or clarifies', icon: Users, color: 'text-amber-400' },
              { step: '05', title: 'Approve', desc: 'Mandatory sign-off prior to publishing', icon: CheckCircle2, color: 'text-indigo-400' },
              { step: '06', title: 'Handover', desc: 'Exportable structured continuity package', icon: Compass, color: 'text-teal-400' },
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={idx} className="glass-panel p-4 rounded-xl border border-navy-750 hover:border-blue-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-navy-800 px-2 py-0.5 rounded border border-navy-700">
                        {s.step}
                      </span>
                      <Icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <h3 className="text-sm font-bold text-white">{s.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-wider font-bold text-cyan-400">Enterprise Grade Continuity</span>
          <h2 className="text-3xl font-extrabold text-white mt-1">
            Engineered for Zero Information Loss
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
            Every feature is designed to protect your organization from blind spots during personnel transitions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-panel p-6 rounded-2xl border border-navy-700/80 hover:border-blue-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-105 transition-transform">
              <Link2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Evidence-Linked Citations</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We never invent facts. Every extracted decision, dependency, or task is linked to its exact quote and page reference in the source document, with automated mismatch detection.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 rounded-2xl border border-navy-700/80 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Human-in-the-Loop Governance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI proposes; engineering leads dispose. Reviewers can approve, reject, or edit extracted details with review notes. Handover packages cannot be shared without explicit sign-off.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 rounded-2xl border border-navy-700/80 hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">7 Critical Knowledge Dimensions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Categorizes knowledge into Decisions, Pending Tasks, System Ownerships, Risks & Blockers, Dependencies, Unresolved Questions, and First 30-Day Next Actions.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-panel p-6 rounded-2xl border border-navy-700/80 hover:border-amber-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-105 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Configurable LLM & Fallback</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrate with Google Gemini 3.8 Flash (Free Tier), or utilize the built-in deterministic heuristic engine. Transparent fallback mode ensures the system runs anywhere with zero setup.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass-panel p-6 rounded-2xl border border-navy-700/80 hover:border-indigo-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-105 transition-transform">
              <FileSearch className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Multi-Format Document Ingestion</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload PDF specifications, Word DOCX design docs, and TXT runbooks. Full page-by-page text extraction preserves structure, tables, and pagination for precise citing.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass-panel p-6 rounded-2xl border border-navy-700/80 hover:border-teal-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-5 group-hover:scale-105 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">PostgreSQL-Ready Architecture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Built on SQLite for instant local zero-dependency execution and structured via SQLAlchemy 2.0 ORM for frictionless migration to cloud PostgreSQL databases.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Evidence Preview Card */}
      <section className="py-16 bg-navy-900/40 border-t border-navy-750">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-6 sm:p-8 rounded-2xl border border-blue-500/30 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-navy-700 gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Live Evidence Linkage Demonstration</h4>
                  <p className="text-xs text-slate-400">Verifying item against Apollo_Cloud_Migration_Handover_Doc.txt</p>
                </div>
              </div>
              <span className="self-start sm:self-auto px-2.5 py-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                100% Evidence Match
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div className="bg-navy-950/80 p-4 rounded-xl border border-navy-750">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Extracted Decision</span>
                <h5 className="text-sm font-semibold text-white mt-1">Standardized on AWS EKS 1.30 with Karpenter Autoscaling</h5>
                <p className="text-xs text-slate-300 mt-1">
                  Selected Karpenter over Kubernetes Cluster Autoscaler for node provisioning to optimize bin-packing efficiency.
                </p>
              </div>

              <div className="bg-blue-950/20 p-4 rounded-xl border border-blue-500/20">
                <div className="flex items-center justify-between text-[11px] text-blue-400 font-medium mb-1">
                  <span className="flex items-center space-x-1.5">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Exact Document Citation (Page 1)</span>
                  </span>
                  <span className="text-slate-400">Match Confidence: 0.98</span>
                </div>
                <blockquote className="text-xs text-slate-200 italic border-l-2 border-blue-500 pl-3 py-0.5">
                  "Decision: Standardized on AWS EKS 1.30 with Karpenter for cluster autoscaling rather than Cluster Autoscaler."
                </blockquote>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-navy-750 text-xs text-slate-400 gap-3">
              <span>Audited by Alex Chen (Lead Reviewer)</span>
              <button
                onClick={onExploreProjects}
                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
              >
                <span>View Full Handover Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="bg-navy-950 border-t border-navy-750 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/30 text-blue-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white">KNOWLEDGE BRIDGE AI</span>
            <span className="text-slate-400">| Hackathon Production Build</span>
          </div>
          <div className="flex items-center space-x-6 text-[11px]">
            <span>Confidential Synthetic Mock Data</span>
            <span>FastAPI + SQLite + React TS</span>
            <span>Zero Unverified Hallucinations</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

