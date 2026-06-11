import { GoogleGenAI, ApiError } from "@google/genai";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an elite direct-response copywriter specializing in digital products and micro-SaaS.
Your goal is to convert the user's rough notes into a high-converting sales page using the AIDA (Attention, Interest, Desire, Action) framework.

RULES:
1. Output ONLY valid Markdown. Do not include HTML.
2. Use compelling headers (## and ###).
3. Structure the page as follows:
   - A bold, punchy headline that promises a specific outcome.
   - A short hook that identifies the target audience's pain point.
   - The Solution (Introduce the product and how it solves the problem).
   - "What's Inside" (Transform their rough features into benefit-driven bullet points).
   - A strong closing Call to Action.
4. Keep paragraphs short (1-3 sentences maximum).
5. Tone should be professional, energetic, and persuasive, but not scammy. Avoid words like "revolutionary" or "synergy."
6. Do NOT wrap the entire response in a markdown code block (\`\`\`markdown). Just output the raw markdown text`;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key is not configured. Set GEMINI_API_KEY in your environment." },
      { status: 500 }
    );
  }

  let body: { productTitle?: string; productDescription?: string; targetAudience?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { productTitle, productDescription, targetAudience } = body;

  if (!productTitle?.trim() || !productDescription?.trim() || !targetAudience?.trim()) {
    return NextResponse.json(
      { error: "productTitle, productDescription, and targetAudience are all required." },
      { status: 400 }
    );
  }

  const userPrompt = `
Product Title: ${productTitle.trim()}

Target Audience: ${targetAudience.trim()}

Rough Notes / Features:
${productDescription.trim()}

Write a full, high-converting sales page for this product.
`.trim();

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.8,
        maxOutputTokens: 2048,
      },
    });

    const copy = response.text;

    if (!copy) {
      return NextResponse.json(
        { error: "The model returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ copy });
  } catch (err) {
    if (err instanceof ApiError) {
      // Rate limit
      if (err.status === 429) {
        return NextResponse.json(
          { error: "Rate limit reached. Please wait a moment and try again." },
          { status: 429 }
        );
      }
      // Invalid API key / auth
      if (err.status === 401 || err.status === 403) {
        return NextResponse.json(
          { error: "Invalid Gemini API key. Check your GEMINI_API_KEY environment variable." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: err.message || "Gemini API error." },
        { status: err.status ?? 500 }
      );
    }

    console.error("AI generate-copy unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
