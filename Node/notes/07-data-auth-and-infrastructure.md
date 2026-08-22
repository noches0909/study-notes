# 数据库、鉴权与基础设施

## 数据库先学共同概念

不要先问“Node.js 最佳数据库是哪一个”。先理解这些可迁移概念：

- schema、主键、唯一约束、外键与索引。
- 事务、隔离级别、一致性与并发更新。
- 查询计划、分页、N+1、连接池与超时。
- migration、备份、恢复、权限与审计。
- 数据归属、生命周期、删除和隐私边界。

常见类别：

| 类别 | 示例 | 适合 |
| --- | --- | --- |
| 关系型 | PostgreSQL、MySQL | 强约束、事务、关联查询，Web 业务的常见默认选择 |
| 嵌入式关系型 | SQLite | 本地应用、CLI、单机小服务、测试 |
| 文档数据库 | MongoDB | 文档模型与访问模式明确匹配时 |
| Key-value/内存数据结构 | Redis | 缓存、限流、临时状态、部分队列/流场景 |
| 搜索引擎 | Elasticsearch/OpenSearch | 全文检索与聚合，不替代主业务数据库 |

Docker 是本地运行数据库的一种常见方式，优点是版本与环境可复现；它不是“现阶段唯一最佳安装方式”。生产数据的持久卷、备份、升级和安全不能因为用了容器就消失。

## 驱动、查询构建器和 ORM

- 驱动：直接连接协议，例如 `pg`、`mysql2`。
- 查询构建器：用 API 组合 SQL，例如 Knex、Kysely、Drizzle 的部分用法。
- ORM：把模型、关系、migration 和查询封装到更高层，例如 Prisma、Drizzle、TypeORM。

实际项目仍会直接编写 SQL，尤其是复杂查询、迁移和性能优化。SQL 本身不会自动导致注入，**把不可信字符串拼进 SQL** 才危险。使用参数绑定：

```js
const result = await db.query(
  "SELECT id, name FROM users WHERE email = $1",
  [email],
)
```

ORM 也不是自动安全边界：raw SQL、动态字段名、错误的授权条件仍可能产生注入或越权。参数化查询解决“值”的注入，动态表名/列名需要 allowlist，不能当普通参数绑定。

## 连接池与事务

- Web 请求通常从连接池借连接，不为每个请求新建数据库连接。
- 池大小不是越大越好，要结合数据库上限、服务实例数和查询耗时。
- 事务内的操作必须使用同一个连接/transaction client。
- 事务尽量短，不要在持有数据库锁时等待模型 API、邮件或其他慢网络调用。
- 数据库提交与外部消息无法靠普通本地事务天然原子化；需要时学习 outbox、幂等消费与补偿。

## SQLite

Node.js 已内置 `node:sqlite`，但截至 Node.js 24.19 它仍标记为 Release candidate，且当前主要连接 API 是同步的。学习和工具脚本可以试用；生产服务要评估同步调用对事件循环的影响、并发写限制、备份和目标 Node.js 版本。

成熟第三方 SQLite 驱动仍有价值。不要只因“内置”就立即替换已有可靠方案。

