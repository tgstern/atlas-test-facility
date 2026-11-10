export const accounts = {
  atlas: { id: 'facility-operations', name: 'Facility Operations', site: 'Surface' },
  cobalt: { id: 'test-engineering', name: 'Test Engineering', site: 'Sublevel 2' },
  cohort: { id: 'orientation', name: 'Orientation', site: 'Sublevel 1' },
  board: { id: 'safety-oversight', name: 'Safety Oversight', site: 'Surface' },
  none: { id: '', name: 'No department', site: '-' },
}

const all = ['lightbridge', 'gel', 'cubes', 'sentry', 'reclaim', 'observe', 'receiver', 'cells']

export const people = [
  {
    id: 'voss',
    name: 'Dr. Imogen Voss',
    initials: 'IV',
    title: 'Facility Director',
    role: 'admin',
    account: 'atlas',
    email: 'imogen.voss@atlas.test',
    badge: 'RD-0007',
    tenureDays: 1460,
    trained: all,
    blurb: 'Facility Operations. Admin: manages personnel and approves reviews.',
  },
  {
    id: 'okoro',
    name: 'Dale Okoro',
    initials: 'DO',
    title: 'Test Supervisor',
    role: 'manager',
    account: 'atlas',
    email: 'dale.okoro@atlas.test',
    badge: 'RD-0112',
    tenureDays: 820,
    trained: all,
    blurb: 'Facility Operations, same department as the Director with a narrower role. Approves bookings and reviews.',
  },
  {
    id: 'jun',
    name: 'Jun Takeda',
    initials: 'JT',
    title: 'Test Engineer',
    role: 'member',
    account: 'cobalt',
    email: 'jun.takeda@atlas.test',
    badge: 'CB-0341',
    tenureDays: 96,
    trained: all,
    blurb: 'Everyday member in Test Engineering. Sentry bay bookings go to supervisor approval.',
  },
  {
    id: 'leila',
    name: 'Leila Haddad',
    initials: 'LH',
    title: 'Subject (Orientation)',
    role: 'member',
    account: 'cohort',
    email: 'leila.haddad@atlas.test',
    badge: 'OC-4471',
    tenureDays: 1,
    trained: [],
    blurb: 'Day one in Orientation. Onboarding checklist, no station clearance.',
  },
  {
    id: 'fitch',
    name: 'Inspector Owen Fitch',
    initials: 'OF',
    title: 'Safety Inspector',
    role: 'viewer',
    account: 'board',
    email: 'owen.fitch@atlas.test',
    badge: 'SB-0850',
    tenureDays: 14,
    trained: [],
    blurb: 'Read-only access. Every action is disabled.',
  },
  {
    id: 'visitor',
    name: 'Visitor',
    initials: '??',
    title: 'Tour group',
    role: 'viewer',
    account: 'none',
    email: '',
    badge: 'Guest pass',
    tenureDays: 0,
    trained: [],
    anonymous: true,
    blurb: 'Anonymous and read-only. Identifies to Pendo with an empty visitor id.',
  },
]

export const anonymousIdentity = { visitor: { id: '' }, account: { id: '' } }

export function sessionIdentity(person, account) {
  if (!person || person.anonymous) return anonymousIdentity
  return {
    visitor: {
      id: person.email,
      full_name: person.name,
      email: person.email,
      title: person.title,
      role: person.role,
      tenure_days: person.tenureDays,
      is_new: person.tenureDays < 7,
      cleared_stations: person.trained.length,
    },
    account: {
      id: account.id,
      name: account.name,
      site: account.site,
    },
  }
}
