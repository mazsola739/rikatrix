/** The little extras mixed into the rain. Each one draws around the origin with radius r. */
type Ctx = CanvasRenderingContext2D
const TAU = Math.PI * 2

/** Four-pointed sparkle. */
export function drawSparkle(ctx: Ctx, r: number, color: string) {
  const k = r * 0.16
  ctx.beginPath()
  ctx.moveTo(0, -r)
  ctx.quadraticCurveTo(k, -k, r, 0)
  ctx.quadraticCurveTo(k, k, 0, r)
  ctx.quadraticCurveTo(-k, k, -r, 0)
  ctx.quadraticCurveTo(-k, -k, 0, -r)
  ctx.fillStyle = color
  ctx.fill()
}

/** See-through bubble with a highlight, like a drop in the paint swirl. */
export function drawBubble(ctx: Ctx, r: number, color: string) {
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.78, 0, TAU)
  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = r * 0.13
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(0, 0, r * 0.52, Math.PI * 1.1, Math.PI * 1.45)
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = r * 0.12
  ctx.lineCap = 'round'
  ctx.stroke()
}

/** Small swirl spiral. */
export function drawSpiral(ctx: Ctx, r: number, color: string) {
  const turns = 2.2
  const steps = 48
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = t * turns * TAU
    const rr = r * 0.85 * t
    if (i === 0) ctx.moveTo(0, 0)
    else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  ctx.strokeStyle = color
  ctx.lineWidth = r * 0.16
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
}
