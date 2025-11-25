import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { Sidebar } from './components/Sidebar';
import { Settings } from './components/Settings';
import { useProjects } from './hooks/useProjects';
import { useConversationStore } from './stores/conversationStore';
import { useModeStore } from './stores/modeStore';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { projects, currentProjectId, newProject } = useProjects();
  const { conversations, currentConversationId, createConversation } = useConversationStore();
  const { current: mode } = useModeStore();

  // Initialize with a default project if none exists
  useEffect(() => {
    if (projects.length === 0) {
      newProject('Personal', 'Default project');
    }
  }, [projects.length, newProject]);

  // Ensure there's always an active conversation when a project is selected
  useEffect(() => {
    if (currentProjectId && !currentConversationId) {
      const projectConversations = conversations.filter(c => c.projectId === currentProjectId);
      if (projectConversations.length === 0) {
        createConversation(currentProjectId, mode);
      }
    }
  }, [currentProjectId, currentConversationId, conversations, createConversation, mode]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {currentProjectId ? (
          <ChatInterface />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 font-serif">Select or create a project to begin</p>
          </div>
        )}
      </main>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Settings modal */}
      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
