import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isStreaming = status === "streaming" || status === "submitted";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
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
              <Text className="text-sm text-muted-foreground">
                Ask me about our pools, rates, or hours!
              </Text>
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
