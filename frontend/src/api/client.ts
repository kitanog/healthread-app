import axios from 'axios';
import type {
  User,
  Medication,
  SymptomLog,
  PositiveEffect,
  HealthReport,
  SideEffect,
  AIInsight,
  DashboardData,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  MedicationCreateRequest,
  SymptomLogCreateRequest,
  PositiveEffectCreateRequest,
  ReportCreateRequest,
  UserProfileUpdate,
  ReferenceMedication,
  ReferenceSymptom,
  ReferencePositiveEffect,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('healthread_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('healthread_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH API
// ============================================================

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// ============================================================
// SOURCES API (Read Operations)
// ============================================================

export const sourcesApi = {
  // Dashboard
  getDashboard: async (days: number = 14): Promise<DashboardData> => {
    const response = await api.get(`/sources/dashboard?days=${days}`);
    return response.data;
  },

  // Reference Data
  getReferenceMedications: async (query: string = ''): Promise<ReferenceMedication[]> => {
    const response = await api.get(`/sources/reference/medications?q=${query}`);
    return response.data;
  },

  getReferenceSymptoms: async (query: string = ''): Promise<ReferenceSymptom[]> => {
    const response = await api.get(`/sources/reference/symptoms?q=${query}`);
    return response.data;
  },

  getReferencePositiveEffects: async (query: string = ''): Promise<ReferencePositiveEffect[]> => {
    const response = await api.get(`/sources/reference/positive-effects?q=${query}`);
    return response.data;
  },

  // Medications
  getMedications: async (activeOnly: boolean = true): Promise<Medication[]> => {
    const response = await api.get(`/sources/medications?active_only=${activeOnly}`);
    return response.data;
  },

  getMedication: async (id: string): Promise<Medication> => {
    const response = await api.get(`/sources/medications/${id}`);
    return response.data;
  },

  getMedicationSideEffects: async (id: string): Promise<SideEffect[]> => {
    const response = await api.get(`/sources/medications/${id}/side-effects`);
    return response.data;
  },

  // Side Effects (Reference Data)
  searchSideEffects: async (medication?: string, effect?: string): Promise<SideEffect[]> => {
    const params = new URLSearchParams();
    if (medication) params.append('medication', medication);
    if (effect) params.append('effect', effect);
    const response = await api.get(`/sources/side-effects?${params}`);
    return response.data;
  },

  getMedicationNames: async (): Promise<string[]> => {
    const response = await api.get('/sources/side-effects/medications');
    return response.data;
  },

  getSideEffectsByMedicationName: async (medicationName: string): Promise<SideEffect[]> => {
    const response = await api.get(`/sources/side-effects/by-medication/${encodeURIComponent(medicationName)}`);
    return response.data;
  },

  // Symptoms
  getSymptoms: async (days: number = 30, limit: number = 50): Promise<SymptomLog[]> => {
    const response = await api.get(`/sources/symptoms?days=${days}&limit=${limit}`);
    return response.data;
  },

  getSymptomSuggestions: async (query: string = ''): Promise<string[]> => {
    const response = await api.get(`/sources/symptoms/suggestions?q=${query}`);
    return response.data;
  },

  // Positive Effects
  getPositiveEffects: async (days: number = 30, limit: number = 50): Promise<PositiveEffect[]> => {
    const response = await api.get(`/sources/positive-effects?days=${days}&limit=${limit}`);
    return response.data;
  },

  getPositiveEffectSuggestions: async (query: string = ''): Promise<string[]> => {
    const response = await api.get(`/sources/positive-effects/suggestions?q=${query}`);
    return response.data;
  },

  // Reports
  getReports: async (limit: number = 10): Promise<HealthReport[]> => {
    const response = await api.get(`/sources/reports?limit=${limit}`);
    return response.data;
  },

  getReport: async (id: string): Promise<HealthReport> => {
    const response = await api.get(`/sources/reports/${id}`);
    return response.data;
  },

  getSharedReport: async (token: string): Promise<HealthReport> => {
    const response = await api.get(`/sources/reports/shared/${token}`);
    return response.data;
  },

  // AI Insights
  getInsights: async (limit: number = 10, type?: string): Promise<AIInsight[]> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (type) params.append('insight_type', type);
    const response = await api.get(`/sources/insights?${params}`);
    return response.data;
  },
};

// ============================================================
// ACTIONS API (Write Operations)
// ============================================================

export const actionsApi = {
  // Profile
  updateProfile: async (data: UserProfileUpdate): Promise<User> => {
    const response = await api.put('/actions/profile', data);
    return response.data;
  },

  // Medications
  addMedication: async (data: MedicationCreateRequest): Promise<Medication> => {
    const response = await api.post('/actions/medications', data);
    return response.data;
  },

  updateMedication: async (id: string, data: Partial<Medication>): Promise<Medication> => {
    const response = await api.put(`/actions/medications/${id}`, data);
    return response.data;
  },

  stopMedication: async (id: string, endDate?: string, reason?: string): Promise<Medication> => {
    const params = new URLSearchParams();
    if (endDate) params.append('end_date', endDate);
    if (reason) params.append('reason', reason);
    const response = await api.post(`/actions/medications/${id}/stop?${params}`);
    return response.data;
  },

  // Symptoms
  logSymptom: async (data: SymptomLogCreateRequest): Promise<SymptomLog> => {
    const response = await api.post('/actions/symptoms', data);
    return response.data;
  },

  deleteSymptom: async (id: string): Promise<void> => {
    await api.delete(`/actions/symptoms/${id}`);
  },

  // Positive Effects
  logPositiveEffect: async (data: PositiveEffectCreateRequest): Promise<PositiveEffect> => {
    const response = await api.post('/actions/positive-effects', data);
    return response.data;
  },

  deletePositiveEffect: async (id: string): Promise<void> => {
    await api.delete(`/actions/positive-effects/${id}`);
  },

  // Reports
  generateReport: async (data: ReportCreateRequest): Promise<HealthReport> => {
    const response = await api.post('/actions/reports', data);
    return response.data;
  },

  shareReport: async (id: string, expiresInDays: number = 7): Promise<HealthReport> => {
    const response = await api.post(`/actions/reports/${id}/share`, {
      expires_in_days: expiresInDays,
    });
    return response.data;
  },

  revokeShare: async (id: string): Promise<HealthReport> => {
    const response = await api.delete(`/actions/reports/${id}/share`);
    return response.data;
  },
};

export default api;
