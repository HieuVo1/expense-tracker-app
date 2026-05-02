import type { OcrResult, OcrProvider, TransactionExtract } from './types';

import { Type, GoogleGenAI } from '@google/genai';

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
//
// `date` and `time` come back separately from the model — folding them into
// the single `TransactionExtract.date` wire field happens after parsing so
// the default-to-noon rule lives in one place.
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
          time: {
            type: Type.STRING,
            nullable: true,
            description: 'HH:mm if visible, null otherwise',
          },
          description: { type: Type.STRING },
          merchant: { type: Type.STRING, nullable: true },
          suggestedCategory: { type: Type.STRING, enum: [...VN_CATEGORIES] },
        },
        required: ['amount', 'type', 'date', 'description', 'suggestedCategory'],
        propertyOrdering: [
          'amount',
          'type',
          'date',
          'time',
          'description',
          'merchant',
          'suggestedCategory',
        ],
      },
    },
  },
  required: ['transactions'],
};

// HH:mm validation — model occasionally produces "9:30" (no leading zero) or
// stray seconds. Anything outside this shape falls back to the noon default.
const TIME_RE = /^\d{2}:\d{2}$/;

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

    type RawTx = Omit<TransactionExtract, 'date'> & { date: string; time?: string | null };
    let parsed: { transactions: RawTx[] };
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      throw new Error(`Gemini returned non-JSON response: ${text.slice(0, 200)}`);
    }

    // Fold model's (date, time) → single `YYYY-MM-DDTHH:mm` wire field.
    // Time defaults to noon when missing/malformed so the form has a sensible
    // pre-fill the user can tweak rather than midnight.
    const transactions: TransactionExtract[] = (parsed.transactions ?? []).map((t) => {
      const time = t.time && TIME_RE.test(t.time) ? t.time : '12:00';
      return {
        amount: t.amount,
        type: t.type,
        date: `${t.date}T${time}`,
        description: t.description,
        merchant: t.merchant,
        suggestedCategory: t.suggestedCategory,
      };
    });

    return {
      provider: 'gemini',
      latencyMs,
      inputTokens: response.usageMetadata?.promptTokenCount,
      outputTokens: response.usageMetadata?.candidatesTokenCount,
      transactions,
      rawJson: response,
    } satisfies OcrResult;
  },
};
