# TypeScript 装饰器

本质上还是函数，用来拓展简洁我们的语法。

## 类装饰器

```ts
/*
 * 定义类的类型
 * new 表示可以被new调用
 * ...args表示可以传任意数量的参数
 * any[]标识可以传任意类型的参数
 * {}标识返回的对象不是null或undefined
 */

// 简易写法
// type Constructor = new (...args: any[]) => {}

// 高级写法 (多了个静态属性)
type Constructor = {
  new (...args: any[]): {}
  wife: sting
}

interface Person {
  getTime(): void
}

// 装饰器（泛型约束，传入的类型必须是可以用new关键字调用的类）
function Demo<T extends Constructor>(target: T) {
  // 封锁参数，似的外部无法进行person.prototype的修改操作
  Object.seal(target.prototype)

  // this即是我们传入的类的实例
  console.log(this.name)

  // 返回一个继承自传入类的新类
  return class extends target {
    createTime: Date
    constructor(...args: any[]) {
      super(...args)
      this.createTime = new Date()
    }
    getTime() {
      return this.createTime
    }
  }
}

@Demo
class Person {
  static wife: string
  constructor(public name: string, public age: number) {}
  speak() {
    console.log("123")
  }
}

const p1 = new Person("张三", 18)
console.log(p1.getTime())
```

## 装饰器工厂

返回装饰器的函数，为装饰器添加函数，更灵活的控制装饰器。
