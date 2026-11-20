# Rikatrix – an animated Windows wallpaper

![Rikatrix](site-public/preview.jpg)

**[Try it live](https://mazsola739.github.io/rikatrix/)** ·
**[Download for Windows](https://github.com/mazsola739/rikatrix/releases/latest/download/rikatrix.zip)** ·
made by [mazsola739](https://mazsola739.github.io/mazsola739/)

Matrix rain in a blue paint swirl. Each stream runs in a single color (pink, lavender or
ice blue), colorful smoke veils can drift behind it, and glitter twinkles in the background.
And just like in the original Matrix, sushi recipes are falling down the screen 🍣

There are four themes: Blue Swirl, Midnight Swirl, Black Neon (glowing pink, cyan and violet
streams on pitch black) and Pink Dream (white, deep violet and dark rose rain on a pink swirl).

Built with React + canvas. It becomes a desktop wallpaper through
[Lively Wallpaper](https://www.rocksdanister.com/lively/).

**Mouse effect** (off by default, pick one of two):
- **Spotlight:** the code lights up around the pointer, as if you were shining a flashlight on it.
- **Umbrella:** the rain flows around the pointer, like water around a stone.

With either one on, the pointer leaves a sparkle trail, the smoke veils move out of its way,
and clicking makes a splash with ripple rings.

## Preview in the browser

```bash
npm install
npm run dev
```

Then open <http://localhost:5199/?panel>. `?panel` also shows a settings panel where you can
change everything live.

Settings can also go in the URL, for example `?theme=2&speed=12`.

## Installing in Lively

1. Install **Lively Wallpaper** from the Microsoft Store (free).
2. Build the package:

   ```bash
   npm run package
   ```

   This creates `rikatrix.zip` in the project folder.
3. In the Lively window, click the **+** (add wallpaper) button and pick the zip file, or just
   drag the zip onto the Lively window.
4. Click the wallpaper in the library to set it on your desktop.
5. The settings are in the wallpaper's **Customise** menu.

If the wallpaper doesn't react to the mouse, set the wallpaper input to mouse in Lively's
settings. The exact menu name can differ a little between versions.

### Live on the desktop while developing

While `npm run dev` is running, you can also give Lively a URL with the **+** button:
`http://localhost:5199`. Your desktop then updates every time you save.
Lively's Customise panel doesn't work in this mode; put the settings in the URL instead.

## Showcase page

The page at <https://mazsola739.github.io/rikatrix/> is built from the same code: the wallpaper
runs live in the background, with the download button, install steps and theme switches on top.

```bash
npm run dev:site
```

That runs it at <http://localhost:5200/>; `?demo` shows the bare wallpaper with the settings panel.
Every push to `main` deploys it to GitHub Pages (`.github/workflows/pages.yml`).

## Releasing a new version

```bash
git tag v1.0.1
```

```bash
git push origin v1.0.1
```

The release workflow (`.github/workflows/release.yml`) builds `rikatrix.zip` and attaches it to a
GitHub release. The download link always points at the latest release, so it never has to change.

## Settings

| Key            | What it does                                                    | Default |
| -------------- | --------------------------------------------------------------- | ------- |
| `theme`        | 0 = Blue Swirl, 1 = Midnight Swirl, 2 = Black Neon, 3 = Pink Dream | 1    |
| `glyphSize`    | glyph size in pixels (12–36)                                    | 15      |
| `speed`        | fall speed (1–20)                                               | 3       |
| `sparkleShare` | what % of glyphs are sparkles, bubbles and spirals              | 35      |
| `smoke`        | colorful smoke veils                                            | false   |
| `sushi`        | sushi words and recipe steps in the rain                        | true    |
| `mouseEffect`  | mouse effect: 0 = off, 1 = spotlight, 2 = umbrella              | 0       |
| `fps`          | frames per second (15–60), lower = less load                    | 60      |

The same keys are in `public/LivelyProperties.json`. If you add a new one, add it in both
places (and in `src/settings.ts`).

## The sushi recipes

The designer of the Matrix code reportedly scanned the glyphs from his wife's Japanese
cookbooks – sushi recipes. In Rikatrix the rain spells out real words from time to time in
half-width katakana, read top to bottom and mirrored like in the film: スシ (sushi),
マグロ (tuna), サーモン (salmon), ワサビ, ショウユ (soy sauce), ノリ, ゴハン (rice), ニギリ,
マキ, エビ (shrimp), タマゴ (egg), イクラ (salmon roe), ガリ (pickled ginger), キュウリ (cucumber),
アボカド (avocado). Recipe steps too: ゴハンニスヲイレル ("add vinegar to the rice"),
ノリデマク ("roll it up in nori"), ワサビヲヌル ("spread on the wasabi").
You can extend the list in `src/engine/sprites.ts`.

## How it's built

- `src/settings.ts`: the settings store. This is where `window.livelyPropertyListener` lives,
  which Lively calls when you change something in the Customise panel.
- `src/components/`: the React part. `WallpaperCanvas` creates the engine, `SettingsPanel` is
  the preview panel, `Showcase` is the showcase page.
- `src/labels.ts`: theme and mouse effect names, and the download, repo and portfolio links.
- `src/engine/`: the drawing, plain TypeScript, independent of React.
  - `palette.ts`: the themes (background, smoke, and each theme's own rain colors) and the
    marbled background. Add new themes to the `THEMES` list here.
  - `smoke.ts`: the smoke veils, drawn at quarter resolution and blurred so they stay cheap.
  - `glitter.ts`: the glitter twinkling in the background.
  - `sprites.ts`: pre-renders the glyphs into images, so at runtime they're only copied.
    The sushi word list is here too.
  - `rain.ts`: the Matrix rain columns and the mouse effects (spotlight, umbrella).
  - `particles.ts`: sparkle trail and splash.
  - `wallpaper.ts`: ties everything together and runs the render loop.
- `vite.config.ts`: the build puts everything into a single `index.html`. That's needed because
  Lively loads the page as a local file (`file://`), and from there the browser won't load
  JavaScript modules from separate files.
- `public/`: goes into the Lively package. `LivelyInfo.json` is the wallpaper's name, author,
  description and link in the Lively library, `thumbnail.jpg` its picture there.
- `site-public/`: goes onto the showcase page (`preview.jpg` is the image shown when the link is
  shared).
