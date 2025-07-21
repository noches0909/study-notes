# TypeScript 类型

## any

**任意类型**

any 类型的变量可以赋值给任何类型的变量，实际开发慎用 any。

## unknown

**未知类型**

unknown 是类型安全的 any。

## never

**无值类型**

不可以有任何值，实际开发较少遇到，通常用来限制函数的返回，比如抛出错误，或是由 ts 推断得出的类型。

## void

**空类型**

通常用作函数返回的声明，意为【函数不返回值，且调用者不依赖其返回值进行操作】,仅从返回值层面可以理解为 undefined，但是对该类型的数据进行任何操作都会报错，而 undefined 通常不会。

## object

**对象类型**

包含了所有非原始类型，范围太大，实际开发很少直接用它。

```ts
// 声明对象类型
let person: {
  name: "yy"
  age: "18"
  [key: string]: any // 索引签名
}

// 声明函数类型
let count: (a: number, b: number) => number
// 箭头符号为ts中表示函数类型，描述参数类型和返回类型

// 声明数组类型
let arr1: string[]
let arr2: Array<number>
```

## tuple

**元祖类型**

tuple 不是关键字，它是一种数量固定的特殊的数组类型

```ts
let arr1 = [string, number]
let arr2 = [string, boolean?]
let arr3 = [string, ...number[]]
```

## enum

**枚举类型**

enum 定义一组命名常量，增加可读性，更好维护

```ts
// 数字枚举，自动递增，反向映射
enum Direction {
  up,
  down,
  left,
  right,
}
console.log(Direction.up) // 0

// 字符串枚举，无反向映射
enum Direction {
  up = "Up",
  down = "Down",
  left = "Left",
  right = "Right",
}
console.log(Direction.up) // Up

// 常量枚举
// const关键字能在编译时内联，避免生产额外的代码
// 内联：ts在编译中将枚举值的引用替换为实际值，不会生成额外的枚举对象，减少代码量，提高运行性能
const enum Direction {
  up,
  down,
  left,
  right,
}
```

## type

**类型别名**

更好的复用和扩展

```ts
// 联合类型
type a = number | string

// 交叉类型
type x = { m: number }
type y = { n: string }
type b = x & y

// 使用类型声明函数返回void时，ts并不会严格要求函数返回为空
type fn = () => void

const arr1 = [1, 2, 3]
const arr2 = [0]
arr1.forEach((el) => arr2.push(el))
// Array.prototype.forEach期望返回void，而Array.prototype.push返回数组最新长度
```
