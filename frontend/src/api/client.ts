import axios from 'axios';
import {
  AuthResponse,
  Task,
  TasksResponse,
  CreateTaskData,
  Response,
  CreateResponseData,
  Category,
  TaskFilters,
  Conversation,
  ChatMessage,
  UserFilters,
  User,
  Country,
  City,
  TaskStatus,
  UnreadMessage,
  DiscoverResponse,
} from '../types';


const apiClient = axios.create({
  baseURL: `https://belovebe.ru/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена к запросам
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Интерцептор для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен невалиден, очищаем и редиректим
      clearToken();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Управление токеном в памяти
let authToken: string | null = null;

export function setToken(token: string): void {
  authToken = token;
}

export function getToken(): string | null {
  return authToken;
}

export function clearToken(): void {
  authToken = null;
}

// API методы с типами
export const authAPI = {
  login: async (initData: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/telegram', {
      initData,
    });
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  },
};

export const tasksAPI = {
  getTasks: async (params?: TaskFilters): Promise<TasksResponse> => {
    const response = await apiClient.get<TasksResponse>('/tasks', { params });
    return response.data;
  },

  getTask: async (id: number): Promise<Task> => {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (data: CreateTaskData): Promise<Task> => {
    const response = await apiClient.post<Task>('/tasks', data);
    return response.data;
  },

  updateTask: async (taskId: number, data: CreateTaskData): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${taskId}`, data);
    return response.data;
  },

  updateTaskStatus: async (taskId: number, status: TaskStatus): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${taskId}/status`, { status });
    return response.data;
  },

  deleteTask: async (taskId: number): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}`);
  },

  getMyTasks: async (): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>('/tasks/my-tasks');
    return response.data;
  },

  getTaskResponses: async (taskId: number): Promise<Response[]> => {
    const response = await apiClient.get<Response[]>(`/tasks/${taskId}/responses`);
    return response.data;
  },
};

export const responsesAPI = {
  createResponse: async (data: CreateResponseData): Promise<Response> => {
    const response = await apiClient.post<Response>('/responses', data);
    return response.data;
  },

  getMyResponses: async (): Promise<Response[]> => {
    const response = await apiClient.get<Response[]>('/responses/my');
    return response.data;
  },

  updateResponseStatus: async (responseId: number, status: 'ACCEPTED' | 'REJECTED'): Promise<Response> => {
    const response = await apiClient.patch<Response>(`/responses/${responseId}`, { status });
    return response.data;
  },
};

export const categoriesAPI = {
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
  },
};

export const chatAPI = {
  openConversation: async (responseId: number): Promise<Conversation> => {
    const response = await apiClient.post<Conversation>('/chat/conversations', {
      responseId,
    });
    return response.data;
  },
  getMessages: async (conversationId: number): Promise<ChatMessage[]> => {
    const response = await apiClient.get<ChatMessage[]>(
      `/chat/conversations/${conversationId}/messages`
    );
    return response.data;
  },
  sendMessage: async (conversationId: number, content: string): Promise<ChatMessage> => {
    const response = await apiClient.post<ChatMessage>(
      `/chat/conversations/${conversationId}/messages`,
      { content }
    );
    return response.data;
  },
  markAsRead: async (conversationId: number): Promise<void> => {
    await apiClient.post(`/chat/conversations/${conversationId}/mark-read`);
  },
};

export const filtersAPI = {
  getFilters: async (): Promise<UserFilters> => {
    const response = await apiClient.get<UserFilters>('/filters');
    return response.data;
  },
  saveFilters: async (filters: UserFilters): Promise<UserFilters> => {
    const response = await apiClient.put<UserFilters>('/filters', filters);
    return response.data;
  },
};

export const profileAPI = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/profile');
    return response.data;
  },
  updateProfile: async (data: { preferredCity?: string; preferredCountry?: string; language?: string }): Promise<User> => {
    const response = await apiClient.patch<User>('/profile', data);
    return response.data;
  },
};

export const locationsAPI = {
  getCountries: async (): Promise<Country[]> => {
    const response = await apiClient.get<Country[]>('/locations/countries');
    return response.data;
  },
  getCities: async (countryCode: string): Promise<City[]> => {
    const response = await apiClient.get<City[]>(`/locations/cities?countryCode=${countryCode}`);
    return response.data;
  },
};

export const notificationsAPI = {
  getUnreadMessage: async (): Promise<UnreadMessage> => {
    const response = await apiClient.get<UnreadMessage>('/notifications/unreadMessages');
    return response.data
  }
}

export const discoverAPI = {
  getDiscover: async (params?: {
    ageMin?: number;
    ageMax?: number;
    maxDistance?: number;
    limit?: number;
    skip?: number;
  }): Promise<DiscoverResponse> => {
    const response = await apiClient.get<DiscoverResponse>('/discover', { params });
    return response.data;
  },
};

export default apiClient;

