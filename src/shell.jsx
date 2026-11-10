import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { alerts, assetTypes, procedures, stations } from './data.js'
import { anonymousIdentity, sessionIdentity } from './people.js'
import { track, useLab } from './lab.jsx'
import { Icon, Led, Modal, Switch, useOutside } from './ui.jsx'

const nav = [
  { to: '/', icon: 'overview', label: 'Overview', id: 'nav-overview', end: true },
  { to: '/chambers', icon: 'chambers', label: 'Chambers', id: 'nav-chambers' },
  { to: '/floor', icon: 'floor', label: 'Floor', id: 'nav-floor' },
  { to: '/stations', icon: 'instruments', label: 'Stations', id: 'nav-stations' },
  { to: '/procedures', icon: 'protocols', label: 'Procedures', id: 'nav-procedures' },
]

export function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="4" fill="#14181c" />
      <ellipse cx="11" cy="16" rx="4.5" ry="8" fill="none" stroke="#ff8a1f" strokeWidth="3" />
      <ellipse cx="21" cy="16" rx="4.5" ry="8" fill="none" stroke="#4db2ff" strokeWidth="3" />
    </svg>
  )
}

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(t)
  }, [])
  return <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
}

export function Rail() {
  const { canManage, temp } = useLab()
  const [c, setC] = useState(312.4)
  useEffect(() => {
    const t = setInterval(() => setC(312.4 + (Math.random() - 0.5) * 6), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <aside className="rail" id="rail">
      <Link to="/" className="brand" id="brand">
        <Logo />
        <span>Atlas<small>Test facility</small></span>
      </Link>
      <nav>
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} id={n.id}>
            <Icon name={n.icon} />
            {n.label}
          </NavLink>
        ))}
        <div className="rail-gap" />
        <NavLink to="/personnel" id="nav-personnel">
          <Icon name={canManage ? 'team' : 'lock'} />
          Personnel
        </NavLink>
        <NavLink to="/settings" id="nav-settings">
          <Icon name="settings" />
          Settings
        </NavLink>
      </nav>
      <div className="readout" id="core-readout">
        <div className="readout-row"><span>Core temp</span><Led tone={c > 316 ? 'warn' : 'ok'} /></div>
        <strong>{temp(c)}</strong>
        <div className="readout-row"><span>Sublevel 6</span><span>Sealed</span></div>
        <div className="readout-row"><span>Cells held</span><span>4 / 4</span></div>
        <div className="readout-row"><span>Facility time</span><Clock /></div>
      </div>
    </aside>
  )
}

const titles = { '': 'Overview', chambers: 'Chambers', floor: 'Floor', stations: 'Stations', procedures: 'Procedures', personnel: 'Personnel', settings: 'Settings' }

