# Next.js

版本：React 19 + Next 16

安装：`npx create-next-app`、`bun create next-app`

## 架构介绍

Next.js 的主要作用是 SSR 服务端渲染和 SEO 优化

- Turbopack：Rust 编写，性能比 webpack 强非常多

  - 支持多环境统一，不再需要拆分拼接了
  - 惰性打包：仅打包需要用到的内容
  - 增量计算：多核工作、函数级缓存

- React Compiler：不再需要手动 useMemo、useCallback、memo 缓存了

- App Router：约定定义路由系统的目录，在 src 下直接建文件自动生效

> Pages Router 无法在页面组件处编写组件（会被编译为页面），且他读取数据要使用 getServerSideProps 等函数，
