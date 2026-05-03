import { StorageMeta } from "./enum"
import { Data, Expire, Key, Result, StorageCls } from "./type"

// Storage实现接口StorageCls
export class Storage implements StorageCls {
  get<T>(key: Key): Result<T | null> {
    const value = localStorage.getItem(key)
    if (!value) {
      return {
        message: "值无效",
        value: null,
      }
    }

    try {
      const data = JSON.parse(value) as Data<T>
      const now = new Date().getTime()

      if (typeof data[StorageMeta.expire] === "number" && data[StorageMeta.expire] < now) {
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
    } catch {
      this.remove(key)
      return {
        message: "值解析失败",
        value: null,
      }
    }
  }

  set<T>(key: Key, value: T, expire: Expire = StorageMeta.permanent) {
    const data = {
      value,
      [StorageMeta.expire]: expire,
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
