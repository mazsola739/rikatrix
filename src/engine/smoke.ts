import { rgba, type Rgb } from './palette'
import { rand } from './random'
import type { Pointer } from './types'

const TAU = Math.PI * 2
/** the veils are drawn at quarter resolution and blurred: soft and cheap */
const SCALE = 0.25
const BLUR_PX = 6
const WISPS = 8
const POINTS = 6
/** [width, opacity] layers: wide and faint, stronger in the middle */
const PASSES: readonly (readonly [number, number])[] = [
  [1, 0.35],
  [0.55, 0.5],
  [0.22, 0.7],
]
/** fine hair strands along each veil, at full resolution */
const STRANDS = [-0.22, -0.08, 0.06, 0.2]

interface WispPoint {
  x: number
  y: number
  ax: number
  ay: number
  phase: number
  speed: number
  /** offset caused by the pointer pushing it away */
  ox: number
  oy: number
  /** current position */
  cx: number
  cy: number
}

interface Wisp {
  color: Rgb
  alpha: number
  width: number
  points: WispPoint[]
}

function context(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas is not available')
  return ctx
}

/** Slowly drifting colorful smoke veils, like the locks of the smoky-haired girl. The pointer pushes them aside. */
export class Smoke {
  private readonly canvas = document.createElement('canvas')
  private readonly blurred = document.createElement('canvas')
  private readonly sctx = context(this.canvas)
  private readonly bctx = context(this.blurred)
  private wisps: Wisp[] = []
  private width = 1
  private height = 1

  build(width: number, height: number, colors: readonly Rgb[], alpha: number) {
    this.width = width
    this.height = height
    for (const c of [this.canvas, this.blurred]) {
      c.width = Math.max(1, Math.ceil(width * SCALE))
      c.height = Math.max(1, Math.ceil(height * SCALE))
    }
    const size = Math.max(width, height)
    this.wisps = Array.from({ length: WISPS }, (_, i) => {
      const x0 = rand(-0.1, 1.1) * width
      // the locks flow down at a slant, like floating hair
      const drift = rand(-0.5, 0.5) * width
      return {
        color: colors[i % colors.length],
        alpha: alpha * rand(0.75, 1.25),
        width: rand(0.07, 0.16) * size,
        points: Array.from({ length: POINTS }, (_, j) => {
          const t = j / (POINTS - 1)
          const x = x0 + drift * t + rand(-0.08, 0.08) * width
          const y = -0.15 * height + t * 1.3 * height
          return {
            x,
            y,
            ax: rand(0.03, 0.1) * width,
            ay: rand(0.02, 0.05) * height,
            phase: rand(0, TAU),
            speed: rand(0.1, 0.25),
            ox: 0,
            oy: 0,
            cx: x,
            cy: y,
          }
        }),
      }
    })
  }

  update(dt: number, time: number, pointer: Pointer) {
    const k = Math.min(1, dt * 2)
    const radius = Math.max(this.width, this.height) * 0.18
    for (const w of this.wisps) {
      for (const p of w.points) {
        const bx = p.x + Math.sin(time * p.speed + p.phase) * p.ax
        const by = p.y + Math.cos(time * p.speed * 0.8 + p.phase) * p.ay
        let tx = 0
        let ty = 0
        if (pointer.active) {
          const dx = bx - pointer.x
          const dy = by - pointer.y
          const d = Math.hypot(dx, dy) || 1
          if (d < radius) {
            const push = (1 - d / radius) * radius * 0.5
            tx = (dx / d) * push
            ty = (dy / d) * push
          }
        }
        p.ox += (tx - p.ox) * k
        p.oy += (ty - p.oy) * k
        p.cx = bx + p.ox
        p.cy = by + p.oy
      }
    }
  }

  private trace(ctx: CanvasRenderingContext2D, points: readonly WispPoint[], shift: number) {
    ctx.beginPath()
    ctx.moveTo(points[0].cx + shift, points[0].cy)
    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i]
      const n = points[i + 1]
      ctx.quadraticCurveTo(p.cx + shift, p.cy, (p.cx + n.cx) / 2 + shift, (p.cy + n.cy) / 2)
    }
    const last = points[points.length - 1]
    ctx.lineTo(last.cx + shift, last.cy)
  }

  draw(ctx: CanvasRenderingContext2D) {
    const s = this.sctx
    const cw = this.canvas.width
    const ch = this.canvas.height
    s.setTransform(1, 0, 0, 1, 0, 0)
    s.clearRect(0, 0, cw, ch)
    s.setTransform(cw / this.width, 0, 0, ch / this.height, 0, 0)
    s.lineCap = 'round'
    s.lineJoin = 'round'
    for (const w of this.wisps) {
      this.trace(s, w.points, 0)
      for (const [widthK, alphaK] of PASSES) {
        s.lineWidth = w.width * widthK
        s.strokeStyle = rgba(w.color, w.alpha * alphaK)
        s.stroke()
      }
    }

    const b = this.bctx
    b.setTransform(1, 0, 0, 1, 0, 0)
    b.clearRect(0, 0, cw, ch)
    b.filter = `blur(${BLUR_PX}px)`
    b.drawImage(this.canvas, 0, 0)
    b.filter = 'none'
    ctx.drawImage(this.blurred, 0, 0, this.width, this.height)

    // thin, bright hair strands along the veils
    ctx.lineCap = 'round'
    ctx.lineWidth = 1.2
    for (const w of this.wisps) {
      ctx.strokeStyle = rgba(w.color, Math.min(1, w.alpha * 0.9))
      for (const offset of STRANDS) {
        this.trace(ctx, w.points, offset * w.width)
        ctx.stroke()
      }
    }
  }
}
