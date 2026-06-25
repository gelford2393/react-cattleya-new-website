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
 * that the `useChat` hook on the client consumes. The model is Groq Llama
 * 3.3 70B by default, automatically falling back to Llama 3.1 8B Instant if
 * the primary model's daily quota is exhausted (see `_lib/modelFallback.ts`).
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
    // streamText defaults to stopping after 1 step (stepCountIs(1)), which would
    // end the response right after a tool call with no follow-up text — the
    // guest would see the tool fire but never get an actual answer. The model
    // observed in manual testing sometimes re-calls the tool more than once
    // before answering in words, so allow a few steps rather than just one
    // follow-up, while still bounding the loop.
    stopWhen: stepCountIs(4),
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
