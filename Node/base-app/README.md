# Node.js 基础示例

这不是完整应用，只保留两个和笔记配套的最小实验。运行基线为 Node.js 24 LTS。

```bash
npm install
```

## CLI

`testCli.js` 展示：

- package `bin` 与 shebang。
- 使用 `import.meta.url` 读取与当前模块相邻的 `package.json`，不依赖 `process.cwd()`。
- Commander 的子命令和 Inquirer 的交互问题。
- 使用 `parseAsync()` 等待异步 action。

```bash
npm run cli -- create hello-node
```

也可以在本目录执行 `npm link` 后测试：

```bash
test-cli create hello-node
```

`npm link` 只适合本地开发验证，不是应用项目调用 CLI 的默认方式。

## 服务端 HTML 生成实验

`ssrDemo.js` 展示：

- 使用 Node.js 内置 `fetch` 获取 JSON。
- 检查 HTTP 状态、设置 timeout，并验证返回值的最小结构。
- 用 JSDOM 创建 DOM。
- 用 `node:fs/promises` 把 HTML 写到当前模块所在目录。

```bash
npm run ssr
```

该命令依赖外部 The Cat API，会更新 `ssrDemo.html`。仓库中的 HTML 只是某次运行快照。

这个例子是“在服务端生成 HTML”，不是完整 SSR 框架示例。实际 SSR 还涉及请求级状态、路由、数据加载、转义、hydration、缓存和错误处理。

## 文件说明

- `testCli.js`：CLI 入口。
- `ssrDemo.js`：HTML 生成脚本。
- `ssrDemo.html`：生成结果快照。
- `package.json`：脚本、`bin`、ESM 和 Node.js 版本约束。
