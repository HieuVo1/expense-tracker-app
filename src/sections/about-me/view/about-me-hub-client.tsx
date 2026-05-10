'use client';

import type { AboutMeRow, AboutMeType } from '../types';
import type { SignalPatternsResult } from '../actions/about-me-signal-patterns';

import { useState } from 'react';

import Grid from '@mui/material/Grid';

import { paths } from 'src/routes/paths';

import { ABOUT_ME_EMPTY_STATES } from '../constants/about-me-copy';
import { AboutMeCardShell } from '../components/about-me-card-shell';
import { AboutMeCardGoalBody } from '../components/about-me-card-goal';
import { AboutMeEditDialog } from '../components/about-me-edit-dialog';
import { AboutMeCardTraitBody } from '../components/about-me-card-trait';
import { AboutMeCardLessonBody } from '../components/about-me-card-lesson';
import { AboutMeCardSignalBody } from '../components/about-me-card-signal';
import { AboutMeCardActionBody } from '../components/about-me-card-action';
import { AboutMeCardThoughtBody } from '../components/about-me-card-thought';
import { AboutMeCardPrincipleBody } from '../components/about-me-card-principle';
import { AboutMeQuickCaptureFab } from '../components/about-me-quick-capture-fab';
import { GOAL_ICON_GRADIENT, ABOUT_ME_TYPE_ICONS, ABOUT_ME_TYPE_COLORS, ABOUT_ME_TYPE_LABELS, ABOUT_ME_TYPE_SUBTITLES } from '../constants/about-me-types';

// ----------------------------------------------------------------------

type CardData = {
  GOAL: { rows: AboutMeRow[]; activeGoalCount: number };
  THOUGHT: { rows: AboutMeRow[] };
  LESSON: { rows: AboutMeRow[] };
  SIGNAL: { rows: AboutMeRow[] };
  PRINCIPLE: { rows: AboutMeRow[] };
  TRAIT: { rows: AboutMeRow[] };
  ACTION: { rows: AboutMeRow[] };
};

type Props = {
  patterns: SignalPatternsResult;
  cardData: CardData;
};

// Dialog state: undefined = closed, null = create (need type picker), or AboutMeRow = edit
type DialogState = { type: AboutMeType; row?: AboutMeRow } | null;

