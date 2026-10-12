'use client'

import type { DefaultCellComponentProps } from 'payload'

/** List-view cell for the isPlaceholder field (FR-SEED-01). Real records show nothing. */
export function PlaceholderCell({ cellData }: DefaultCellComponentProps) {
  if (cellData !== true) return null

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        background: '#eee3c4',
        color: '#7a5c22',
        border: '1px solid #c4a050',
      }}
    >
      Placeholder
    </span>
  )
}
