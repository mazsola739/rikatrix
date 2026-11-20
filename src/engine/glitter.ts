import { rand } from './random'
import { blit, type Sprites } from './sprites'

interface Speck {
  x: number
  y: number
  phase: number
  speed: number
  size: number
}

/** Glitter dust in the background: tiny sparkles flashing here and there. */
export class Glitter {
  private specks: Speck[] = []

  build(width: number, height: number) {
    const count = Math.round((width * height) / 9000)
    this.specks = Array.from({ length: count }, () => ({
      x: rand(0, width),
      y: rand(0, height),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.6, 1.8),
      size: rand(6, 12),
    }))
  }

  draw(ctx: CanvasRenderingContext2D, sprites: Sprites, time: number) {
    for (const s of this.specks) {
      const v = Math.sin(time * s.speed + s.phase)
      if (v < 0.8) continue
      const k = (v - 0.8) / 0.2
      ctx.globalAlpha = k
      blit(ctx, sprites.shapes, sprites.twinkle, s.x, s.y, s.size * (0.5 + 0.5 * k))
    }
    ctx.globalAlpha = 1
  }
}
