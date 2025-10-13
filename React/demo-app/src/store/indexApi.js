import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

// 创建一个Api对象
const xxxApi = createApi({
  reducerPath: "xxxApi", // Api标识
  // 指定基础请求信息，默认fetch
  baseQuery: fetchBaseQuery({
    baseUrl: "http://xxx/",
    prepareHeaders: (headers, { getState }) => {
      // 统一设置请求头
      console.log(getState()) // 获取state
      headers.set("Authorization", "token123123")
      return headers
    },
  }),
  tagTypes: ["xxx"], // Api中的标签类型
  // 方法，指定Api的各种功能，返回一个对象
  endpoints(build) {
    // build是请求的构建器，通过build来设置相关信息
    return {
      // build.query 通常是查询数据
      getXxx: build.query({
        query(id) {
          // 指定子路径，调用Api时会拼接baseUrl
          return "xxx" + id
        },
        transformResponse(baseQueryReturnValue) {
          // 转换响应数据
          return baseQueryReturnValue
        },
        // 设置缓存时间，单位秒，0为不缓存，默认60s
        keepUnusedDataFor: 60,
        // 标记标签
        providesTags: (result, error, id) => [{ type: "xxx", id }],
      }),
      // build.mutation 通常是操作数据
      delXxx: build.mutation({
        query(id) {
          return {
            url: "xxx" + id,
            method: "delete", // post等
            body: {}, // 新值修改有，删除可能没用
          }
        },
        // 触发标签，调用该接口后，标记有此标签的接口会自动触发
        invalidatesTags: (result, error, id) => [{ type: "xxx", id }],
      }),
    }
  },
})

// Api对象创建后，会根据endpoints返回的方法生成各个钩子函数
// 钩子函数命名规则：getXxx => useGetXxxQuery
export const { useGetXxxQuery, useDelXxxMutation } = xxxApi
export default xxxApi
