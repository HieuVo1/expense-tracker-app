'use client';

import type { EditorProps } from 'src/components/editor';

import { Controller, useFormContext } from 'react-hook-form';

import { Editor } from 'src/components/editor';

// ----------------------------------------------------------------------

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
        <Editor
          {...other}
          value={field.value || ''}
          onChange={field.onChange}
          error={!!error}
          helperText={error?.message ?? helperText}
        />
      )}
    />
  );
}
