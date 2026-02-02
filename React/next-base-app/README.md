# Next.js

版本：React 19 + Next 16

安装：`npx create-next-app`、`bun create next-app`

## 架构介绍

Next.js：开箱即用的静态生产、SSR 服务端渲染和 SEO 优化

- Turbopack：Rust 编写，性能比 webpack 强非常多

  - 支持多环境统一，不再需要拆分拼接了
  - 惰性打包：仅打包需要用到的内容
  - 增量计算：多核工作、函数级缓存

- React Compiler：不再需要手动 useMemo、useCallback、memo 缓存了

- App Router：约定定义路由系统的目录，在 src/app 下直接建 page 自动生效

> Pages Router 无法在页面组件处编写组件（会被编译为页面），且他读取数据要使用 getServerSideProps 等函数，

## App Router

- layout：嵌套组件，数据持久化，优先级高

- template：模版组件，数据不缓存，优先级低

- page：页面组件

- loading：page 异步加载时显示的组件

- error：必须客户端运行，加载报错的组件

- not-found（全局）：404 显示

next 组件默认是在服务端运行的，如果要使用 useState 之类的交互语法需要在组件顶部声明`use client`转为客户端运行

### 路由导航

Link 标签可做跳转，useRouter hook 可做函数式编程

- prefetch 属性，默认为 true，初始化预加载 href 内容，生产环境生效

- scroll 属性，默认为 true，跳转后滚动条位置变为顶部，否则会保持不变

- replace 属性，默认为 false，设为 true 后跳转后不留历史记录

redirect: 307 临时重定向

permanentRedirect：308 永久重定向

### 动态路由

文件名：

- `[id]` 捕获一个参数

- `[...id]` 捕获后续所有参数

- `[[...id]]` 可选

### 平行路由

在一个页面里面展示多个路由页面，这样写：`@about`，并且该路由文件下可以写单独的 loading、error 文件，甚至子路由

使用平行路由时，为避免硬导航（手动刷新）页面导航至子路由产生 404，我们可以在路由下面新建 default 文件进行兜底

### 路由组

大型项目做分类用的，这样写：`(admin)`，这个文件仅用来分类，不会显示到 url。可以在单独的路由组里写 layout，路由文件名不可互相重复

### 路由处理程序

接口文件规范：必须得是 route.ts

[后端接口处理 demo](./src/app/api/user/route.ts)

[测试请求](./test.http)

## Cookie 实战

安装 shadcn 来模拟前端登录

```sql
bunx --bun shadcn@latest init
bunx --bun shadcn@latest add button
bunx --bun shadcn@latest add input
```

[登录页](./src/app/page.tsx)

[首页](./src/app/home/page.tsx)

[登录接口和检查 token 接口](./src/app/api/login/route.ts)

## Proxy 代理

16 以前称之为 middleware 中间件

处理跨域、接口转发、第三方限流、鉴权

[Proxy 代理示例](./src/proxy.ts)

> 注意：此处的 Proxy 并不是 vite、webpack 的 dev server 的 proxy 配置，而是 服务端路由层面的代理，在生产环境也同样适用

## BFF

backend for frontend，即前端的后端。

Next.js 虽然是全栈框架，并且能写供前端调用的接口，但它本质上仍是通过 Node.js 加一层中间件（BFF），以沟通前后端，在大型项目中并不能替代后端。

这样做的好处：

1. 跨域和转发，不需要借助其它工具，直接在 proxy 里配置即可

2. 鉴权，统一处理 cookie、token、session

3. 可以访问一些前端无法访问的内部接口

4. 安全，隐藏真实接口地址，用户无法绕过前端直接访问后端了

## 组件

### 渲染方式

- CSR(Client Side Rendering)：客户端渲染，Vue、React、Angular

- SSR(Server Side Rendering)：服务端渲染，Next.js、Nuxt.js

- SSG(Static Site Generation)：静态站点生成，VitePress、Astro

**Hydration 水合**：服务端渲染生成的 HTML 到达浏览器后，React 会将其转为可交互的页面，这个过程称为水合

### RSC

React Server Component 服务器组件

一个页面可能并不是所有组件都需要进行交互，可以将一些偏静态的数据放在服务器组件，动态交互的就使用`use client`以客户端组件渲染。

且组件之间会进行嵌套，客户端组件会在服务器中进行一次预渲染（无交互，有展示）。

而使用 RSC 的优点：

- 减少 bundle 体积，服务器组件在服务器渲染

- 可以使用 Node 相关的 API 操作数据库

- 局部水合客户端组件

- 流式加载，边渲染边返回

可以使用`server only`插件，限制只能在服务端调用。

### 缓存组件

Next16 新增的机制，实现了静态内容，动态内容，缓存内容的混合编排，需要在`next.config.ts`文件中将`cacheComponents`属性设为 true

- 静态内容：本地文件模块，纯计算数据。构建时预渲染，直接编译成 html。

- 动态内容：featch，Cookie，Header，Url 等。用户发起请求才会渲染，不会缓存。

- 缓存内容：缓存动态数据，缓存后纳入静态外壳。

动态内容需配合 Suspense 组件包裹使用，未渲染时占位。

使用 featch 等 api 会自动使组件变成动态内容，但如果我们有时候想要手动实现动态内容，比如`Math.random()`，就需要借助`await connection()`。

在函数组件内顶部加上`use cache`可以形成缓存内容。可以使用`cacheLife()`来配置缓存参数进行精细化控制

### 缓存策略

Next 会尽可能多的缓存我们的内容，但有时候我们不需要这样的优化，对于`cacheComponents`未设置为 true 的情况，有这几种方式解决缓存：

- `export const revalidate = 0` 组件重新渲染时间（S）

- `export const dynamic = 'force-dynamic'` 组件以动态方式编译

- `{cache: 'no-store'}`接口加参数，不缓存接口

对于`cacheComponents`设置为 true 的情况，`export const dynamic = 'force-dynamic'`就没有意义了。

### Image 组件

Next 内置的图片组件，是对 img 标签的拓展

优化尺寸适配现代图片格式，视觉稳定，支持懒加载，灵活按需调整大小

属性：

- loading：eager 立即加载、lazy 懒加载（默认），通常首屏不需要懒加载

- preload：提升加载优先级

- src：支持直接导入（/public/xxx.png）、静态导入（顶层 import）、动态导入（组件内 import 后 default）
  其中直接导入需要确定宽高（或者使用 fill，撑满），其余两种导入不用，因为在引入的时候就获取到信息了。

加载远程在线图片时无法直接使用，因为原则上只支持同域名下的文件，需要进行额外的配置策略协议。

还可以配置策略转化格式为 avif 或 webp，以达到缩小体积却不失真的效果。

[next 配置文件 - images](./next.config.ts)

### font 字体

- 内置：next/font/google

- 本地：next/font/local

### Script 组件

支持在组件里添加脚本

## SSG

SSG 静态导出。适用于博客、官网、文档的项目，一切动态功能 api 都会失效。

next.config.ts 中配置 `output: 'export'`

## MDX

在 markdown 中使用 react 组件，需要额外安装插件。

## 服务器函数 ServerActions

可以在服务器端处理表单的提交，状态的校验管理等。

使用原生的 form，button 必须写上`type="submit"`，推荐用 zod 库进行数据校验，因为需要在客户端组件使用交互，所以这样的服务器函数需要存放在专门的`src/app/lib`中。
