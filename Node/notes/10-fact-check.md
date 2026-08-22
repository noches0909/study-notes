# 原笔记全面勘误表

核查时间：2026-08。基线为 Node.js 24 LTS、npm 11；版本事实以官方当前文档为准。

判定含义：

- **正确**：核心概念可以保留，只做措辞和结构优化。
- **过度简化**：方向不完全错，但容易形成错误心智模型。
- **错误/过时**：结论、API、代码或推荐已经不可靠。
- **移出主线**：可以是有效技术，但不是 Node.js 入门知识，不应与核心能力并列。

## 运行时与适用场景

| 原笔记说法/主题 | 判定 | 更正与处理 |
| --- | --- | --- |
| Node.js 不是语言，是类似 Bun 的 JS 运行时 | 正确 | 补充 Node.js 实际执行 JavaScript；现代 TypeScript 支持只是 type stripping，不等于完整 TS 编译器 |
| Node.js 是单线程 | 过度简化 | 单个实例通常有一个主 JS 线程/事件循环，但运行时还有 OS 异步 I/O、libuv Worker Pool，也可创建 Worker 与子进程 |
| Node.js 适合 I/O，不适合 CPU，只能靠 C++ addon 或 cluster | 错误/过时 | CPU 任务可用 `worker_threads`、子进程、专用服务/Wasm/addon；cluster 主要扩展服务进程，不是通用计算 Worker |
| React/Vue/Next 等“主要依赖 Node.js 环境进行编译” | 过度简化 | 前端工具链常运行在 Node.js；框架运行时与部署目标可能是浏览器、Node.js、Edge 或其他 runtime |
| Tauri、React Native、Ionic 都属于 Node.js 运行场景 | 错误 | 它们的开发工具链可能使用 Node.js，但应用 runtime 不因此就是 Node.js；Tauri 核心后端是 Rust |
| Docker、Jenkins、ClamAV、FFmpeg 属于 Node.js 技术 | 移出主线 | 它们是独立工具，Node.js 可以编排或集成 |
| 2026 年推荐 Volta 管理 Node.js | 过度简化 | Volta、nvm、fnm 等都可选；真正要求是使用受支持 LTS并让本地/CI/生产版本一致 |

## npm

| 原笔记说法/主题 | 判定 | 更正与处理 |
| --- | --- | --- |
| `dependencies` 是 Vue/React，`devDependencies` 是 Vite/Webpack | 过度简化 | 按“生产运行是否需要”划分，而不是按库名/前后端划分 |
| npm install 按 `.bin`、`@`、字母顺序广度优先完全扁平化 | 错误 | npm 解析理想依赖树并按安装策略落盘；默认 hoisted，但冲突版本可嵌套，目录展示不等于解析算法 |
| `package-lock.json` 记录 npm 缓存 | 错误 | lockfile 描述精确依赖树、来源与完整性；缓存是独立目录，`integrity` 可用于校验内容 |
| lockfile 与 `package.json` 不同就直接“更新后检查缓存” | 过度简化 | `npm install` 会解析并可能更新；`npm ci` 要求匹配，否则直接失败且不修改 lockfile |
| `npm run` 按项目、全局、环境变量依次找命令 | 错误 | npm 读取 scripts，在 shell 中执行，并把本地依赖的 bin 目录加入现有 `PATH`；脚本不应依赖全局安装 |
| `npx` 总是下载最新版 | 错误 | 现代 npx 基于 `npm exec`；优先匹配本地包，远程版本取决于明确或默认的 package specifier |
| `npx` 可以执行任意包/任意开源 JS | 错误 | 它执行包 `bin` 暴露的命令；支持 registry、Git、tarball 等 package spec，但仍有供应链风险 |
| Verdaccio 是私服唯一方案，私服天然更安全更快 | 过度简化 | Verdaccio 只是一个方案；安全取决于权限、供应链、审计和运维，不由“私有”自动保证 |

## 模块、全局对象与路径

