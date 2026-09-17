# CommonJS、ESM 与 TypeScript

## Node.js 同时支持两套模块系统

Node.js 的两套主要模块系统是：

- CommonJS（CJS）：`require()`、`module.exports`。
- ECMAScript Modules（ESM）：`import`、`export`，属于 JavaScript 标准。

新建应用可以优先 ESM，因为它与浏览器、现代工具链和标准语法一致；但 npm 生态中仍有大量 CommonJS，读懂两者与互操作仍然必要。

## 怎样明确模块类型

| 文件或配置 | 模块类型 |
| --- | --- |
| `.mjs` | ESM |
| `.cjs` | CommonJS |
| `.js` + 最近的 `package.json` 中 `"type": "module"` | ESM |
| `.js` + 最近的 `package.json` 中 `"type": "commonjs"` | CommonJS |

Node.js 还能检测部分“语法明显是 ESM”的模糊输入，但项目不应依赖猜测。包作者应显式填写 `type`，必要时使用 `.mjs`/`.cjs` 划清边界。

内置模块推荐使用 `node:` 前缀：

```js
import { readFile } from "node:fs/promises"
import { createHash } from "node:crypto"
```

它一眼就能表明这是 Node.js 内置模块，并避免与同名第三方包混淆。

## CommonJS

```js
// math.cjs
function add(a, b) {
  return a + b
}

module.exports = { add }
```

```js
const { add } = require("./math.cjs")
```

CommonJS 加载器传统上同步解析并执行模块，`module.exports` 是导出的值。`exports` 初始只是 `module.exports` 的快捷引用：

```js
exports.add = add               // 可以
module.exports = { add }        // 可以
exports = { add }               // 错误：只改了局部变量的指向
```

CommonJS 可以直接 `require()` JSON。加载过的 CommonJS 模块通常进入 `require.cache`，后续加载获得缓存结果。

## ESM

```js
// math.js（最近的 package.json 设置了 type: module）
export function add(a, b) {
  return a + b
}
```

```js
import { add } from "./math.js"
```

Node.js ESM 中，相对和绝对文件 specifier 通常必须写扩展名。它不会像某些 bundler 一样自动补 `.js` 或把目录隐式解析成 `index.js`。

ESM 的静态 `import` 只能出现在模块顶层；需要按条件加载时使用动态导入：

```js
if (process.env.DEBUG === "1") {
  const { inspect } = await import("node:util")
  console.log(inspect({ debug: true }))
}
```

`import()` 是返回 Promise 的表达式，在 ESM 和 CommonJS 中都可以使用。

### JSON 模块

Node.js 24 中使用 ESM 导入 JSON 必须写 import attribute：

```js
import config from "./config.json" with { type: "json" }
```

这不是“Node.js 以前不支持 JSON，所以临时补一个 loader 写法”，而是当前标准化 JSON modules 的显式类型要求。JSON 只提供默认导出。

### 当前文件位置

Node.js 24 可直接使用：

```js
console.log(import.meta.dirname)
console.log(import.meta.filename)
```

只有 CommonJS 才有 `__dirname` 与 `__filename`。对需要兼容较旧 Node.js 的 ESM，才常见 `fileURLToPath(import.meta.url)` 的兼容写法。

## 两套模块系统真正的差异

| 维度 | CommonJS | ESM |
| --- | --- | --- |
| 标准来源 | Node.js 生态约定 | ECMAScript 标准 |
| 主要语法 | `require` / `module.exports` | `import` / `export` |
| 依赖结构 | 可在运行时条件调用 `require()` | 静态 import 可提前分析，另有动态 `import()` |
| 导出语义 | `module.exports` 的值/对象 | live bindings；导入方不能给 binding 重新赋值 |
| 顶层 `this` | 指向 `module.exports` | `undefined` |
| 顶层 await | 不支持 | 支持 |
| 当前文件 | `__filename` / `__dirname` | `import.meta.filename` / `import.meta.dirname` |
| 缓存 | `require.cache` | 独立的 ESM 缓存机制 |

需要避免两种过度简化：

- “CommonJS 是运行时、ESM 是编译时”不够准确。ESM 具有静态可分析的链接结构，但模块仍会在运行时加载、链接和求值，还可能包含 top-level `await`。
- “ESM 支持 tree shaking，CommonJS 不支持”描述的是 bundler 的静态分析与优化能力，不是 Node.js 模块加载器自动帮服务端删除代码。

现代 Node.js 的 CJS/ESM 互操作能力持续增强，例如 CommonJS 已可 `require()` 符合条件的同步 ESM；但库的导出形态、Node.js 版本和 top-level `await` 都会影响结果。应用代码优先保持一种模块系统，只在边界处处理互操作。

## 包入口：不要只知道 `main`

发布包时，`exports` 可以显式限制公共入口，并为 `import`/`require` 提供不同入口：

```json
{
  "name": "example-package",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  }
}
```

一旦定义 `exports`，未公开的深层路径可能无法再被使用。这是封装能力，也是 breaking change 风险。应用项目通常不需要为了“看起来专业”设计复杂的双包输出。

项目内部可用 `imports` 定义以 `#` 开头的子路径：

```json
{
  "imports": {
    "#lib/*": "./src/lib/*.js"
  }
}
```

## Node.js 直接运行 TypeScript 的边界

Node.js 24 的 type stripping 已稳定，能直接运行只包含可擦除 TypeScript 语法的文件：

```ts
type User = { id: string }

function printUser(user: User): void {
  console.log(user.id)
}
```

```bash
node app.ts
```

但要牢记：

- 不做类型检查；仍应运行 `tsc --noEmit` 或使用编辑器/CI 检查。
- 默认只移除类型，不转换需要生成 JavaScript 的语法。
- Node.js 不读取 `tsconfig.json`，因此 `paths`、target 降级、JSX 等不会因此生效。
- `enum`、带运行时代码的 `namespace`、parameter properties 等需要转换的语法不能靠默认 type stripping。
- 类型导入必须显式写 `import type`，避免运行时把类型当作值加载。
- Node.js 不会对 `node_modules` 内的 TypeScript 做 type stripping；包仍应发布 JavaScript。

完整 TypeScript 应用仍常用下面一种方式：

1. `tsc`/bundler 构建成 JavaScript，再由 Node.js 运行。
2. 开发期使用 `tsx` 等运行器，同时单独执行 `tsc --noEmit`。
3. 仅在脚本很简单、语法完全可擦除时直接 `node script.ts`。

Node.js 官方给出的现代配置方向包括 `module: "nodenext"`、`verbatimModuleSyntax` 与 `erasableSyntaxOnly`。实际配置仍需结合是否发布构建产物。

## 选择建议

- 新应用：优先 `"type": "module"`，统一 ESM。
- 维护旧项目：尊重现有 CommonJS，不要为了改语法制造无价值迁移。
- 发布库：先确定支持的 Node.js 范围和消费者，再决定只发 ESM、只发 CJS或双格式。
- TypeScript：把“能运行”和“通过类型检查”当成两件事。

## 参考资料

- [Node.js packages](https://nodejs.org/docs/latest-v24.x/api/packages.html)
- [CommonJS modules](https://nodejs.org/docs/latest-v24.x/api/modules.html)
- [ECMAScript modules](https://nodejs.org/docs/latest-v24.x/api/esm.html)
- [Node.js TypeScript support](https://nodejs.org/docs/latest-v24.x/api/typescript.html)
