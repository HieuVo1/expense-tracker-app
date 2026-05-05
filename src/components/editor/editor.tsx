import type { EditorProps } from './types';

import { Markdown } from 'tiptap-markdown';
import { mergeClasses } from 'minimal-shared/utils';
import StarterKitExtension from '@tiptap/starter-kit';
import { useEditor, EditorContent } from '@tiptap/react';
import TextAlignExtension from '@tiptap/extension-text-align';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Placeholder as PlaceholderExtension } from '@tiptap/extensions';

import Box from '@mui/material/Box';
import Portal from '@mui/material/Portal';
import Backdrop from '@mui/material/Backdrop';
import FormHelperText from '@mui/material/FormHelperText';

import { EditorRoot } from './styles';
import { editorClasses } from './classes';
import { Toolbar } from './components/toolbar';
import { BubbleToolbar } from './components/bubble-toolbar';
import { ClearFormat as ClearFormatExtension } from './extension/clear-format';
import { TextTransform as TextTransformExtension } from './extension/text-transform';

// ----------------------------------------------------------------------

export function Editor({
  sx,
  error,
  onChange,
  slotProps,
  helperText,
  resetValue,
  className,
  editable = true,
  fullItem = false,
  immediatelyRender = false,
  ref: contentRef,
  value: initialContent = '',
  placeholder = 'Write something awesome...',
  ...other
}: EditorProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [rerenderKey, setRerenderKey] = useState(0);

  // Stable ref to onChange so useEditor isn't re-created when parent re-renders.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track the last markdown we emitted so we can skip echo updates from parent.
  const lastEmittedRef = useRef<string>(initialContent);

  const editor = useEditor({
    editable,
    immediatelyRender,
    content: initialContent,
    shouldRerenderOnTransaction: !!rerenderKey,
    onUpdate: (ctx) => {
      // Skip emit during IME composition (Vietnamese Telex/VNI, CJK, etc.) —
      // a React state update mid-compose can interrupt the browser's IME
      // and cause perceived typing lag. ProseMirror dispatches a final
      // transaction on compositionend, so the committed value still flows up.
      if (ctx.editor.view.composing) return;

      // tiptap-markdown stores getMarkdown() in editor.storage.markdown
      const md = (ctx.editor.storage as any).markdown.getMarkdown() as string;
      lastEmittedRef.current = md;
      onChangeRef.current?.(md);
    },
    extensions: [
      StarterKitExtension.configure({
        code: { HTMLAttributes: { class: editorClasses.content.codeInline } },
        heading: { HTMLAttributes: { class: editorClasses.content.heading } },
        horizontalRule: { HTMLAttributes: { class: editorClasses.content.hr } },
        listItem: { HTMLAttributes: { class: editorClasses.content.listItem } },
        blockquote: { HTMLAttributes: { class: editorClasses.content.blockquote } },
        bulletList: { HTMLAttributes: { class: editorClasses.content.bulletList } },
        orderedList: { HTMLAttributes: { class: editorClasses.content.orderedList } },
        link: {
          openOnClick: false,
          HTMLAttributes: { class: editorClasses.content.link },
        },
      }),
      TextAlignExtension.configure({ types: ['heading', 'paragraph'] }),
      PlaceholderExtension.configure({
        placeholder,
        emptyEditorClass: editorClasses.content.placeholder,
      }),
      Markdown.configure({ html: false, transformPastedText: true, transformCopiedText: true }),
      // Custom extensions
      TextTransformExtension,
      ClearFormatExtension,
    ],
    ...other,
  });

  const handleToggleFullscreen = useCallback(() => {
    editor?.unmount();
    setFullscreen((prev) => !prev);
    setRerenderKey((prev) => prev + 1);
  }, [editor]);

  const handleExitFullscreen = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        editor?.unmount();
        setFullscreen(false);
        setRerenderKey((prev) => prev + 1);
      }
    },
    [editor]
  );

  // Sync external value into the editor only when it differs from what we last emitted.
  // Skipping echo updates eliminates a re-set/keystroke feedback loop that caused typing lag.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (initialContent === lastEmittedRef.current) return;
    editor.commands.setContent(initialContent ?? '');
    lastEmittedRef.current = initialContent ?? '';
  }, [initialContent, editor]);

  useEffect(() => {
    if (resetValue && !initialContent) {
      editor?.commands.clearContent();
      lastEmittedRef.current = '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetValue]);

  useEffect(() => {
    if (!fullscreen) return undefined;

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleExitFullscreen);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleExitFullscreen);
    };
  }, [fullscreen, handleExitFullscreen]);

  return (
    <Portal disablePortal={!fullscreen}>
      {fullscreen && <Backdrop open sx={[(theme) => ({ zIndex: theme.zIndex.modal - 1 })]} />}

      <Box
        {...slotProps?.wrapper}
        sx={[
          { display: 'flex', flexDirection: 'column' },
          ...(Array.isArray(slotProps?.wrapper?.sx)
            ? slotProps.wrapper.sx
            : [slotProps?.wrapper?.sx]),
        ]}
      >
        <EditorRoot
          className={mergeClasses([editorClasses.root, className], {
            [editorClasses.state.error]: !!error,
            [editorClasses.state.disabled]: !editable,
            [editorClasses.state.fullscreen]: fullscreen,
          })}
          sx={sx}
        >
          {editor && !editor.isDestroyed && (
            <>
              <Toolbar
                editor={editor}
                fullItem={fullItem}
                fullscreen={fullscreen}
                onToggleFullscreen={handleToggleFullscreen}
              />
              <BubbleToolbar editor={editor} />
              <EditorContent
                ref={contentRef}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                editor={editor}
                className={editorClasses.content.root}
              />
            </>
          )}
        </EditorRoot>

        {helperText && <FormHelperText error={!!error}>{helperText}</FormHelperText>}
      </Box>
    </Portal>
  );
}