| 原笔记说法/主题 | 判定 | 更正与处理 |
| --- | --- | --- |
| Node.js 通过 `package.json#type` 支持 CJS/ESM | 正确 | 补充 `.cjs`/`.mjs`、显式扩展名、`exports`/`imports` 与互操作边界 |
| ESM 导入 JSON 需要 `with { type: "json" }` | 正确但解释过时 | 这是当前 import attributes 的明确要求，Node.js 24 中 JSON modules 已稳定，不是临时 loader 补丁 |
| CJS 是运行时同步加载，ESM 是编译时异步加载 | 过度简化 | ESM 具有静态链接结构，但仍在运行时加载/链接/求值；top-level await 会引入异步求值 |
| CJS 的值可修改，ESM 只读 | 过度简化 | CJS 导出 `module.exports` 的值；ESM 是 live bindings，导入方不能重绑，但对象本身仍可能可变 |
| CJS 不能 tree shaking，ESM 可以 | 过度简化 | tree shaking 是 bundler 优化；ESM 静态结构更利于分析，但不是 Node.js loader 自动删除代码 |
| CJS 顶层 `this` 指向模块，ESM 为 `undefined` | 基本正确 | 更精确地说 CJS 顶层 `this === module.exports` |
| Node.js 全局对象叫 `golbal`/`golbalThis` | 错误 | 拼写是 `global`/`globalThis`；推荐标准的 `globalThis` |
| `globalThis` 会按环境自动选择 `global` 或 `window` | 过度简化 | 每个环境提供标准名称 `globalThis` 指向自身全局对象，不是运行时条件分支 |
| `process.cwd()` 同 `__dirname` | 错误 | `cwd()` 是进程工作目录；`__dirname` 是 CJS 模块目录；ESM 用 `import.meta.dirname` |
| macOS 处理不了正斜杠，Windows 处理不了某类斜杠 | 错误 | 默认 `path` 使用当前平台语义；解析另一平台路径字符串时显式用 `path.win32`/`path.posix` |
| `path.resolve` 遇到多个绝对路径“返回最后一个” | 过度简化 | 从右往左解析，右侧绝对路径重置此前片段，同时保留它右边已收集的相对片段 |
| JSDOM 拼 HTML 就是 SSR | 错误 | 它只是服务端 HTML/DOM 实验；SSR 通常指按请求把应用状态渲染成 HTML，并包含 hydration 等完整链路 |

## 进程、事件与文件

| 原笔记说法/主题 | 判定 | 更正与处理 |
| --- | --- | --- |
| `process.kill` 就是杀死进程 | 过度简化 | 它发送 signal，效果取决于信号、权限和目标处理方式 |
| `process.exit()` 是普通退出方案 | 过度简化 | 它同步终止，可能截断输出；服务端优先设置 `exitCode` 并优雅关闭 |
| `cross-env` 用于区分开发/生产环境 | 错误 | 它主要解决 package scripts 跨平台设置环境变量语法差异 |
| `exec` 缓冲上限 200 KiB | 错误/过时 | Node.js 24 默认 `maxBuffer` 为 1 MiB；大输出仍应使用 `spawn` |
| `child_process` 适合所有 CPU 密集型 JS | 过度简化 | 可隔离任务；同进程并行 JS 更常考虑 Worker pool，外部程序用 `spawn` |
| `execFile` 不走 shell，更安全 | 基本正确 | 默认不经 shell且参数分离，仍需校验可执行文件、参数、路径与资源；显式 `shell: true` 会改变结论 |
| EventEmitter 事件默认最多监听 10 个 | 错误 | 10 是可能泄漏的警告阈值，不是硬限制 |
| Promise/WebSocket/消息队列取代 EventEmitter | 错误 | 它们解决一次结果、网络通信、跨进程消息等不同问题，不能互相笼统替代 |
| `fs.readFile` 与 `setImmediate` 固定是 immediate 先 | 错误 | I/O 完成时间和上下文会影响顺序；有业务依赖时显式 `await`，不能依赖竞速 |
| `appendFileSynce` | 错误 | API 是 `appendFileSync`；主线示例优先 Promise API |
| 硬链接像复制粘贴 | 错误 | 硬链接是指向同一文件记录的另一个目录项，不复制内容 |
| pnpm 底层就是硬链接和软链接 | 过度简化 | pnpm 使用内容寻址存储及多种链接/导入策略，具体机制受平台与配置影响 |

## `crypto`、压缩与网络

| 原笔记说法/主题 | 判定 | 更正与处理 |
| --- | --- | --- |
| AES-CBC 示例只保存密文 | 不安全 | CBC 不提供完整性；新设计优先 AES-GCM/ChaCha20-Poly1305 等 AEAD，并正确保存 nonce/tag |
| `createDeCipheriv` | 错误 | API 是 `createDecipheriv` |
| `cipher.update()`/`final()` 分开调用但未合并结果 | 错误 | 两部分都属于完整密文/明文，需 `Buffer.concat` 或拼接编码后的输出 |
| MD5 或 SHA-256 可存密码 | 不安全 | 使用 Argon2id、scrypt、bcrypt/PBKDF2 等带 salt 和 work factor 的密码算法；快速 hash 不适合密码 |
| gzip 适合文件，deflate 适合网络 | 错误 | gzip/Brotli/deflate 都可用于 HTTP或文件场景，按协议协商、兼容和成本选择 |
| 无条件设置 `Content-Encoding: deflate` | 错误 | 必须处理 `Accept-Encoding` 和 `Vary`；优先成熟中间件/CDN/代理 |
| socket 是一种可替代 HTTP 的双向协议 | 错误 | socket 是通信端点概念；WebSocket 才是标准双向应用层协议 |
| Socket.IO 就是原生 WebSocket | 错误 | Socket.IO 有自己的协议和事件/重连/房间等语义，客户端不能直接连接普通 WebSocket 服务端 |
| 轮询处理不好就是 HTTP 攻击 | 错误 | 轮询是合法方案；需要限流与容量设计，但不等同于攻击 |

