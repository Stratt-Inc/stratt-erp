import Anthropic from "@anthropic-ai/sdk";

const AI_MODEL = "claude-sonnet-4-6";
const AI_MAX_TOKENS = 4096;
const AI_TEMPERATURE = 0.1;
const AI_MAX_RETRIES = 3;

/** Singleton Anthropic client */
let _client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: AI_MAX_RETRIES,
    });
  }
  return _client;
}

export interface CompletionOptions {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionResult {
  content: string;
  tokensInput: number;
  tokensOutput: number;
  latencyMs: number;
  model: string;
}

/**
 * Send a chat completion request with structured logging and retry.
 */
export async function complete(options: CompletionOptions): Promise<CompletionResult> {
  const client = getClient();
  const start = Date.now();

  const response = await client.messages.create({
    model: options.model ?? AI_MODEL,
    max_tokens: options.maxTokens ?? AI_MAX_TOKENS,
    temperature: options.temperature ?? AI_TEMPERATURE,
    system: options.systemPrompt,
    messages: [
      { role: "user", content: options.userMessage },
    ],
  });

  const latencyMs = Date.now() - start;
  const content = response.content[0];

  if (content.type !== "text") {
    throw new Error(`Unexpected response type: ${content.type}`);
  }

  const result: CompletionResult = {
    content: content.text,
    tokensInput: response.usage.input_tokens,
    tokensOutput: response.usage.output_tokens,
    latencyMs,
    model: response.model,
  };

  // Structured logging
  console.log(JSON.stringify({
    level: "info",
    event: "ai_completion",
    model: result.model,
    latencyMs: result.latencyMs,
    tokensInput: result.tokensInput,
    tokensOutput: result.tokensOutput,
  }));

  return result;
}
