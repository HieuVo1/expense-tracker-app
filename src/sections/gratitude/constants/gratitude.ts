// ----------------------------------------------------------------------
// Daily gratitude practice — shared constants.

// Soft daily goal — NOT enforced (save allows as few as 1 item). Drives the
// default starter rows, the progress chip, the "done" state, and the dashboard
// reminder (which nudges until today reaches this many items).
export const GRATITUDE_TARGET = 5;

// Soft cap to keep payload + UI sane.
export const GRATITUDE_MAX_ITEMS = 20;

// Max characters per gratitude item.
export const GRATITUDE_ITEM_MAX_LEN = 200;

export const GRATITUDE_ACCENT = '#F4A261'; // warm amber — gratitude / warmth

export const GRATITUDE_PLACEHOLDERS = [
  'Sức khoẻ của mình hôm nay...',
  'Một người mình biết ơn...',
  'Một điều nhỏ khiến mình mỉm cười...',
  'Một bài học mình nhận ra...',
  'Một thứ mình đang có...',
];
