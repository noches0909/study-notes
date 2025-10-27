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

### 4.4 useSyncExternalStore

主要用于管理外包存储的数据状态，redux、Zustand、storage 等

```tsx
// 三个参数：订阅数据源的变化，获取当前数据源快照，同2但是是在服务端（可选）
const res = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
```

- 手写实现一个订阅浏览器 API 的 hook： [useStorage](./src/hooks/useStorage.ts)
- 手写实现一个订阅 history 实现路由跳转的 hook[useHistory](./src/hooks/useHistory.ts)

getSnapshot 的返回值，如果不是上一次的的引用类型，那么 React 会重新渲染，如果总是不一样，那么就会陷入死循环。

### 4.5 useTransititon（优先级不高）

在实际工作中使用较少，管理 UI 的过渡状态，不阻塞 UI 的情况下更新状态，原理其实就是降低优先级，可用于列表的渲染优化。

```tsx
// startTransition仅能同步使用
const [isPending, startTransition] = useTransition()
```

### 4.6 useDeferredValue

延迟某些状态的更新，相比于 useTransititon 所关注的状态过渡，useDeferredValue 更关注单个值的延迟更新，可用于比如输入框的性能优化。

```tsx
const deferredValue = useDeferredValue(value)
```

> 它很像防抖，但并不是，延迟时间无法手动设置，看用户的机器性能

### 4.7 useEffect

- 纯函数：可预测，不依赖和改变外部的状态
- 副作用函数：可预测性降低，高耦合，会依赖或改变外部的状态

```tsx
// setup: 处理函数，页面挂载完成后执行，可以return一个清理函数cleanup，页面卸载后执行
// 依赖项要更新时，更新前执行cleanup，更新后执行setup，即防抖
useEffect(setup, dependencies)
// dependencies可选，数组
// 不传，任何状态改变都会执行
// 传空数组，仅初始化执行
// 传数组，依赖项改变后执行
```

### 4.8 useLayoutEffect

用法与 useEffect 一致

- useLayoutEffect 浏览器重新绘制屏幕前执行，且同步，会阻塞 dom 渲染
- useEffect 浏览器完成布局和绘制后执行，且异步，不阻塞 dom 渲染
- useInsertionEffect 很早在 dom 插入前就执行了，通常用于样式注入

### 4.9 useRef

操作 DOM、存储数据

- react 的 ref，只是一个普通的 js 对象非响应式，通过.current 获取值。
- vue 的 ref，是响应式对象，通过.value 获取值。

关于数据存储：

通常在操作 setState 时会重新渲染组件，普通的变量也会被初始化，而 useRef 并不会跟着组件重新渲染，所以适合存储数据

### 4.10 useImperativeHandle

子组件内部暴露给父组件方法或属性，类似 Vue 的 defineExpose

```tsx
useImperativeHandle(
  ref,
  () => ({
    name: 123,
    fn: () => {},
  }),
  [] // 依赖项
)
```

### 4.11 useContext

解决 props 只能一层一层传递的问题，实现祖孙级别的传值，类似 vue 的 provide 和 inject

### 4.12 useMemo

useContext、组件的 props 和 state 发生变化会触发组件的重新渲染

React.memo：使用 React.memo 函数包裹子组件可以避免组件重新渲染，优化性能

useMemo：缓存上一次计算的值，类似 vue 的 computed

### 4.13 useCallback

缓存函数

涉及到父子组件通信时，父组件传入函数供子组件调用，即使字组件被 memo 包裹了，在调用该函数时也会重新渲染子组件，可以通过 usecallback 包裹该函数解决

> 父组件触发重新渲染后，即使 props 没变，但会导致传给子组件的函数内存地址不一致了，从而会触发子组件的重新渲染

### 4.14 usedebugValue

用来调试自定义 Hook

### 4.15 useId

生成稳定的唯一 ID，服务端渲染 SSR 用的比较多

### 4.16 use

react19 新增，用来获取组件中 promise 返回的内容、context 的内容等

### 5. 组件

### 5.1 父子组件传值

props：父传子属性和方法

props.children 里包含“插槽”

### 5.2 兄弟组件传值

发布订阅模式：vue event bus、window.addEventListener、mitt

```tsx
// 发布方
const e = new.event("on-test")
const handleTap = () => {
  e.params = { name: "参数" }
  window.dispatchEvent(e)
}

// 接受方
window.addEventListener("on-test", (e) => {
  console.log(e.params)
})
```

### 5.3 受控组件与非受控组件

受控组件：通常指表单元素，由 state 和 onchange 来管理，类似 vue 的 v-model

非受控组件：通常由 useRef() 来获取值，操作 dom 来管理

input file 是一个非受控组件，不能用 state 管理

### 5.4 异步组件 Suspense

- 代码分包按需加载，优化首页性能
- 数据请求中的优雅过渡，骨架屏等
- 图片加载前的占位，如瀑布流

```tsx
// lazy会分包代码，按需加载
const AsyncComponent = lazy(() => import("./components/Async"))
const App = () => {
  // AsyncComponent组件加载中会先显示fallback的内容，加载完成后再展示组件内容
  return (
    <Suspense fallback={<div>loading...</div>}>
      <AsyncComponent />
    </Suspense>
  )
}
```

### 5.5 高阶组件 HOC（Higher Order Component）

不常用，可以理解为二次封装组件，通常出现在类组件中，with 开头的命名

### 6 createProtal

将一个组件渲染到指定 DOM 的位置，弹窗、遮罩、模态框等，类似 vue 的 Teleportl

```tsx
import { createProtal } from "react-dom"

const App = () => {
  // children：要渲染的组件
  // domNode：渲染的制定DOM位置
  // key可选：唯一标识
  // return一个jsx
  return createProtal(<div>test</div>, document.body)
}
```
