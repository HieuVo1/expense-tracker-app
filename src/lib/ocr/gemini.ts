import type { OcrProvider, OcrResult, TransactionExtract } from './types';

import { GoogleGenAI, Type } from '@google/genai';

import { VN_CATEGORIES } from './types';
import { buildExtractionPrompt } from './prompt';

const MODEL = 'gemini-2.5-flash';

// Free-tier: 15 RPM, 1M tokens/day. Flash handles VN OCR well at near-zero
// latency vs Pro, which is overkill for receipt extraction.
function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment');
  }
  return new GoogleGenAI({ apiKey });
}

// Schema mirrors OcrResult.transactions[]. responseMimeType + responseSchema
// guarantees JSON shape — model can't return malformed output.
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    transactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.INTEGER, description: 'VND, integer, no decimals, always positive' },
          type: { type: Type.STRING, enum: ['expense', 'income'] },
          date: { type: Type.STRING, description: 'ISO YYYY-MM-DD' },
          description: { type: Type.STRING },
          merchant: { type: Type.STRING, nullable: true },
          suggestedCategory: { type: Type.STRING, enum: [...VN_CATEGORIES] },
        },
        required: ['amount', 'type', 'date', 'description', 'suggestedCategory'],
        propertyOrdering: ['amount', 'type', 'date', 'description', 'merchant', 'suggestedCategory'],
      },
    },
  },
  required: ['transactions'],
};

async function toBase64(image: Buffer | Blob): Promise<{ data: string; mimeType: string }> {
  if (Buffer.isBuffer(image)) {
    return { data: image.toString('base64'), mimeType: 'image/jpeg' };
  }
  const blob = image as Blob;
  const arrayBuffer = await blob.arrayBuffer();
  const data = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = blob.type || 'image/jpeg';
  return { data, mimeType };
}

export const geminiProvider: OcrProvider = {
  name: 'gemini',

  async extractTransactions(images) {
    if (images.length === 0) {
      throw new Error('No images provided to OCR');
    }
    const client = getClient();

    // Encode all images in parallel — base64 conversion is CPU-bound but each
    // image is small enough that this finishes well under the network RTT.
    const encoded = await Promise.all(images.map(toBase64));

    // Single request with all images inline + one prompt. Gemini will see them
    // as a sequence and extract transactions across the whole batch.
    const parts = [
      ...encoded.map(({ data, mimeType }) => ({
        inlineData: { mimeType, data },
      })),
      { text: buildExtractionPrompt(new Date()) },
    ];

    const start = Date.now();
    const response = await client.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts }],
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        // Deterministic for evals — temp 0 stops creative re-interpretation.
        temperature: 0,
      },
    });
    const latencyMs = Date.now() - start;

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned empty response');
    }

    let parsed: { transactions: TransactionExtract[] };
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      throw new Error(`Gemini returned non-JSON response: ${text.slice(0, 200)}`);
    }

    return {
      provider: 'gemini',
      latencyMs,
      inputTokens: response.usageMetadata?.promptTokenCount,
      outputTokens: response.usageMetadata?.candidatesTokenCount,
      transactions: parsed.transactions ?? [],
      rawJson: response,
    } satisfies OcrResult;
  },
};
