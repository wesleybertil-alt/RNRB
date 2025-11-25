import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Conversation, Message, Mode } from '../types';
import { generateId } from '../lib/eink-utils';
import { db, saveConversation } from '../lib/db';

interface ConversationState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createConversation: (projectId: string, mode: Mode) => string;
  setCurrentConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateConversationTitle: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  getCurrentConversation: () => Conversation | undefined;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadConversations: () => Promise<void>;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      isLoading: false,
      error: null,

      createConversation: (projectId: string, mode: Mode) => {
        const id = generateId();
        const newConversation: Conversation = {
          id,
          title: 'New Conversation',
          messages: [],
          projectId,
          mode,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id,
        }));
        saveConversation(newConversation);
        return id;
      },

      setCurrentConversation: (id) => set({ currentConversationId: id }),

      addMessage: (conversationId, message) => {
        const fullMessage: Message = {
          ...message,
          id: generateId(),
          timestamp: Date.now(),
        };
        set((state) => {
          const conversations = state.conversations.map((conv) => {
            if (conv.id === conversationId) {
              const updated = {
                ...conv,
                messages: [...conv.messages, fullMessage],
                updatedAt: Date.now(),
                // Auto-generate title from first user message
                title: conv.messages.length === 0 && message.role === 'user'
                  ? message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
                  : conv.title,
              };
              saveConversation(updated);
              return updated;
            }
            return conv;
          });
          return { conversations };
        });
      },

      updateConversationTitle: (id, title) => {
        set((state) => {
          const conversations = state.conversations.map((conv) => {
            if (conv.id === id) {
              const updated = { ...conv, title, updatedAt: Date.now() };
              saveConversation(updated);
              return updated;
            }
            return conv;
          });
          return { conversations };
        });
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
        }));
        db.conversations.delete(id);
      },

      getCurrentConversation: () => {
        const state = get();
        return state.conversations.find((c) => c.id === state.currentConversationId);
      },

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      loadConversations: async () => {
        const conversations = await db.conversations.toArray();
        set({ conversations: conversations.sort((a, b) => b.updatedAt - a.updatedAt) });
      },
    }),
    {
      name: 'conversation-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),
    }
  )
);
