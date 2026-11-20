import { useEffect, type ReactNode } from 'react'
import { THEMES } from '../engine/palette'
import { LINKS, MOUSE_EFFECT_NAMES, THEME_NAMES } from '../labels'
import { updateSettings, useSettings } from '../settings'
import { Demo, useDemo } from './Demo'
import './showcase.css'

const FONT_URL = 'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@500;700;800&display=swap'

/** The headings use a rounded Japanese font. It's loaded here, so only the showcase fetches it, never the wallpaper. */
function useShowcaseFont() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_URL}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONT_URL
    document.head.append(link)
  }, [])
}

function WindowsIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path fill="currentColor" d="M0 0h7.5v7.5H0zM8.5 0H16v7.5H8.5zM0 8.5h7.5V16H0zM8.5 8.5H16V16H8.5z" />
    </svg>
  )
}

/** Theme picker: a small tile per theme, its background with three streaks of its rain colors. */
function ThemeSwatches({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="swatches" role="group" aria-label="Theme">
      {THEMES.map((theme, i) => (
        <button
          key={THEME_NAMES[i]}
          type="button"
          className="swatch"
          aria-pressed={value === i}
          onClick={() => onChange(i)}
        >
          <span className="swatch__tile" style={{ background: `linear-gradient(135deg, ${theme.stops.join(', ')})` }}>
            {theme.trails.map((trail) => (
              <span
                key={trail.stages[2]}
                className="swatch__drop"
                style={{ background: trail.stages[2], boxShadow: `0 0 8px ${trail.glow}` }}
              />
            ))}
          </span>
          <span className="swatch__name">{THEME_NAMES[i]}</span>
        </button>
      ))}
    </div>
  )
}

function Segmented({ label, options, value, onChange }: { label: string; options: string[]; value: number; onChange: (v: number) => void }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((name, i) => (
        <button key={name} type="button" aria-pressed={value === i} onClick={() => onChange(i)}>
          {name}
        </button>
      ))}
    </div>
  )
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="switch" onClick={() => onChange(!checked)}>
      <span className="switch__track">
        <span className="switch__thumb" />
      </span>
      {label}
    </button>
  )
}

const FEATURES: { icon: string; title: string; text: ReactNode }[] = [
  {
    icon: '✦',
    title: 'Four themes',
    text: 'Blue Swirl, Midnight Swirl, Black Neon and Pink Dream, each with its own rain colors.',
  },
  {
    icon: '寿',
    title: 'Sushi recipes',
    text: (
      <>
        The original Matrix code was reportedly scanned from sushi cookbooks, so this rain spells out real sushi words
        in katakana: マグロ (tuna), ワサビ, ゴハンニスヲイレル (add vinegar to the rice).
      </>
    ),
  },
  {
    icon: '◎',
    title: 'Mouse effects',
    text: 'A spotlight that lights up the code, or an umbrella the rain flows around. Click for a splash.',
  },
  {
    icon: '軽',
    title: 'Light on your PC',
    text: 'One small file with an adjustable frame rate, and Lively can pause it while a game or video runs full screen.',
  },
]

const STEPS: { title: string; text: ReactNode }[] = [
  {
    title: 'Get Lively Wallpaper',
    text: (
      <>
        It's free in the Microsoft Store, see <a href={LINKS.lively}>rocksdanister.com/lively</a>.
      </>
    ),
  },
  {
    title: 'Download Rikatrix',
    text: (
      <>
        <a href={LINKS.download}>rikatrix.zip</a>, about 100 KB.
      </>
    ),
  },
  {
    title: 'Drop it into Lively',
    text: 'Drag the zip onto Lively and click it. Its Customise menu has the theme, speed and the rest.',
  },
]

/**
 * The showcase page (GitHub Pages). The page background is the wallpaper itself,
 * running live, so visitors can try it before downloading.
 */
export function Showcase() {
  const settings = useSettings()
  const { demo, enterDemo, exitDemo } = useDemo()
  useShowcaseFont()

  // let visitors play with the mouse right away
  useEffect(() => {
    updateSettings({ mouseEffect: 1 })
  }, [])

  if (demo) return <Demo onExit={exitDemo} />

  return (
    <div className="site">
      <nav className="nav">
        <a className="pill" href={LINKS.portfolio}>
          ← mazsola739
        </a>
        <a className="pill" href={LINKS.repo}>
          GitHub
        </a>
      </nav>

      <header className="hero">
        <div className="hero__inner">
          <p className="eyebrow">リカトリクス · animated wallpaper for Windows</p>
          <h1 className="hero__title">
            <span>Rika</span>trix
          </h1>
          <p className="hero__tagline">
            Matrix rain for your desktop, in pink, lavender and ice blue. With glitter, smoke veils and real sushi
            recipes falling down the screen.
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary" href={LINKS.download}>
              <WindowsIcon /> Download for Windows
            </a>
            <a
              className="btn btn--ghost"
              href="?demo"
              onClick={(e) => {
                e.preventDefault()
                enterDemo()
              }}
            >
              ⛶ Full-screen demo
            </a>
          </div>
          <ul className="badges" aria-label="Details">
            <li>Free</li>
            <li>~100 KB download</li>
            <li>MIT license</li>
            <li>Runs in Lively Wallpaper</li>
          </ul>
        </div>
        <a className="scroll-cue" href="#try">
          Try it below ↓
        </a>
      </header>

      <main className="sections">
        <section id="try" className="glass try">
          <div className="section-head">
            <h2>Try it right here</h2>
            <p>This whole page is the wallpaper. Change it, move your mouse, click anywhere.</p>
          </div>
          <ThemeSwatches value={settings.theme} onChange={(theme) => updateSettings({ theme })} />
          <div className="try__row">
            <div className="try__group">
              <span className="try__label">Mouse</span>
              <Segmented
                label="Mouse effect"
                options={MOUSE_EFFECT_NAMES}
                value={settings.mouseEffect}
                onChange={(mouseEffect) => updateSettings({ mouseEffect })}
              />
            </div>
            <div className="try__group">
              <span className="try__label">Extras</span>
              <Switch label="Smoke veils" checked={settings.smoke} onChange={(smoke) => updateSettings({ smoke })} />
              <Switch label="Sushi recipes" checked={settings.sushi} onChange={(sushi) => updateSettings({ sushi })} />
            </div>
          </div>
        </section>

        <section className="features" aria-label="Features">
          {FEATURES.map((f) => (
            <article key={f.title} className="glass feature">
              <span className="feature__icon" aria-hidden="true">
                {f.icon}
              </span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </section>

        <section className="glass install">
          <h2>Install in three steps</h2>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="step">
                <span className="step__num">0{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="cta">
          <h2>Ready for some rain?</h2>
          <a className="btn btn--primary btn--big" href={LINKS.download}>
            <WindowsIcon /> Download for Windows
          </a>
        </section>
      </main>

      <footer className="footer">
        Made by <a href={LINKS.portfolio}>mazsola739</a> · <a href={LINKS.repo}>Source on GitHub</a> · MIT license
      </footer>
    </div>
  )
}
