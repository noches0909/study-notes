# TS 个人归纳

## 安装

```sql
bun add typescript -g
tsc -v
```

## Object、object、{}

- Object: 包含所有类型
- object: 非原始类型的类型
- {}: 可以理解为 new Object，包含所有类型

## 函数类型

```ts
// 接口声明函数类型
interface Fn {
  (name: string): number[]
}

const fn: Fn = function (name: string) {
  return [1]
}
```

ts 可以定义 this 的类型，函数参数的第一个参数，js 中不可以，

```ts
interface Obj {
  user: number[]
  add: (this: Obj, num: number) => void
}

let obj: Obj = {
  user: [1, 2, 3],
  add(this: Obj, num: number) {
    this.user.push(num)
  },
}

obj.add(4)
```

**函数重载**

在一个函数中实现传入不同的参数，返回不同的结果

```ts
const arr = []
function fn(add: number[]): number[]
function fn(id: number): number[]
function fn(ids: number | number[]): number[] {
  if (Array.isArray(ids)) {
    arr.push(...ids)
  } else {
    return arr.filter((v) => v == ids)
  }
}
```

## 类型断言

编译期指令，不会强制运行时校验

```ts
const el = document.getElementById("app") as HTMLDivElement // jsx中更推荐
const el = <HTMLDivElement>document.getElementById("app")
```

## symbol

```tsx
// symbol意味唯一类型，所以a1和a2的值不相等
let a1: symbol = Symbol(1)
let a2: symbol = Symbol(1)

// for会全局查看有没有注册过该key，有的话直接使用，没有才创建新的
Symbol.for("1") === Symbol.for("1") // true
```

正常 for in、Object.keys、无法获取到 symbol 属性，使用`Reflect.ownKeys()`可以遍历到

## 泛型

理解为动态类型

**泛型约束**

`extends` 关键字，前面的类型只能被约束为后面的类型

```tsx
interface Data {
  name: string
  age: number
}

type Options<T extends object> = {
  readonly [key in keyof T]: T[key]
}

type B = Options<Data>
```

**泛型工具**

- Partial<T>：将 T 的所有属性变为可选（?）
- Required<T>：将 T 的所有属性变为必选（-?）
- Readonly<T>：将 T 的所有属性变为只读
- Pick<T, K>：从 T 中选择 K 属性构造一个新类型
- Omit<T, K>：从 T 中剔除 K 属性构造一个新类型
- Record<K, T>：构造一个对象类型，其属性键为 K，属性值为 T
- Exclude<T, U>：从 T 中剔除 U 的类型
- Extract<T, U>：从 T 中提取 U 的类型
- NonNullable<T>：剔除 T 中的 null 和 undefined
- ReturnType<T>：获取函数 T 的返回类型
- InstanceType<T>：获取构造函数 T 的实例类型

**infer**

推断泛型的参数，用于条件类型中，只能出现在 extends 子语句中

```ts
// 声明User接口类型
interface User {
  name: string
  age: number
}

// 声明PromiseType类型，值为嵌套的Promise<User>
type PromiseType = Promise<Promise<Promise<User>>>

// 条件类型，判断T是否为Promise类型，如果是则使用infer推断出U类型，否则返回T本身
// 递归调用GetPromiseType，直到U不再是Promise类型为止
type GetPromiseType<T> = T extends Promise<infer U> ? GetPromiseType<U> : T

type T = GetPromiseType<PromiseType> // User
```

**infer 递归**

```ts
// 将它翻转
type Arr = [1, 2, 3, 4]

type ReverArr<T extends any[]> = T extends [infer First, ...infer Other]
  ? [...ReverArr<Other>, First]
  : T

type Arr2 = ReverArr<Arr> // 4 3 2 1
```

## 命名空间

隔离类型，避免全局污染

namespace 里面的变量和方法必须要导出才可以使用，支持嵌套，命名空间也需要导出，支持合并、简化

可以用在跨端项目中，为不同的平台提供不同的变量方法

## 声明文件

d.ts：声明文件后缀

`declare`关键字可以扩充变量、方法、类等，变为全局

## 装饰器

在不修改原结构的情况下，通过装饰器为类添加属性和方法

## 进阶内容

### proxy 和 reflect

- proxy 用于创建一个对象的代理，从而可以对该对象进行拦截和修改

- reflect 用于操作对象的底层方法

```ts
const obj = {
  name: "proxy",
  age: 18,
}

// object.name 等效
// Reflect.get(obj, "name")

let objProxy = new Proxy(obj, {
  get(target, prop, receiver) {
    console.log("get", prop)
    return Reflect.get(target, prop, receiver)
  },
  set(target, prop, value, receiver) {
    console.log("set", prop, value)
    return Reflect.set(target, prop, value, receiver)
  },
})

// reflect 的第三个参数用于确定 this 指向
```

### 类型守卫

```ts
// 类型收缩
const isObj = (arg: any) => ({}.toString.call(arg) === "[object Object]")
// 自定义守卫：如果函数返回 true，则 arg 的类型就是后面的类型
const isStr = (arg: any): arg is string => typeof arg === "string"
const isNum = (arg: any): arg is number => typeof arg === "number"
const isFn = (arg: any): arg is Function => typeof arg === "function"
```

### 协变（鸭子类型）

- 协变：值类型，子类型可以赋值给父类型（子类型内的类型可以全覆盖父类型）
- 逆变：函数参数类型，父类型可以赋值给子类型（子类型内的类型可以部分覆盖父类型）
- 双向协变：既可以赋值给父类型，也可以赋值给子类型。不安全，需要通过`--strictFunctionTypes`开启。

**infer 协变**：会返回联合类型

```ts
const obj = {
  name: "ts",
  age: 18,
}

type Bar<T> = T extends { name: infer U; age: infer U } ? U : never

type T = Bar<typeof obj> // string | number
```

**infer 逆变**：会返回交叉类型

```ts
type Foo<T> = T extends {
  a: (x: infer U) => void
  b: (x: infer U) => void
}
  ? U
  : "111"

type T = Foo<{
  a: (x: string) => void
  b: (x: number) => void
}> // never
```

## TS 封装 localStorage 并支持过期时间
