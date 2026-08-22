# 生产部署与架构选择

## 从模块化单体开始

微服务是把系统按业务能力拆成可独立部署的服务。它带来的不只有“可以独立扩容”，还有网络失败、数据一致性、版本兼容、追踪、部署和团队协调成本。

对多数新项目，默认路线是：

1. 先做结构清晰的模块化单体。
2. 用模块边界、接口和数据所有权减少耦合。
3. 通过指标找出真正需要独立扩容/隔离/交付的部分。
4. 收益大于分布式成本时再拆服务。

AI 应用也一样。把“对话”“RAG”“工具调用”“计费”写成代码模块，不等于一开始就必须部署成四个微服务。

## BFF、网关与 RPC

- BFF（Backend for Frontend）：为某类前端体验定制数据聚合和接口，不是所有业务后端的同义词。
- API Gateway：统一入口，常处理路由、鉴权、限流、策略和可观测性。
- RPC：以调用远端过程/方法的形式通信。
- gRPC：基于 Protocol Buffers 和 HTTP/2 的 RPC 框架，支持多语言代码生成和 streaming。

跨语言不代表必须用 gRPC；HTTP/JSON、消息队列也能跨语言。选择依据是契约、性能、浏览器兼容、流式需求、调试和团队生态。

## 一进程、一线程、多核的关系

### `worker_threads`

适合 CPU 密集型 JavaScript。Worker 在同一进程内有独立 isolate，可通过消息传递，也可转移 `ArrayBuffer` 或共享 `SharedArrayBuffer`。实际项目创建 Worker pool，不要每个请求新建一个 Worker。

### `child_process`

适合调用外部程序、故障隔离或运行独立 Node.js 任务。进程内存隔离更强，但创建和通信成本更高。

### `cluster`

`cluster` 创建多个 Node.js 子进程，并可让它们共享服务端口。它仍是稳定 API，但不是利用多核的唯一现代方案：

- 单机传统部署可以用 `cluster`/PM2 cluster mode。
- 容器环境常运行“每容器一个 Node.js 进程”，由编排平台扩副本和负载均衡。
- CPU 并行计算优先 `worker_threads`，而不是为了计算套用 cluster。

进程数不要机械等于逻辑 CPU 数。容器配额、内存、连接池、尾延迟和下游容量都要进入压测。

