/**
 * Tiny HTML templating helper for the build-time renderer.
 * Interpolated values are escaped unless they are the result of another html`` call.
 */
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);

class Markup {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

/** Marks a string as already safe HTML. */
export const raw = (value) => new Markup(String(value));

function render(value) {
  if (value === null || value === undefined || value === false || value === true) return '';
  if (value instanceof Markup) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  return escapeHtml(value);
}

export function html(strings, ...values) {
  let out = '';
  for (let i = 0; i < strings.length; i += 1) {
    out += strings[i];
    if (i < values.length) out += render(values[i]);
  }
  return new Markup(out);
}

/** Serialises data for a <script type="application/json"> block. */
export const jsonScript = (data) => raw(JSON.stringify(data).replace(/</g, '\\u003c'));
