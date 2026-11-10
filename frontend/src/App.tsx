import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  Project, 
  Document, 
  KnowledgeItem, 
  HandoverReport, 
  ActivityLog, 
  DashboardStats, 
  AIProviderConfig,
  ItemPriority,
  ReviewStatus
} from './types';
import * as api from './api';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { TeamMemberDashboard } from './components/TeamMemberDashboard';
import { CreateProjectModal } from './components/CreateProjectModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [userRole, setUserRole] = useState<UserRole>(api.getActiveUserRole());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(api.isAuthenticated());
  const [userName, setUserName] = useState<string>('User');
  
  // App data state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [aiConfig, setAiConfig] = useState<AIProviderConfig | null>(null);

  // Active workspace state
  const [projectDocuments, setProjectDocuments] = useState<Document[]>([]);
  const [projectItems, setProjectItems] = useState<KnowledgeItem[]>([]);
  const [projectHandover, setProjectHandover] = useState<HandoverReport | null>(null);
  const [projectActivities, setProjectActivities] = useState<ActivityLog[]>([]);
  const [workspaceInitialTab, setWorkspaceInitialTab] = useState<string>('documents');

  // Loading & UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGeneratingHandover, setIsGeneratingHandover] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const sessionUser = await api.checkAuthStatus();
      if (sessionUser) {
        setIsAuthenticated(true);
        setUserName(sessionUser.user_name);
        setUserRole(sessionUser.role as UserRole);
      }

      const [statsData, projectsData, activitiesData, configData] = await Promise.all([
        api.fetchStats().catch(() => null),
        api.fetchProjects().catch(() => []),
        api.fetchActivities().catch(() => []),
        api.fetchAIConfig().catch(() => null),
      ]);

      setStats(statsData);
      setProjects(projectsData);
      setActivities(activitiesData);
      setAiConfig(configData);

      // Select first project by default if available
      if (projectsData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsData[0].id);
      }
    } catch (err: any) {
      console.error('Initial load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setIsAuthenticated(false);
      setStats(null);
      setProjects([]);
      setActivities([]);
      showToast('Signed out of session. Enterprise authentication required to access records.');
    } catch (err: any) {
      showToast(err.message || 'Logout could not be confirmed server-side. Please retry.', 'error');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Load project workspace details whenever selectedProjectId changes
  const loadProjectWorkspace = async (projId: number) => {
    try {
      const [docs, items, handover, acts] = await Promise.all([
        api.fetchProjectDocuments(projId).catch(() => []),
        api.fetchKnowledgeItems(projId).catch(() => []),
        api.fetchLatestHandover(projId).catch(() => null),
        api.fetchProjectActivities(projId).catch(() => []),
      ]);

      setProjectDocuments(docs);
      setProjectItems(items);
      setProjectHandover(handover);
      setProjectActivities(acts);
    } catch (err: any) {
      console.error('Workspace load error:', err);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectWorkspace(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Handler for opening project from dashboard
  const handleSelectProject = (projectId: number, defaultTab: string = 'documents') => {
    setSelectedProjectId(projectId);
    setWorkspaceInitialTab(defaultTab);
    setCurrentTab(userRole === 'team_member' ? 'team' : 'workspace');
  };

  // Document upload handler
  const handleUploadDocument = async (file: File, autoAnalyze: boolean) => {
    if (!selectedProjectId) return;
    try {
      const doc = await api.uploadDocument(selectedProjectId, file, autoAnalyze);
      showToast(`Uploaded ${file.name} successfully`);
      await loadProjectWorkspace(selectedProjectId);
      await loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
      throw err;
    }
  };

  // Document deletion handler
  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.deleteDocument(docId);
      showToast('Document removed');
      if (selectedProjectId) {
        await loadProjectWorkspace(selectedProjectId);
        await loadInitialData();
      }
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  // Inspect raw document text
  const handleViewDocument = async (docId: number) => {
    try {
      const details = await api.fetchDocumentDetails(docId);
      setViewerDoc(details);
    } catch (err: any) {
      showToast('Failed to load document text', 'error');
    }
  };

  // Trigger AI extraction
  const handleTriggerAnalysis = async (docId?: number) => {
    if (!selectedProjectId) return;
    try {
      setIsAnalyzing(true);
      const res = await api.triggerAnalysis(selectedProjectId, docId);
      showToast(res.message);
      await loadProjectWorkspace(selectedProjectId);
      await loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Analysis failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Knowledge item approve
  const handleApproveItem = async (itemId: number) => {
    try {
      await api.updateKnowledgeItem(itemId, { 
        status: 'approved', 
        reviewed_by: userRole === 'admin' ? 'Alex Chen (Admin)' : 'Team Reviewer'
      });
      showToast('Item approved and verified');
      if (selectedProjectId) {
        await loadProjectWorkspace(selectedProjectId);
        await loadInitialData();
      }
    } catch (err: any) {
      showToast('Failed to approve item', 'error');
    }
  };

  // Knowledge item reject
  const handleRejectItem = async (itemId: number) => {
    try {
      await api.updateKnowledgeItem(itemId, { 
        status: 'rejected', 
        reviewed_by: userRole === 'admin' ? 'Alex Chen (Admin)' : 'Team Reviewer'
      });
      showToast('Item rejected');
      if (selectedProjectId) {
        await loadProjectWorkspace(selectedProjectId);
        await loadInitialData();
      }
    } catch (err: any) {
      showToast('Failed to reject item', 'error');
    }
  };

  // Update item
  const handleUpdateItem = async (itemId: number, data: {
    title?: string;
    content?: string;
    priority?: ItemPriority;
    assignee?: string;
    status?: ReviewStatus;
    review_notes?: string;
    reviewed_by?: string;
  }) => {
    try {
      await api.updateKnowledgeItem(itemId, data);
      showToast('Knowledge item updated');
      if (selectedProjectId) {
        await loadProjectWorkspace(selectedProjectId);
        await loadInitialData();
      }
    } catch (err: any) {
      showToast('Failed to update item', 'error');
      throw err;
    }
  };

  // Batch review
  const handleBatchReview = async (itemIds: number[], action: 'approve' | 'reject') => {
    if (!selectedProjectId) return;
    try {
      const res = await api.batchReviewItems(
        selectedProjectId,
        itemIds,
        action,
        userRole === 'admin' ? 'Alex Chen (Admin Reviewer)' : 'Elena Rostova (Team)'
      );
      showToast(res.message);
      await loadProjectWorkspace(selectedProjectId);
      await loadInitialData();
    } catch (err: any) {
      showToast('Batch action failed', 'error');
      throw err;
    }
  };

  // Generate Handover
  const handleGenerateHandover = async (title?: string, summary?: string) => {
    if (!selectedProjectId) return;
    try {
      setIsGeneratingHandover(true);
      const report = await api.generateHandover(selectedProjectId, { title, executive_summary: summary });
      setProjectHandover(report);
      showToast(`Handover package v${report.version} generated`);
      await loadProjectWorkspace(selectedProjectId);
      await loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Failed to generate handover', 'error');
    } finally {
      setIsGeneratingHandover(false);
    }
  };

  // Approve Handover
  const handleApproveHandover = async (approvedBy: string, signatureNotes?: string) => {
    if (!selectedProjectId) return;
    try {
      const res = await api.approveHandover(selectedProjectId, approvedBy, signatureNotes);
      showToast(res.message);
      await loadProjectWorkspace(selectedProjectId);
      await loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
      throw err;
    }
  };

  // Create Project
  const handleCreateProject = async (data: {
    title: string;
    code: string;
    description?: string;
    department?: string;
    lead_name?: string;
  }) => {
    try {
      const newProj = await api.createProject(data);
      showToast(`Created workspace: ${newProj.title}`);
      await loadInitialData();
      setSelectedProjectId(newProj.id);
      setCurrentTab('workspace');
    } catch (err: any) {
      showToast(err.message || 'Failed to create project', 'error');
      throw err;
    }
  };

  // Delete Project
  const handleDeleteProject = async (projId: number) => {
    try {
      await api.deleteProject(projId);
      showToast('Project deleted');
      await loadInitialData();
      setSelectedProjectId(null);
      setCurrentTab('admin');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete project', 'error');
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || (projects.length > 0 ? projects[0] : null);

  return (
    <div className="min-h-screen bg-[#060B17] text-slate-100 flex flex-col font-sans">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className={`px-4 py-3 rounded-xl border shadow-card flex items-center space-x-2.5 text-xs font-semibold ${
            toastMessage.type === 'success'
              ? 'bg-navy-900 text-emerald-300 border-emerald-500/40'
              : 'bg-navy-900 text-rose-300 border-rose-500/40'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        setUserRole={(role) => {
          setUserRole(role);
          api.setActiveUserRole(role);
          if (role === 'team_member') {
            setCurrentTab('team');
          } else if (currentTab === 'team') {
            setCurrentTab('admin');
          }
        }}
        aiConfig={aiConfig}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isAuthenticated={isAuthenticated}
        userName={userName}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Tab Routing */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <LandingPage
            onGetStarted={() => {
              if (!isAuthenticated) {
                setIsAuthOpen(true);
              } else {
                setCurrentTab(userRole === 'admin' ? 'admin' : 'team');
              }
            }}
            onExploreProjects={() => {
              if (!isAuthenticated) {
                setIsAuthOpen(true);
              } else if (projects.length > 0) {
                setSelectedProjectId(projects[0].id);
                setCurrentTab('workspace');
              } else {
                setCurrentTab(userRole === 'admin' ? 'admin' : 'team');
              }
            }}
            aiConfig={aiConfig}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            stats={stats}
            projects={projects}
            activities={activities}
            onSelectProject={handleSelectProject}
            onOpenCreateProject={() => setIsCreateProjectOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            loading={loading}
          />
        )}

        {(currentTab === 'workspace' || currentTab === 'projects') && (
          selectedProject ? (
            <ProjectWorkspace
              project={selectedProject}
              onBack={() => setCurrentTab('admin')}
              documents={projectDocuments}
              items={projectItems}
              handover={projectHandover}
              activities={projectActivities}
              onUploadDocument={handleUploadDocument}
              onDeleteDocument={handleDeleteDocument}
              onViewDocument={handleViewDocument}
              onTriggerAnalysis={handleTriggerAnalysis}
              isAnalyzing={isAnalyzing}
              onApproveItem={handleApproveItem}
              onRejectItem={handleRejectItem}
              onUpdateItem={handleUpdateItem}
              onBatchReview={handleBatchReview}
              onGenerateHandover={handleGenerateHandover}
              onApproveHandover={handleApproveHandover}
              isGeneratingHandover={isGeneratingHandover}
              onDeleteProject={handleDeleteProject}
              initialTab={workspaceInitialTab}
            />
          ) : (
            <div className="max-w-md mx-auto py-20 text-center space-y-4">
              <p className="text-slate-400 text-sm">No project selected.</p>
              <button
                onClick={() => setIsCreateProjectOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
              >
                Create First Project
              </button>
            </div>
          )
        )}

        {currentTab === 'team' && (
          <TeamMemberDashboard
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={(id) => setSelectedProjectId(id)}
            items={projectItems}
            handover={projectHandover}
          />
        )}
      </main>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreate={handleCreateProject}
      />

      <DocumentViewerModal
        isOpen={!!viewerDoc}
        onClose={() => setViewerDoc(null)}
        documentDetails={viewerDoc}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        aiConfig={aiConfig}
        onRefreshConfig={async () => {
          const cfg = await api.fetchAIConfig();
          setAiConfig(cfg);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultRole={userRole}
        onSuccess={(role, name) => {
          setIsAuthenticated(true);
          setUserRole(role);
          setUserName(name);
          showToast(`Authenticated as ${role === 'admin' ? 'Administrator' : 'Team Member'} (${name})`);
          loadInitialData();
        }}
      />
    </div>
  );
}

export default App;

