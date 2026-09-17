# Node.js 与 AI 应用工程

## AI 爆发改变了什么，没改变什么

过去两年模型能力、SDK 和产品形态变化很快，但 Node.js 后端的地基没有失效：

- 模型 API 仍是网络 I/O，需要 HTTP、超时、取消、重试和鉴权。
- 流式输出仍依赖 Streams、SSE/WebSocket 和背压。
- 对话、文件、用量和权限仍需要数据库、缓存与对象存储。
- 工具调用仍需要服务端输入校验、授权、幂等和审计。
- 长任务仍需要队列、Worker 与状态机。
- 生产系统仍需要日志、指标、追踪、测试、灰度和回滚。

变化主要在应用层：输出具有概率性，prompt 与模型版本成为行为依赖，非结构化内容可以影响控制流程，成本/上下文/安全边界更突出。

## Node.js 为什么适合 AI 应用

大多数云模型调用是 I/O 密集型，Node.js 可以有效协调大量等待中的请求；同时它与前端共享 JavaScript/TypeScript、Web Streams、schema 和工具类型，适合 BFF 与产品快速迭代。

常见职责：

- 鉴权、配额、模型路由和请求校验。
- 流式 chat/API。
- tool calling 与业务系统集成。
- RAG 检索、引用与权限过滤。
- 会话、feedback、成本和 trace 持久化。
- ingestion、转码、embedding、评测等后台任务的编排。

Node.js 不一定负责模型推理本身。GPU 推理、图像/音频处理或大量本地 embedding 常由 Python/专用推理服务完成，Node.js 负责控制面与产品 API。

## 建议的最小边界

一个可上线的 AI 功能至少分清这些层：

1. **Route**：解析 HTTP、认证用户、限制 body。
2. **Application service**：业务流程、额度、模型/工具选择。
3. **Model adapter**：隔离具体供应商 SDK、请求和流事件格式。
4. **Tool adapter**：调用数据库、搜索、邮件或内部 API。
5. **Repository**：保存 conversation、message、run、usage 和 feedback。
6. **Background worker**：处理 ingestion、长工具、重试和评测。

不要让 route 直接拼 prompt、调用 SDK、执行工具、写库和格式化响应全部混在一个函数里；否则更换模型、补评测或处理失败恢复都会很痛苦。

## 模型调用：超时、取消与错误分类

```js
export async function callModel({ endpoint, apiKey, body, signal }) {
  const timeoutSignal = AbortSignal.timeout(30_000)
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal: combinedSignal,
  })

  if (!response.ok) {
    const providerRequestId = response.headers.get("request-id")
    await response.body?.cancel()

    const error = new Error(`Model API ${response.status}`)
    error.name = "ModelApiError"
    error.status = response.status
    error.providerRequestId = providerRequestId
    throw error
  }

  return response
}
```

真实项目不要把上游完整错误 body、prompt 或 token 写进普通日志。错误至少分类：

- 用户取消/客户端断开。
- 本地 timeout。
- 网络或 DNS/TLS 错误。
- 供应商限流/容量不足，可在预算内退避重试。
- 认证、配额或参数错误，不应盲目重试。
- 内容安全拒绝、工具错误和输出校验失败。

重试时要有 idempotency key 或明确操作是可重复的；模型生成可重试，扣费、发邮件、下单等副作用不能无条件重放。

## 流式响应

流式输出能降低首 token 延迟并允许用户取消。常见传输：

- SSE：单向服务端事件，基于 HTTP，文本流式 UI 的常见默认选择。
- chunked HTTP/fetch stream：直接传字节或自定义事件格式。
- WebSocket：确有双向高频事件、协同或会话通道时使用。

不要把“模型 SDK 返回 async iterator”当成完整网络方案。还要处理：

- 客户端断开时取消上游模型请求。
- 中间代理/CDN 的 buffering 与 idle timeout。
- UTF-8 分块、SSE event 边界和半包。
- 下游写入背压。
- 流中途失败后的 UI 状态与持久化。
- 最终 usage、finish reason、tool call 与文本事件的不同类型。

Node.js 24 的 `fetch().body` 是 Web `ReadableStream`。需要接入传统 Node Streams 时使用官方转换 API，不要默认它支持 `.pipe()`：

```js
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"

const upstream = await callModel(options)
await pipeline(Readable.fromWeb(upstream.body), serverResponse)
```

实际代理通常还要过滤 hop-by-hop headers，并显式设置自己对客户端承诺的 `content-type` 与缓存策略。

## 结构化输出不等于可信输出

模型返回 JSON、schema constrained output 或 TypeScript 类型，并不代表业务语义正确。正确顺序是：

1. 让模型按明确 schema 输出。
2. 在服务端做运行时 schema 验证。
3. 做业务规则、权限和状态检查。
4. 只有通过检查后才能进入副作用操作。

```js
const parsed = ToolInputSchema.safeParse(modelArguments)
if (!parsed.success) {
  return { error: "invalid_tool_arguments" }
}

await authorize(user, "invoice.send", parsed.data.invoiceId)
```

TypeScript 只约束开发期代码，无法证明来自模型或网络的数据正确。

## Tool calling 的安全模型

模型只应**提议**调用工具，应用才是执行者：

1. 服务端维护明确的 tool allowlist 和 schema。
2. 根据当前用户、租户、资源和会话重新授权。
3. 校验参数，限制数量、长度、路径、域名和金额等。
4. 风险操作要求用户确认或审批。
5. 使用 idempotency key，记录调用、结果和副作用状态。
6. 限制每次 run 的步数、时间、token、费用与并发。

