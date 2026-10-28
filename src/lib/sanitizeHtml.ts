/**
 * Strict allow-list sanitiser for rich text (biography chapters, stories).
 *
 * Approach: tokenise the markup ourselves and REBUILD it from known-safe parts,
 * rather than trying to strip bad things out of the original. Only these tags
 * survive, and they come back with NO attributes at all (no style, no on*, no
 * href, no src), so there is nothing left to smuggle script through. Text is
 * HTML-escaped. Anything unknown is dropped but its text is kept.
 * Pure function: unit-testable and safe on server or client.
 */
const TAGS = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote']);
const VOID = new Set(['br']);
const DROP_WITH_CONTENT = /<\s*(script|style|iframe|object|embed|svg|math|template|noscript)\b[\s\S]*?<\s*\/\s*\1\s*>/gi;

function escapeText(t: string): string {
  return t.replace(/&(?!(?:amp|lt|gt|quot|#39|nbsp);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function sanitizeHtml(input: string): string {
  if (!input) return '';
  let src = String(input).replace(/\u0000/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(DROP_WITH_CONTENT, '');
  const out: string[] = [];
  const stack: string[] = [];
  // A real tag has no space after '<' (so "a < b" stays text). A dangling "<..." at the very end is dropped.
  const re = /<(\/)?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>|<[a-zA-Z\/][^>]*$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(escapeText(src.slice(last, m.index)));
    last = m.index + m[0].length;
    if (!m[2]) continue;
    const name = m[2].toLowerCase();
    if (!TAGS.has(name)) continue;
    if (m[1]) {
      const at = stack.lastIndexOf(name);
      if (at === -1) continue; // stray closing tag
      while (stack.length - 1 > at) out.push(`</${stack.pop()}>`);
      stack.pop();
      out.push(`</${name}>`);
    } else if (VOID.has(name)) {
      out.push('<br>');
    } else {
      stack.push(name);
      out.push(`<${name}>`);
    }
  }
  if (last < src.length) out.push(escapeText(src.slice(last)));
  while (stack.length) out.push(`</${stack.pop()}>`);
  return out.join('');
}

/** Plain text with all markup removed (for excerpts, reading time, JSON-LD). */
export function htmlToText(input: string): string {
  return sanitizeHtml(input)
    .replace(/<\/(p|h2|h3|li|blockquote)>/gi, '\n')
    .replace(/<br>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Minutes to read, assuming ~200 words per minute (never less than 1). */
export function readingMinutes(input: string): number {
  const words = htmlToText(input).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
