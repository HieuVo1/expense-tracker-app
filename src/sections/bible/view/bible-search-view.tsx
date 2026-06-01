import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { BibleSearchClient } from './bible-search-client';
import { searchBible } from '../actions/bible-search-actions';
import { BibleSearchBar } from '../components/bible-search-bar';

// ---------------------------------------------------------------------------
// BibleSearchView — async server component.
// Receives the raw `q` string (already awaited by the page route).
// Guards <2 chars to avoid hitting the action with an invalid query.
// ---------------------------------------------------------------------------

type Props = {
  q: string;
};

export async function BibleSearchView({ q }: Props) {
  const trimmed = q.trim();

  return (
    <DashboardContent>
      <Stack spacing={3}>
        {/* Page header */}
        <Stack spacing={0.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Link
              href={paths.dashboard.bible.root}
              underline="hover"
              variant="body2"
              color="text.secondary"
            >
              ← Học tập
            </Link>
          </Stack>
          <Typography variant="h4">
            {trimmed.length >= 2 ? (
              <>
                Kết quả cho &ldquo;<strong>{trimmed}</strong>&rdquo;
              </>
            ) : (
              'Tìm kiếm'
            )}
          </Typography>
        </Stack>

        {/* Short/empty query — show guidance without calling the action */}
        {trimmed.length < 2 ? (
          <Stack spacing={2} alignItems="flex-start">
            <BibleSearchBar />
            <Typography variant="body2" color="text.secondary">
              Nhập từ khoá ít nhất 2 ký tự để tìm bài học và câu kinh.
            </Typography>
          </Stack>
        ) : (
          <SearchResults q={trimmed} />
        )}
      </Stack>
    </DashboardContent>
  );
}

// Separate async sub-component so the short-query branch never awaits the action.
async function SearchResults({ q }: { q: string }) {
  const result = await searchBible({ q });
  return <BibleSearchClient result={result} />;
}
