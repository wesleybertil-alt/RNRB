import React, { useCallback, useRef } from 'react';
import type { Message } from '../types';
import { useModeStore, MODE_CONFIG } from '../stores/modeStore';
import { forceEinkRefresh } from '../lib/eink-utils';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { current: mode } = useModeStore();
  const modeConfig = MODE_CONFIG[mode];
  const isUser = message.role === 'user';
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Handle text selection for e-ink (force refresh after selection)
  const handlePointerUp = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      // User made a selection, refresh for e-ink clarity
      forceEinkRefresh(bubbleRef.current);
    }
  }, []);

  return (
    <div className={`mb-4 ${isUser ? '' : modeConfig.accentStyle}`}>
      <div
        ref={bubbleRef}
        onPointerUp={handlePointerUp}
        className={`
          p-4 border-2 border-black
          ${isUser ? 'bg-[#E8E8E8]' : 'bg-white'}
        `}
        style={{
          borderRadius: '4px',
          touchAction: 'pan-y pinch-zoom',
          WebkitUserSelect: 'text',
          userSelect: 'text',
        }}
      >
        <div className="text-xs font-semibold mb-2 text-black uppercase tracking-wide">
          {isUser ? 'You' : 'Claude'}
        </div>
        <div
          className="text-black whitespace-pre-wrap leading-relaxed selectable-text"
          style={{
            WebkitUserSelect: 'text',
            userSelect: 'text',
          }}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
};
