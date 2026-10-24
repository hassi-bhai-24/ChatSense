export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  isInitialDiagnostic?: boolean;
}

export interface ActiveTranscript {
  id: string;
  title: string;
  rawText: string;
  context: string;
  otherPersonName?: string;
  userName?: string;
  createdAt: string;
}

export interface QuickPrompt {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}