参考：[`node:sqlite`](https://nodejs.org/docs/latest-v24.x/api/sqlite.html)。

## Redis

Redis 是内存为主的数据结构服务器，支持字符串、hash、list、set、sorted set、Streams、pub/sub 等能力，并可配置持久化与高可用。

常见用途：

- 缓存与请求合并。
- session、一次性验证码和短期状态。
- 限流计数。
- 排行榜和实时计数。
- Streams/队列类场景；是否选它要看可靠性要求。

Node.js 客户端可选择官方 `node-redis` 或 ioredis，按部署拓扑、Cluster/Sentinel 和库生态判断，而不是固定说“通常只能用 ioredis”。

### 缓存不是加一个 `get/set` 就结束

要定义：

- key 结构、TTL、容量与淘汰策略。
- cache miss、穿透、击穿、雪崩时如何保护数据库。
- 数据更新后删缓存还是更新缓存，以及失败怎样恢复。
- 是否允许短暂不一致。
- 多租户/用户 key 是否隔离。

Redis 故障时，缓存型功能应尽可能降级；不能让缓存成为比主数据库更脆弱的强依赖。

### 事务与 Lua

Redis 的 `MULTI`/`EXEC` 可以让一组命令顺序执行且不被其他客户端插入，但它不等同于关系数据库那种遇到运行时错误自动回滚的事务。

Lua/Redis Functions 可以把相关操作放到服务端原子执行，减少网络往返。执行期间会阻塞其他命令，因此脚本必须短小、有界；它不是“任何复杂业务都塞进去”的方案。

参考：[Redis documentation](https://redis.io/docs/latest/)。

## 鉴权与授权不是一件事

- Authentication：确认“你是谁”。
- Authorization：确认“你能做什么”。
- Session/token：携带或关联认证状态的机制。

用户已登录不代表能访问任意资源。每个敏感操作仍需在服务端检查角色、权限、资源归属或策略，避免 IDOR/BOLA。

## JWT

JWT 是紧凑、URL-safe 的 claims 表示格式。最常见的签名 JWT 是 JWS compact serialization：

```text
base64url(header).base64url(payload).base64url(signature)
```

关键纠正：

- Header/Payload 使用 Base64URL 编码，**不是加密**，拿到 token 的人通常能直接读内容。
- Signature 用于校验完整性和签发者，不会隐藏 payload。
- JWT 也可以放在 JWE 中加密；JWE compact 不是上述固定三段结构。
- 不在 payload 中放密码、secret 或不必要的个人信息。

验证 JWT 至少要：

- 固定允许的算法，不接受 token 自己随意决定的危险组合。
- 验证 signature、`iss`、`aud`、`exp`、`nbf` 等应用要求的 claims。
- 控制 clock skew、密钥轮换和 key ID。
- access token 尽量短期；refresh token 需要安全存储、轮换、撤销与重放检测。

JWT 不自动解决登出、撤销、多设备管理和 CSRF，也不一定比 opaque session ID 更简单。根据系统边界选 session 或 token，不要为了“前后端分离”机械使用 JWT。

标准：[RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)、[JWT Best Current Practices: RFC 8725](https://www.rfc-editor.org/rfc/rfc8725)。

## SSO、单设备登录与扫码登录

### SSO

SSO 是用户一次认证后访问多个关联系统的体验/架构。现代 Web 常使用 OpenID Connect（基于 OAuth 2.0）或 SAML。它不等于“多个系统共用一个 token”：

- 各系统应验证面向自己的 audience、issuer、签名与状态。
- 浏览器通常经过重定向、authorization code 和回调流程。
- OAuth 2.0 主要解决授权委托，OIDC 才在其上定义身份认证。

### 单设备/单会话限制

“SDL”不是通用标准名。需要限制活跃设备时，服务端维护 session/device 记录和 session version，登录新设备后撤销旧 session，并通过短期 access token 或每次 session 检查使撤销生效。

浏览器指纹不是稳定、唯一、不可伪造的设备 ID，还涉及隐私问题；不能把它当成安全根。

### 扫码登录

“SCL”也不是通用标准名。典型流程是：

1. 网页向服务端申请一次性、短期、不可预测的登录请求 ID。
2. 二维码只承载该请求的关联信息，不直接承载长期凭据。
3. 已登录的手机确认请求内容与目标设备。
4. 服务端把请求状态从 pending 原子更新为 confirmed。
5. 网页通过轮询、SSE 或 WebSocket 获知结果，再换取自己的 session。

流程必须防止重放、二维码替换、错误账号确认和状态越权。

## 消息队列与 RabbitMQ

消息队列用于把生产者与消费者在时间和负载上解耦。RabbitMQ 是实现 AMQP 0-9-1 等协议的成熟消息 broker，常用于异步任务和服务间消息。

需要掌握的不是只会“发/收消息”，而是：

- ack/nack、重试、dead-letter queue。
- prefetch 与消费者并发。
- 消息持久化、publisher confirms。
- 至少一次投递意味着消费者必须幂等。
- 消息顺序、积压、过期和 poison message。

“消息发送成功”与“数据库事务提交成功”不是天然原子操作。关键业务考虑 transactional outbox。

## 定时任务

进程内可用 `node-cron`、`node-schedule` 或普通 timer；云平台也常提供托管 Cron。

生产注意：

- 服务有多个副本时，每个副本都会执行同一进程内定时器。
- 进程重启或休眠可能导致任务错过。
- 长任务可能重叠执行。
- 任务需要幂等、锁/leader election、超时、重试和运行记录。

关键调度优先使用外部 scheduler + durable queue，让 Web 进程只负责接收任务。

## Serverless

Serverless 是运维与计费模型，不是“没有服务器”。

- FaaS：以函数/请求处理单元运行代码。
- BaaS：使用托管鉴权、数据库、存储、队列等后端能力。

开发者仍需关心超时、内存、并发、冷启动、区域、网络、日志、状态持久化和费用。Serverless 实例可能复用，也可能随时消失，不能把本地内存或本地文件当作可靠共享状态。

## 对象存储（OSS）

OSS 在中文语境常泛指对象存储服务，不只指某个厂商产品。对象以 key 放在 bucket/container 中，适合图片、视频、备份和大文件，不是普通 POSIX 文件系统。

常见做法：

- 客户端用短期签名 URL 直传/下载。
- 数据库只保存对象 key、状态和元数据。
- 服务端限制大小、类型、租户前缀和有效期。
- 设置生命周期、版本、加密、访问策略和 CDN。

## 搜索、配置中心与其他组件

- Elasticsearch/OpenSearch：全文检索、倒排索引、聚合；数据通常从主库同步而来。
- Nacos：配置管理与服务发现；更常见于特定微服务体系，不是学习 Node.js 的前置条件。
- 串口：Node.js 可用 SerialPort 等库连接设备；这是设备集成方向，不属于 Web 后端必修。
- ClamAV：独立杀毒引擎；文件平台可调用它扫描上传内容，但还需隔离、资源限制和超时。

先从单体应用 + 一个关系数据库出发。只有明确出现缓存、搜索、异步解耦或服务发现问题时，再引入对应基础设施。

## 短链接

短链接的核心不是某个 ID 包，而是：生成不可预测且足够长的 code，唯一索引映射到受验证的目标 URL，再处理过期、访问控制、滥用与统计。

`shortid` 已不应作为现代默认方案。可以使用 `crypto.randomBytes()` 生成 Base64URL code，或使用维护良好的 Nano ID/UUID 方案：

```js
import { randomBytes } from "node:crypto"

const code = randomBytes(9).toString("base64url")
```

插入数据库时仍需唯一约束并处理极低概率冲突。重定向前限制允许的 scheme（通常只允许 `https:`/`http:`），否则服务可能成为恶意跳转平台。

## 参考资料

- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Redis documentation](https://redis.io/docs/latest/)
- [RabbitMQ tutorials](https://www.rabbitmq.com/tutorials)
- [OAuth 2.0 Security Best Current Practice: RFC 9700](https://www.rfc-editor.org/rfc/rfc9700)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)
