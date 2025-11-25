import { useCallback } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useModeStore } from '../stores/modeStore';
import { useProjectStore } from '../stores/projectStore';
import { useConversationStore } from '../stores/conversationStore';
import { sendMessage } from '../lib/claude-api';
import { triggerEinkRefresh } from '../lib/eink-utils';

export const useClaude = () => {
  const { apiKey, model, maxTokens } = useSettingsStore();
  const { current: mode } = useModeStore();
  const { getCurrentProject, getKnowledgeAsText } = useProjectStore();
  const { getCurrentConversation, addMessage, setLoading, setError } = useConversationStore();

  const send = useCallback(async (content: string) => {
    const conversation = getCurrentConversation();
    if (!conversation) {
      setError('No active conversation');
      return;
    }

    if (!apiKey) {
      setError('API key not configured');
      return;
    }

    // Add user message
    addMessage(conversation.id, { role: 'user', content });
    setLoading(true);
    setError(null);

    try {
      const project = getCurrentProject();
      const projectKnowledge = project ? getKnowledgeAsText(project.id) : undefined;
      const projectSystemPrompt = project?.systemPrompt || undefined;

      // Get updated conversation with the new user message
      const updatedConversation = getCurrentConversation();
      if (!updatedConversation) {
        throw new Error('Conversation not found');
      }

      const response = await sendMessage(
        { apiKey, model, maxTokens },
        {
          messages: updatedConversation.messages,
          mode,
          projectKnowledge,
          projectSystemPrompt,
        }
      );

      // Add assistant message
      addMessage(conversation.id, { role: 'assistant', content: response });

      // Trigger e-ink refresh after new message
      triggerEinkRefresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiKey, model, maxTokens, mode, getCurrentConversation, getCurrentProject, getKnowledgeAsText, addMessage, setLoading, setError]);

  return {
    send,
    isConfigured: apiKey.length > 0,
  };
};
