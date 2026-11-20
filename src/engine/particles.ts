import { rand } from './random'
import { blit, type Sprites } from './sprites'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  spin: number
  life: number
  maxLife: number
  size: number
  shape: number
  gravity: number
  drag: number
}

interface Ripple {
  x: number
  y: number
  life: number
  maxLife: number
  radius: number
}

const MAX_PARTICLES = 400

/** A splash on click (ripple rings + sparkles) and a sparkle trail when the mouse moves. */
export class Particles {
  private list: Particle[] = []
  private ripples: Ripple[] = []

  splash(x: number, y: number, sprites: Sprites) {
    this.ripples.push(
      { x, y, life: 1.3, maxLife: 1.3, radius: 150 },
      { x, y, life: 1.8, maxLife: 1.8, radius: 260 },
    )
    for (let i = 0; i < 22; i++) {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(120, 380)
      const life = rand(1.2, 2)
      this.add({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: rand(0, Math.PI * 2),
        spin: rand(-4, 4),
        life,
        maxLife: life,
        size: rand(10, 22),
        shape: sprites.randomShape(),
        gravity: rand(-40, 20),
        drag: 1.8,
      })
    }
  }

  sparkle(x: number, y: number, sprites: Sprites) {
    this.add({
      x: x + rand(-6, 6),
      y: y + rand(-6, 6),
      vx: rand(-30, 30),
      vy: rand(-30, 10),
      rot: rand(0, Math.PI),
      spin: rand(-3, 3),
      life: 0.9,
      maxLife: 0.9,
      size: rand(8, 14),
      shape: sprites.randomSparkle(),
      gravity: -20,
      drag: 0.8,
    })
  }

  private add(p: Particle) {
    if (this.list.length >= MAX_PARTICLES) this.list.shift()
    this.list.push(p)
  }

  update(dt: number) {
    let alive = 0
    for (const p of this.list) {
      p.life -= dt
      if (p.life <= 0) continue
      const drag = Math.max(0, 1 - dt * p.drag)
      p.vx *= drag
      p.vy = p.vy * drag + p.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rot += p.spin * dt
      this.list[alive++] = p
    }
    this.list.length = alive

    alive = 0
    for (const r of this.ripples) {
      r.life -= dt
      if (r.life > 0) this.ripples[alive++] = r
    }
    this.ripples.length = alive
  }

  draw(ctx: CanvasRenderingContext2D, sprites: Sprites) {
    ctx.strokeStyle = '#ffffff'
    for (const r of this.ripples) {
      const t = 1 - r.life / r.maxLife
      const eased = 1 - Math.pow(1 - t, 3)
      ctx.globalAlpha = (1 - t) * 0.55
      ctx.lineWidth = 0.8 + 2.2 * (1 - t)
      ctx.beginPath()
      ctx.arc(r.x, r.y, r.radius * eased, 0, Math.PI * 2)
      ctx.stroke()
    }

    for (const p of this.list) {
      ctx.save()
      ctx.globalAlpha = Math.min(1, (p.life / p.maxLife) * 2.5)
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      blit(ctx, sprites.shapes, p.shape, 0, 0, p.size)
      ctx.restore()
    }
    ctx.globalAlpha = 1
  }
}
