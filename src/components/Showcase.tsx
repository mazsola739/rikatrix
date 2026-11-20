import { useEffect } from 'react'
import { LINKS, MOUSE_EFFECT_NAMES, THEME_NAMES } from '../labels'
import { updateSettings, useSettings } from '../settings'

function Chips({ label, options, value, onChange }: { label: string; options: string[]; value: number; onChange: (v: number) => void }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      <span className="chips__label">{label}</span>
      {options.map((name, i) => (
        <button key={name} type="button" className="chip" aria-pressed={value === i} onClick={() => onChange(i)}>
          {name}
        </button>
      ))}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className="chip" aria-pressed={checked} onClick={() => onChange(!checked)}>
      {checked ? '✓ ' : ''}
      {label}
    </button>
  )
}

/**
 * The showcase page (GitHub Pages). The page background is the wallpaper itself,
 * running live, so visitors can try it before downloading.
 */
export function Showcase() {
  const settings = useSettings()

  // let visitors play with the mouse right away
  useEffect(() => {
    updateSettings({ mouseEffect: 1 })
  }, [])

  return (
    <div className="site">
      <header className="site__top">
        <a className="site__back" href={LINKS.portfolio}>
          ← mazsola739
        </a>
        <a className="site__link" href={LINKS.repo}>
          GitHub
        </a>
      </header>

      <main className="site__main">
        <section className="card hero">
          <h1>Rikatrix</h1>
          <p className="hero__tagline">
            Matrix rain for your Windows desktop, in pink, lavender and ice blue. With glitter, smoke veils and real
            sushi recipes falling down the screen.
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary" href={LINKS.download}>
              Download for Windows
            </a>
            <a className="btn" href="?demo">
              Full-screen demo
            </a>
          </div>
          <p className="hero__fine">Free · a single ~240 KB file · runs in Lively Wallpaper (also free)</p>
        </section>

        <section className="card">
          <h2>Try it right here</h2>
          <p>The background of this page is the wallpaper itself. Switch themes, move your mouse, click anywhere.</p>
          <Chips label="Theme" options={THEME_NAMES} value={settings.theme} onChange={(theme) => updateSettings({ theme })} />
          <Chips
            label="Mouse"
            options={MOUSE_EFFECT_NAMES}
            value={settings.mouseEffect}
            onChange={(mouseEffect) => updateSettings({ mouseEffect })}
          />
          <div className="chips" role="group" aria-label="Extras">
            <span className="chips__label">Extras</span>
            <Toggle label="Smoke veils" checked={settings.smoke} onChange={(smoke) => updateSettings({ smoke })} />
            <Toggle label="Sushi recipes" checked={settings.sushi} onChange={(sushi) => updateSettings({ sushi })} />
          </div>
        </section>

        <section className="card">
          <h2>Install in 3 steps</h2>
          <ol className="steps">
            <li>
              <b>Get Lively Wallpaper.</b> It's free in the Microsoft Store, see{' '}
              <a href={LINKS.lively}>rocksdanister.com/lively</a>.
            </li>
            <li>
              <b>Download</b> <a href={LINKS.download}>rikatrix.zip</a>.
            </li>
            <li>
              <b>Drag the zip into Lively</b> (or click + and pick it), then click Rikatrix to set it as your wallpaper.
              Its Customise menu has the theme, speed, mouse effect and the rest.
            </li>
          </ol>
        </section>

        <section className="card">
          <h2>What's inside</h2>
          <ul className="features">
            <li>
              <b>Four themes:</b> Blue Swirl, Midnight Swirl, Black Neon and Pink Dream.
            </li>
            <li>
              <b>Sushi recipes:</b> the original Matrix code was reportedly scanned from sushi cookbooks, so here the
              rain spells out real words in katakana, like マグロ, ワサビ and ゴハンニスヲイレル (add vinegar to the rice).
            </li>
            <li>
              <b>Mouse effects:</b> a spotlight that lights up the code, or an umbrella the rain flows around. Click for
              a splash.
            </li>
            <li>
              <b>Light on your PC:</b> one small file, with an adjustable frame rate.
            </li>
          </ul>
        </section>
      </main>

      <footer className="site__footer">
        Made by <a href={LINKS.portfolio}>mazsola739</a> · <a href={LINKS.repo}>Source on GitHub</a> · MIT license
      </footer>
    </div>
  )
}
