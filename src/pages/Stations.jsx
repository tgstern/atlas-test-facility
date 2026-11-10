import { useEffect, useState } from 'react'
import { Badge, Empty, Led, Modal, PageHeader } from '../ui.jsx'
import { busyHours, stations } from '../data.js'
import { track, useLab } from '../lab.jsx'

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
const statusMeta = {
  running: { label: 'Running', tone: 'ok' },
  idle: { label: 'Idle', tone: 'info' },
  maintenance: { label: 'Maintenance', tone: 'warn' },
}

function Reserve({ station, onClose }) {
  const { state, persona, addBooking, markStep, toast } = useLab()
  const [day, setDay] = useState('today')
  const bookedBy = (h) => (busyHours[station.id][day].includes(h) ? 'Booked' : state.bookings.some((b) => b.station === station.id && b.day === day && h >= b.hour && h < b.hour + b.duration) ? 'Booked (you or a colleague)' : undefined)
  const [hour, setHour] = useState(null)
  const [duration, setDuration] = useState(1)
  const [purpose, setPurpose] = useState('')

  const taken = (h) =>
    busyHours[station.id][day].includes(h) ||
    state.bookings.some((b) => b.station === station.id && b.day === day && h >= b.hour && h < b.hour + b.duration)
  const fits = (h) => Array.from({ length: duration }, (_, i) => h + i).every((x) => HOURS.includes(x) && !taken(x))
  const needsApproval = station.restricted && persona.role === 'member'

  const submit = () => {
    addBooking({ station: station.id, day, hour, duration, purpose: purpose.trim(), status: needsApproval ? 'pending' : 'confirmed' })
    markStep('reserve')
    track('station_reserved', { station: station.id, approval: needsApproval })
    toast(needsApproval ? 'Booking sent for supervisor approval' : 'Booking confirmed')
    onClose()
  }

  return (
    <Modal title={`Reserve ${station.name}`} id="reserve-modal" onClose={onClose} footer={
      <><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" id="btn-confirm-booking" disabled={hour === null || !purpose.trim()} onClick={submit}>{needsApproval ? 'Request booking' : 'Confirm booking'}</button></>
    }>
      <div className="form">
        <div className="btn-row">
          <div className="seg" id="booking-day" role="group" aria-label="Day">
            {['today', 'tomorrow'].map((d) => <button key={d} className={day === d ? 'on' : ''} onClick={() => { setDay(d); setHour(null) }}>{d === 'today' ? 'Today' : 'Tomorrow'}</button>)}
          </div>
          <select id="booking-duration" className="input" value={duration} onChange={(e) => { setDuration(Number(e.target.value)); setHour(null) }}>
            {[1, 2, 3].map((d) => <option key={d} value={d}>{d} hour{d > 1 ? 's' : ''}</option>)}
          </select>
        </div>
        <div className="slots" id="booking-slots">
          {HOURS.map((h) => (
            <button key={h} id={`slot-${h}`} className={`slot-btn${hour === h ? ' on' : ''}`} disabled={!fits(h)} title={bookedBy(h)} onClick={() => setHour(h)}>{h}:00</button>
          ))}
        </div>
        <label>Purpose<input id="booking-purpose" className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Recalibrate SU-09" /></label>
        {needsApproval && <p className="callout">This station needs supervisor approval. Your booking will be held as pending.</p>}
      </div>
    </Modal>
  )
}

export default function Stations() {
  const { myBookings, persona, canEdit, cancelBooking, toast } = useLab()
  const [progress, setProgress] = useState(Object.fromEntries(stations.map((s) => [s.id, s.progress])))
  const [reserving, setReserving] = useState(null)

  useEffect(() => {
    const t = setInterval(() => setProgress((p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v > 0 && v < 100 ? Math.min(100, v + 0.4) : v]))), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="stack">
      <PageHeader eyebrow="Stations" title="Stations" sub="Live status and bookings for shared facility systems." />

      <div className="card-grid" id="station-grid">
        {stations.map((s) => {
          const m = statusMeta[s.status]
          const cleared = persona.trained.includes(s.id)
          return (
            <article key={s.id} className="card instrument" id={`station-${s.id}`}>
              <div className="row-top">
                <strong>{s.name}</strong>
                <span className="status-pill"><Led tone={m.tone} />{m.label}</span>
              </div>
              <p className="muted">{s.location}</p>
              {s.status === 'running' && <div className="meter"><span style={{ width: `${progress[s.id]}%` }} /></div>}
              <p>{s.note}</p>
              <div className="row-top">
                {s.restricted ? <Badge tone="info">Clearance required</Badge> : <span />}
                <button
                  className="btn small primary"
                  id={`btn-reserve-${s.id}`}
                  disabled={!canEdit || s.status === 'maintenance' || (!cleared && canEdit)}
                  title={!canEdit ? 'Observation only' : s.status === 'maintenance' ? 'Under maintenance' : !cleared ? 'Clearance required' : undefined}
                  onClick={() => setReserving(s)}
                >
                  Reserve
                </button>
              </div>
              {canEdit && !cleared && s.status !== 'maintenance' && (
                <button className="link-btn small-text" id={`btn-clearance-${s.id}`} onClick={() => { toast('Clearance request sent to your supervisor'); track('clearance_requested', { station: s.id }) }}>
                  Request clearance
                </button>
              )}
            </article>
          )
        })}
      </div>

      <section className="card" id="my-bookings">
        <h2>Your bookings</h2>
        {myBookings.length === 0 ? (
          <Empty title="No bookings yet">Reserve a station above to see it here.</Empty>
        ) : (
          <ul className="rows">
            {myBookings.map((b) => (
              <li key={b.id}>
                <div className="grow">
                  <strong>{stations.find((s) => s.id === b.station).name}</strong>
                  <small className="block muted">{b.day === 'today' ? 'Today' : 'Tomorrow'}, {b.hour}:00 for {b.duration} h · {b.purpose}</small>
                </div>
                <Badge tone={b.status === 'pending' ? 'warn' : 'ok'}>{b.status}</Badge>
                <button className="btn small" id={`btn-cancel-${b.id}`} onClick={() => { cancelBooking(b.id); toast('Booking cancelled') }}>Cancel</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {reserving && <Reserve station={reserving} onClose={() => setReserving(null)} />}
    </div>
  )
}
