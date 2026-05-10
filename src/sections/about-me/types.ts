// About-me module types — mirrors NoteType UPPERCASE enum values.
// Old Notes module continues to use the lowercase NoteType subset (daily|insight|strength|weakness|idea).
// Metadata shapes are validated by Zod at the server action boundary (schemas.ts).

// ----------------------------------------------------------------------

export type AboutMeType =
  | 'GOAL'
  | 'THOUGHT'
  | 'LESSON'
  | 'SIGNAL'
  | 'PRINCIPLE'
  | 'TRAIT'
  | 'ACTION';

// ----------------------------------------------------------------------
// Metadata interfaces — one per type. All optional fields use `?`.

/** GOAL: North-star goals and dreams (short/long/dream). */
export interface GoalMetadata {
  kind: 'short' | 'long' | 'dream';
  /** ISO date-only string e.g. "2026-12-31" — no time component. */
  targetDate?: string;
  status: 'active' | 'achieved' | 'paused' | 'abandoned';
  /** 0–100, snapshot frozen when status becomes paused/abandoned. */
  progress?: number;
}

/** THOUGHT: Free-form stream-of-consciousness — no structured metadata. */
export interface ThoughtMetadata {
  mood?: 'positive' | 'neutral' | 'negative';
}

/** LESSON: Lessons learned from experience/books/courses. */
export interface LessonMetadata {
  source: 'course' | 'experience' | 'book' | 'reflection';
  /** Key takeaway (short summary line). */
  takeaway?: string;
}

/** SIGNAL: Emotional signal / pattern detection input. */
export interface SignalMetadata {
  kind: 'positive' | 'negative';
  /** Trigger that caused this signal (e.g. "bị chỉ trích trước đám đông"). */
  trigger: string;
  /** Emotion felt (e.g. "tức giận", "xấu hổ"). */
  emotion: string;
  /** Meaning interpreted from the signal. */
  meaning?: string;
  /** Planned coping action or leverage. */
  action?: string;
}

/** PRINCIPLE: Beliefs and life principles. */
export interface PrincipleMetadata {
  domain?: 'work' | 'relationship' | 'health' | 'finance' | 'growth' | 'other';
  /** Note.id (cuid) of the LESSON row this principle was derived from, if any. */
  derivedFromLessonId?: string;
}

/** TRAIT: Self-assessed strengths or weaknesses. */
export interface TraitMetadata {
  kind: 'strength' | 'weakness';
  /** Specific context where this trait appears. */
  context?: string;
}

/** ACTION: Committed actions (can be toggled done/skipped). */
export interface ActionMetadata {
  status: 'planned' | 'doing' | 'done' | 'skipped';
  /** ISO date-only for action due date. */
  dueDate?: string;
}

// ----------------------------------------------------------------------

/**
 * Serialisable row returned by server actions.
 * Dates are ISO strings (no Date instances — safe for client component props).
 */
export type AboutMeRow = {
  id: string;
  type: AboutMeType;
  title: string;
  content: string;
  tags: string[];
  /**
   * Raw metadata JSON. Use the typed helpers or Zod safeParse from schemas.ts
   * to narrow to the correct metadata shape before rendering.
   */
  metadata: Record<string, unknown> | null;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
};
