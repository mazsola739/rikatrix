import { rand, randInt } from './random'

export type Rgb = readonly [number, number, number]

/**
 * The colors of one rain stream: [bright head, the light glyphs right under it, the stream color].
 * One color per stream that only fades out, like the green of the original Matrix.
 */
export interface TrailPalette {
  readonly stages: readonly string[]
  readonly glow: string
  /** how often a stream of this color falls within the theme */
  readonly weight: number
  /** neon: every glyph of the stream glows, not only its head */
  readonly neon?: boolean
}

export const STAGES = 3

const PINK = { stages: ['#ffffff', '#ffd3e8', '#ff9ccb'], glow: '#ff7fbf' }
const LAVENDER = { stages: ['#ffffff', '#e6dbff', '#c3a6ff'], glow: '#a98cff' }
const ICE = { stages: ['#ffffff', '#dcf7ff', '#9fe3fb'], glow: '#7fd6ff' }

export interface Glow {
  readonly x: number
  readonly y: number
  readonly r: number
  readonly rgb: Rgb
  readonly a: number
}

export interface Theme {
  /** gradient from the top right corner to the bottom left */
  readonly stops: readonly string[]
  /** color of the light around the pointer */
  readonly halo: Rgb
  readonly glows: readonly Glow[]
  /** flowing marble strands and glitter dust baked into the background */
  readonly marble: { readonly color: Rgb; readonly alpha: number }
  /** colors of the slowly drifting smoke veils */
  readonly smoke: readonly Rgb[]
  readonly smokeAlpha: number
  /** the rain colors of this theme */
  readonly trails: readonly TrailPalette[]
}

export const THEMES: readonly Theme[] = [
  // 0 – Blue Swirl: the palette of the blue paint swirl image
  {
    stops: ['#02B0F2', '#019EE8', '#018FDA', '#0083CE', '#007ECF'],
    halo: [255, 255, 255],
    glows: [
      { x: 0.92, y: 0.04, r: 0.6, rgb: [190, 240, 255], a: 0.28 },
      { x: 0.04, y: 1.0, r: 0.6, rgb: [0, 70, 160], a: 0.3 },
      { x: 0.4, y: 0.45, r: 0.5, rgb: [0, 80, 170], a: 0.16 },
    ],
    marble: { color: [225, 248, 255], alpha: 0.2 },
    smoke: [
      [255, 120, 180],
      [170, 130, 245],
      [210, 245, 255],
      [255, 105, 160],
    ],
    smokeAlpha: 0.34,
    trails: [
      { ...PINK, weight: 0.5 },
      { ...LAVENDER, weight: 0.3 },
      { ...ICE, weight: 0.2 },
    ],
  },
  // 1 – Midnight Swirl: the same in the dark
  {
    stops: ['#0b3a78', '#0a2c5e', '#071f47', '#051433'],
    halo: [140, 210, 255],
    glows: [{ x: 0.92, y: 0.04, r: 0.6, rgb: [2, 176, 242], a: 0.22 }],
    marble: { color: [130, 210, 255], alpha: 0.1 },
    smoke: [
      [255, 95, 165],
      [150, 110, 240],
      [2, 176, 242],
    ],
    smokeAlpha: 0.28,
    trails: [
      { ...PINK, weight: 0.45 },
      { ...LAVENDER, weight: 0.3 },
      { ...ICE, weight: 0.25 },
    ],
  },
  // 2 – Black Neon: pitch black background, glowing neon streams
  {
    stops: ['#0a0614', '#050309', '#000000'],
    halo: [255, 43, 214],
    glows: [{ x: 0.92, y: 0.04, r: 0.55, rgb: [120, 40, 200], a: 0.12 }],
    marble: { color: [190, 90, 255], alpha: 0.04 },
    smoke: [
      [255, 43, 214],
      [0, 229, 255],
      [166, 75, 255],
    ],
    smokeAlpha: 0.2,
    trails: [
      { stages: ['#ffffff', '#ffb3f0', '#ff2bd6'], glow: '#ff2bd6', weight: 0.45, neon: true },
      { stages: ['#ffffff', '#b3fbff', '#00e5ff'], glow: '#00e5ff', weight: 0.3, neon: true },
      { stages: ['#ffffff', '#dcb8ff', '#a64bff'], glow: '#a64bff', weight: 0.25, neon: true },
    ],
  },
  // 3 – Pink Dream: a pink swirl with white and deep violet rain
  {
    stops: ['#ff9fd0', '#f784c2', '#e866ab', '#d64a94'],
    halo: [255, 255, 255],
    glows: [{ x: 0.92, y: 0.04, r: 0.6, rgb: [255, 220, 240], a: 0.25 }],
    marble: { color: [255, 255, 255], alpha: 0.16 },
    smoke: [
      [255, 255, 255],
      [190, 150, 255],
      [200, 40, 120],
    ],
    smokeAlpha: 0.25,
    trails: [
      { stages: ['#ffffff', '#ffffff', '#ffffff'], glow: '#ffffff', weight: 0.45 },
      { stages: ['#ffffff', '#f0d9ff', '#6a2fa0'], glow: '#c08cff', weight: 0.3 },
      { stages: ['#ffffff', '#ffd1e6', '#a3155f'], glow: '#ff5fa8', weight: 0.25 },
    ],
  },
]

