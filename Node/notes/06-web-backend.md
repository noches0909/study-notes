# HTTP、Web 框架与安全基础

## 从 `node:http` 理解 Web 服务

Node.js 内置 `http` 模块很底层：它解析 HTTP 消息的起始行、headers 和流式 body，但不会自动提供路由、JSON body 解析、参数校验、鉴权或统一错误处理。

```js
import { createServer } from "node:http"

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost")

  if (request.method === "GET" && url.pathname === "/health") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" })
    response.end(JSON.stringify({ ok: true }))
    return
  }

  response.writeHead(404, { "content-type": "application/json; charset=utf-8" })
  response.end(JSON.stringify({ error: "not_found" }))
})

server.listen(3000, "127.0.0.1", () => {
  console.log("http://127.0.0.1:3000")
})
```

`IncomingMessage` 和 `ServerResponse` 都与 Streams 密切相关。读取请求 body 时必须设置大小上限，并处理连接中断、内容类型和解析错误；否则大请求可以耗尽内存或阻塞事件循环。

参考：[`node:http`](https://nodejs.org/docs/latest-v24.x/api/http.html)。

## Web 框架怎么选

| 选择 | 适合场景 | 要点 |
| --- | --- | --- |
| 原生 `node:http` | 学协议、极小服务、库底层 | 自己承担路由、校验、安全和错误处理 |
| Express | 生态广、概念简单、传统中间件项目 | 灵活但约束少，需要团队自己定结构 |
| Fastify | 重视 schema、插件系统与低开销 | 不只用于网关，也可构建完整 API |
| NestJS | 大型 TypeScript 团队、需要强结构 | 学习和抽象成本更高，默认常运行在 Express/Fastify 适配器上 |

“Fastify 永远比 Express 快”或“Fastify 通常只做网关”都不是可靠选型结论。真实性能取决于业务、插件、序列化、数据库和部署，应该用自己的负载测试。

简单开发热更新可直接使用稳定的 `node --watch`：

```bash
node --watch src/server.js
```

Nodemon 仍能提供更多匹配规则和兼容能力，但不再是唯一基础方案。

## 路由、REST 与输入校验

REST 是一种架构风格，不是“把 HTTP 方法换成 CRUD 名字”就自动得到的标准 API。实用约定包括：

- 用资源名设计 URL，例如 `/users/:id`。
- 正确使用 HTTP method、状态码、headers 和幂等语义。
- 对 path/query/headers/body 做运行时校验；TypeScript 类型不会验证网络输入。
- 统一错误响应，但不要向客户端泄露堆栈、SQL、内部路径和 secret。
- 分页、过滤和排序都要设置上限。

ORM、框架 DTO 或模型类型不能替代输入验证。常见方案有 JSON Schema、Zod、Valibot 或框架自带 schema。

## CORS

CORS 是浏览器对跨源读取实施的协议，不是 Node.js 服务器之间请求的通用“网络防火墙”。同源比较 scheme、host 和 port。

服务端常见响应：

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Vary: Origin
```

关键规则：

- credentialed 请求不能搭配 `Access-Control-Allow-Origin: *`。
- `*` 并不是“导致服务器拿不到 session”；是浏览器不允许带 credentials 的跨源响应使用通配 origin。
- 不带凭据且确实公开的资源才适合 `*`。
- 动态回显 `Origin` 前必须和 allowlist 精确匹配，并设置 `Vary: Origin`。
- CORS 不是 CSRF 防护，也不会阻止别人从服务器、curl 或脚本调用公开接口。

满足“simple request”条件的请求可以不预检，允许的方法是 GET、HEAD、POST，并且 headers 与 `Content-Type` 受 safelist 限制。常见会触发 `OPTIONS` 预检的情况包括：

- `Content-Type: application/json`。
- PUT、PATCH、DELETE 等非 safelisted method。
- `Authorization` 或其他非 safelisted request header。

服务器需要对预检返回匹配的 allow-origin、allow-methods、allow-headers 等，而不是机械给所有接口放开一切。

标准依据：[Fetch Standard: CORS protocol](https://fetch.spec.whatwg.org/#http-cors-protocol)。

## Cookie、Session 与 CSRF

浏览器鉴权不只有 JWT。传统且常常更简单的方案是：

1. 服务端生成随机 session ID。
2. session 数据放在服务端存储。
3. 浏览器通过 `HttpOnly; Secure; SameSite=...` Cookie 携带 session ID。

如果 Cookie 会被浏览器自动带上，就要评估 CSRF。`SameSite`、CSRF token、Origin/Referer 校验和敏感操作再认证需要按威胁模型组合使用。

不要把 access token 放入可被普通前端 JavaScript 读取的长期存储后就认为“无状态更安全”。XSS、token 生命周期、刷新、撤销和多设备管理同样重要。

## HTTP 缓存

### Freshness（常被称为强缓存）

```http
Cache-Control: public, max-age=60
```

在响应仍新鲜且满足其他缓存条件时，缓存可直接复用，不必向源服务器验证。常用指令：

- `public`：共享缓存可以存储。
- `private`：面向单个用户，通常只允许私有缓存存储。
- `max-age=N`：响应生成后 N 秒内保持新鲜。
- `s-maxage=N`：为共享缓存单独设置新鲜期。
- `no-store`：不要存储。
- `no-cache`：可以存储，但每次复用前必须验证；名字不等于“不缓存”。

`Expires` 是绝对时间的旧机制，现代项目优先 `Cache-Control`。示例中应是 `new Date()`，不是不存在的 `new Data()`。

### Validation（常被称为协商缓存）

- 服务端提供 `ETag`，客户端用 `If-None-Match` 验证。
- 服务端提供 `Last-Modified`，客户端用 `If-Modified-Since` 验证。
- 未变化时服务器返回 `304 Not Modified`，通常没有响应 body。

先判断响应能否被存储，再判断是否新鲜，过期后才进入验证流程。动态个性化数据不要套用静态资源的长期缓存策略。带 hash 文件名的 JS/CSS 适合 `max-age` 很长并配合 `immutable`；HTML 通常需要更谨慎。

标准依据：[RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111)。

## 压缩与内容协商

客户端通过 `Accept-Encoding` 声明支持 gzip、Brotli 等编码，服务器选择后返回 `Content-Encoding`，并通常设置：

```http
Vary: Accept-Encoding
```

图片、视频等本身已压缩的格式未必值得再压。生产环境常由 CDN/反向代理或框架中间件负责；动态压缩要权衡 CPU、延迟与响应大小。

## HTTP/2 与 HTTP/3

HTTP/2 的主要变化包括二进制分帧、单连接多路复用和 header compression。它仍然是 HTTP，不是在应用层与传输层之间“额外插入一个自定义层”。

HTTP/2 规范本身可以明文协商（h2c），但主流浏览器面向公网的 HTTP/2 实际上使用 TLS，因此开发中通常通过 HTTPS 提供。HTTP/3 则基于 QUIC/UDP。

多数 Node.js 应用不需要自己终止 HTTP/2/3；让 CDN、负载均衡器或反向代理负责 TLS 与协议，再把请求转给应用，通常更易运维。确需直连可查看 [`node:http2`](https://nodejs.org/docs/latest-v24.x/api/http2.html) 与 [RFC 9113](https://www.rfc-editor.org/rfc/rfc9113)。

## WebSocket 与 Socket.IO

- WebSocket 是标准的全双工应用层协议，从 HTTP Upgrade 开始（HTTP/1.1 场景）。
- Node.js 24 的全局 `WebSocket` 是**客户端** API，并不提供 WebSocket 服务端。
- WebSocket 服务端可使用 `ws`、Socket.IO 或框架/运行平台提供的实现。
- Socket.IO 不是“原生 WebSocket 的简单封装”；它有自己的协议、事件语义、重连、心跳、房间和可选降级传输，Socket.IO 客户端不能直接连接普通 WebSocket 服务端。

轮询是合法的实时更新方案，只是延迟和请求开销较高；轮询本身不等于 HTTP 攻击。实时系统还要考虑连接鉴权、心跳、断线重连、消息顺序、背压和横向扩容。

标准依据：[RFC 6455: WebSocket](https://www.rfc-editor.org/rfc/rfc6455)。

## 反向代理、网关与静态资源

反向代理可以负责 TLS 终止、域名/路径路由、缓存、压缩、限流和负载均衡。Node.js 可以通过代理库实现，但生产中常交给 CDN、云负载均衡、Nginx、Envoy 等专门组件。

网关不是“使用 Fastify 的服务”这一种技术，而是一个职责边界：

- 路由与协议转换。
- 统一鉴权、限流和请求策略。
- 可观测性与错误映射。
- 在明确需要时做聚合与缓存。

不要把所有业务逻辑塞进网关，也不要把“多一层转发”自动等同于高可用。

防盗链中的 `Referer` 检查只能减少普通页面直接引用，header 可能缺失或伪造，不能成为真正授权。需要访问控制的资源应使用鉴权、短期签名 URL、防泄露策略与限流。

## 上传与下载

- `multipart/form-data` 可用 Busboy、Multer 或框架插件解析；Multer 不是所有上传协议的通用方案。
- 请求体必须限制总大小、文件数量、单文件大小、字段数量与超时。
- 不信任客户端提供的文件名、扩展名和 MIME；生成服务端文件名并校验真实内容。
- 大文件优先流式写入或由客户端直传对象存储，不要先完整读入内存。
- 分片上传需要 upload ID、分片校验、幂等合并、过期清理和访问控制。
- 下载应处理 `Content-Disposition`、range request、授权与缓存策略。
- CORS 只解决浏览器跨源协议，不解决上传安全。

## SSR 与 JSDOM

SSR 是服务器根据应用状态为一次请求生成 HTML，常由 React/Next.js、Vue/Nuxt 等框架完成。JSDOM 是在 Node.js 中模拟部分 DOM 的库，适合测试、解析或特定转换；“用 JSDOM 拼出 HTML 文件”只是服务端 HTML 生成实验，不足以代表完整 SSR。

[base-app 示例](../base-app/README.md)保留这个实验，并明确了它的边界。

## 邮件与配置

Nodemailer 是常见 SMTP 客户端，云邮件 API 也很常见。YAML 只是配置格式，`js-yaml` 不会让 secret 变安全。

- 本地开发可从未提交的 `.env` 读取。
- 生产使用部署平台 secret/KMS，并实施最小权限和轮换。
- 邮件任务使用队列、幂等键、重试上限和退信处理。
- 不把完整收件人、token 或邮件正文随意写入日志。

## 参考资料

- [Node.js HTTP](https://nodejs.org/docs/latest-v24.x/api/http.html)
- [Express](https://expressjs.com/)
- [Fastify](https://fastify.dev/)
- [NestJS](https://docs.nestjs.com/)
- [Fetch Standard](https://fetch.spec.whatwg.org/)
- [HTTP Semantics: RFC 9110](https://www.rfc-editor.org/rfc/rfc9110)
