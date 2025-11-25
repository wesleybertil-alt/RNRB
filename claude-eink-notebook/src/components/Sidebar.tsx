import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useConversationStore } from '../stores/conversationStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenSettings }) => {
  const {
    projects,
    currentProjectId,
    selectProject,
    newProject,
  } = useProjects();

  const { conversations, currentConversationId, setCurrentConversation } = useConversationStore();
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const currentProjectConversations = conversations.filter(
    (c) => c.projectId === currentProjectId
  );

  const handleNewProject = () => {
    if (newProjectName.trim()) {
      newProject(newProjectName.trim());
      setNewProjectName('');
      setShowNewProject(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r-2 border-black z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b-2 border-black flex justify-between items-center">
          <h2 className="font-serif font-semibold text-lg">Menu</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-xl"
          >
            ×
          </button>
        </div>

        {/* Projects section */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide">Projects</h3>
          <div className="border-t border-black mb-4" />

          {projects.map((project) => (
            <div key={project.id} className="mb-2">
              <button
                onClick={() => selectProject(project.id)}
                className={`
                  w-full text-left py-2 px-2 min-h-[48px]
                  ${currentProjectId === project.id ? 'font-bold' : 'font-normal'}
                `}
              >
                {project.name}
              </button>
              {currentProjectId === project.id && currentProjectConversations.length > 0 && (
                <div className="ml-4 border-l border-gray-300 pl-2">
                  {currentProjectConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setCurrentConversation(conv.id)}
                      className={`
                        w-full text-left py-1 px-2 text-sm truncate min-h-[40px]
                        ${currentConversationId === conv.id ? 'font-semibold' : 'font-normal text-gray-600'}
                      `}
                    >
                      {conv.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* New Project */}
          <div className="border-t border-black mt-4 pt-4">
            {showNewProject ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name"
                  className="border-2 border-black p-2 text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleNewProject}
                    className="flex-1 py-2 border-2 border-black font-semibold min-h-[48px]"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowNewProject(false);
                      setNewProjectName('');
                    }}
                    className="flex-1 py-2 border-2 border-black min-h-[48px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewProject(true)}
                className="w-full text-left py-2 px-2 min-h-[48px]"
              >
                + New Project
              </button>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="border-t-2 border-black p-4">
          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="w-full text-left py-2 px-2 min-h-[48px] flex items-center gap-2"
          >
            <span>⚙</span>
            <span>Settings</span>
          </button>
        </div>
      </div>
    </>
  );
};
