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

```ts
function Demo(n: number) {
  return function (target: Function) {
    console.log(n, this.name)
  }
}

@Demo(2)
class Person {
  constructor(public name: string) {}
}
```

## 装饰器组合

先工厂由上到下执行，后装饰器由下到上执行

## 属性/方法装饰器

```ts
/**
 * 属性装饰器
 * target：对于静态属性，它是类，对于实例属性，他是类的原型对象
 * propertyKey：属性名
 */

// 监视属性的修改
function State(target: object, propertyKey: string) {
  // 根据不同的propertyKey做了缓存
  let key = `__${propertyKey}`
  Object.defineProperty(target, propertyKey, {
    get() {
      return this[key]
    },
    set(newValue) {
      console.log(propertyKey, newValue)
      this[key] = newValue
    },
    enumerable: true, // 可枚举
    configrable: true, // 可配置
  })
}

/**
 * 方法装饰器
 * target：对于静态方法，它是类，对于实例方法，他是类的原型对象
 * propertyKey：方法名
 * descriptor：方法的描述对象 writable，value等
 */

function Logger(target: object, propertyKey: string, descriptor: PropertyDescriptor) {
  // 缓存原始方法
  const originnal = descriptor.value
  // 替换原始方法
  descriptor.value = function (...args: any[]) {
    console.log("开始")
    // original.apply(this, args)
    const result = originnal.call(this, ...args)
    console.log("结束")
  }
}

class Person {
  name: string
  @State age: string
  constructor(name: string, age: string) {
    this.name = name
    this.age = age
  }
  @Logger speak() {
    console.log(1)
  }
}

const p1 = new Person("张三", 18)
const p2 = new Person("张四", 28)
p1.speak()
```

## 访问器装饰器

装饰 get、set 这样的访问器

## 参数装饰器

装饰方法里面的参数
