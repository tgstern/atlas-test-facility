import { useLocation, useNavigate } from 'react-router-dom'
import { accounts, people } from '../people.js'
import { track, useLab } from '../lab.jsx'
import { Icon, Stamp } from '../ui.jsx'
import { Logo } from '../shell.jsx'

const roleLabel = { admin: 'Director', manager: 'Supervisor', member: 'Staff', viewer: 'Observer' }

function Seal() {
  return (
    <svg className="seal" viewBox="0 0 160 160" width="120" height="120" role="img" aria-label="Atlas Dynamics seal">
      <defs>
        <path id="seal-arc" d="M80,80 m-57,0 a57,57 0 1,1 114,0 a57,57 0 1,1 -114,0" />
      </defs>
      <circle cx="80" cy="80" r="75" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="80" cy="80" r="42" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text className="seal-text">
        <textPath href="#seal-arc" textLength="352" lengthAdjust="spacing">ATLAS DYNAMICS ★ AUTHORIZED PERSONNEL ONLY ★</textPath>
      </text>
      <ellipse cx="68" cy="80" rx="12" ry="22" fill="none" stroke="currentColor" strokeWidth="4" />
      <ellipse cx="92" cy="80" rx="12" ry="22" fill="none" stroke="currentColor" strokeWidth="4" />
    </svg>
  )
}

export default function Gate() {
  const { signIn, persona } = useLab()
  const navigate = useNavigate()
  const location = useLocation()

  const enter = (p) => {
    signIn(p.id)
    track('badge_scan', { role: p.role })
    navigate(location.state?.from ?? '/', { replace: true })
  }

  return (
    <div className="gate" id="gate">
      <div className="gate-intro">
        <div className="brand large">
          <Logo size={44} />
          <span>Atlas<small>Test facility</small></span>
        </div>
        <div className="seal-row">
          <Seal />
          <Stamp>Restricted access</Stamp>
        </div>
        <h1>Welcome to the Atlas Test Facility.</h1>
        <p className="sub">
          Please present your identification to continue. This is a test environment, so every badge
          below is accepted.
        </p>
        <p className="wren"><span>WREN</span> Welcome back. Sublevel 6 does not appear on your badge. Please keep it that way.</p>
        {persona && (
          <button className="btn" id="btn-back-to-lab" onClick={() => navigate('/')}>
            Back to the facility as {persona.name}
          </button>
        )}
      </div>

      <div className="badges" id="badge-list">
        {people.map((p) => (
          <button key={p.id} className="badge-card" id={`badge-${p.id}`} onClick={() => enter(p)}>
            <div className="badge-top">
              <span>{p.anonymous ? 'Guest' : roleLabel[p.role]}</span>
              <span className="slot" />
            </div>
            <span className="avatar big">{p.initials}</span>
            <strong>{p.anonymous ? 'Continue as visitor' : p.name}</strong>
            <span className="badge-title">{p.title}</span>
            <span className="badge-meta">{accounts[p.account].name}</span>
            <span className="barcode" aria-hidden="true" />
            <code>{p.badge}</code>
            <span className="badge-go">
              {p.anonymous ? 'Observation only' : 'Present badge'} <Icon name="arrow" size={14} />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
