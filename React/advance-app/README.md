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

## 3. vdom、fiber 和 diff

vdom：

- 性能优化，主要体现在 diff 的复用
- 跨平台（RN、Taro）

React Fiber：React16 引入该架构，解决大文件卡顿问题

- 可中断渲染，Fiber 会拆分渲染任务
- 优先级调度，优先更新用户感知部分
- 双缓存树，更新前后状态比对
- 任务切片

浏览器一帧执行的任务最后，如果有空闲时间，会执行 requestidleCallback（并非调用该原生方法，而是使用这个思想）

在 requestidleCallback 中执行耗时任务，并分帧执行（比如处理 10000 个元素，分成 3 帧，3000、3000、4000）

原虚拟 DOM 结构：React => (A + B +C)
Fiber 链表结构：React => A => B => C 且可回溯
