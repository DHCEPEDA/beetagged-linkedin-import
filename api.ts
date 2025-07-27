// API service layer for BeeTagged backend integration

const BACKEND_URL = 'https://beetagged-app-53414697acd3.herokuapp.com';

export interface Contact {
  id?: number;
  name: string;
  email?: string;
  company?: string;
  position?: string;
  location?: string;
  tags?: string[];
  source?: 'linkedin' | 'facebook' | 'manual';
  createdAt?: Date;
}

export interface SearchResult {
  results: Contact[];
}

export interface ImportResult {
  success: boolean;
  count: number;
  message: string;
  contacts?: Contact[];
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${BACKEND_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getContacts(): Promise<Contact[]> {
    return this.request<Contact[]>('/api/contacts');
  }

  async searchContacts(query: string): Promise<SearchResult> {
    const encodedQuery = encodeURIComponent(query);
    return this.request<SearchResult>(`/api/search/natural?q=${encodedQuery}`);
  }

  async importLinkedInCSV(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('linkedinCsv', file);

    const response = await fetch(`${BACKEND_URL}/api/import/linkedin`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Import failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async importFacebookContacts(contacts: any[]): Promise<ImportResult> {
    return this.request<ImportResult>('/api/import/facebook', {
      method: 'POST',
      body: JSON.stringify({ contacts }),
    });
  }

  async getHealthStatus(): Promise<{ status: string; contactCount: number }> {
    return this.request<{ status: string; contactCount: number }>('/health');
  }
}

export const apiService = new ApiService();