'use server';

import type { NoteType } from '@prisma/client';
import type { CompanionCorpusEntry } from 'src/lib/ai/types';

import dayjs from 'dayjs';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';
import { requestCompanionSuggestion } from 'src/lib/ai/companion';

import { ABOUT_ME_TYPE_VALUES, ABOUT_ME_TYPE_LABELS } from '../constants/about-me-types';

// ----------------------------------------------------------------------

// Self-knowledge corpus = all About-me types + daily journal notes.
const CORPUS_TYPES: NoteType[] = [...ABOUT_ME_TYPE_VALUES, 'daily'];

// Bound prompt tokens at personal scale: most-recent N entries, each capped.
const MAX_ENTRIES = 400;
const MAX_CONTENT_CHARS = 600;

// Gratitude lives in its own table; pull recent days into the corpus too.
// Prefix its ids so model-returned ids route back to the right lookup + page.
const MAX_GRATITUDE = 60;
const GRATITUDE_ID_PREFIX = 'gratitude:';
const GRATITUDE_LABEL = 'Lòng biết ơn';

const PROBLEM_MIN = 5;
const PROBLEM_MAX = 2000;

const TYPE_LABELS: Record<NoteType, string> = {
  ...ABOUT_ME_TYPE_LABELS,
  daily: 'Nhật ký',
};

// ----------------------------------------------------------------------

export type CompanionRelatedEntry = {
  id: string;
  type: NoteType | 'gratitude';
  typeLabel: string;
  title: string;
  content: string;
  /** Where the user can go to read this entry in full. */
  href: string;
};

export type CompanionResponse = {
  /** false when the user has no self-knowledge entries yet (no AI call made). */
  hasCorpus: boolean;
  acknowledgment: string;
  insight: string;
  suggestion: string;
  relatedEntries: CompanionRelatedEntry[];
};

// ----------------------------------------------------------------------

function clamp(text: string): string {
  const t = text.trim();
  return t.length > MAX_CONTENT_CHARS ? `${t.slice(0, MAX_CONTENT_CHARS)}…` : t;
}

// Compact, human-readable hint from a row's structured metadata so the model
// gets the gist without the full JSON blob.
function metaHint(type: NoteType, metadata: unknown): string | undefined {
  if (metadata === null || typeof metadata !== 'object') return undefined;
  const m = metadata as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

  switch (type) {
    case 'SIGNAL': {
      const parts = [
        str(m.trigger) && `bối cảnh: ${m.trigger}`,
        str(m.emotion) && `cảm xúc: ${m.emotion}`,
      ];
      return parts.filter(Boolean).join(' · ') || undefined;
    }
    case 'LESSON':
      return str(m.takeaway) ? `cốt lõi: ${m.takeaway}` : str(m.source) && `nguồn: ${m.source}`;
    case 'TRAIT':
      return str(m.kind) && `loại: ${m.kind}`;
    case 'GOAL':
      return str(m.status) && `trạng thái: ${m.status}`;
    case 'ACTION':
      return str(m.status) && `trạng thái: ${m.status}`;
    default:
      return undefined;
  }
}

function hrefFor(type: NoteType): string {
  return type === 'daily' ? paths.dashboard.notes : paths.dashboard.aboutMeType(type);
}

// ----------------------------------------------------------------------

export async function getCompanionSuggestion(problem: string): Promise<CompanionResponse> {
  const user = await requireUser();

  const trimmed = (problem ?? '').trim();
  if (trimmed.length < PROBLEM_MIN) {
    throw new Error('Vui lòng mô tả vấn đề của bạn rõ hơn một chút.');
  }
  const safeProblem = trimmed.slice(0, PROBLEM_MAX);

  const [rows, gratitudeRows] = await Promise.all([
    prisma.note.findMany({
      where: { userId: user.id, type: { in: CORPUS_TYPES } },
      orderBy: { updatedAt: 'desc' },
      take: MAX_ENTRIES,
    }),
    prisma.gratitudeEntry.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: MAX_GRATITUDE,
    }),
  ]);

  if (rows.length === 0 && gratitudeRows.length === 0) {
    return {
      hasCorpus: false,
      acknowledgment: 'Mình hiểu cảm giác của bạn lúc này. Cảm xúc đó hoàn toàn có lý.',
      insight:
        'Bạn chưa có ghi chép nào về bản thân để mình soi lại. Khi bạn ghi lại các bài học, suy nghĩ hay tín hiệu cảm xúc ở mục "Về tôi", mình sẽ có thể nhắc bạn những điều bạn từng vượt qua.',
      suggestion:
        'Thử ghi lại trải nghiệm này thành một "Bài học" — đó sẽ là điểm tựa cho chính bạn lần sau.',
      relatedEntries: [],
    };
  }

  const noteCorpus: CompanionCorpusEntry[] = rows.map((r) => ({
    id: r.id,
    typeLabel: TYPE_LABELS[r.type] ?? r.type,
    title: r.title,
    content: clamp(r.content),
    meta: metaHint(r.type, r.metadata),
  }));

  const gratitudeCorpus: CompanionCorpusEntry[] = gratitudeRows.map((g) => ({
    id: `${GRATITUDE_ID_PREFIX}${g.id}`,
    typeLabel: GRATITUDE_LABEL,
    title: `Biết ơn ${dayjs(g.date).format('DD/MM/YYYY')}`,
    content: clamp(g.items.map((it) => `• ${it}`).join('\n')),
  }));

  const result = await requestCompanionSuggestion(safeProblem, [...noteCorpus, ...gratitudeCorpus]);

  const noteById = new Map(rows.map((r) => [r.id, r]));
  const gratitudeById = new Map(gratitudeRows.map((g) => [g.id, g]));

  const relatedEntries: CompanionRelatedEntry[] = result.relatedEntryIds
    .map((id): CompanionRelatedEntry | null => {
      if (id.startsWith(GRATITUDE_ID_PREFIX)) {
        const g = gratitudeById.get(id.slice(GRATITUDE_ID_PREFIX.length));
        if (!g) return null;
        return {
          id: g.id,
          type: 'gratitude',
          typeLabel: GRATITUDE_LABEL,
          title: `Biết ơn ${dayjs(g.date).format('DD/MM/YYYY')}`,
          content: clamp(g.items.join(' · ')),
          href: paths.dashboard.gratitude,
        };
      }
      const r = noteById.get(id);
      if (!r) return null;
      return {
        id: r.id,
        type: r.type,
        typeLabel: TYPE_LABELS[r.type] ?? r.type,
        title: r.title,
        content: clamp(r.content),
        href: hrefFor(r.type),
      };
    })
    .filter((e): e is CompanionRelatedEntry => e != null);

  return {
    hasCorpus: true,
    acknowledgment: result.acknowledgment,
    insight: result.insight,
    suggestion: result.suggestion,
    relatedEntries,
  };
}
