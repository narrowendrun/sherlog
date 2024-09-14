import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/sherlog": {
        //for running on docker
        target: "http://backend:5000",
        //for running locally using npm run dev
        // target: "http://127.0.0.1:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sherlog/, "/sherlog"),
      },
    },
  },
  preview: {
    port: 3000,
    host: "0.0.0.0",
  },
});
