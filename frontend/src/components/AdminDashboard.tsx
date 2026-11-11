import React from 'react';
import { 
  FolderGit2, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Plus, 
  Upload, 
  Sparkles, 
  FileCheck, 
  Activity, 
  Layers, 
  ChevronRight, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  Printer, 
  Search, 
  Award,
  ArrowUpRight
} from 'lucide-react';
import { Project, DashboardStats, ActivityLog } from '../types';

interface AdminDashboardProps {
  stats: DashboardStats | null;
  projects: Project[];
  activities: ActivityLog[];
  onSelectProject: (projectId: number, defaultTab?: string) => void;
  onOpenCreateProject: () => void;
  onOpenSettings: () => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenReportModal?: () => void;
  loading: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  projects,
  activities,
  onSelectProject,
  onOpenCreateProject,
  onOpenSettings,
  onNavigateToTab,
  onOpenReportModal,
  loading,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Welcome & Executive Action Launchpad */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-navy-750">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Admin & Lead Portal
            </span>
            <span className="text-xs text-slate-400">Zero-Trust Role-Based Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Knowledge Handover Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time status across authorized project repositories, pending knowledge reviews, and certified handovers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-950 rounded-xl text-xs font-extrabold shadow-md flex items-center space-x-1.5 transition-all transform hover:-translate-y-0.5"
            >
              <Printer className="w-4 h-4" />
              <span>Project Report (PDF)</span>
            </button>
          )}

          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('backup')}
              className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <HardDrive className="w-4 h-4" />
              <span>Backup & Recovery</span>
            </button>
          )}

          <button
            onClick={onOpenCreateProject}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow-blue flex items-center space-x-2 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* AI Mode Banner if in Fallback */}
      {stats?.demo_mode_active && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-xs font-bold text-amber-200">
                  AI Engine: Zero-Cost Rule-Based Fallback Mode
                </h4>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ₹0.00 Cost
                </span>
              </div>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Operating with transparent local deterministic parsing and strict source quotation verification. Zero commercial API costs incurred.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-xs font-semibold px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-xl border border-amber-500/30 transition-colors whitespace-nowrap"
          >
            Diagnostics & Settings
          </button>
        </div>
      )}

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="bg-navy-900/80 p-5 rounded-2xl border border-navy-750/90 hover:border-blue-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Projects</span>
            <FolderGit2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white mt-3">
            {stats ? stats.total_projects : '-'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Active workspaces</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-navy-900/80 p-5 rounded-2xl border border-navy-750/90 hover:border-cyan-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Uploaded Docs</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white mt-3">
            {stats ? stats.uploaded_documents : '-'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, TXT parsed</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-navy-900/80 p-5 rounded-2xl border border-navy-750/90 hover:border-amber-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Reviews</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 mt-3 flex items-center space-x-2">
            <span>{stats ? stats.pending_reviews : '-'}</span>
            {stats && stats.pending_reviews > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Awaiting human sign-off</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-navy-900/80 p-5 rounded-2xl border border-navy-750/90 hover:border-emerald-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Approved Handovers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-3">
            {stats ? stats.approved_handovers : '-'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Certified for transfer</p>
        </div>

        {/* Metric 5 */}
        <div className="bg-navy-900/80 p-5 rounded-2xl border border-navy-750/90 hover:border-rose-500/40 transition-all shadow-md col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Critical Risks</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 mt-3">
            {stats ? stats.critical_risks : '-'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">High-impact blockers</p>
        </div>
      </div>

      {/* Feature Navigation Cards (Anti-Scroll Workflow Launchpads) */}
      <div className="bg-navy-900/60 border border-navy-750/80 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Interactive Workflow Launchpad (Direct Access)</span>
          </h3>
          <span className="text-[11px] text-slate-400">Click any stage to enter immediately</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Upload Documents', sub: 'PDF, DOCX, TXT', icon: Upload, color: 'text-blue-400', tab: 'documents' },
            { label: 'AI Extraction', sub: '7 Categories NLP', icon: Sparkles, color: 'text-cyan-400', tab: 'analysis' },
            { label: 'Evidence Center', sub: 'Quote Validation', icon: Search, color: 'text-indigo-400', tab: 'evidence' },
            { label: 'Human Review', sub: 'Batch Approval', icon: FileCheck, color: 'text-amber-400', tab: 'review' },
            { label: 'Certify Handover', sub: 'Executive Package', icon: Award, color: 'text-emerald-400', tab: 'handover' },
            { label: 'Disaster Recovery', sub: 'Atomic Backups', icon: HardDrive, color: 'text-purple-400', directTab: 'backup' },
          ].map((launch, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (launch.directTab && onNavigateToTab) {
                  onNavigateToTab(launch.directTab);
                } else if (projects.length > 0) {
                  onSelectProject(projects[0].id, launch.tab);
                }
              }}
              className="p-3.5 bg-navy-950/60 hover:bg-navy-800/80 border border-navy-800 hover:border-navy-600 rounded-xl text-left transition-all transform hover:-translate-y-0.5 group"
            >
              <launch.icon className={`w-5 h-5 ${launch.color} mb-2`} />
              <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                {launch.label}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{launch.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Projects Overview & Activity Feed */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Projects List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <FolderGit2 className="w-4 h-4 text-blue-400" />
              <span>Active Project Repositories</span>
            </h2>
            <span className="text-xs text-slate-400">
              Showing {projects.length} project(s)
            </span>
          </div>

          <div className="space-y-4">
            {projects.map((project) => {
              const statusColor = 
                project.handover_status === 'approved' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                project.handover_status === 'under_review' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                'text-blue-400 bg-blue-500/10 border-blue-500/30';

              const statusLabel = 
                project.handover_status === 'approved' ? 'Handover Certified' :
                project.handover_status === 'under_review' ? 'Review in Progress' :
                'Drafting Knowledge';

              return (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className="bg-navy-900/80 p-5 rounded-2xl border border-navy-750/90 hover:border-blue-500/50 hover:shadow-card-hover transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30">
                          {project.code}
                        </span>
                        <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                          {project.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 max-w-2xl">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>

                    <span className={`self-start sm:self-auto px-2.5 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Project stats footer */}
                  <div className="mt-4 pt-3 border-t border-navy-750/70 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
                    <div className="flex items-center space-x-4">
                      <span>Lead: <strong className="text-slate-200">{project.lead_name}</strong></span>
                      <span>Dept: <strong className="text-slate-200">{project.department}</strong></span>
                      <span>Docs: <strong className="text-slate-200">{project.document_count}</strong></span>
                      <span>Items: <strong className="text-slate-200">{project.item_count}</strong></span>
                    </div>

                    <div className="flex items-center space-x-1 text-blue-400 group-hover:translate-x-1 transition-transform font-semibold text-xs">
                      <span>Open Workspace</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Activity Stream & Audit Trail */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Activity & Audit Trail</span>
            </h2>
            <span className="text-[11px] text-slate-400">Live events</span>
          </div>

          <div className="bg-navy-900/80 p-4 rounded-2xl border border-navy-750/90 max-h-[560px] overflow-y-auto space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No recent activity recorded.
              </div>
            ) : (
              activities.map((act) => {
                const isApproved = act.action.includes('APPROVED');
                const isUpload = act.action.includes('UPLOAD');
                const isAnalysis = act.action.includes('ANALYSIS');

                const dotColor = isApproved ? 'bg-emerald-400' : isUpload ? 'bg-blue-400' : isAnalysis ? 'bg-cyan-400' : 'bg-slate-400';

                return (
                  <div key={act.id} className="p-3 bg-navy-950/60 rounded-xl border border-navy-800 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center space-x-1.5 font-bold text-slate-200">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        <span>{act.action.replace(/_/g, ' ')}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                      {act.details}
                    </p>
                    <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>By: {act.user_name}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
