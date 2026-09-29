# Go 基础入门

- 原生并发、自动内存管理、静态编译、跨平台编译、语法简洁、编译速度极快、标准库强大、工具链一体化

## 简单使用

```zsh
# 运行
go run index.go

# 打包
go build index.go

# 打包后的文件运行
./index

# 初始化模块
go mod init test
```

## 基础语法

### 变量声明

```go
// 声明变量，类型能推导就可省略
var name stirng = "yun"
var age int = 30

// 合并声明
var name, age = "yun", 30

// 实际开发的简洁写法
name := "yun"
age := 30
```

> 默认零值：声明变量的时候如果不赋值，会自动赋值“”、0、false、[]。（不像js是undefined）

### 基础数据类型

数字类型整数、浮点数

- int：有符号，支持正负，int8、int16、int32、int64，通常用来做计算
- uint：无符号，仅支持正数，uint8、uint16、uint32、uint64，通常用来做展示
- float32: 单精度，4字节，5～7位小数
- float64：双精度，8字节，15～16位小数

布尔类型

- bool：值为ture或者false

#### 类型转换

- int()：转整数
- uint()：转无符号整数
- float64()/float32()：转浮点数

```go
a := "1"
b := 2
// ，strconv是go提供的包
// 字符串转数字，Atoi = ASCII to int
// _表示不接收，因为这个函数会发送失败信息，而我们不需要
newA, _ := strconv.Atoi(a)

// 数字转字符串，Itoa = int to ASCII
newB := strconv.Itoa(b)

fmt.Println(b + newA, a + newB)
fmt.Printf("类型：%T，值：%#v", newB, newB) // #意为原始值，这里带#输出字符串有引号，不带#则无

str := "1"
// 字符串转布尔
boolean, _ := strconv.ParseBool(str)

// 布尔转字符串
newStr := strconv.FormatBool(true)
```

> ParseBool 能识别的真值：1、t、T、TRUE、true、True；假值有：0、f、F、FALSE、false、False。其他字符串都会转换失败

> 相较于js的转换，明显要严格的多

### 数组和切片

数组需要定义长度，且不能扩容，而切片不限制。

```go
// 定义一个长度为3，值为字符串的数组
hobby := [3]string{"唱", "跳", "rap"}

// 读值、读长度、修改
// hobby[0]
// len(hobby)
// hobby[0] = "篮球"

// 定义一个切片
s := []int{1, 2, 3}
// 向切片后面插入
s = append(s, 4, 5, 6)
// 前面插入
s = append([]int{-1, 0}, s...)
// 截取：s[开始索引:结束索引] s[0:4]
```

### 结构体

一种组合多个不同类型的复合数据类型

```go
package main // 包名

type Car stuct {
	Model string
}

type Person[P string | int] struct {
  sex string // 首字母小写，表示私有，当前包（main）访问
  Name string // 首字母大写，表示公开，所有包可访问
  Age int
	Car Car
	// Car，省略结构体嵌套的名称，则变为结构体嵌入，可以理解为属性被平铺合并进来
	Phone P // 泛型结构体，go没有联合类型
}

func main() {
  // person := Person[string]{} 不传参数也可创建，默认零值
	// 匿名结构体
	person := struct {
		Name string
	}{
		Name "云成舟"
	}
}

// 读值、赋值
// person.Name
// person.Name = '老徐'
```

> 结构体stuct可以理解为js的class

### map映射

无序的键值对集合，通常用来做配置存储、统计次数、缓存结果等。

零值是null，键必须是可比较的类型（string、int、数组等），不能是切片、函数、mao，值可以是任意类型。

```go
// map[键类型]值类型
scores := map[sting]int {
	"语文": 90
	"数学": 80
	"英语": 50
}

// var 方式创建
var ages map[string]int // 仅创建句柄
ages = make(map[string]int, 10) //扩容：make(类型, 预估大小)

// 新增属性
scores["物理"] = 70
// 删除属性
delete(scores, "语文")
// 读取属性
// scores["英语"]，可以直接读
// 高级读取，ok为bool值，判断属性是否存在
value, ok := scores["xx"]
// 修改属性
scores["英语"] = 100
```

### 条件判断

```go
var age int
// scan 可供用户在终端进行输入，参数就是输入的值
fmt.Scan(&age) // 函数的传参是复制，不加&的话，值更改后无法回显，加上&意为将地址值也传

if age >= 18 {
	fmt.Println("成年")
} else {
	fmt.Println("未成年")
}
```

> if else if、switch case、&& || ! 等条件运算功能与js基本一致

### for循环

go语言中没有while相关的循环

```go
arr := [3]int{1, 2, 3}

for i := 0; i < len(arr); i++ {
	fmt.Println(arr[i])
	// break 跳出循环
	// continue 跳过循环
}

for index, value := range arr {
	fmt.Println(index, value)
}

循环字符串有点麻烦，会返回字节下标和unicode编码，通常转为切片`[]rune(str)`进行循环
```

