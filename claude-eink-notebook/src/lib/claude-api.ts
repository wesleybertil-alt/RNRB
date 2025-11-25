import type { Mode, Message, ClaudeConfig } from '../types';
import { MODE_PROMPTS } from './mode-prompts';

interface SendMessageParams {
  messages: Message[];
  mode: Mode;
  projectKnowledge?: string;
  projectSystemPrompt?: string;
}

const buildSystemPrompt = (params: SendMessageParams): string => {
  let prompt = MODE_PROMPTS[params.mode];

  if (params.projectSystemPrompt) {
    prompt += `\n\n${params.projectSystemPrompt}`;
  }

  if (params.projectKnowledge) {
    prompt += `\n\n<project_knowledge>\n${params.projectKnowledge}\n</project_knowledge>\n\nUse the above knowledge to inform your responses.`;
  }

  return prompt;
};

export const sendMessage = async (
  config: ClaudeConfig,
  params: SendMessageParams
): Promise<string> => {
  const systemPrompt = buildSystemPrompt(params);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      system: systemPrompt,
      messages: params.messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
};

// Estimate token count (rough approximation: ~4 chars per token)
export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};
