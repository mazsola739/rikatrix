import { STAGES, type TrailPalette } from './palette'
import { pickWeightedIndex } from './random'
import { drawBubble, drawSparkle, drawSpiral } from './shapes'

type Ctx = CanvasRenderingContext2D

const BASE_CHARS = 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ012345789:=*+<>'

/**
 * The designer of the Matrix code reportedly scanned the glyphs from his wife's Japanese
 * cookbooks – sushi recipes. So sushi is falling here too: words and recipe steps in
 * half-width katakana, mirrored like in the film.
 */
const SUSHI = [
  'ｽｼ', // sushi
  'ﾏｸﾞﾛ', // tuna
  'ｻｰﾓﾝ', // salmon
  'ﾜｻﾋﾞ', // wasabi
  'ｼｮｳﾕ', // soy sauce
  'ﾉﾘ', // nori
  'ｺﾞﾊﾝ', // rice
  'ﾆｷﾞﾘ', // nigiri
  'ﾏｷ', // maki
  'ｴﾋﾞ', // shrimp
  'ﾀﾏｺﾞ', // egg
  'ｲｸﾗ', // salmon roe
  'ｶﾞﾘ', // pickled ginger
  'ｷｭｳﾘ', // cucumber
  'ｱﾎﾞｶﾄﾞ', // avocado
  'ｺﾞﾊﾝﾆｽｦｲﾚﾙ', // add vinegar to the rice
  'ﾉﾘﾃﾞﾏｸ', // roll it up in nori
  'ﾜｻﾋﾞｦﾇﾙ', // spread on the wasabi
]

export const CHARS = Array.from(new Set([...BASE_CHARS, ...SUSHI.join('')]))

/** The sushi words as CHARS indices. */
export const SUSHI_WORDS: readonly (readonly number[])[] = SUSHI.map((word) => Array.from(word, (ch) => CHARS.indexOf(ch)))

type ShapeKind = 'sparkle' | 'bubble' | 'spiral'

interface ShapeDef {
  readonly kind: ShapeKind
  readonly color: string
  readonly weight: number
}

const SHAPES: readonly ShapeDef[] = [
  { kind: 'sparkle', color: '#ffffff', weight: 4 },
  { kind: 'sparkle', color: '#ffd6ec', weight: 2 },
  { kind: 'sparkle', color: '#e6dbff', weight: 2 },
  { kind: 'sparkle', color: '#c8f3ff', weight: 2 },
  { kind: 'bubble', color: '#ffffff', weight: 2 },
  { kind: 'bubble', color: '#ffc2e0', weight: 1 },
  { kind: 'spiral', color: '#ffffff', weight: 2 },
  { kind: 'spiral', color: '#ff9ccb', weight: 2 },
  { kind: 'spiral', color: '#cdb6ff', weight: 2 },
]

function drawShape(ctx: Ctx, def: ShapeDef, r: number) {
  switch (def.kind) {
    case 'sparkle':
      return drawSparkle(ctx, r, def.color)
    case 'bubble':
      return drawBubble(ctx, r * 0.85, def.color)
    case 'spiral':
      return drawSpiral(ctx, r * 0.85, def.color)
  }
}

/** A sprite sheet laid out in one row: every image is a square tile. */
export interface Atlas {
  readonly canvas: HTMLCanvasElement
  /** tile size in device pixels */
  readonly tile: number
  /** tile size in CSS pixels */
  readonly tileCss: number
}

function makeAtlas(count: number, tileCss: number, dpr: number, draw: (ctx: Ctx, index: number, scale: number) => void): Atlas {
  const tile = Math.max(1, Math.ceil(tileCss * dpr))
  const scale = tile / tileCss
  const canvas = document.createElement('canvas')
  canvas.width = tile * count
  canvas.height = tile
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas is not available')
  for (let i = 0; i < count; i++) {
    ctx.save()
    ctx.translate(i * tile + tile / 2, tile / 2)
    ctx.scale(scale, scale)
    draw(ctx, i, scale)
    ctx.restore()
  }
  return { canvas, tile, tileCss }
}

export function blit(ctx: Ctx, atlas: Atlas, index: number, x: number, y: number, size: number) {
  ctx.drawImage(atlas.canvas, index * atlas.tile, 0, atlas.tile, atlas.tile, x - size / 2, y - size / 2, size, size)
}

/**
 * Pre-rendered glyphs. At runtime only drawImage happens, which is much cheaper
 * than drawing text and paths every frame.
 */
export class Sprites {
  /** chars[palette][stage] */
  readonly chars: Atlas[][]
  readonly shapes: Atlas
  /** index of the white sparkle, the one twinkling in the background */
  readonly twinkle = 0
  private readonly sparkles = SHAPES.flatMap((s, i) => (s.kind === 'sparkle' ? [i] : []))
  private readonly weights = SHAPES.map((s) => s.weight)

  constructor(cell: number, dpr: number, trails: readonly TrailPalette[]) {
    const font = `700 ${Math.round(cell * 0.8)}px "Yu Gothic UI", "Meiryo", "MS Gothic", monospace`

    this.chars = trails.map((palette) =>
      Array.from({ length: STAGES }, (_, stage) =>
        makeAtlas(CHARS.length, cell * 1.6, dpr, (ctx, i, scale) => {
          ctx.font = font
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = palette.stages[stage]
          // the head always glows; on a neon theme the rest of the stream does too
          const glow = stage === 0 ? 0.6 : stage === 1 ? 0.3 : palette.neon ? 0.35 : 0
          if (glow > 0) {
            ctx.shadowColor = palette.glow
            ctx.shadowBlur = cell * glow * scale
          }
          ctx.scale(-1, 1)
          ctx.fillText(CHARS[i], 0, cell * 0.04)
        }),
      ),
    )

    // double resolution so they stay sharp when scaled up (splash, spotlight)
    const shapeTile = cell * 2
    this.shapes = makeAtlas(SHAPES.length, shapeTile, dpr, (ctx, i) => drawShape(ctx, SHAPES[i], shapeTile * 0.42))
  }

  randomShape(): number {
    return pickWeightedIndex(this.weights)
  }

  randomSparkle(): number {
    return this.sparkles[Math.floor(Math.random() * this.sparkles.length)]
  }
}
