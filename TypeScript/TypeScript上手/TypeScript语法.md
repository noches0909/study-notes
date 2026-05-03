# TypeScript 语法

## 类成员修饰符

- `public`：公开，类内部、子类、类外部都可访问，默认值。
- `protected`：受保护，类内部和子类可访问。
- `private`：私有，仅类内部可访问，属于 TypeScript 类型层面的私有。
- `readonly`：只读，只能在声明或构造阶段赋值。

```ts
class Person {
  constructor(
    public name: string,
    protected age: number,
    private id: string,
    public readonly createdAt = new Date(),
  ) {}
}
```

如果需要 JavaScript 运行时私有字段，可以使用 `#field`：

```ts
class Counter {
  #value = 0

  inc() {
    this.#value += 1
  }
}
```

## 抽象类

抽象类只能被继承，不能直接实例化。它可以包含普通实现，也可以声明必须由子类实现的抽象成员。

```ts
abstract class Store {
  constructor(public name: string) {}

  connect() {
    console.log(`${this.name} connected`)
  }

  abstract read(key: string): unknown
}

class MemoryStore extends Store {
  private data = new Map<string, unknown>()

  read(key: string) {
    return this.data.get(key)
  }
}
```

适合表达“有一部分通用实现，但关键能力必须由子类补齐”的场景。

## 接口

接口用于描述对象、函数或类的结构。

```ts
interface User {
  id: string
  name: string
  age?: number
}

const user: User = {
  id: "1",
  name: "Tom",
}
```

接口描述函数：

```ts
interface Add {
  (a: number, b: number): number
}

const add: Add = (a, b) => a + b
```

接口约束类：

```ts
interface Speaker {
  speak(message: string): void
}

class Person implements Speaker {
  speak(message: string) {
    console.log(message)
  }
}
```

## interface 和 type

都可以描述对象结构：

```ts
interface UserA {
  name: string
}

type UserB = {
  name: string
}
```

区别：

- `interface` 更适合对象和类，支持 `extends` 和声明合并。
- `type` 更适合联合、交叉、条件类型、映射类型等组合表达。
- 能用清楚的情况下保持一致即可，不必机械二选一。

## interface 和抽象类

- `interface` 只描述结构，不包含运行时实现，一个类可以实现多个接口。
- 抽象类可以包含实现，一个类只能继承一个父类。

## 泛型

泛型是在定义函数、类、接口时预留类型参数，使用时再确定具体类型。

```ts
function identity<T>(value: T): T {
  return value
}

identity<string>("hello")
identity(123)
```

多个泛型参数：

```ts
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second]
}
```

泛型约束：

```ts
function getLength<T extends { length: number }>(value: T): number {
  return value.length
}
```

泛型接口：

```ts
interface ApiResponse<T> {
  code: number
  data: T
  message: string
}
```

泛型类：

```ts
class Box<T> {
  constructor(public value: T) {}
}
```

## 类型声明文件

`.d.ts` 文件只提供类型声明，不提供运行时实现。

常见来源：

- 库自带类型声明。
- `@types/*` 社区声明包。
- 项目内部自己补充的全局或模块声明。

```ts
declare module "legacy-lib" {
  export function parse(input: string): unknown
}
```
