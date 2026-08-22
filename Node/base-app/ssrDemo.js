import { writeFile } from "node:fs/promises"
import { JSDOM } from "jsdom"

const apiUrl = new URL("https://api.thecatapi.com/v1/images/search")
apiUrl.searchParams.set("limit", "10")
apiUrl.searchParams.set("page", "1")

const response = await fetch(apiUrl, {
  signal: AbortSignal.timeout(10_000),
})

if (!response.ok) {
  throw new Error(`The Cat API 返回 HTTP ${response.status}`)
}

const data = await response.json()
if (!Array.isArray(data)) {
  throw new TypeError("The Cat API 返回了非数组数据")
}

const dom = new JSDOM(
  "<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><title>Cat images</title></head><body><main id=\"app\"></main></body></html>",
)
const app = dom.window.document.getElementById("app")

for (const item of data) {
  if (typeof item?.url !== "string") continue

  const img = dom.window.document.createElement("img")
  img.src = item.url
  img.alt = "由 The Cat API 返回的猫咪图片"
  img.loading = "lazy"
  app.appendChild(img)
}

const outputUrl = new URL("./ssrDemo.html", import.meta.url)
await writeFile(outputUrl, dom.serialize(), "utf8")
console.log(`已生成 ${outputUrl.pathname}`)
