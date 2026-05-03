# TS 阶段归纳

这份笔记偏具体使用：不是按语法完整铺开，而是整理开发中容易反复遇到、也最容易写错的 TypeScript 习惯。

## 安装与检查

```bash
bun add -d typescript
bunx tsc --init
bunx tsc --noEmit
```

全局安装也能用，但项目里更推荐放到 `devDependencies`，保证团队、CI 和本地使用同一个 TypeScript 版本。

## Object、object、{}

这三个类型容易混。

- `Object`：几乎所有非 `null`、`undefined` 的值都可以赋给它，不推荐用于业务类型。
- `object`：非原始类型，不包含 `string`、`number`、`boolean`、`symbol`、`bigint`、`null`、`undefined`。
- `{}`：表示非 `null`、`undefined` 的值，原始值也能赋给它。

```ts
let a: Object
a = 1
a = "text"
a = {}

let b: object
b = {}
b = []
b = () => {}
b = 1 // 报错

let c: {}
c = 1
c = "text"
c = {}
c = null // strictNullChecks 下报错
```

业务对象优先写明确结构：

```ts
type User = {
  id: string
  name: string
}
```

## 函数类型

### 函数接口

```ts
interface Fn {
  (name: string): number[]
}

const fn: Fn = (name) => {
  console.log(name)
  return [1]
}
```

更常见的写法是类型别名：

```ts
type Fn = (name: string) => number[]
```

### this 参数

TypeScript 可以给函数声明一个假的第一个参数 `this`，它只参与类型检查，不会出现在 JavaScript 运行时参数里。

```ts
interface Obj {
  user: number[]
  add(this: Obj, num: number): void
}

const obj: Obj = {
  user: [1, 2, 3],
  add(num) {
    this.user.push(num)
  },
}

obj.add(4)
```

对象方法建议使用普通函数语法；箭头函数没有自己的 `this`。

### 函数重载

重载用于表达“不同入参对应不同返回值”。

```ts
const ids: number[] = []

function findOrAdd(add: number[]): number[]
function findOrAdd(id: number): number[]
function findOrAdd(value: number | number[]): number[] {
  if (Array.isArray(value)) {
    ids.push(...value)
    return ids
  }

  return ids.filter((item) => item === value)
}
```

注意：

- 重载签名写在前面，实现签名写在最后。
- 实现签名必须能兼容所有重载签名。
- 能用联合类型清楚表达时，不必强行重载。

## 类型断言

类型断言只影响编译期，不做运行时校验。

```ts
const el = document.getElementById("app") as HTMLDivElement | null
```

在 JSX/TSX 中只能使用 `as` 写法，因为 `<HTMLDivElement>value` 会和 JSX 标签冲突。

更安全的写法是先判断：

```ts
const el = document.getElementById("app")

if (el instanceof HTMLDivElement) {
  el.dataset.ready = "true"
}
```

双重断言要克制：

```ts
const value = source as unknown as Target
```

这通常表示类型信息缺失，最好补类型声明或运行时校验。

## symbol

`Symbol()` 每次都会创建唯一值，即使描述相同也不相等。

```ts
const a1 = Symbol("id")
const a2 = Symbol("id")

console.log(a1 === a2) // false
```

`Symbol.for()` 会从全局 symbol 注册表中查找或创建。

```ts
Symbol.for("id") === Symbol.for("id") // true
```

普通的 `for...in`、`Object.keys()`、`JSON.stringify()` 都不会枚举 symbol 键。需要完整获取自身键时使用：

```ts
Reflect.ownKeys(obj)
```

## 泛型

泛型可以理解为“类型参数”，不是动态类型。它让一段实现保留类型关系。

```ts
function first<T>(items: T[]): T | undefined {
  return items[0]
}

const value = first(["a", "b"]) // string | undefined
```

### 泛型约束

`extends` 用来限制泛型必须符合某种结构。

```ts
function getName<T extends { name: string }>(value: T): string {
  return value.name
}
```

### keyof 与映射类型

```ts
interface Data {
  name: string
  age: number
}

type ReadonlyData<T extends object> = {
  readonly [Key in keyof T]: T[Key]
}

type Result = ReadonlyData<Data>
```

### 常用工具类型

- `Partial<T>`：所有属性可选。
- `Required<T>`：所有属性必选。
- `Readonly<T>`：所有属性只读。
- `Pick<T, K>`：从 `T` 中选择部分属性。
- `Omit<T, K>`：从 `T` 中排除部分属性。
- `Record<K, T>`：构造键为 `K`、值为 `T` 的对象类型。
- `Exclude<T, U>`：从联合类型 `T` 中剔除可赋给 `U` 的成员。
- `Extract<T, U>`：从联合类型 `T` 中提取可赋给 `U` 的成员。
- `NonNullable<T>`：剔除 `null` 和 `undefined`。
- `ReturnType<T>`：获取函数返回值类型。
- `Parameters<T>`：获取函数参数元组类型。
- `InstanceType<T>`：获取构造函数的实例类型。
- `Awaited<T>`：递归获取 Promise resolve 后的类型。

### infer

`infer` 只能出现在条件类型的 `extends` 分支中，用于提取类型。

```ts
type UnwrapPromise<T> = T extends Promise<infer U> ? UnwrapPromise<U> : T

type User = {
  name: string
  age: number
}

type Result = UnwrapPromise<Promise<Promise<User>>> // User
```

递归处理元组：

```ts
type Reverse<T extends unknown[]> = T extends [infer First, ...infer Rest]
  ? [...Reverse<Rest>, First]
  : T

type Result = Reverse<[1, 2, 3, 4]> // [4, 3, 2, 1]
```

