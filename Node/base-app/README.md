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

- npm init 创建一个package.json描述文件
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
