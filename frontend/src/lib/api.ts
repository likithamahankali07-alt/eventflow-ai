import axios from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach Supabase Auth JWT token
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (e) {
    console.error('Failed to attach auth token:', e);
  }
  return config;
});

// Event API endpoints
export const eventApi = {
  createEvent: (data: any) => api.post('/api/events', data),
  getEvents: () => api.get('/api/events'),
  getEventDetails: (id: string) => api.get(`/api/events/${id}`),
  getPublicEvent: (id: string) => api.get(`/api/events/public/${id}`),
  updateEvent: (id: string, data: any) => api.put(`/api/events/${id}`, data),
};

// Registration & Participant API endpoints
export const registrationApi = {
  registerParticipant: (eventId: string, data: any) => api.post(`/api/register/${eventId}`, data),
  getParticipants: (eventId: string, search?: string, status?: string) => 
    api.get(`/api/events/${eventId}/participants`, { params: { search, status_filter: status } }),
};

// Attendance API endpoints
export const attendanceApi = {
  checkIn: (eventId: string, tokenOrId: string) => 
    api.post(`/api/events/${eventId}/checkin`, { token_or_id: tokenOrId }),
};

// Feedback API endpoints
export const feedbackApi = {
  submitFeedback: (eventId: string, data: any) => api.post(`/api/events/${eventId}/feedback`, data),
  getSummary: (eventId: string) => api.get(`/api/events/${eventId}/feedback/summary`),
};

// Certificate API endpoints
export const certificateApi = {
  generateCertificates: (eventId: string) => api.post(`/api/events/${eventId}/certificates/generate`),
  verifyCertificate: (certId: string) => api.get(`/api/certificates/verify/${certId}`),
};

// Gemini AI Agent API endpoint
export const aiAgentApi = {
  chat: (eventId: string | undefined, messages: Array<{ role: string; content: string }>) => 
    api.post('/api/ai/agent/chat', { event_id: eventId, messages }),
};
