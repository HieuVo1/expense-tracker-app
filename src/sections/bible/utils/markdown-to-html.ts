// Minimal markdown → HTML renderer for the lesson-section read-only view.
// Scope: the subset of markdown the user actually writes (headings, paragraphs,
// bullet + numbered lists, bold/italic, inline code, blockquotes, links).
// Anything fancier (tables, fenced code blocks, footnotes) gets passthrough
// escaped text — we can grow this if a real case shows up.
//
// We avoid a 30KB markdown-it dep because the section view is hot path and
// the supported subset is tiny.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Apply inline transforms AFTER escaping — we re-introduce tags ourselves.
function inline(s: string): string {
  let out = escapeHtml(s);
  // Inline code first so its body isn't affected by * / _ rules.
  out = out.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  // Bold **text**
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  // Italic *text* (avoid grabbing leftovers of **bold**)
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  // Italic _text_ (word-bounded so snake_case identifiers survive)
  out = out.replace(/(^|\s)_([^_\n]+)_(?=\s|$|[.,!?])/g, '$1<em>$2</em>');
  // Links [text](url)
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return out;
}

type ListBuf = { type: 'ul' | 'ol'; items: string[] };

export function markdownToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const blocks: string[] = [];
  let paraBuf: string[] = [];
  let listBuf: ListBuf | null = null;
  let quoteBuf: string[] | null = null;

  const flushPara = () => {
    if (paraBuf.length) {
      blocks.push(`<p>${inline(paraBuf.join(' '))}</p>`);
      paraBuf = [];
    }
  };
  const flushList = () => {
    if (listBuf) {
      const items = listBuf.items.map((it) => `<li>${inline(it)}</li>`).join('');
      blocks.push(`<${listBuf.type}>${items}</${listBuf.type}>`);
      listBuf = null;
    }
  };
  const flushQuote = () => {
    if (quoteBuf) {
      blocks.push(`<blockquote>${inline(quoteBuf.join(' '))}</blockquote>`);
      quoteBuf = null;
    }
  };
  const flushAll = () => {
    flushPara();
    flushList();
    flushQuote();
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushAll();
      continue;
    }

    const hm = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (hm) {
      flushAll();
      const level = hm[1].length;
      blocks.push(`<h${level}>${inline(hm[2])}</h${level}>`);
      continue;
    }

    const bm = /^[-*+]\s+(.*)$/.exec(trimmed);
    if (bm) {
      flushPara();
      flushQuote();
      if (!listBuf || listBuf.type !== 'ul') {
        flushList();
        listBuf = { type: 'ul', items: [] };
      }
      listBuf.items.push(bm[1]);
      continue;
    }

    const nm = /^\d+\.\s+(.*)$/.exec(trimmed);
    if (nm) {
      flushPara();
      flushQuote();
      if (!listBuf || listBuf.type !== 'ol') {
        flushList();
        listBuf = { type: 'ol', items: [] };
      }
      listBuf.items.push(nm[1]);
      continue;
    }

    const qm = /^>\s?(.*)$/.exec(trimmed);
    if (qm) {
      flushPara();
      flushList();
      if (!quoteBuf) quoteBuf = [];
      quoteBuf.push(qm[1]);
      continue;
    }

    flushList();
    flushQuote();
    paraBuf.push(trimmed);
  }
  flushAll();

  return blocks.join('\n');
}
