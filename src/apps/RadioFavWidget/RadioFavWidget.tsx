import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GfIcon } from '../../framework/iconSystem'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import './RadioFavWidget.css'

interface Station { stationuuid: string; name: string }
const API = 'https://de1.api.radio-browser.info'

async function fetchStations(uuids: string[]): Promise<Station[]> {
  if (uuids.length === 0) return []
  const res = await fetch(`${API}/json/stations/byuuid?uuids=${uuids.join(',')}`)
  if (!res.ok) return []
  return res.json()
}

export default function RadioFavWidget() {
  const navigate = useNavigate()
  const [favorites] = useAppStorage<string[]>('radiobrowser', 'favorites', [])
  const [station, setStation] = useState<Station | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (favorites.length === 0) return
    let cancelled = false
    fetchStations(favorites).then(list => {
      if (!cancelled) { if (list.length > 0) setStation(list[0]); else setError(true) }
    }).catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [favorites])

  if (favorites.length === 0) {
    return (
      <div className="gf-widget-radiofav">
        <button className="gf-widget-radiofav__action" onClick={() => navigate('/radiobrowser')}>
          Add favorites in Radio Browser
          <GfIcon name="chevron-right" size={12} />
        </button>
      </div>
    )
  }

  if (!station) {
    if (error) return <div className="gf-widget-radiofav"><span className="gf-widget-radiofav__empty">Station info unavailable</span></div>
    return <div className="gf-widget-radiofav gf-widget-radiofav--loading">—</div>
  }

  return (
    <div className="gf-widget-radiofav" role="button" tabIndex={0}
      onClick={() => navigate('/radiobrowser')}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/radiobrowser') } }}>
      <span className="gf-widget-radiofav__label">Favorite Station</span>
      <span className="gf-widget-radiofav__name">{station.name}</span>
    </div>
  )
}
