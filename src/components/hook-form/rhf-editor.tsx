'use client';

import type { EditorProps } from 'src/components/editor';

import { memo, useRef, useCallback } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Editor } from 'src/components/editor';

// ----------------------------------------------------------------------

const MemoEditor = memo(Editor);

export type RHFEditorProps = Omit<EditorProps, 'value' | 'onChange' | 'error' | 'helperText'> & {
  name: string;
  helperText?: React.ReactNode;
};

export function RHFEditor({ name, helperText, ...other }: RHFEditorProps) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <StableEditor
          {...other}
          fieldValue={field.value || ''}
          onChange={field.onChange}
          error={!!error}
          helperText={error?.message ?? helperText}
        />
      )}
    />
  );
}

// ----------------------------------------------------------------------

type StableEditorProps = Omit<EditorProps, 'value' | 'onChange'> & {
  fieldValue: string;
  onChange: (value: string) => void;
};

// Holds stable refs for `value` and `onChange` so the memoized Editor
// doesn't re-render the heavy TipTap tree on every keystroke. RHF
// Controller hands a new `field.onChange` closure each render and a new
// `value` string each keystroke — both would defeat React.memo.
//
// External resets (form.reset on dialog open, or a sibling field bumping
// content) are still propagated by detecting that the incoming value
// matches NEITHER the last echo from the editor nor the last seed.
function StableEditor({ fieldValue, onChange, ...other }: StableEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const lastEmittedRef = useRef(fieldValue); // last value the editor sent up
  const stableValueRef = useRef(fieldValue); // last value we sent into the editor

  if (fieldValue !== lastEmittedRef.current && fieldValue !== stableValueRef.current) {
    stableValueRef.current = fieldValue;
    lastEmittedRef.current = fieldValue;
  }

  const handleChange = useCallback((md: string) => {
    lastEmittedRef.current = md;
    onChangeRef.current?.(md);
  }, []);

  return <MemoEditor {...other} value={stableValueRef.current} onChange={handleChange} />;
}
