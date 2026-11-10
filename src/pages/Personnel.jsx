import { useState } from 'react'
import { Badge, Empty, Modal, PageHeader } from '../ui.jsx'
import { accessLog } from '../data.js'
import { accounts, people } from '../people.js'
import { track, useLab } from '../lab.jsx'

export default function Personnel() {
  const { canManage, isAdmin, account, signIn, toast } = useLab()
  const [roles, setRoles] = useState({})
  const [inviting, setInviting] = useState(false)
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [removing, setRemoving] = useState(null)

  if (!canManage) {
    return (
      <div className="card" id="access-denied">
        <Empty title="Supervisors only" stamp="Access denied">
          <p>Personnel records are limited to supervisors and directors. Your access level has been noted.</p>
          <div className="btn-row">
            <button className="btn" id="btn-request-access" onClick={() => toast('Request sent to your supervisor')}>Request access</button>
            <button className="btn primary" id="btn-become-supervisor" onClick={() => signIn('okoro')}>Switch to Dale Okoro</button>
          </div>
        </Empty>
      </div>
    )
  }

  const team = people.filter((p) => !p.anonymous)
  const departments = [...new Set(team.map((p) => accounts[p.account].name))]

  return (
    <div className="stack">
      <PageHeader eyebrow="Personnel" title="Personnel" sub={account.name}>
        <button className="btn primary" id="btn-invite" onClick={() => setInviting(true)}>Invite personnel</button>
      </PageHeader>

      <div className="two-col">
        <section className="card" id="roster-card">
          <h2>Roster</h2>
          <ul className="rows compact">
            {departments.map((d) => (
              <li key={d}><div className="grow"><strong>{d}</strong></div><small className="muted">{team.filter((p) => accounts[p.account].name === d).length} on file</small></li>
            ))}
          </ul>
        </section>
        <section className="card" id="audit-card">
          <h2>Access log</h2>
          <ul className="rows compact">
            {accessLog.map((l) => <li key={l.what}><div className="grow"><strong>{l.who}</strong> <small className="muted">{l.when}</small><small className="block">{l.what}</small></div></li>)}
          </ul>
        </section>
      </div>

      <section className="card table-card" id="team-card">
        <table id="team-table">
          <thead><tr><th>Name</th><th>Department</th><th>Role</th><th /></tr></thead>
          <tbody>
            {team.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong><small className="block muted">{p.title}</small></td>
                <td>{accounts[p.account].name}</td>
                <td>
                  <select id={`role-${p.id}`} className="input" disabled={!isAdmin || p.id === 'voss'} value={roles[p.id] ?? p.role} onChange={(e) => { const previous = roles[p.id] ?? p.role; setRoles({ ...roles, [p.id]: e.target.value }); toast(`${p.name} is now ${e.target.value}`); track('role_changed', { role: e.target.value }); track('Role changed', { role: e.target.value, previous_role: previous, member_department: accounts[p.account].id, department: account.id }) }}>
                    {['admin', 'manager', 'member', 'viewer'].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td className="right"><button className="btn small" id={`btn-remove-${p.id}`} disabled={p.id === 'voss'} onClick={() => setRemoving(p)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isAdmin && <p className="muted pad">Only directors can change roles.</p>}
      </section>

      {inviting && (
        <Modal title="Invite personnel" id="invite-modal" onClose={() => setInviting(false)} footer={
          <button className="btn primary" id="btn-send-invite" disabled={!email.includes('@')} onClick={() => { setInviting(false); toast(`Invite sent to ${email}`); track('personnel_invited', { role: inviteRole }); track('Personnel invited', { role: inviteRole, department: account.id }); setEmail('') }}>Send invite</button>
        }>
          <div className="form">
            <label>Email<input id="invite-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@atlas.test" /></label>
            <label>Role<select id="invite-role" className="input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>{['manager', 'member', 'viewer'].map((r) => <option key={r}>{r}</option>)}</select></label>
          </div>
        </Modal>
      )}

      {removing && (
        <Modal title={`Remove ${removing.name}?`} id="remove-modal" onClose={() => setRemoving(null)} footer={<><button className="btn" onClick={() => setRemoving(null)}>Keep</button><button className="btn danger" id="btn-confirm-remove" onClick={() => { toast(`${removing.name} removed (not really)`, 'warn'); setRemoving(null) }}>Remove</button></>}>
          <p>They lose access immediately. Their chambers and records stay in place. <Badge tone="warn">Audit logged</Badge></p>
        </Modal>
      )}
    </div>
  )
}
