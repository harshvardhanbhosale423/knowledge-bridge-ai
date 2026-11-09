import React, { useState } from 'react';
import { 
  UserCheck, 
  FolderGit2, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  FileText, 
  CheckSquare, 
  Layers, 
  Compass, 
  BookOpen, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock
} from 'lucide-react';
import { Project, KnowledgeItem, HandoverReport } from '../types';

interface TeamMemberDashboardProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (projectId: number) => void;
  items: KnowledgeItem[];
  handover: HandoverReport | null;
}

export const TeamMemberDashboard: React.FC<TeamMemberDashboardProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  items,
  handover,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'decisions' | 'tasks' | 'risks' | 'actions' | 'report'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Team members only see verified and approved information!
  const approvedItems = items.filter(i => i.status === 'approved');

  const decisions = approvedItems.filter(i => i.category === 'decision');
  const tasks = approvedItems.filter(i => i.category === 'pending_task' || i.category === 'responsibility');
  const risks = approvedItems.filter(i => i.category === 'risk_blocker');
  const actions = approvedItems.filter(i => i.category === 'next_action');

  const filteredItems = approvedItems.filter(item => {
    if (activeTab === 'decisions') return item.category === 'decision';
    if (activeTab === 'tasks') return item.category === 'pending_task' || item.category === 'responsibility';
    if (activeTab === 'risks') return item.category === 'risk_blocker';
    if (activeTab === 'actions') return item.category === 'next_action';
    return true;
  }).filter(item => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header with Project Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-navy-750">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Team Member Handover Portal
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                Incoming Engineer View
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Access certified architectural decisions, immediate tasks, and risk runbooks.
            </p>
          </div>
        </div>

        {/* Project Dropdown Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-semibold whitespace-nowrap">Assigned Project:</span>
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => onSelectProject(Number(e.target.value))}
            className="px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white font-medium text-xs focus:outline-none focus:border-emerald-500"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedProject ? (
        <div className="space-y-6">
          {/* Handover Certification Alert Card */}
          <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                  {selectedProject.code}
                </span>
                <h3 className="text-base font-bold text-white">
                  {selectedProject.title}
                </h3>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl">
                {selectedProject.description}
              </p>
              <div className="flex items-center space-x-4 text-xs text-slate-400 pt-1">
                <span>Outgoing Lead: <strong className="text-slate-200">{selectedProject.lead_name}</strong></span>
                <span>Department: <strong className="text-slate-200">{selectedProject.department}</strong></span>
                <span>Certified Items: <strong className="text-emerald-400 font-bold">{approvedItems.length}</strong></span>
              </div>
            </div>

            {handover?.status === 'approved' ? (
              <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-300 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Certified by {handover.approved_by}</span>
              </div>
            ) : (
              <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Handover Review In Progress</span>
              </div>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-750 pb-2">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { key: 'overview', label: 'Overview', count: approvedItems.length },
                { key: 'decisions', label: 'Architectural Decisions', count: decisions.length },
                { key: 'tasks', label: 'Pending Tasks & Roles', count: tasks.length },
                { key: 'risks', label: 'Risks & Blockers', count: risks.length },
                { key: 'actions', label: 'Next 30 Days Actions', count: actions.length },
                { key: 'report', label: 'Official Handover Document', count: handover ? 1 : 0 },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                    activeTab === tab.key
                      ? 'bg-emerald-600 text-white shadow-glow-emerald'
                      : 'bg-navy-850 text-slate-300 hover:text-white border border-navy-750'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search knowledge items..."
                className="w-full pl-9 pr-3 py-1.5 bg-navy-950 border border-navy-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Content Area */}
          {activeTab === 'report' ? (
            handover && handover.status === 'approved' ? (
              <div className="glass-card p-6 sm:p-10 rounded-2xl border border-navy-700/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-navy-750">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <span>{handover.title}</span>
                  </h3>
                  <span className="text-xs text-emerald-400 font-mono">v{handover.version}</span>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-xs bg-navy-950 p-6 rounded-xl border border-navy-750 text-slate-200 leading-relaxed overflow-x-auto">
                  {handover.markdown_content}
                </pre>
              </div>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-400 rounded-xl space-y-2">
                <Lock className="w-8 h-8 mx-auto text-amber-400 mb-2 opacity-80" />
                <p className="text-sm font-bold text-white">Handover Document Restricted</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  This handover package is currently in draft or awaiting administrative review. Team Members are strictly restricted from accessing unapproved handovers until certified by an authorized administrator.
                </p>
              </div>
            )
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredItems.length === 0 ? (
                <div className="col-span-2 glass-panel p-12 text-center text-slate-400 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-60" />
                  <p className="text-sm font-semibold text-slate-300">No approved items found in this section.</p>
                </div>
              ) : (
                filteredItems.map(item => {
                  const priorityClass = 
                    item.priority === 'critical' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
                    item.priority === 'high' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                    'text-blue-400 bg-blue-500/10 border-blue-500/30';

                  return (
                    <div 
                      key={item.id}
                      className="glass-card p-5 rounded-xl border border-navy-700/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-navy-800 text-slate-300 border border-navy-700">
                            {item.category.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${priorityClass}`}>
                            {item.priority}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white mt-2.5">
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                          {item.content}
                        </p>

                        {/* Verified source quote */}
                        {item.source_excerpt && (
                          <div className="mt-3 p-2.5 bg-navy-950/80 rounded-lg border border-navy-750 text-[11px] text-slate-300">
                            <span className="text-[10px] text-emerald-400 font-mono block mb-0.5">
                              Source Citation: {item.source_document_name} ({item.source_page || 'Page 1'})
                            </span>
                            <blockquote className="italic border-l-2 border-emerald-500 pl-2">
                              "{item.source_excerpt}"
                            </blockquote>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-navy-750 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Lead/Owner: <strong className="text-slate-200">{item.assignee || 'Team'}</strong></span>
                        <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Certified</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel p-16 text-center text-slate-400 rounded-2xl">
          <FolderGit2 className="w-10 h-10 mx-auto text-slate-500 mb-2 opacity-50" />
          <p className="text-base font-bold text-white">No Project Selected</p>
          <p className="text-xs text-slate-400 mt-1">Select an active project from the dropdown above to view its handover portal.</p>
        </div>
      )}
    </div>
  );
};

