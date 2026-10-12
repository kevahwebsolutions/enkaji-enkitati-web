/**
 * Minimal CSV writer for admin exports. Cells that start with =, +, - or @ are prefixed with an
 * apostrophe so a spreadsheet never runs them as a formula (CSV injection), and a byte order mark is
 * added so Excel reads UTF-8 correctly.
 */
const FORMULA_START = /^[=+\-@\t\r]/

export function csvCell(value: unknown): string {
  let text =
    value === null || value === undefined
      ? ''
      : Array.isArray(value)
        ? value.join('; ')
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value)
  if (FORMULA_START.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(columns: string[], rows: Array<Record<string, unknown>>): string {
  const lines = [columns.map(csvCell).join(',')]
  for (const row of rows) lines.push(columns.map((column) => csvCell(row[column])).join(','))
  return `﻿${lines.join('\r\n')}\r\n`
}
