export type UserRole = "individual" | "team_lead" | "sre" | "student";
export type UserGoal = "debug_faster" | "learn_errors" | "monitor_team" | "thesis_demo";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  goal: UserGoal;
  company?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}


// ── Workspace ─────────────────────────────────────────────────────────────────

export interface Workspace {
  workspace_id: string;
  created_at: string;
}


// ── Notes ─────────────────────────────────────────────────────────────────────

export interface Note {
  id:         string;
  body:       string;
  created_at: string;
}


// ── Incidents ─────────────────────────────────────────────────────────────────

export type IncidentStatus =
  | "pending"
  | "analyzed"
  | "failed"
  | "quota_exceeded"
  | "configuration_error"
  | "permanently_failed";

export interface Incident {
  id:                   string;
  sqs_message_id:       string;
  workspace_id:         string;
  service_name:         string;
  raw_log:              string;
  status:               IncidentStatus;
  root_cause_analysis?: string;
  actionable_fix?:      string;
  failure_reason?:      string;
  created_at:           string;
  notes:                Note[];
}

export interface IncidentSubmitPayload {
  service_name: string;
  raw_log:      string;
  workspace_id: string;
}


// ── API Responses ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?:    T;
  error?:   string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items:     T[];
  total:     number;
  page:      number;
  page_size: number;
}


// ── Onboarding ────────────────────────────────────────────────────────────────

export interface OnboardingState {
  step:     number;
  name:     string;
  email:    string;
  password: string;
  role:     UserRole | "";
  goal:     UserGoal | "";
  company:  string;
}


// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_incidents: number;
  analyzed:        number;
  failed:          number;
  pending:         number;
  success_rate:    number;
}