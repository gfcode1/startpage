import { GfBottomSheet } from '../../framework/components/BottomSheet'
import { GfSlider } from '../../framework/components/Slider'
import type { PomodoroSettings } from './types'

interface SettingsProps {
  open: boolean
  onClose: () => void
  settings: PomodoroSettings
  onUpdate: (settings: PomodoroSettings) => void
}

export function Settings({ open, onClose, settings, onUpdate }: SettingsProps) {
  return (
    <GfBottomSheet open={open} onClose={onClose} title="Timer Settings">
      <div className="gf-pomodoro-settings">
        <div className="gf-pomodoro-settings__group">
          <label className="gf-pomodoro-settings__label">
            Focus Duration: <strong>{settings.workDuration}m</strong>
          </label>
          <GfSlider
            value={settings.workDuration}
            min={5}
            max={60}
            step={5}
            onChange={(v) => onUpdate({ ...settings, workDuration: v })}
            aria-label="Focus duration"
          />
        </div>

        <div className="gf-pomodoro-settings__group">
          <label className="gf-pomodoro-settings__label">
            Break Duration: <strong>{settings.breakDuration}m</strong>
          </label>
          <GfSlider
            value={settings.breakDuration}
            min={1}
            max={30}
            step={1}
            onChange={(v) => onUpdate({ ...settings, breakDuration: v })}
            aria-label="Break duration"
          />
        </div>

        <div className="gf-pomodoro-settings__group">
          <label className="gf-pomodoro-settings__label">
            Long Break Duration: <strong>{settings.longBreakDuration}m</strong>
          </label>
          <GfSlider
            value={settings.longBreakDuration}
            min={5}
            max={60}
            step={5}
            onChange={(v) => onUpdate({ ...settings, longBreakDuration: v })}
            aria-label="Long break duration"
          />
        </div>

        <div className="gf-pomodoro-settings__group">
          <label className="gf-pomodoro-settings__label">
            Sessions before long break: <strong>{settings.sessionsBeforeLongBreak}</strong>
          </label>
          <GfSlider
            value={settings.sessionsBeforeLongBreak}
            min={2}
            max={8}
            step={1}
            onChange={(v) => onUpdate({ ...settings, sessionsBeforeLongBreak: v })}
            aria-label="Sessions before long break"
          />
        </div>
      </div>
    </GfBottomSheet>
  )
}
