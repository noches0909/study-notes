/**
 * useHistory 用于订阅浏览器的 history API，实现路由跳转功能
 * 返回当前的 URL，以及 push 和 replace 方法用于路由跳转
 */

import { useSyncExternalStore } from "react"

export const useHistory = () => {
  const subscribe = (onHistoryChange: () => void) => {
    // vue router源码： history 模式下，监听 popstate 事件，hash 模式下监听 hashchange 事件
    window.addEventListener("popstate", onHistoryChange)
    // window.addEventListener("hashchange", onHistoryChange)
    return () => {
      window.removeEventListener("popstate", onHistoryChange)
      // window.removeEventListener("hashchange", onHistoryChange)
    }
    // popstate只能监听浏览器的前进后退按钮，不能监听 pushState 和 replaceState 方法
    // 所以在push和replace方法中，我们需要手动派发 popstate 事件来通知订阅者
  }

  const getSnapshot = () => {
    return window.location.href
  }

  const res = useSyncExternalStore(subscribe, getSnapshot)

  const push = (url: string) => {
    window.history.pushState({}, "", url)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }

  const replace = (url: string) => {
    window.history.replaceState({}, "", url)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }

  // 使用 as const 确保返回的元组类型是固定的，这在封装hooks中经常遇到
  return [res, push, replace] as const
}

// const [url, push, replace] = useHistory()
