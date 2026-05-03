# TypeScript 简介

## 定位

TypeScript 是 JavaScript 的类型化超集，由微软维护。它不会改变 JavaScript 的运行时行为，而是在开发和编译阶段增加类型检查、编辑器提示、重构能力和接口约束。

核心理解：

- TypeScript = JavaScript + 静态类型系统。
- 浏览器和 Node.js 运行的仍然是 JavaScript。
- 类型只在编译期生效，运行时校验需要自己写。
- 类型系统的主要价值是提前暴露错误、描述数据结构、提升协作维护效率。

## 安装与编译

```bash
npm i -D typescript
npx tsc --init
npx tsc --watch
```

常见命令：

- `tsc file.ts`：编译单个文件。
- `tsc --init`：生成 `tsconfig.json`。
- `tsc --watch`：监听文件变化并自动编译。
- `tsc --noEmit`：只做类型检查，不输出 JavaScript。

## 类型总览

JavaScript 原有类型：

- `string`
- `number`
- `boolean`
- `null`
- `undefined`
- `bigint`
- `symbol`
- `object`，包含数组、函数、日期、正则等对象值

TypeScript 补充的常用类型：

- `any`：放弃类型检查。
- `unknown`：类型安全的未知值。
- `never`：永远不会出现的值。
- `void`：函数返回值不被使用。
- tuple：元组，固定位置的数组结构。
- enum：枚举，会生成运行时代码。
- literal：字面量类型，如 `"success"`、`1`、`true`。
- union：联合类型，如 `string | number`。
- intersection：交叉类型，如 `A & B`。

自定义类型主要使用：

- `type`：类型别名，适合联合、交叉、工具类型、复杂组合。
- `interface`：接口，适合描述对象、类的结构，支持继承和声明合并。

## 大小写类型

实际开发中优先使用小写原始类型：`string`、`number`、`boolean`。

```ts
let a: string = "hello" // 推荐
let b: String = "world" // 不推荐

a = "hello1"
a = new String("hello2") // 报错

b = "world1"
b = new String("world2") // 可以，但容易混淆原始值和包装对象
```

`String`、`Number`、`Boolean` 是包装对象类型，不是日常变量标注的首选。

## 自动装箱

JavaScript 允许原始值临时访问包装对象上的属性和方法：

```js
const str = "hello"

console.log(str.length)
console.log(str.toUpperCase())
```

可以理解为运行时临时把原始字符串包装成 `String` 对象，访问结束后再销毁。因此 `string` 能调用字符串方法，但它仍然不是 `String` 对象。
