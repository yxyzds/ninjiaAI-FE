import { defineConfig } from "vite";
import svgLoader from "vite-svg-loader";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  //本地开发测试
  server: {
    host: "0.0.0.0", // 允许所有地址连接，包括127.0.0.1和自定义域名
  },
  define: {
    "process.env.VITE_API_URL": JSON.stringify(process.env.VITE_API_URL),
  },
  plugins: [react(), svgLoader()],
});
