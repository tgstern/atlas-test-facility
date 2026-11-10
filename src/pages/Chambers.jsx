import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Empty, Icon, Stamp, StatusBadge, Tabs, Tag, statusMeta } from '../ui.jsx'
import { track, useLab } from '../lab.jsx'

const tabs = [
  { id: 'summary', label: 'Summary' },
  { id: 'assets', label: 'Assets' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'transcript', label: 'Transcript' },
]

function Detail({ chamber }) {
  const { state, allAssets, canEdit, canManage, persona, togglePin, setStatus, addComment, markStep, toast } = useLab()
  const [params, setParams] = useSearchParams()
  const [draft, setDraft] = useState('')
  const tab = params.get('tab') ?? 'summary'
  const pinned = state.pinned.includes(chamber.id)
  const linked = allAssets.filter((a) => a.chamber === chamber.code)
  const comments = [...chamber.comments, ...(state.comments[chamber.id] ?? [])]

  useEffect(() => markStep('chamber'), [chamber.id, markStep])

  return (
    <article className="detail card" id="chamber-detail">
      <div className="detail-head">
        <div>
          <div className="title-row">
            <Tag>{chamber.code}</Tag>
            <Stamp tone={statusMeta[chamber.status].tone === 'neutral' ? 'info' : statusMeta[chamber.status].tone}>{statusMeta[chamber.status].label}</Stamp>
          </div>
          <h2>{chamber.title}</h2>
          <p className="muted">Lead: {chamber.lead} · commissioned {chamber.started}</p>
        </div>
        <div className="btn-row">
          <button className={pinned ? 'btn on' : 'btn'} id="btn-pin" onClick={() => { togglePin(chamber.id); toast(pinned ? 'Unpinned' : 'Pinned to your list') }}>
            <Icon name="star" size={16} /> {pinned ? 'Pinned' : 'Pin'}
          </button>
          {chamber.status === 'operational' && (
            <button className="btn" id="btn-request-review" disabled={!canEdit} onClick={() => { setStatus(chamber.id, 'review'); toast('Review requested'); track('review_requested', { id: chamber.id }) }}>
              Request review
            </button>
          )}
          {chamber.status === 'review' && canManage && (
            <button className="btn primary" id="btn-approve-review" onClick={() => { setStatus(chamber.id, 'certified'); toast('Chamber approved and certified'); track('review_approved', { id: chamber.id }) }}>
              Approve
            </button>
          )}
        </div>
      </div>

      <div className="detail-meta">
        <label>Status
          <select id="chamber-status" className="input" value={chamber.status} disabled={!canManage} title={canManage ? undefined : 'Supervisors can change status'} onChange={(e) => setStatus(chamber.id, e.target.value)}>
            {Object.entries(statusMeta).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <div>
          <span className="label">Certification progress</span>
          <div className="meter"><span style={{ width: `${chamber.progress}%` }} /></div>
        </div>
      </div>

      <Tabs tabs={tabs} value={tab} onChange={(t) => setParams({ tab: t })} id="chamber-tabs" />

      <div className="tab-panel" id={`panel-${tab}`}>
        {tab === 'summary' && (
          <>
            <p>{chamber.summary}</p>
            <dl className="facts">
              <dt>Assets assigned</dt><dd>{linked.length}</dd>
              <dt>Milestones</dt><dd>{chamber.milestones.filter((m) => m.done).length} of {chamber.milestones.length} done</dd>
              <dt>Transcript</dt><dd>{comments.length} entries</dd>
            </dl>
          </>
        )}

        {tab === 'assets' && (
          linked.length === 0 ? (
            <Empty title="No assets assigned">Register an asset from the New menu and assign it to this chamber.</Empty>
          ) : (
            <table id="chamber-assets">
              <thead><tr><th>ID</th><th>Name</th><th>Location</th><th>Qty</th></tr></thead>
              <tbody>
                {linked.map((a) => <tr key={a.id}><td><Tag>{a.id}</Tag></td><td>{a.name}</td><td>{a.location}</td><td>{a.qty}</td></tr>)}
              </tbody>
            </table>
          )
        )}

        {tab === 'timeline' && (
          <ol className="timeline" id="chamber-timeline">
            {chamber.milestones.map((m) => (
              <li key={m.label} className={m.done ? 'done' : ''}>
                <strong>{m.label}</strong>
                <small className="muted">{m.date}</small>
              </li>
            ))}
          </ol>
        )}

        {tab === 'transcript' && (
          <>
            {comments.length === 0 && <p className="muted">Nothing on record yet.</p>}
            <ul className="rows" id="comment-list">
              {comments.map((c, i) => (
                <li key={i} className="top">
                  <span className="avatar">{c.by.split(' ').map((w) => w[0]).slice(-2).join('')}</span>
                  <div className="grow"><strong>{c.by}</strong> <small className="muted">{c.when}</small><p>{c.text}</p></div>
                </li>
              ))}
            </ul>
            <form
              className="comment-form"
              onSubmit={(e) => {
                e.preventDefault()
                if (!draft.trim()) return
                addComment(chamber.id, { by: persona.name, when: 'Just now', text: draft.trim() })
                setDraft('')
                track('comment_added')
              }}
            >
              <textarea id="comment-input" className="input" rows={3} placeholder={canEdit ? 'Add an entry to the transcript' : 'Observation only'} disabled={!canEdit} value={draft} onChange={(e) => setDraft(e.target.value)} />
              <button className="btn primary" id="btn-add-comment" disabled={!canEdit || !draft.trim()}>Add entry</button>
            </form>
          </>
        )}
      </div>
    </article>
  )
}

export default function Chambers() {
  const { allChambers, state } = useLab()
  const { id } = useParams()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatusFilter] = useState('all')
  const [pinnedOnly, setPinnedOnly] = useState(false)

  const list = allChambers.filter(
    (c) =>
      (status === 'all' || c.status === status) &&
      (!pinnedOnly || state.pinned.includes(c.id)) &&
      `${c.code} ${c.title}`.toLowerCase().includes(q.toLowerCase()),
  )
  const selected = allChambers.find((c) => c.id === id)

  return (
    <div className={id ? 'split has-detail' : 'split'}>
      <section className="list-pane card" id="chamber-list">
        <div className="list-tools">
          <input id="chamber-search" className="input" placeholder="Search chambers" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="chips" id="chamber-filters" role="group" aria-label="Status">
            {['all', ...Object.keys(statusMeta)].map((s) => (
              <button key={s} className={status === s ? 'chip on' : 'chip'} onClick={() => setStatusFilter(s)}>
                {s === 'all' ? 'All' : statusMeta[s].label}
              </button>
            ))}
            <button id="filter-pinned" className={pinnedOnly ? 'chip on' : 'chip'} onClick={() => setPinnedOnly(!pinnedOnly)}>Pinned</button>
          </div>
        </div>
        <ul className="study-rows">
          {list.map((c) => (
            <li key={c.id}>
              <Link to={`/chambers/${c.id}`} id={`chamber-${c.id}`} className={c.id === id ? 'on' : ''}>
                <span className="row-top"><Tag>{c.code}</Tag><span className="row-lead muted">{c.lead}</span><StatusBadge status={c.status} /></span>
                <strong>{c.title}</strong>
              </Link>
            </li>
          ))}
          {list.length === 0 && <li className="pad"><Empty title="No matching chambers">Try a different filter.</Empty></li>}
        </ul>
      </section>

      <div className="detail-pane">
        {id && <button className="link-btn back-link" onClick={() => navigate('/chambers')}>← All chambers</button>}
        {selected ? (
          <Detail key={selected.id} chamber={selected} />
        ) : (
          <div className="card"><Empty title={id ? 'Chamber not found' : 'Select a chamber'}>{id ? 'That chamber does not exist, or has been sealed.' : 'Pick one from the list to see its assets, timeline, and transcript.'}</Empty></div>
        )}
      </div>
    </div>
  )
}
