import type { Settings } from '../settings'
import { Glitter } from './glitter'
import { THEMES, buildBackground, rgba, type Theme } from './palette'
import { Particles } from './particles'
import { Rain } from './rain'
import { pickWeightedIndex, randInt } from './random'
import { Smoke } from './smoke'
import { CHARS, Sprites } from './sprites'
import type { Pointer } from './types'

/** How long the pointer counts as "active" after its last movement. */
const POINTER_TIMEOUT_MS = 5000
/** The pointer leaves one sparkle every this many pixels. */
const TRAIL_STEP = 26

/**
 * The Rikatrix engine: one canvas, one render loop. It doesn't depend on React;
 * the WallpaperCanvas component creates it and passes the settings in.
 */
export class Wallpaper {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private settings: Settings
  private width = 0
  private height = 0
  private dpr = 1
  private sprites!: Sprites
  private background!: HTMLCanvasElement
  private readonly rain = new Rain()
  private readonly smoke = new Smoke()
  private readonly glitter = new Glitter()
  private readonly particles = new Particles()
  private readonly pointer: Pointer = { x: 0, y: 0, active: false }
  private lastMove = -Infinity
  private trail = 0
  private raf = 0
  private last = 0
  private time = 0
  private readonly cleanup: Array<() => void> = []

  constructor(canvas: HTMLCanvasElement, settings: Settings) {
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('2D canvas is not available')
    this.canvas = canvas
    this.ctx = ctx
    this.settings = settings

    this.resize()
    this.listen(window, 'resize', () => this.resize())
    this.listen(window, 'mousemove', (e) => this.onMove(e))
    this.listen(window, 'mousedown', (e) => this.onDown(e))
    this.listen(window, 'mouseout', (e) => {
      if (!e.relatedTarget) this.lastMove = -Infinity
    })
    const onVisibility = () => (document.hidden ? this.stop() : this.start())
    document.addEventListener('visibilitychange', onVisibility)
    this.cleanup.push(() => document.removeEventListener('visibilitychange', onVisibility))

    this.start()
  }

  setSettings(next: Settings) {
    const prev = this.settings
    this.settings = next
    const themeChanged = prev.theme !== next.theme
    if (themeChanged) this.rebuildScenery()
    // every theme has its own rain colors, so the rain is rebuilt on a theme change too
    if (themeChanged || prev.glyphSize !== next.glyphSize) this.rebuildRain()
    else if (prev.sparkleShare !== next.sparkleShare) this.rain.reroll()
  }

  destroy() {
    this.stop()
    for (const fn of this.cleanup) fn()
    this.cleanup.length = 0
  }

  private get theme(): Theme {
    return THEMES[this.settings.theme] ?? THEMES[0]
  }

  private listen<K extends keyof WindowEventMap>(target: Window, type: K, fn: (e: WindowEventMap[K]) => void) {
    target.addEventListener(type, fn)
    this.cleanup.push(() => target.removeEventListener(type, fn))
  }

  private start() {
    if (this.raf) return
    this.last = 0
    this.raf = requestAnimationFrame(this.frame)
  }

  private stop() {
    cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  private resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.canvas.width = Math.round(this.width * this.dpr)
    this.canvas.height = Math.round(this.height * this.dpr)
    this.rebuildScenery()
    this.rebuildRain()
    this.glitter.build(this.width, this.height)
  }

  private rebuildScenery() {
    const theme = this.theme
    this.background = buildBackground(this.width, this.height, this.dpr, theme)
    this.smoke.build(this.width, this.height, theme.smoke, theme.smokeAlpha)
  }

  private rebuildRain() {
    const trails = this.theme.trails
    const weights = trails.map((t) => t.weight)
    this.sprites = new Sprites(this.settings.glyphSize, this.dpr, trails)
    this.rain.reset(this.width, this.height, this.settings.glyphSize, {
      pickGlyph: () => this.pickGlyph(),
      pickPalette: () => pickWeightedIndex(weights),
      useSushi: () => this.settings.sushi,
    })
  }

  private pickGlyph(): number {
    if (Math.random() * 100 < this.settings.sparkleShare) return -(this.sprites.randomShape() + 1)
    return randInt(0, CHARS.length - 1)
  }

  private onMove(e: MouseEvent) {
    const dist = Math.hypot(e.clientX - this.pointer.x, e.clientY - this.pointer.y)
    this.pointer.x = e.clientX
    this.pointer.y = e.clientY
    const wasActive = performance.now() - this.lastMove < POINTER_TIMEOUT_MS
    this.lastMove = performance.now()
    if (this.settings.mouseEffect === 0 || !wasActive) return
    this.trail += dist
    while (this.trail > TRAIL_STEP) {
      this.trail -= TRAIL_STEP
      this.particles.sparkle(e.clientX, e.clientY, this.sprites)
    }
  }

  private onDown(e: MouseEvent) {
    // clicks on the settings panel or the showcase page's panels and buttons shouldn't splash
    const target = e.target instanceof Element ? e.target : null
    if (this.settings.mouseEffect === 0 || target?.closest('.panel, .glass, a, button')) return
    this.particles.splash(e.clientX, e.clientY, this.sprites)
  }

  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame)
    const step = 1000 / this.settings.fps
    if (this.last === 0) this.last = now - step
    const elapsed = now - this.last
    if (elapsed < step - 1) return
    this.last = now - (elapsed % step)
    const dt = Math.min(elapsed / 1000, 0.1)
    this.update(dt)
    this.draw()
  }

  private update(dt: number) {
    this.time += dt
    this.pointer.active = this.settings.mouseEffect > 0 && performance.now() - this.lastMove < POINTER_TIMEOUT_MS
    this.rain.update(dt, 2 + this.settings.speed * 1.1)
    if (this.settings.smoke) this.smoke.update(dt, this.time, this.pointer)
    this.particles.update(dt)
  }

  private draw() {
    const { ctx, width, height, pointer } = this
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.globalAlpha = 1
    ctx.drawImage(this.background, 0, 0, width, height)

    if (this.settings.smoke) this.smoke.draw(ctx)
    this.glitter.draw(ctx, this.sprites, this.time)

    if (pointer.active) {
      const r = this.settings.glyphSize * 9
      const halo = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, r)
      halo.addColorStop(0, rgba(this.theme.halo, 0.16))
      halo.addColorStop(1, rgba(this.theme.halo, 0))
      ctx.fillStyle = halo
      ctx.fillRect(pointer.x - r, pointer.y - r, r * 2, r * 2)
    }

    this.rain.draw(ctx, this.sprites, pointer, this.settings.mouseEffect)
    this.particles.draw(ctx, this.sprites)
    ctx.globalAlpha = 1
  }
}
