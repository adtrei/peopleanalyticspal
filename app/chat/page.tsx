"use client";

import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EpistemicBadge } from "@/components/ui/EpistemicBadge";
import { Send, Bot, User, Info } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const STARTER_QUESTIONS = [
  "What is the current headcount trend?",
  "Can we reliably explain why people are leaving?",
  "Which questions are not answerable with the current data?",
  "What are the top data gaps we should fix?",
  "Is our attrition rate improving or worsening?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const messageText = text ?? input.trim();
    if (!messageText || loading) return;

    const userMsg: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, history }),
      });
      const data = await res.json();
      setIsMockMode(data.isMockMode ?? false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response ?? "Sorry, I could not generate a response.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error: Could not connect to the AI service.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <PageHeader
        title="AI Analyst Chat"
        description="Ask business questions grounded in your uploaded workforce data."
      />

      {/* Mock mode notice */}
      {isMockMode && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mb-4">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Mock mode active.</strong> No OpenAI API key is configured.
            Add <code className="bg-amber-100 px-1 py-0.5 rounded">OPENAI_API_KEY</code> to{" "}
            <code className="bg-amber-100 px-1 py-0.5 rounded">.env.local</code> to enable real AI responses.
          </div>
        </div>
      )}

      {/* Epistemic legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs text-gray-500 self-center mr-1">Responses may include:</span>
        {(["known", "derived", "assumed", "unknown"] as const).map((s) => (
          <EpistemicBadge key={s} status={s} size="sm" />
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 ? (
          <div>
            <div className="text-center py-8">
              <Bot className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Ask a workforce analytics question. I will answer based on your data and
                clearly label what is known, derived, assumed, or unknown.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
              )}
              <div
                className={`max-w-2xl rounded-xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-gray-200 text-gray-800"
                }`}
              >
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask a workforce analytics question..."
          className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
