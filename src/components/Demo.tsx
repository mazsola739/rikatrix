import { useCallback, useEffect, useRef, useState } from 'react'
import { SettingsPanel } from './SettingsPanel'

/** Hide the controls and the cursor after this long without movement, like a video player. */
const IDLE_MS = 2500

const hasDemoParam = () => new URLSearchParams(window.location.search).has('demo')

/**
 * The full-screen demo's state. Entering pushes `?demo` onto the history and asks for real
 * fullscreen; Esc (leaving fullscreen), the Back button and the browser's back button all
 * return to the showcase.
 */
export function useDemo() {
  const [demo, setDemo] = useState(hasDemoParam)
  const demoRef = useRef(demo)
  /** whether we pushed the `?demo` history entry ourselves (so going back returns to the showcase) */
  const pushed = useRef(false)

  const exitDemo = useCallback(() => {
    if (!demoRef.current) return
    demoRef.current = false
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    if (pushed.current) {
      pushed.current = false
      window.history.back()
    } else {
      window.history.replaceState(null, '', window.location.pathname)
    }
    setDemo(false)
  }, [])

  const enterDemo = useCallback(() => {
    demoRef.current = true
    window.history.pushState(null, '', '?demo')
    pushed.current = true
    setDemo(true)
    // must run inside the click handler, browsers only allow fullscreen on a user gesture
    if (document.fullscreenEnabled) document.documentElement.requestFullscreen().catch(() => {})
  }, [])

  useEffect(() => {
    const onPopState = () => {
      const has = hasDemoParam()
      if (!has && document.fullscreenElement) document.exitFullscreen().catch(() => {})
      pushed.current = false
      demoRef.current = has
      setDemo(has)
    }
    // Esc leaves fullscreen; take that as leaving the demo
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) exitDemo()
    }
    window.addEventListener('popstate', onPopState)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      window.removeEventListener('popstate', onPopState)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [exitDemo])

  return { demo, enterDemo, exitDemo }
}

/** The bare wallpaper with a Back button and a collapsed settings panel that fade out when idle. */
export function Demo({ onExit }: { onExit: () => void }) {
  const [idle, setIdle] = useState(false)
  const [fullscreen, setFullscreen] = useState(() => Boolean(document.fullscreenElement))

  useEffect(() => {
    let timer = 0
    const wake = () => {
      setIdle(false)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setIdle(true), IDLE_MS)
    }
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement))
    wake()
    window.addEventListener('mousemove', wake)
    window.addEventListener('keydown', wake)
    window.addEventListener('touchstart', wake)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('mousemove', wake)
      window.removeEventListener('keydown', wake)
      window.removeEventListener('touchstart', wake)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [])

  return (
    <div className={idle ? 'demo demo--idle' : 'demo'}>
      <div className="demo__bar">
        <button type="button" className="demo__btn demo__btn--back" onClick={onExit}>
          ← Back to Rikatrix
        </button>
        {!fullscreen && document.fullscreenEnabled && (
          <button
            type="button"
            className="demo__btn"
            onClick={() => document.documentElement.requestFullscreen().catch(() => {})}
          >
            ⛶ Full screen
          </button>
        )}
        {fullscreen && <span className="demo__hint">Esc to exit</span>}
      </div>
      <SettingsPanel defaultOpen={false} />
    </div>
  )
}
