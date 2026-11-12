// Minimal RFC 4180 writer: every cell is a string; cells containing a comma,
// a double quote or a line break are quoted, with quotes doubled.

function cell(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * @param {Record<string,string>[]} rows
 * @param {string[]} headers column order; missing keys become empty cells
 */
export function toCsv(rows, headers) {
  const lines = [headers.map(cell).join(',')];
  for (const row of rows) lines.push(headers.map((h) => cell(row[h])).join(','));
  return lines.join('\n');
}
