import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { buildSystemPrompt } from "./_lib/buildSystemPrompt";
import { checkAvailabilityTool } from "./_lib/checkAvailabilityTool";

export const config = {
  runtime: "nodejs",
};

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
    tools: {
      checkAvailability: checkAvailabilityTool,
    },
  });

  return result.toUIMessageStreamResponse();
}
