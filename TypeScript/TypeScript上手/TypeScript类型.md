# TypeScript 类型

## 顶层与底层类型

### any

`any` 会关闭类型检查，既可以接收任何值，也可以赋值给任何类型。

```ts
let value: any = 1
value.foo.bar()
```

适合临时迁移旧代码，不适合作为长期设计。

### unknown

`unknown` 表示未知值，比 `any` 安全。使用前必须先缩小类型。

```ts
function print(value: unknown) {
  if (typeof value === "string") {
    console.log(value.toUpperCase())
  }
}
```

### never

`never` 表示不可能出现的值，常见于抛错函数、死循环、穷尽检查。

```ts
function fail(message: string): never {
  throw new Error(message)
}
```

### void

`void` 常用于函数返回值，表示调用者不应该依赖返回结果。

```ts
function log(message: string): void {
  console.log(message)
}
```

## 对象类型

### object

`object` 表示非原始值，范围较大，通常不直接用于业务数据结构。

```ts
let value: object

value = {}
value = []
value = () => {}
value = "text" // 报错
```

### 对象字面量类型

```ts
let person: {
  name: string
  age: number
  readonly id?: string
  [key: string]: unknown
}
```

- `?`：可选属性。
- `readonly`：只读属性。
- `[key: string]: unknown`：索引签名，允许额外字符串键。

## 数组与元组

数组用于同类元素集合：

```ts
let names: string[] = ["Tom", "Jerry"]
let scores: Array<number> = [90, 95]
```

元组用于固定位置结构：

```ts
let point: [number, number] = [10, 20]
let result: [string, boolean?] = ["ok"]
let row: [string, ...number[]] = ["score", 90, 88, 96]
```

## 联合与交叉

联合类型表示“可以是其中之一”：

```ts
type Id = string | number
```

交叉类型表示“同时具备”：

```ts
type Named = { name: string }
type Aged = { age: number }
type Person = Named & Aged
```

## 字面量类型

字面量类型用于约束固定取值。

```ts
type Status = "idle" | "loading" | "success" | "error"
type Size = "sm" | "md" | "lg"
```

实际开发中，它常常比 `enum` 更轻量。

## enum

`enum` 定义一组命名常量，会生成运行时代码。

```ts
enum Direction {
  Up,
  Down,
  Left,
  Right,
}

console.log(Direction.Up) // 0
console.log(Direction[0]) // "Up"
```

字符串枚举没有数字枚举的反向映射：

```ts
enum Direction {
  Up = "UP",
  Down = "DOWN",
}
```

在现代前端项目中，也可以用 `as const` 对象替代：

```ts
const Direction = {
  Up: "UP",
  Down: "DOWN",
} as const

type Direction = (typeof Direction)[keyof typeof Direction]
```

## type

`type` 用来给类型起别名，适合组合类型。

```ts
type UserId = string | number

type User = {
  id: UserId
  name: string
}

type Handler = (event: Event) => void
```

当函数类型返回 `void` 时，表示调用方不使用返回值，并不强制实现函数只能返回 `undefined`。

```ts
type Callback = () => void

const callback: Callback = () => {
  return 1
}
```

这也是 `forEach` 可以接受返回值函数的原因，因为返回值会被忽略。
