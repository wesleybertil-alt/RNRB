import React, { useState } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { truncateText } from '../lib/eink-utils';

export const KnowledgeBase: React.FC = () => {
  const { currentProjectId, getCurrentProject, addKnowledgeItem, removeKnowledgeItem } = useProjectStore();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const project = getCurrentProject();

  if (!project) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="font-serif">Select a project to manage knowledge</p>
      </div>
    );
  }

  const handleAdd = () => {
    if (title.trim() && content.trim() && currentProjectId) {
      addKnowledgeItem(currentProjectId, {
        title: title.trim(),
        content: content.trim(),
        type: 'note',
      });
      setTitle('');
      setContent('');
      setShowAdd(false);
    }
  };

  const totalTokens = project.knowledgeBase.reduce((sum, item) => sum + item.tokenCount, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b-2 border-black">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Knowledge Base</h3>
          <span className="text-xs text-gray-600">~{totalTokens} tokens</span>
        </div>
        <p className="text-xs text-gray-600">
          Persistent context included in all conversations
        </p>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {project.knowledgeBase.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No knowledge items yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-300">
            {project.knowledgeBase.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-sm">{item.title}</h4>
                  <button
                    onClick={() => removeKnowledgeItem(project.id, item.id)}
                    className="text-xs text-gray-600 min-w-[32px] min-h-[32px]"
                  >
                    ×
                  </button>
                </div>
                <p className="text-xs text-gray-600 mb-1">
                  {truncateText(item.content, 100)}
                </p>
                <span className="text-xs text-gray-500">~{item.tokenCount} tokens</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add form */}
      <div className="border-t-2 border-black p-4">
        {showAdd ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="border-2 border-black p-2 text-sm"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Content..."
              className="border-2 border-black p-2 text-sm resize-none"
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 py-2 border-2 border-black font-semibold min-h-[48px]"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setTitle('');
                  setContent('');
                }}
                className="flex-1 py-2 border-2 border-black min-h-[48px]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full py-2 border-2 border-black min-h-[48px]"
          >
            + Add Knowledge
          </button>
        )}
      </div>
    </div>
  );
};
