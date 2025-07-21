# TypeScript 语法

## 属性修饰符

- public **公开** *类内部、子类、类外部*可访问
- protected **受保护** *类内部、子类*可访问
- private **私有** *类内部*可访问
- readonly **只读** 无法修改

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
