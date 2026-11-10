import { Link } from 'react-router-dom'
import { alerts, busyHours, notices, stations } from '../data.js'
import { useLab } from '../lab.jsx'
import { Empty, Icon, Led, PageHeader, StatusBadge } from '../ui.jsx'

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8)

const steps = [
  { key: 'chamber', label: 'Open a chamber record', to: '/chambers/ch-04' },
  { key: 'panels', label: 'Select panels on the floor grid', to: '/floor' },
  { key: 'reserve', label: 'Reserve a station', to: '/stations' },
  { key: 'procedure', label: 'Start a procedure', to: '/procedures' },
]

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Overview() {
  const { persona, state, allChambers, allAssets, isNewUser, onboarding, onboardingDismissed, myBookings, ackAlert, dismissOnboarding, toast } = useLab()
  const first = persona.anonymous ? 'visitor' : persona.name.replace(/^(Dr\.|Inspector)\s/, '').split(' ')[0]
  const live = allChambers.filter((c) => c.status === 'operational')
  const open = alerts.filter((a) => !state.alertsAcked.includes(a.id))
  const done = steps.filter((s) => onboarding[s.key]).length
  const showOnboarding = isNewUser && !onboardingDismissed
  const now = new Date()
  const nowPct = Math.min(100, Math.max(0, ((now.getHours() + now.getMinutes() / 60 - 8) / 10) * 100))
  const mine = myBookings.filter((b) => b.day === 'today')
  const recent = [...allChambers].sort((a, b) => b.started.localeCompare(a.started)).slice(0, 4)

  return (
    <div className="stack">
      <PageHeader
        eyebrow={now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        title={`${greeting()}, ${first}.`}
        sub={isNewUser ? 'Welcome to orientation. Complete the checklist below at your own pace. Pace is monitored.' : `${live.length} chambers operational, ${open.length} alerts pending.`}
      />

      {showOnboarding && (
        <section className="card onboarding" id="onboarding">
          <div className="card-head">
            <h2>Orientation checklist</h2>
            <button className="link-btn" id="btn-dismiss-onboarding" onClick={dismissOnboarding}>Dismiss</button>
          </div>
          <div className="meter"><span style={{ width: `${(done / steps.length) * 100}%` }} /></div>
          <p className="muted">{done} of {steps.length} complete</p>
          <ul className="check-list">
            {steps.map((s) => (
              <li key={s.key} className={onboarding[s.key] ? 'done' : ''}>
                <span className="tick">{onboarding[s.key] && <Icon name="check" size={14} />}</span>
                <Link to={s.to}>{s.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="tiles">
        <Link to="/chambers" className="tile card link" id="tile-chambers"><span className="num">{live.length}</span><span>Operational chambers</span></Link>
        <Link to="/floor" className="tile card link" id="tile-assets"><span className="num">{allAssets.length}</span><span>Assets on record</span></Link>
        <Link to="/stations" className="tile card link" id="tile-stations"><span className="num">{stations.filter((s) => s.status === 'running').length}</span><span>Stations running</span></Link>
        <Link to="/procedures" className="tile card link" id="tile-runs"><span className="num">{state.runs.length}</span><span>Procedure runs logged</span></Link>
      </section>

      <section className="card" id="timeline">
        <div className="card-head">
          <h2>Station timeline, today</h2>
          <Link to="/stations" className="link">Reserve</Link>
        </div>
        <div className="gantt">
          <div className="gantt-head">
            <span />
            {HOURS.map((h) => <span key={h}>{h}:00</span>)}
          </div>
          {stations.map((s) => (
            <div key={s.id} className="gantt-row">
              <span className="gantt-label">{s.name}</span>
              {HOURS.map((h) => {
                const mineHere = mine.some((b) => b.station === s.id && h >= b.hour && h < b.hour + b.duration)
                const busy = busyHours[s.id].today.includes(h)
                return <span key={h} className={`cell${mineHere ? ' mine' : busy ? ' busy' : ''}`} title={mineHere ? 'Your booking' : busy ? 'Booked' : 'Free'} />
              })}
            </div>
          ))}
          <div className="now-line" style={{ left: `calc(150px + (100% - 150px) * ${nowPct / 100})` }} />
        </div>
        <div className="legend"><span className="cell busy" /> Booked <span className="cell mine" /> Yours <span className="cell" /> Free</div>
      </section>

      <div className="two-col">
        <section className="card" id="needs-attention">
          <h2>Needs attention</h2>
          {open.length === 0 ? (
            <Empty title="All clear">No open alerts. WREN is pleased.</Empty>
          ) : (
            <ul className="rows">
              {open.map((a) => (
                <li key={a.id}>
                  <Led tone={a.level === 'critical' ? 'bad' : a.level === 'warn' ? 'warn' : 'info'} />
                  <div className="grow">
                    <strong>{a.title}</strong>
                    <small className="block muted">{a.detail}</small>
                  </div>
                  <button className="btn small" id={`btn-ack-${a.id}`} disabled={persona.role === 'viewer'} onClick={() => { ackAlert(a.id); toast('Alert acknowledged') }}>Acknowledge</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" id="recent-chambers">
          <h2>Recently commissioned</h2>
          <ul className="rows">
            {recent.map((c) => (
              <li key={c.id}>
                <code className="tag">{c.code}</code>
                <Link className="grow" to={`/chambers/${c.id}`}>{c.title}</Link>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section id="notices">
        <h2>Posted notices</h2>
        <div className="memos">
          {notices.map((n) => (
            <article key={n.id} className="memo" id={`notice-${n.id}`}>
              <p className="ref">{n.ref}</p>
              <h3>{n.title}</h3>
              <p>{n.body}</p>
              <footer>{n.from} · {n.date}</footer>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
