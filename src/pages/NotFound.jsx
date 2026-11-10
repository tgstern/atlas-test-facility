import { Link } from 'react-router-dom'
import { Empty } from '../ui.jsx'

export default function NotFound() {
  return (
    <div className="card" id="not-found">
      <Empty title="Page not found" stamp="File not found">
        <p>That page does not exist, or it has been reclassified.</p>
        <Link className="btn primary" to="/">Back to overview</Link>
      </Empty>
    </div>
  )
}
