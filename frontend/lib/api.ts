import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const sendOTP = (phone: string) =>
  api.post('/auth/send-otp', { phone });

export const verifyOTP = (data: { phone: string; otp: string; session_id: string; referral_code?: string }) =>
  api.post('/auth/verify-otp', data);

// User
export const getProfile = () => api.get('/profile');
export const bindUID = (data: { ff_uid: string; ff_name: string }) =>
  api.post('/bind-uid', data);
export const getReferrals = () => api.get('/referrals');
export const getLeaderboard = (period = 'weekly') =>
  api.get(`/leaderboard?period=${period}`);

// Matches
export const getMatches = (status?: string) =>
  api.get(`/matches${status ? `?status=${status}` : ''}`);
export const getMatch = (id: number) => api.get(`/matches/${id}`);
export const getMatchParticipants = (id: number) =>
  api.get(`/matches/${id}/participants`);
export const joinMatch = (id: number) => api.post(`/matches/${id}/join`);
export const uploadResult = (id: number, formData: FormData) =>
  api.post(`/matches/${id}/upload-result`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getResultDetails = (id: number) => api.get(`/matches/${id}/result`);
export const getMyMatches = () => api.get('/my-matches');
export const createMatch = (data: unknown) => api.post('/matches/create', data);

// Wallet
export const getWallet = () => api.get('/wallet');
export const requestAddMoney = (amount: number) =>
  api.post('/wallet/add-money', { amount });
export const requestWithdraw = (data: { amount: number; upi_id: string }) =>
  api.post('/wallet/withdraw', data);

// Admin
export const getAdminDashboard = () => api.get('/admin/dashboard');
export const adminCreateMatch = (data: unknown) => api.post('/admin/matches', data);
export const adminUpdateMatch = (id: number, data: unknown) =>
  api.put(`/admin/matches/${id}`, data);
export const getPendingResults = () => api.get('/admin/results/pending');
export const verifyResult = (id: number, data: unknown) =>
  api.post(`/admin/results/${id}/verify`, data);
export const getAllUsers = (page = 1) => api.get(`/admin/users?page=${page}`);
export const adminChangeUID = (userId: number, data: { ff_uid: string; ff_name: string }) =>
  api.put(`/admin/users/${userId}/change-uid`, data);
export const getAddMoneyRequests = () => api.get('/admin/add-money-requests');
export const approveAddMoney = (id: number, action: string) =>
  api.post(`/admin/add-money-requests/${id}/approve`, { action });
export const getWithdrawRequests = () => api.get('/admin/withdraw-requests');
export const approveWithdrawal = (id: number, action: string) =>
  api.post(`/admin/withdraw-requests/${id}/approve`, { action });
export const getAdminSettings = () => api.get('/admin/settings');
export const updateAdminSettings = (data: Record<string, string>) =>
  api.put('/admin/settings', data);
export const awardBonus = (data: unknown) => api.post('/admin/award-bonus', data);
export const getAllReferrals = () => api.get('/admin/referrals');
export const getAllMatches = () => api.get('/admin/matches');
