import { useState } from 'react'
import { MOUSE_EFFECT_NAMES, THEME_NAMES } from '../labels'
import { updateSettings, useSettings, type Settings } from '../settings'

type NumberKey = { [K in keyof Settings]: Settings[K] extends number ? K : never }[keyof Settings]
type BooleanKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings]

const SLIDERS: { key: NumberKey; label: string; min: number; max: number; step: number; unit?: string }[] = [
  { key: 'glyphSize', label: 'Glyph size', min: 12, max: 36, step: 1, unit: ' px' },
  { key: 'speed', label: 'Fall speed', min: 1, max: 20, step: 1 },
  { key: 'sparkleShare', label: 'Sparkle amount', min: 0, max: 100, step: 5, unit: '%' },
  { key: 'fps', label: 'Frames per second', min: 15, max: 60, step: 15 },
]

const TOGGLES: { key: BooleanKey; label: string }[] = [
  { key: 'smoke', label: 'Smoke veils' },
  { key: 'sushi', label: 'Sushi recipes in the rain' },
]

function Select({ label, value, options, onChange }: { label: string; value: number; options: string[]; onChange: (v: number) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((name, i) => (
          <option key={name} value={i}>
            {name}
          </option>
        ))}
      </select>
    </label>
  )
}

/**
 * Only for the browser preview (?panel in the URL). In Lively the same settings
 * live in the wallpaper's Customise menu.
 */
export function SettingsPanel() {
  const settings = useSettings()
  const [open, setOpen] = useState(true)

  return (
    <aside className="panel">
      <button type="button" className="panel__toggle" onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide' : '✦ Settings'}
      </button>
      {open && (
        <div className="panel__body">
          <h2>Rikatrix</h2>
          <Select label="Theme" value={settings.theme} options={THEME_NAMES} onChange={(theme) => updateSettings({ theme })} />
          <Select
            label="Mouse effect"
            value={settings.mouseEffect}
            options={MOUSE_EFFECT_NAMES}
            onChange={(mouseEffect) => updateSettings({ mouseEffect })}
          />
          {SLIDERS.map((s) => (
            <label key={s.key} className="field">
              <span>
                {s.label}
                <b>
                  {settings[s.key]}
                  {s.unit ?? ''}
                </b>
              </span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={settings[s.key]}
                onChange={(e) => updateSettings({ [s.key]: Number(e.target.value) } as Partial<Settings>)}
              />
            </label>
          ))}
          {TOGGLES.map((t) => (
            <label key={t.key} className="check">
              <input
                type="checkbox"
                checked={settings[t.key]}
                onChange={(e) => updateSettings({ [t.key]: e.target.checked } as Partial<Settings>)}
              />
              {t.label}
            </label>
          ))}
          <p className="hint">Pick a mouse effect, move the mouse around, and click for a splash!</p>
        </div>
      )}
    </aside>
  )
}
