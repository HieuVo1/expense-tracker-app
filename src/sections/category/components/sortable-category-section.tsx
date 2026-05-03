'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  DndContext,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { toast } from 'src/components/snackbar';

import { CategoryListItem } from './category-list-item';
import { reorderCategories } from '../actions/category-actions';

type Row = { id: string; name: string; icon: string; color: string; type: 'expense' | 'income' };

type Props = {
  title: string;
  rows: Row[];
};

export function SortableCategorySection({ title, rows }: Props) {
  const [items, setItems] = useState(rows);
  const [, startTransition] = useTransition();

  // Keep local state in sync when the server-side rows change (after revalidate
  // or when another client mutation lands).
  useEffect(() => {
    setItems(rows);
  }, [rows]);

  // PointerSensor with a small distance threshold prevents the drag from
  // hijacking simple clicks (edit / delete buttons inside the row). TouchSensor
  // adds a delay so scrolling on mobile still works.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    startTransition(async () => {
      try {
        await reorderCategories(next.map((c) => c.id));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Lưu thứ tự thất bại');
        setItems(items);
      }
    });
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Card>
        {items.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">
              Chưa có danh mục.
            </Typography>
          </Box>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((c) => (
                <CategoryListItem key={c.id} category={c} sortable />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </Card>
    </Box>
  );
}
