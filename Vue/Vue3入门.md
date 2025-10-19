# Vu3 入门

本笔记基于：TypeScript + Composition + setup

Vue3 相比于 Vue2：

重要的：

- 打包体积小、内存占用少、渲染快
- `Proxy`代替了`defineProperry`实现响应式
- 重写虚拟`DOM`的实现和`Tree-shaking`
- 更好的支持`TypeScript`

其他的：

- 组件内无需一个根标签包裹

## 1. `setup`

两种用法：

### `setup`钩子函数

它是在组件中使用组合式 API 的入口。基本只在两种情况下使用：

- 非单文件组件使用组合式 API
- 选项式 API 继承组合式 API 代码时

`setup`钩子函数执行在生命周期`beforeCreate`之前，且只在首次渲染执行一次，`setup`中没用组件实例的访问权，即无法使用`this`，该钩子函数有返回值：

- 返回的对象：模版和其他选项中可以直接使用对象的属性和方法
- 返回的函数：函数中可以直接返回模版

### `<script setup>`

`<script setup>`是在单文件组件 (SFC) 中使用组合式 API 的编译时语法糖。每次组件实例被创建都会执行。

在`<script setup>`声明的变量、函数、import 导入，可以在模板中直接使用

## 2. 响应式

副作用函数：引用了数据或与数据有关联的函数

响应式核心：数据劫持/代理、依赖收集、依赖更新

- `Vue2`响应式：基于`Object.defineProperty()`实现的数据的劫持
- `Vue3`响应式：基于`Proxy`实现对整个对象的代理

### `ref` 和 `reactive`

- 对于**基础数据类型**只能通过`ref`来实现其响应式，核心还是将其包装成一个`RefImpl`对象，并在内部通过自定义的 `get value()` 与 `set value(newVal)`实现依赖收集与依赖更新。
- 对于**对象类型**，`ref`与`reactive`都可以将其转化为**响应式数据**，但其在`ref`内部，最终还是会调用`reactive`函数实现转化。`reactive`函数，主要通过创建了`Proxy`实例对象，通过`Reflect`实现数据的获取与修改。

`ref`创建的响应式数据，在模版中会自动解包，可以直接使用，而在`script`代码中，需要通过`.value`来获取和修改。

`reactive`创建的响应式对象，如果重新分配的话，会失去响应式，可以通过`Object.assign()`来重新分配响应式。

`reactive`对象的某个属性为`ref`时，使用该`ref`属性是不需要`.value`，因为底层会自动解包。

`ref`还可以获取 DOM 元素，当`ref`绑定到 Vue 组件元素上时，会得到组件实例对象，但是子组件需要通过`defineExpose`暴露数据，父组件才能获取到数据。

### `toRefs`和`toRef`

`toRefs` 将一个响应式对象转化为普通对象，并且这个普通对象的每个属性都是指向源对象对应的属性的`ref`。

`toRef` 则是基于一个响应式对象中的某个属性，生成一个相对应的`ref`。

二者新生成的`ref`修改了值后，源对象的属性也会发生改变，反之亦然。

```js
const person = reactive({
  name: "test",
  name1: 'test1'
  age: 18,
})

const { name, age } = toRefs(person)
const name1 = toRef(person, 'name1')
```

### `computed`

`computed`计算属性方法返回的值也是一个`ref`，`script`中需要通过`.value`来获取和操作

## 3. `watch`

Vue3 中只能监听 4 种数据：

1. `ref`定义的数据
2. `reactive`定义的数据
3. 函数返回值(`getter`函数)
4. 以上数据组成的数组

监听`ref`定义的数据时，不需要`.value`。`watch`函数会返回一个函数，调用可以停止监听。

```js
// 第三个参数配置
watch(data, () => {}, { deep: true, immediate: true })
```

监听响应式对象数据时，`reactive`定义的数据是默认（隐式）开启深度监听的，无法关闭。
监听响应式对象的属性时，需要改造成`getter`函数：`() => obj.name`。
监听多个数据：`[() => obj.name, () => obj.a.b]`

### watchEffect

