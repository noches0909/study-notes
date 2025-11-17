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
