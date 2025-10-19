# React 进阶

## 1. tsx

插值语句`{}`,可以用来表达字符串、数字、数组（普通类型）、元素、三元表达式、API 调用、序列化对象等

```tsx
// 1.支持泛型函数，<T>会被理解为元素，需要加逗号纠正<T,>
// 2.绑定多个class，className 配合模版字符串语法
// 3.添加html代码片段

function App() {
  const fn = <T,>(params: T) => {
    console.log(params)
  }

  let html = `<div>1</div>`

  return (
    <>
      <div
        className={`aa bb cc`}
        dangerouslySetInnerHTML={{ __html: html }}
        onclick={(e) => fn(123)}
      ></div>
    </>
  )
}
```

## 2. babel 和 swc

### babel 工具：

- 新 js 语法转旧语法
- Polyfill：引入额外代码，使新功能在旧浏览器可用
- jsx 转 js 语法
- babel 还会提供一些额外的插件

@babel/core：babel 集合库
@babel/preset-env：es6 转 es5 核心包
@babel/preset-react：支持 jsx

### swc 工具：

- babel 罗列的功能
- 基础的模块打包（不推荐使用）
- 代码压缩和优化
- 原生支持 ts
- 配置方便，上手简单，效率高

编译型语言 Rust 编写的，编译时将代码转化为了机器码，速度非常快

> 解释型语言 js 编译效率低，扫描器 Scanner，词法分析语法分析后转为 ast 语法树，再经过一系列的操作才转为机器码

## 3. vdom、fiber、diff 和 schedule（调度器）

vdom：

- 性能优化，主要体现在 diff 的复用
- 跨平台（RN、Taro）

React Fiber：React16 引入该架构，解决大文件卡顿问题

- 可中断渲染，Fiber 会拆分渲染任务
- 优先级调度，优先更新用户感知部分
- 双缓存树，更新前后状态比对
- 任务切片

浏览器一帧执行的任务最后，如果有空闲时间，会执行 requestIdleCallback（并非调用该原生方法，而是使用这个思想）

在 requestIdleCallback 中执行耗时任务，并分帧执行（比如处理 10000 个元素，分成 3 帧，3000、3000、4000）

原虚拟 DOM 结构：React => (A + B +C)
Fiber 链表结构：React => A => B => C 且可回溯

react 选择使用 MessageChannel 替代原生的 requestIdleCallback 来实现调度，如果浏览器不支持 MessageChannel 就会使用 setTimeout

- requestIdleCallback 兼容性差、精细度不够，执行间隔为 50ms
- setTimeout 嵌套调用超过 5 次，会强制超时 4 毫秒执行
- MessageChannel 可以 0 延迟

## 4. hooks

### 4.1 useState

```tsx
const [state, setState] = useState("hello")
```

初始化 useState 可以传函数（必须带有 return），且只会执行一次

setState 设计为了异步渲染，为了性能优化，多个重复性的 setState 在队列中会进行后续阻断，可以理解为自带防抖，最后才会 render，可以通过传入回掉函数以更新的方式来解决异步渲染

### 4.2 useReducer

集中式状态管理，相比于 useState 可以管理更复杂数据的状态（数组、对象）

```tsx
// 三个参数：处理函数，默认值，初始化函数(可选)
// 处理函数默认不执行，调用dispatch才会执行
// 初始化函数仅执行一次
const [state, dispatch] = useReducer(reducer, initaialArg, init)
```

### 4.3 useImmer（immer 库）

相比于 useReducer 的操作对象和数组，要简便的多，并且符合 react 的思想，更改操作不会修改原对象。

```tsx
setState((draft) => {
  draft.name = "xxx"
  // draft.children.push({name: 'yyy'})
})
```

### 4.3 useSyncExternalStore

主要用于管理外包存储的数据状态，redux、Zustand、storage 等

```tsx
// 三个参数：订阅数据源的变化，获取当前数据源快照，同2但是是在服务端（可选）
const res = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
```

- 手写实现一个订阅浏览器 API 的 hook： [useStorage](./src/hooks/useStorage.ts)
- 手写实现一个订阅 history 实现路由跳转的 hook[useHistory](./src/hooks/useHistory.ts)

getSnapshot 的返回值，如果不是上一次的的引用类型，那么 React 会重新渲染，如果总是不一样，那么就会陷入死循环。
