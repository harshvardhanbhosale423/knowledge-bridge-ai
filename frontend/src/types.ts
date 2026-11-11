export type UserRole = 'admin' | 'team_member';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  department: string;
  avatar_color: string;
  created_at: string;
}

export type KnowledgeCategory = 
  | 'decision'
  | 'pending_task'
  | 'responsibility'
  | 'risk_blocker'
  | 'dependency'
  | 'unresolved_question'
  | 'next_action';

export type ItemPriority = 'critical' | 'high' | 'medium' | 'low';

export type ReviewStatus = 'pending_review' | 'approved' | 'rejected' | 'modified';

export interface KnowledgeItem {
  id: number;
  project_id: number;
  document_id?: number | null;
  category: KnowledgeCategory;
  title: string;
  content: string;
  priority: ItemPriority;
  assignee?: string | null;
  status: ReviewStatus;
  review_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  source_document_name?: string | null;
  source_page?: string | null;
  source_excerpt?: string | null;
  evidence_verified: boolean;
  missing_evidence_flag: boolean;
  confidence_score: number;
  is_ai_generated: boolean;
  is_demo_mode: boolean;
  ai_provider: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  project_id: number;
  filename: string;
  original_name: string;
  file_type: 'pdf' | 'docx' | 'txt' | string;
  file_size: number;
  page_count: number;
  char_count: number;
  is_processed: boolean;
  upload_timestamp: string;
}

export interface Project {
  id: number;
  title: string;
  code: string;
  description?: string | null;
  department: string;
  lead_name: string;
  status: 'active' | 'archived';
  handover_status: 'not_started' | 'draft' | 'under_review' | 'approved';
  created_at: string;
  updated_at: string;
  document_count: number;
  item_count: number;
  pending_review_count: number;
  approved_count: number;
  has_approved_handover: boolean;
}

export interface HandoverReport {
  id: number;
  project_id: number;
  title: string;
  version: string;
  executive_summary?: string | null;
  status: 'draft' | 'under_review' | 'approved';
  approved_by?: string | null;
  approved_at?: string | null;
  stats_json: string;
  markdown_content: string;
  generated_at: string;
}

export interface ActivityLog {
  id: number;
  project_id?: number | null;
  user_name: string;
  action: string;
  details?: string | null;
  timestamp: string;
}

export interface DashboardStats {
  total_projects: int_or_number;
  uploaded_documents: number;
  pending_reviews: number;
  approved_handovers: number;
  critical_risks: number;
  total_extracted_items: number;
  demo_mode_active: boolean;
  configured_ai_provider: string;
  estimated_monthly_cost?: string;
  is_zero_budget?: boolean;
  quota_status?: string;
}

type int_or_number = number;

export interface AIProviderConfig {
  has_key: boolean;
  model_id?: string;
  provider: string;
  key_masked: string;
  is_demo_mode: boolean;
  is_free_tier?: boolean;
  billing_enabled?: boolean;
  estimated_monthly_cost?: string;
  quota_status?: string;
  last_quota_response?: string;
  fallback_reason?: string | null;
  zero_budget_guarantee?: string;
  live_ai_status?: string;
  live_ai_message?: string;
}

export interface BackupRecord {
  id: number;
  filename: string;
  backup_type: string;
  file_size: number;
  record_counts_json: string;
  sha256_checksum: string;
  status: string;
  created_by: string;
  created_at: string;
}

export interface BackupValidationResult {
  valid: boolean;
  format_version?: string;
  created_at?: string;
  project_count?: number;
  document_count?: number;
  knowledge_item_count?: number;
  handover_report_count?: number;
  activity_log_count?: number;
  computed_sha256?: string;
  manifest_sha256?: string;
  checksum_matched?: boolean;
  errors?: string[];
}

export interface BackupRestoreResult {
  message: string;
  pre_restore_backup?: string;
  restored_counts?: Record<string, number>;
  restored_by?: string;
  restored_at?: string;
}