## 命名空间与声明文件

现代项目业务代码优先使用 ES Module：

```ts
export function parse(input: string) {
  return JSON.parse(input)
}
```

`namespace` 主要在声明文件、全局库兼容、旧项目中出现。

`.d.ts` 是声明文件，只提供类型信息，不提供运行时代码。

```ts
declare module "legacy-lib" {
  export function request(url: string): Promise<unknown>
}
```

扩展全局类型时要显式进入全局作用域：

```ts
export {}

declare global {
  interface Window {
    appVersion: string
  }
}
```

## 装饰器

装饰器适合框架和横切逻辑，不适合把普通业务流程藏起来。

TypeScript 里要区分两套装饰器：

- legacy decorators：老项目常见，启用 `experimentalDecorators`，使用 `target`、`propertyKey`、`descriptor`。
- standard decorators：TypeScript 5.0 起支持的新语义，使用 `value` 和 `context`。

新版方法装饰器示例：

```ts
function Logger<This, Args extends unknown[], Return>(
  original: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
) {
  return function (this: This, ...args: Args): Return {
    console.log("start", String(context.name))
    const result = original.call(this, ...args)
    console.log("end", String(context.name))
    return result
  }
}

class Service {
  @Logger
  run(id: string) {
    return id
  }
}
```

## Proxy 和 Reflect

`Proxy` 用来代理对象操作，`Reflect` 提供与代理 trap 对应的默认对象操作。

```ts
const obj = {
  name: "proxy",
  age: 18,
}

const objProxy = new Proxy(obj, {
  get(target, prop, receiver) {
    console.log("get", prop)
    return Reflect.get(target, prop, receiver)
  },
  set(target, prop, value, receiver) {
    console.log("set", prop, value)
    return Reflect.set(target, prop, value, receiver)
  },
})
```

`receiver` 会影响访问器属性中的 `this` 指向，写代理时尽量把它传给 `Reflect`。

## 类型守卫

类型守卫用于把宽类型缩小成具体类型。

```ts
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]"
}

function isString(value: unknown): value is string {
  return typeof value === "string"
}

function isNumber(value: unknown): value is number {
  return typeof value === "number"
}
```

判别联合是业务里最实用的类型守卫：

```ts
type Loading = { status: "loading" }
type Success = { status: "success"; data: string[] }
type Failed = { status: "failed"; error: Error }

type State = Loading | Success | Failed

function render(state: State) {
  switch (state.status) {
    case "loading":
      return "loading"
    case "success":
      return state.data.join(",")
    case "failed":
      return state.error.message
    default:
      return assertNever(state)
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`)
}
```

## 协变、逆变与函数参数

可以先记一个实用结论：

- 对象属性通常按结构兼容，字段更多的值可以赋给字段更少的类型。
- 函数返回值更像协变：返回更具体的类型通常安全。
- 函数参数更像逆变：能处理更宽泛参数的函数，可以放到需要更具体参数的位置。

```ts
type Animal = { name: string }
type Dog = { name: string; bark(): void }

let dog: Dog = { name: "A", bark() {} }
let animal: Animal = dog // OK，Dog 至少拥有 Animal 的结构
```

函数参数在 `strictFunctionTypes` 下更严格：

```ts
type DogHandler = (dog: Dog) => void
type AnimalHandler = (animal: Animal) => void

let handleAnimal: AnimalHandler = (animal) => console.log(animal.name)
let handleDog: DogHandler = handleAnimal // OK，能处理 Animal，自然能处理 Dog
```

`infer` 在协变位置可能推出联合类型：

```ts
type Bar<T> = T extends { name: infer U; age: infer U } ? U : never

type Result = Bar<{ name: string; age: number }> // string | number
```

在逆变位置可能推出交叉类型；对于互不相交的原始类型，交叉结果会变成 `never`。

```ts
type Foo<T> = T extends {
  a: (x: infer U) => void
  b: (x: infer U) => void
}
  ? U
  : never

type Result = Foo<{
  a: (x: string) => void
  b: (x: number) => void
}> // never
```

## 封装 localStorage 并支持过期时间

浏览器 `localStorage` 只能存字符串，因此要处理序列化、反序列化、过期时间和异常。

```ts
type StoragePayload<T> = {
  value: T
  expiresAt: number | null
}

type SetOptions = {
  ttl?: number
}

class LocalStorageCache {
  set<T>(key: string, value: T, options: SetOptions = {}) {
    const payload: StoragePayload<T> = {
      value,
      expiresAt: options.ttl ? Date.now() + options.ttl : null,
    }

    localStorage.setItem(key, JSON.stringify(payload))
  }

  get<T>(key: string): T | null {
    const raw = localStorage.getItem(key)

    if (!raw) {
      return null
    }

    try {
      const payload = JSON.parse(raw) as StoragePayload<T>

      if (payload.expiresAt && payload.expiresAt <= Date.now()) {
        localStorage.removeItem(key)
        return null
      }

      return payload.value
    } catch {
      localStorage.removeItem(key)
      return null
    }
  }

  remove(key: string) {
    localStorage.removeItem(key)
  }

  clear() {
    localStorage.clear()
  }
}
```

使用：

```ts
const cache = new LocalStorageCache()

cache.set("user", { id: "1", name: "Tom" }, { ttl: 60_000 })

const user = cache.get<{ id: string; name: string }>("user")
```

注意：`get<T>()` 的 `T` 仍然只是编译期承诺，不能证明本地存储里的真实数据一定符合结构。高可靠场景应配合运行时 schema 校验。
