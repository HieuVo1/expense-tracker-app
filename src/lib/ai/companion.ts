import type { CompanionResult, CompanionCorpusEntry } from './types';

import { Type, GoogleGenAI } from '@google/genai';

import { buildCompanionPrompt } from './companion-prompt';

// ----------------------------------------------------------------------

// Flash, not Pro: empathetic VN text + id selection is well within Flash's
// reach, at near-zero latency vs Pro and inside the free-tier quota.
const MODEL = 'gemini-3.1-flash-lite';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment');
  }
  return new GoogleGenAI({ apiKey });
}

// responseMimeType + responseSchema guarantees JSON shape — the model
// cannot return malformed output.
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    acknowledgment: { type: Type.STRING },
    relatedEntryIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Subset of supplied entry ids, 0–3 items, most relevant first',
    },
    insight: { type: Type.STRING },
    suggestion: { type: Type.STRING },
  },
  required: ['acknowledgment', 'relatedEntryIds', 'insight', 'suggestion'],
  propertyOrdering: ['acknowledgment', 'relatedEntryIds', 'insight', 'suggestion'],
};

export async function requestCompanionSuggestion(
  problem: string,
  entries: CompanionCorpusEntry[]
): Promise<CompanionResult> {
  const client = getClient();

  const response = await client.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: buildCompanionPrompt(problem, entries) }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      // A little warmth in phrasing; entry selection stays stable enough.
      temperature: 0.4,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  let parsed: Partial<CompanionResult>;
  try {
    parsed = JSON.parse(text) as Partial<CompanionResult>;
  } catch {
    throw new Error(`Gemini returned non-JSON response: ${text.slice(0, 200)}`);
  }

  // Defend against hallucinated ids — keep only ids actually in the corpus.
  const validIds = new Set(entries.map((e) => e.id));
  return {
    acknowledgment: parsed.acknowledgment ?? '',
    insight: parsed.insight ?? '',
    suggestion: parsed.suggestion ?? '',
    relatedEntryIds: (parsed.relatedEntryIds ?? []).filter((id) => validIds.has(id)).slice(0, 3),
  };
}
