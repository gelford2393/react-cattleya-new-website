import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { buildSystemPrompt } from "./_lib/buildSystemPrompt";
import { checkAvailabilityTool } from "./_lib/checkAvailabilityTool";
import { getChatModel, recordStreamError } from "./_lib/modelFallback";

export const config = {
  runtime: "nodejs",
};

/**
 * Streaming chat endpoint for the public-facing Cattleya Resort assistant.
 *
 * Builds a fresh system prompt grounded in live Supabase data (pools, rates,
 * CMS pages) and streams the model's response back as a UI message stream
 * that the `useChat` hook on the client consumes. The model is Groq's
 * openai/gpt-oss-120b by default, automatically falling back to
 * openai/gpt-oss-20b if the primary model's daily quota is exhausted (see
 * `_lib/modelFallback.ts`).
 *
 * Registers the `checkAvailability` tool so the model can answer real
 * "is pool X free on date Y" questions via a live Firestore lookup against
 * the separate cattleyaresort-react booking system (see `_lib/checkAvailabilityTool.ts`).
 */
export async function POST(req: Request): Promise<Response> {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const [system, modelMessages] = await Promise.all([
    buildSystemPrompt(),
    convertToModelMessages(messages),
  ]);

  const result = streamText({
    model: getChatModel(),
    system,
    messages: modelMessages,
    tools: { checkAvailability: checkAvailabilityTool },
    // gpt-oss emits a separate reasoning step before each tool call (unlike
    // the previous Llama models), so a multi-pool availability question can
    // burn 2 steps (reasoning + tool-call) per pool checked. stepCountIs(4)
    // was tuned for Llama and was cutting gpt-oss off mid-tool-call with no
    // final text ever emitted — the guest just saw "Typing..." forever.
    stopWhen: stepCountIs(10),
    // Keep gpt-oss's reasoning effort low: this is a customer-facing FAQ/
    // availability bot, not a complex reasoning task, and "low" cuts the
    // reasoning-token overhead that was making replies noticeably slower.
    providerOptions: {
      groq: {
        reasoningEffort: "low",
      },
    },
    // Retry transient provider errors (overload/rate-limit) with the AI SDK's
    // built-in exponential backoff instead of surfacing a generic error.
    maxRetries: 4,
    // If the primary model is rate-limited (429), record a cooldown so the
    // *next* request automatically uses the fallback model — this one still
    // surfaces the existing friendly error to the guest via the UI stream.
    onError: ({ error }) => recordStreamError(error),
  });

  return result.toUIMessageStreamResponse();
}
