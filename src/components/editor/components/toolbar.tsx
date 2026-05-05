import type { StackProps } from '@mui/material/Stack';
import type { EditorToolbarProps } from '../types';

import { useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';

import { LinkBlock } from './link-block';
import { editorClasses } from '../classes';
import { ToolbarItem } from './toolbar-item';
import { HeadingBlock } from './heading-block';
import { toolbarIcons } from './toolbar-icons';
import { useToolbarState } from './use-toolbar-state';

// Three-dot horizontal "more" icon for the expand/collapse toggle.
const moreIcon = (
  <path d="M5 10C3.89543 10 3 10.8954 3 12C3 13.1046 3.89543 14 5 14C6.10457 14 7 13.1046 7 12C7 10.8954 6.10457 10 5 10ZM12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10ZM19 10C17.8954 10 17 10.8954 17 12C17 13.1046 17.8954 14 19 14C20.1046 14 21 13.1046 21 12C21 10.8954 20.1046 10 19 10Z" />
);

// ----------------------------------------------------------------------

export function Toolbar({
  sx,
  editor,
  fullItem,
  fullscreen,
  onToggleFullscreen,
  ...other
}: StackProps & EditorToolbarProps) {
  const toolbarState = useToolbarState(editor);
  const [expanded, setExpanded] = useState(false);

  const chainCommands = () => editor.chain().focus();

  return (
    <ToolbarRoot
      className={editorClasses.toolbar.root}
      divider={<Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />}
      sx={sx}
      {...other}
    >
      <HeadingBlock editor={editor} activeLevel={toolbarState.headingLevel} />

      {/* Text styles */}
      <ToolbarBlock>
        <ToolbarItem
          aria-label="Bold (⌘B)"
          active={toolbarState.isBold}
          className={editorClasses.toolbar.bold}
          onClick={() => chainCommands().toggleBold().run()}
          icon={toolbarIcons.bold}
        />
        <ToolbarItem
          aria-label="Italic (⌘I)"
          active={toolbarState.isItalic}
          className={editorClasses.toolbar.italic}
          onClick={() => chainCommands().toggleItalic().run()}
          icon={toolbarIcons.italic}
        />
        <ToolbarItem
          aria-label="Underline (⌘U)"
          active={toolbarState.isUnderline}
          className={editorClasses.toolbar.underline}
          onClick={() => chainCommands().toggleUnderline().run()}
          icon={toolbarIcons.underline}
        />
        <ToolbarItem
          aria-label="Strike (⌘S)"
          active={toolbarState.isStrike}
          className={editorClasses.toolbar.strike}
          onClick={() => chainCommands().toggleStrike().run()}
          icon={toolbarIcons.strike}
        />
      </ToolbarBlock>

      {/* Lists */}
      <ToolbarBlock>
        <ToolbarItem
          aria-label="Bullet list (⌘⇧8)"
          active={toolbarState.isBulletList}
          className={editorClasses.toolbar.bulletList}
          onClick={() => chainCommands().toggleBulletList().run()}
          icon={toolbarIcons.bulletList}
        />
        <ToolbarItem
          aria-label="Ordered list (⌘⇧7)"
          active={toolbarState.isOrderedList}
          className={editorClasses.toolbar.orderedList}
          onClick={() => chainCommands().toggleOrderedList().run()}
          icon={toolbarIcons.orderedList}
        />
      </ToolbarBlock>

      {/* Text alignment — hidden by default, expand to show */}
      {expanded && (
        <ToolbarBlock>
          <ToolbarItem
            aria-label="Align left (⌘⇧L)"
            active={toolbarState.textAlign === 'left'}
            className={editorClasses.toolbar.alignLeft}
            onClick={() => chainCommands().toggleTextAlign('left').run()}
            icon={toolbarIcons.alignLeft}
          />
          <ToolbarItem
            aria-label="Align center (⌘⇧E)"
            active={toolbarState.textAlign === 'center'}
            className={editorClasses.toolbar.alignCenter}
            onClick={() => chainCommands().toggleTextAlign('center').run()}
            icon={toolbarIcons.alignCenter}
          />
          <ToolbarItem
            aria-label="Align right (⌘⇧R)"
            active={toolbarState.textAlign === 'right'}
            className={editorClasses.toolbar.alignRight}
            onClick={() => chainCommands().toggleTextAlign('right').run()}
            icon={toolbarIcons.alignRight}
          />
          <ToolbarItem
            aria-label="Align justify (⌘⇧J)"
            active={toolbarState.textAlign === 'justify'}
            className={editorClasses.toolbar.alignJustify}
            onClick={() => chainCommands().toggleTextAlign('justify').run()}
            icon={toolbarIcons.alignJustify}
          />
        </ToolbarBlock>
      )}

      {/* Code - Code block (fullItem only) */}
      {fullItem && (
        <ToolbarBlock>
          <ToolbarItem
            aria-label="Code (⌘E)"
            active={toolbarState.isCode}
            className={editorClasses.toolbar.code}
            onClick={() => chainCommands().toggleCode().run()}
            icon={toolbarIcons.code}
          />
        </ToolbarBlock>
      )}

      {/* Blockquote - Horizontal rule (fullItem only) */}
      {fullItem && (
        <ToolbarBlock>
          <ToolbarItem
            aria-label="Blockquote (⌘⇧B)"
            active={toolbarState.isBlockquote}
            className={editorClasses.toolbar.blockquote}
            onClick={() => chainCommands().toggleBlockquote().run()}
            icon={toolbarIcons.blockquote}
          />
          <ToolbarItem
            aria-label="Horizontal rule"
            className={editorClasses.toolbar.hr}
            onClick={() => chainCommands().setHorizontalRule().run()}
            icon={toolbarIcons.horizontalRule}
          />
        </ToolbarBlock>
      )}

      {/* Link */}
      <ToolbarBlock>
        <LinkBlock
          editor={editor}
          active={toolbarState.isLink}
          linkIcon={toolbarIcons.link}
          unlinkIcon={toolbarIcons.unlink}
        />
      </ToolbarBlock>

      {/* Hard break - Clear format — hidden by default */}
      {expanded && (
        <ToolbarBlock>
          <ToolbarItem
            aria-label="Hard break (⇧Enter)"
            className={editorClasses.toolbar.hardBreak}
            onClick={() => chainCommands().setHardBreak().run()}
            icon={toolbarIcons.hardBreak}
          />
          <ToolbarItem
            aria-label="Clear format (⌘⇧X)"
            className={editorClasses.toolbar.clear}
            onClick={() => chainCommands().clearNodes().unsetAllMarks().run()}
            icon={toolbarIcons.clear}
          />
        </ToolbarBlock>
      )}

      {/* Undo - Redo (fullItem only) */}
      {fullItem && (
        <ToolbarBlock>
          <ToolbarItem
            aria-label="Undo (⌘Z)"
            disabled={!toolbarState.canUndo}
            className={editorClasses.toolbar.undo}
            onClick={() => chainCommands().undo().run()}
            icon={toolbarIcons.undo}
          />
          <ToolbarItem
            aria-label="Redo (⌘⇧Z)"
            disabled={!toolbarState.canRedo}
            className={editorClasses.toolbar.redo}
            onClick={() => chainCommands().redo().run()}
            icon={toolbarIcons.redo}
          />
        </ToolbarBlock>
      )}

      {/* Fullscreen — hidden by default */}
      {expanded && (
        <ToolbarBlock>
          <ToolbarItem
            aria-label="Fullscreen"
            active={fullscreen}
            className={editorClasses.toolbar.fullscreen}
            onClick={onToggleFullscreen}
            icon={fullscreen ? toolbarIcons.fullscreen : toolbarIcons.exitFullscreen}
          />
        </ToolbarBlock>
      )}

      {/* More toggle — always visible at the end of the toolbar */}
      <ToolbarBlock>
        <ToolbarItem
          aria-label={expanded ? 'Thu gọn' : 'Thêm tuỳ chọn'}
          active={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          icon={moreIcon}
        />
      </ToolbarBlock>
    </ToolbarRoot>
  );
}

// ----------------------------------------------------------------------

const ToolbarRoot = styled(Stack)(({ theme }) => ({
  flexWrap: 'wrap',
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1.25),
  borderTopLeftRadius: 'inherit',
  borderTopRightRadius: 'inherit',
  backgroundColor: theme.vars.palette.background.paper,
  borderBottom: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.2)}`,
}));

const ToolbarBlock = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));
