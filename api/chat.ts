import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { buildSystemPrompt } from "./_lib/buildSystemPrompt";

export const config = {
  runtime: "nodejs",
};

/**
 * Streaming chat endpoint for the public-facing Cattleya Resort assistant.
 *
 * Builds a fresh system prompt grounded in live Supabase data (pools, rates,
 * CMS pages) and streams Gemini's response back as a UI message stream that
 * the `useChat` hook on the client consumes.
 *
 * NOTE: The `checkAvailability` tool is intentionally NOT wired in yet. It is
 * still a stub that always reports a pool as available (see
 * `_lib/checkAvailabilityTool.ts`), so exposing it to real guests would let
 * the bot confidently give false booking availability. Re-add it to a `tools`
 * option here only once it performs a real Firestore lookup.
 */
export async function POST(req: Request): Promise<Response> {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const [system, modelMessages] = await Promise.all([
    buildSystemPrompt(),
    convertToModelMessages(messages),
  ]);

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
