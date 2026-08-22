# Node.js 学习笔记

终于正式开始补齐全栈开发所需的 Node.js 基础。过去虽然接触过不少后端知识，但一直缺少一条完整、可复习的学习路径；这组笔记就是从“会 JavaScript 的前端开发者”走向 Node.js 后端开发的起点。

2026-08 全面校订：原笔记来自约两年前的入门课程。本次按 Node.js 与 npm 官方资料重新核查，并重新组织目录。被删去的内容通常不是“永远没用”，而是与 Node.js 基础关系较弱、表述不准确，或不应该在入门阶段形成默认方案。

_2026-04 学习记录：转型全栈从学习 Node.js 开始。记一则拖延症笑话——从学 Vue 入坑前端开始，同年便立志学 React、Next.js 和 Node.js，结果 6 年后才学 React，8 年后才学 Next.js 和 Node.js。_

## 先说结论

AI 的爆发没有推翻 Node.js 的基本原理。事件循环、异步 I/O、模块、HTTP、进程、流、数据库和鉴权依然是 AI 应用的地基。真正需要更新的是：

- 不再把 Node.js 简化成“单线程”；要理解事件循环、libuv Worker Pool、`worker_threads` 和多进程各自负责什么。
- 新项目优先使用 ESM，但仍要会读 CommonJS；二者差异不能简化成“编译时与运行时”或“能不能 tree shaking”。
- 现代 Node.js 已内置许多过去依赖第三方包的能力，例如稳定的 `fetch`、Web Streams、`WebSocket` 客户端、测试运行器、watch 模式和 `.env` 文件加载。
- TypeScript 可以被现代 Node.js 直接执行一部分，但这只是移除可擦除类型，不做类型检查，也不等于完整支持 `tsconfig.json`。
- AI 应用让流式响应、取消、超时、并发控制、任务队列、可观测性和安全边界变得更重要，而不是让后端基础失效。

## 版本基线

截至 2026-08：

- **Node.js 24**：LTS，本笔记的默认学习与生产基线。
- **Node.js 26**：Current，适合试用新特性，不作为入门笔记的最低基线。
- **Node.js 22**：仍处于 LTS 支持期，但新项目没有兼容要求时优先 Node.js 24。
- **Node.js 20 及更早版本**：已经 EOL，不应新建生产项目。

生产项目优先选择仍受支持的 LTS，并在 `package.json#engines`、版本管理工具和 CI 中保持一致。版本状态以 [Node.js Releases](https://nodejs.org/en/about/previous-releases) 为准。

## 阅读顺序

1. [运行时、并发模型与现代能力](notes/01-runtime-and-concurrency.md)
2. [npm、package.json 与依赖管理](notes/02-package-management.md)
3. [CommonJS、ESM 与 TypeScript](notes/03-modules-and-typescript.md)
4. [异步编程、事件循环与流](notes/04-async-event-loop-and-streams.md)
5. [常用内置模块](notes/05-core-modules.md)
6. [HTTP、Web 框架与安全基础](notes/06-web-backend.md)
7. [数据库、鉴权与基础设施](notes/07-data-auth-and-infrastructure.md)
8. [生产部署与架构选择](notes/08-production-and-architecture.md)
9. [Node.js 与 AI 应用工程](notes/09-ai-application-engineering.md)
10. [原笔记全面勘误表](notes/10-fact-check.md)

## 示例

[base-app](base-app/README.md) 保留两个最小示例：

- 一个基于 Commander 与 Inquirer 的 CLI。
- 一个使用内置 `fetch`、JSDOM 和文件 API 生成 HTML 的小实验。

它们用于验证概念，不代表完整生产项目架构。

## 推荐练习路线

1. 用原生 `node:http` 写一个包含路由、JSON 请求体和错误处理的小 API。
2. 用 `node:fs/promises`、Streams 与 `AbortController` 完成文件处理任务。
3. 用 Express、Fastify 或 NestJS 之一重写 API，并连接 PostgreSQL/MySQL/SQLite。
4. 补上参数校验、鉴权、日志、测试、优雅退出和容器部署。
5. 最后接入一个模型 API，完成流式对话、工具调用、持久化和评测闭环。

## 核查原则

- 版本相关结论优先引用 [Node.js 官方文档](https://nodejs.org/docs/latest-v24.x/api/) 与 [npm 官方文档](https://docs.npmjs.com/)。
- “稳定”“实验性”“Release candidate”以官方 Stability 标记为准。
- 框架、数据库与云服务只记录可迁移的概念，不把某个库写成唯一正确答案。
- 安全相关内容优先采用标准和 OWASP 指南，不自己发明协议或缩写。
