export interface User {
  id: string;
  username: string;
  email: string;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  file_references?: string[];
}

export interface FileInfo {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  vectorized: boolean;
}