import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
  baseURL: "http://localhost:3000", //项目地址
})
export const { signIn, signUp, useSession } = authClient
