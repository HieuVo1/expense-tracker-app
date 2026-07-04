import type { LifeArea } from '@prisma/client';
import type { WheelScores, WheelSignals, WheelSuggestion } from './wheel-types';

import { Type, GoogleGenAI } from '@google/genai';

import { buildWheelPrompt } from './wheel-prompt';

// ----------------------------------------------------------------------

// Flash, not Pro — same reasoning as companion.ts: simple structured task,
// free-tier-friendly.
const MODEL = 'gemini-3.1-flash-lite';

const AREA_KEYS: LifeArea[] = [
  'HEALTH',
  'CAREER',
  'FINANCE',
  'GROWTH',
  'FAMILY',
  'SOCIAL',
  'RECREATION',
  'SPIRITUALITY',
];

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment');
  return new GoogleGenAI({ apiKey });
}

// JSON schema enforces 8 score keys + suggestion shape. Worst-case
// hallucination = bad scores, never malformed output.
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    scores: {
      type: Type.OBJECT,
      properties: Object.fromEntries(
        AREA_KEYS.map((k) => [k, { type: Type.INTEGER, minimum: 1, maximum: 10 }])
      ),
      required: AREA_KEYS,
    },
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING, enum: AREA_KEYS },
          message: { type: Type.STRING },
          reason: { type: Type.STRING },
          recommendedTasks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            minItems: 1,
            maxItems: 3,
          },
        },
        required: ['area', 'message', 'recommendedTasks'],
      },
    },
  },
  required: ['scores', 'suggestions'],
};

function clamp1to10(n: unknown): number {
  const x = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(x)) return 5;
  return Math.min(10, Math.max(1, Math.round(x)));
}

export async function requestWheelAssessment(signals: WheelSignals): Promise<{
  scores: WheelScores;
  suggestions: WheelSuggestion[];
}> {
  const client = getClient();

  const response = await client.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: buildWheelPrompt(signals) }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.3,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Gemini returned empty response');

  let parsed: { scores?: Record<string, unknown>; suggestions?: unknown[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned non-JSON: ${text.slice(0, 200)}`);
  }

  // Normalize: ensure all 8 keys are present, clamp 1-10.
  const scores = Object.fromEntries(
    AREA_KEYS.map((k) => [k, clamp1to10(parsed.scores?.[k])])
  ) as WheelScores;

  const suggestions: WheelSuggestion[] = (parsed.suggestions ?? [])
    .slice(0, 8)
    .filter(
      (s): s is { area: string; message: string; reason?: string; recommendedTasks?: unknown[] } => {
        if (typeof s !== 'object' || s === null) return false;
        const obj = s as Record<string, unknown>;
        return (
          typeof obj.area === 'string' &&
          AREA_KEYS.includes(obj.area as LifeArea) &&
          typeof obj.message === 'string'
        );
      }
    )
    .map((s) => ({
      area: s.area as LifeArea,
      message: s.message.slice(0, 250),
      reason: typeof s.reason === 'string' ? s.reason.slice(0, 200) : undefined,
      recommendedTasks: (s.recommendedTasks ?? [])
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        .slice(0, 3)
        .map((t) => t.trim().slice(0, 120)),
    }));

  return { scores, suggestions };
}
