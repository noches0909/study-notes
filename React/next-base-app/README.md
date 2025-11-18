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

- error：必须客户端渲染，加载报错的组件

- not-found（全局）：404 显示

next 组件默认是服务端渲染的，如果要使用 useState 之类的交互语法需要在组件顶部声明`use client`转为客户端渲染

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

#### 路由组

大型项目做分类用的，这样写：`(admin)`，这个文件仅用来分类，不会显示到 url。可以在单独的路由组里写 layout，路由文件名不可互相重复
