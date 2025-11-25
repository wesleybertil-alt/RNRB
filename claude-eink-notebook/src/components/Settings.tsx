import React, { useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { apiKey, model, maxTokens, setApiKey, setModel, setMaxTokens } = useSettingsStore();
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(model);
  const [localMaxTokens, setLocalMaxTokens] = useState(maxTokens.toString());
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSave = () => {
    setApiKey(localApiKey);
    setModel(localModel);
    setMaxTokens(parseInt(localMaxTokens, 10) || 4096);
    onClose();
  };

  if (!isOpen) return null;

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
          <h2 className="font-serif font-semibold text-lg">Settings</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* API Key */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">
              API Key
            </label>
            <div className="flex gap-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="flex-1 border-2 border-black p-3 text-sm font-mono"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="px-4 border-2 border-black min-h-[48px]"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Get your API key from console.anthropic.com
            </p>
          </div>

          {/* Model */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">
              Model
            </label>
            <select
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full border-2 border-black p-3 text-sm bg-white"
            >
              <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Default)</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
              <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
            </select>
          </div>

          {/* Max Tokens */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">
              Max Tokens
            </label>
            <input
              type="number"
              value={localMaxTokens}
              onChange={(e) => setLocalMaxTokens(e.target.value)}
              min="100"
              max="100000"
              className="w-full border-2 border-black p-3 text-sm"
            />
            <p className="text-xs text-gray-600 mt-2">
              Maximum tokens in Claude's response (default: 4096)
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
            className="flex-1 py-3 border-2 border-black bg-black text-white font-semibold min-h-[48px]"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
};
