import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '../store/authStore';
import type {
  LoginRequest,
  LoginResponse,
  CreateReportResponse,
  GetReportsResponse,
  CalculateRouteRequest,
  CalculateRouteResponse,
} from '@shared/types';

const API_BASE_URL = 'http://localhost:3000';

class APIService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/login', data);
    return response.data;
  }

  async validateToken(): Promise<{ valid: boolean; user: any }> {
    const response = await this.client.post('/auth/validate');
    return response.data;
  }

  // Reports
  async createReport(formData: FormData): Promise<CreateReportResponse> {
    const response = await this.client.post<CreateReportResponse>('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getReports(params?: {
    resolved?: boolean;
    minSeverity?: number;
    limit?: number;
    offset?: number;
  }): Promise<GetReportsResponse> {
    const response = await this.client.get<GetReportsResponse>('/reports', { params });
    return response.data;
  }

  // Routes
  async calculateRoute(data: CalculateRouteRequest): Promise<CalculateRouteResponse> {
    const response = await this.client.post<CalculateRouteResponse>('/routes/calculate', data);
    return response.data;
  }

  // Infrastructure
  async getInfrastructure(params?: { type?: string; bounds?: string }) {
    const response = await this.client.get('/infrastructure', { params });
    return response.data;
  }

  async getInfrastructureStats() {
    const response = await this.client.get('/infrastructure/stats');
    return response.data;
  }
}

export const apiService = new APIService();
