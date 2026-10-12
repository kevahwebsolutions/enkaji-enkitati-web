/** Volunteer roles shown on /get-involved. */
export type VolunteerRole = { title: string; icon: string; summary: string }

export const VOLUNTEER_ROLES: VolunteerRole[] = [
  {
    title: 'School mentor',
    icon: 'GraduationCap',
    summary:
      'Join an Ignite Dreams visit to a primary or high school and lead a session on a topic chosen for the age group.',
  },
  {
    title: 'Event volunteer',
    icon: 'CalendarCheck',
    summary:
      'Help with setting up, welcoming guests, registration and clearing up at our community events and advocacy days.',
  },
  {
    title: 'Photographer or storyteller',
    icon: 'Camera',
    summary:
      'Capture our work with care and consent, and write stories that respect the people in them. Children are never named with photos.',
  },
  {
    title: 'Skills trainer',
    icon: 'Hammer',
    summary:
      'Teach a skill such as bead work, record keeping, farming or small business to women in our savings groups.',
  },
]
