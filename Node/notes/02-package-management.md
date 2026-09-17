# npm、package.json 与依赖管理

## 三个对象不要混在一起

- `package.json`：项目清单，描述包名、脚本、入口、模块类型、依赖范围、Node.js 版本要求等。
- `package-lock.json`：npm 生成的依赖树快照，记录足以复现安装结果的信息，应用项目通常应提交。
- `node_modules`：某次安装在本机生成的依赖目录，通常不提交。

```bash
npm init -y
npm install fastify
npm install --save-dev typescript
```

`dependencies` 不等于“业务框架”，`devDependencies` 也不等于“构建工具”。判断标准是：部署后的程序在运行时是否还需要它。

- `dependencies`：生产运行需要，例如 Web 框架、数据库驱动。
- `devDependencies`：只在开发、构建、测试、类型检查阶段需要。
- `peerDependencies`：声明宿主项目需要提供的兼容依赖，库、插件和适配器中常见。
- `optionalDependencies`：安装失败仍允许继续的可选能力。

前端应用中的 React 最终可能被打包进静态资源，但对包管理器来说通常仍是应用的 `dependencies`；不要用“前端/后端”机械分类。

## 版本范围与锁文件

常见语义化版本范围：

- `1.2.3`：精确版本。
- `~1.2.3`：通常允许 patch 更新，不跨 minor。
- `^1.2.3`：通常允许不改变最左侧非零版本的更新；对 `0.x` 要格外留意。
- `latest`：registry 的 dist-tag，不等于“最稳定且与你的项目兼容”。

`package-lock.json` 的核心价值是记录实际解析出的依赖树，让团队、CI 和部署更容易得到相同结果。`integrity` 用于校验下载内容，`resolved` 描述来源；锁文件不是 npm 缓存本身，也不是“用路径生成缓存文件名”的说明书。

应用项目应同时提交 `package.json` 与 `package-lock.json`，不要手工随意编辑 lockfile。

## `npm install` 应该怎样理解

不必背内部遍历顺序。对开发更有用的模型是：

1. npm 读取项目配置、`package.json` 和可用的 lockfile。
2. 解析符合版本范围、平台、peer/optional 等约束的理想依赖树。
3. 计算当前 `node_modules` 与理想树的差异。
4. 从本地缓存或 registry 获取包，校验完整性并落盘。
5. 按安装策略提升可共享依赖，冲突版本保留在更深层级。
6. 在允许的情况下执行生命周期脚本，更新 lockfile 与 `node_modules`。

npm 的默认安装策略是 `hoisted`，但它不是“所有依赖完全扁平化”，也不保证目录按某个字母顺序表达解析过程。两个包需要不兼容的依赖版本时，树中可以同时存在多个版本。

安装第三方包等同于运行第三方供应链中的代码与安装脚本。提交前检查包名、维护状态、许可证、依赖变化和安装脚本，避免 typo-squatting。

## `npm install` 与 `npm ci`

| 命令 | 适合场景 | lockfile 不匹配时 | 是否改 lockfile |
| --- | --- | --- | --- |
| `npm install` | 本地添加、更新依赖 | 重新解析并可能更新 | 可能 |
| `npm ci` | CI、部署、可复现的干净安装 | 直接失败 | 不会 |

`npm ci` 要求已有 lockfile，会先清理现有 `node_modules`，并按锁定结果安装整个项目。生成 lockfile 时若使用了影响依赖树的选项，CI 也要保持同样配置。

## `.npmrc` 的作用域

npm 配置可以来自命令行、环境变量以及不同作用域的 `.npmrc`。项目级和用户级配置最常见；不要把 registry token 写进可提交的项目文件。

```bash
npm config list
npm config get registry
npm config get cache
```

在发布、安装或登录前先确认 registry。私有包优先使用组织的私有 registry、scope 和 CI secret，不要在仓库里保存明文凭据。

## `npm run` 发生了什么

```json
{
  "scripts": {
    "dev": "node --watch src/server.js",
    "test": "node --test"
  }
}
```

`npm run dev` 会读取 `package.json#scripts.dev`，在平台对应的 shell 环境中执行命令。npm 会把本地依赖暴露的可执行文件目录加入 `PATH`，因此脚本能直接写 `eslint`、`vite` 等命令。

这不等于 npm 按“项目、全局、系统”顺序主动搜索命令。全局命令是否可见取决于原本的 `PATH`，项目脚本不应依赖某个开发者恰好全局安装了什么。

向脚本传参：

```bash
npm run test -- --watch
```

## `npx` 与 `npm exec`

现代 `npx` 基于 `npm exec`。它会优先使用本地可匹配的可执行包；本地没有时，可以提示并把指定包安装到 npm cache 后临时执行。

```bash
npx eslint .
npx prettier@3.6.2 --write README.md
npm exec --package=typescript -- tsc --noEmit
```

需要纠正三个误区：

- `npx` **不保证总是最新版**；是否使用本地版本或哪个远程版本取决于 package specifier。
- 它执行的是包在 `bin` 字段暴露的命令，不是任意包内任意 JavaScript。
- 临时执行远程包仍有供应链风险；关键脚本应固定版本，CI 中尤其不要随意执行 `@latest`。

## CLI 包的 `bin`

```json
{
  "name": "my-cli",
  "type": "module",
  "bin": {
    "my-cli": "./bin/cli.js"
  }
}
```

入口文件需要 shebang，并在类 Unix 系统上具有可执行权限：

```js
#!/usr/bin/env node
```

本地开发可使用 `npm link` 验证全局命令，但普通项目优先通过 package scripts 或 `npm exec` 调用工具，减少全局环境差异。

## 发布与私有 registry

基础流程：

```bash
npm login
npm pack --dry-run
npm publish
```

发布前至少检查：

- registry、包名、scope、版本号和 dist-tag。
- `files`、`.npmignore` 与 `npm pack --dry-run` 的实际发布清单。
- 构建产物、入口、类型声明、`exports` 和 `engines`。
- token、`.env`、私有 URL、源码映射和内部测试数据。
- 2FA、provenance、权限和废弃版本策略。

Verdaccio 可以搭建轻量私有 registry，但现代团队也常使用 GitHub Packages、GitLab Package Registry、云厂商制品库等。私服的价值主要是权限、治理与可用性；它不会自动让依赖安全。

## 参考资料

- [npm package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/)
- [npm package-lock.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/)
- [`npm ci`](https://docs.npmjs.com/cli/v11/commands/npm-ci/)
- [npm scripts](https://docs.npmjs.com/cli/v11/using-npm/scripts/)
- [`npm exec` / `npx`](https://docs.npmjs.com/cli/v11/commands/npm-exec/)
- [npm package spec](https://docs.npmjs.com/cli/v11/using-npm/package-spec/)
