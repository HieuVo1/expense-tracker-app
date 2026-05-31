'use server';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';
import { type ThemeSuggestion, suggestThemesForVerse } from 'src/lib/ai/bible-theme-suggest';

import { suggestThemesSchema } from '../schemas';

// Server action wrapper around the Gemini theme suggester. Fetches the verse
// (to know its text + ref) and the lesson notes that introduced it (best
// lesson available) before calling the model.

export async function suggestThemesAction(input: {
  verseId: string;
}): Promise<ThemeSuggestion[]> {
  const user = await requireUser();
  const { verseId } = suggestThemesSchema.parse(input);

  const [verse, themes] = await Promise.all([
    prisma.bibleVerse.findFirst({
      where: { id: verseId, userId: user.id },
      include: {
        lessons: {
          orderBy: { lesson: { date: 'desc' } },
          take: 1,
          include: { lesson: { select: { rawMarkdown: true, parsedSections: true } } },
        },
      },
    }),
    prisma.bibleTheme.findMany({
      where: { userId: user.id },
      orderBy: { order: 'asc' },
      select: { name: true },
    }),
  ]);

  if (!verse) throw new Error('Câu kinh không tồn tại');
  if (verse.fetchStatus !== 'ok') {
    throw new Error('Câu kinh chưa có nội dung — tải lại trước khi gợi ý chủ đề');
  }

  const verseRef =
    verse.startVerse === verse.endVerse
      ? `${verse.bookName} ${verse.chapter}:${verse.startVerse}`
      : `${verse.bookName} ${verse.chapter}:${verse.startVerse}-${verse.endVerse}`;

  // Lesson context = notes + lessons-learned sections, kept short.
  const recentLesson = verse.lessons[0]?.lesson;
  const ps = recentLesson?.parsedSections as
    | { notes?: string; lessons?: string }
    | undefined
    | null;
  const lessonContext = [ps?.notes, ps?.lessons]
    .filter((s): s is string => Boolean(s))
    .join('\n\n');

  return suggestThemesForVerse({
    verseRef,
    verseText: verse.text,
    existingThemes: themes.map((t) => t.name),
    lessonContext,
  });
}
