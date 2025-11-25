import React, { useState } from 'react';
import { useConversationStore } from '../stores/conversationStore';
import { useDocumentStore } from '../stores/documentStore';
import { useProjectStore } from '../stores/projectStore';
import { useModeStore } from '../stores/modeStore';

interface SaveAsDocumentProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SaveAsDocument: React.FC<SaveAsDocumentProps> = ({ isOpen, onClose }) => {
  const { getCurrentConversation } = useConversationStore();
  const { createDocument } = useDocumentStore();
  const { currentProjectId } = useProjectStore();
  const { current: mode } = useModeStore();

  const [title, setTitle] = useState('');
  const [includeAll, setIncludeAll] = useState(true);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());

  const conversation = getCurrentConversation();
  const messages = conversation?.messages || [];

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() || !currentProjectId) return;

    const messagesToInclude = includeAll
      ? messages
      : messages.filter(m => selectedMessages.has(m.id));

    const content = messagesToInclude
      .map(m => `**${m.role === 'user' ? 'You' : 'Claude'}:**\n${m.content}`)
      .join('\n\n---\n\n');

    createDocument(currentProjectId, title.trim(), content, mode);

    setTitle('');
    setSelectedMessages(new Set());
    onClose();
  };

  const toggleMessage = (id: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMessages(newSelected);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:max-h-[80vh] bg-white border-2 border-black z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b-2 border-black flex justify-between items-center">
          <h2 className="font-serif font-semibold text-lg">Save as Document</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Title input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title..."
              className="w-full border-2 border-black p-3 text-sm"
              autoFocus
            />
          </div>

          {/* Include options */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">
              Include Messages
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setIncludeAll(true)}
                className={`flex-1 py-2 border-2 border-black min-h-[48px] ${
                  includeAll ? 'bg-black text-white' : ''
                }`}
              >
                All Messages
              </button>
              <button
                onClick={() => setIncludeAll(false)}
                className={`flex-1 py-2 border-2 border-black min-h-[48px] ${
                  !includeAll ? 'bg-black text-white' : ''
                }`}
              >
                Select Messages
              </button>
            </div>
          </div>

          {/* Message selection */}
          {!includeAll && (
            <div className="border-2 border-black max-h-[200px] overflow-y-auto">
              {messages.map((msg, index) => (
                <button
                  key={msg.id}
                  onClick={() => toggleMessage(msg.id)}
                  className={`w-full text-left p-3 border-b border-gray-300 last:border-b-0 min-h-[48px] ${
                    selectedMessages.has(msg.id) ? 'bg-[#E8E8E8]' : ''
                  }`}
                >
                  <span className="text-xs font-semibold uppercase">
                    {msg.role === 'user' ? 'You' : 'Claude'} #{index + 1}
                  </span>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {msg.content.substring(0, 80)}...
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Current stage info */}
          <div className="mt-4 p-3 bg-[#F5F5F5] border-2 border-black">
            <p className="text-sm">
              <span className="font-semibold">Stage:</span> {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Document will be created in the current mode stage
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-black flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-black min-h-[48px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || (!includeAll && selectedMessages.size === 0)}
            className={`flex-1 py-3 border-2 border-black font-semibold min-h-[48px] ${
              title.trim() && (includeAll || selectedMessages.size > 0)
                ? 'bg-black text-white'
                : 'opacity-30'
            }`}
          >
            Save Document
          </button>
        </div>
      </div>
    </>
  );
};
