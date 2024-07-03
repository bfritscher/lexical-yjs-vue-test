import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: [{
      find: '@',
      replacement: fileURLToPath(new URL('./src', import.meta.url)),
    },
    ]
  },
  server: {
    proxy: {
      // Proxy websockets to ws://localhost:8080 for `npm run dev`
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true
      }
    }
  }
})
