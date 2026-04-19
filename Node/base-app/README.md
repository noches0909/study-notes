# Node.js

## 介绍

Node.js并不是一门编程语言，编程语言是js/ts，他和bun.js一样，是js的运行时。

Node.js适合干一些IO密集型应用，不适合干CPU密集型应用（图像、音频、大量数据结构和算法），Node.js依靠libuv高效处理，同时Node.js是单线程，容易造成CPU占用过高，需要依赖C++插件（addon、Napi）或cluster。

Node.js适配场景：主要依赖node.js环境进行编译，高性能可扩展。

- 前端：React、Vue、Nuxt、Next

- 后端：
  - serverLess

  - web应用（express、Fastify、Nest）

  - RPC服务（gRPC）：跨语言级别的通讯，比如和java的通讯

  - 爬虫（Puppeteer、cheerio）

  - BFF层、网关层

  - 及时性应用socket.io

- 桌面端：electron、tauri、NWjs

- 移动端：React Native、week、hybrid、ionic

- 基建端：webpack、vite、rollup、gulp、less、scss、postCss、babel、swc、inquire、command、shelljs

- 嵌入式：Ruff.js

- 单元测试：jest、vitest、e2e

- CICD：jenkins、docker、Husky、miniprogram

- 反向代理：http-proxy、Any-proxy

### 安装

安装过于简单，入门前端就会了，可以官网直接下载安装、或者命令行安装，现阶段（26年）较为推荐安装`volta`来进行node管理。

## npm

- npm init 创建一个package.json描述文件，可以接-y，跳过交互提问。
  - npm i 包名 -D ：devDependencies 开发依赖，webpack、vite等

  - npm i 包名：dependencies 生产依赖，Vue、React等。

  > peerDependencies 对等依赖，给编写插件/包的开发人员使用

- npm config list 查询npm配置信息

- npm ls -g 查看全局安装命令

### npm install 原理

1. 执行npm install的时候发生了什么？

   以扁平化的方式将依赖安装到node_modules中，以.bin然后@然后首字母abcd这样的顺序排列，广度优先遍历算法，npm会先处理项目根目录依赖，再逐层处理每个依赖包的依赖，处理每个依赖的时候还会检查版本号是否符合其他依赖的版本要求，不符合会尝试安装适合的版本。

   > 其实并不是完全扁平化，如果A和B两个依赖分别依赖C1.0和C2.0,那么它就不会将C提取到A和B同一级别而是A和B分别安装C不同版本的依赖，会冗余。

2. install的后续流程？

   查找npm config配置文件.npmrc，顺序是项目级-用户级-全局级-npm内置，找不到就依次往下找。

   检查package-lock.json文件，有就匹配packagen.json文件的依赖版本，版本相同随后检查缓存。版本不同就更新lock文件，如果没找到lock文件就获取包信息去构建依赖树，随后再检查缓存。

   有缓存会解压到node_modules文件，没有就会下载资源了再添加缓存，更新lock文件再解压。

3. package-lock.json文件的作用？

   记录版本信息，记录缓存：integrity+version+pathname生产hash名称的二进制文件到cache，下载的时候看能否匹配缓存。

### npm run 原理

1. npm run xxx发生了什么？

   查找node_modules/.bin，依次项目-全局-环境变量，查找到对应的命了就执行，命令配置在package.json文件的bin对象。

### npx

使用npm运行我们没有配置的命令，相较于npm的优势：

1. 避免全局安装，就可以执行npm package

2. 总是最新的版本，npx总是下载最新版本。

3. 执行任意包，而不局限于命令。

4. 可以执行github gist或其他开源js

npx更偏向命令的执行，npm更偏向依赖的操作

例子：`npx create-react-app my-app`，我们并不需要安装create-react-app脚手架，就可以通过它新建一个react项目

### npm包发布

- npm adduser 注册

- npm login 登录

  **发布前检查npm源、版本号**

- npm publish 发布

### npm私服搭建

团队内部搭建，供团队内部安装迭代，不公开，提高安全性和下载速度。

使用一款开源工具安装：`npm install verdaccio -g`

## 模块化

Node.js遵循两套模块化规范：CommonJs、esm（import、export），通过在package.json文件中修改type来切换

### CommonJs

