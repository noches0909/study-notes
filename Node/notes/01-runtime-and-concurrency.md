# 运行时、并发模型与现代能力

## Node.js 到底是什么

Node.js 是一个跨平台的 JavaScript 运行时，核心由 V8、Node.js 的 JavaScript/C++ 绑定、libuv 以及一组内置模块组成。它不是编程语言，也不是 Web 框架。

- JavaScript/TypeScript 是语言。
- Node.js、Bun 和 Deno 是不同的 JavaScript 运行时。
- Express、Fastify、NestJS 是运行在 Node.js 上的 Web 框架。
- npm 是随 Node.js 常见安装方式一起提供的包管理工具，但不是 Node.js 运行时本身。

现代 Node.js 可以直接运行一部分 `.ts` 文件，但本质是移除可擦除的类型语法；它不会做类型检查，也不会读取 `tsconfig.json` 完成路径别名或降级编译。详见[模块与 TypeScript](03-modules-and-typescript.md)。

## “Node.js 是单线程”为什么不准确

更准确的心智模型是：**一个普通 Node.js 实例通常在一个主 JavaScript 线程上运行一个事件循环，但整个运行时并非只有一个线程。**

一次常见 I/O 请求会经过这些角色：

1. 主 JavaScript 线程执行同步代码、注册异步操作和运行回调。
2. 网络 I/O 通常由操作系统的异步机制通知事件循环。
3. 部分文件系统、DNS、`crypto`、`zlib` 操作会进入 libuv Worker Pool。
4. 操作完成后，相应回调或 Promise continuation 回到 JavaScript 线程执行。

因此：

- `async` 不等于“自动新建线程”。
- 异步 API 也可能占满 libuv Worker Pool。
- 回调、`Promise.then()` 和 `await` 之后的 JavaScript 仍可能阻塞事件循环。
- CPU 密集型 JavaScript 应考虑 `worker_threads`、独立进程或独立服务，而不是指望 `await` 解决。

