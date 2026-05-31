'use client';

import Box from '@mui/material/Box';

import { markdownToHtml } from '../utils/markdown-to-html';

// Read-only markdown view used by the lesson section accordion. No TipTap
// here — view mode renders as static styled HTML for readability + speed.
// Editing still mounts the full TipTap Editor (lazy-loaded in the edit
// dialog).

// Strip frontmatter for legacy callers that may pass full file content.
const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

export function LessonMarkdownRender({ value }: { value: string }) {
  const body = value.replace(FRONTMATTER_RE, '').trimStart();
  const html = markdownToHtml(body);

  return (
    <Box
      sx={{
        color: 'text.primary',
        fontSize: 16,
        lineHeight: 1.7,
        wordBreak: 'break-word',
        '& > :first-of-type': { mt: 0 },
        '& > :last-child': { mb: 0 },
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          fontWeight: 700,
          mt: 2.5,
          mb: 1,
        },
        '& h1': { fontSize: '1.6rem' },
        '& h2': { fontSize: '1.35rem' },
        '& h3': { fontSize: '1.15rem' },
        '& h4, & h5, & h6': { fontSize: '1.05rem' },
        '& p': { my: 1 },
        '& ul, & ol': { pl: 3, my: 1 },
        '& li': { mb: 0.5 },
        '& blockquote': {
          borderLeft: '3px solid',
          borderColor: 'divider',
          pl: 2,
          ml: 0,
          my: 1.5,
          color: 'text.secondary',
        },
        '& code': {
          fontFamily: 'monospace',
          fontSize: '0.9em',
          bgcolor: 'action.hover',
          px: 0.75,
          py: 0.25,
          borderRadius: 0.5,
        },
        '& a': { color: 'primary.main', textDecoration: 'underline' },
        '& strong': { fontWeight: 700 },
        '& em': { fontStyle: 'italic' },
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
