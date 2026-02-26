import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/ceadevws': {
        target: 'https://appcea.ceaqueretaro.gob.mx',
        changeOrigin: true,
        secure: false,
      },
      '/aquacis-cea': {
        target: 'https://aquacis-cf-int.ceaqueretaro.gob.mx/Comercial',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => path.replace(/^\/aquacis-cea/, ''),
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
