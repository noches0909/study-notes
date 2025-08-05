# TypeScript 语法

## 属性修饰符

- public **公开** *类内部、子类、类外部*可访问
- protected **受保护** *类内部、子类*可访问
- private **私有** *类内部*可访问

readonly **只读** 无法修改，加在前三类后面

```ts
class Person {
  public name: string
  public age: string
  constructor(name: string, age: string) {
    this.name = name
    this.age = age
  }
}

// 简写
class Person {
  constructor(public name: string, public age: string) {}
}
```

## 抽象类

**abstract**

只能被继承，不能被实现，抽象类中既可以有普通方法，也可以有抽象方法，**派生类必须实现它的抽象方法**

- 定义通用方法
- 提供基础实现
- 确保关键实现
- 共享代码逻辑

## 接口

**interface**

定义结构和格式，确保代码一致性，不能包含实现。

- 接口可以继承接口。
- 接口重复定义会自动合并。

```ts
interface test {
  name: string
  speak(n: string): void
}

// 类（implements：实现）
// implements test,test2 这样写可以实现多个接口
class TestClass implements test {
  constructor(public name: string) {}
  speak(n: string): void {
    console.log(this.name, n)
  }
}

// 对象
const testObj: test = {
  name: "我",
  speak(n) {
    console.log(n)
  },
}

// 函数
interface test2 {
  (a: number, b: number): number
}

const testFn = (x, y) => {
  return x + y
}
```

### interface 和 type

都支持定义对象的结构

- interface 更专注对象和类，支持继承和合并。
- type 支持类型别名、交叉类型、联合类型，不能继承和合并。

### interface 和 抽象类

都支持定义类的结构

- interface 只能描述结构，不能有实现，一个类可以实现多个接口。
- 抽象类 既可以有抽象的方法，也可以有具体的实现，一个类只能继承一个抽象类。

## 泛型

定义函数、类和接口时，用类型参数来表示未指定的类型，使用时才知道具体的类型，安全的保证同一段代码适应多种类型。

```ts
// 泛型函数
const log = <T, U>(data1: T, data2: U): T | U => {
  return data1 % 2 ? data1 : data2
}

log<number, string>(1, "1")
log<number, boolean>(1, true)

// 泛型接口
interface test<T> {
  name: string
  info: T
}

type infoType = {
  title: string
}

let p: test<infoType> = {
  name: "123",
  info: {
    title: "123",
  },
}

// 泛型类
class Test2<T> {
  constructor(public name: string, public info: T) {}
  speak() {
    console.log(this.name, this.info)
  }
}

const p2 = new Test2<infoType>("123", { title: "123" })
```

## 类型声明文件

xxx.d.ts 文件，为现有的 js 文件提供类型信息。
