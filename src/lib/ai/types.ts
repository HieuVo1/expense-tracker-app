// AI companion ("Tâm sự") shared types.
// The companion reads the user's own self-knowledge corpus (About-me entries
// + daily notes) and returns an empathetic, grounded response in Vietnamese.

// ----------------------------------------------------------------------

/** One self-knowledge entry packed into the Gemini prompt. */
export type CompanionCorpusEntry = {
  id: string;
  /** Vietnamese label for the entry type, e.g. "Bài học", "Nhật ký". */
  typeLabel: string;
  title: string;
  /** Plain text, already truncated to bound prompt tokens. */
  content: string;
  /** Compact structured-metadata hint, e.g. "cảm xúc: xấu hổ". */
  meta?: string;
};

/** Raw model output (ids only — never trust model-authored content for entries). */
export type CompanionResult = {
  /** Empathetic acknowledgement of the user's feeling. */
  acknowledgment: string;
  /** Connects the user's past entries to the present situation. */
  insight: string;
  /** A small, concrete next step grounded in the user's own principles. */
  suggestion: string;
  /** Subset of supplied corpus ids the model judged most relevant (≤3). */
  relatedEntryIds: string[];
};
