import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { SaveAsDocument } from './SaveAsDocument';
import { useConversationStore } from '../stores/conversationStore';
import { useEinkRefresh } from '../hooks/useEinkRefresh';
import { forceEinkRefresh } from '../lib/eink-utils';

export const ChatInterface: React.FC = () => {
  const { getCurrentConversation, isLoading, error } = useConversationStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { refresh } = useEinkRefresh();
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const conversation = getCurrentConversation();
  const messages = conversation?.messages || [];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    refresh();
  }, [messages.length, refresh]);

  // Handle scroll end for e-ink refresh
  const handleScrollEnd = useCallback(() => {
    forceEinkRefresh(scrollContainerRef.current);
  }, []);

  // Debounced scroll handler for e-ink displays
  useEffect(() => {
    const container = scrollContainerRef.current;
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages area - optimized for e-ink scrolling */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 scrollable"
        style={{
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-center font-serif">
              Start a conversation...
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="mb-4">
                <div className="p-4 border-2 border-black bg-white" style={{ borderRadius: '4px' }}>
                  <div className="text-xs font-semibold mb-2 text-black uppercase tracking-wide">
                    Claude
                  </div>
                  <div className="text-gray-600 italic">
                    Claude is thinking...
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-[#F5F5F5] border-t-2 border-black">
          <p className="text-sm text-black">Error: {error}</p>
        </div>
      )}

      {/* Action bar - only show when there are messages */}
      {messages.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-300 flex justify-end">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="text-sm px-4 py-2 border-2 border-black min-h-[48px] touch-target"
            style={{ touchAction: 'manipulation' }}
          >
            Save as Document
          </button>
        </div>
      )}

      {/* Input area */}
      <InputArea />

      {/* Save as Document dialog */}
      <SaveAsDocument
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
      />
    </div>
  );
};
