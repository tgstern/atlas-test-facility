import { useEffect, useMemo, useState } from 'react'
import { Badge, Empty, Icon, Modal, PageHeader, Tag, rng } from '../ui.jsx'
import { assetTypes, floors } from '../data.js'
import { track, useLab } from '../lab.jsx'

const ROWS = 'ABCDEFGH'.split('')
const COLS = Array.from({ length: 12 }, (_, i) => i + 1)

const surfaces = { panel: 'Panel', emitter: 'Emitter', hazard: 'Hazard', void: 'Void', flagged: 'Flagged' }

function baseCells(floorId) {
  const r = rng(Number(floorId.slice(3)) * 13 + 5)
  const cells = {}
  for (const row of ROWS) {
    for (const col of COLS) {
      let state = 'panel'
      if (col === 1) state = 'emitter'
      else if (col === 12) state = 'hazard'
      else if (r() < 0.06) state = 'void'
      cells[`${row}${col}`] = state
    }
  }
  return cells
}

function Grid() {
  const { state, canEdit, markStep, toast } = useLab()
  const v2 = state.flags.floorV2
  const [floorId, setFloorId] = useState(floors[0].id)
  const [overrides, setOverrides] = useState({})
  const [selected, setSelected] = useState(new Set())
  const [surface, setSurface] = useState('panel')

  const base = useMemo(() => baseCells(floorId), [floorId])
  const cells = { ...base, ...overrides[floorId] }
  const floor = floors.find((f) => f.id === floorId)

  useEffect(() => {
    if (selected.size > 0) markStep('panels')
  }, [selected, markStep])

  const toggle = (ids) =>
    setSelected((s) => {
      const next = new Set(s)
      const all = ids.every((i) => next.has(i))
      ids.forEach((i) => (all ? next.delete(i) : next.add(i)))
      return next
    })

  const apply = (value) => {
    const patch = Object.fromEntries([...selected].map((id) => [id, value]))
    setOverrides({ ...overrides, [floorId]: { ...overrides[floorId], ...patch } })
    toast(`${selected.size} panels set to ${surfaces[value].toLowerCase()}`)
    track('panels_updated', { count: selected.size, surface: value })
    setSelected(new Set())
  }

  const preset = (name) => {
    const patch = {}
    ROWS.forEach((row, ri) => COLS.forEach((col) => {
      const id = `${row}${col}`
      if (name === 'perimeter') patch[id] = ri === 0 || ri === 7 || col === 1 || col === 12 ? 'hazard' : 'panel'
      if (name === 'checker') patch[id] = (ri + col) % 2 ? 'panel' : 'emitter'
    }))
    setOverrides({ ...overrides, [floorId]: patch })
    track('floor_preset', { name })
  }

  return (
    <div className="stack" id="floor-grid">
      <div className="toolbar">
        <label className="inline">Chamber
          <select id="floor-select" className="input" value={floorId} onChange={(e) => { setFloorId(e.target.value); setSelected(new Set()) }}>
            {floors.map((f) => <option key={f.id} value={f.id}>{f.id} · {f.label}</option>)}
          </select>
        </label>
        {v2 && (
          <div className="btn-row" id="floor-presets">
            <button className="btn small" id="preset-perimeter" disabled={!canEdit} onClick={() => preset('perimeter')}>Hazard perimeter</button>
            <button className="btn small" id="preset-checker" disabled={!canEdit} onClick={() => preset('checker')}>Checkerboard</button>
            <button className="btn small" id="preset-reset" disabled={!canEdit} onClick={() => setOverrides({ ...overrides, [floorId]: {} })}>Reset layout</button>
          </div>
        )}
      </div>

      <div className="card plate-card">
        <div className={v2 ? 'plate v2' : 'plate'} id="panel-grid">
          <div className="plate-row">
            <span />
            {COLS.map((c) => (
              <button key={c} className="plate-head" id={`col-${c}`} onClick={() => toggle(ROWS.map((r) => `${r}${c}`))}>{c}</button>
            ))}
          </div>
          {ROWS.map((r) => (
            <div className="plate-row" key={r}>
              <button className="plate-head" id={`row-${r}`} onClick={() => toggle(COLS.map((c) => `${r}${c}`))}>{r}</button>
              {COLS.map((c) => {
                const id = `${r}${c}`
                return (
                  <button
                    key={id}
                    id={`panel-${id}`}
                    className={`well ${cells[id]}${selected.has(id) ? ' sel' : ''}`}
                    title={`${id}: ${surfaces[cells[id]]}`}
                    onClick={() => toggle([id])}
                  >
                    {v2 ? id : ''}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <div className="legend">
          {Object.entries(surfaces).map(([k, v]) => <span key={k}><span className={`well sm ${k}`} /> {v}</span>)}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="selection-bar" id="selection-bar">
          <strong>{selected.size} panels selected</strong>
          <select id="surface-select" className="input" value={surface} onChange={(e) => setSurface(e.target.value)}>
            {['panel', 'emitter', 'hazard', 'void'].map((s) => <option key={s} value={s}>{surfaces[s]}</option>)}
          </select>
          <button className="btn small" id="btn-apply-surface" disabled={!canEdit} onClick={() => apply(surface)}>Apply surface</button>
          <button className="btn small" id="btn-flag" disabled={!canEdit} onClick={() => apply('flagged')}><Icon name="flag" size={14} /> Flag</button>
          <button className="btn small" id="btn-clear-selection" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}
      <p className="muted">{floor.id} · {floor.label}. Click a panel to select it, or click a row or column header to select the whole line.</p>
    </div>
  )
}

const statusTone = { ok: 'ok', low: 'warn', condemned: 'bad', stable: 'ok', elevated: 'warn', dormant: 'info', quarantined: 'bad' }

function Registry() {
  const { allAssets, canEdit, toast } = useLab()
  const [type, setType] = useState('All')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState({ key: 'id', dir: 1 })
  const [openId, setOpenId] = useState(null)
  const [requested, setRequested] = useState([])

  const rows = allAssets
    .filter((a) => (type === 'All' || a.type === type) && `${a.id} ${a.name}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      const x = a[sort.key]
      const y = b[sort.key]
      return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir
    })
  const open = allAssets.find((a) => a.id === openId)
  const th = (key, label) => (
    <th className="sortable" id={`sort-${key}`} onClick={() => setSort({ key, dir: sort.key === key ? -sort.dir : 1 })}>
      {label} {sort.key === key && (sort.dir === 1 ? '▲' : '▼')}
    </th>
  )

  return (
    <div className="stack" id="registry">
      <div className="toolbar">
        <input id="asset-search" className="input" placeholder="Search assets" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips" id="asset-types" role="group" aria-label="Type">
          {['All', ...assetTypes].map((t) => <button key={t} className={type === t ? 'chip on' : 'chip'} onClick={() => setType(t)}>{t}</button>)}
        </div>
      </div>
      <div className="card table-card">
        {rows.length === 0 ? (
          <Empty title="No assets match">Adjust the search or type filter.</Empty>
        ) : (
          <table id="registry-table">
            <thead><tr>{th('id', 'ID')}{th('name', 'Name')}{th('type', 'Type')}{th('chamber', 'Chamber')}{th('location', 'Location')}{th('qty', 'Qty')}<th>Status</th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="clickable" onClick={() => setOpenId(a.id)}>
                  <td><Tag>{a.id}</Tag></td><td>{a.name}</td><td>{a.type}</td><td>{a.chamber}</td><td className="muted">{a.location}</td><td>{a.qty}</td>
                  <td><Badge tone={statusTone[a.status]}>{a.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {open && (
        <Modal drawer id="asset-drawer" title={open.name} onClose={() => setOpenId(null)} footer={
          <button className="btn primary" id="btn-request-transfer" disabled={!canEdit || requested.includes(open.id)} title={canEdit ? undefined : 'Observation only'} onClick={() => { setRequested([...requested, open.id]); toast(`Transfer requested for ${open.id}`); track('transfer_requested', { id: open.id }) }}>
            {requested.includes(open.id) ? 'Requested' : 'Request transfer'}
          </button>
        }>
          <dl className="facts">
            <dt>ID</dt><dd><Tag>{open.id}</Tag></dd>
            <dt>Type</dt><dd>{open.type}</dd>
            <dt>Chamber</dt><dd>{open.chamber}</dd>
            <dt>Location</dt><dd>{open.location}</dd>
            <dt>Quantity</dt><dd>{open.qty}</dd>
            <dt>Status</dt><dd><Badge tone={statusTone[open.status]}>{open.status}</Badge></dd>
          </dl>
        </Modal>
      )}
    </div>
  )
}

export default function Floor() {
  const [view, setView] = useState('grid')
  return (
    <div className="stack">
      <PageHeader eyebrow="Floor" title={view === 'grid' ? 'Floor grid' : 'Asset registry'} sub={view === 'grid' ? 'Lay out panels and flag anything that looks wrong.' : 'Every cube, sentry, and canister on record.'}>
        <div className="seg" id="floor-view" role="group" aria-label="View">
          <button id="view-grid" className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}>Floor grid</button>
          <button id="view-registry" className={view === 'registry' ? 'on' : ''} onClick={() => setView('registry')}>Asset registry</button>
        </div>
      </PageHeader>
      {view === 'grid' ? <Grid /> : <Registry />}
    </div>
  )
}