## Web、缓存与框架

| 原笔记说法/主题 | 判定 | 更正与处理 |
| --- | --- | --- |
| Express 是轻量 Node.js Web 框架 | 正确 | 补充结构与安全约束需要应用自己建立 |
| Web 开发热更新必须用 Nodemon | 过时 | Node.js 已有稳定 `--watch`；Nodemon 仍适合需要更多能力的项目 |
| Fastify 更快且通常用于网关 | 过度简化 | Fastify 可构建完整 API；性能应按真实业务压测，不能只依据框架宣传 |
| `Access-Control-Allow-Origin: *` 会导致服务器拿不到 session | 错误 | 浏览器禁止 credentialed CORS 响应使用 `*`；session 是否存在是另一层问题 |
| CORS 默认只支持 GET/POST/HEAD | 过度简化 | 这是 simple request 的 safelisted methods；服务器与浏览器预检协议不能简化成框架“默认支持方法” |
| CORS 默认不支持 `Content-Type` | 错误 | safelisted 的三种 Content-Type 可简单请求；`application/json` 通常触发预检 |
| CORS 解决上传安全 | 错误 | CORS 只约束浏览器跨源读取；文件校验、鉴权、大小限制、隔离另行处理 |
| 防盗链只靠 Referer | 不安全 | Referer 可缺失/伪造；真正私有资源用授权、短期签名 URL、限流 |
| 强缓存一定显示状态 200且不发请求 | 过度简化 | 缓存命中行为受浏览器/CDN与校验条件影响；核心是 freshness 期间可复用，无需向源验证 |
| `no-cache` 不走强缓存，`no-store` 不走任何缓存 | 基本正确但术语粗糙 | `no-cache` 允许存储但复用前必须验证；`no-store` 才要求不存储 |
| `new Data().toUTCString()` | 错误 | 构造器是 `Date`；现代优先 `Cache-Control` |
| 浏览器 HTTP/2 必须 HTTPS | 实务上基本正确 | 协议有 h2c，但主流浏览器公网 HTTP/2 实际使用 TLS；通常由代理/CDN终止 |
| CLI 至少依赖 Commander/Inquirer/Ora/download-git-repo | 错误/过时 | Node.js 内置 `parseArgs`、readline、fetch、fs 已覆盖小型 CLI；复杂场景再选库 |

## 数据、鉴权与基础设施

| 原笔记说法/主题 | 判定 | 更正与处理 |
| --- | --- | --- |
| MySQL 是“最受欢迎”数据库 | 无法形成稳定技术结论 | 去掉排行榜式描述，按数据模型、事务、运维和团队选型 |
| 数据库最佳安装方式是 Docker | 过度简化 | Docker 适合本地可复现环境；原生安装与托管数据库也合理，生产运维问题不会消失 |
| 实际开发几乎不写 SQL，写 SQL 有注入风险 | 错误 | SQL 很常见；风险来自拼接不可信输入。使用参数绑定，ORM raw query 仍需防注入 |
| JWT 固定由三段组成且 Header/Payload 是 Base64 | 过度简化 | 常见签名 JWS compact 是三段 Base64URL；内容未加密。JWE compact 是五段 |
| JWT Signature 就等于鉴权完成 | 错误 | 还需校验算法、issuer、audience、过期等，并在业务层做授权 |
| Node.js 通常只能用 ioredis | 过度简化 | 官方 node-redis 与 ioredis 都可选，按拓扑与功能判断 |
| Redis 事务等同关系数据库事务 | 错误 | `MULTI/EXEC` 保证排队命令顺序执行，不提供关系数据库式自动回滚语义 |
| Lua 脚本原子，所以适合任意复杂业务 | 过度简化 | 脚本执行会阻塞其他命令，应短小有界；集群 key 与运维限制也要考虑 |
| 进程内 cron 就是生产定时任务 | 过度简化 | 多副本会重复、重启会错过；关键任务用外部 scheduler、队列、锁和幂等 |
| Serverless 就是不需要关心服务器运行成本/Linux | 错误 | 服务器由平台管理，但仍要关心并发、超时、冷启动、区域、状态、费用和可观测性 |
| Puppeteer 是 Google 的 Node.js 爬虫库 | 过度简化 | 官方定位是浏览器自动化；爬取只是用途之一，且当前支持 Chrome/Firefox |
| addon 主要因为 Node.js 不能做 CPU 工作，例子是 node-sass | 过时 | 原生扩展也用于系统/库绑定；CPU JS 可用 Worker。node-sass/LibSass 已停止维护 |
| `shortid` 生成短链接 ID | 过时 | 使用 `crypto.randomBytes`、Nano ID/UUID 等维护中方案，并依赖数据库唯一约束 |
| SSO 是多个系统共用 token | 错误 | 常见采用 OIDC/SAML 流程，各客户端验证自己的 issuer/audience/状态 |
| SDL/SCL 是单设备/扫码登录标准缩写 | 错误 | 不是通用标准名；改为描述 session 撤销和一次性扫码状态机 |
| 浏览器指纹能确保唯一设备 | 错误/不安全 | 指纹不稳定、可伪造且有隐私风险，只能作为风险信号之一 |

