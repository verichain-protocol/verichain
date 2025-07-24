import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import environment from 'vite-plugin-environment';
import dotenv from 'dotenv';

// Load environment variables from the root .env file
dotenv.config({ path: '../../.env' });

// Print loaded env vars for debugging
console.log('🔍 Environment Variables Debug:');
console.log('CANISTER_ID_AI_CANISTER:', process.env.CANISTER_ID_AI_CANISTER);
console.log('CANISTER_ID_LOGIC_CANISTER:', process.env.CANISTER_ID_LOGIC_CANISTER);
console.log('DFX_NETWORK:', process.env.DFX_NETWORK);

export default defineConfig({
  build: {
    emptyOutDir: true,
  },
  define: {
    // Explicitly define environment variables for the browser
    'import.meta.env.CANISTER_ID_AI_CANISTER': JSON.stringify(process.env.CANISTER_ID_AI_CANISTER),
    'import.meta.env.CANISTER_ID_LOGIC_CANISTER': JSON.stringify(process.env.CANISTER_ID_LOGIC_CANISTER),
    'import.meta.env.CANISTER_ID_FRONTEND': JSON.stringify(process.env.CANISTER_ID_FRONTEND),
    'import.meta.env.CANISTER_ID_INTERNET_IDENTITY': JSON.stringify(process.env.CANISTER_ID_INTERNET_IDENTITY),
    'import.meta.env.DFX_NETWORK': JSON.stringify(process.env.DFX_NETWORK),
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
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
