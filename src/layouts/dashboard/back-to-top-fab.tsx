'use client';

import { useState, useEffect } from 'react';

import Fab from '@mui/material/Fab';
import Zoom from '@mui/material/Zoom';

import { Iconify } from 'src/components/iconify';

const SHOW_AFTER_PX = 400;

// Small floating button that surfaces once the user has scrolled far enough
// to make a "back to top" gesture worthwhile. Positioned to sit ABOVE the
// AddTransactionFab on mobile (which lives at the same bottom-right corner)
// so the two don't overlap; desktop slots it into a normal corner since the
// AddFab is hidden there.
export function BackToTopFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Zoom in={visible} unmountOnExit>
      <Fab
        size="small"
        aria-label="Lên đầu trang"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        sx={{
          position: 'fixed',
          // Mobile: stack above bottom nav + page FAB.
          // Desktop: sit above any page-specific FAB at bottom: 24 — leaves
          // room for FABs like AboutMeQuickCaptureFab without overlap.
          bottom: {
            xs: 'calc(64px + env(safe-area-inset-bottom) + 96px)',
            lg: 96,
          },
          right: 24,
          zIndex: (theme) => theme.zIndex.appBar + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          border: '0.5px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Iconify icon="eva:arrow-upward-fill" width={18} />
      </Fab>
    </Zoom>
  );
}