> for循环的使用与js基本一致，range可以理解为foreach

### 函数

```go
// 具名函数，需要调用才会执行
func clac[T int | uint | float64](a, b T) (T, T) {
	return a + b, a - b
}

clac[uint](20, 10)
// 匿名函数（自运行函数），创建即执行
func () {}()
```

> 函数的用法与js基本一致

### 面向对象

```go
// 接口定义函数
type Payment interface {
	Pay(money float64) (string, float64)
}

// 结构体定义属性
type AliPay struct {
	AppId string
}

func (a AliPay) Pay(money float64) (string, float64) {
	fmt.Println("zfbId", a.AppId)
	return "支付成功", money
}

// 业务层封装
func CreateOrder(pay Payment, money float64) {
	str,num := pay.Pay(money)
	fmt.Println(str, num)
}

// 初始化
func main() {
	CreateOrder(AliPay{AppId: "zfb_xxx"}, 66.66)
}
```

### 错误处理

go没有`try catch`这样的异常捕获, go有标准的异常库`errors`，但这个标准库通常用来处理业务异常，而程序异常我们使用`panic()`抛出，后续代码将不再执行。

关键字`defer`，后面的代码会推迟到函数末尾去执行，且多个`defer`遵循后进先出规则，当涉及到`return`的时候，注意虽然`return`是在`defer`后返回，但是它会在`defer`前赋值给返回值

因此`panic`通常结合`defer`使用，收束程序异常

```go
// 九九乘法表
func n (a int) {
	for i := 1; i <= a; i++ {
		for k := 1; k <= i; k++ {
			fmt.Printf("%d*%d=%d ", k, i, k*i)
		}
		fmt.Println()
	}
}
```

### 指针

go通知是值传递，我们修改的是一个副本而不是原本的值，我们想真正的修改需要使用指针

```go
// 使用值的使用带上*，解引用
func change(x *int) {
	*x = 800
}

func main() {
	x := 10
	// 传递值的时候带&，取地址
	change(&x)
	fmt.Println(x)
}
```

go没有官方术语的引用类型，社区通常把这几类归位，它们的变量里藏着指向底层数据的指针。

- slice: 切片，可变长序列
- map: 映射，键值对
- func: 函数值，指向同一段代码
- interface: 接口值，内部含类型与数据指针
- chan: 通道，用于goroutine通信

拿切片举例，它内部的数据可以修改，因为切片本身就是一个“副本”，但是它本身无法进行修改，需要转为指针才行，也就是：

- 可行：s[0] = 'xx'
- 不可行：s = append(s, 'xx')
- 可行：*s = append(*s, 'xx')

关于结构体，也是值传递，因此修改需要指针，有简写方案：p.Age = 800，等价于：(*p).Age = 800

## 进阶功能

### 协程 goroutine

开启goroutine的意义是让多端代码并发执行，如果不开启那么所有的代码都是串行执行，注意main函数本身就是一个goroutine

使用关键字`go`开启goroutine，注意main goroutine执行完成退出后，其他goroutine也会退出

官方提供了`sync`包，`sync.waitGroup`等待goroutine的完成

```go
// 声明
var wg sync.waitGrou

wg.Add() // 添加int
wg.Done() // goroutine完成
wg.Wait() // main goroutine等待
```

#### 通道 channel

- 无缓冲channel：不定义容量，会死锁，必须使用变量接收
- 有缓冲channel：定义容量，容量内不会死锁。变量接收会消耗用量

```go
func worker(ch chan int) {
	// 发送
	ch <- 1
	close(ch)
}

func main() {
	// 定义channel
	// ch := make(chan int) 无缓冲
	ch := make(chan int, 2) // 有缓冲
	go worker(ch)
	val := <-ch // 接收
	fmt.Println(val)
}
```

#### select

关键字`select`主要用来处理并发竞争和超时：

- 多channel同时监听
- 请求超时控制
- 非阻塞读写channel 

```go
select {
	case msg1 := <- ch1:
		fmt.Println(msg1)
	case msg2 := <- ch2:
		fmt.Println(msg2)
	default:
		fmt.Println('非阻塞测试')
		// 不想等就写default，会直接返回，想等就需要删掉default
}
```
并发时，使用`select`在等待后会选择最先ready的一个case，多个case ready会随机选一个

> 可以理解为前端的Promise.race()，当然两者的底层机制完全不同，但是核心思想是类似的

#### 互斥锁和读写锁

互斥锁：`sync.Mutex`同一时间内只能有一个goroutine去操作临界区的共享数据
读写锁：`sync.RWMutex`相比于互斥锁，它读的时候是共享的不会互斥

`Lock()`、`Unlock()`：开锁、关锁