export function Header({ onPalette }) {
  const { persona, account, canEdit, signOut, state, setFlag, toast } = useLab()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(null)
  const [adding, setAdding] = useState(null)
  const close = useCallback(() => setMenu(null), [])
  useOutside('.popover, .popover-trigger', close, !!menu)
  useEffect(() => setMenu(null), [pathname])

  const section = titles[pathname.split('/')[1] ?? ''] ?? 'Not found'
  const open = alerts.filter((a) => !state.alertsAcked.includes(a.id))
  const toggle = (name) => setMenu((m) => (m === name ? null : name))

  return (
    <header className="header" id="header">
      <div className="crumb">
        <span className="muted">{account.name}</span>
        <span className="sep">/</span>
        <strong>{section}</strong>
      </div>
      <button className="palette-trigger" id="btn-palette" aria-label="Search or jump to" onClick={() => { setMenu(null); onPalette() }}>
        <Icon name="search" size={16} />
        <span>Search or jump to…</span>
        <kbd>⌘K</kbd>
      </button>
      <div className="header-right">
        <div className="popover-wrap">
          <button className="btn primary popover-trigger" id="btn-quick-add" disabled={!canEdit} title={canEdit ? undefined : 'Observation only'} onClick={() => toggle('add')}>
            <Icon name="plus" size={16} /> New
          </button>
          {menu === 'add' && (
            <div className="popover menu" id="quick-add-menu">
              <button onClick={() => { setMenu(null); setAdding('chamber') }}>New chamber</button>
              <button onClick={() => { setMenu(null); setAdding('asset') }}>Register an asset</button>
              <button onClick={() => { setMenu(null); navigate('/stations') }}>Reserve a station</button>
              <button onClick={() => { setMenu(null); navigate('/procedures') }}>Run a procedure</button>
            </div>
          )}
        </div>
        <div className="popover-wrap">
          <button className="icon-btn bordered popover-trigger" id="btn-alerts" aria-label="Alerts" onClick={() => toggle('alerts')}>
            <Icon name="bell" />
            {open.length > 0 && <span className="count" id="alert-count">{open.length}</span>}
          </button>
          {menu === 'alerts' && (
            <div className="popover wide" id="alerts-popover">
              <h4>Alerts</h4>
              {open.length === 0 && <p className="muted">All clear. WREN is pleased.</p>}
              {open.map((a) => (
                <div key={a.id} className="alert-row">
                  <Led tone={a.level === 'critical' ? 'bad' : a.level === 'warn' ? 'warn' : 'info'} />
                  <div>
                    <strong>{a.title}</strong>
                    <small>{a.when}</small>
                  </div>
                </div>
              ))}
              <Link to="/" className="link" onClick={() => setMenu(null)}>View on overview</Link>
            </div>
          )}
        </div>
        <button className="icon-btn bordered" id="btn-theme" aria-label="Toggle blackout theme" title={state.flags.dark ? 'Test floor' : 'Blackout'} onClick={() => setFlag('dark', !state.flags.dark)}>
          <Icon name={state.flags.dark ? 'sun' : 'moon'} />
        </button>
        <div className="popover-wrap">
          <button className="user-chip popover-trigger" id="user-chip" aria-label={`Account menu for ${persona.name}`} onClick={() => toggle('user')}>
            <span className="avatar">{persona.initials}</span>
            <span className="user-text">
              <strong>{persona.name}</strong>
              <small>{persona.title}</small>
            </span>
            <Icon name="chevron" size={14} />
          </button>
          {menu === 'user' && (
            <div className="popover menu right" id="user-menu">
              <div className="menu-head">
                <strong>{account.name}</strong>
                <small>{persona.badge}</small>
              </div>
              <button id="btn-switch-badge" onClick={() => { setMenu(null); navigate('/gate') }}>Switch badge</button>
              <button onClick={() => { setMenu(null); navigate('/settings') }}>Settings</button>
              <button id="btn-sign-out" onClick={() => { setMenu(null); signOut(); toast('Signed out') }}>Sign out</button>
            </div>
          )}
        </div>
      </div>
      {adding === 'chamber' && <NewChamber onClose={() => setAdding(null)} />}
      {adding === 'asset' && <RegisterAsset onClose={() => setAdding(null)} />}
    </header>
  )
}

function NewChamber({ onClose }) {
  const { addChamber, persona, toast } = useLab()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const create = () => {
    const n = 22 + Math.floor(Math.random() * 70)
    const code = `CH-${String(n).padStart(2, '0')}`
    const today = new Date().toISOString().slice(0, 10)
    addChamber({
      id: code.toLowerCase(), code, title: title.trim(), lead: persona.name, status: 'operational', progress: 0,
      started: today, summary: summary.trim() || 'No summary yet.',
      milestones: [{ label: 'Kickoff', date: today, done: true }], comments: [],
    })
    track('chamber_created')
    toast(`${code} created`)
    onClose()
    navigate(`/chambers/${code.toLowerCase()}`)
  }
  return (
    <Modal title="New chamber" id="new-chamber-modal" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" id="btn-create-chamber" disabled={title.trim().length < 3} onClick={create}>Create chamber</button></>}>
      <div className="form">
        <label>Name<input id="chamber-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pendulum Atrium" /></label>
        <label>Summary<textarea id="chamber-summary" className="input" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} /></label>
      </div>
    </Modal>
  )
}

