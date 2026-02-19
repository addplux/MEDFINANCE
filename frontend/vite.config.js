import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

/**
 * Custom Vite plugin that injects the list of built asset URLs
 * into sw.js after the build completes, so the Service Worker
 * can pre-cache ALL hashed JS/CSS files at install time.
 *
 * It prepends: self.__PRECACHE_ASSETS__ = [...urls];
 * to the top of dist/sw.js after the build.
 */
function injectSwAssets() {
  return {
    name: 'inject-sw-assets',
    closeBundle() {
      try {
        const manifestPath = resolve(__dirname, 'dist/.vite/manifest.json')
        const manifestPathLegacy = resolve(__dirname, 'dist/manifest.json')
        const swPath = resolve(__dirname, 'dist/sw.js')

        let manifest = null;
        try {
          manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
        } catch (e) {
          try {
            manifest = JSON.parse(readFileSync(manifestPathLegacy, 'utf-8'))
          } catch (e2) {
            console.warn('[inject-sw-assets] Manifest not found at .vite/manifest.json or manifest.json. Skipping SW injection.');
            return;
          }
        }

        // Collect all output asset URLs
        const assets = new Set(['/', '/index.html'])
        for (const entry of Object.values(manifest)) {
          if (entry.file) assets.add('/' + entry.file)
          if (entry.css) entry.css.forEach(f => assets.add('/' + f))
          if (entry.assets) entry.assets.forEach(f => assets.add('/' + f))
        }

        // Prepend the asset list assignment to sw.js
        if (require('fs').existsSync(swPath)) {
          const sw = readFileSync(swPath, 'utf-8')
          const injection = `self.__PRECACHE_ASSETS__ = ${JSON.stringify([...assets])};\n`
          writeFileSync(swPath, injection + sw)
          console.log(`[inject-sw-assets] Injected ${assets.size} assets into sw.js`)
        } else {
          console.warn('[inject-sw-assets] sw.js not found. Skipping injection.');
        }

      } catch (err) {
        console.warn('[inject-sw-assets] Could not inject assets:', err.message)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), injectSwAssets()],
  server: {
    port: 5180,
    strictPort: true,
  },
  build: {
    manifest: true,
  },
})
