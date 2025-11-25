export type Mode = 'draft' | 'research' | 'synthesis' | 'writing';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  tokenCount?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  projectId: string;
  mode: Mode;
  createdAt: number;
  updatedAt: number;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  projectId: string;
  currentStage: Mode;
  stageHistory: StageHistoryItem[];
  createdAt: number;
  updatedAt: number;
}

export interface StageHistoryItem {
  stage: Mode;
  documentId: string;
  timestamp: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  knowledgeBase: KnowledgeItem[];
  systemPrompt: string;
  conversations: string[];
  documents: string[];
  createdAt: number;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'document' | 'snippet';
  tokenCount: number;
  addedAt: number;
}

export interface ClaudeConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

export interface Settings {
  apiKey: string;
  model: string;
  maxTokens: number;
  theme: 'light';
}
