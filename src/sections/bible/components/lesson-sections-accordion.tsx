'use client';

import type { LessonSectionKey } from '../types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Accordion from '@mui/material/Accordion';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { Iconify } from 'src/components/iconify';

import { LessonMarkdownRender } from './lesson-markdown-render';
import { LessonSectionEditDialog } from './lesson-section-edit-dialog';

// Four prose sections from the bible-lesson-v1 template, rendered as
// collapsible accordions. versesRaw is excluded — verses already render above
// as their own cards.

type SectionDef = { key: LessonSectionKey; title: string };

const SECTIONS: SectionDef[] = [
  { key: 'notes', title: 'Ghi chú bài học' },
  { key: 'lessons', title: 'Bài học rút ra' },
  { key: 'exercises', title: 'Bài tập' },
  { key: 'questions', title: 'Câu hỏi muốn hỏi giáo viên' },
];

type Props = {
  lessonId: string;
  sections: Record<LessonSectionKey, string>;
};

export function LessonSectionsAccordion({ lessonId, sections }: Props) {
  const [editing, setEditing] = useState<SectionDef | null>(null);

  return (
    <Stack spacing={1}>
      {SECTIONS.map((def) => {
        const content = sections[def.key] ?? '';
        const isEmpty = !content.trim() || content.trim() === '_(Chưa có)_';
        return (
          <Accordion
            key={def.key}
            disableGutters
            slotProps={{ transition: { unmountOnExit: true } }}
            sx={{ '&:before': { display: 'none' } }}
          >
            <AccordionSummary
              expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={20} />}
              sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1 } }}
            >
              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                {def.title}
                {isEmpty && (
                  <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                    (trống)
                  </Typography>
                )}
              </Typography>
              <Tooltip title="Sửa nội dung">
                {/* component="span" avoids nested-button hydration error:
                    AccordionSummary renders as a <button> already. */}
                <IconButton
                  component="span"
                  role="button"
                  tabIndex={0}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(def);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      e.preventDefault();
                      setEditing(def);
                    }
                  }}
                >
                  <Iconify icon="solar:pen-bold" width={16} />
                </IconButton>
              </Tooltip>
            </AccordionSummary>
            <AccordionDetails>
              {isEmpty ? (
                <Box sx={{ color: 'text.disabled', fontStyle: 'italic' }}>Chưa có nội dung.</Box>
              ) : (
                <LessonMarkdownRender value={content} />
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}

      {editing && (
        <LessonSectionEditDialog
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
          lessonId={lessonId}
          section={editing.key}
          sectionTitle={editing.title}
          initialContent={sections[editing.key] ?? ''}
        />
      )}
    </Stack>
  );
}