function RegisterAsset({ onClose }) {
  const { addAsset, allChambers, toast } = useLab()
  const [name, setName] = useState('')
  const [type, setType] = useState(assetTypes[0])
  const [chamber, setChamber] = useState(allChambers[0].code)
  const save = () => {
    const id = `A-${String(500 + Math.floor(Math.random() * 400))}`
    addAsset({ id, name: name.trim(), type, chamber, location: 'Intake / Staging', status: 'ok', qty: 1 })
    track('asset_registered', { type })
    toast(`${id} registered to Staging`)
    onClose()
  }
  return (
    <Modal title="Register an asset" id="register-asset-modal" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" id="btn-save-asset" disabled={name.trim().length < 2} onClick={save}>Register</button></>}>
      <div className="form">
        <label>Name<input id="asset-name" className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Type<select id="asset-type" className="input" value={type} onChange={(e) => setType(e.target.value)}>{assetTypes.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label>Chamber<select id="asset-chamber" className="input" value={chamber} onChange={(e) => setChamber(e.target.value)}>{allChambers.map((c) => <option key={c.id}>{c.code}</option>)}</select></label>
      </div>
    </Modal>
  )
}

export function Toasts() {
  const { toasts, dismissToast } = useLab()
  return (
    <div className="toasts" id="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`} onClick={() => dismissToast(t.id)}>{t.message}</div>
      ))}
    </div>
  )
}

export function Palette({ onClose }) {
  const { allChambers } = useLab()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const items = useMemo(
    () => [
      ...nav.map((n) => ({ label: n.label, hint: 'Page', to: n.to })),
      ...allChambers.map((c) => ({ label: `${c.code} · ${c.title}`, hint: 'Chamber', to: `/chambers/${c.id}` })),
      ...stations.map((s) => ({ label: s.name, hint: 'Station', to: '/stations' })),
      ...procedures.map((p) => ({ label: p.name, hint: 'Procedure', to: `/procedures/${p.id}` })),
    ],
    [allChambers],
  )
  const list = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
  const go = (item) => {
    onClose()
    navigate(item.to)
  }
  return (
    <Modal title="Jump to" id="palette" onClose={onClose}>
      <input
        id="palette-input"
        className="input"
        autoFocus
        placeholder="Type a page, chamber, station, or procedure"
        value={q}
        onChange={(e) => { setQ(e.target.value); setCursor(0) }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, list.length - 1)) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
          if (e.key === 'Enter' && list[cursor]) go(list[cursor])
        }}
      />
      <ul className="palette-list">
        {list.map((item, i) => (
          <li key={item.label + item.hint}>
            <button className={i === cursor ? 'on' : ''} onMouseEnter={() => setCursor(i)} onClick={() => go(item)}>
              <span>{item.label}</span>
              <small>{item.hint}</small>
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="muted pad">Nothing matches.</li>}
      </ul>
    </Modal>
  )
}

export function Console() {
  const { persona, account, state, setFlag, resetLab, toast } = useLab()
  const [open, setOpen] = useState(false)
  const [, tick] = useState(0)
  const { pathname, search } = useLocation()

  useEffect(() => {
    if (!open) return
    const t = setInterval(() => tick((n) => n + 1), 1500)
    return () => clearInterval(t)
  }, [open])

  const agent = window.pendo?.isReady?.() ? 'ready' : window.pendo ? 'loading' : 'not installed'
  const identity = persona ? sessionIdentity(persona, account) : anonymousIdentity

  return (
    <div className="console">
      {open && (
        <div className="console-panel" id="test-console">
          <h4>Test console</h4>
          {persona && <p className="muted">{persona.blurb}</p>}
          <div className="kv">
            <span>Route</span><code>{pathname}{search}</code>
            <span>Pendo agent</span><code id="agent-status">{agent}</code>
          </div>
          <details>
            <summary>Current visitor</summary>
            <pre id="identity-json">{JSON.stringify(identity, null, 2)}</pre>
          </details>
          <div className="switches">
            <Switch id="flag-dark" label="Blackout theme" checked={state.flags.dark} onChange={(v) => setFlag('dark', v)} />
            <Switch id="flag-floor-v2" label="Floor grid v2 variant" checked={state.flags.floorV2} onChange={(v) => setFlag('floorV2', v)} />
            <Switch id="flag-compact" label="Compact density" checked={state.flags.compact} onChange={(v) => setFlag('compact', v)} />
            <Switch id="flag-fahrenheit" label="Show °F" checked={state.flags.fahrenheit} onChange={(v) => setFlag('fahrenheit', v)} />
          </div>
          <div className="btn-row">
            <button className="btn small danger" id="btn-reset-lab" onClick={() => { resetLab(); toast('Data reset') }}>Reset data</button>
          </div>
        </div>
      )}
      <button className="console-toggle" id="test-console-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? 'Close console' : 'Test console'}
      </button>
    </div>
  )
}
