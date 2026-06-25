import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


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

// @tinacms/cli's generated public/admin/index.html links its dev assets
// (e.g. /src/main.tsx) without the /admin base path that its own dev
// server (port 4001) actually serves them under, causing 404s. Serve a
// patched version on the fly instead of touching the regenerated file.
function tinaAdminBaseFix() {
  return {
    name: 'tina-admin-base-fix',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== '/admin' && req.url !== '/admin/' && req.url !== '/admin/index.html') {
          return next()
        }
        const filePath = path.resolve(__dirname, 'public/admin/index.html')
        if (!fs.existsSync(filePath)) return next()
        const html = fs
          .readFileSync(filePath, 'utf-8')
          .replace(
            /(localhost:\d+)\/(@react-refresh|@vite\/client|src\/main\.tsx)/g,
            '$1/admin/$2'
          )
        res.setHeader('Content-Type', 'text/html')
        res.end(html)
      })
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
    tinaAdminBaseFix(),
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
