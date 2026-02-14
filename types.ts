
export interface Attachment {
  id: string;
  type: 'image' | 'pdf' | 'file';
  mimeType: string;
  data: string; // Base64
  name: string;
}

export interface Message {
  id: string;
  role: 'user' | 'friday' | 'system';
  text: string;
  timestamp: Date;
  attachments?: Attachment[];
}

export interface Session {
  id: string;
  timestamp: Date;
  summary: string;
  messages: Message[];
}

export interface FridayStatus {
  isConnected: boolean;
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
}

export interface UserProfile {
  name: string;
  age: string;
  info: string;
}
