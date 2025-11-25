import React, { useState, useRef, useEffect } from 'react';
import { useMode } from '../hooks/useMode';
import { useClaude } from '../hooks/useClaude';
import { useConversationStore } from '../stores/conversationStore';

export const InputArea: React.FC = () => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { placeholder } = useMode();
  const { send, isConfigured } = useClaude();
  const { isLoading } = useConversationStore();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isConfigured) return;

    const message = input.trim();
    setInput('');
    await send(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t-2 border-black bg-white">
      <div className="flex items-end p-4">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConfigured ? placeholder : 'Configure API key in settings...'}
          disabled={isLoading || !isConfigured}
          className={`
            flex-1 resize-none bg-transparent
            text-lg text-black placeholder-gray-500
            border-0 outline-none
            min-h-[48px] max-h-[200px]
            font-serif leading-relaxed
            ${isLoading ? 'opacity-50' : ''}
          `}
          rows={1}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading || !isConfigured}
          className={`
            ml-4 w-12 h-12 flex items-center justify-center
            border-2 border-black bg-white
            text-black text-xl font-bold
            ${(!input.trim() || isLoading || !isConfigured) ? 'opacity-30' : 'opacity-100'}
          `}
          style={{ borderRadius: '4px', transition: 'none' }}
        >
          ↑
        </button>
      </div>
    </form>
  );
};
