import { GoogleGenAI, ApiError } from "@google/genai";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function buildSystemPrompt(
  title: string,
  price: number,
  description: string,
  aiCustomContext: string
): string {
  return `You are a helpful, persuasive sales assistant for a digital product called "${title}".
The price of this product is $${price.toFixed(2)}.

Here is the public description of the product:
"""
${description}
"""

Here are the creator's private instructions for answering questions:
"""
${aiCustomContext || "No additional context provided."}
"""

RULES:
1. Your goal is to answer the buyer's questions accurately based ONLY on the provided context.
2. Be concise, friendly, and helpful. Keep answers under 3 short paragraphs.
3. NEVER give away the actual contents of the digital product for free. If they ask for the paid content, politely explain that it is available upon purchase.
4. If you do not know the answer based on the context, admit it politely. Do not hallucinate features.
5. Do not use markdown headers; use bolding and bullet points for readability.`;
}

export async function POST(request: Request) {
  // ── 1. Validate Gemini API key ──────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Gemini API key not configured." },
      { status: 500 }
    );
  }

  // ── 2. Parse & validate request body ───────────────────────────────────────
  let body: {
    productId?: string;
    message?: string;
    history?: Array<{ role: "user" | "model"; content: string }>;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { productId, message, history = [] } = body;

  if (!productId?.trim() || !message?.trim()) {
    return Response.json(
      { error: "productId and message are required." },
      { status: 400 }
    );
  }

  // ── 3. Fetch product context from backend ───────────────────────────────────
  let productContext: {
    title: string;
    description: string;
    price: number;
    aiCustomContext: string;
  };

  try {
    const contextRes = await fetch(
      `${BACKEND}/chat/${productId.trim()}/context`
    );

    if (contextRes.status === 404) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }
    if (contextRes.status === 403) {
      return Response.json(
        { error: "Chat is not enabled for this product." },
        { status: 403 }
      );
    }
    if (!contextRes.ok) {
      return Response.json(
        { error: "Failed to load product context." },
        { status: 502 }
      );
    }

    productContext = await contextRes.json();
  } catch {
    return Response.json(
      { error: "Could not reach the backend. Is it running?" },
      { status: 503 }
    );
  }

  // ── 4. Build conversation contents ─────────────────────────────────────────
  const contents = [
    ...history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
    { role: "user" as const, parts: [{ text: message.trim() }] },
  ];

  // ── 5. Call Gemini and stream the response ──────────────────────────────────
  try {
    const ai = new GoogleGenAI({ apiKey });

    const geminiStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: buildSystemPrompt(
          productContext.title,
          productContext.price,
          productContext.description,
          productContext.aiCustomContext
        ),
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of geminiStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 429) {
        return Response.json(
          { error: "Rate limit reached. Please try again shortly." },
          { status: 429 }
        );
      }
      if (err.status === 401 || err.status === 403) {
        return Response.json(
          { error: "Invalid Gemini API key." },
          { status: 401 }
        );
      }
      return Response.json(
        { error: err.message ?? "Gemini API error." },
        { status: err.status ?? 500 }
      );
    }

    console.error("Chat route unexpected error:", err);
    return Response.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
