/** Brand colour tokens. Keep in sync with :root in globals.css and enkaji-content/brand/brand.md. */
export const brandColors = {
  primary: {
    name: 'Forest green',
    token: '--primary',
    hex: '#1C380E',
    use: 'Header, headings, primary buttons, footer',
  },
  primarySoft: {
    name: 'Soft green',
    token: '--primary-soft',
    hex: '#2E5A1C',
    use: 'Hover states, links',
  },
  accent: {
    name: 'Harvest gold',
    token: '--accent',
    hex: '#C4A050',
    use: 'Donate button, icons, dividers, focus ring',
  },
  accentInk: {
    name: 'Deep gold',
    token: '--accent-ink',
    hex: '#7A5C22',
    use: 'Gold text on light backgrounds',
  },
  bead: {
    name: 'Bead cream',
    token: '--bead',
    hex: '#EEE3C4',
    use: 'Pattern fills, card tints',
  },
  sand: { name: 'Sand', token: '--sand', hex: '#F7F1E1', use: 'Section backgrounds' },
  ink: { name: 'Ink', token: '--ink', hex: '#1C1A17', use: 'Body text' },
} as const

export const white = '#FFFFFF'
export const mutedForeground = '#5A554C'
