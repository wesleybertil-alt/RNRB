import { useEffect } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useConversationStore } from '../stores/conversationStore';
import { useModeStore } from '../stores/modeStore';

export const useProjects = () => {
  const {
    projects,
    currentProjectId,
    createProject,
    setCurrentProject,
    updateProject,
    deleteProject,
    getCurrentProject,
    addKnowledgeItem,
    removeKnowledgeItem,
    loadProjects,
  } = useProjectStore();

  const { createConversation, loadConversations } = useConversationStore();
  const { current: mode } = useModeStore();

  // Load projects on mount
  useEffect(() => {
    loadProjects();
    loadConversations();
  }, [loadProjects, loadConversations]);

  const selectProject = (projectId: string) => {
    setCurrentProject(projectId);
  };

  const newProject = (name: string, description?: string) => {
    const projectId = createProject(name, description);
    // Create initial conversation for the new project
    createConversation(projectId, mode);
    return projectId;
  };

  const startNewConversation = () => {
    if (currentProjectId) {
      createConversation(currentProjectId, mode);
    }
  };

  return {
    projects,
    currentProjectId,
    currentProject: getCurrentProject(),
    selectProject,
    newProject,
    updateProject,
    deleteProject,
    addKnowledgeItem,
    removeKnowledgeItem,
    startNewConversation,
  };
};
