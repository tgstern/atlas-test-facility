import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { accounts, people, sessionIdentity } from './people.js'
import { alerts, assets, chambers } from './data.js'

const KEY = 'atlas:v1'

// Orientation checklist step keys (mirrors the steps rendered on the Overview page).
const ONBOARDING_STEPS = ['chamber', 'panels', 'reserve', 'procedure']

// Visitors already reported as completing orientation this browser session; survives remounts.
const orientationCompleted = new Set()

const defaults = {
  personaId: null,
  flags: { dark: false, floorV2: false, compact: false, fahrenheit: false },
  pinned: [],
  bookings: [],
  runs: [],
  onboarding: {},
  onboardingDismissed: {},
  alertsAcked: [],
  comments: {},
  statuses: {},
  customChambers: [],
  customAssets: [],
}

function load() {
  let saved = {}
  try {
    saved = JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {}
  const state = { ...defaults, ...saved, flags: { ...defaults.flags, ...saved.flags } }
  if (typeof state.onboardingDismissed !== 'object') state.onboardingDismissed = {}
  if (state.personaId && !people.some((p) => p.id === state.personaId)) state.personaId = null
  return state
}

export function track(name, props) {
  window.pendo?.track?.(name, props)
}

const LabContext = createContext(null)

export function LabProvider({ children }) {
  const [state, setState] = useState(load)
  const [toasts, setToasts] = useState([])

  const persona = people.find((p) => p.id === state.personaId) ?? null
  const account = persona ? accounts[persona.account] : accounts.none

  // Identify the signed-in persona to Pendo on badge scan, badge switch, and on
  // reload (the persona is restored from localStorage). Anonymous personas keep
  // the anonymous visitor that main.jsx initialized.
  useEffect(() => {
    if (persona && !persona.anonymous) window.pendo.identify(sessionIdentity(persona, account))
  }, [persona, account])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  useEffect(() => {
    document.documentElement.dataset.theme = state.flags.dark ? 'dark' : 'light'
    document.documentElement.dataset.density = state.flags.compact ? 'compact' : 'comfortable'
  }, [state.flags.dark, state.flags.compact])

  const toast = useCallback((message, tone = 'ok') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }, [])

  const patch = useCallback((fn) => setState((s) => ({ ...s, ...fn(s) })), [])

  const value = useMemo(() => {
    const role = persona?.role
    return {
      state,
      persona,
      account,
      canEdit: role === 'admin' || role === 'manager' || role === 'member',
      canManage: role === 'admin' || role === 'manager',
      isAdmin: role === 'admin',
      isViewer: !persona || role === 'viewer',
      isNewUser: !!persona && persona.tenureDays < 7,
      allChambers: [...state.customChambers, ...chambers].map((c) => ({ ...c, status: state.statuses[c.id] ?? c.status })),
      allAssets: [...state.customAssets, ...assets],
      toasts,
      toast,
      dismissToast: (id) => setToasts((t) => t.filter((x) => x.id !== id)),
      signIn: (personaId) => {
        // Switching to the anonymous badge must not stay tracked as the previous visitor.
        if (people.find((p) => p.id === personaId)?.anonymous) window.pendo?.clearSession?.()
        patch(() => ({ personaId }))
      },
      signOut: () => {
        window.pendo?.clearSession?.()
        patch(() => ({ personaId: null }))
      },
      setFlag: (flag, v) => patch((s) => ({ flags: { ...s.flags, [flag]: v } })),
      temp: (c) => (state.flags.fahrenheit ? `${((c * 9) / 5 + 32).toFixed(1)} °F` : `${c.toFixed(1)} °C`),
      togglePin: (id) => patch((s) => ({ pinned: s.pinned.includes(id) ? s.pinned.filter((p) => p !== id) : [...s.pinned, id] })),
      myBookings: state.bookings.filter((b) => b.by === persona?.id),
      addBooking: (b) => patch((s) => ({ bookings: [...s.bookings, { ...b, by: s.personaId, id: `bk-${Date.now()}` }] })),
      cancelBooking: (id) => patch((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) })),
      addRun: (r) => patch((s) => ({ runs: [{ ...r, id: `run-${Date.now()}` }, ...s.runs] })),
      onboarding: state.onboarding[persona?.id] ?? {},
      onboardingDismissed: !!state.onboardingDismissed[persona?.id],
      markStep: (key) => {
        const id = state.personaId
        const progress = state.onboarding[id] ?? {}
        // Orientation checklist completed: this step is the last of the four still open for a new user.
        if (
          id &&
          persona?.tenureDays < 7 &&
          !progress[key] &&
          !orientationCompleted.has(id) &&
          ONBOARDING_STEPS.every((k) => k === key || progress[k])
        ) {
          orientationCompleted.add(id)
          track('Orientation checklist completed', {
            role: persona.role,
            department: account.id,
            final_step: key,
            steps_completed: ONBOARDING_STEPS.length,
            tenure_days: persona.tenureDays,
          })
        }
        setState((s) => {
          const id = s.personaId
          if (!id || s.onboarding[id]?.[key]) return s
          return { ...s, onboarding: { ...s.onboarding, [id]: { ...s.onboarding[id], [key]: true } } }
        })
      },
      dismissOnboarding: () => patch((s) => ({ onboardingDismissed: { ...s.onboardingDismissed, [s.personaId]: true } })),
      ackAlert: (id) => {
        // Alert acknowledged: the alert leaves the open list and the bell count.
        if (!state.alertsAcked.includes(id)) {
          const alert = alerts.find((a) => a.id === id)
          track('Alert acknowledged', {
            alert_id: id,
            alert_level: alert?.level ?? 'unknown',
            role: role ?? 'none',
            department: account.id,
            open_alerts_remaining: alerts.filter((a) => a.id !== id && !state.alertsAcked.includes(a.id)).length,
          })
        }
        patch((s) => ({ alertsAcked: [...s.alertsAcked, id] }))
      },
      setStatus: (id, status) => patch((s) => ({ statuses: { ...s.statuses, [id]: status } })),
      addComment: (id, comment) => patch((s) => ({ comments: { ...s.comments, [id]: [...(s.comments[id] ?? []), comment] } })),
      addChamber: (chamber) => patch((s) => ({ customChambers: [chamber, ...s.customChambers] })),
      addAsset: (asset) => patch((s) => ({ customAssets: [asset, ...s.customAssets] })),
      resetLab: () => patch((s) => ({ ...defaults, personaId: s.personaId, flags: s.flags })),
    }
  }, [state, persona, account, toasts, toast, patch])

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>
}

export function useLab() {
  return useContext(LabContext)
}
