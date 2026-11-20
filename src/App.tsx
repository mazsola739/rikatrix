import { SettingsPanel } from './components/SettingsPanel'
import { Showcase } from './components/Showcase'
import { WallpaperCanvas } from './components/WallpaperCanvas'
import { useSettings } from './settings'

const params = new URLSearchParams(window.location.search)
// `npm run build:site` builds the showcase page; `?demo` there shows the bare wallpaper with the panel
const isSite = import.meta.env.MODE === 'site'
const showShowcase = isSite && !params.has('demo')
const showPanel = params.has('panel') || (isSite && params.has('demo'))

export default function App() {
  const settings = useSettings()
  return (
    <>
      <WallpaperCanvas settings={settings} />
      {showShowcase ? <Showcase /> : showPanel && <SettingsPanel />}
    </>
  )
}
