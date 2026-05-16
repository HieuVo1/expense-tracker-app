'use client';

import type { AboutMeRow, AboutMeType, GoalMetadata, TraitMetadata, ActionMetadata } from '../types';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

import { AboutMeRowGoal } from '../components/about-me-row-goal';
import { ABOUT_ME_EMPTY_STATES } from '../constants/about-me-copy';
import { ABOUT_ME_TYPE_LABELS } from '../constants/about-me-types';
import { AboutMeRowTrait } from '../components/about-me-row-trait';
import { AboutMeRowSignal } from '../components/about-me-row-signal';
import { AboutMeRowAction } from '../components/about-me-row-action';
import { AboutMeEditDialog } from '../components/about-me-edit-dialog';
import { AboutMeRowDefault } from '../components/about-me-row-default';
import { AboutMeDetailDialog } from '../components/about-me-detail-dialog';

// ----------------------------------------------------------------------

type GoalStatusFilter = 'all' | 'active' | 'achieved' | 'paused' | 'abandoned';

const GOAL_STATUS_FILTER_LABELS: Record<GoalStatusFilter, string> = {
  all: 'Tất cả',
  active: 'Đang theo đuổi',
  achieved: 'Đã đạt',
  paused: 'Tạm dừng',
  abandoned: 'Đã bỏ',
};

const GOAL_KIND_ORDER = ['short', 'long', 'dream'] as const;
const GOAL_KIND_LABELS_SHORT: Record<string, string> = {
  short: 'Ngắn hạn',
  long: 'Dài hạn',
  dream: 'Ước vọng',
};

const ACTION_STATUS_ORDER = ['doing', 'planned', 'done', 'skipped'] as const;
const ACTION_STATUS_SECTION_LABELS: Record<string, string> = {
  doing: 'Đang thực hiện',
  planned: 'Chưa bắt đầu',
  done: 'Hoàn thành',
  skipped: 'Bỏ qua',
};

// ----------------------------------------------------------------------

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1, mt: 2 }}>
      <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 10 }}>
        {label}
      </Typography>
      <Chip label={count} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 600, bgcolor: 'background.neutral' }} />
    </Stack>
  );
}

function EmptyFiltered() {
  return (
    <Typography variant="body2" color="text.disabled" sx={{ py: 4, textAlign: 'center' }}>
      Không có mục nào khớp
    </Typography>
  );
}

// ----------------------------------------------------------------------

type Props = {
  rows: AboutMeRow[];
  type: AboutMeType;
};

