import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const paths = {
  overview: <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" />,
  chambers: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9" />,
  floor: (
    <>
      <rect x="3.5" y="3.5" width="5" height="5" /><rect x="9.5" y="3.5" width="5" height="5" /><rect x="15.5" y="3.5" width="5" height="5" />
      <rect x="3.5" y="9.5" width="5" height="5" /><rect x="9.5" y="9.5" width="5" height="5" /><rect x="15.5" y="9.5" width="5" height="5" />
      <rect x="3.5" y="15.5" width="5" height="5" /><rect x="9.5" y="15.5" width="5" height="5" /><rect x="15.5" y="15.5" width="5" height="5" />
    </>
  ),
  instruments: <path d="M4 18a9 9 0 1 1 16 0M12 14l4-4M12 18h.01" />,
  protocols: <path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />,
  results: <path d="M3 3v18h18M7 15l4-5 3 3 5-7" />,
  team: (
    <>
      <circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14a5 5 0 0 1 5 5" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h8M18 7h2M4 17h2M12 17h8" /><circle cx="15" cy="7" r="2.5" /><circle cx="9" cy="17" r="2.5" />
    </>
  ),
  search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4-4" /></>,
  bell: <path d="M6 16v-5a6 6 0 1 1 12 0v5l2 2H4zM10 21h4" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" /></>,
  moon: <path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12l5 5 9-10" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  play: <path d="M7 4l12 8-12 8z" />,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
}

export function Icon({ name, size = 18 }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

export function PageHeader({ eyebrow, title, sub, children }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  )
}

export function Tabs({ tabs, value, onChange, id }) {
  return (
    <div className="tabs" role="tablist" id={id}>
      {tabs.map((t) => (
        <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={value === t.id} className={value === t.id ? 'on' : ''} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge tone-${tone}`}>{children}</span>
}

export const statusMeta = {
  operational: { label: 'Operational', tone: 'ok' },
  review: { label: 'Under review', tone: 'info' },
  certified: { label: 'Certified', tone: 'neutral' },
  offline: { label: 'Offline', tone: 'warn' },
}

export function StatusBadge({ status }) {
  const m = statusMeta[status]
  return <Badge tone={m.tone}>{m.label}</Badge>
}

export function Tag({ children }) {
  return <span className="tag">{children}</span>
}

export function Led({ tone = 'ok' }) {
  return <span className={`led ${tone}`} />
}

export function Stamp({ tone = 'bad', big = false, children }) {
  return <span className={`stamp s-${tone}${big ? ' big' : ''}`}>{children}</span>
}

export function Empty({ title, stamp, children }) {
  return (
    <div className="empty">
      {stamp ? <Stamp big>{stamp}</Stamp> : <div className="empty-mark" />}
      <h3>{title}</h3>
      <div className="empty-body">{children}</div>
    </div>
  )
}

export function Switch({ checked, onChange, label, id }) {
  return (
    <label className="switch">
      <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch-track" />
      <span>{label}</span>
    </label>
  )
}

export function Modal({ title, onClose, children, footer, drawer = false, id, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${drawer ? ' drawer' : ''}${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} id={id}>
        <header>
          <h3>{title}</h3>
          <button className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="x" /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}

export function useOutside(selector, onOutside, active) {
  useEffect(() => {
    if (!active) return
    const handler = (e) => !e.target.closest(selector) && onOutside()
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [selector, onOutside, active])
}

export function rng(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}
