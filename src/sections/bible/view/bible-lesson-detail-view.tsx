import { notFound } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { VerseCard } from '../components/verse-card';
import { listThemes } from '../actions/bible-theme-actions';
import { getLesson } from '../actions/bible-lesson-actions';
import { LessonDetailHeader } from '../components/lesson-detail-header';
import { LessonSectionsAccordion } from '../components/lesson-sections-accordion';

type Props = { lessonId: string };

export async function BibleLessonDetailView({ lessonId }: Props) {
  const [lesson, themes] = await Promise.all([getLesson(lessonId), listThemes()]);
  if (!lesson) notFound();

  const themeOptions = themes.map((t) => ({ id: t.id, name: t.name, color: t.color }));

  return (
    <DashboardContent>
      <Stack spacing={3}>
        <LessonDetailHeader
          lesson={{
            id: lesson.id,
            title: lesson.title,
            date: lesson.date,
            verseCount: lesson.verses.length,
            bibleVersion: lesson.bibleVersion,
          }}
        />

        <Box>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Câu kinh trong bài
          </Typography>
          {lesson.verses.length === 0 ? (
            <Card sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Bài học này không có câu kinh nào được trích xuất.
              </Typography>
            </Card>
          ) : (
            <Stack spacing={1.5}>
              {lesson.verses.map((v) => (
                <VerseCard key={v.verseId} verse={v} allThemes={themeOptions} />
              ))}
            </Stack>
          )}
        </Box>

        <Divider />

        <Box>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Nội dung bài học
          </Typography>
          <LessonSectionsAccordion lessonId={lesson.id} sections={lesson.sections} />
        </Box>
      </Stack>
    </DashboardContent>
  );
}