参考：[Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)、[`worker_threads`](https://nodejs.org/docs/latest-v24.x/api/worker_threads.html)。

## I/O 密集与 CPU 密集怎么选

| 工作负载 | 默认选择 | 原因 |
| --- | --- | --- |
| HTTP API、数据库、远程模型调用 | 异步 API + 事件循环 | 大量时间在等待 I/O，Node.js 很擅长协调高并发等待 |
| 文件读取、压缩、密码派生 | 对应的异步内置 API | 通常由 OS 或 libuv Worker Pool 处理；仍需限制并发 |
| 大型 JSON 解析、复杂正则、大循环 | 分片、限制输入或 `worker_threads` | 这些 JavaScript 会直接占用事件循环 |
| 图像/音视频转码 | 调用 FFmpeg 等专用程序或独立服务 | 成熟工具更适合重计算；通过 `spawn` 管理流和退出码 |
| 多核并行 JavaScript 计算 | Worker Pool（应用层自行管理） | `worker_threads` 可并行执行 JavaScript，并可传输或共享内存 |
| 需要故障隔离的任务 | `child_process` 或独立服务 | 进程有独立内存和生命周期 |
| 同端口运行多个 Node.js 进程 | `cluster`、进程管理器或容器编排 | 利用多个 CPU 核心处理服务请求 |

不要为每个请求临时创建 Worker 或子进程；创建池并设置队列上限。对多数 I/O 密集任务，Node.js 自带的异步 API 比 Worker 更合适。

## Node.js 适合做什么

与 Node.js 直接相关的常见场景：

- Web API、BFF、网关、SSR 服务和实时通信服务。
- CLI、构建工具、代码生成器和自动化脚本。
- 队列消费者、定时任务和 Serverless/Edge 之外的普通服务进程。
- 爬取与浏览器自动化；Puppeteer 的准确定位首先是浏览器自动化工具。
- Electron 主进程及大量前端工程工具。
- AI 应用的 API 层、流式响应、工具调用编排、RAG 与异步任务。

容易混淆的边界：

- React Native 应用本身不是运行在 Node.js 上，只是开发工具链常使用 Node.js。
- Tauri 的应用后端核心是 Rust，不应归类为 Node.js 桌面运行时。
- Docker、Jenkins、ClamAV、FFmpeg 是独立工具；Node.js 可以调用或集成它们，但它们不是 Node.js 技术。

## 安装与版本管理

学习和生产默认安装 Node.js 24 LTS。可以使用官方安装包，也可以使用 `nvm`、Volta、`fnm` 等版本管理工具；选择哪一个不如“项目固定版本且团队一致”重要。

```bash
node --version
npm --version
```

建议在项目中声明最低运行版本：

```json
{
  "engines": {
    "node": ">=24"
  }
}
```

`engines` 默认主要是元数据和兼容性提示，不要把它误认为所有环境都会强制拦截。CI 和部署环境仍应显式选择 Node.js 版本。

## 全局对象与运行位置

Node.js 没有浏览器的 `window` 和 DOM，但拥有 `globalThis`、`process`、`Buffer`、计时器等全局能力。现代版本还提供浏览器兼容的 `fetch`、`Request`、`Response`、`Headers`、`FormData`、Web Streams、`AbortController` 和 `WebSocket` 客户端。

`globalThis` 是跨 JavaScript 环境访问全局对象的标准名称；在 Node.js 中它引用 Node.js 的全局对象，并不是运行时动态“选择一个关键字”。模块顶层声明也不会自动成为它的属性。

### 当前工作目录不等于当前模块目录

```js
console.log(process.cwd())     // 启动进程时所在的目录，可以被 process.chdir() 改变
console.log(import.meta.dirname) // 当前 ESM 文件所在目录，Node.js 22.16+/24+
console.log(import.meta.filename) // 当前 ESM 文件的绝对路径
```

CommonJS 才有 `__dirname` 和 `__filename`。读取“与当前模块放在一起”的文件时应基于模块目录，而不是假设进程从项目根目录启动：

```js
import { readFile } from "node:fs/promises"

const configUrl = new URL("./config.json", import.meta.url)
const config = JSON.parse(await readFile(configUrl, "utf8"))
```

参考：[`process.cwd()`](https://nodejs.org/docs/latest-v24.x/api/process.html#processcwd)、[`import.meta`](https://nodejs.org/docs/latest-v24.x/api/esm.html#importmeta)。

## 这两年值得知道的内置能力

以 Node.js 24 LTS 为基线：

- `fetch`、Web Streams、`FormData` 等常用 Web API 已稳定；普通 HTTP 客户端不一定需要 Axios。
- 全局 `WebSocket` 客户端已稳定，但 Node.js 没有因此内置 WebSocket 服务端。
- `node:test` 是稳定的测试运行器，适合零依赖测试；复杂生态仍可选择 Vitest/Jest。
- `node --watch app.js` 已稳定，简单项目不一定需要 Nodemon。
- `node --env-file=.env app.js` 可以加载环境变量；`.env` 仍不能提交秘密。
- Permission Model 已稳定，但官方把它定位为降低可信代码误操作的“安全带”，不是对恶意代码的沙箱。
- Node.js 24 已稳定支持直接运行仅含可擦除类型语法的 TypeScript。
- `node:sqlite` 在 Node.js 24.19 中仍是 Release candidate；学习可以试用，生产采用前需核对目标 Node.js 小版本与限制。

不要只因为某个 API “内置”就必须使用它。选型仍取决于兼容范围、团队能力、功能深度和生态要求。

## 参考资料

- [Node.js Releases](https://nodejs.org/en/about/previous-releases)
- [Node.js globals](https://nodejs.org/docs/latest-v24.x/api/globals.html)
- [Node.js TypeScript support](https://nodejs.org/docs/latest-v24.x/api/typescript.html)
- [Node.js test runner](https://nodejs.org/docs/latest-v24.x/api/test.html)
- [Node.js CLI](https://nodejs.org/docs/latest-v24.x/api/cli.html)
- [Node.js Permission Model](https://nodejs.org/docs/latest-v24.x/api/permissions.html)
