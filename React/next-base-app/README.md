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

## 渲染方式

- CSR(Client Side Rendering)：客户端渲染，Vue、React、Angular

- SSR(Server Side Rendering)：服务端渲染，Next.js、Nuxt.js

- SSG(Static Site Generation)：静态站点生成，VitePress、Astro

**Hydration 水合**：服务端渲染生成的 HTML 到达浏览器后，React 会将其转为可交互的页面，这个过程称为水合
