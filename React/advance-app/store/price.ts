/**
 * Zustand状态管理库初始化
 */
import { create } from "zustand"

interface PriceStore {
  price: number
  state: number
  incrementPrice: () => void
  decrementPrice: () => void
  resetPrice: () => void
  getPrice: () => number
}

// create函数，返回一个回调函数，回调函数的参数是set和get，返回值是对象
// set函数接受一个参数，参数是一个函数函数，函数的参数是当前的state，返回值是一个对象
// get函数没有参数，返回当前的state

const usePriceStore = create<PriceStore>((set, get) => ({
  price: 0,
  state: 123,
  incrementPrice: () => set((state) => ({ price: state.price + 1 })),
  decrementPrice: () => set((state) => ({ price: state.price + 1 })),
  resetPrice: () => set({ price: 0 }),
  getPrice: () => get().price,
}))

export default usePriceStore
