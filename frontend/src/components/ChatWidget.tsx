"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react";

type Message = { role: "user" | "model"; content: string };

interface Props {
  productId: string;
  productTitle: string;
}

export default function ChatWidget({ productId, productTitle }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setError("");
    const history = messages; // snapshot before mutation
    setMessages(prev => [
      ...prev,
      { role: "user", content: text },
      { role: "model", content: "" },
    ]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, message: text, history }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error ?? "Something went wrong. Please try again.";
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: "model", content: msg };
          return next;
        });
        setError(msg);
        return;
      }

      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "model",
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
      }
    } catch {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "model",
          content: "Network error — please check your connection.",
        };
        return next;
      });
    } finally {
      readerRef.current = null;
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, productId]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const lastIsEmpty =
    messages.length > 0 &&
    messages[messages.length - 1].role === "model" &&
    messages[messages.length - 1].content === "";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* ── Chat Panel ────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="w-[360px] flex flex-col bg-[#111114] border border-white/10 rounded-2xl shadow-[0_8px_60px_-10px_rgba(0,0,0,0.8)] overflow-hidden"
          style={{ height: "480px" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 shrink-0 bg-[#0d0d10]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">Ask about this product</p>
                <p className="text-[11px] text-emerald-500 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  AI-powered · always available
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
            {messages.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">Got questions?</p>
                <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
                  Ask me anything about{" "}
                  <span className="text-white font-medium">{productTitle}</span> before you buy.
                </p>
                <div className="mt-5 flex flex-col gap-2 w-full">
                  {[
                    "Who is this product for?",
                    "What's included exactly?",
                    "Do I need prior experience?",
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); inputRef.current?.focus(); }}
                      className="text-xs text-gray-400 hover:text-white border border-white/8 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg px-3 py-2 text-left transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "model" && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mb-0.5">
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  )}

                  <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-emerald-500 text-black font-medium rounded-br-sm"
                      : "bg-[#1c1c22] text-gray-200 border border-white/[0.06] rounded-bl-sm"
                  }`}>
                    {/* Bouncing dots while waiting for first token */}
                    {msg.role === "model" && isStreaming && i === messages.length - 1 && lastIsEmpty ? (
                      <span className="flex gap-1 items-center py-0.5">
                        {[0, 150, 300].map(delay => (
                          <span
                            key={delay}
                            className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </span>
                    ) : (
                      <>
                        {msg.content}
                        {/* Blinking cursor while streaming text */}
                        {msg.role === "model" && isStreaming && i === messages.length - 1 && !lastIsEmpty && (
                          <span className="inline-block w-0.5 h-3.5 bg-emerald-400 ml-0.5 align-middle animate-pulse" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/5 shrink-0 bg-[#0d0d10]">
            {error && (
              <p className="text-[11px] text-red-400 mb-2 px-1">{error}</p>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                disabled={isStreaming}
                maxLength={500}
                className="flex-1 min-w-0 bg-[#1a1a1f] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/40 transition-colors disabled:opacity-50"
              />
              <button
                onClick={send}
                disabled={!input.trim() || isStreaming}
                className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors shrink-0"
              >
                {isStreaming ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-black" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toggle Button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={isOpen ? "Close chat" : "Ask a question"}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
          isOpen
            ? "bg-[#1a1a1f] border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
            : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_30px_-4px_rgba(16,185,129,0.6)] hover:scale-105"
        }`}
      >
        {isOpen
          ? <X className="w-5 h-5" />
          : <MessageCircle className="w-6 h-6" />
        }
      </button>
    </div>
  );
}