立即执行一次，并响应式的追踪函数里的依赖，依赖变化时再执行。

## 4. TS

```ts
// 定义一个接口，规定person对象的格式，并暴露
export interface PersonInter {
  id: string
  name: string
  age: number
  x?: number // x可有可无
}

// 定义一个自定义类型，两种写法都可以
// export type Persons = Array<PersonInter>
export type Persons = PersonInter[]
```

```ts
// 引入并用type以区分不是真实的值
import { type PersonInter, type Persons } from "@/types"
const person: PersonInter = { id: "12", name: "12", age: 12 }

// 泛型：定义一个数组，数组的每项都符合PersonInter的规范
// const personList: Array<PersonInter>
const personList: Persons = [
  { id: "12", name: "12", age: 12 },
  { id: "13", name: "13", age: 13 },
  { id: "14", name: "14", age: 14 },
]

// 响应式数据应用泛型
const personList = reactive<PersonInter>([])
```

## 5. 生命周期

创建阶段：`beforeCreate`和`created`两个 Vue2 的钩子被取消了，Vue3 可以直接在`setup`中调用需要在此阶段执行的函数。

挂载、更新阶段：与 Vue2 一致，加上`on`即可。

销毁阶段 => 卸载阶段：`onBeforeUnmount`和`onUnmounted`

注：只有创建阶段是父组件先完成，其余阶段都是子组件先完成。

## 6. hooks

命名规范：`use`开头的`js`或`ts`函数。

```ts
import xx from "xx"

export default () => {
  return []
}
```

## 7. 组件通信

### 7.1 props

```vue
<!-- 父传子多个参数可以用v-bind统一 -->
<child :a="1" :b="2" :c="3" :d="4" />

<child v-bind="{ a: 1, b: 2, c: 3, d: 4 }" />
```

名字中带有`define`的函数为宏函数，不需要引用即可使用，如`defineProps`、`defineEmits`、`defineExpose`

```ts
import { withDefault } from "vue"

// 接收父组件传递的props（属性、方法），可以直接在模板中使用a和setA
defineProps(["a", "setA"])

// 接收并保存父组件传递的props，x是一个reactive
let x = defineProps(["a"])

// 接收并保存父组件传递的props，并加以泛型的限制
let list = defineProps<{ list: Person }>()

// 接收并保存父组件传递的props，并加以泛型的限制，非必要且增加默认值
withDefault(defineProps<{ list?: Person }>(), {
  list: () => [],
})
```

自定义事件可以实现子传父

```ts
const emit = defineEmits(["setValue"])

emit("setValue", "123")
```

### 7.2 `v-model`

```vue
<!-- 父组件 -->
<child v-model="name" />
<!-- 等价 -->
<child :modelValue="name" @update:modelValue="name = $event" />
<!-- update:modelValue就是事件名 -->
```

```vue
<!-- 子组件 -->
<template>
  <input
    :value="modelValue"
    @input="@emit('update:modelValue') = <HTMLInputElement>$event.target.value"
  />
</template>

<script setup>
defineProps(["modelValue"])
const emit = defineEmits("update:modelValue")
</script>
```

关于`$event`：

- 对于原生事件：`$event`即是当前触发事件的 DOM 对象
- 对于自定义事件：`$event`即是当前触发事件所传递的数据

绑定时使用`v-model.test`自定义一个修饰符的话，子组件所有`modelValue`都要改为自定义修饰符的名称`test`。这样可以在一个组件上绑定多个`v-model`以拓展功能。

### 7.3 `$attrs`、`$refs`和`$parent`

`$attrs`能接收当前组件的父组件传来的参数，传递给当前组件的子组件`v-bind="$attrs"`，以简单实现“祖传孙、孙传祖”通信。

`$refs`能获取所有标有`ref`的 DOM 对象或子组件实例对象。

`$parent`能获取当前组件的父组件实例对象。

### 7.4 provide 和 inject

祖孙通信，且不会影响中间组件。

