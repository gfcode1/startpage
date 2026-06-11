import { useState, useEffect } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { useWidgetOptions } from '../../framework/WidgetOptionsContext'
import './WorldClockWidget.css'

const TIMEZONES: { label: string; value: string }[] = [
  { label: 'New York', value: 'America/New_York' },
  { label: 'London', value: 'Europe/London' },
  { label: 'Paris', value: 'Europe/Paris' },
  { label: 'Dubai', value: 'Asia/Dubai' },
  { label: 'Tokyo', value: 'Asia/Tokyo' },
  { label: 'Sydney', value: 'Australia/Sydney' },
  { label: 'Los Angeles', value: 'America/Los_Angeles' },
  { label: 'São Paulo', value: 'America/Sao_Paulo' },
  { label: 'Berlin', value: 'Europe/Berlin' },
  { label: 'Singapore', value: 'Asia/Singapore' },
]

function formatInTz(tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: tz,
    }).format(new Date())
  } catch {
    return '--:--:--'
  }
}

export default function WorldClockWidget() {
  const { options: opts } = useWidgetOptions('worldclock')
  const tz1 = (opts?.zone1 as string) || 'America/New_York'
  const tz2 = (opts?.zone2 as string) || 'Asia/Tokyo'
  const label1 = TIMEZONES.find(t => t.value === tz1)?.label || tz1.split('/').pop() || tz1
  const label2 = TIMEZONES.find(t => t.value === tz2)?.label || tz2.split('/').pop() || tz2

  const [, update] = useState(0)
  useEffect(() => {
    const t = setInterval(() => update(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="gf-widget-worldclock">
      <div className="gf-widget-worldclock__header">
        <GfIcon name="globe" size={14} />
        <span className="gf-widget-worldclock__label">World Clock</span>
      </div>
      <div className="gf-widget-worldclock__rows">
        <div className="gf-widget-worldclock__row">
          <span className="gf-widget-worldclock__city">{label1}</span>
          <span className="gf-widget-worldclock__time">{formatInTz(tz1)}</span>
        </div>
        <div className="gf-widget-worldclock__row">
          <span className="gf-widget-worldclock__city">{label2}</span>
          <span className="gf-widget-worldclock__time">{formatInTz(tz2)}</span>
        </div>
      </div>
    </div>
  )
}