export function AboutMeListClient({ rows, type }: Props) {
  const [search, setSearch] = useState('');
  const [goalStatusFilter, setGoalStatusFilter] = useState<GoalStatusFilter>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<AboutMeRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // Aggregate distinct tags + occurrence count, ordered by frequency desc.
  const tagOptions = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((r) => r.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = q
      ? rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q) ||
          r.tags.some((t) => t.includes(q))
      )
      : rows;

    if (type === 'GOAL' && goalStatusFilter !== 'all') {
      result = result.filter(
        (r) => (r.metadata as Partial<GoalMetadata> | null)?.status === goalStatusFilter
      );
    }

    if (tagFilter) {
      result = result.filter((r) => r.tags.includes(tagFilter));
    }

    return result;
  }, [rows, search, type, goalStatusFilter, tagFilter]);

  const openDetail = (row: AboutMeRow) => {
    setSelectedRow(row);
    setDetailOpen(true);
  };

  // ---- GOAL grouped render ----
  if (type === 'GOAL') {
    const grouped = GOAL_KIND_ORDER.map((kind) => {
      const kindRows = filtered
        .filter((r) => (r.metadata as Partial<GoalMetadata> | null)?.kind === kind)
        .sort((a, b) => {
          const aActive = (a.metadata as Partial<GoalMetadata> | null)?.status === 'active' ? 0 : 1;
          const bActive = (b.metadata as Partial<GoalMetadata> | null)?.status === 'active' ? 0 : 1;
          if (aActive !== bActive) return aActive - bActive;
          const aDate = (a.metadata as Partial<GoalMetadata> | null)?.targetDate ?? 'z';
          const bDate = (b.metadata as Partial<GoalMetadata> | null)?.targetDate ?? 'z';
          return aDate.localeCompare(bDate);
        });
      return { kind, rows: kindRows };
    });

    return (
      <>
        <ListHeader
          type={type}
          search={search}
          onSearch={setSearch}
          onAdd={() => setAddOpen(true)}
          tagOptions={tagOptions}
          tagFilter={tagFilter}
          onTagFilter={setTagFilter}
          goalStatusFilter={goalStatusFilter}
          onGoalStatusFilter={setGoalStatusFilter}
        />

        {filtered.length === 0 ? (
          <EmptyFiltered />
        ) : (
          grouped.map(({ kind, rows: kindRows }) =>
            kindRows.length === 0 ? null : (
              <Box key={kind}>
                <SectionHeader label={GOAL_KIND_LABELS_SHORT[kind]} count={kindRows.length} />
                <Stack spacing={1}>
                  {kindRows.map((r) => (
                    <AboutMeRowGoal key={r.id} row={r} onClick={() => openDetail(r)} />
                  ))}
                </Stack>
              </Box>
            )
          )
        )}

        <Dialogs
          type={type}
          selectedRow={selectedRow}
          detailOpen={detailOpen}
          addOpen={addOpen}
          onDetailClose={() => setDetailOpen(false)}
          onAddClose={() => setAddOpen(false)}
        />
      </>
    );
  }

  // ---- ACTION grouped render ----
  if (type === 'ACTION') {
    const grouped = ACTION_STATUS_ORDER.map((status) => {
      const statusRows = filtered.filter(
        (r) => (r.metadata as Partial<ActionMetadata> | null)?.status === status
      );
      return { status, rows: statusRows };
    });

    return (
      <>
        <ListHeader
          type={type}
          search={search}
          onSearch={setSearch}
          onAdd={() => setAddOpen(true)}
          tagOptions={tagOptions}
          tagFilter={tagFilter}
          onTagFilter={setTagFilter}
        />

        {filtered.length === 0 ? (
          <EmptyFiltered />
        ) : (
          grouped.map(({ status, rows: statusRows }) =>
            statusRows.length === 0 ? null : (
              <Box key={status}>
                <SectionHeader label={ACTION_STATUS_SECTION_LABELS[status]} count={statusRows.length} />
                <Stack spacing={1}>
                  {statusRows.map((r) => (
                    <AboutMeRowAction key={r.id} row={r} onClick={() => openDetail(r)} />
                  ))}
                </Stack>
              </Box>
            )
          )
        )}

        <Dialogs
          type={type}
          selectedRow={selectedRow}
          detailOpen={detailOpen}
          addOpen={addOpen}
          onDetailClose={() => setDetailOpen(false)}
          onAddClose={() => setAddOpen(false)}
        />
      </>
    );
  }

  // ---- TRAIT grouped render ----
  if (type === 'TRAIT') {
    const strengths = filtered.filter(
      (r) => (r.metadata as Partial<TraitMetadata> | null)?.kind === 'strength'
    );
    const weaknesses = filtered.filter(
      (r) => (r.metadata as Partial<TraitMetadata> | null)?.kind === 'weakness'
    );

    return (
      <>
        <ListHeader
          type={type}
          search={search}
          onSearch={setSearch}
          onAdd={() => setAddOpen(true)}
          tagOptions={tagOptions}
          tagFilter={tagFilter}
          onTagFilter={setTagFilter}
        />

        {filtered.length === 0 ? (
          <EmptyFiltered />
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <SectionHeader label="Điểm mạnh" count={strengths.length} />
              <Stack spacing={1}>
                {strengths.map((r) => (
                  <AboutMeRowTrait key={r.id} row={r} onClick={() => openDetail(r)} />
                ))}
                {strengths.length === 0 && (
                  <Typography variant="body2" color="text.disabled" sx={{ py: 2 }}>
                    Chưa có điểm mạnh nào
                  </Typography>
                )}
              </Stack>
            </Box>
            <Box>
              <SectionHeader label="Điểm yếu" count={weaknesses.length} />
              <Stack spacing={1}>
                {weaknesses.map((r) => (
                  <AboutMeRowTrait key={r.id} row={r} onClick={() => openDetail(r)} />
                ))}
                {weaknesses.length === 0 && (
                  <Typography variant="body2" color="text.disabled" sx={{ py: 2 }}>
                    Chưa có điểm yếu nào
                  </Typography>
                )}
              </Stack>
            </Box>
          </Box>
        )}

        <Dialogs
          type={type}
          selectedRow={selectedRow}
          detailOpen={detailOpen}
          addOpen={addOpen}
          onDetailClose={() => setDetailOpen(false)}
          onAddClose={() => setAddOpen(false)}
        />
      </>
    );
  }

  // ---- SIGNAL flat render ----
  if (type === 'SIGNAL') {
    return (
      <>
        <ListHeader
          type={type}
          search={search}
          onSearch={setSearch}
          onAdd={() => setAddOpen(true)}
          tagOptions={tagOptions}
          tagFilter={tagFilter}
          onTagFilter={setTagFilter}
        />

        {filtered.length === 0 ? (
          <EmptyFiltered />
        ) : (
          <Stack spacing={1}>
            {filtered.map((r) => (
              <AboutMeRowSignal key={r.id} row={r} onClick={() => openDetail(r)} />
            ))}
          </Stack>
        )}

        <Dialogs
          type={type}
          selectedRow={selectedRow}
          detailOpen={detailOpen}
          addOpen={addOpen}
          onDetailClose={() => setDetailOpen(false)}
          onAddClose={() => setAddOpen(false)}
        />
      </>
    );
  }

  // ---- Default flat render (THOUGHT, LESSON, PRINCIPLE) ----
  return (
    <>
      <ListHeader
        type={type}
        search={search}
        onSearch={setSearch}
        onAdd={() => setAddOpen(true)}
        tagOptions={tagOptions}
        tagFilter={tagFilter}
        onTagFilter={setTagFilter}
      />

      {filtered.length === 0 ? (
        rows.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
              {ABOUT_ME_EMPTY_STATES[type]}
            </Typography>
            <Button variant="outlined" size="small" onClick={() => setAddOpen(true)}>
              Tạo entry đầu tiên
            </Button>
          </Box>
        ) : (
          <EmptyFiltered />
        )
      ) : (
        <Stack spacing={1}>
          {filtered.map((r) => (
            <AboutMeRowDefault key={r.id} row={r} onClick={() => openDetail(r)} />
          ))}
        </Stack>
      )}

      <Dialogs
        type={type}
        selectedRow={selectedRow}
        detailOpen={detailOpen}
        addOpen={addOpen}
        onDetailClose={() => setDetailOpen(false)}
        onAddClose={() => setAddOpen(false)}
      />
    </>
  );
}