export const rgba = ([r, g, b]: Rgb, a: number) => `rgba(${r},${g},${b},${a})`

export function buildBackground(width: number, height: number, dpr: number, theme: Theme): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * dpr))
  canvas.height = Math.max(1, Math.round(height * dpr))
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.scale(dpr, dpr)

  const linear = ctx.createLinearGradient(width, 0, 0, height)
  theme.stops.forEach((color, i) => linear.addColorStop(i / Math.max(1, theme.stops.length - 1), color))
  ctx.fillStyle = linear
  ctx.fillRect(0, 0, width, height)

  const size = Math.max(width, height)
  for (const glow of theme.glows) {
    const x = glow.x * width
    const y = glow.y * height
    const radial = ctx.createRadialGradient(x, y, 0, x, y, glow.r * size)
    radial.addColorStop(0, rgba(glow.rgb, glow.a))
    radial.addColorStop(1, rgba(glow.rgb, 0))
    ctx.fillStyle = radial
    ctx.fillRect(0, 0, width, height)
  }

  drawMarble(ctx, width, height, theme.marble.color, theme.marble.alpha)
  return canvas
}

/** Thin flowing, swirling strands and glitter dust, like in the blue paint swirl. Drawn once. */
function drawMarble(ctx: CanvasRenderingContext2D, width: number, height: number, color: Rgb, alpha: number) {
  // flow field: mostly flows downward while swirling left and right
  const flow = (x: number, y: number) =>
    Math.PI / 2 + Math.sin(x * 0.0035 + Math.sin(y * 0.0025) * 2.2) * 0.95 + Math.sin(y * 0.009 + x * 0.002) * 0.3

  const count = Math.round((width * height) / 2400)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (let i = 0; i < count; i++) {
    let x = rand(-50, width + 50)
    let y = rand(-50, height)
    ctx.strokeStyle = rgba(color, alpha * rand(0.25, 1))
    ctx.lineWidth = rand(0.4, 1.6)
    ctx.beginPath()
    ctx.moveTo(x, y)
    const steps = randInt(15, 80)
    for (let s = 0; s < steps; s++) {
      const a = flow(x, y)
      x += Math.cos(a) * 5
      y += Math.sin(a) * 5
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  for (let i = 0; i < count * 0.8; i++) {
    const size = rand(0.6, 1.8)
    ctx.fillStyle = rgba(color, Math.min(1, alpha * rand(0.6, 3)))
    ctx.fillRect(rand(0, width), rand(0, height), size, size)
  }
}
