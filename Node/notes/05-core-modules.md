# 常用内置模块

不需要背下所有 API。学习目标是知道每个模块解决什么问题、同步/异步/流式版本怎样选择，以及去哪里查准确信息。

## `node:path` 与 `node:url`

`path` 处理**文件系统路径字符串**，`URL` 处理 URL。两者不要因为都包含斜杠就混用。

```js
import path from "node:path"

path.basename("/srv/app/index.js") // index.js
path.dirname("/srv/app/index.js")  // /srv/app
path.extname("index.test.js")      // .js
path.join("/srv", "app", "index.js")
path.parse("/srv/app/index.js")
path.format({ dir: "/srv/app", name: "index", ext: ".js" })
```

### `join` 与 `resolve`

- `path.join()` 连接并规范化路径，不保证结果是绝对路径。
- `path.resolve()` 从右向左解析，遇到绝对路径后停止；如果最终没有绝对路径，会使用 `process.cwd()` 补全。

```js
path.resolve("/a", "/b", "file.txt") // /b/file.txt
```

多个绝对片段时不是“返回最后一个”，而是右侧绝对路径会重置此前结果，再继续拼接它右边的相对片段。

默认 `path` 按当前操作系统规则工作。需要在任意系统解析 Windows 字符串时使用 `path.win32`，解析 POSIX 字符串时使用 `path.posix`：

```js
path.win32.basename("C:\\temp\\file.html")
path.posix.basename("/tmp/file.html")
```

这不是“macOS 处理不了正斜杠”或“Windows 处理不了正斜杠”。差异来自路径语义，例如盘符、UNC 路径、分隔符和根目录规则。

ESM 中处理相邻资源优先保留 URL：

```js
const templateUrl = new URL("./template.html", import.meta.url)
```

只有 API 明确要求路径字符串时，再用 `fileURLToPath()` 转换。

## `node:process`

`process` 描述并控制当前 Node.js 进程。

| API | 含义 |
| --- | --- |
| `process.argv` | 第 1 项是 Node 可执行文件，第 2 项通常是入口文件，后面才是用户参数 |
| `process.cwd()` | 当前工作目录，不是当前模块目录 |
| `process.env` | 当前进程的环境变量视图；修改通常只影响当前进程及之后创建的子进程 |
| `process.pid` | 当前 PID |
| `process.platform` / `arch` | Node.js 二进制所在平台与 CPU 架构 |
| `process.memoryUsage()` | 当前进程内存统计 |
| `process.exitCode` | 设置自然退出时的状态码 |
| `process.kill(pid, signal)` | 向进程发送信号；名字不等于一定“杀死” |

服务端优先设置 `process.exitCode` 并完成日志/连接收尾。`process.exit()` 会同步终止，可能截断尚未写完的 stdout/stderr 或响应。

Node.js 24 可直接加载 `.env`：

```bash
node --env-file=.env src/server.js
```

`cross-env` 的主要价值是让 package scripts 用跨平台方式**设置**环境变量；它不是用于“区分开发和生产环境”的库。

## `node:fs`

文件系统 API 有三种主要风格：

- 回调：`node:fs` 中的 `readFile(path, callback)`。
- Promise：`node:fs/promises`，适合普通应用逻辑。
- 同步：`readFileSync()` 等，适合启动脚本、一次性 CLI；请求处理路径中慎用。

```js
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"

await mkdir(new URL("./output/", import.meta.url), { recursive: true })

const source = new URL("./input.txt", import.meta.url)
const target = new URL("./output/input.txt", import.meta.url)
const text = await readFile(source, "utf8")
await writeFile(target, text.toUpperCase(), "utf8")
await rename(target, new URL("./output/result.txt", import.meta.url))
```

