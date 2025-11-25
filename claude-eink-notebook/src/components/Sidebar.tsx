import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useConversationStore } from '../stores/conversationStore';
import { DocumentList } from './DocumentList';
import { forceEinkRefresh } from '../lib/eink-utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

type Tab = 'projects' | 'documents';

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenSettings }) => {
  const {
    projects,
    currentProjectId,
    selectProject,
    newProject,
    deleteProject,
  } = useProjects();

  const { conversations, currentConversationId, setCurrentConversation, deleteConversation } = useConversationStore();
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // E-ink refresh on sidebar open
  useEffect(() => {
    if (isOpen) {
      forceEinkRefresh(sidebarRef.current);
    }
  }, [isOpen]);

  // Debounced scroll handler for e-ink
  const handleScrollEnd = useCallback(() => {
    forceEinkRefresh(scrollRef.current);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScrollEnd, 150);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      clearTimeout(scrollTimeout);
    };
  }, [handleScrollEnd]);

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

  const handleDeleteConversation = (convId: string) => {
    deleteConversation(convId);
    setConfirmDelete(null);
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProject(projectId);
    setConfirmDelete(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-40"
        onClick={onClose}
        style={{ touchAction: 'manipulation' }}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="fixed left-0 top-0 h-full w-72 bg-white border-r-2 border-black z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b-2 border-black flex justify-between items-center">
          <h2 className="font-serif font-semibold text-lg">Menu</h2>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center text-xl touch-target"
            style={{ touchAction: 'manipulation' }}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-black">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wide min-h-[48px] touch-target ${
              activeTab === 'projects' ? 'bg-black text-white' : ''
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wide min-h-[48px] touch-target ${
              activeTab === 'documents' ? 'bg-black text-white' : ''
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            Documents
          </button>
        </div>

        {/* Content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollable"
          style={{
            touchAction: 'pan-y',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          {activeTab === 'projects' ? (
            <div className="p-4">
              {projects.map((project) => (
                <div key={project.id} className="mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => selectProject(project.id)}
                      className={`
                        flex-1 text-left py-2 px-2 min-h-[48px]
                        ${currentProjectId === project.id ? 'font-bold' : 'font-normal'}
                      `}
                    >
                      {project.name}
                    </button>
                    {projects.length > 1 && (
                      <button
                        onClick={() => setConfirmDelete(`project-${project.id}`)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 text-sm"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Delete confirmation */}
                  {confirmDelete === `project-${project.id}` && (
                    <div className="ml-2 p-2 bg-[#F5F5F5] border border-black text-sm">
                      <p className="mb-2">Delete project and all conversations?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="px-2 py-1 border border-black bg-black text-white text-xs"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 border border-black text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {currentProjectId === project.id && currentProjectConversations.length > 0 && (
                    <div className="ml-4 border-l border-gray-300 pl-2">
                      {currentProjectConversations.map((conv) => (
                        <div key={conv.id} className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setCurrentConversation(conv.id);
                              onClose();
                            }}
                            className={`
                              flex-1 text-left py-1 px-2 text-sm truncate min-h-[40px]
                              ${currentConversationId === conv.id ? 'font-semibold' : 'font-normal text-gray-600'}
                            `}
                          >
                            {conv.title}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(`conv-${conv.id}`)}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      {/* Conversation delete confirmation */}
                      {currentProjectConversations.some(c => confirmDelete === `conv-${c.id}`) && (
                        <div className="p-2 bg-[#F5F5F5] border border-black text-sm mt-1">
                          <p className="mb-2">Delete this conversation?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const convId = confirmDelete?.replace('conv-', '');
                                if (convId) handleDeleteConversation(convId);
                              }}
                              className="px-2 py-1 border border-black bg-black text-white text-xs"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-2 py-1 border border-black text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNewProject();
                        if (e.key === 'Escape') {
                          setShowNewProject(false);
                          setNewProjectName('');
                        }
                      }}
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
          ) : (
            <DocumentList />
          )}
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
