import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


const PLAUSIBLE_SRC = 'https://plausible.io/js/script.file-downloads.outbound-links.js'
const PLAUSIBLE_DOMAIN = 'venturelabs.team'
const PLAUSIBLE_QUEUE_STUB =
  'window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}'

/**
 * Injects the hosted (cookieless) Plausible tag into the built shell.
 * scripts/prerender.ts clones dist/index.html into one shell per route, so
 * injecting here puts the tag on every route without a second head mechanism.
 *
 * apply: 'build' keeps the tag out of `pnpm dev`. The CONTEXT check keeps it
 * out of Netlify deploy previews and branch deploys, so preview traffic can
 * never land in the production stats of data-domain venturelabs.team.
 * CONTEXT is unset for a local `pnpm build`, so local builds do carry the tag.
 */
function plausiblePlugin() {
  return {
    name: 'plausible-analytics',
    apply: 'build' as const,
    transformIndexHtml() {
      const context = process.env.CONTEXT
      if (context === 'deploy-preview' || context === 'branch-deploy') return []

      return [
        {
          tag: 'script',
          injectTo: 'head' as const,
          attrs: { defer: true, 'data-domain': PLAUSIBLE_DOMAIN, src: PLAUSIBLE_SRC },
        },
        {
          tag: 'script',
          injectTo: 'head' as const,
          children: PLAUSIBLE_QUEUE_STUB,
        },
      ]
    },
  }
}


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}


export default defineConfig({
  server: {
    // Bind both IPv4 and IPv6 loopback — on some systems "localhost" only
    // resolves to one of them, which otherwise causes ERR_CONNECTION_REFUSED.
    host: '0.0.0.0',
  },
  plugins: [
    figmaAssetResolver(),
    plausiblePlugin(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
