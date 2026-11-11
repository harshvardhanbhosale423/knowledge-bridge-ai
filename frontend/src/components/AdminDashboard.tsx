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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-750">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30">
              Admin & Lead Portal
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Zero-Trust Role-Based Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Knowledge Handover Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time status across authorized project repositories, pending knowledge reviews, and certified handovers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 rounded-xl text-xs font-extrabold shadow-sm flex items-center space-x-2 transition-all transform hover:-translate-y-0.5"
              title="Download Official Project Handover Report"
            >
              <Printer className="w-4 h-4" />
              <span>Project Report (PDF)</span>
            </button>
          )}

          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('backup')}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 dark:text-indigo-300 dark:border-indigo-500/30 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors shadow-sm"
            >
              <HardDrive className="w-4 h-4" />
              <span>Backup & Recovery</span>
            </button>
          )}

          <button
            onClick={onOpenCreateProject}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center space-x-2 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* AI Mode Banner if in Fallback */}
      {stats?.demo_mode_active && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                  AI Engine: Zero-Cost Rule-Based Fallback Mode
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
                  ₹0.00 Cost
                </span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300/80 mt-0.5">
                Operating with transparent local deterministic parsing and strict source quotation verification. Zero commercial API costs incurred.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-xs font-bold px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 rounded-xl border border-amber-300 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-200 dark:border-amber-500/30 transition-colors whitespace-nowrap shadow-sm"
          >
            Diagnostics & Settings
          </button>
        </div>
      )}

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-navy-900/80 p-5 rounded-2xl border border-slate-200 dark:border-navy-750/90 hover:border-blue-500/40 transition-all shadow-sm hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Projects</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {stats ? stats.total_projects : '-'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Active workspaces</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-navy-900/80 p-5 rounded-2xl border border-slate-200 dark:border-navy-750/90 hover:border-cyan-500/40 transition-all shadow-sm hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Uploaded Docs</span>
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {stats ? stats.uploaded_documents : '-'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">PDF, DOCX, TXT parsed</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-navy-900/80 p-5 rounded-2xl border border-slate-200 dark:border-navy-750/90 hover:border-amber-500/40 transition-all shadow-sm hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Reviews</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-300 mt-2 flex items-center space-x-2">
            <span>{stats ? stats.pending_reviews : '-'}</span>
            {stats && stats.pending_reviews > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Awaiting human sign-off</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-navy-900/80 p-5 rounded-2xl border border-slate-200 dark:border-navy-750/90 hover:border-emerald-500/40 transition-all shadow-sm hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Approved Handovers</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {stats ? stats.approved_handovers : '-'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Certified for transfer</p>
        </div>

        {/* Metric 5 */}
        <div className="bg-white dark:bg-navy-900/80 p-5 rounded-2xl border border-slate-200 dark:border-navy-750/90 hover:border-rose-500/40 transition-all shadow-sm hover:shadow-md col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Critical Risks</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {stats ? stats.critical_risks : '-'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">High-impact blockers</p>
        </div>
      </div>

      {/* Feature Navigation Cards (Anti-Scroll Workflow Launchpads) */}
      <div className="bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-750/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Interactive Workflow Launchpad (Direct Access)</span>
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Click any stage to enter immediately</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            { label: 'Upload Documents', sub: 'PDF, DOCX, TXT', icon: Upload, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', tab: 'documents' },
            { label: 'AI Extraction', sub: '7 Categories NLP', icon: Sparkles, iconBg: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400', tab: 'analysis' },
            { label: 'Evidence Center', sub: 'Quote Validation', icon: Search, iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400', tab: 'evidence' },
            { label: 'Human Review', sub: 'Batch Approval', icon: FileCheck, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', tab: 'review' },
            { label: 'Certify Handover', sub: 'Executive Package', icon: Award, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', tab: 'handover' },
            { label: 'Disaster Recovery', sub: 'Atomic Backups', icon: HardDrive, iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400', directTab: 'backup' },
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
              className="p-4 bg-slate-50 hover:bg-white dark:bg-navy-950/60 dark:hover:bg-navy-800/80 border border-slate-200 dark:border-navy-800 hover:border-blue-400 dark:hover:border-navy-600 rounded-xl text-left transition-all transform hover:-translate-y-0.5 hover:shadow-md group cursor-pointer"
            >
              <div className={`p-2 rounded-lg ${launch.iconBg} mb-3 inline-block shadow-sm`}>
                <launch.icon className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {launch.label}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{launch.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Projects Overview & Activity Feed */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Projects List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <FolderGit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Active Project Repositories</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing {projects.length} project(s)
            </span>
          </div>

          <div className="space-y-4">
            {projects.map((project) => {
              const statusColor = 
                project.handover_status === 'approved' ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/30' :
                project.handover_status === 'under_review' ? 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/30' :
                'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/30';

              const statusLabel = 
                project.handover_status === 'approved' ? 'Handover Certified' :
                project.handover_status === 'under_review' ? 'Review in Progress' :
                'Drafting Knowledge';

              return (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className="bg-white dark:bg-navy-900/80 p-5 rounded-2xl border border-slate-200 dark:border-navy-750/90 hover:border-blue-500/50 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-600/20 dark:text-blue-300 dark:border-blue-500/30">
                          {project.code}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {project.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 max-w-2xl font-normal leading-relaxed">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>

                    <span className={`self-start sm:self-auto px-3 py-1 text-xs font-bold rounded-full border whitespace-nowrap shadow-sm ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Project stats footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-750/70 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-3">
                    <div className="flex items-center space-x-4">
                      <span>Lead: <strong className="text-slate-900 dark:text-slate-200 font-bold">{project.lead_name}</strong></span>
                      <span>Dept: <strong className="text-slate-900 dark:text-slate-200 font-bold">{project.department}</strong></span>
                      <span>Docs: <strong className="text-slate-900 dark:text-slate-200 font-bold">{project.document_count}</strong></span>
                      <span>Items: <strong className="text-slate-900 dark:text-slate-200 font-bold">{project.item_count}</strong></span>
                    </div>

                    <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform font-bold text-xs">
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
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span>Activity & Audit Trail</span>
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Live events</span>
          </div>

          <div className="bg-white dark:bg-navy-900/80 p-4 rounded-2xl border border-slate-200 dark:border-navy-750/90 shadow-sm max-h-[560px] overflow-y-auto space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400 font-medium">
                No recent activity recorded.
              </div>
            ) : (
              activities.map((act) => {
                const isApproved = act.action.includes('APPROVED');
                const isUpload = act.action.includes('UPLOAD');
                const isAnalysis = act.action.includes('ANALYSIS');

                const dotColor = isApproved ? 'bg-emerald-500' : isUpload ? 'bg-blue-500' : isAnalysis ? 'bg-cyan-500' : 'bg-slate-400';

                return (
                  <div key={act.id} className="p-3 bg-slate-50 dark:bg-navy-950/60 rounded-xl border border-slate-200 dark:border-navy-800 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-slate-200">
                        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                        <span>{act.action.replace(/_/g, ' ')}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 leading-snug">
                      {act.details}
                    </p>
                    <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>By: <strong className="text-slate-700 dark:text-slate-300">{act.user_name}</strong></span>
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