参考：[`cluster`](https://nodejs.org/docs/latest-v24.x/api/cluster.html)、[`worker_threads`](https://nodejs.org/docs/latest-v24.x/api/worker_threads.html)。

## PM2、容器与 systemd

PM2 是 Node.js 进程管理器，可提供重启、日志、监控和 cluster mode。它不是部署 Node.js 的必选项。

| 环境 | 常见进程管理方式 |
| --- | --- |
| 普通 Linux 主机 | systemd 或 PM2 |
| Docker/Kubernetes/托管容器 | 每容器一个前台 Node.js 进程，由平台重启和扩容 |
| Serverless | 平台管理实例生命周期 |

不要在容器中为了“更稳”无条件再套 PM2 cluster；这会重复编排职责并让信号、日志和资源限制更难理解。确有需求时再使用 PM2 runtime 的相应模式。

## 优雅退出

部署、扩缩容和崩溃恢复都要求应用正确处理终止信号：

```js
const sockets = new Set()

server.on("connection", (socket) => {
  sockets.add(socket)
  socket.on("close", () => sockets.delete(socket))
})

async function shutdown(signal) {
  console.log({ signal }, "shutting down")

  server.close(async (error) => {
    try {
      if (error) throw error
      await db.close()
      process.exitCode = 0
    } catch (shutdownError) {
      console.error(shutdownError)
      process.exitCode = 1
    }
  })

  setTimeout(() => {
    for (const socket of sockets) socket.destroy()
  }, 10_000).unref()
}

process.once("SIGTERM", () => shutdown("SIGTERM"))
process.once("SIGINT", () => shutdown("SIGINT"))
```

真实项目还要：

- 先停止接收新流量，再等待正在处理的请求。
- 停止拉取新队列任务，给已领取任务 ack/nack。
- 关闭数据库、Redis、消息队列和 telemetry exporter。
- 设置总退出 deadline，避免永远卡住。
- 保证 shutdown 只能执行一次。

## 健康检查

- Liveness：进程是否仍可运行；失败通常触发重启。
- Readiness：此实例是否准备好接收流量；依赖未就绪或正在退出时应失败。
- Startup：慢启动应用可单独表示初始化阶段。

不要让 liveness 深度依赖所有外部服务，否则一次数据库抖动可能把所有应用副本一起重启。Readiness 也不能只返回硬编码的 `{ ok: true }`。

## 日志、指标与追踪

### 日志

- 输出结构化日志到 stdout/stderr，由平台收集。
- 带 request ID、trace ID、任务 ID、错误 cause 和耗时。
- 不记录 password、Authorization、Cookie、完整 prompt/文件或个人敏感数据。
- 高频循环中大量 `console.log` 会拖慢服务并增加费用。

### 指标

至少关注：

- 请求量、错误率、延迟分位数。
- event-loop delay/utilization、内存、GC、CPU。
- 数据库池等待、下游超时、队列积压。
- 进程重启和部署版本。

### 分布式追踪

当请求跨数据库、缓存、队列、模型 API 和多个服务时，trace 能回答时间花在哪里。OpenTelemetry 是常见标准化方案。日志、指标和 trace 要用同一关联 ID 串起来。

## 安全基线

- 固定受支持的 Node.js LTS，及时安装安全更新。
- 提交 lockfile，在 CI 使用可复现安装并审查依赖 diff。
- secret 放 secret manager/部署环境，实施最小权限、轮换与泄漏响应。
- 所有外部输入做 schema、大小、数量和超时限制。
- 对认证、资源授权、CSRF、SSRF、开放重定向、路径遍历和命令注入做威胁建模。
- 为公开接口设置 body limit、rate limit、并发上限和 backpressure。
- 默认用 TLS；信任代理 headers 前正确配置 trusted proxy。
- Node.js Permission Model 可以降低可信代码误操作风险，但官方明确说明它不是对恶意代码的沙箱。

运行不可信代码需要真正的隔离边界，例如受限容器、microVM、独立身份、网络策略、只读文件系统、资源配额和超时；不能只靠 `vm` 模块、Worker 或 Permission Model。

## 测试

Node.js 内置 `node:test` 在 Node.js 20 起稳定：

```js
import assert from "node:assert/strict"
import test from "node:test"

test("sum", () => {
  assert.equal(1 + 2, 3)
})
```

```bash
node --test
```

测试层次：

- 单元测试：纯业务规则。
- 集成测试：数据库、缓存、文件、队列适配器。
- API/contract 测试：状态码、schema、鉴权与兼容。
- 端到端测试：关键用户流程。

不要把 Jest、Vitest 与 E2E 并列成同一种“单元测试工具”。Jest/Vitest 是测试框架；Playwright 等更常用于浏览器端到端测试。

## CI/CD

CI/CD 是流程，不是“Jenkins、Docker、Husky、miniprogram 的集合”。典型流水线：

1. 使用固定 Node.js 与包管理器版本。
2. `npm ci`。
3. lint、类型检查、单元/集成测试和构建。
4. 依赖/secret/镜像扫描。
5. 生成不可变制品并记录 commit/version/SBOM。
6. 部署到受控环境，执行 migration 与 smoke test。
7. 观察指标，支持回滚。

Husky 只管理本地 Git hooks，不能替代 CI；Docker 只打包/运行容器，也不等于 CI/CD。

## CLI 与自动化脚本

一个现代 CLI 不强制依赖 Commander、Inquirer、Ora、`download-git-repo` 四件套。

- 小脚本：`node:util.parseArgs`、`node:readline/promises`、内置 `fetch` 和 `node:fs/promises` 已能完成很多工作。
- 复杂命令树：Commander/Yargs 等成熟库仍有价值。
- 交互式提问：Inquirer 或 `@inquirer/prompts`。
- 下载模板：可以下载固定 tarball、调用 Git，或使用平台 API；必须固定来源并校验错误。

CLI 要处理退出码、TTY/非交互环境、SIGINT、超时、部分写入和凭据泄漏。模板是 template，不是“模版”。

## 浏览器自动化与爬取

Puppeteer 是 Chrome/Firefox 的浏览器自动化库，能做测试、截图、PDF、抓取和自动交互；“爬虫库”只是用途之一。静态 HTML 可优先用普通 HTTP 客户端 + 解析器，成本远低于启动浏览器。

必须遵守目标站点条款、robots/访问限制、版权和隐私要求，并设置并发、速率、超时与缓存。遇到登录、验证码或反自动化机制，不应默认尝试绕过。

## FFmpeg、图像处理与远程控制

Node.js 很适合编排 FFmpeg、ImageMagick、ClamAV 等独立程序，但计算仍由这些程序执行。用 `spawn(file, args)`、流、超时、退出码和隔离目录管理任务，不把用户输入拼成 shell 字符串。

“远程桌面需要 Python 和 C++，再装几个 Node 包”不是可靠架构。完整远程控制涉及：

- 屏幕采集与硬件编码。
- 低延迟传输、带宽适配和输入通道。
- 操作系统权限与平台专用 API。
- 端到端鉴权、加密、用户可见授权和审计。
- NAT traversal、断线恢复与滥用防护。

Node.js 可做信令、会话和控制面，但媒体/输入执行通常依赖 WebRTC、系统 API 或成熟远程桌面组件。`robotjs`、`screenshot-desktop`、`ws` 等包的罗列不构成安全可用的远程桌面方案。

## 参考资料

- [Node.js diagnostics](https://nodejs.org/docs/latest-v24.x/api/diagnostics_channel.html)
- [Node.js process](https://nodejs.org/docs/latest-v24.x/api/process.html)
- [Node.js test runner](https://nodejs.org/docs/latest-v24.x/api/test.html)
- [Node.js Security Best Practices](https://nodejs.org/en/learn/getting-started/security-best-practices)
- [OpenTelemetry](https://opentelemetry.io/docs/)
