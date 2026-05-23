// ----------------------------------------------------------------------
// Daily gratitude practice — shared constants.

// Hard minimum: an entry counts as "done for today" only with >= 5 items.
// The form blocks saving below this threshold.
export const GRATITUDE_MIN_ITEMS = 5;

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
