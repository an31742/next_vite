import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import path from "path"
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { ElementPlusResolver } from "unplugin-vue-components/resolvers"
import vueJsx from "@vitejs/plugin-vue-jsx"
import wasm from 'vite-plugin-wasm';

const API_PROXY_TARGET = process.env.VITE_API_PROXY || "http://localhost:9527"

export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
  },
  plugins: [
    wasm(),
    vue(),
    vueJsx(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    // ElementPlus()
  ],
  //配置别名
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@views": path.resolve(__dirname, "./src/views"),
      "@assets": path.resolve(__dirname, "./src/assets"),
    },
    extensions: [".vue", ".js", ".ts"],
  },
  // css:{
  //preprocessorOptions:{
  //scss:{
  //  additionalData:'@import "@/assets/style/main.scss";'
  // }
  //}
  // },
  //配置跨域代理
  server: {
    // 配置前端服务地址和端口
    //服务器主机名
    host: "0.0.0.0",
    //端口号
    port: 3088,
    //设为 true 时若端口已被占用则会直接退出，而不是尝试下一个可用端口
    strictPort: false,
    //服务器启动时自动在浏览器中打开应用程序,当此值为字符串时，会被用作 URL 的路径名
    open: true,
    //自定义代理规则
    proxy: {
      "/api": {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
})
