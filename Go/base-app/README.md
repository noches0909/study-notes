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

## 变量声明

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

> 默认零值：声明变量的时候如果不赋值，会自动赋值“”、0。（不像js是undefined）

## 基础数据类型

数字类型整数、浮点数

- int：有符号，支持正负，int8、int16、int32、int64，通常用来做计算
- uint：无符号，仅支持正数，uint8、uint16、uint32、uint64，通常用来做展示
- float32: 单精度，4字节，5～7位小数
- float64：双精度，8字节，15～16位小数

布尔类型

- bool：值为ture或者false
