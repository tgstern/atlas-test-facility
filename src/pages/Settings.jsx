import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader, Switch, Tabs } from '../ui.jsx'
import { useLab } from '../lab.jsx'

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'notifications', label: 'Notifications' },
]

export default function Settings() {
  const { persona, state, setFlag, canEdit, toast } = useLab()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'profile'
  const [name, setName] = useState(persona.name)
  const [prefs, setPrefs] = useState({ runs: true, alerts: true, bookings: true, digest: false })

  const pref = (key, label) => <Switch id={`pref-${key}`} label={label} checked={prefs[key]} onChange={(v) => setPrefs({ ...prefs, [key]: v })} />

  return (
    <div className="stack narrow">
      <PageHeader eyebrow="Settings" title="Settings" sub="Personal preferences. Your preferences have been noted." />
      <Tabs tabs={tabs} value={tab} onChange={(t) => setParams({ tab: t })} id="settings-tabs" />

      <section className="card form" id={`settings-${tab}`}>
        {tab === 'profile' && (
          <>
            <label>Display name<input id="setting-name" className="input" value={name} onChange={(e) => setName(e.target.value)} disabled={persona.anonymous} /></label>
            <label>Email<input className="input" value={persona.email || 'Anonymous visitor'} readOnly /></label>
            <label>Badge<input className="input mono" value={persona.badge} readOnly /></label>
            <div className="btn-row"><button className="btn primary" id="btn-save-profile" disabled={!canEdit} onClick={() => toast('Profile saved')}>Save changes</button></div>
          </>
        )}

        {tab === 'preferences' && (
          <>
            <fieldset>
              <legend>Theme</legend>
              <label className="check"><input type="radio" name="theme" id="theme-light" checked={!state.flags.dark} onChange={() => setFlag('dark', false)} /> Test floor</label>
              <label className="check"><input type="radio" name="theme" id="theme-dark" checked={state.flags.dark} onChange={() => setFlag('dark', true)} /> Blackout</label>
            </fieldset>
            <fieldset>
              <legend>Density</legend>
              <label className="check"><input type="radio" name="density" id="density-comfortable" checked={!state.flags.compact} onChange={() => setFlag('compact', false)} /> Comfortable</label>
              <label className="check"><input type="radio" name="density" id="density-compact" checked={state.flags.compact} onChange={() => setFlag('compact', true)} /> Compact</label>
            </fieldset>
            <fieldset>
              <legend>Temperature units</legend>
              <label className="check"><input type="radio" name="units" id="units-c" checked={!state.flags.fahrenheit} onChange={() => setFlag('fahrenheit', false)} /> Celsius</label>
              <label className="check"><input type="radio" name="units" id="units-f" checked={state.flags.fahrenheit} onChange={() => setFlag('fahrenheit', true)} /> Fahrenheit</label>
            </fieldset>
          </>
        )}

        {tab === 'notifications' && (
          <>
            {pref('runs', 'Procedure run completed')}
            {pref('alerts', 'Containment and equipment alerts')}
            {pref('bookings', 'Booking approvals')}
            {pref('digest', 'Weekly summary email')}
            <div className="btn-row"><button className="btn primary" id="btn-save-notifications" onClick={() => toast('Preferences saved')}>Save preferences</button></div>
          </>
        )}
      </section>
    </div>
  )
}
