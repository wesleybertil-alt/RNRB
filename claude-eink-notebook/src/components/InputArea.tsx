import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMode } from '../hooks/useMode';
import { useClaude } from '../hooks/useClaude';
import { useConversationStore } from '../stores/conversationStore';
import { isPenInput, forceEinkRefresh } from '../lib/eink-utils';

export const InputArea: React.FC = () => {
  const [input, setInput] = useState('');
  const [isPenWriting, setIsPenWriting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
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

  // Handle pointer events for stylus detection
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isPenInput(e.nativeEvent)) {
      setIsPenWriting(true);
      // Add visual feedback for pen input
      if (textareaRef.current) {
        textareaRef.current.classList.add('pen-active');
      }
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isPenInput(e.nativeEvent)) {
      setIsPenWriting(false);
      if (textareaRef.current) {
        textareaRef.current.classList.remove('pen-active');
      }
      // Force e-ink refresh after stylus stroke
      forceEinkRefresh(textareaRef.current);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isConfigured) return;

    const message = input.trim();
    setInput('');

    // Force e-ink refresh on submit
    forceEinkRefresh(formRef.current);

    await send(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="border-t-2 border-black bg-white"
    >
      <div className="flex items-end p-4">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          placeholder={isConfigured ? placeholder : 'Configure API key in settings...'}
          disabled={isLoading || !isConfigured}
          aria-label="Message input"
          className={`
            flex-1 resize-none bg-transparent
            text-lg text-black placeholder-gray-500
            border-0 outline-none
            min-h-[48px] max-h-[200px]
            font-serif leading-relaxed
            stylus-input
            ${isLoading ? 'opacity-50' : ''}
            ${isPenWriting ? 'pen-writing' : ''}
          `}
          rows={1}
          style={{
            touchAction: 'pan-y pinch-zoom',
            WebkitUserSelect: 'text',
            userSelect: 'text',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading || !isConfigured}
          aria-label="Send message"
          className={`
            ml-4 w-14 h-14 flex items-center justify-center
            border-2 border-black bg-white
            text-black text-xl font-bold
            touch-target
            ${(!input.trim() || isLoading || !isConfigured) ? 'opacity-30' : 'opacity-100'}
          `}
          style={{
            borderRadius: '4px',
            transition: 'none',
            touchAction: 'manipulation',
          }}
        >
          ↑
        </button>
      </div>
    </form>
  );
};
