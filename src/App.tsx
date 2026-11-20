import { SettingsPanel } from './components/SettingsPanel'
import { Showcase } from './components/Showcase'
import { WallpaperCanvas } from './components/WallpaperCanvas'
import { useSettings } from './settings'

// `npm run build:site` builds the showcase page (it handles its own full-screen demo);
// the wallpaper build shows the settings panel only with `?panel`
const isSite = import.meta.env.MODE === 'site'
const showPanel = !isSite && new URLSearchParams(window.location.search).has('panel')

export default function App() {
  const settings = useSettings()
  return (
    <>
      <WallpaperCanvas settings={settings} />
      {isSite ? <Showcase /> : showPanel && <SettingsPanel />}
    </>
  )
}