```ts
// 定义一个变量，和修改它的方法
const name = ref(0)
function updateName(val: string) {
  name.value = val
}
// 定义一个可传递个后代组件的provide，注意这里的name不能取value，否则会失去响应式
provide("nameContext", { name, updateName })

// 子组件注入：inject可得到祖先组件定义的变量和方法
const { name, updateName } = inject(nameContext, { name: "默认", updateName: (val: string) => {} })
```

### 7.5 Pinia

集中式状态管理，Pinia 更符合直觉和简便，没有 Vuex 那么臃肿。

```ts
import { defineStore } from "pinia"

// 选项式写法，组合式类似setup的写法
export const useTestStore = defineStore("test", {
  action: {
    increment(val: string) {
      // this为当前store
      this.name = val
    },
  },

  state() {
    return {
      name: "test1",
    }
  },

  getters: {
    bigName(state): string {
      return name + "1"
    },
  },
})
```

```ts
import { storeToRefs } from "pinia"
import { useTestStore } from "@/store"

// 页面中引入的 store，是一个`reactive`，该数据中包含的变量为`ref`,取值时自动解包无需`.value`。
const testStore = useTestStore()
console.log(testStore.name)

// 取用多个值时，最好不要使用toRefs，会使无关的store属性和方法也被转化为响应式
// 使用pinia提供的storeToRefs方法代替，storeToRefs只会关注state
const { name, bigName } = storeToRefs(testStore)

// 三种修改方式：

// 单个属性可直接修改，多个会触发多次pinia修改
testStore.name = "test2"

// 批量修改，只会触发一次pinia修改，且不会影响testStore的其他属性
testStore.$patch({
  name: "test2",
})

// 通过调用action定义的方法修改
testStore.increment("test2")

// 订阅，testStore中的store发生变化时会触发其中的回调函数
testStore.$subscribe((mutate, state) => {})
```

## 8. 路由

`params`传参注意点：

- 路由中的`path`属性要添加参数的占位
- 路由跳转时需通过`name`跳转

```ts
// params传参，添加问号可设置为非必要
{
  path: "/home/:id?",

  // 设置后，可以将路由收到的所有params参数作为props传给组件
  props: true

  // query参数可以这么传
  props(route) {
    return route.query
  }

  // 也可以这样传普通的参数
  props: {
    a: ''
  }
}
```

## 9. 新 Api

### 9.1 `shallowRef`和`shallowReactive`

意味**浅层**的响应式数据，只处理第一层的响应式，避免给深层次属性都添加响应，减少性能开销

### 9.2 `readonly`和`shallowReadonly`

`readonly`只能传入响应式数据，得到一个新数据，新数据无法被修改，但修改源数据，新数据则会被修改。

`shallowReadonly`只会使**浅层**只读，只保证第一层为只读，新数据的深层次可以被修改。

### 9.3 `toRaw`和`markRaw`

`toRaw`能传入一个响应式对象，获得它的原始对象（代理对象变为普通对象）。该原始对象无响应式，无法被修改。

`markRaw`可以标记一个对象，使这个对象永远无法变为响应式，比如防止不小心将第三方库的数据变为响应式对象。

### 9.4 `customRef`

`customRef`意为自定义 Ref。普通`ref`函数绑定的响应式数据，我们无法很好的控制它的依赖和更新。通过`customRef`可以显示的声明控制方式。

```ts
let initValue = "123"
let msg = customRef((track, trigger) => {
  return {
    get() {
      // 读取数据时，调用track（跟踪），告诉msg要关注return的值
      track()
      return initValue
    },
    set(val) {
      initValue = val
      trigger()
      // 修改数据完成后，调用trigger（变化），告诉msg数据修改了，需要更新
    },
  }
})
```

## 10. 新组件

### 10.1 Teleport

意为传送门，可以将`Teleport`组件内部的元素传送到指定位置里，设置属性`to='#app'`，值为选择器。

### 10.2 Suspense

意为异步组件，子组件有异步任务时可以使用，注意该功能还处在实验阶段。

```vue
<template>
  <Suspense>
    <template #default>
      <child />
    </template>
    <template #fallback>
      <p>加载中……</p>
    </template>
  </Suspense>
</template>
```
