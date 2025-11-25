import React from 'react';
import type { Message } from '../types';
import { useModeStore, MODE_CONFIG } from '../stores/modeStore';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { current: mode } = useModeStore();
  const modeConfig = MODE_CONFIG[mode];
  const isUser = message.role === 'user';

  return (
    <div className={`mb-4 ${isUser ? '' : modeConfig.accentStyle}`}>
      <div
        className={`
          p-4 border-2 border-black
          ${isUser ? 'bg-[#E8E8E8]' : 'bg-white'}
        `}
        style={{ borderRadius: '4px' }}
      >
        <div className="text-xs font-semibold mb-2 text-black uppercase tracking-wide">
          {isUser ? 'You' : 'Claude'}
        </div>
        <div className="text-black whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  );
};
