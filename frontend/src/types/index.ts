export type SupportedLanguage = 'en' | 'kn' | 'hi' | 'ta' | 'te' | 'ml' | 'mr' | 'bn';

export interface CitizenProfile {
  id?: number;
  user_id?: number;
  age?: number | null;
  gender?: string | null;
  state?: string | null;
  district?: string | null;
  residence_type?: string | null;
  occupation?: string | null;
  annual_family_income?: number | null;
  income_range?: string | null;
  social_category?: string | null;
  disability_status?: string | null;
  education_level?: string | null;
  marital_status?: string | null;
  land_holding_acres?: number | null;
  has_bpl_ration_card?: boolean | null;
  completion_percentage?: number;
}

export interface SchemeRule {
  id: number;
  field: string;
  operator: string;
  value: string;
  description: string;
  is_mandatory: boolean;
}

export interface SchemeDocument {
  id: number;
  document_name: string;
  description?: string;
  is_mandatory: boolean;
  issuing_authority?: string;
}

export interface SchemeSource {
  id: number;
  title: string;
  url: string;
  source_type: string;
  last_verified: string;
}

export interface Scheme {
  id: number;
  code: string;
  name: string;
  authority: string;
  level: string;
  applicable_state?: string;
  category: string;
  target_beneficiaries: string;
  short_description: string;
  benefits: string;
  financial_benefit_amount?: number;
  official_apply_url?: string;
  official_source_url?: string;
  last_verified_date: string;
  is_demo_data: boolean;
  translated_name?: string;
  translated_short_description?: string;
  translated_benefits?: string;
  eligibility_status?: 'PASSED' | 'FAILED' | 'UNKNOWN' | null;
}

export interface SchemeDetail extends Scheme {
  full_description: string;
  application_procedure?: string;
  important_conditions?: string;
  rules: SchemeRule[];
  documents: SchemeDocument[];
  sources: SchemeSource[];
}

export interface CriterionResult {
  field: string;
  description: string;
  status: 'PASSED' | 'FAILED' | 'UNKNOWN';
  user_value?: any;
  required_value: string;
  explanation: string;
}

export interface EligibilityEvaluation {
  scheme_id: number;
  scheme_name: string;
  overall_status: 'PASSED' | 'FAILED' | 'UNKNOWN';
  passed_criteria: CriterionResult[];
  failed_criteria: CriterionResult[];
  unknown_criteria: CriterionResult[];
  missing_fields: string[];
  summary_explanation: string;
  next_steps: string;
  disclaimer?: string;
}

export interface DocumentItem {
  name: string;
  reason: string;
  category: string;
  is_mandatory: boolean;
  status: 'READY' | 'IN_PROGRESS' | 'NOT_READY';
  is_uploaded: boolean;
}

export interface ActionPlanStep {
  id: number;
  step_number: number;
  title: string;
  description: string;
  is_completed: boolean;
  action_url?: string;
  action_label?: string;
}

export interface ActionPlan {
  id: number;
  scheme_id: number;
  scheme_name: string;
  status: string;
  progress_percentage: number;
  steps: ActionPlanStep[];
}

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language: string;
  audio_url?: string | null;
  recommended_schemes?: any[];
  eligibility_breakdowns?: any[];
  missing_fields?: string[];
  suggested_questions?: string[];
  created_at?: string;
}
