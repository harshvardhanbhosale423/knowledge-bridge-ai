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
import { BackupRestoreCenter } from './components/BackupRestoreCenter';
import { CreateProjectModal } from './components/CreateProjectModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginPage } from './components/LoginPage';
import { ReportModal } from './components/ReportModal';
import { 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  FolderGit2, 
  ShieldCheck, 
  UserCheck, 
  HardDrive, 
  Printer, 
  Sparkles,
  Compass
} from 'lucide-react';
import { useTheme } from './context/ThemeContext';

export function App() {
  const { theme } = useTheme();
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

  // Modals & Overlays
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
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
    if (!selectedProjectId) return;
    try {
      await api.deleteDocument(docId);
      showToast('Document deleted successfully');
      await loadProjectWorkspace(selectedProjectId);
      await loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete document', 'error');
    }
  };

  // Document viewer modal trigger
  const handleViewDocument = async (docId: number) => {
    try {
      const details = await api.fetchDocumentDetails(docId);
      setViewerDoc(details);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch document text', 'error');
    }
  };

  // AI Analysis trigger
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

  // Single Item Approval
  const handleApproveItem = async (itemId: number) => {
    if (!selectedProjectId) return;
    try {
      await api.updateKnowledgeItem(itemId, {
        status: 'approved',
        reviewed_by: userName || 'Admin Reviewer',
        review_notes: 'Approved via Knowledge Bridge Command Center.'
      });
      showToast('Knowledge item approved');
      await loadProjectWorkspace(selectedProjectId);
      await loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve item', 'error');
    }
  };

  // Single Item Rejection
  const handleRejectItem = async (itemId: number) => {
    if (!selectedProjectId) return;
    try {
      await api.updateKnowledgeItem(itemId, {
        status: 'rejected',
        reviewed_by: userName || 'Admin Reviewer',
        review_notes: 'Rejected by human reviewer.'
      });
      showToast('Knowledge item rejected');
      await loadProjectWorkspace(selectedProjectId);
      await loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject item', 'error');
    }
  };

  // Knowledge Item Edit
  const handleUpdateItem = async (itemId: number, data: any) => {
    if (!selectedProjectId) return;
    try {
      await api.updateKnowledgeItem(itemId, {
        ...data,
        status: 'modified',
        reviewed_by: userName || 'Admin Reviewer'
      });
      showToast('Knowledge item updated and marked as modified');
      await loadProjectWorkspace(selectedProjectId);
      await loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update item', 'error');
    }
  };

  // Batch Review Items
  const handleBatchReview = async (itemIds: number[], action: 'approve' | 'reject') => {
    if (!selectedProjectId) return;
    try {
      const res = await api.batchReviewItems(
        selectedProjectId,
        itemIds,
        action,
        userName || 'Admin Reviewer'
      );
      showToast(res.message);
      await loadProjectWorkspace(selectedProjectId);
      await loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete batch review', 'error');
    }
  };

  // Generate Handover
  const handleGenerateHandover = async (title?: string, summary?: string) => {
    if (!selectedProjectId) return;
    try {
      setIsGeneratingHandover(true);
      const report = await api.generateHandover(selectedProjectId, {
        title,
        executive_summary: summary
      });
      setProjectHandover(report);
      showToast('Handover package compiled successfully');
      await loadProjectWorkspace(selectedProjectId);
      await loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Failed to generate handover', 'error');
    } finally {
      setIsGeneratingHandover(false);
    }
  };

  // Approve and Certify Handover
  const handleApproveHandover = async (approvedBy: string, signatureNotes?: string) => {
    if (!selectedProjectId) return;
    try {
      const res = await api.approveHandover(selectedProjectId, approvedBy, signatureNotes);
      showToast('Handover report certified and locked for incoming team members!');
      await loadProjectWorkspace(selectedProjectId);
      await loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve handover', 'error');
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
      const created = await api.createProject(data);
      showToast(`Created repository ${created.code}: ${created.title}`);
      await loadInitialData();
      setSelectedProjectId(created.id);
      setCurrentTab('workspace');
    } catch (err: any) {
      showToast(err.message || 'Failed to create project', 'error');
    }
  };

  // Delete Project
  const handleDeleteProject = async (projectId: number) => {
    try {
      await api.deleteProject(projectId);
      showToast('Project deleted successfully');
      await loadInitialData();
      setSelectedProjectId(null);
      setCurrentTab('admin');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete project', 'error');
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || (projects.length > 0 ? projects[0] : null);

  // If user opened the full authentication portal
  if (isAuthOpen) {
    return (
      <LoginPage
        onSuccess={(role, name) => {
          setIsAuthenticated(true);
          setUserRole(role);
          setUserName(name);
          setIsAuthOpen(false);
          showToast(`Authenticated as ${role === 'admin' ? 'Administrator' : 'Team Member'} (${name})`);
          loadInitialData();
          setCurrentTab(role === 'admin' ? 'admin' : 'team');
        }}
        onCancel={() => setIsAuthOpen(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060B17] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className={`flex items-center space-x-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border text-xs font-semibold ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
          }`}>
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Top Header Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        setUserRole={setUserRole}
        aiConfig={aiConfig}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isAuthenticated={isAuthenticated}
        userName={userName}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Main Dynamic Viewport */}
      <main className="flex-1 pb-20">
        {currentTab === 'landing' && (
          <LandingPage
            onGetStarted={() => {
              if (isAuthenticated && userRole === 'admin') {
                setCurrentTab('admin');
              } else if (isAuthenticated && userRole === 'team_member') {
                setCurrentTab('team');
              } else {
                setIsAuthOpen(true);
              }
            }}
            onExploreProjects={() => {
              if (isAuthenticated) {
                if (projects.length > 0) {
                  setSelectedProjectId(projects[0].id);
                  setCurrentTab('workspace');
                } else {
                  setCurrentTab(userRole === 'admin' ? 'admin' : 'team');
                }
              } else {
                setIsAuthOpen(true);
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
            onNavigateToTab={(tab) => setCurrentTab(tab)}
            onOpenReportModal={() => setIsReportModalOpen(true)}
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-glow-blue"
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

        {currentTab === 'backup' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BackupRestoreCenter
              onRefreshData={loadInitialData}
              onShowToast={showToast}
            />
          </div>
        )}
      </main>

      {/* Floating Anti-Scroll Quick Action Dock */}
      <aside aria-label="Quick Actions Dock" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-navy-900/95 backdrop-blur-xl border border-slate-300 dark:border-navy-750/90 rounded-2xl px-3 py-1.5 shadow-2xl flex items-center space-x-1.5 transition-all">
        <button
          onClick={() => setCurrentTab('landing')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
            currentTab === 'landing'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-navy-800'
          }`}
          title="Overview Landing Page"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Overview</span>
        </button>

        <button
          onClick={() => setCurrentTab('admin')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
            currentTab === 'admin'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-navy-800'
          }`}
          title="Admin Command Center"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        <button
          onClick={() => setCurrentTab('workspace')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
            currentTab === 'workspace' || currentTab === 'projects'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-navy-800'
          }`}
          title="Project Workspace"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-cyan-500" />
          <span className="hidden sm:inline">Workspace</span>
        </button>

        <button
          onClick={() => setCurrentTab('team')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
            currentTab === 'team'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-navy-800'
          }`}
          title="Team Member Handover View"
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden sm:inline">Team</span>
        </button>

        {userRole === 'admin' && (
          <button
            onClick={() => setCurrentTab('backup')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              currentTab === 'backup'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-navy-800'
            }`}
            title="Backup & Recovery Center"
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Backup</span>
          </button>
        )}

        <div className="w-[1px] h-4 bg-slate-300 dark:bg-navy-750 mx-1" />

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 flex items-center space-x-1.5 shadow-md transition-all transform hover:-translate-y-0.5"
          title="Download 20-Section Black & White PDF Report"
        >
          <Printer className="w-3.5 h-3.5 text-white dark:text-slate-950" />
          <span className="hidden md:inline">PDF Report</span>
        </button>
      </aside>

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
        onOpenBackupCenter={() => setCurrentTab('backup')}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onShowToast={showToast}
        project={selectedProject}
      />
    </div>
  );
}

export default App;
