import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const ngrokHost = process.env.VITE_HMR_HOST;
  const isNgrok = ngrokHost && ngrokHost !== 'localhost';
  
  return {
    server: {
      host: "::",
      port: 8080,
      hmr: isNgrok ? false : true, // Disable HMR for ngrok to prevent websocket errors
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'codalabs.ngrok.io',
        'snapcoffee.xyz',
        '.ngrok.io', // Allow any ngrok subdomain
        '.ngrok-free.app', // Allow ngrok free domains
      ],
    },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
