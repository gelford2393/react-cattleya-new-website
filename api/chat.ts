import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { groq } from "@ai-sdk/groq";
import { buildSystemPrompt } from "./_lib/buildSystemPrompt";
import { checkAvailabilityTool } from "./_lib/checkAvailabilityTool";

export const config = {
  runtime: "nodejs",
};

/**
 * Streaming chat endpoint for the public-facing Cattleya Resort assistant.
 *
 * Builds a fresh system prompt grounded in live Supabase data (pools, rates,
 * CMS pages) and streams the model's response (Groq Llama 3.3 70B) back as a
 * UI message stream that the `useChat` hook on the client consumes.
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
    model: groq("llama-3.3-70b-versatile"),
    system,
    messages: modelMessages,
    tools: { checkAvailability: checkAvailabilityTool },
    // Retry transient provider errors (overload/rate-limit) with the AI SDK's
    // built-in exponential backoff instead of surfacing a generic error.
    maxRetries: 4,
  });

  return result.toUIMessageStreamResponse();
}
