import { CitizenProfile, Scheme, SchemeDetail, EligibilityEvaluation, DocumentItem, ActionPlan, ChatMessage } from '../types';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API Error ${res.status}: ${errText}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Request to ${endpoint} failed:`, error);
    throw error;
  }
}

export const api = {
  // Citizen Profile
  async getProfile(): Promise<CitizenProfile> {
    return request<CitizenProfile>('/citizens/profile');
  },

  async updateProfile(profile: Partial<CitizenProfile>): Promise<CitizenProfile> {
    return request<CitizenProfile>('/citizens/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },

  async getStates(): Promise<any[]> {
    return request<any[]>('/citizens/states');
  },

  // Schemes
  async getSchemes(params?: {
    search?: string;
    state?: string;
    level?: string;
    category?: string;
    occupation?: string;
    language?: string;
  }): Promise<Scheme[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.state) query.append('state', params.state);
    if (params?.level) query.append('level', params.level);
    if (params?.category) query.append('category', params.category);
    if (params?.occupation) query.append('occupation', params.occupation);
    if (params?.language) query.append('language', params.language);
    return request<Scheme[]>(`/schemes?${query.toString()}`);
  },

  async getSchemeDetail(id: number, language?: string): Promise<SchemeDetail> {
    const query = language ? `?language=${language}` : '';
    return request<SchemeDetail>(`/schemes/${id}${query}`);
  },

  async saveScheme(id: number): Promise<any> {
    return request(`/schemes/${id}/save`, { method: 'POST' });
  },

  async unsaveScheme(id: number): Promise<any> {
    return request(`/schemes/${id}/save`, { method: 'DELETE' });
  },

  async getSavedSchemes(): Promise<Scheme[]> {
    return request<Scheme[]>('/schemes/user/saved');
  },

  // Eligibility Evaluation
  async evaluateScheme(schemeId: number): Promise<EligibilityEvaluation> {
    return request<EligibilityEvaluation>(`/eligibility/evaluate/${schemeId}`, { method: 'POST' });
  },

  async getEligibilitySummary(): Promise<any> {
    return request<any>('/eligibility/summary');
  },

  // AI Chatbot
  async sendChatMessage(payload: {
    message: string;
    session_uuid?: string;
    language?: string;
    profile_updates?: Partial<CitizenProfile>;
  }): Promise<ChatMessage> {
    return request<ChatMessage>('/chat/message', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getChatHistory(sessionUuid: string): Promise<any> {
    return request(`/chat/history/${sessionUuid}`);
  },

  async clearChat(sessionUuid: string): Promise<any> {
    return request(`/chat/history/${sessionUuid}`, { method: 'DELETE' });
  },

  // Voice Assistant
  async transcribeVoice(payload: {
    audio_base64?: string;
    language: string;
    mock_text?: string;
  }): Promise<{ recognized_text: string; language: string; provider: string }> {
    return request('/voice/transcribe', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Document Checklist
  async getDocumentChecklist(): Promise<{
    checklist: DocumentItem[];
    ready_count: number;
    total_count: number;
    progress_percentage: number;
  }> {
    return request('/documents/checklist');
  },

  async updateDocumentStatus(docName: string, status: string): Promise<any> {
    return request(`/documents/checklist/${encodeURIComponent(docName)}/status?status=${status}`, {
      method: 'POST',
    });
  },

  async demoUploadDocument(docName: string): Promise<any> {
    return request(`/documents/upload-demo?doc_name=${encodeURIComponent(docName)}`, {
      method: 'POST',
    });
  },

  // Action Plans
  async getActionPlans(): Promise<ActionPlan[]> {
    return request<ActionPlan[]>('/action-plans');
  },

  async generateActionPlan(schemeId: number): Promise<ActionPlan> {
    return request<ActionPlan>(`/action-plans/generate/${schemeId}`, { method: 'POST' });
  },

  async updateActionStep(stepId: number, isCompleted: boolean): Promise<any> {
    return request(`/action-plans/steps/${stepId}?is_completed=${isCompleted}`, {
      method: 'PUT',
    });
  },

  // Admin
  async getAdminStats(): Promise<any> {
    return request('/admin/stats');
  },

  async createAdminScheme(data: any): Promise<any> {
    return request('/admin/schemes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAdminScheme(id: number, data: any): Promise<any> {
    return request(`/admin/schemes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminScheme(id: number): Promise<any> {
    return request(`/admin/schemes/${id}`, { method: 'DELETE' });
  },

  async getFeedbacks(): Promise<any[]> {
    return request<any[]>('/admin/feedbacks');
  },

  async submitFeedback(rating: number, comment: string, schemeId?: number): Promise<any> {
    return request(`/admin/feedback?rating=${rating}&comment=${encodeURIComponent(comment)}${schemeId ? `&scheme_id=${schemeId}` : ''}`, {
      method: 'POST',
    });
  },
};
