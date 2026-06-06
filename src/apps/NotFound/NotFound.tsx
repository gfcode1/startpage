import { useNavigate } from 'react-router-dom'
import './NotFound.css'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="gf-notfound">
      <div className="gf-notfound__inner">
        <h1 className="gf-notfound__code">404</h1>
        <p className="gf-notfound__desc">Page not found</p>
        <button className="gf-notfound__home" onClick={() => navigate('/')}>
          Back to home
        </button>
      </div>
    </div>
  )
}
