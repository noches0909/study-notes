# TypeScript 简介

## 介绍

1. ts 由微软开发，是基于 js 的扩展语言
2. ts 包含了 js 的所有内容，是 js 的超急
3. ts 新增了静态类型检查、接口、泛型等现代开发特性，适合大型项目
4. ts 需要编译为 js，然后才能交给浏览器或者其他 js 的运行环境执行

## 命令行编译

安装 typescript

```bash
npm i typescript -g
```

自动化编译

```bash
tsc --init
tsc --watch
```

## 类型总览

js：

1. string
2. number
3. boolean
4. null
5. undefined
6. bigint
7. symbol
8. object（Array、Function、Date、Error 等）

ts：

1. 包含所有 js 类型
2. any
3. unknown
4. never
5. void
6. tuple 元祖
7. enum 枚举

自定义类型的方式：type、interface

## 大小写类型

String、 Number 这些内置构造函数是用来创建包装对象的，实际开发中基本不用

```ts
let a: string = "hello" // 推荐
let b: String = "world" // 不推荐
// a的类型为string，b的类型为object

a = "hello1" // 无问题
a = new String("hello2") // 会报错

b = "world1" // 无问题
b = new String("world2") // 无问题
```

### 拓展自动装箱

```js
// 原始类型字符串
let str = "hello"

// 访问str.length时，js如下执行
let size = function () {
  // 1.自动装箱：创建一个临时的String对象包装字符串
  let tempStringObject = new String(str)
  // 2.访问对象的length属性
  let lengthValue = tempStringObject.length
  // 3.自动销毁临时对象，无感
  return lengthValue
}

console.log(size)
```