- `readFile` 会把整个文件读入内存；大文件使用 `createReadStream`。
- `writeFile` 默认替换目标内容；追加可使用 `appendFile` 或 `{ flag: "a" }`。
- `fs.watch` 是对操作系统能力的薄封装，不同平台行为和可靠性有差异；关键业务不能只依赖它保证不漏事件。
- `rm({ recursive: true })` 很危险，先解析并核对精确目标；不要让不可信输入决定删除路径。

### 硬链接与符号链接

- 硬链接是同一文件系统中指向同一 inode/文件记录的另一个目录项，不是复制文件内容。
- 符号链接保存的是另一个路径，类似快捷方式；目标可以不存在，也可能跨文件系统。

pnpm 确实会结合内容寻址存储与链接机制减少重复，但不能简化成“底层就是硬链接和软链接”；具体导入方式还受文件系统和配置影响。

## `node:os`

常用查询：

- `os.platform()`、`os.arch()`：平台与架构。
- `os.release()`、`os.version()`、`os.type()`：系统版本/名称的不同视角。
- `os.homedir()`、`os.tmpdir()`：用户目录与临时目录。
- `os.networkInterfaces()`：网卡地址信息。
- `os.availableParallelism()`：当前进程可用的默认并行度估计。

为 Worker/cluster 决定数量时优先 `availableParallelism()`，不要直接把 `os.cpus().length` 当成容器内一定可用的 CPU 配额。并行数仍应通过压测决定。

## `node:child_process`

| API | 特点 | 常见场景 |
| --- | --- | --- |
| `spawn(command, args)` | 流式 stdio，不经 shell（除非显式开启） | 长时间运行、输出很大的命令 |
| `exec(command, callback)` | 经 shell 执行完整命令，缓冲 stdout/stderr | 短小且命令字符串固定的 shell 操作 |
| `execFile(file, args)` | 直接执行文件，参数数组分离 | 已知可执行文件，通常比拼接 shell 命令安全 |
| `fork(modulePath)` | 创建新的 Node.js 进程并建立 IPC | Node.js 父子进程协作 |

`exec`/`execFile` 默认 `maxBuffer` 是 1 MiB，不是 200 KiB；超出会终止子进程。输出可能很大时使用 `spawn` 流式消费。

绝不把未校验的用户输入拼进 `exec()` 命令：

```js
// 危险
exec(`ffmpeg -i ${userInput} output.mp3`)

// 更合理：程序和参数分开
spawn("ffmpeg", ["-i", inputPath, outputPath], { stdio: "inherit" })
```

即使使用参数数组，也要限制允许访问的文件路径、资源用量和执行时间。同步版本会阻塞事件循环，只适合受控的短 CLI/启动流程。

## `node:events`

