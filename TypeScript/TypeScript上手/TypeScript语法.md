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

```ts
interface test {
  name: string
  speak(n: string): void
}

// 类（implements：实现）
class testClass implements test {
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
```
