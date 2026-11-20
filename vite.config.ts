import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const asText = (source: string | Uint8Array) =>
  typeof source === 'string' ? source : new TextDecoder().decode(source)

/**
 * Lively (and Wallpaper Engine) load the wallpaper from a file:// URL. From there the browser
 * refuses, because of CORS, to run a `type="module"` script loaded from a separate file, so
 * after the build the JS and CSS are inlined into index.html. dist/ ends up as one HTML file.
 */
function inlineIntoHtml(): Plugin {
  return {
    name: 'rika:inline-into-html',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const htmlFile = bundle['index.html']
      if (!htmlFile || htmlFile.type !== 'asset') return
      let html = asText(htmlFile.source)

      for (const [fileName, file] of Object.entries(bundle)) {
        const name = escapeRegExp(fileName)
        if (file.type === 'chunk') {
          const tag = new RegExp(`<script[^>]*src="[^"]*${name}"[^>]*></script>`)
          if (!tag.test(html)) continue
          // a "</script" inside the code would close the script tag too early
          const code = file.code.replace(/<\/script/gi, '<\\/script')
          html = html.replace(tag, () => `<script type="module">\n${code}</script>`)
          delete bundle[fileName]
        } else if (fileName.endsWith('.css')) {
          const tag = new RegExp(`<link[^>]*href="[^"]*${name}"[^>]*>`)
          if (!tag.test(html)) continue
          html = html.replace(tag, () => `<style>\n${asText(file.source)}</style>`)
          delete bundle[fileName]
        }
      }

      htmlFile.source = html
    },
  }
}

/**
 * The showcase's display font (Share Tech Mono, SIL OFL, in site-public/fonts/) starts loading
 * with the HTML itself instead of after the JavaScript, so the text never swaps fonts mid-load.
 * Only the site build gets it; the wallpaper never needs the file.
 */
function siteFont(): Plugin {
  const href = './fonts/share-tech-mono.woff2'
  return {
    name: 'rika:site-font',
    transformIndexHtml: () => [
      { tag: 'link', attrs: { rel: 'preload', href, as: 'font', type: 'font/woff2', crossorigin: '' }, injectTo: 'head' },
      {
        tag: 'style',
        children: `@font-face{font-family:'Share Tech Mono';src:url(${href}) format('woff2');font-display:block}`,
        injectTo: 'head',
      },
    ],
  }
}

/**
 * Two builds from one codebase:
 * - default: the Lively wallpaper → dist/ (one self-contained index.html + Lively files)
 * - `--mode site`: the showcase page for GitHub Pages → dist-site/
 */
export default defineConfig(({ mode }) => {
  if (mode === 'site') {
    return {
      base: './',
      plugins: [react(), siteFont()],
      publicDir: 'site-public',
      server: { port: 5200, strictPort: true },
      build: { outDir: 'dist-site' },
    }
  }
  return {
    base: './',
    plugins: [react(), inlineIntoHtml()],
    // a fixed port of its own, so the dev URL you give Lively never changes
    server: { port: 5199, strictPort: true },
    build: {
      modulePreload: false,
      cssCodeSplit: false,
      assetsInlineLimit: 100_000_000,
    },
  }
})
