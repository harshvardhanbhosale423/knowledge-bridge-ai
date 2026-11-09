import React, { useState } from 'react';
import { 
  FolderGit2, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Users, 
  Compass, 
  Activity, 
  ArrowLeft, 
  Trash2, 
  Plus, 
  ChevronRight,
  CheckCircle2,
  Clock,
  Layers,
  Upload
} from 'lucide-react';
import { 
  Project, 
  Document, 
  KnowledgeItem, 
  HandoverReport, 
  ActivityLog, 
  ItemPriority, 
  ReviewStatus 
} from '../types';
import { DocumentUploadCenter } from './DocumentUploadCenter';
import { KnowledgeAnalysisView } from './KnowledgeAnalysisView';
import { EvidenceCenter } from './EvidenceCenter';
import { HumanReviewCenter } from './HumanReviewCenter';
import { HandoverGenerator } from './HandoverGenerator';

interface ProjectWorkspaceProps {
  project: Project;
  onBack: () => void;
  documents: Document[];
  items: KnowledgeItem[];
  handover: HandoverReport | null;
  activities: ActivityLog[];
  onUploadDocument: (file: File, autoAnalyze: boolean) => Promise<void>;
  onDeleteDocument: (docId: number) => Promise<void>;
  onViewDocument: (docId: number) => void;
  onTriggerAnalysis: (docId?: number) => Promise<void>;
  isAnalyzing: boolean;
  onApproveItem: (itemId: number) => Promise<void>;
  onRejectItem: (itemId: number) => Promise<void>;
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
  onGenerateHandover: (title?: string, summary?: string) => Promise<void>;
  onApproveHandover: (approvedBy: string, signatureNotes?: string) => Promise<void>;
  isGeneratingHandover: boolean;
  onDeleteProject: (projectId: number) => Promise<void>;
  initialTab?: string;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  project,
  onBack,
  documents,
  items,
  handover,
  activities,
  onUploadDocument,
  onDeleteDocument,
  onViewDocument,
  onTriggerAnalysis,
  isAnalyzing,
  onApproveItem,
  onRejectItem,
  onUpdateItem,
  onBatchReview,
  onGenerateHandover,
  onApproveHandover,
  isGeneratingHandover,
  onDeleteProject,
  initialTab = 'documents',
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [evidenceSelectedItemId, setEvidenceSelectedItemId] = useState<number | null>(null);

  const pendingCount = items.filter(i => i.status === 'pending_review').length;
  const approvedCount = items.filter(i => i.status === 'approved').length;

  const navigateToEvidence = (item: KnowledgeItem) => {
    setEvidenceSelectedItemId(item.id);
    setActiveTab('evidence');
  };

  const tabs = [
    { id: 'documents', label: '1. Documents & Upload', icon: Upload, count: documents.length },
    { id: 'analysis', label: '2. AI Extraction', icon: Sparkles, count: items.length },
    { id: 'evidence', label: '3. Evidence Center', icon: ShieldCheck, count: items.filter(i => i.evidence_verified).length },
    { id: 'review', label: '4. Human Review', icon: Users, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'handover', label: '5. Handover Package', icon: Compass, certified: handover?.status === 'approved' },
    { id: 'activity', label: 'Audit Trail', icon: Activity, count: activities.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects Overview</span>
        </button>

        <button
          onClick={() => {
            if (confirm(`Are you sure you want to delete project '${project.title}'? This cannot be undone.`)) {
              onDeleteProject(project.id);
            }
          }}
          className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Workspace</span>
        </button>
      </div>

      {/* Project Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-navy-700/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30">
                {project.code}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {project.title}
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              {project.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center space-x-2 self-start md:self-auto">
            {handover?.status === 'approved' ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Handover Approved & Certified</span>
              </span>
            ) : project.handover_status === 'under_review' ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center space-x-1.5">
                <Clock className="w-4 h-4" />
                <span>Review In Progress</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 flex items-center space-x-1.5">
                <Layers className="w-4 h-4" />
                <span>Active Knowledge Workspace</span>
              </span>
            )}
          </div>
        </div>

        {/* Project Metadata Ribbon */}
        <div className="pt-3 border-t border-navy-750 flex flex-wrap items-center gap-6 text-xs text-slate-400">
          <div>Technical Lead: <strong className="text-slate-200">{project.lead_name}</strong></div>
          <div>Department: <strong className="text-slate-200">{project.department}</strong></div>
          <div>Documents: <strong className="text-slate-200">{documents.length}</strong></div>
          <div>Knowledge Items: <strong className="text-slate-200">{items.length}</strong></div>
          <div>Approved Items: <strong className="text-emerald-400 font-bold">{approvedCount}</strong></div>
          {pendingCount > 0 && (
            <div className="text-amber-300 font-bold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{pendingCount} Pending Review</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Navigation Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-2 border-b border-navy-750 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-glow-blue'
                  : 'bg-navy-850/80 text-slate-400 hover:text-white hover:bg-navy-800 border border-navy-750'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== null && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-navy-950">
                  {tab.badge}
                </span>
              )}
              {tab.certified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Workspace Tab Contents */}
      <div className="mt-4">
        {activeTab === 'documents' && (
          <DocumentUploadCenter
            projectId={project.id}
            documents={documents}
            onUpload={onUploadDocument}
            onDeleteDocument={onDeleteDocument}
            onViewDocument={onViewDocument}
            onTriggerAnalysis={onTriggerAnalysis}
            isAnalyzing={isAnalyzing}
          />
        )}

        {activeTab === 'analysis' && (
          <KnowledgeAnalysisView
            items={items}
            onApproveItem={onApproveItem}
            onRejectItem={onRejectItem}
            onEditItem={(item) => {
              setActiveTab('review');
            }}
            onNavigateToEvidence={navigateToEvidence}
          />
        )}

        {activeTab === 'evidence' && (
          <EvidenceCenter
            items={items}
            documents={documents}
            onApproveItem={onApproveItem}
            onRejectItem={onRejectItem}
            onViewDocument={onViewDocument}
            selectedItemId={evidenceSelectedItemId}
          />
        )}

        {activeTab === 'review' && (
          <HumanReviewCenter
            projectId={project.id}
            items={items}
            onUpdateItem={onUpdateItem}
            onBatchReview={onBatchReview}
          />
        )}

        {activeTab === 'handover' && (
          <HandoverGenerator
            project={project}
            handover={handover}
            items={items}
            onGenerate={onGenerateHandover}
            onApprove={onApproveHandover}
            isGenerating={isGeneratingHandover}
          />
        )}

        {activeTab === 'activity' && (
          <div className="glass-panel p-6 rounded-2xl border border-navy-700/80 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Project Activity & Audit Log</span>
            </h3>
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400">No activity logged yet.</p>
            ) : (
              <div className="space-y-2">
                {activities.map(a => (
                  <div key={a.id} className="p-3 bg-navy-950 rounded-xl border border-navy-750 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-400 mr-2">{a.action}</span>
                      <span className="text-slate-300">{a.details}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(a.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

