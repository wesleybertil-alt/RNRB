import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Document, Mode } from '../types';
import { generateId } from '../lib/eink-utils';
import { db, saveDocument } from '../lib/db';

interface DocumentState {
  documents: Document[];

  // Actions
  createDocument: (projectId: string, title: string, content: string, stage?: Mode) => string;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  promoteDocument: (id: string, toStage: Mode) => string;
  getDocumentsByProject: (projectId: string) => Document[];
  loadDocuments: () => Promise<void>;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      documents: [],

      createDocument: (projectId: string, title: string, content: string, stage: Mode = 'draft') => {
        const id = generateId();
        const newDocument: Document = {
          id,
          title,
          content,
          projectId,
          currentStage: stage,
          stageHistory: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          documents: [...state.documents, newDocument],
        }));
        saveDocument(newDocument);
        return id;
      },

      updateDocument: (id, updates) => {
        set((state) => {
          const documents = state.documents.map((doc) => {
            if (doc.id === id) {
              const updated = { ...doc, ...updates, updatedAt: Date.now() };
              saveDocument(updated);
              return updated;
            }
            return doc;
          });
          return { documents };
        });
      },

      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        }));
        db.documents.delete(id);
      },

      promoteDocument: (id, toStage) => {
        const doc = get().documents.find((d) => d.id === id);
        if (!doc) return id;

        const newId = generateId();
        const promotedDocument: Document = {
          ...doc,
          id: newId,
          currentStage: toStage,
          stageHistory: [
            ...doc.stageHistory,
            { stage: doc.currentStage, documentId: doc.id, timestamp: Date.now() }
          ],
          updatedAt: Date.now(),
        };

        set((state) => ({
          documents: [...state.documents, promotedDocument],
        }));
        saveDocument(promotedDocument);
        return newId;
      },

      getDocumentsByProject: (projectId) => {
        return get().documents.filter((d) => d.projectId === projectId);
      },

      loadDocuments: async () => {
        const documents = await db.documents.toArray();
        set({ documents });
      },
    }),
    {
      name: 'document-storage',
      partialize: (state) => ({
        documents: state.documents,
      }),
    }
  )
);
