import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Link2, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ExternalLink,
  Search,
  Check,
  X,
  Lock,
  Layers
} from 'lucide-react';
import { KnowledgeItem, Document } from '../types';

interface EvidenceCenterProps {
  items: KnowledgeItem[];
  documents: Document[];
  onApproveItem: (itemId: number) => void;
  onRejectItem: (itemId: number) => void;
  onViewDocument: (docId: number) => void;
  selectedItemId?: number | null;
}

export const EvidenceCenter: React.FC<EvidenceCenterProps> = ({
  items,
  documents,
  onApproveItem,
  onRejectItem,
  onViewDocument,
  selectedItemId: initialSelectedId,
}) => {
  const [activeItemId, setActiveItemId] = useState<number | null>(
    initialSelectedId || (items.length > 0 ? items[0].id : null)
  );
  const [filterType, setFilterType] = useState<'all' | 'verified' | 'flagged'>('all');

  const filteredItems = items.filter(item => {
    if (filterType === 'verified') return item.evidence_verified;
    if (filterType === 'flagged') return !item.evidence_verified || item.missing_evidence_flag;
    return true;
  });

  const activeItem = items.find(i => i.id === activeItemId) || filteredItems[0] || null;

  // Find linked document
  const linkedDoc = documents.find(d => d.original_name === activeItem?.source_document_name || d.id === activeItem?.document_id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Evidence Integrity Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Evidence Verification & Zero-Hallucination Engine</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Audit Active
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Every extracted statement is string-matched against the parsed document text to guarantee accurate provenance.
            </p>
          </div>
        </div>

        {/* Verification stats summary */}
        <div className="flex items-center space-x-4 text-xs font-medium self-end sm:self-auto">
          <div className="text-right">
            <span className="text-emerald-400 font-bold">
              {items.filter(i => i.evidence_verified).length} / {items.length}
            </span>
            <span className="block text-[10px] text-slate-400">Verified Citations</span>
          </div>
          <div className="text-right">
            <span className="text-amber-400 font-bold">
              {items.filter(i => !i.evidence_verified).length}
            </span>
            <span className="block text-[10px] text-slate-400">Flagged For Review</span>
          </div>
        </div>
      </div>

      {/* Main Dual-Pane Evidence Inspector */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: List of items (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Extracted Knowledge Items ({filteredItems.length})
            </h4>

            {/* Filter Pill */}
            <div className="flex items-center space-x-1 text-[11px] bg-navy-950 p-0.5 rounded-lg border border-navy-750">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 rounded ${filterType === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('verified')}
                className={`px-2 py-0.5 rounded ${filterType === 'verified' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Verified
              </button>
              <button
                onClick={() => setFilterType('flagged')}
                className={`px-2 py-0.5 rounded ${filterType === 'flagged' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Flagged
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-xl border border-navy-700/80 divide-y divide-navy-750 max-h-[600px] overflow-y-auto">
            {filteredItems.map(item => {
              const isSelected = activeItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveItemId(item.id)}
                  className={`p-3.5 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-600/15 border-l-4 border-l-blue-500' 
                      : 'hover:bg-navy-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-navy-850 px-1.5 py-0.5 rounded border border-navy-700">
                      {item.category.replace('_', ' ')}
                    </span>
                    {item.evidence_verified ? (
                      <span className="flex items-center space-x-1 text-[10px] text-emerald-400 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Match {Math.round(item.confidence_score * 100)}%</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-[10px] text-amber-400 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Unverified Quote</span>
                      </span>
                    )}
                  </div>

                  <h5 className="text-xs font-semibold text-white mt-2 line-clamp-1">
                    {item.title}
                  </h5>

                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                    "{item.source_excerpt || 'No excerpt attached'}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Evidence Inspector (7 cols) */}
        <div className="lg:col-span-7">
          {activeItem ? (
            <div className="glass-card p-6 rounded-2xl border border-navy-700/80 space-y-6">
              {/* Header with Verification Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-navy-750 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {activeItem.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                      ID: #{activeItem.id}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1.5">
                    {activeItem.title}
                  </h3>
                </div>

                <div className="self-start sm:self-auto flex items-center space-x-2">
                  {activeItem.evidence_verified ? (
                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verified Evidence ({Math.round(activeItem.confidence_score * 100)}%)</span>
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center space-x-1.5 text-xs font-bold text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Missing / Fuzzy Quote Mismatch</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Extracted Content */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Extracted Knowledge Claim
                </h4>
                <div className="p-3.5 bg-navy-950/80 rounded-xl border border-navy-750 text-xs text-slate-200 leading-relaxed">
                  {activeItem.content}
                </div>
              </div>

              {/* Exact Source Citation Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Link2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Exact Source Excerpt In Document</span>
                  </h4>
                  <span className="text-[11px] text-blue-400 font-mono">
                    {activeItem.source_document_name} • {activeItem.source_page || 'Page 1'}
                  </span>
                </div>

                <div className="p-4 bg-blue-950/20 rounded-xl border border-blue-500/30 text-xs text-slate-200 relative">
                  <blockquote className="border-l-2 border-blue-500 pl-3 italic text-blue-100 font-mono text-[11px]">
                    "{activeItem.source_excerpt}"
                  </blockquote>

                  {/* Warning if mismatch */}
                  {!activeItem.evidence_verified && (
                    <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-300 flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                      <span>
                        This quote could not be verified 100% against the raw document string. Please inspect the source document or edit the quote in the Review Center.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Reference & Inspect Button */}
              {linkedDoc && (
                <div className="p-3 bg-navy-900/60 rounded-xl border border-navy-750 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="font-semibold text-white">{linkedDoc.original_name}</span>
                      <span className="text-[11px] text-slate-400 block">{linkedDoc.page_count} pages • {linkedDoc.file_type.toUpperCase()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onViewDocument(linkedDoc.id)}
                    className="px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-navy-600 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Raw Text</span>
                  </button>
                </div>
              )}

              {/* Reviewer Action Bar */}
              <div className="pt-4 border-t border-navy-750 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Current Status: <strong className="text-white capitalize">{activeItem.status.replace('_', ' ')}</strong>
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onRejectItem(activeItem.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center space-x-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => onApproveItem(activeItem.id)}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 shadow-glow-emerald transition-all flex items-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Verified Item</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl">
              <ShieldCheck className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-50" />
              <p className="text-sm font-semibold">Select an item from the left pane to audit its evidence.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

