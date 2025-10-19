/**
 * useStorage 用于在 React 组件中使用本地存储（localStorage）。
 * 它提供了一个状态值和一个更新该值的函数，并确保在本地存储中同步数据。
 */

import { useSyncExternalStore } from "react"

export const useStorage = <T>(key: string, initialValue: T) => {
  // 订阅者
  const subscribe = (onStorageChange: () => void) => {
    // 监听浏览器原生提供的storage 事件，当本地存储发生变化时触发回调
    window.addEventListener("storage", onStorageChange)
    return () => {
      window.removeEventListener("storage", onStorageChange)
    }
  }

  // 获取当前快照
  const getSnapshot = () => {
    return localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)!) : initialValue
  }

  const res = useSyncExternalStore(subscribe, getSnapshot)

  const updateStorage = (value: T) => {
    localStorage.setItem(key, JSON.stringify(value))
    // 手动触发 storage 事件，通知所有订阅者
    window.dispatchEvent(new StorageEvent("storage"))
  }

  return [res, updateStorage]
}

// const [count, setCount] = useStorage<number>("count", 0)
// setCount(2)
