"use client";

import { useState, useRef } from "react";
import { ArrowLeft, UploadCloud, Save, Info, X, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createProduct, getPresignedUploadUrl, ApiError } from "@/lib/api";
import GenerateCopyModal from "@/components/GenerateCopyModal";

export default function NewProductPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<"idle" | "uploading" | "done">("idle");
  const [showAiModal, setShowAiModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(f: File): Promise<string> {
    if (!token) throw new Error("Not authenticated");
    setUploadProgress("uploading");
    const { uploadUrl, key } = await getPresignedUploadUrl(token, f.name, f.type);
    await fetch(uploadUrl, { method: "PUT", body: f, headers: { "Content-Type": f.type } });
    setUploadProgress("done");
    return key;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    setIsSubmitting(true);

    try {
      let fileUrl = "";
      if (file) {
        fileUrl = await uploadFile(file);
      }

      await createProduct(token, {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        fileUrl,
        isPublished,
      });

      router.push("/dashboard/products");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setUploadProgress("idle");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-10 max-w-[1000px] mx-auto w-full">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/products"
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Create Product</h1>
            <p className="text-gray-400 text-sm">Add a new digital product to your storefront.</p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
              Saving...
            </span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Product
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#18181c] border border-white/5 rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Product Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Ultimate Next.js Course"
                className="w-full bg-[#111114] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">Description</label>
                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  Generate with AI
                </button>
              </div>
              <textarea
                rows={5}
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what your customers will receive..."
                className="w-full bg-[#111114] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-y"
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-[#18181c] border border-white/5 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-medium text-white mb-2">Digital File</h2>
            <p className="text-sm text-gray-400 mb-6">
              Upload the file your customers download after purchase. Stored securely in AWS S3.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />

            {file ? (
              <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{file.name}</div>
                    <div className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                      {uploadProgress === "uploading" && " · Uploading..."}
                      {uploadProgress === "done" && " · Uploaded ✓"}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setFile(null); setUploadProgress("idle"); }}
                  className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-white/10 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-white/[0.02] hover:border-white/20 transition-all cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-emerald-500">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-white font-medium mb-1">Click to upload file</h3>
                <p className="text-gray-500 text-sm max-w-sm">ZIP, PDF, Video, or Audio. Max 2GB.</p>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="bg-[#18181c] border border-white/5 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-medium text-white mb-4">Pricing</h2>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#111114] border border-white/10 rounded-lg py-3 pl-8 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors text-lg"
              />
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 bg-white/5 p-3 rounded-md">
              <Info className="w-4 h-4 shrink-0 text-emerald-500" />
              <p>You keep 100% of this price (minus Stripe processing fees).</p>
            </div>
          </div>

          <div className="bg-[#18181c] border border-white/5 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-medium text-white mb-4">Visibility</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={e => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500/50 bg-[#111114]"
              />
              <span className="text-sm text-gray-300">Published to storefront</span>
            </label>
            <p className="text-xs text-gray-500 mt-2 ml-7">If unchecked, saved as a draft.</p>
          </div>
        </div>
      </form>

      {showAiModal && (
        <GenerateCopyModal
          productTitle={title || "New Product"}
          onApply={copy => setDescription(copy)}
          onClose={() => setShowAiModal(false)}
        />
      )}
    </div>
  );
}
