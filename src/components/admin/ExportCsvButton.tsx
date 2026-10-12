'use client'

import { useState } from 'react'

const TYPES = [
  { value: '', label: 'All forms' },
  { value: 'contact', label: 'Contact' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'school-visit', label: 'School visit' },
  { value: 'join', label: 'Join the CBO' },
  { value: 'pledge', label: 'Donation pledge' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'rsvp', label: 'Event RSVP' },
]

/** Admin action above the form submissions list: download the submissions as a CSV file. */
export function ExportCsvButton() {
  const [formType, setFormType] = useState('')
  const href = `/api/form-submissions/export.csv${formType ? `?formType=${encodeURIComponent(formType)}` : ''}`

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}
    >
      <label htmlFor="export-type" style={{ fontWeight: 600 }}>
        Export to CSV
      </label>
      <select
        id="export-type"
        value={formType}
        onChange={(event) => setFormType(event.target.value)}
        style={{ padding: '6px 8px' }}
      >
        {TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
      <a
        href={href}
        download
        style={{
          padding: '6px 14px',
          border: '1px solid var(--theme-elevation-300)',
          borderRadius: 4,
          fontWeight: 600,
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        Download CSV
      </a>
    </div>
  )
}
