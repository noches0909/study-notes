# 异步编程、事件循环与流

## 异步不等于并行

```js
async function calculate() {
  // 这里的大循环依然在主 JavaScript 线程执行
  let sum = 0
  for (let i = 0; i < 1_000_000_000; i += 1) sum += i
  return sum
}
```

给函数加上 `async` 只会让它返回 Promise，不会把同步计算移到后台线程。判断代码是否阻塞，关键看它实际调用的 API 和每段 JavaScript 的执行成本。

异步设计的目标通常是：发起 I/O 后让事件循环继续处理其他工作，待结果就绪再恢复逻辑。

```js
import { readFile } from "node:fs/promises"

try {
  const text = await readFile(new URL("./data.txt", import.meta.url), "utf8")
  console.log(text)
} catch (error) {
  console.error("读取失败", error)
}
```

## 事件循环的实用心智模型

libuv 的事件循环包含这些主要阶段：

1. `timers`：到期的 `setTimeout`/`setInterval` 回调。
2. `pending callbacks`：部分延迟到下一轮的系统 I/O 回调。
3. `idle, prepare`：Node.js/libuv 内部使用。
4. `poll`：获取新的 I/O 事件并运行相应回调。
5. `check`：`setImmediate` 回调。
6. `close callbacks`：部分句柄关闭事件。

从 libuv 1.45（Node.js 20）开始，每轮事件循环中的 timers 改为在 poll 之后运行；为兼容旧行为，进入事件循环前仍可能先运行一次。这会影响某些 `setImmediate` 与 timer 的边界顺序。理解阶段用途即可，不应把某段依赖细微时序的输出背成永恒规则。

每次执行 JavaScript 回调后，Node.js 还会处理 `process.nextTick` 队列与 Promise/`queueMicrotask` 微任务。它们不应该粗暴塞进“六个宏任务阶段”中的某一个。

```js
console.log("sync")

setTimeout(() => console.log("timeout"), 0)
setImmediate(() => console.log("immediate"))
queueMicrotask(() => console.log("microtask"))

console.log("sync end")
```

能稳定依赖的是同步输出先于异步回调、当前任务结束后会处理微任务；在主模块顶层，不要假设 `setTimeout(..., 0)` 与 `setImmediate()` 永远固定谁先。放在 I/O 回调中时，`setImmediate()` 通常会在下一轮 timers 之前进入 check 阶段。

### `process.nextTick` 要克制

`process.nextTick()` 会在事件循环继续前安排回调。递归塞入 nextTick 会让 I/O 得不到机会，造成 starvation。普通业务优先 Promise/`queueMicrotask`，只有确实需要 Node.js 特定时序时再使用 nextTick。

## `fs.readFile` 与 `setImmediate` 没有业务契约

原笔记把下面的“常见输出”当成确定顺序：

```js
fs.readFile("./index.txt", callback)
setImmediate(immediateCallback)
```

文件 I/O 是否已经完成受操作系统、缓存、线程池和运行上下文影响。`setImmediate` 进入 check 阶段，文件回调常在后续 poll 阶段被处理，但业务逻辑不应依赖二者竞速。真正有顺序要求时使用 `await`、回调嵌套或明确的 Promise 组合表达依赖。

## Promise 并发不等于无限并发

```js
const results = await Promise.all(urls.map((url) => fetch(url)))
```

`Promise.all` 会立即发起所有映射任务。几千个 URL 可能打爆连接池、下游限额、内存或 libuv Worker Pool。生产代码需要并发上限、超时、重试预算和背压。

- `Promise.all`：任一失败就拒绝，适合必须全部成功。
- `Promise.allSettled`：收集全部结果，适合批处理汇总。
- 串行 `for...of + await`：有顺序要求或并发必须为 1。
- 有限并发队列：大批量任务的默认选择。

重试只适合暂时性失败和幂等操作；使用指数退避与 jitter，并限制总次数/总时长。

## 取消与超时

现代 Node.js API 广泛支持 `AbortSignal`。超时不仅是给用户返回错误，还应尽可能取消底层工作：

```js
const response = await fetch("https://example.com/data", {
  signal: AbortSignal.timeout(5_000),
})

if (!response.ok) {
  throw new Error(`HTTP ${response.status}`)
}
```

组合上游取消与本地超时可用 `AbortSignal.any()`。捕获错误时区分主动取消、超时、网络错误和 HTTP 非 2xx；`fetch` 遇到 404/500 不会自动 reject。

## EventEmitter

`EventEmitter` 是 Node.js 大量核心 API 的基础。监听器在 `emit()` 时会**同步**、按注册顺序调用：

```js
import { EventEmitter } from "node:events"

const bus = new EventEmitter()
bus.on("order.created", (order) => {
  console.log(order.id)
})
bus.emit("order.created", { id: "o_1" })
```

默认同一事件添加超过 10 个监听器会出现可能内存泄漏的警告；这不是“最多只能监听 10 个”的硬限制。不要直接调大上限掩盖重复注册问题。

对普通 `EventEmitter`，未监听的 `error` 事件会导致异常并终止进程。对资源型对象还应在结束、取消或断开时移除监听器。

Promise、WebSocket、消息队列不能笼统地说成 EventEmitter 的“现代替代品”：

- Promise 表达一次异步结果。
- EventEmitter 表达进程内多次事件。
- WebSocket 是网络双向传输。
- 消息队列用于跨进程/跨服务的持久或可靠异步通信。

## Streams 与背压

流适合处理无法或不应一次装入内存的数据，例如大文件、HTTP body、压缩、模型的流式输出。

Node.js 传统 Streams 有四类：

- `Readable`：可读。
- `Writable`：可写。
- `Duplex`：双向。
- `Transform`：边读边转换。

优先使用 `pipeline()` 组合流，它会传播错误并处理资源收尾：

```js
import { createReadStream, createWriteStream } from "node:fs"
import { pipeline } from "node:stream/promises"
import { createGzip } from "node:zlib"

await pipeline(
  createReadStream("input.log"),
  createGzip(),
  createWriteStream("input.log.gz"),
)
```

背压的含义是：下游处理不过来时，上游应该减速。手工调用 `writable.write()` 时返回 `false`，应等待 `drain`；`pipe`/`pipeline` 会帮你协调常见情况。

现代 Node.js 同时支持 WHATWG Web Streams。`fetch().body` 是 Web `ReadableStream`；Node.js Streams 可通过 `Readable.fromWeb()`、`Readable.toWeb()` 等 API 转换。不要把两套流对象当成完全相同的接口。

## 错误处理底线

- Promise 必须 `await`、`return` 或显式 `.catch()`，不要制造 floating Promise。
- 回调 API 遵循 error-first callback 时先处理 `error`。
- 服务端不要把未知错误堆栈直接返回给客户端。
- `uncaughtException`/`unhandledRejection` 可用于记录和触发受控退出，不应把未知状态下的进程强行“救活”后继续长期工作。
- 错误日志保留 `cause`、请求/任务 ID 和必要上下文，但不要记录 token、密码和完整敏感输入。

## 参考资料

- [The Node.js event loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)
- [Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
- [Events](https://nodejs.org/docs/latest-v24.x/api/events.html)
- [Node.js Streams](https://nodejs.org/docs/latest-v24.x/api/stream.html)
- [Web Streams](https://nodejs.org/docs/latest-v24.x/api/webstreams.html)
- [Globals and Abort APIs](https://nodejs.org/docs/latest-v24.x/api/globals.html)
