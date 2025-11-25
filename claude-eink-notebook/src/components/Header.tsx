import React from 'react';
import { ModePills } from './ModePills';
import { useProjectStore } from '../stores/projectStore';
import { useProjects } from '../hooks/useProjects';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { getCurrentProject } = useProjectStore();
  const { startNewConversation } = useProjects();
  const project = getCurrentProject();

  return (
    <header className="border-b-2 border-black bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Menu button and project name */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="w-12 h-12 flex items-center justify-center text-2xl"
            aria-label="Menu"
          >
            ☰
          </button>
          <h1 className="font-serif font-semibold text-lg truncate max-w-[200px]">
            {project?.name || 'Claude Notebook'}
          </h1>
        </div>

        {/* Right: Mode pills */}
        <div className="flex items-center gap-4">
          <ModePills />
          {project && (
            <button
              onClick={startNewConversation}
              className="w-12 h-12 flex items-center justify-center text-xl border-2 border-black"
              style={{ borderRadius: '4px' }}
              aria-label="New conversation"
            >
              +
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
