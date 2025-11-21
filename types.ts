export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  stock: number;
  usage: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  attachments?: string[]; // Base64 images
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'pharmacist' | 'patient'; // Rol eklendi
  age?: number;
  gender?: 'Erkek' | 'Kadın' | 'Diğer';
  allergies?: string;
  history: RecommendationRecord[];
}

export interface RecommendationRecord {
  id: string;
  date: number;
  complaint: string;
  recommendation: string;
}

export enum AppMode {
  INVENTORY = 'inventory',
  RECOMMEND = 'recommend',
  LIVE = 'live',
  CHAT = 'chat',
  VISION = 'vision',
  TRANSCRIBE = 'transcribe',
  SEARCH = 'search',
  PROFILE = 'profile',
  AUTH = 'auth'
}