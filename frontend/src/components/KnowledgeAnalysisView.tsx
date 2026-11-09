import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  FileText, 
  ArrowRight,
  User,
  Tag,
  Link2,
  Check,
  X
} from 'lucide-react';
import { KnowledgeItem, KnowledgeCategory, ItemPriority, ReviewStatus } from '../types';

interface KnowledgeAnalysisViewProps {
  items: KnowledgeItem[];
  onApproveItem: (itemId: number) => void;
  onRejectItem: (itemId: number) => void;
  onEditItem: (item: KnowledgeItem) => void;
  onNavigateToEvidence: (item: KnowledgeItem) => void;
}

export const KnowledgeAnalysisView: React.FC<KnowledgeAnalysisViewProps> = ({
  items,
  onApproveItem,
  onRejectItem,
  onEditItem,
  onNavigateToEvidence,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories: { key: string; label: string; count: number }[] = [
    { key: 'all', label: 'All Items', count: items.length },
    { key: 'decision', label: 'Decisions', count: items.filter(i => i.category === 'decision').length },
    { key: 'pending_task', label: 'Pending Tasks', count: items.filter(i => i.category === 'pending_task').length },
    { key: 'responsibility', label: 'Responsibilities', count: items.filter(i => i.category === 'responsibility').length },
    { key: 'risk_blocker', label: 'Risks & Blockers', count: items.filter(i => i.category === 'risk_blocker').length },
    { key: 'dependency', label: 'Dependencies', count: items.filter(i => i.category === 'dependency').length },
    { key: 'unresolved_question', label: 'Unresolved Questions', count: items.filter(i => i.category === 'unresolved_question').length },
    { key: 'next_action', label: 'Next Actions', count: items.filter(i => i.category === 'next_action').length },
  ];

  const filteredItems = items.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedPriority !== 'all' && item.priority !== selectedPriority) return false;
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchContent = item.content.toLowerCase().includes(q);
      const matchExcerpt = item.source_excerpt?.toLowerCase().includes(q);
      const matchAssignee = item.assignee?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchExcerpt && !matchAssignee) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Category Pills Navigation */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-glow-blue' 
                  : 'bg-navy-850 text-slate-300 hover:text-white hover:bg-navy-800 border border-navy-700/80'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isActive ? 'bg-blue-700 text-white' : 'bg-navy-700 text-slate-400'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-navy-700/80 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search extracted knowledge..."
            className="w-full pl-9 pr-4 py-1.5 bg-navy-950 border border-navy-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Priority & Status Filters */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-navy-950 border border-navy-700 rounded-lg text-xs text-slate-200 px-2 py-1 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Review Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-navy-950 border border-navy-700 rounded-lg text-xs text-slate-200 px-2 py-1 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400">
          <HelpCircle className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-60" />
          <p className="text-sm font-semibold text-slate-300">No knowledge items match your current filter.</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting the search or category filters.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isApproved = item.status === 'approved';
            const isRejected = item.status === 'rejected';
            const isPending = item.status === 'pending_review';

            const priorityBadge = 
              item.priority === 'critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
              item.priority === 'high' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
              item.priority === 'medium' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
              'bg-slate-500/10 text-slate-400 border-slate-500/30';

            const categoryLabel = item.category.replace('_', ' ').toUpperCase();

            return (
              <div 
                key={item.id}
                className="glass-card p-5 rounded-xl border border-navy-700/80 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Header: Category & Priority & Verification */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-navy-800 text-blue-300 border border-navy-700">
                        {categoryLabel}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${priorityBadge}`}>
                        {item.priority}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${
                        item.is_demo_mode ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {item.is_demo_mode ? 'Free Heuristic' : 'Gemini Free'}
                      </span>
                    </div>

                    {/* Verification Shield */}
                    <div className="flex items-center space-x-1.5">
                      {item.evidence_verified ? (
                        <span 
                          onClick={() => onNavigateToEvidence(item)}
                          className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20"
                          title="Click to view full source document verification"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verified Quote</span>
                        </span>
                      ) : (
                        <span 
                          onClick={() => onNavigateToEvidence(item)}
                          className="flex items-center space-x-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 cursor-pointer hover:bg-amber-500/20"
                          title="Evidence mismatch or quote not exact in source text"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Check Evidence</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Content */}
                  <h3 className="text-sm font-bold text-white mt-3">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {item.content}
                  </p>

                  {/* Assignee if any */}
                  {item.assignee && (
                    <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-slate-400">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Owner / Assignee: <strong className="text-slate-200">{item.assignee}</strong></span>
                    </div>
                  )}

                  {/* Supporting Quote Snippet */}
                  {item.source_excerpt && (
                    <div 
                      onClick={() => onNavigateToEvidence(item)}
                      className="mt-3 p-2.5 bg-navy-950/70 rounded-lg border border-navy-750 text-[11px] text-slate-400 cursor-pointer hover:border-blue-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[10px] text-blue-400 font-medium mb-1">
                        <span className="flex items-center space-x-1">
                          <Link2 className="w-3 h-3" />
                          <span>{item.source_document_name} ({item.source_page || 'Page 1'})</span>
                        </span>
                        <span>Confidence: {item.confidence_score}</span>
                      </div>
                      <p className="italic text-slate-300 line-clamp-2">
                        "{item.source_excerpt}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Review Controls */}
                <div className="pt-3 border-t border-navy-750 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400">Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      isApproved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      isRejected ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Review'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onEditItem(item)}
                      className="px-2.5 py-1 text-slate-300 hover:text-white bg-navy-800 hover:bg-navy-750 rounded-lg text-xs transition-colors"
                    >
                      Edit
                    </button>
                    {isPending && (
                      <>
                        <button
                          onClick={() => onApproveItem(item.id)}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 bg-emerald-500/10 rounded-lg border border-emerald-500/30 transition-colors"
                          title="Approve item"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onRejectItem(item.id)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/20 bg-rose-500/10 rounded-lg border border-rose-500/30 transition-colors"
                          title="Reject item"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