绝不能把模型输出直接交给 `eval()`、shell、SQL、文件路径或任意 URL。即使 system prompt 写了“不要做坏事”，也不是权限边界。

### Prompt injection

网页、PDF、邮件、数据库文本和工具结果都可能包含针对模型的恶意指令。防护思路：

- 把外部内容当数据，不当高优先级指令。
- 检索与工具访问按用户权限过滤，不能依赖模型自己保密。
- 工具使用最小权限凭据，读写工具分离。
- 高风险动作让确定性代码或人工审批做最终判断。
- 限制外部 URL、重定向、内网地址和下载大小，防 SSRF。
- 对输出做编码与清洗，避免生成内容进入 HTML/SQL/shell 后造成注入。

## RAG 的实际组成

RAG 不等于“把文档切片后存向量库”：

### Ingestion

1. 取得文件并记录来源、版本、权限与 hash。
2. 解析文本，保留页码/段落/URL 等引用元数据。
3. 按内容结构切分并去重。
4. 生成 embedding，写入检索索引。
5. 支持更新、删除、失败重试和索引版本迁移。

### Query

1. 验证用户和查询。
2. 权限过滤后做关键词/向量/混合检索。
3. rerank、压缩和去重。
4. 组装有来源边界的上下文。
5. 生成回答并输出可核验引用。

向量数据库通常是派生索引，不应成为文档、权限和业务事实的唯一真相来源。检索质量要用召回、排序、引用正确性和端到端答案指标分别评估。

## Agent 是受约束的循环

工程上可以把 Agent 理解为：模型根据当前状态选择下一步动作，应用执行动作并把结果写回状态，直到满足终止条件。

至少需要：

- 明确状态与可恢复的 run ID。
- 最大步数、deadline、费用和 token 预算。
- tool allowlist、授权、幂等和副作用确认。
- 重试/补偿/人工接管状态。
- 每一步输入、输出、模型/Prompt 版本和 trace。
- 检测无进展循环与重复工具调用。

长时间 Agent 不应依赖一个 HTTP 请求或单进程内存活到结束。使用 durable queue/workflow，把每一步保存为可恢复状态。

## CPU 与后台任务边界

| 工作 | Node.js 处理方式 |
| --- | --- |
| 调用云模型/embedding API | 普通异步 I/O，设置并发和 rate limit |
| 解析少量文本 | 主线程即可，限制输入大小 |
| 大 PDF/OCR/音视频 | 队列 + 独立进程/服务，限制 CPU/内存/时间 |
| 本地 embedding/推理 | GPU/专用推理服务，或经压测的 Worker/子进程 |
| 大规模文档切分 | 流式读取 + 有限并发后台 Worker |
| 批量评测 | durable queue，保存 dataset/run/result |

不要在 Web 请求的事件循环里同步解析巨型 PDF、执行本地模型或等待几分钟的 Agent。

## 数据与隐私

- 区分业务数据、prompt、模型输出、工具结果、trace 和评测数据的保存期限。
- 发送给模型前最小化数据，必要时脱敏或在受控区域处理。
- 对供应商的数据保留、训练使用、区域与子处理方做正式评估。
- 多租户向量索引、缓存、对象 key 和工具凭据必须隔离。
- 用户删除数据时同步删除源数据、派生 embedding、缓存与可检索索引。
- 日志/trace 默认不收集完整敏感 prompt；调试采样也需访问控制与过期。

## 可观测性与评测

传统指标仍然适用：吞吐、错误率、端到端延迟、首 token 延迟和下游耗时。AI 还要记录：

- provider/model、模型版本或 deployment。
- prompt/template/tool schema 版本。
- input/output/cache token 与估算费用。
- finish reason、重试、fallback 和 tool steps。
- 检索命中、引用、用户反馈与安全事件。

评测分层：

- 确定性测试：schema、权限、工具参数、引用 URL、禁用词、数值规则。
- Golden dataset：固定代表性输入和期望性质。
- 模型评分：适合难以精确匹配的质量维度，但评分器本身也需校准。
- 线上指标：任务完成、用户修改/重试、人工升级和业务结果。

升级模型或 prompt 与升级依赖一样需要回归集、对照实验、灰度和回滚。不要只凭几次聊天“感觉更聪明”。

## 学习项目建议

按下面顺序做一个小型知识助手：

1. 原生 `fetch` 调模型，完成非流式问答和 timeout。
2. 加 SSE 流式输出和用户取消。
3. 保存 conversation/message，记录 usage。
4. 加一个只读工具，schema 校验并按用户授权。
5. 加文档上传、异步 ingestion、混合检索和引用。
6. 建 20～50 条小型评测集，验证每次模型/prompt 变更。
7. 最后再考虑多模型路由、Agent 循环与复杂基础设施。

这条路线会强迫你真正使用 HTTP、Streams、数据库、队列、鉴权和可观测性，也能把 Node.js 基础与 AI 应用自然连接起来。

## 参考资料

- [Node.js fetch globals](https://nodejs.org/docs/latest-v24.x/api/globals.html#fetch)
- [Node.js Web Streams](https://nodejs.org/docs/latest-v24.x/api/webstreams.html)
- [Node.js Worker Threads](https://nodejs.org/docs/latest-v24.x/api/worker_threads.html)
- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)
- [OpenTelemetry GenAI semantic conventions](https://github.com/open-telemetry/semantic-conventions-genai)
