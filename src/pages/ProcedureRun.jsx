import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Icon, Modal, PageHeader } from '../ui.jsx'
import { procedures } from '../data.js'
import { track, useLab } from '../lab.jsx'
import NotFound from './NotFound.jsx'

export default function ProcedureRun() {
  const { id } = useParams()
  const procedure = procedures.find((p) => p.id === id)
  const { canEdit, persona, addRun, markStep, toast } = useLab()
  const navigate = useNavigate()
  const [version, setVersion] = useState(procedure?.versions[0])
  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [done, setDone] = useState([])
  const [checked, setChecked] = useState({})
  const [timer, setTimer] = useState(null)
  const [skipping, setSkipping] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [notes, setNotes] = useState('')
  const [outcome, setOutcome] = useState('Passed')

  const step = procedure?.steps[current]

  useEffect(() => {
    if (timer?.running && timer.left > 0) {
      const t = setTimeout(() => setTimer((x) => ({ ...x, left: x.left - 1 })), 1000)
      return () => clearTimeout(t)
    }
  }, [timer])

  useEffect(() => {
    setTimer(step?.timer ? { left: step.timer, running: false } : null)
  }, [current, step])

  if (!procedure) return <NotFound />

  const isOld = version !== procedure.versions[0]
  const last = current === procedure.steps.length - 1
  const blocked = (step.check && !checked[current]) || (timer && timer.left > 0)

  const advance = (skipped = false) => {
    if (!skipped) setDone([...done, current])
    setSkipping(false)
    if (last) setFinishing(true)
    else setCurrent(current + 1)
  }

  const finish = () => {
    addRun({ procedure: procedure.name, version, by: persona.name, completed: done.length, total: procedure.steps.length, notes: notes.trim(), outcome })
    track('procedure_run_finished', { procedure: procedure.id, outcome })
    toast('Run logged')
    navigate('/procedures')
  }

  return (
    <div className="stack" id="procedure-run">
      <p className="crumbs"><Link to="/procedures">Procedures</Link> / {procedure.name}</p>
      <PageHeader eyebrow={`${procedure.duration} · ${procedure.owner}`} title={procedure.name} sub={procedure.summary}>
        <label className="inline">Version
          <select id="version-select" className="input" value={version} onChange={(e) => setVersion(e.target.value)} disabled={started}>
            {procedure.versions.map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
      </PageHeader>

      {isOld && <div className="callout" id="old-version-banner">You are viewing {version}. The current version is {procedure.versions[0]}.</div>}

      <div className="run-layout">
        <ol className="step-list card" id="step-list">
          {procedure.steps.map((s, i) => (
            <li key={s.title} className={`${i === current ? 'on' : ''}${done.includes(i) ? ' done' : ''}`}>
              <span className="tick">{done.includes(i) ? <Icon name="check" size={13} /> : i + 1}</span>
              {s.title}
            </li>
          ))}
        </ol>

        <section className="card step-card" id="step-card">
          {!started ? (
            <>
              <h2>Ready to begin?</h2>
              <p className="muted">{procedure.steps.length} steps. Your progress is logged when you finish.</p>
              <button
                className="btn primary"
                id="btn-start-run"
                disabled={!canEdit}
                title={canEdit ? undefined : 'Observation only'}
                onClick={() => { setStarted(true); markStep('procedure'); track('procedure_run_started', { procedure: procedure.id }) }}
              >
                <Icon name="play" size={14} /> Begin procedure
              </button>
            </>
          ) : (
            <>
              <p className="eyebrow">Step {current + 1} of {procedure.steps.length}</p>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
              {step.check && (
                <label className="check"><input id="step-check" type="checkbox" checked={!!checked[current]} onChange={(e) => setChecked({ ...checked, [current]: e.target.checked })} /> {step.check}</label>
              )}
              {timer && (
                <div className="timer" id="step-timer">
                  <strong>{String(Math.floor(timer.left / 60)).padStart(2, '0')}:{String(timer.left % 60).padStart(2, '0')}</strong>
                  <button className="btn small" id="btn-timer" disabled={timer.left === 0} onClick={() => setTimer({ ...timer, running: !timer.running })}>{timer.running ? 'Pause' : timer.left === step.timer ? 'Start timer' : 'Resume'}</button>
                  <button className="link-btn small-text" id="btn-skip-wait" disabled={timer.left === 0} onClick={() => setTimer({ left: 0, running: false })}>Skip wait</button>
                  <small className="muted">Demo timer, shortened</small>
                </div>
              )}
              <div className="btn-row between">
                <button className="btn" id="btn-prev-step" disabled={current === 0} onClick={() => setCurrent(current - 1)}>Back</button>
                <div className="btn-row">
                  <button className="btn" id="btn-skip-step" onClick={() => setSkipping(true)}>Skip</button>
                  <button className="btn primary" id="btn-complete-step" disabled={blocked} onClick={() => advance()}>{last ? 'Finish run' : 'Complete step'}</button>
                </div>
              </div>
              {blocked && <small className="muted">{step.check && !checked[current] ? 'Confirm the checkbox to continue.' : 'Wait for the timer to finish.'}</small>}
            </>
          )}
        </section>
      </div>

      {skipping && (
        <Modal title="Skip this step?" id="skip-modal" onClose={() => setSkipping(false)} footer={<><button className="btn" onClick={() => setSkipping(false)}>Go back</button><button className="btn danger" id="btn-confirm-skip" onClick={() => advance(true)}>Skip step</button></>}>
          <p>Skipped steps are recorded in the run log. <Badge tone="warn">Deviation</Badge></p>
        </Modal>
      )}

      {finishing && (
        <Modal title="Finish run" id="finish-modal" onClose={() => setFinishing(false)} footer={<><button className="btn" onClick={() => setFinishing(false)}>Back</button><button className="btn primary" id="btn-log-run" onClick={finish}>Log run</button></>}>
          <div className="form">
            <label>Outcome<select id="run-outcome" className="input" value={outcome} onChange={(e) => setOutcome(e.target.value)}><option>Passed</option><option>Passed with deviations</option><option>Failed</option></select></label>
            <label>Notes<textarea id="run-notes" className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
          </div>
        </Modal>
      )}
    </div>
  )
}
