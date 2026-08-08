/**
 * ClaudeClient — Client API Claude pour usage futur backend.
 *
 * Le pipeline principal utilise Claude via n8n (pas ce client).
 * Ce module est prevu pour des usages directs (ex: categorisation on-demand,
 * analyse de requetes utilisateur en v2+).
 */

import { env } from '../../config/env';

const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  id: string;
  content: Array<{
    type: 'text';
    text: string;
  }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Envoie un message a Claude et retourne la reponse texte.
 *
 * @param systemPrompt - Instructions systeme
 * @param messages - Messages de la conversation
 * @param model - Modele a utiliser (defaut: claude-3-haiku)
 * @param maxTokens - Limite de tokens en sortie (defaut: 4096)
 */
export async function sendMessage(
  systemPrompt: string,
  messages: ClaudeMessage[],
  model: string = 'claude-3-haiku-20240307',
  maxTokens: number = 4096,
): Promise<string> {
  const response = await fetch(`${ANTHROPIC_BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
    signal: AbortSignal.timeout(30000), // 30s timeout
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as ClaudeResponse;

  if (!data.content || data.content.length === 0) {
    throw new Error('Claude API returned empty response');
  }

  return data.content[0].text;
}
