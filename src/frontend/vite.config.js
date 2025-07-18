import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import environment from 'vite-plugin-environment';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export default defineConfig({
  build: {
    emptyOutDir: true,
  },
  define: {
    global: "globalThis",
  },
  esbuild: {
    define: {
      global: "globalThis",
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
    environment("all", { prefix: "DEPLOY_" }),
    environment("all", { prefix: "NODE_" }),
    environment("all", { prefix: "FRONTEND_" }),
    environment("all", { prefix: "AI_" }),
    environment("all", { prefix: "MODEL_" }),
    environment("all", { prefix: "LOG_" }),
    environment("all", { prefix: "TEST_" }),
    environment("all", { prefix: "BATCH_" }),
    environment("all", { prefix: "MAX_" }),
    environment("all", { prefix: "INFERENCE_" }),
  ],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(
          new URL("../declarations", import.meta.url)
        ),
      },
    ],
    dedupe: ['@dfinity/agent'],
  },
});
