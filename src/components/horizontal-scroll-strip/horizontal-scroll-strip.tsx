'use client';

import type { ReactNode } from 'react';
import type { BoxProps } from '@mui/material/Box';
import type { Breakpoint } from '@mui/material/styles';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  children: ReactNode;
  /** Show prev/next arrow buttons at and above this breakpoint. Default 'md'. */
  showButtonsAt?: Breakpoint;
  /** Sx applied to the inner scroll container — override flex/gap/item widths here. */
  scrollSx?: BoxProps['sx'];
  /** Fraction of viewport width to scroll per button click. Default 0.8. */
  scrollFraction?: number;
};

/**
 * Horizontal scroll container with optional desktop arrow buttons.
 * Caller controls item layout via `scrollSx` (e.g. flex-direction column on xs
 * to stack vertically). Buttons appear only when overflow exists in that direction.
 */
export function HorizontalScrollStrip({
  children,
  showButtonsAt = 'md',
  scrollSx,
  scrollFraction = 0.8,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const recompute = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // 4px slack to avoid flicker at the edges.
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    recompute();
    const el = ref.current;
    if (!el) return undefined;
    el.addEventListener('scroll', recompute, { passive: true });
    window.addEventListener('resize', recompute);
    return () => {
      el.removeEventListener('scroll', recompute);
      window.removeEventListener('resize', recompute);
    };
  }, [recompute]);

  const scrollBy = (delta: number) => {
    ref.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        ref={ref}
        onWheel={(e) => {
          // Convert vertical wheel to horizontal scroll so mouse users without
          // a trackpad can still pan the strip.
          const el = e.currentTarget;
          if (el.scrollWidth <= el.clientWidth) return;
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            el.scrollLeft += e.deltaY;
          }
        }}
        sx={{
          display: 'flex',
          overflowX: 'auto',
          // Only lock to horizontal panning when the strip actually overflows
          // horizontally. Otherwise (e.g. caller stacks items in a column on
          // mobile) leave it 'auto' so vertical page scroll isn't blocked.
          touchAction: canLeft || canRight ? 'pan-x' : 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          ...scrollSx,
        }}
      >
        {children}
      </Box>

      <ArrowBtn
        direction="left"
        visible={canLeft}
        showAt={showButtonsAt}
        onClick={() => scrollBy(-Math.round((ref.current?.clientWidth ?? 320) * scrollFraction))}
      />
      <ArrowBtn
        direction="right"
        visible={canRight}
        showAt={showButtonsAt}
        onClick={() => scrollBy(Math.round((ref.current?.clientWidth ?? 320) * scrollFraction))}
      />
    </Box>
  );
}

// ----------------------------------------------------------------------

type ArrowProps = {
  direction: 'left' | 'right';
  visible: boolean;
  showAt: Breakpoint;
  onClick: () => void;
};

function ArrowBtn({ direction, visible, showAt, onClick }: ArrowProps) {
  return (
    <IconButton
      onClick={onClick}
      aria-label={direction === 'left' ? 'Cuộn trái' : 'Cuộn phải'}
      tabIndex={visible ? 0 : -1}
      sx={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        [direction]: -8,
        zIndex: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: (theme) => theme.customShadows?.z8 ?? 2,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 160ms ease',
        // Hide on small screens — touch scroll is natural; arrows are for desktop mouse.
        display: { xs: 'none', [showAt]: 'inline-flex' },
        '&:hover': { bgcolor: 'background.paper' },
      }}
    >
      <Iconify
        icon={direction === 'left' ? 'eva:arrow-ios-back-fill' : 'eva:arrow-ios-forward-fill'}
        width={20}
      />
    </IconButton>
  );
}
