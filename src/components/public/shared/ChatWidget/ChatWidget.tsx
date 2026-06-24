import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

const SUGGESTED_PROMPTS = [
  "What pools do you have?",
  "What are your rates?",
  "What time can we check in?",
];

/**
 * Transport is created once at module scope rather than inside the component:
 * its config is static, so re-creating it on every render would needlessly
 * churn the `useChat` hook's transport reference.
 */
const chatTransport = new DefaultChatTransport({ api: "/api/chat" });

/**
 * Floating chat widget for the public site. Renders a toggleable panel in the
 * bottom-right corner that streams answers from the `/api/chat` endpoint via
 * the AI SDK's `useChat` hook, plus a few suggested-prompt shortcuts shown when
 * the conversation is empty.
 */
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: chatTransport,
  });

  const isStreaming = status === "streaming" || status === "submitted";

  /** Sends the typed message and clears the input box. */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  /** Sends a one-tap suggested prompt without touching the input box. */
  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage({ text: prompt });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {isOpen && (
        <div className="flex h-[28rem] w-80 flex-col rounded-lg border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <Text className="font-semibold">Ask Cattleya Resort</Text>
            <button onClick={() => setIsOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <Text className="text-sm text-muted-foreground">
                  Ask me about our pools, rates, or hours!
                </Text>
                <div className="flex flex-col gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSuggestedPrompt(prompt)}
                      className="rounded-md bg-primary px-3 py-2 text-left text-sm text-primary-foreground hover:opacity-90"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "mr-auto max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm"
                }
              >
                {message.parts.map((part, index) =>
                  part.type === "text" ? <span key={index}>{part.text}</span> : null,
                )}
              </div>
            ))}
            {isStreaming && (
              <Text className="text-sm text-muted-foreground">Typing…</Text>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t p-3">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your question…"
              className="flex-1"
              disabled={isStreaming}
            />
            <Button type="submit" size="icon" disabled={isStreaming || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Toggle chat"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
