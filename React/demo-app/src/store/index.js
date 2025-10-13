import { configureStore, createSlice } from "@reduxjs/toolkit"
import xxxApi from "./indexApi"
import { setupListeners } from "@reduxjs/toolkit/query"

// 创建一个Reducer切片，以区分复杂业务，多个切片组合成一个Reducer
const testSlice = createSlice({
  name: "test", // 切片名称，生成action的type
  initialState: {
    // 切片初始信息
    name: "人",
    age: 18,
  },
  reducers: {
    // 切片提供的方法
    setName(state, action) {
      // 直接修改state（代理对象）
      state.name = action.payload
    },
  },
})

// actions对象由切片自动创建，调用actions后可获取存有当前切片的action对象
// action对象的结构：{type: name/函数名,payload: 函数的参数}
export const { setName } = testSlice.actions

// 创建一个store对象
const store = configureStore({
  reducer: {
    // 配置两种Reducer
    test: testSlice.reducer,
    [xxxApi.reducerPath]: xxxApi.reducer,
  },
  // 中间件，缓存
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      //关闭redux序列化检测
      serializableCheck: false,
    }),
})

// 设置监听器，支持refetchOnFocus和refetchOnReconnect
setupListeners(store.dispatch)

export default store
