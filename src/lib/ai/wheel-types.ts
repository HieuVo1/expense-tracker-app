import type { LifeArea } from '@prisma/client';

// ----------------------------------------------------------------------

export type WheelScores = Record<LifeArea, number>; // 1-10

export type WheelSuggestion = {
  area: LifeArea;
  message: string; // VN, ≤ 200 chars
  recommendedTaskTitle?: string; // optional, ≤ 120 chars
};

// Compact signal payload sent to Gemini. Aggregated counts/sums + small
// samples. Per-row data never leaves the server.
export type WheelSignals = {
  periodDays: number;
  tasksByArea: Partial<Record<LifeArea, { total: number; done: number }>>;
  notesByType: Partial<Record<string, { count: number; recentTitles: string[] }>>;
  gratitudeStats: { entryCount: number; sampleItems: string[] };
  txStats: {
    income: number;
    expense: number;
    topExpenseCategories: Array<{ name: string; sum: number }>;
    expenseByLifeArea: Partial<Record<LifeArea, number>>;
  };
  assetSnapshot: { netWorth: number };
  aboutMeStats: { goals: number; lessons: number; principles: number };
  // Keyword hits across user free-form text (notes content, gratitude
  // items, transaction descriptions). Fills the signal gap for HEALTH /
  // FAMILY / SOCIAL / RECREATION when tasks are untagged.
  textMentions: {
    noteHits: Partial<Record<LifeArea, number>>;
    gratitudeHits: Partial<Record<LifeArea, number>>;
    transactionHits: Partial<Record<LifeArea, number>>;
  };
};

export type LifeWheelAssessmentDto = {
  id: string;
  computedAt: string; // ISO
  periodDays: number;
  scores: WheelScores;
  suggestions: WheelSuggestion[];
  inputSummary: WheelSignals;
};