// ----------------------------------------------------------------------
// Sub-components

type ListHeaderProps = {
  type: AboutMeType;
  search: string;
  onSearch: (v: string) => void;
  onAdd: () => void;
  tagOptions: { tag: string; count: number }[];
  tagFilter: string | null;
  onTagFilter: (tag: string | null) => void;
  goalStatusFilter?: GoalStatusFilter;
  onGoalStatusFilter?: (v: GoalStatusFilter) => void;
};

function ListHeader({
  type,
  search,
  onSearch,
  onAdd,
  tagOptions,
  tagFilter,
  onTagFilter,
  goalStatusFilter,
  onGoalStatusFilter,
}: ListHeaderProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 1.5 }}>
        <TextField
          size="small"
          placeholder={`Tìm trong ${ABOUT_ME_TYPE_LABELS[type]}...`}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 180 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" width={16} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          inputProps={{ 'aria-label': `Tìm kiếm ${ABOUT_ME_TYPE_LABELS[type]}` }}
        />
        <Button
          variant="contained"
          size="small"
          startIcon={<Iconify icon="mingcute:add-line" width={16} />}
          onClick={onAdd}
          aria-label={`Thêm ${ABOUT_ME_TYPE_LABELS[type]} mới`}
        >
          Thêm
        </Button>
      </Stack>

      {/* GOAL-only status filter chips */}
      {type === 'GOAL' && goalStatusFilter !== undefined && onGoalStatusFilter && (
        <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mb: 1 }}>
          {(Object.keys(GOAL_STATUS_FILTER_LABELS) as GoalStatusFilter[]).map((s) => (
            <Chip
              key={s}
              label={GOAL_STATUS_FILTER_LABELS[s]}
              size="small"
              variant={goalStatusFilter === s ? 'filled' : 'outlined'}
              color={goalStatusFilter === s ? 'primary' : 'default'}
              onClick={() => onGoalStatusFilter(s)}
              sx={{ fontSize: 12, cursor: 'pointer' }}
            />
          ))}
        </Stack>
      )}

      {/* Tag filter — single-select chip row, only shown when tags exist */}
      {tagOptions.length > 0 && (
        <Stack
          direction="row"
          gap={0.75}
          flexWrap="wrap"
          alignItems="center"
          sx={{ pt: 0.5 }}
        >
          <Iconify icon="solar:tag-horizontal-bold-duotone" width={14} sx={{ color: 'text.disabled' }} />
          {tagOptions.map(({ tag, count }) => {
            const active = tagFilter === tag;
            return (
              <Chip
                key={tag}
                label={`#${tag} · ${count}`}
                size="small"
                variant={active ? 'filled' : 'outlined'}
                color={active ? 'primary' : 'default'}
                onClick={() => onTagFilter(active ? null : tag)}
                sx={{ fontSize: 11, cursor: 'pointer', height: 22 }}
              />
            );
          })}
          {tagFilter && (
            <Chip
              label="Xoá lọc"
              size="small"
              onClick={() => onTagFilter(null)}
              variant="outlined"
              sx={{ fontSize: 11, cursor: 'pointer', height: 22, color: 'text.secondary' }}
            />
          )}
        </Stack>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

type DialogsProps = {
  type: AboutMeType;
  selectedRow: AboutMeRow | null;
  detailOpen: boolean;
  addOpen: boolean;
  onDetailClose: () => void;
  onAddClose: () => void;
};

function Dialogs({ type, selectedRow, detailOpen, addOpen, onDetailClose, onAddClose }: DialogsProps) {
  return (
    <>
      <AboutMeDetailDialog open={detailOpen} row={selectedRow} onClose={onDetailClose} />
      <AboutMeEditDialog open={addOpen} type={type} onClose={onAddClose} />
    </>
  );
}
