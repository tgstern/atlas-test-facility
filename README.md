# atlas-test-facility

A test-facility workspace for testing Pendo guide experiments, styled as a Cold War
government facility crossed with X-Files case files and Black Mesa safety signage:
aged paper, typewriter type, rubber stamps, hazard stripes, a green phosphor readout
rail, and a deadpan facility AI (WREN). The dark "Blackout" theme adds CRT scanlines.
The facility is the Atlas Dynamics Test Facility.
It has real interactions, role-based variants, and six visitors, so guides installed
from another repo have realistic targets and audiences. All names are original.

```sh
npm install
npm run dev      # http://localhost:5176
```

No Pendo snippet ships with the app, and the app never calls `pendo.identify` itself;
the install adds that. The signed-in visitor is `persona` and its department is
`account`, both from `useLab()` (`LabProvider` in `src/lab.jsx`). `persona` is `null`
when signed out. `sessionIdentity()` in `src/people.js` maps them to visitor and
account fields. Key actions fire `pendo.track(...)` events; grep `track(` for the list.

## Visitors

Signed-out visitors land on `/gate`, a badge check-in screen. Presenting a badge signs
in and returns to the page you wanted. **Switch badge** and **Sign out** are in the user
menu (`#user-chip`).
The choice persists in `localStorage`. Orientation progress and bookings are tracked
per visitor, so switching badges never leaks one visitor's state into another's.

| id | Who | Role | Department | Good for |
| --- | --- | --- | --- | --- |
| `voss` | Dr. Imogen Voss | admin | Facility Operations | Role changes, approvals |
| `okoro` | Dale Okoro | manager | Facility Operations | Same department, narrower role |
| `jun` | Jun Takeda | member | Test Engineering | Everyday user; sentry bay bookings need approval |
| `leila` | Leila Haddad | member | Orientation | Orientation checklist, no clearance |
| `fitch` | Inspector Owen Fitch | viewer | Safety Oversight | Read-only |
| `visitor` | Visitor | viewer | none | Anonymous (empty ids) |

## Test console

The **Test console** pill (bottom right, `#test-console-toggle`) shows the identity sent
to Pendo and whether the agent has loaded, and toggles:

- Blackout theme, compact density, °F
- **Floor grid v2** variant (adds layout presets and panel labels)
- **Reset data**: clears bookings, runs, onboarding, pins, and custom records

## Pages

| Route | What's there |
| --- | --- |
| `/gate` | Badge check-in |
| `/` | Overview: orientation checklist (new users), tiles, station timeline, alerts, posted notices |
| `/chambers`, `/chambers/:id` | Master-detail split view, tabs (`?tab=`), pin, request review / approve, transcript |
| `/floor` | Floor grid (select panels, rows, columns; set surface; flag) and asset registry with drawer |
| `/stations` | Live status, reserve modal with slot picker, approval and clearance variants |
| `/procedures`, `/procedures/:id` | Procedure list; step runner with timers, checkboxes, skip and finish modals |
| `/personnel` | Supervisors and directors only; others get a restricted page |
| `/settings` | Profile, preferences (theme, density, units), notifications tabs |

Also: `⌘K` / `Ctrl+K` opens a jump-to palette (`#palette-input`), and **New** in the
header (`#btn-quick-add`) opens a menu with New chamber and Register an asset modals.

## Variants by role, department, or flag

- **Viewer:** actions disabled, with explanatory hover titles
- **Department:** each visitor's department is the Pendo account (`account.id`, `account.name`, `account.site`)
- **New user:** `#onboarding` checklist that ticks as pages are used
- **Member vs manager:** `#btn-request-review` vs `#btn-approve-review`
- **Restricted station:** clearance-required state, `#btn-clearance-*`, pending bookings
- **Floor grid v2 flag:** `#floor-presets` and panel labels

## No in-app banners

The app deliberately ships no banners, announcement bars, or toast-style notices of its
own, so guides installed later have that space to themselves. Nothing is fixed to the top of the page.

## Setting

Sublevel 6 is a sealed containment level. Four non-terrestrial specimens (K-1 to K-4,
recovered from Site K) are held in cells, a passive receiver logs a repeating 19.4 Hz
carrier, and several test chambers above exist partly to study how the specimens
respond to light, sound, and pressure. The tone is dry and bureaucratic: memos,
alerts, the access log, and procedure steps carry the details. Content lives in
`src/data.js`.

## Targeting notes

Element ids are stable (`#nav-*`, `#btn-*`, `#panel-A1`, `#station-*`, …). Modals render
in a portal on `<body>` at `z-index` ≤ 900, below Pendo guide layers.