核心类是 `EventEmitter`。它适合进程内事件和 Node.js 资源生命周期，监听器同步执行。默认 10 个监听器是泄漏警告阈值而非硬上限，详见[异步编程笔记](04-async-event-loop-and-streams.md#eventemitter)。

## `node:crypto`

先区分四种需求：

| 需求 | 典型能力 |
| --- | --- |
| 内容摘要/完整性 | SHA-256 等 hash |
| 防篡改且双方共享密钥 | HMAC |
| 可逆保密 | AES-GCM 等带认证的加密算法 |
| 密码存储 | Argon2id、scrypt、PBKDF2 等专用密码派生函数 |

MD5 和 SHA-1 不应作为新的安全方案。普通 SHA-256 很快，也不适合直接存密码；密码需要随机 salt 和足够昂贵的专用算法。

### Hash 示例

```js
import { createHash } from "node:crypto"

const digest = createHash("sha256").update("hello", "utf8").digest("hex")
```

### 带认证的对称加密示例

```js
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const key = randomBytes(32) // 实际项目由 KMS/secret 管理，不要和密文放在一起
const iv = randomBytes(12)  // AES-GCM 常用 96-bit nonce；同一 key 下不可复用

const cipher = createCipheriv("aes-256-gcm", key, iv)
const ciphertext = Buffer.concat([
  cipher.update("secret", "utf8"),
  cipher.final(),
])
const tag = cipher.getAuthTag()

const decipher = createDecipheriv("aes-256-gcm", key, iv)
decipher.setAuthTag(tag)
const plaintext = Buffer.concat([
  decipher.update(ciphertext),
  decipher.final(),
]).toString("utf8")
```

原笔记使用 AES-CBC 却没有 MAC/认证标签，会留下密文可篡改风险；新设计优先使用 AEAD。密码、密钥、nonce、salt、签名和编码各有不同语义，不能因为最终都是 `Buffer` 就混用。

密码存储优先使用成熟认证库封装 Argon2id；只使用 Node.js 内置能力时可采用异步 `crypto.scrypt()`，并按当前 OWASP 建议和服务器性能设定参数。

参考：[Node.js crypto](https://nodejs.org/docs/latest-v24.x/api/crypto.html)、[OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)。

## `node:zlib`

`zlib` 支持 gzip、deflate、Brotli 等压缩格式。不能概括为“gzip 用于文件，deflate 用于网络”：gzip 常用于 HTTP，`.gz` 也常用于文件；应根据协议协商、兼容性和内容类型选择。

HTTP 响应压缩需要读取请求的 `Accept-Encoding`，选择客户端支持的编码并设置正确的 `Content-Encoding`/`Vary`，不能无条件写死 `deflate`。生产 Web 框架或反向代理通常已有成熟压缩中间件。

压缩大数据使用异步流与 `pipeline()`；同步压缩会阻塞事件循环。

## `node:net`、`node:tls` 与 `node:dgram`

- `net`：TCP/IPC 客户端与服务端。
- `tls`：在 TCP 上建立 TLS 加密连接。
- `dgram`：UDP 数据报。

TCP 位于传输层，HTTP、WebSocket、数据库协议等运行在它之上。这里的 socket 是操作系统提供的通信端点概念，不等于 Socket.IO，也不是一个与 HTTP 并列的单一应用层协议。

初学 Web 后端应先掌握 HTTP，确有自定义协议、代理或设备通信需求时再深入 `net`。

## `node:util`

常用能力包括：

- `util.format()`/`util.inspect()`：调试格式化。
- `util.promisify()`：把符合 error-first callback 约定的 API 转成 Promise。
- `util.parseArgs()`：轻量 CLI 参数解析，小脚本不一定需要 Commander。
- `util.types`：少数需要精确判断底层类型的场景。

## 原生扩展（Node-API）

原生扩展不是专门为“弥补 Node.js 不能做 CPU 密集任务”而存在。它们也用于复用 C/C++ 库、访问系统能力、优化热点路径和绑定硬件接口。

- Node-API（原 N-API）提供跨 Node.js 版本较稳定的 ABI。
- `node-addon-api` 是常用 C++ 封装。
- `node-gyp` 是传统构建工具之一。

优先选择纯 JavaScript、Wasm 或有可靠预编译二进制的成熟包。原生扩展会增加平台兼容、供应链、编译和崩溃风险。`node-sass`/LibSass 已停止维护，不应再作为原生扩展的推荐示例。

## 参考资料

- [`path`](https://nodejs.org/docs/latest-v24.x/api/path.html) 与 [`url`](https://nodejs.org/docs/latest-v24.x/api/url.html)
- [`process`](https://nodejs.org/docs/latest-v24.x/api/process.html)
- [`fs`](https://nodejs.org/docs/latest-v24.x/api/fs.html)
- [`os`](https://nodejs.org/docs/latest-v24.x/api/os.html)
- [`child_process`](https://nodejs.org/docs/latest-v24.x/api/child_process.html)
- [`crypto`](https://nodejs.org/docs/latest-v24.x/api/crypto.html)
- [`zlib`](https://nodejs.org/docs/latest-v24.x/api/zlib.html)
- [Node-API](https://nodejs.org/docs/latest-v24.x/api/n-api.html)
