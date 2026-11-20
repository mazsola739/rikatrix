import { STAGES } from './palette'
import { pick, rand, randInt } from './random'
import { SUSHI_WORDS, blit, type Sprites } from './sprites'
import type { Pointer } from './types'

/**
 * One column of rain. `glyphs` stores one glyph per row:
 * 0 or more = character index, negative = -(shape index + 1).
 */
interface Stream {
  head: number
  speed: number
  length: number
  palette: number
  glyphs: Int16Array
  /** 1 = a letter of a sushi word, flickering never overwrites it */
  locked: Uint8Array
  flicker: number
  word: readonly number[] | null
  wordPos: number
  /** how many random glyphs come before the next sushi word */
  gap: number
}

/** 0 = off, 1 = spotlight (the code lights up), 2 = umbrella (the rain flows around the pointer) */
export const MOUSE_SPOTLIGHT = 1
export const MOUSE_UMBRELLA = 2

export interface RainSource {
  pickGlyph: () => number
  pickPalette: () => number
  useSushi: () => boolean
}

const smoothstep = (k: number) => k * k * (3 - 2 * k)

export class Rain {
  private cols = 0
  private rows = 0
  private cell = 20
  private streams: Stream[] = []
  private source: RainSource = { pickGlyph: () => 0, pickPalette: () => 0, useSushi: () => false }

  reset(width: number, height: number, cell: number, source: RainSource) {
    this.cell = cell
    this.source = source
    this.cols = Math.ceil(width / cell)
    this.rows = Math.ceil(height / cell) + 1
    this.streams = Array.from({ length: this.cols }, () => {
      const glyphs = new Int16Array(this.rows)
      for (let i = 0; i < this.rows; i++) glyphs[i] = source.pickGlyph()
      const stream: Stream = {
        head: 0,
        speed: 1,
        length: 10,
        palette: 0,
        glyphs,
        locked: new Uint8Array(this.rows),
        flicker: 0,
        word: null,
        wordPos: 0,
        gap: 0,
      }
      this.respawn(stream, true)
      return stream
    })
  }

  /** Re-rolls every non-word glyph, e.g. after the sparkle amount changes. */
  reroll() {
    for (const s of this.streams) {
      for (let i = 0; i < s.glyphs.length; i++) if (!s.locked[i]) s.glyphs[i] = this.source.pickGlyph()
    }
  }

  private respawn(s: Stream, initial: boolean) {
    s.length = randInt(10, Math.max(14, Math.floor(this.rows * 0.8)))
    s.speed = rand(0.6, 1.4)
    s.palette = this.source.pickPalette()
    s.word = null
    s.gap = randInt(0, 6)
    // the screen starts full; after that streams come from the top with varying gaps
    s.head = initial ? rand(-this.rows * 0.2, this.rows + s.length) : -rand(0, this.rows * 0.45)
  }

  /** The head entered a new row: a random glyph, or the next letter of a sushi word. */
  private step(s: Stream, row: number) {
    let glyph = this.source.pickGlyph()
    let locked = 0
    if (this.source.useSushi()) {
      if (!s.word && --s.gap < 0) {
        s.word = pick(SUSHI_WORDS)
        s.wordPos = 0
      }
      if (s.word) {
        glyph = s.word[s.wordPos++]
        locked = 1
        if (s.wordPos >= s.word.length) {
          s.word = null
          s.gap = randInt(3, 10)
        }
      }
    }
    s.glyphs[row] = glyph
    s.locked[row] = locked
  }

  update(dt: number, rowsPerSecond: number) {
    for (const s of this.streams) {
      const before = Math.floor(s.head)
      s.head += s.speed * rowsPerSecond * dt
      const row = Math.floor(s.head)
      for (let r = Math.max(before + 1, 0); r <= Math.min(row, this.rows - 1); r++) this.step(s, r)

      // a few glyphs in the trail change on the fly, that's what makes Matrix rain feel alive
      s.flicker += dt * 5
      while (s.flicker >= 1) {
        s.flicker -= 1
        const r = row - randInt(1, s.length)
        if (r >= 0 && r < this.rows && !s.locked[r]) s.glyphs[r] = this.source.pickGlyph()
      }

      if (s.head - s.length > this.rows) this.respawn(s, false)
    }
  }

  /** `effect` is the mouse effect; it only applies while the pointer is active. */
  draw(ctx: CanvasRenderingContext2D, sprites: Sprites, pointer: Pointer, effect: number) {
    const cell = this.cell
    const shapeSize = cell * 1.05
    const radius = cell * (effect === MOUSE_UMBRELLA ? 5 : 6)

    for (let c = 0; c < this.streams.length; c++) {
      const s = this.streams[c]
      const x = c * cell + cell / 2
      const headRow = Math.floor(s.head)
      const chars = sprites.chars[s.palette]
      const nearPointer = pointer.active && effect !== 0 && Math.abs(x - pointer.x) < radius

      for (let i = 0; i < s.length; i++) {
        const row = headRow - i
        if (row < 0) break
        if (row >= this.rows) continue

        const t = i / s.length
        // white head, two lighter glyphs below it, then the stream's own color fades out
        let stage = i === 0 ? 0 : i <= 2 ? 1 : STAGES - 1
        let alpha = i === 0 ? 1 : Math.pow(1 - t, 0.8)
        let drawX = x
        let scale = 1
        const y = row * cell + cell / 2

        if (nearPointer) {
          const dx = x - pointer.x
          const dy = y - pointer.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < radius) {
            const k = smoothstep(1 - d / radius)
            if (effect === MOUSE_SPOTLIGHT) {
              // spotlight: the code lights up and grows a little, but stays in place
              alpha = Math.min(1, alpha + k * 0.85)
              if (k > 0.35 && stage === STAGES - 1) stage = 1
              scale = 1 + k * 0.25
            } else {
              // umbrella: columns bend sideways, like water flowing around a stone
              drawX = x + Math.sign(dx || 1) * k * radius * 0.6
              alpha *= 1 - k * 0.5
            }
          }
        }

        ctx.globalAlpha = alpha
        const glyph = s.glyphs[row]
        if (glyph >= 0) blit(ctx, chars[stage], glyph, drawX, y, chars[stage].tileCss * scale)
        else blit(ctx, sprites.shapes, -glyph - 1, drawX, y, shapeSize * scale)
      }
    }
    ctx.globalAlpha = 1
  }
}
