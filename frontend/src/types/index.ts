export interface User {
  id: number;
  tgId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  language?: string;
  profile?: Profile;
}

export interface Profile {
  id: number;
  rating: number;
  completedTasks: number;
  currentTasks: number;
  preferredCity?: string;
  preferredCountry?: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  category: Category;
  authorId: number;
  author: {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  budget?: number;
  startDate?: string;
  endDate?: string;
  country?: string;
  city?: string;
  street?: string;
  house?: string;
  latitude?: number;
  longitude?: number;
  status: TaskStatus;
  viewsCount: number;
  viewedResponsesCount?: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    responses: number;
  };
  hasUserResponse?: boolean;
}

export enum TaskStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Response {
  id: number;
  taskId: number;
  task?: Task;
  executorId: number;
  executor: User & { profile?: Profile };
  proposedSum?: number;
  coverLetter?: string;
  status: ResponseStatus;
  createdAt: string;
  unreadMessagesCount?: number;
  hasMessages?: boolean;
}

export enum ResponseStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export interface ResponseTemplate {
  id?: number;
  title: string;
  proposedSum?: number;
  coverLetter: string;
  order?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface TaskFilters extends PaginationParams {
  categories?: string;
  countries?: string;
  cities?: string;
  worldwide?: string;
}

export interface CreateResponseData {
  taskId: number;
  proposedSum?: number;
  coverLetter: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  categoryId: number;
  budget?: number;
  startDate?: string;
  endDate?: string;
  country?: string;
  city?: string;
  street?: string;
  house?: string;
  latitude?: number;
  longitude?: number;
}

export interface UserFilters {
  selectedCategories: number[];
  selectedCountries: string[];
  selectedCities: string[];
  worldwideMode: boolean;
}

export interface Country {
  code: string;
  name: string;
  nameEn: string;
}

export interface City {
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
}

export interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConversationParticipant {
  id: number;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  createdAt: string;
  sender: ConversationParticipant;
}

export interface Conversation {
  id: number;
  task: {
    id: number;
    title: string;
  };
  authorId: number;
  executorId: number;
  author: ConversationParticipant;
  executor: ConversationParticipant;
  messages: ChatMessage[];
}

export interface UnreadMessage {
  myUnreadMessageCount: Array<{ taskId: number, count: number}>
  unreadMessageCount: number
  unreadResponses: number[]
}

export interface DiscoverPhoto {
  id: string;
  url: string;
  isProfilePhoto: boolean;
}

export interface DiscoverUser {
  id: string;
  displayName?: string;
  birthdate?: string;   // ISO date
  gender?: string;
  genderPreferences: string[];
  bio?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;

  photos: DiscoverPhoto[];
}

export interface DiscoverResponse {
  count: number;
  users: DiscoverUser[];
}
