import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  X, 
  Trash2, 
  User, 
  Clock,
  Filter,
  Layers,
  Save
} from 'lucide-react';
import { KnowledgeItem, ItemPriority, ReviewStatus } from '../types';

interface HumanReviewCenterProps {
  projectId: number;
  items: KnowledgeItem[];
  onUpdateItem: (itemId: number, data: {
    title?: string;
    content?: string;
    priority?: ItemPriority;
    assignee?: string;
    status?: ReviewStatus;
    review_notes?: string;
    reviewed_by?: string;
  }) => Promise<void>;
  onBatchReview: (itemIds: number[], action: 'approve' | 'reject') => Promise<void>;
}

export const HumanReviewCenter: React.FC<HumanReviewCenterProps> = ({
  projectId,
  items,
  onUpdateItem,
  onBatchReview,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form edit states
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPriority, setEditPriority] = useState<ItemPriority>('medium');
  const [editAssignee, setEditAssignee] = useState('');
  const [editReviewNotes, setEditReviewNotes] = useState('');

  const pendingItems = items.filter(i => i.status === 'pending_review');
  const approvedItems = items.filter(i => i.status === 'approved');
  const rejectedItems = items.filter(i => i.status === 'rejected');

  const displayedItems = 
    activeTab === 'pending' ? pendingItems :
    activeTab === 'approved' ? approvedItems : rejectedItems;

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedItems.map(i => i.id));
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleOpenEdit = (item: KnowledgeItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditPriority(item.priority);
    setEditAssignee(item.assignee || '');
    setEditReviewNotes(item.review_notes || '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      setIsSubmitting(true);
      await onUpdateItem(editingItem.id, {
        title: editTitle,
        content: editContent,
        priority: editPriority,
        assignee: editAssignee || undefined,
        review_notes: editReviewNotes,
        status: 'approved', // Saving with review approves it
        reviewed_by: 'Alex Chen (Reviewer)'
      });
      setEditingItem(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatch = async (action: 'approve' | 'reject') => {
    if (selectedIds.length === 0) return;
    try {
      setIsSubmitting(true);
      await onBatchReview(selectedIds, action);
      setSelectedIds([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Review Workflow Tabs & Batch Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-navy-750">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setActiveTab('pending'); setSelectedIds([]); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-navy-850 text-slate-400 hover:text-white border border-navy-750'
            }`}
          >
            <span>Needs Review</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300">
              {pendingItems.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('approved'); setSelectedIds([]); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-navy-850 text-slate-400 hover:text-white border border-navy-750'
            }`}
          >
            <span>Approved & Certified</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300">
              {approvedItems.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('rejected'); setSelectedIds([]); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'rejected'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'bg-navy-850 text-slate-400 hover:text-white border border-navy-750'
            }`}
          >
            <span>Rejected</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300">
              {rejectedItems.length}
            </span>
          </button>
        </div>

        {/* Batch Operations Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center space-x-2 bg-navy-850 px-3 py-1.5 rounded-xl border border-navy-700 animate-fade-in text-xs">
            <span className="text-slate-300 font-semibold">{selectedIds.length} selected:</span>
            <button
              onClick={() => handleBatch('approve')}
              disabled={isSubmitting}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve All</span>
            </button>
            <button
              onClick={() => handleBatch('reject')}
              disabled={isSubmitting}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject All</span>
            </button>
          </div>
        )}
      </div>

      {/* Review Items Table / Cards */}
      <div className="glass-panel rounded-xl border border-navy-700/80 overflow-hidden">
        {displayedItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-60" />
            <p className="text-sm font-bold text-white">No items in '{activeTab}' category.</p>
            <p className="text-xs text-slate-400 mt-1">All extracted knowledge items have been processed.</p>
          </div>
        ) : (
          <div className="divide-y divide-navy-750">
            {/* Header select all row */}
            <div className="px-6 py-3 bg-navy-950/60 flex items-center justify-between text-xs text-slate-400 font-semibold">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === displayedItems.length && displayedItems.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded bg-navy-800 border-navy-600 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                />
                <span>Select All ({displayedItems.length})</span>
              </div>
              <span>Review Actions</span>
            </div>

            {displayedItems.map(item => {
              const isSelected = selectedIds.includes(item.id);
              const priorityClass = 
                item.priority === 'critical' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
                item.priority === 'high' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                'text-blue-400 bg-blue-500/10 border-blue-500/30';

              return (
                <div key={item.id} className="p-4 sm:px-6 hover:bg-navy-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5 max-w-3xl">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.id)}
                      className="mt-1 rounded bg-navy-800 border-navy-600 text-blue-600 focus:ring-0 w-3.5 h-3.5 flex-shrink-0"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-navy-800 text-slate-300 border border-navy-700">
                          {item.category.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${priorityClass}`}>
                          {item.priority}
                        </span>
                        {item.assignee && (
                          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{item.assignee}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white">
                        {item.title}
                      </h4>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {item.content}
                      </p>

                      {/* Review audit stamp if already reviewed */}
                      {item.reviewed_by && (
                        <div className="pt-1 text-[11px] text-slate-400 flex items-center space-x-2">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Reviewed by <strong className="text-slate-300">{item.reviewed_by}</strong></span>
                          {item.review_notes && (
                            <span className="text-slate-400 italic">" {item.review_notes} "</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side individual actions */}
                  <div className="flex items-center space-x-2 self-end md:self-center">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="px-2.5 py-1 bg-navy-800 hover:bg-navy-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-navy-600 transition-colors"
                      title="Edit item title, text, priority, or assignee"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {item.status !== 'approved' && (
                      <button
                        onClick={() => onUpdateItem(item.id, { status: 'approved', reviewed_by: 'Alex Chen (Reviewer)' })}
                        className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-emerald-500/30 transition-colors"
                        title="Approve item"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {item.status !== 'rejected' && (
                      <button
                        onClick={() => onUpdateItem(item.id, { status: 'rejected', reviewed_by: 'Alex Chen (Reviewer)' })}
                        className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-rose-500/30 transition-colors"
                        title="Reject item"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Drawer Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full p-6 rounded-2xl border border-blue-500/40 shadow-card space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-navy-750">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>Edit Extracted Knowledge Item</span>
              </h3>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Item Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Content / Specification</label>
                <textarea
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as ItemPriority)}
                    className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Owner / Assignee</label>
                  <input
                    type="text"
                    value={editAssignee}
                    onChange={(e) => setEditAssignee(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reviewer Audit Notes</label>
                <input
                  type="text"
                  value={editReviewNotes}
                  onChange={(e) => setEditReviewNotes(e.target.value)}
                  placeholder="e.g. Confirmed against production configs"
                  className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-navy-750 flex items-center justify-end space-x-3">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-slate-300 font-semibold rounded-lg text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-glow-blue transition-all flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save & Approve</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

