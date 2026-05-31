'use client';

import type { AboutMeRow, AboutMeType } from '../types';
import type { SignalPatternsResult } from '../actions/about-me-signal-patterns';

import { useState, useEffect } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Badge from '@mui/material/Badge';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

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
import {
  GOAL_ICON_GRADIENT,
  ABOUT_ME_TYPE_ICONS,
  ABOUT_ME_TYPE_COLORS,
  ABOUT_ME_TYPE_LABELS,
  ABOUT_ME_TYPE_VALUES,
  ABOUT_ME_TYPE_SUBTITLES,
} from '../constants/about-me-types';

// ----------------------------------------------------------------------

const LS_KEY = 'about-me-hub.active-tab';

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

type DialogState = { type: AboutMeType; row?: AboutMeRow } | null;

// ----------------------------------------------------------------------
// Tab count badge per type — uses active goal count for GOAL, length for others,
// signal pattern count for SIGNAL.

function countForType(type: AboutMeType, data: CardData, patterns: SignalPatternsResult): number {
  switch (type) {
    case 'GOAL':
      return data.GOAL.activeGoalCount;
    case 'SIGNAL':
      return patterns.negative.length + patterns.positive.length;
    default:
      return data[type].rows.length;
  }
}

// ----------------------------------------------------------------------

export function AboutMeHubClient({ patterns, cardData }: Props) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AboutMeType>('GOAL');

  // Restore last selected tab from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored && ABOUT_ME_TYPE_VALUES.includes(stored as AboutMeType)) {
        setActiveTab(stored as AboutMeType);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, v: AboutMeType) => {
    setActiveTab(v);
    try {
      localStorage.setItem(LS_KEY, v);
    } catch {
      /* ignore */
    }
  };

  const openCreate = (type: AboutMeType) => {
    setDialog({ type });
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  return (
    <>
      <Box sx={{ mt: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          {ABOUT_ME_TYPE_VALUES.map((type) => {
            const count = countForType(type, cardData, patterns);
            return (
              <Tab
                key={type}
                value={type}
                icon={<Iconify icon={ABOUT_ME_TYPE_ICONS[type]} width={20} />}
                iconPosition="start"
                label={
                  count > 0 ? (
                    <Badge
                      badgeContent={count}
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          right: -16,
                          top: 4,
                          fontSize: '0.65rem',
                          height: 16,
                          minWidth: 16,
                        },
                      }}
                    >
                      {ABOUT_ME_TYPE_LABELS[type]}
                    </Badge>
                  ) : (
                    ABOUT_ME_TYPE_LABELS[type]
                  )
                }
                sx={{ minHeight: 48, textTransform: 'none', pr: count > 0 ? 3 : 2 }}
              />
            );
          })}
        </Tabs>

        {/* Active tab panel — single card body */}
        {activeTab === 'GOAL' && (
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
        )}

        {activeTab === 'THOUGHT' && (
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
        )}

        {activeTab === 'LESSON' && (
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
        )}

        {activeTab === 'SIGNAL' && (
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
        )}

        {activeTab === 'PRINCIPLE' && (
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
        )}

        {activeTab === 'TRAIT' && (
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
        )}

        {activeTab === 'ACTION' && (
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
        )}
      </Box>

      <AboutMeQuickCaptureFab onSelect={openCreate} />

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
