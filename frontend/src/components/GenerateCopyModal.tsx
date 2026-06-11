"use client";

import { useState } from "react";
import { X, Sparkles, RefreshCw, ClipboardCheck } from "lucide-react";

interface Props {
  productTitle: string;
  onApply: (copy: string) => void;
  onClose: () => void;
}

// Lightweight inline markdown renderer — no external deps needed
function MarkdownPreview({ md }: { md: string }) {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length) {
      elements.push(
        <ul key={key++} className="space-y-1 my-3 ml-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-2 text-gray-300 text-sm leading-relaxed">
              <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  }

  function inlineFormat(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong class='text-white font-semibold'>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em class='text-gray-200'>$1</em>");
  }

  for (const line of lines) {
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={key++} className="text-xl font-bold text-white mt-5 mb-2 leading-tight"
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(3)) }} />
      );
    } else if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={key++} className="text-base font-bold text-emerald-400 mt-4 mb-1 uppercase tracking-wide text-xs"
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(4)) }} />
      );
    } else if (/^[-*] /.test(line)) {
      listItems.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={key++} className="text-gray-400 text-sm leading-relaxed my-1.5"
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
      );
    }
  }
  flushList();

  return <div className="py-1">{elements}</div>;
}

export default function GenerateCopyModal({ productTitle, onApply, onClose }: Props) {
  const [targetAudience, setTargetAudience] = useState("");
  const [roughNotes, setRoughNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!roughNotes.trim() || !targetAudience.trim()) {
      setError("Please fill in both fields before generating.");
      return;
    }
    setIsGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productTitle,
          productDescription: roughNotes,
          targetAudience,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Generation failed. Please try again.");
        return;
      }

      setResult(data.copy);
    } catch {
      setError("Network error. Make sure the dev server is running.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleApply() {
    onApply(result);
    onClose();
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl bg-[#111114] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">AI Sales Copywriter</h2>
              <p className="text-gray-500 text-xs">&ldquo;{productTitle}&rdquo;</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Target Audience
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                placeholder="e.g. Indie hackers who want to ship fast"
                className="w-full bg-[#1a1a1f] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Rough Notes
                <span className="ml-2 text-xs text-gray-500 font-normal">bullet points are fine</span>
              </label>
              <textarea
                rows={5}
                value={roughNotes}
                onChange={e => setRoughNotes(e.target.value)}
                placeholder={"- Pre-built auth\n- Tailwind + TypeScript\n- Stripe billing ready to go\n- Saves 40+ hours of setup"}
                className="w-full bg-[#1a1a1f] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          {/* Result preview */}
          {result && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Preview</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 rounded-md transition-colors"
                  >
                    <ClipboardCheck className="w-3 h-3" />
                    {copied ? "Copied!" : "Copy raw"}
                  </button>
                </div>
              </div>
              <div className="bg-[#0d0d10] border border-white/5 rounded-xl px-5 py-4 overflow-y-auto max-h-72">
                <MarkdownPreview md={result} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-white/5 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {result && (
              <button
                onClick={generate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white border border-white/10 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                Regenerate
              </button>
            )}

            {result ? (
              <button
                onClick={handleApply}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold rounded-lg transition-colors"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                Apply to Description
              </button>
            ) : (
              <button
                onClick={generate}
                disabled={isGenerating || !roughNotes.trim() || !targetAudience.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Sales Copy
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
