import { Dictionarise } from "./enum"
import { Data, Expire, Key, Result, StorageCls } from "./type"

// Storage实现接口StorageCls
export class Storage implements StorageCls {
  get<T>(key: Key): Result<T | null> {
    const value = localStorage.getItem(key)
    if (value) {
      const data: Data<T> = JSON.parse(value)
      const now = new Date().getTime()
      if (typeof data[Dictionarise.expire] == "number" && data[Dictionarise.expire] < now) {
        this.remove(key)
        return {
          message: `${key}已过期`,
          value: null,
        }
      } else {
        return {
          message: "成功",
          value: data.value,
        }
      }
    } else {
      return {
        message: "值无效",
        value: null,
      }
    }
  }

  set<T>(key: Key, value: T, expire: Expire = Dictionarise.permanent) {
    const data = {
      value,
      [Dictionarise.expire]: expire,
    }

    localStorage.setItem(key, JSON.stringify(data))
  }

  remove(key: Key) {
    localStorage.removeItem(key)
  }

  clear() {
    localStorage.clear()
  }
}
