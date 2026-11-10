import { useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useLab } from './lab.jsx'
import { Console, Header, Palette, Rail, Toasts } from './shell.jsx'
import Chambers from './pages/Chambers.jsx'
import Floor from './pages/Floor.jsx'
import Gate from './pages/Gate.jsx'
import NotFound from './pages/NotFound.jsx'
import Overview from './pages/Overview.jsx'
import Personnel from './pages/Personnel.jsx'
import ProcedureRun from './pages/ProcedureRun.jsx'
import Procedures from './pages/Procedures.jsx'
import Settings from './pages/Settings.jsx'
import Stations from './pages/Stations.jsx'

function Layout() {
  const { persona } = useLab()
  const location = useLocation()
  const [palette, setPalette] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!persona) return <Navigate to="/gate" state={{ from: location.pathname + location.search }} replace />

  return (
    <div className="shell">
      <Rail />
      <div className="main-col">
        <Header onPalette={() => setPalette(true)} />
        <main id="main">
          <Outlet />
        </main>
      </div>
      {palette && <Palette onClose={() => setPalette(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/gate" element={<Gate />} />
        <Route element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="chambers" element={<Chambers />} />
          <Route path="chambers/:id" element={<Chambers />} />
          <Route path="floor" element={<Floor />} />
          <Route path="stations" element={<Stations />} />
          <Route path="procedures" element={<Procedures />} />
          <Route path="procedures/:id" element={<ProcedureRun />} />
          <Route path="personnel" element={<Personnel />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Console />
      <Toasts />
    </>
  )
}
