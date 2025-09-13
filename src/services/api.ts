// API service for communicating with the CrewAI Scraper Service
import { API_CONFIG } from '@/config/api';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface ScrapeRequest {
  topic: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface Resource {
  type: 'article' | 'docs' | 'tutorial' | 'video' | 'blog';
  title: string;
  link: string;
  score: number;
}

export interface ScrapeResponse {
  content: string;
  resources: Resource[];
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

class ApiService {
  private getAuthToken(): string | null {
    // For development, use a mock token
    // In production, this would integrate with Clerk's getToken()
    const token = localStorage.getItem('auth_token');
    if (!token) {
      // Set a mock token for development
      const mockToken = 'mock-jwt-token-for-development';
      localStorage.setItem('auth_token', mockToken);
      return mockToken;
    }
    return token;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async scrapeResources(request: ScrapeRequest): Promise<ScrapeResponse> {
    return this.makeRequest<ScrapeResponse>('/scrape_resources', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async healthCheck(): Promise<{ status: string; service: string }> {
    return this.makeRequest<{ status: string; service: string }>('/health');
  }
}

export const apiService = new ApiService();
