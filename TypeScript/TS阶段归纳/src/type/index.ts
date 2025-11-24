import { Dictionarise } from "../enum"

export type Key = string
export type Expire = Dictionarise.permanent | number // 永久或者时间戳

// 读取结果类型
export interface Result<T> {
  message: string
  value: T | null
}

// 存入数据类型
export interface Data<T> {
  value: T
  [Dictionarise.expire]: Expire
}

// 存储类约束
export interface StorageCls {
  get: <T>(key: Key) => Result<T | null>
  set: <T>(key: Key, value: T, expire?: Expire) => void
  remove: (key: Key) => void
  clear: () => void
}
