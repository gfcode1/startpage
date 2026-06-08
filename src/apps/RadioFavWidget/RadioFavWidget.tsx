import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GfWidgetAction } from '../../framework/components/WidgetAction'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { fetchStationsByUuid } from '../RadioBrowser/api'
import './RadioFavWidget.css'

export default function RadioFavWidget() {
  const navigate = useNavigate()
  const [favorites] = useAppStorage<string[]>('radiobrowser', 'favorites', [])
  const [station, setStation] = useState<{ stationuuid: string; name: string } | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (favorites.length === 0) return
    let cancelled = false
    fetchStationsByUuid(favorites).then(list => {
      if (!cancelled) { if (list.length > 0) setStation(list[0]); else setError(true) }
    }).catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [favorites])

  if (favorites.length === 0) {
    return (
      <div className="gf-widget-radiofav">
        <GfWidgetAction label="Add favorites in Radio Browser" onClick={() => navigate('/radiobrowser')} />
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