- 引入自己编写的模块：`require('./test.js')`

- 引入第三方模块：`require('md5')`

- 引入nodejs内置模块：`require('node:fs')`

- 引入.node模块，通常是C++扩展通过node-gyp编写后的文件

- 引入json文件：`require('./data.json')`

- 导出：`module.exports`

### ESM

与前端一样的语法：import、export、export default。

```js
import json from "./data.json" with { type: "json" }
```

> 注意：nodejs过去无法使用import去引入json文件，需要额外with这么写，前端之所以能使用，是因为vite/webpack通过loader进行了支持。

### 二者区别

- Cjs基于运行时同步加载，esm基于编译时异步加载

- Cjs可以修改值，esm只读不可修改

- Cjs无法tree shaking，esm支持

- Cjs顶层this指向模块本身，esm中顶层this指向undefined

  import如果一定要写在逻辑里，可以当作函数使用

## 全局变量/全局API

nodejs相比于浏览器端，没有window对象，也没有dom和bom。nodejs的全局变量存在golbal对象下，使用关键字`golbalThis`，会自动根据当前环境去选择global还是window。

nodejs内置了常用的全局变量，比如：

- \_\_dirname：当前目录的绝对路径（esm无法使用）

- \_\_filename：当前文件的绝对路径（esm无法使用）

- Buffer：处理二进制、媒体数据等

- process：当前进程的配置

nodejs可以通过安装`jsdom`库模拟一个浏览器环境，去进行dom操作。

一个SSR（服务端渲染）的例子：[脚本](./ssrDemo.js)、[生成的页面](./ssrDemo.html)

### process

操作控制当前进程的全局API

- arch：获取cpu架构

- platform：获取操作系统平台

- argv：返回当前运行脚本的数组信息（当前运行主体，当前运行文件，当前运行的参赛）

- cwd：获取工作目录 同\_\_dirname

- memoryUsage：获取内存信息

- pid：获取进程pid

- exit：退出进程

- kill：杀死进程，需传pid

- env：获取操作系统所有环境变量，修改只在当前进程生效，不影响系统环境变量

  > 可以使用`cross-env`库，来区分开发环境、生产环境，`cross-env`内部会区分不同的操作系统

## 内置模块

### path

跟url/文件路径进行交互，path在不同的操作系统有差异。

> posix 是一套可移植操作系统的标准，macos、linux等系统都遵守了，但是windows没有完全遵守。

```js
const path = require("node:path")
// mac电脑处理不了正斜杠，需要以win的方式解析
path.win32.basename("\\foo\\xm.html")
// win电脑处理不了的就用posix的方式解析
// path.posix
```

- basename：返回路径的最后一段

- dirname：返回路径除最后一段的前面所有

- extname：返回.后面的内容，没有点就返回空字符串

- join: 拼接路径

- resolve: 解析路径，返回绝对路径，都是绝对路径就返回最后一个。

  常用：`path.resolve(__dirname, './index.cmd')`

- parse: 解析路径，返回一个对象，

- format: 解析对象，返回路径

- sep：当前平台的兼容斜杠，win返回\，posix返回/

### os

跟操作系统进行交互

- platform：获取操作系统平台（更机器语言） win32：windows darwin：mac

- release：获取操作系统版本（更机器语言）

- type：获取操作系统平台（更语义化）

- version：获取操作系统版本（更语义化）

> vite/webpack 启动项目时配置了open:true 打开浏览器，底层就是判断不同的操作系统分别调用对应的shell命令

- homedir：获取用户所在目录（mac底层：%HOME）

- arch：获取cpu架构

- cpus: 获取系统线程cpu信息

- networkInterfaces：获取网络信息

### child_process

子进程，用于执行shell命令，编写前端工程，处理CPU密集型应用

- exec：执行shell命令，有字节上限200k，需要传回调函数，返回buffer，适合小进程

- execSync：同步执行

- execFile：执行可执行文件，不走shell，更安全和高效

- execFileSync：同步执行

- spawn：启动一个子进程，实时返回流，无字节上限，适合大进程

- spawnSync：同步执行

> 底层exec是通过execFile实现的，而execFile是通过spawn实现的

- fork：spawn的特化版，只能接受js模块，专门开一个node脚本，并且能实现父子进程的通信
