import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import type { Plugin } from "vite"
import mockjs from "mockjs"
import url from "node:url"

// 简单写一个vite插件，模拟后端接口
const viteMockServe = (): Plugin => {
  return {
    name: "vite-mock-serve",
    configureServer(server) {
      server.middlewares.use("/api/list", (req, res) => {
        res.setHeader("Content-Type", "application/json")
        const parseUrl = url.parse(req.originalUrl!, true).query
        const data = mockjs.mock({
          code: 0,
          "list|5-10": [
            {
              "id|+1": 1,
              name: parseUrl.keyword,
              "age|18-60": 1,
            },
          ],
        })
        res.end(JSON.stringify(data))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteMockServe()],
})