export function AboutMeHubClient({ patterns, cardData }: Props) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openCreate = (type: AboutMeType) => {
    setDialog({ type });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Grid container spacing={2}>
        {/* GOAL — top-left, first */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <AboutMeCardShell
            icon={ABOUT_ME_TYPE_ICONS.GOAL}
            title={ABOUT_ME_TYPE_LABELS.GOAL}
            subtitle={ABOUT_ME_TYPE_SUBTITLES.GOAL}
            iconBg={GOAL_ICON_GRADIENT}
            count={cardData.GOAL.activeGoalCount}
            countLabel={`${cardData.GOAL.activeGoalCount} active`}
            footerHref={paths.dashboard.aboutMeType('goal')}
            onAdd={() => openCreate('GOAL')}
            isEmpty={cardData.GOAL.rows.length === 0}
            emptyText={ABOUT_ME_EMPTY_STATES.GOAL}
          >
            <AboutMeCardGoalBody rows={cardData.GOAL.rows} />
          </AboutMeCardShell>
        </Grid>

        {/* THOUGHT */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <AboutMeCardShell
            icon={ABOUT_ME_TYPE_ICONS.THOUGHT}
            title={ABOUT_ME_TYPE_LABELS.THOUGHT}
            subtitle={ABOUT_ME_TYPE_SUBTITLES.THOUGHT}
            iconBg={ABOUT_ME_TYPE_COLORS.THOUGHT}
            count={cardData.THOUGHT.rows.length > 0 ? cardData.THOUGHT.rows.length : undefined}
            footerHref={paths.dashboard.aboutMeType('thought')}
            onAdd={() => openCreate('THOUGHT')}
            isEmpty={cardData.THOUGHT.rows.length === 0}
            emptyText={ABOUT_ME_EMPTY_STATES.THOUGHT}
          >
            <AboutMeCardThoughtBody rows={cardData.THOUGHT.rows} />
          </AboutMeCardShell>
        </Grid>

        {/* LESSON */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <AboutMeCardShell
            icon={ABOUT_ME_TYPE_ICONS.LESSON}
            title={ABOUT_ME_TYPE_LABELS.LESSON}
            subtitle={ABOUT_ME_TYPE_SUBTITLES.LESSON}
            iconBg={ABOUT_ME_TYPE_COLORS.LESSON}
            count={cardData.LESSON.rows.length > 0 ? cardData.LESSON.rows.length : undefined}
            footerHref={paths.dashboard.aboutMeType('lesson')}
            onAdd={() => openCreate('LESSON')}
            isEmpty={cardData.LESSON.rows.length === 0}
            emptyText={ABOUT_ME_EMPTY_STATES.LESSON}
          >
            <AboutMeCardLessonBody rows={cardData.LESSON.rows} />
          </AboutMeCardShell>
        </Grid>

        {/* SIGNAL */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <AboutMeCardShell
            icon={ABOUT_ME_TYPE_ICONS.SIGNAL}
            title={ABOUT_ME_TYPE_LABELS.SIGNAL}
            subtitle={ABOUT_ME_TYPE_SUBTITLES.SIGNAL}
            iconBg={ABOUT_ME_TYPE_COLORS.SIGNAL}
            count={cardData.SIGNAL.rows.length > 0 ? cardData.SIGNAL.rows.length : undefined}
            footerHref={paths.dashboard.aboutMeType('signal')}
            onAdd={() => openCreate('SIGNAL')}
            isEmpty={patterns.negative.length === 0 && patterns.positive.length === 0}
            emptyText={ABOUT_ME_EMPTY_STATES.SIGNAL}
          >
            <AboutMeCardSignalBody patterns={patterns} />
          </AboutMeCardShell>
        </Grid>

        {/* PRINCIPLE */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <AboutMeCardShell
            icon={ABOUT_ME_TYPE_ICONS.PRINCIPLE}
            title={ABOUT_ME_TYPE_LABELS.PRINCIPLE}
            subtitle={ABOUT_ME_TYPE_SUBTITLES.PRINCIPLE}
            iconBg={ABOUT_ME_TYPE_COLORS.PRINCIPLE}
            count={cardData.PRINCIPLE.rows.length > 0 ? cardData.PRINCIPLE.rows.length : undefined}
            footerHref={paths.dashboard.aboutMeType('principle')}
            onAdd={() => openCreate('PRINCIPLE')}
            isEmpty={cardData.PRINCIPLE.rows.length === 0}
            emptyText={ABOUT_ME_EMPTY_STATES.PRINCIPLE}
          >
            <AboutMeCardPrincipleBody rows={cardData.PRINCIPLE.rows} />
          </AboutMeCardShell>
        </Grid>

        {/* TRAIT */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <AboutMeCardShell
            icon={ABOUT_ME_TYPE_ICONS.TRAIT}
            title={ABOUT_ME_TYPE_LABELS.TRAIT}
            subtitle={ABOUT_ME_TYPE_SUBTITLES.TRAIT}
            iconBg={ABOUT_ME_TYPE_COLORS.TRAIT}
            count={cardData.TRAIT.rows.length > 0 ? cardData.TRAIT.rows.length : undefined}
            footerHref={paths.dashboard.aboutMeType('trait')}
            onAdd={() => openCreate('TRAIT')}
            isEmpty={cardData.TRAIT.rows.length === 0}
            emptyText={ABOUT_ME_EMPTY_STATES.TRAIT}
          >
            <AboutMeCardTraitBody rows={cardData.TRAIT.rows} />
          </AboutMeCardShell>
        </Grid>

        {/* ACTION — row 3, col 1 only (remaining 2 cols intentionally empty) */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <AboutMeCardShell
            icon={ABOUT_ME_TYPE_ICONS.ACTION}
            title={ABOUT_ME_TYPE_LABELS.ACTION}
            subtitle={ABOUT_ME_TYPE_SUBTITLES.ACTION}
            iconBg={ABOUT_ME_TYPE_COLORS.ACTION}
            count={cardData.ACTION.rows.length > 0 ? cardData.ACTION.rows.length : undefined}
            footerHref={paths.dashboard.aboutMeType('action')}
            onAdd={() => openCreate('ACTION')}
            isEmpty={cardData.ACTION.rows.length === 0}
            emptyText={ABOUT_ME_EMPTY_STATES.ACTION}
          >
            <AboutMeCardActionBody rows={cardData.ACTION.rows} />
          </AboutMeCardShell>
        </Grid>
      </Grid>

      {/* FAB */}
      <AboutMeQuickCaptureFab onSelect={openCreate} />

      {/* Single edit dialog instance */}
      {dialog && (
        <AboutMeEditDialog
          open={dialogOpen}
          type={dialog.type}
          row={dialog.row}
          onClose={closeDialog}
        />
      )}
    </>
  );
}
