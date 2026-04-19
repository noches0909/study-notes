import { JSDOM } from "jsdom"
import fs from "fs"
const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`)

fetch("https://api.thecatapi.com/v1/images/search?limit=10&page=1")
  .then((res) => res.json())
  .then((data) => {
    const app = dom.window.document.getElementById("app")
    data.forEach((item) => {
      const img = dom.window.document.createElement("img")
      img.src = item.url
      app.appendChild(img)
    })
    fs.writeFileSync("Node/base-app/ssrDemo.html", dom.serialize())
    // 对象转为字符串输出
    // console.log(dom.serialize())
  })
