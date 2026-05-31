import type { VerseRef, VerseFetchResult, BibleSourceProvider } from './types';

import { Type, GoogleGenAI } from '@google/genai';

import { normalizeRef } from './types';

// Gemini fallback for Bible verse lookup. Triggered when bible.com fetch/parse
// fails (404, markup change, network timeout). Hallucination risk is real —
// model may slightly paraphrase — but it's our last resort before a stub row.

const MODEL = 'gemini-3.1-flash-lite';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment');
  return new GoogleGenAI({ apiKey });
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    text: {
      type: Type.STRING,
      description: 'The exact Bible verse text in Vietnamese, no commentary.',
    },
    confident: {
      type: Type.BOOLEAN,
      description: 'False if you are not sure the text matches the requested version.',
    },
  },
  required: ['text', 'confident'],
};

function buildPrompt(ref: Required<VerseRef>): string {
  const range =
    ref.startVerse === ref.endVerse
      ? `câu ${ref.startVerse}`
      : `câu ${ref.startVerse}-${ref.endVerse}`;
  return `Trích chính xác đoạn Kinh thánh sau theo bản dịch ${ref.version}:
- Sách: ${ref.bookName} (mã USFM: ${ref.bookCode})
- Chương: ${ref.chapter}
- Phạm vi: ${range}

Yêu cầu:
- Trả về chỉ phần văn bản thuần, không số câu, không tiêu đề, không chú thích.
- Nếu phạm vi gồm nhiều câu, nối các câu bằng một dấu cách.
- Nếu bạn không chắc bản dịch khớp đúng, đặt confident=false.`;
}

export const geminiBibleProvider: BibleSourceProvider = {
  name: 'gemini',

  async fetchVerse(ref: VerseRef): Promise<VerseFetchResult> {
    const normalized = normalizeRef(ref);
    try {
      const client = getClient();
      const response = await client.models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: [{ text: buildPrompt(normalized) }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0,
        },
      });
      const raw = response.text;
      if (!raw) {
        return { ok: false, error: 'Gemini returned empty response', source: 'gemini' };
      }
      const parsed = JSON.parse(raw) as { text: string; confident: boolean };
      const text = parsed.text.trim();
      if (!text) {
        return { ok: false, error: 'Gemini returned empty verse text', source: 'gemini' };
      }
      if (!parsed.confident) {
        // Surface low-confidence with a marker so the user knows to double-check
        // in the UI. Still treated as ok so the import doesn't fail outright.
        return { ok: true, text: `${text} [⚠ Gemini không chắc bản dịch]`, source: 'gemini' };
      }
      return { ok: true, text, source: 'gemini' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg, source: 'gemini' };
    }
  },
};
