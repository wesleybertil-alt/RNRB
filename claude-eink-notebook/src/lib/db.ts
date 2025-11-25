import Dexie, { type Table } from 'dexie';
import type { Conversation, Project, Document } from '../types';

export class EinkNotebookDB extends Dexie {
  conversations!: Table<Conversation>;
  projects!: Table<Project>;
  documents!: Table<Document>;

  constructor() {
    super('eink-notebook');
    this.version(1).stores({
      conversations: 'id, projectId, createdAt, updatedAt',
      projects: 'id, createdAt',
      documents: 'id, projectId, currentStage, createdAt, updatedAt'
    });
  }
}

export const db = new EinkNotebookDB();

// Helper functions
export const saveConversation = async (conversation: Conversation) => {
  await db.conversations.put(conversation);
};

export const getConversation = async (id: string) => {
  return await db.conversations.get(id);
};

export const getConversationsByProject = async (projectId: string) => {
  return await db.conversations.where('projectId').equals(projectId).toArray();
};

export const saveProject = async (project: Project) => {
  await db.projects.put(project);
};

export const getProject = async (id: string) => {
  return await db.projects.get(id);
};

export const getAllProjects = async () => {
  return await db.projects.toArray();
};

export const deleteProject = async (id: string) => {
  await db.projects.delete(id);
  await db.conversations.where('projectId').equals(id).delete();
  await db.documents.where('projectId').equals(id).delete();
};

export const saveDocument = async (document: Document) => {
  await db.documents.put(document);
};

export const getDocumentsByProject = async (projectId: string) => {
  return await db.documents.where('projectId').equals(projectId).toArray();
};
