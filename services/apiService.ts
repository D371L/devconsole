import { User, Task, Project, Snippet, Comment } from '../types';

// API URL - будет автоматически подставлен DigitalOcean или локальный для разработки
// Если VITE_API_URL начинается с /, используем относительный путь (для VPS через Nginx)
// Иначе используем полный URL
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
  if (envUrl.startsWith('/')) {
    // Относительный путь - используется через Nginx
    return envUrl;
  }
  return envUrl;
};

const API_URL = getApiUrl();

class ApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('devconsole_jwt_token');
  }

  private setAuthToken(token: string): void {
    localStorage.setItem('devconsole_jwt_token', token);
  }

  clearAuthToken(): void {
    localStorage.removeItem('devconsole_jwt_token');
  }

  async login(username: string, password: string): Promise<{ token: string; user: any }> {
    const url = getApiUrl().replace('/api', '/api/auth/login');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Login failed: ${response.status}`);
    }

    const data = await response.json();
    this.setAuthToken(data.token);
    return data;
  }

  async verifyToken(): Promise<any> {
    return this.request<any>('/auth/verify');
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const token = this.getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options?.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          this.clearAuthToken();
          throw new Error('Authentication required');
        }
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `API Error: ${response.status}`);
      }

      if (response.status === 204) {
        return null as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ========== USERS ==========
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async createUser(user: User): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(user: User): Promise<User> {
    return this.request<User>(`/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // ========== TASKS ==========
  async getTasks(): Promise<Task[]> {
    return this.request<Task[]>('/tasks');
  }

  async getTask(id: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`);
  }

  async createTask(task: Task): Promise<Task> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  }

  async deleteTask(id: string): Promise<void> {
    return this.request<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async addComment(taskId: string, text: string, userId: string): Promise<Comment> {
    return this.request<Comment>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, userId }),
    });
  }

  // ========== PROJECTS ==========
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async createProject(project: Project): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  // ========== SNIPPETS ==========
  async getSnippets(): Promise<Snippet[]> {
    return this.request<Snippet[]>('/snippets');
  }

  async createSnippet(snippet: Snippet): Promise<Snippet> {
    return this.request<Snippet>('/snippets', {
      method: 'POST',
      body: JSON.stringify(snippet),
    });
  }

  async deleteSnippet(id: string): Promise<void> {
    return this.request<void>(`/snippets/${id}`, {
      method: 'DELETE',
    });
  }

  // ========== HEALTH CHECK ==========
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    // Health check через Nginx proxy
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error('Health check failed');
    }
  }
}

export const apiService = new ApiService();

