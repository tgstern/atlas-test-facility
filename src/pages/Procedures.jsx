import { Link } from 'react-router-dom'
import { Badge, Empty, PageHeader } from '../ui.jsx'
import { procedures } from '../data.js'
import { useLab } from '../lab.jsx'

export default function Procedures() {
  const { state, canEdit } = useLab()
  return (
    <div className="stack">
      <PageHeader eyebrow="Procedures" title="Procedures" sub="Step-by-step operating procedures with timers and sign-off." />

      <div className="card-grid" id="procedure-grid">
        {procedures.map((p) => (
          <article key={p.id} className="card protocol" id={`procedure-${p.id}`}>
            <div className="row-top">
              <h3>{p.name}</h3>
              <Badge tone="info">{p.versions[0]}</Badge>
            </div>
            <p className="muted">{p.summary}</p>
            <p className="muted small-text">{p.steps.length} steps · {p.duration} · {p.owner}</p>
            {canEdit ? (
              <Link className="btn primary small" id={`btn-run-${p.id}`} to={`/procedures/${p.id}`}>Open procedure</Link>
            ) : (
              <Link className="btn small" id={`btn-view-${p.id}`} to={`/procedures/${p.id}`}>View procedure</Link>
            )}
          </article>
        ))}
      </div>

      <section className="card" id="run-history">
        <h2>Run history</h2>
        {state.runs.length === 0 ? (
          <Empty title="No runs logged">Finish a procedure run and it appears here.</Empty>
        ) : (
          <ul className="rows">
            {state.runs.map((r) => (
              <li key={r.id}>
                <div className="grow">
                  <strong>{r.procedure}</strong> <small className="muted">{r.version}</small>
                  <small className="block muted">{r.by} · {r.completed} of {r.total} steps · {r.notes || 'no notes'}</small>
                </div>
                <Badge tone={r.outcome === 'Passed' ? 'ok' : 'warn'}>{r.outcome}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
