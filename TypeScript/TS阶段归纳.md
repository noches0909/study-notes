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
