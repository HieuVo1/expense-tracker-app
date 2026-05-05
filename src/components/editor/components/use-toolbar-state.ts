import type { Editor } from '@tiptap/react';
import type { TextHeadingLevel } from './heading-block';
import type { TextTransformValue } from '../extension/text-transform';

import { useEditorState } from '@tiptap/react';

// ----------------------------------------------------------------------

export type TextAlignValue = 'left' | 'center' | 'right' | 'justify';

export type UseToolbarStateReturn = {
  isBold: boolean;
  isCode: boolean;
  isLink: boolean;
  isItalic: boolean;
  isStrike: boolean;
  isUnderline: boolean;
  isCodeBlock: boolean;
  isBulletList: boolean;
  isBlockquote: boolean;
  isOrderedList: boolean;
  // Single-value primitives so useEditorState's deepEqual stays stable across
  // transactions when the toolbar state hasn't actually changed. (Returning
  // closures like `isAlign(value)` would defeat equality on every keystroke
  // and re-render the toolbar — laggy with rapid input methods like Unikey.)
  textAlign: TextAlignValue | null;
  textTransform: TextTransformValue | null;
  headingLevel: TextHeadingLevel;
  canUndo: boolean;
  canRedo: boolean;
};

const ALIGN_VALUES: TextAlignValue[] = ['left', 'center', 'right', 'justify'];
const TRANSFORM_VALUES: TextTransformValue[] = ['uppercase', 'lowercase', 'capitalize'];
const HEADING_LEVELS: Exclude<TextHeadingLevel, null>[] = [1, 2, 3, 4, 5, 6];

export function useToolbarState(editor: Editor): UseToolbarStateReturn {
  const toolbarState = useEditorState({
    editor,
    selector: (ctx) => {
      const canRun = ctx.editor.can().chain().focus();

      const textAlign =
        ALIGN_VALUES.find((v) => ctx.editor.isActive({ textAlign: v })) ?? null;
      const textTransform =
        TRANSFORM_VALUES.find((v) =>
          ctx.editor.isActive('textTransform', { textTransform: v })
        ) ?? null;
      const headingLevel: TextHeadingLevel =
        HEADING_LEVELS.find((lvl) => ctx.editor.isActive('heading', { level: lvl })) ?? null;

      return {
        isBold: ctx.editor.isActive('bold'),
        isCode: ctx.editor.isActive('code'),
        isLink: ctx.editor.isActive('link'),
        isItalic: ctx.editor.isActive('italic'),
        isStrike: ctx.editor.isActive('strike'),
        isUnderline: ctx.editor.isActive('underline'),
        isCodeBlock: ctx.editor.isActive('codeBlock'),
        isBulletList: ctx.editor.isActive('bulletList'),
        isBlockquote: ctx.editor.isActive('blockquote'),
        isOrderedList: ctx.editor.isActive('orderedList'),
        textAlign,
        textTransform,
        headingLevel,
        canUndo: canRun.undo().run(),
        canRedo: canRun.redo().run(),
      };
    },
  });

  return toolbarState;
}
