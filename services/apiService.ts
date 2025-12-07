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
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
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

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
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
    // Health check endpoint - пробуем через API, если не работает - напрямую
    try {
      // Пробуем через /api/health (если API_URL относительный)
      if (API_URL.startsWith('/')) {
        const response = await fetch('/api/health');
        if (response.ok) return await response.json();
      }
      // Или напрямую к backend на порту 8080 (для локальной разработки)
      const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';
      const directUrl = apiBase.startsWith('http') ? `${apiBase}/health` : `http://localhost:8080/health`;
      const response = await fetch(directUrl);
      if (!response.ok) throw new Error('Health check failed');
      return await response.json();
    } catch (error) {
      throw new Error('Health check failed');
    }
  }
}

export const apiService = new ApiService();

