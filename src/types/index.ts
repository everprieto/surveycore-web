// Authentication types
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  roles: string[];
  permissions: string[];
  assigned_projects: string[];
  is_impersonated: boolean;
  impersonated_by_name: string | null;
}

export interface ImpersonateResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Admin types
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  role_id: number | null;
  assignments: AdminAssignment[];
}

export interface AdminAssignment {
  id: number;
  project_code: string;
  start_date: string;
  end_date?: string | null;
}

export interface AssignmentDetail {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  project_code: string;
  start_date: string | null;
  end_date: string | null;
}

export interface PermissionItem {
  id: number;
  code: string;
  description: string;
}

export interface RoleDetail {
  role_id: number;
  role_name: string;
  description: string | null;
  permissions: string[];
  user_count: number;
  is_system: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

// Question types
export interface Question {
  id: number;
  logical_code: string;
  status: string;
  answer_type: string;
  created_at: string;
  published_at?: string;
}

export interface QuestionDetail extends Question {
  translations: QuestionTranslation[];
  options: QuestionOption[];
}

export interface QuestionTranslation {
  id: number;
  master_question_id: number;
  language_code: string;
  question_text: string;
  is_default_language: boolean;
}

export interface QuestionOption {
  id: number;
  master_question_id: number;
  option_text: string;
}

export interface QuestionCreate {
  logical_code: string;
  answer_type: string;
  question_text: string;
  options?: string[];
}

// Project types
export interface Project {
  id: number;
  project_code: string;
  project_name: string;
  client_name: string;
  cost_center: string;
  manager_id: number;
  start_date: string;
  end_date?: string;
  status: string;
}

export interface ProjectPage {
  items: Project[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ProjectsParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface ProjectCreate {
  project_code: string;
  project_name: string;
  client_name: string;
  cost_center: string;
  start_date: string;
  end_date?: string;
  status?: string;
}

// Survey types
export interface Survey {
  id: number;
  project_id: number;
  survey_type: string;
  language_code: string;
  created_by: number;
  created_at: string;
  planned_send_date: string;
  survey_status: string;
}

export interface SurveyCreate {
  project_id: number;
  survey_type: string;
  language_code: string;
  planned_send_date: string;
}

export interface SurveyQuestion {
  id: number;
  survey_id: number;
  master_question_id: number;
  display_order: number;
  is_required: boolean;
}

export interface Recipient {
  id: number;
  survey_id: number;
  recipient_name: string;
  recipient_email: string;
  company: string;
  role: string;
}

export interface RecipientCreate {
  recipient_name: string;
  recipient_email: string;
  company: string;
  role: string;
}

export interface AccessLink {
  id: number;
  survey_id: number;
  recipient_id: number;
  access_token: string;
  status: string;
  created_at: string;
  opened_at?: string;
  completed_at?: string;
}

export interface SurveyConfig {
  survey: Survey;
  questions: SurveyQuestion[];
  recipients: Recipient[];
  access_links: AccessLink[];
}

// Public survey taking
export interface QuestionForSurvey {
  sq_id: number;
  answer_type: string;
  question_text: string;
  options: { id: number; text: string }[];
  is_required: boolean;
}

export interface SurveyTakeData {
  survey_id: number;
  survey_type: string;
  language_code: string;
  access_status: string;
  questions: QuestionForSurvey[];
}

export interface AnswerSubmit {
  sq_id: number;
  answer_value?: string;
  score?: number;
}

export interface SurveySubmitData {
  answers: AnswerSubmit[];
}

// Results types
export interface AnswerResult {
  respondent: string;
  company: string;
  answer?: string;
  score?: number;
  answer_type: string;
}

export interface QuestionResult {
  sq_id: number;
  logical_code: string;
  question_text: string;
  answer_type: string;
  answers: AnswerResult[];
  response_count: number;
}

export interface SurveyResults {
  survey_id: number;
  survey_type: string;
  language_code: string;
  total_sent: number;
  total_completed: number;
  questions: QuestionResult[];
}

export interface ControlTowerRow {
  survey_id: number;
  project_code: string;
  project_name: string;
  manager_name: string;
  survey_type: string;
  language_code: string;
  sent_count: number;
  done_count: number;
  last_response?: string | null;
  survey_status: string;
  planned_send_date?: string | null;
}

export interface ControlTowerTotals {
  total_surveys: number;
  total_projects: number;
  total_sent: number;
  total_completed: number;
}

export interface ControlTowerPage {
  items: ControlTowerRow[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  totals: ControlTowerTotals;
}

export interface ControlTowerParams {
  page?: number;
  page_size?: number;
  search?: string;
  survey_status?: string;
  language_code?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}
