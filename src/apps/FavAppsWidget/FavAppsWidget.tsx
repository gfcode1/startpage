import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { GfIcon } from '../../framework/iconSystem'
import { GfWidgetAction } from '../../framework/components/WidgetAction'
import { useAppStorage } from '../../framework/persistence/useAppStorage'
import { getAppById, type AppDef } from '../../framework/appRegistry'
import './FavAppsWidget.css'

export default function FavAppsWidget() {
  const navigate = useNavigate()
  const [favoriteIds] = useAppStorage<string[]>('_framework', 'favoriteApps', [])
  const favApps = favoriteIds.map(id => getAppById(id)).filter(Boolean) as AppDef[]

  if (favApps.length === 0) {
    return (
      <div className="gf-widget-favapps">
        <GfWidgetAction label="Favorite apps in the Launcher" onClick={() => navigate('/')} />
      </div>
    )
  }

  const visible = favApps.slice(0, 6)
  const overflow = favApps.length - visible.length

  return (
    <div className="gf-widget-favapps">
      <div className="gf-widget-favapps__header">
        <GfIcon name="star" size={14} />
        <span className="gf-widget-favapps__label">Favorites</span>
      </div>
      <div className="gf-widget-favapps__grid">
        {visible.map(app => (
          <button
            key={app.id}
            className="gf-widget-favapps__item"
            onClick={() => navigate(app.path)}
            title={app.name}
            aria-label={`Open ${app.name}`}
          >
            <span className="gf-widget-favapps__icon" style={{ background: app.gradient }}>
              <Icon icon={app.icon} width={18} height={18} />
            </span>
            <span className="gf-widget-favapps__name">{app.name}</span>
          </button>
        ))}
        {overflow > 0 && (
          <span className="gf-widget-favapps__more">+{overflow}</span>
        )}
      </div>
    </div>
  )
}
