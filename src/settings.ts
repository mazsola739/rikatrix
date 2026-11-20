import { useSyncExternalStore } from 'react'

/** Wallpaper settings. The keys match the keys in public/LivelyProperties.json. */
export interface Settings {
  /** 0 = Blue Swirl, 1 = Midnight Swirl, 2 = Black Neon, 3 = Pink Dream */
  theme: number
  /** size of one glyph in pixels */
  glyphSize: number
  /** fall speed, 1–20 */
  speed: number
  /** what percentage of glyphs are sparkles, bubbles and spirals instead of letters */
  sparkleShare: number
  /** drifting, colorful smoke veils */
  smoke: boolean
  /** sushi words and recipe steps in the rain */
  sushi: boolean
  /**
   * mouse effect: 0 = off, 1 = spotlight, 2 = umbrella.
   * When it's on, the pointer also leaves a sparkle trail and clicks make a splash.
   */
  mouseEffect: number
  fps: number
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 1,
  glyphSize: 15,
  speed: 3,
  sparkleShare: 35,
  smoke: false,
  sushi: true,
  mouseEffect: 0,
  fps: 60,
}

function isKey(name: string): name is keyof Settings {
  return Object.hasOwn(DEFAULT_SETTINGS, name)
}

function coerce(key: keyof Settings, value: unknown): number | boolean | undefined {
  if (typeof DEFAULT_SETTINGS[key] === 'boolean') {
    return value === true || value === 'true' || value === 1 || value === '1'
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

/** For development: ?theme=2&speed=12 in the URL overrides the defaults. */
function readUrlOverrides(): Partial<Settings> {
  const out: Record<string, number | boolean> = {}
  for (const [name, raw] of new URLSearchParams(window.location.search)) {
    if (!isKey(name)) continue
    const value = coerce(name, raw)
    if (value !== undefined) out[name] = value
  }
  return out as Partial<Settings>
}

type Listener = () => void
const listeners = new Set<Listener>()
let current: Settings = { ...DEFAULT_SETTINGS, ...readUrlOverrides() }

export function getSettings(): Settings {
  return current
}

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch }
  for (const listener of listeners) listener()
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings)
}

declare global {
  interface Window {
    livelyPropertyListener?: (name: string, value: unknown) => void
  }
}

// Lively calls this global function for every setting after the page loads, and again
// whenever you change something in its Customise panel. It's registered as soon as the
// module loads so no call gets lost.
window.livelyPropertyListener = (name, value) => {
  if (!isKey(name)) return
  const coerced = coerce(name, value)
  if (coerced !== undefined) updateSettings({ [name]: coerced } as Partial<Settings>)
}
