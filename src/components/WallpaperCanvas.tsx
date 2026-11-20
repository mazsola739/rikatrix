import { useEffect, useRef } from 'react'
import { Wallpaper } from '../engine/wallpaper'
import { getSettings, type Settings } from '../settings'

export function WallpaperCanvas({ settings }: { settings: Settings }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Wallpaper | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new Wallpaper(canvas, getSettings())
    engineRef.current = engine
    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    engineRef.current?.setSettings(settings)
  }, [settings])

  return <canvas ref={canvasRef} className="wallpaper" aria-hidden="true" />
}
