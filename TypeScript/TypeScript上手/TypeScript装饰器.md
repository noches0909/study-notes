# TypeScript 装饰器

> 过时提醒：TypeScript 5.0 起支持符合 ECMAScript 新提案语义的标准装饰器；旧版 `experimentalDecorators` 属于 legacy decorators，两者签名和元数据能力不同。学习时要先确认项目使用的是哪一种。

## 定位

装饰器本质是函数，用来在不直接改写类声明主体的情况下，为类、方法、字段等位置附加逻辑。

常见用途：

- 框架元数据，如依赖注入、路由、ORM 字段。
- 日志、埋点、权限校验等横切逻辑。
- 对类或方法进行包装。

## 新版类装饰器

```ts
type Constructor<T = object> = new (...args: any[]) => T

function WithCreatedAt<T extends Constructor>(Target: T) {
  return class extends Target {
    createdAt = new Date()
  }
}

@WithCreatedAt
class Person {
  constructor(public name: string) {}
}
```

类装饰器可以返回一个新类，用来替换原类。

## 装饰器工厂

装饰器工厂是返回装饰器的函数，用于传入配置。

```ts
function LogName(prefix: string) {
  return function <T extends new (...args: any[]) => object>(Target: T) {
    return class extends Target {
      constructor(...args: any[]) {
        super(...args)
        console.log(prefix, Target.name)
      }
    }
  }
}

@LogName("init")
class Service {}
```

## 方法装饰器

新版方法装饰器接收原方法和上下文对象，返回的新函数会替换原方法。

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

class Person {
  @Logger
  speak(message: string) {
    console.log(message)
  }
}
```

## 字段装饰器

字段装饰器可以返回初始化函数，对字段初始值做处理。

```ts
function Trim(_: undefined, context: ClassFieldDecoratorContext) {
  return function (initialValue: string) {
    console.log("init", String(context.name))
    return initialValue.trim()
  }
}

class User {
  @Trim
  name = " Tom "
}
```

## 执行顺序

装饰器表达式会先从上到下求值，真正调用装饰器时通常按位置和语义应用。多个装饰器叠加时，靠近被装饰成员的装饰器更早包住原始值。

```ts
function A(value: unknown) {
  console.log("A")
  return value
}

function B(value: unknown) {
  console.log("B")
  return value
}

class Demo {
  @A
  @B
  method() {}
}
```

## 使用建议

- 普通业务逻辑优先用函数组合，装饰器适合框架化、横切逻辑。
- 不要把大量隐式行为藏进装饰器，否则调试成本会升高。
- 老项目看到 `target`、`propertyKey`、`descriptor` 三参数写法，多半是 legacy decorators。
- 新项目需要确认 `tsconfig.json`、构建器和框架是否支持新版装饰器语义。
