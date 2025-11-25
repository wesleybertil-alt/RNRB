import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, KnowledgeItem } from '../types';
import { generateId } from '../lib/eink-utils';
import { db, saveProject, deleteProject as dbDeleteProject } from '../lib/db';
import { estimateTokens } from '../lib/claude-api';

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;

  // Actions
  createProject: (name: string, description?: string) => string;
  setCurrentProject: (id: string | null) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getCurrentProject: () => Project | undefined;

  // Knowledge base actions
  addKnowledgeItem: (projectId: string, item: Omit<KnowledgeItem, 'id' | 'tokenCount' | 'addedAt'>) => void;
  removeKnowledgeItem: (projectId: string, itemId: string) => void;
  getKnowledgeAsText: (projectId: string) => string;

  loadProjects: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,

      createProject: (name: string, description: string = '') => {
        const id = generateId();
        const newProject: Project = {
          id,
          name,
          description,
          knowledgeBase: [],
          systemPrompt: '',
          conversations: [],
          documents: [],
          createdAt: Date.now(),
        };
        set((state) => ({
          projects: [...state.projects, newProject],
          currentProjectId: id,
        }));
        saveProject(newProject);
        return id;
      },

      setCurrentProject: (id) => set({ currentProjectId: id }),

      updateProject: (id, updates) => {
        set((state) => {
          const projects = state.projects.map((proj) => {
            if (proj.id === id) {
              const updated = { ...proj, ...updates };
              saveProject(updated);
              return updated;
            }
            return proj;
          });
          return { projects };
        });
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
        }));
        dbDeleteProject(id);
      },

      getCurrentProject: () => {
        const state = get();
        return state.projects.find((p) => p.id === state.currentProjectId);
      },

      addKnowledgeItem: (projectId, item) => {
        const fullItem: KnowledgeItem = {
          ...item,
          id: generateId(),
          tokenCount: estimateTokens(item.content),
          addedAt: Date.now(),
        };
        set((state) => {
          const projects = state.projects.map((proj) => {
            if (proj.id === projectId) {
              const updated = {
                ...proj,
                knowledgeBase: [...proj.knowledgeBase, fullItem],
              };
              saveProject(updated);
              return updated;
            }
            return proj;
          });
          return { projects };
        });
      },

      removeKnowledgeItem: (projectId, itemId) => {
        set((state) => {
          const projects = state.projects.map((proj) => {
            if (proj.id === projectId) {
              const updated = {
                ...proj,
                knowledgeBase: proj.knowledgeBase.filter((k) => k.id !== itemId),
              };
              saveProject(updated);
              return updated;
            }
            return proj;
          });
          return { projects };
        });
      },

      getKnowledgeAsText: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return '';
        return project.knowledgeBase
          .map((item) => `## ${item.title}\n${item.content}`)
          .join('\n\n');
      },

      loadProjects: async () => {
        const projects = await db.projects.toArray();
        set({ projects });
      },
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({
        projects: state.projects,
        currentProjectId: state.currentProjectId,
      }),
    }
  )
);
