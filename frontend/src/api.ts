import {
  Project, Document, KnowledgeItem, HandoverReport,
  ActivityLog, DashboardStats, AIProviderConfig,
  KnowledgeCategory, ItemPriority, ReviewStatus
} from './types';

const API_BASE = '/api';

let activeUserRole: 'admin' | 'team_member' = 'admin';

export function setActiveUserRole(role: 'admin' | 'team_member') {
  activeUserRole = role;
  try {
    localStorage.setItem('kb_role', role);
  } catch (e) {}
}

export function getActiveUserRole(): 'admin' | 'team_member' {
  try {
    const saved = localStorage.getItem('kb_role');
    if (saved === 'team_member' || saved === 'admin') return saved;
  } catch (e) {}
  return activeUserRole;
}

export function getAuthToken(): string | null {
  try {
    const role = getActiveUserRole();
    return sessionStorage.getItem(`kb_token_${role}`) || localStorage.getItem(`kb_token_${role}`);
  } catch (e) {
    return null;
  }
}

export function setAuthToken(role: 'admin' | 'team_member', token: string) {
  try {
    sessionStorage.setItem(`kb_token_${role}`, token);
    localStorage.setItem(`kb_token_${role}`, token);
  } catch (e) {}
}

export function clearAuthToken(role?: 'admin' | 'team_member') {
  try {
    if (role) {
      sessionStorage.removeItem(`kb_token_${role}`);
      localStorage.removeItem(`kb_token_${role}`);
    } else {
      sessionStorage.removeItem('kb_token_admin');
      sessionStorage.removeItem('kb_token_team_member');
      localStorage.removeItem('kb_token_admin');
      localStorage.removeItem('kb_token_team_member');
    }
  } catch (e) {}
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export async function authenticateSession(
  role: 'admin' | 'team_member',
  credential: string,
  email?: string
): Promise<{ access_token: string; role: string; user_name: string; email: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email || (role === 'admin' ? 'alex.chen@knowledgebridge.internal' : 'elena.rostova@knowledgebridge.internal'),
      role: role,
      credential: credential.trim()
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Authentication failed: Invalid credentials.');
  }
  const data = await res.json();
  const token = data.access_token || data.token;
  if (token) {
    setAuthToken(role, token);
    setActiveUserRole(role);
    return data;
  }
  throw new Error('No access token returned from authentication server');
}

export async function checkAuthStatus(): Promise<{ role: string; user_name: string; email: string } | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function logout(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Logout could not be confirmed server-side. Please retry.');
  }
  clearAuthToken();
}

function getHeaders(custom: Record<string, string> = {}): Record<string, string> {
  const role = getActiveUserRole();
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'X-User-Role': role,
    ...custom,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/stats`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export async function fetchAIConfig(): Promise<AIProviderConfig> {
  const res = await fetch(`${API_BASE}/ai/config`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch AI configuration');
  return res.json();
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function fetchProject(id: number): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch project details');
  return res.json();
}

export async function createProject(data: {
  title: string;
  code: string;
  description?: string;
  department?: string;
  lead_name?: string;
}): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create project');
  }
  return res.json();
}

export async function deleteProject(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete project');
  }
}

export async function fetchProjectDocuments(projectId: number): Promise<Document[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/documents`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch project documents');
  return res.json();
}

export async function fetchDocumentDetails(documentId: number): Promise<{
  id: number;
  project_id: number;
  original_name: string;
  file_type: string;
  file_size: number;
  page_count: number;
  char_count: number;
  extracted_text: string;
  upload_timestamp: string;
}> {
  const res = await fetch(`${API_BASE}/documents/${documentId}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch document text');
  return res.json();
}

export async function uploadDocument(
  projectId: number,
  file: File,
  autoAnalyze: boolean = true
): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);

  const role = getActiveUserRole();
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'X-User-Role': role
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/projects/${projectId}/documents/upload?auto_analyze=${autoAnalyze}`, {
    method: 'POST',
    headers,
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to upload document');
  }
  return res.json();
}

export async function deleteDocument(documentId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${documentId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete document');
  }
}

export async function triggerAnalysis(projectId: number, documentId?: number): Promise<{
  message: string;
  items_count: number;
  is_demo_mode: boolean;
  provider: string;
}> {
  const url = documentId
    ? `${API_BASE}/projects/${projectId}/analyze?document_id=${documentId}`
    : `${API_BASE}/projects/${projectId}/analyze`;

  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to run AI analysis');
  }
  return res.json();
}

export async function fetchKnowledgeItems(
  projectId: number,
  params?: {
    category?: string;
    status?: string;
    priority?: string;
    search?: string;
  }
): Promise<KnowledgeItem[]> {
  const query = new URLSearchParams();
  if (params?.category) query.append('category', params.category);
  if (params?.status) query.append('status', params.status);
  if (params?.priority) query.append('priority', params.priority);
  if (params?.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/projects/${projectId}/knowledge-items?${query.toString()}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch knowledge items');
  return res.json();
}

export async function updateKnowledgeItem(
  itemId: number,
  data: {
    title?: string;
    content?: string;
    priority?: ItemPriority;
    assignee?: string;
    status?: ReviewStatus;
    review_notes?: string;
    reviewed_by?: string;
  }
): Promise<KnowledgeItem> {
  const res = await fetch(`${API_BASE}/knowledge-items/${itemId}`, {
    method: 'PATCH',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update knowledge item');
  return res.json();
}

export async function batchReviewItems(
  projectId: number,
  itemIds: number[],
  action: 'approve' | 'reject',
  reviewerName: string = 'Admin Reviewer',
  reviewNotes?: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/batch-review`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      item_ids: itemIds,
      action,
      reviewer_name: reviewerName,
      review_notes: reviewNotes
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to batch review items');
  }
  return res.json();
}

export async function generateHandover(
  projectId: number,
  data?: { title?: string; executive_summary?: string }
): Promise<HandoverReport> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/generate-handover`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ project_id: projectId, ...data })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to generate handover report');
  }
  return res.json();
}

export async function approveHandover(
  projectId: number,
  approvedBy: string,
  signatureNotes?: string
): Promise<{ message: string; report_id: number; status: string; approved_by: string; approved_at: string }> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/approve-handover`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ approved_by: approvedBy, signature_notes: signatureNotes })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to approve handover report');
  }
  return res.json();
}

export async function fetchLatestHandover(projectId: number): Promise<HandoverReport> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/handover`, {
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No handover report found');
  }
  return res.json();
}

export async function fetchActivities(limit: number = 25): Promise<ActivityLog[]> {
  const res = await fetch(`${API_BASE}/activities?limit=${limit}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch activity logs');
  return res.json();
}

export async function fetchProjectActivities(projectId: number, limit: number = 25): Promise<ActivityLog[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/activities?limit=${limit}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch project activity logs');
  return res.json();
}
