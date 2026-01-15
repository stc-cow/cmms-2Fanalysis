/**
 * COW Movement POT Chat Component
 * ChatGPT-like interface for querying COW movement insights
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, MessageSquare, Plus, Trash2 } from "lucide-react";
import type { ChatMessage, ChatSession } from "@/lib/cowMovementChatbot";
import { COWMovementChatbot } from "@/lib/cowMovementChatbot";
import type { CowMovementsFact, DimLocation } from "@shared/models";

interface COWMovementChatProps {
  movements: CowMovementsFact[];
  locations: DimLocation[];
  onClose?: () => void;
}

export function COWMovementChat({
  movements,
  locations,
  onClose,
}: COWMovementChatProps) {
  const [chatbot] = useState(() => {
    const bot = new COWMovementChatbot();
    bot.initialize(movements, locations);
    return bot;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content: `🐄 **Welcome to COW Movement POT**

I'm your AI assistant for COW movement insights and predictions. I can help you with:

- **Check Status**: Ask about specific COW locations and details
- **Get Predictions**: Forecast where COWs should move next
- **Recommendations**: Get movement action recommendations
- **Analytics**: View statistics, trends, and patterns
- **Analysis**: Deep dive into movement insights

Try asking something like:
- "What's the status of COW_001?"
- "Show me movement statistics"
- "Analyze COW movement patterns"
- "Help me understand the data"

Type a message below to get started! 🚀`,
      timestamp: new Date(),
      metadata: {
        query_type: "HELP",
        confidence: 1,
      },
    };

    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Handle sending a message
   */
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);

    try {
      const response = await chatbot.chat(input);
      setMessages((prev) => [...prev, response.message]);
      setInput("");
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * New chat session
   */
  const handleNewChat = () => {
    const session = chatbot.getSession();
    setSessions((prev) => [...prev, session]);
    setCurrentSession(session.id);
    setMessages([]);
  };

  /**
   * Delete session
   */
  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSession === sessionId) {
      setCurrentSession(null);
      setMessages([]);
    }
  };

  /**
   * Load session
   */
  const handleLoadSession = (session: ChatSession) => {
    setCurrentSession(session.id);
    setMessages(session.messages);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            🐄 COW Movement POT
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            AI Assistant
          </p>
        </div>

        {/* New Chat Button */}
        <Button
          onClick={handleNewChat}
          className="m-4 w-auto flex items-center gap-2"
          variant="outline"
        >
          <Plus size={18} />
          New Chat
        </Button>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-8">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
              <p>No previous chats</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  currentSession === session.id
                    ? "bg-blue-100 dark:bg-blue-900 border border-blue-300"
                    : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
                onClick={() => handleLoadSession(session)}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {session.messages.length} messages
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
                  }}
                  className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {onClose && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Close Chat
            </Button>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-5xl mb-4">🐄</div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  COW Movement POT
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Your AI assistant for movement insights
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessageComponent
                key={message.id}
                message={message}
              />
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              <span>POT is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-slate-800">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask about COW movements, predictions, statistics..."
              className="flex-1"
              disabled={loading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="px-4"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            💡 Tip: Type "help" to see example questions
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual chat message component
 */
function ChatMessageComponent({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-2xl rounded-lg p-4 ${
          isAssistant
            ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
            : "bg-blue-500 text-white"
        }`}
      >
        {isAssistant && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🐄</span>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              COW Movement POT
            </span>
            {message.metadata?.confidence !== undefined && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Confidence: {Math.round(message.metadata.confidence * 100)}%
              </span>
            )}
          </div>
        )}

        <div className="prose dark:prose-invert prose-sm max-w-none">
          {message.content.split("\n").map((line, i) => {
            // Format bold text
            if (line.startsWith("**") && line.endsWith("**")) {
              return (
                <p key={i} className="font-bold text-base my-2">
                  {line.slice(2, -2)}
                </p>
              );
            }
            // Format headers
            if (line.startsWith("# ")) {
              return (
                <h3 key={i} className="font-bold text-lg my-2">
                  {line.slice(2)}
                </h3>
              );
            }
            // Format list items
            if (line.startsWith("- ")) {
              return (
                <p key={i} className="ml-4 my-1">
                  {line}
                </p>
              );
            }
            return (
              <p key={i} className="my-1">
                {line}
              </p>
            );
          })}
        </div>

        {isAssistant && message.metadata?.sources && (
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              📚 Sources: {message.metadata.sources.join(", ")}
            </p>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 opacity-70">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
