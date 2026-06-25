import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const SUGGESTED_PROMPTS = [
  "What pools do you have?",
  "What are your rates?",
  "What time can we check in?",
];

/**
 * Cattleya's brand green (matches `PublicContactUsPanel.tsx`), applied here
 * directly instead of through the global `--primary` token (which is blue
 * elsewhere in the app) so this widget alone picks up the resort's branding.
 */
const BRAND_BUTTON_CLASSES = "bg-[#4d9f44] text-white hover:bg-[#4d9f44]/90";

const GREETING_SHOW_DELAY_MS = 2000;
const GREETING_AUTO_DISMISS_MS = 8000;

/**
 * Matches either a `**bold**` span (group 1) or a raw URL (group 2). The bot
 * is instructed to use `**bold**` only for pool-rate headings, so this is the
 * one piece of markdown the renderer needs to understand — everything else
 * is plain text.
 */
const FORMATTED_TEXT_PATTERN = /\*\*([^*]+)\*\*|(https?:\/\/[^\s]+)/g;

/**
 * Renders bot reply text with `**bold**` headings and raw URLs (e.g. the
 * Facebook/Messenger/Maps links from the system prompt) turned into actual
 * `<strong>` and `<a target="_blank">` elements instead of inert plain text.
 */
function renderFormattedText(text: string, keyPrefix: string) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = FORMATTED_TEXT_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<span key={`${keyPrefix}-${key++}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    const [, boldText, url] = match;
    if (boldText) {
      nodes.push(<strong key={`${keyPrefix}-${key++}`}>{boldText}</strong>);
    } else if (url) {
      nodes.push(
        <a
          key={`${keyPrefix}-${key++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          // `break-all` (word-break) is required, not just the parent's
          // `break-words`: the ScrollArea viewport is `display: table`, which
          // sizes to the content's min-content width. A long unbreakable URL
          // would force the bubble wider than the panel (clipping the text)
          // unless the link itself is allowed to break at any character.
          className="break-all underline"
        >
          {url}
        </a>,
      );
    }

    lastIndex = FORMATTED_TEXT_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`${keyPrefix}-${key++}`}>{text.slice(lastIndex)}</span>);
  }

  return nodes;
}

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
  const [showGreeting, setShowGreeting] = useState(false);
  const { messages, sendMessage, status, error } = useChat({
    transport: chatTransport,
  });

  const isStreaming = status === "streaming" || status === "submitted";

  /**
   * Shows the "Leya" greeting bubble a couple seconds after the page loads,
   * then auto-dismisses it. Skipped entirely once the guest has opened the
   * chat at least once, so it doesn't keep reappearing mid-conversation.
   */
  useEffect(() => {
    if (isOpen) return;
    const showTimer = setTimeout(() => setShowGreeting(true), GREETING_SHOW_DELAY_MS);
    return () => clearTimeout(showTimer);
  }, [isOpen]);

  useEffect(() => {
    if (!showGreeting) return;
    const dismissTimer = setTimeout(() => setShowGreeting(false), GREETING_AUTO_DISMISS_MS);
    return () => clearTimeout(dismissTimer);
  }, [showGreeting]);

  /** Opens/closes the chat panel and dismisses the greeting bubble either way. */
  const handleToggle = () => {
    setShowGreeting(false);
    setIsOpen((open) => !open);
  };

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
    <TooltipProvider>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {isOpen && (
          <Card className="h-[28rem] w-80 gap-0 overflow-hidden rounded-lg p-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
              <CardTitle className="font-semibold">Leya · Cattleya Resort</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => setIsOpen(false)} aria-label="Close chat">
                    <X className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Close chat</TooltipContent>
              </Tooltip>
            </CardHeader>
            <Separator />

            <ScrollArea className="min-h-0 flex-1">
              <CardContent className="space-y-3 p-4">
                {messages.length === 0 && (
                  <div className="space-y-3">
                    <Text className="text-sm text-muted-foreground">
                      Ask me about our pools, rates, or hours!
                    </Text>
                    <div className="flex flex-col gap-2">
                      {SUGGESTED_PROMPTS.map((prompt) => (
                        <Button
                          key={prompt}
                          type="button"
                          variant="default"
                          className={cn("h-auto justify-start whitespace-normal px-3 py-2 text-left text-sm", BRAND_BUTTON_CLASSES)}
                          onClick={() => handleSuggestedPrompt(prompt)}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[85%] whitespace-pre-line break-words rounded-lg px-3 py-2 text-sm",
                      message.role === "user"
                        ? cn("ml-auto", BRAND_BUTTON_CLASSES)
                        : "mr-auto bg-muted",
                    )}
                  >
                    {message.parts.map((part, index) =>
                      part.type === "text" ? (
                        <span key={index}>{renderFormattedText(part.text, `${message.id}-${index}`)}</span>
                      ) : null,
                    )}
                  </div>
                ))}
                {isStreaming && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="size-3.5" />
                    <Text className="text-sm text-muted-foreground">Typing…</Text>
                  </div>
                )}
                {error && (
                  <div className="mr-auto max-w-[85%] whitespace-pre-line break-words rounded-lg bg-muted px-3 py-2 text-sm">
                    I'm having trouble answering right now, please try again shortly.
                  </div>
                )}
              </CardContent>
            </ScrollArea>
            <Separator />

            <CardFooter className="p-3">
              <form onSubmit={handleSubmit} className="flex w-full gap-2">
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type your question…"
                  className="flex-1"
                  disabled={isStreaming}
                />
                <Button
                  type="submit"
                  size="icon"
                  className={BRAND_BUTTON_CLASSES}
                  disabled={isStreaming || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        )}

        {showGreeting && (
          <div className="relative max-w-[14rem] rounded-2xl border border-[#7bd26a]/40 bg-white px-4 py-3 text-sm text-[#383838] shadow-lg">
            <button
              onClick={() => setShowGreeting(false)}
              aria-label="Dismiss greeting"
              className="absolute right-1.5 top-1.5 text-[#383838]/50 hover:text-[#383838]"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="pr-3">
              Hi! I'm <span className="font-semibold">Leya</span> 👋 Ask me anything!
            </p>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleToggle}
              aria-label="Toggle chat"
              className={cn("flex h-12 w-12 items-center justify-center rounded-full shadow-lg", BRAND_BUTTON_CLASSES)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{isOpen ? "Close chat" : "Chat with Leya"}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
