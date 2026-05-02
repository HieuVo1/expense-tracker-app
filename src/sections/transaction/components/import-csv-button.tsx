'use client';

import { useRef, useState, useTransition } from 'react';

import Button from '@mui/material/Button';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { importTransactionsCsv } from 'src/sections/report/actions/report-actions';

const MAX_FILE_BYTES = 2 * 1024 * 1024;

// Reads a user-selected CSV file as text and hands it to the server action.
// Stays a separate client component so the transactions view stays a server
// component.
export function ImportCsvButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  // Tracks "reading file" separately from the server action transition so
  // the button shows a loader for both phases.
  const [isReading, setIsReading] = useState(false);

  const handlePick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so picking the same file again still triggers onChange.
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      toast.error('File quá lớn (giới hạn 2MB)');
      return;
    }

    setIsReading(true);
    let text: string;
    try {
      text = await file.text();
    } catch {
      setIsReading(false);
      toast.error('Không đọc được file');
      return;
    }
    setIsReading(false);

    startTransition(async () => {
      try {
        const result = await importTransactionsCsv(text);
        if (result.imported === 0 && result.errors.length > 0) {
          // Show the first error so the user has a concrete fix path.
          toast.error(`Nhập thất bại: ${result.errors[0].reason}`);
          return;
        }
        const skippedNote = result.skipped > 0 ? ` · Bỏ qua ${result.skipped} dòng lỗi` : '';
        toast.success(`Đã nhập ${result.imported} giao dịch${skippedNote}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Nhập thất bại');
      }
    });
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={handleChange}
      />
      <Button
        variant="outlined"
        onClick={handlePick}
        loading={isReading || isPending}
        startIcon={<Iconify icon="eva:cloud-upload-fill" />}
      >
        Nhập CSV
      </Button>
    </>
  );
}