## 架构、部署与 AI

| 原笔记说法/主题 | 判定 | 更正与处理 |
| --- | --- | --- |
| 微服务就是把应用拆小并独立部署 | 过度简化 | 还需业务边界、数据所有权，并承担网络失败、一致性、观测和组织成本；默认先模块化单体 |
| gateway 固定包含负载均衡/缓存/加密/熔断/限流全部功能 | 过度简化 | 这些是可能职责，实际应按边界拆分给网关、代理、服务网格或应用，避免全塞一层 |
| cluster 解决 Node.js 单线程并使用所有 CPU | 过度简化 | cluster 创建多个服务进程共享端口；Worker、容器副本和进程管理器是不同选择 |
| PM2 是 Node.js 部署必选 | 错误 | 普通主机可用 systemd/PM2，容器通常由编排平台管理单前台进程，Serverless 由平台管理 |
| RabbitMQ 用于微服务通信、异步任务、日志分发 | 基本正确 | 补充 ack、publisher confirms、幂等、DLQ、积压与 outbox 才构成可靠链路 |
| Nacos、Elasticsearch 是 Node.js 基础 | 移出主线 | 它们是特定架构的基础设施，明确需求后再学 |
| 安装 OpenAI 包就能把 AI 集成进项目 | 过度简化 | SDK 只解决调用层；生产还要流式、取消、schema、tool 授权、持久化、评测、成本与隐私 |
| 远程桌面靠 Python/C++、node-gyp 加几个包即可 | 错误 | 需要系统权限、采集编码、低延迟传输、输入、安全授权、审计等完整体系；Node.js 更适合信令/控制面 |

## 代码与文字问题

原文还存在多处会直接误导复制运行的细节，已在重写中消除：

- `golbal`、`golbalThis`、`appendFileSynce`、`defalteSync`、`text/plan`、`Data`、`createDeCipheriv` 等拼写错误。
- FFmpeg 示例使用弯引号、缺失引号/括号，且把整条用户可变命令交给 shell。
- `fs.readFile` 回调漏掉 `data` 参数，写流数组示例实际不是 `['1', '2']`。
- CORS 示例出现中文逗号，不能运行。
- “及时性应用”“厕所、部署”“pyhone”“通关官网”等文字错误。

## 被重新安置而不是否定的内容

以下主题本身有价值，但从 Node.js 入门主线降级为“知道边界即可”：

- FFmpeg/pngquant/ClamAV：外部媒体与安全工具，由 Node.js 编排。
- SerialPort/远程桌面：设备与系统集成专项。
- Nacos/Elasticsearch/RabbitMQ/Redis：明确出现配置、搜索、队列、缓存需求后引入。
- Electron/React Native/Tauri：区分开发工具链和应用运行时。
- 反向代理、网关、微服务：先掌握单体 HTTP 服务与生产基础，再按问题学习。

## 核查来源

- [Node.js 24 API documentation](https://nodejs.org/docs/latest-v24.x/api/)
- [Node.js Releases](https://nodejs.org/en/about/previous-releases)
- [npm 11 documentation](https://docs.npmjs.com/cli/v11/)
- [HTTP Semantics: RFC 9110](https://www.rfc-editor.org/rfc/rfc9110)
- [JWT: RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
