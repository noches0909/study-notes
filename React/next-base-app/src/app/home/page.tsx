"use client"

import { redirect } from "next/navigation"
import { useEffect } from "react"

const checkLogin = async () => {
  const res = await fetch("/api/login")
  const data = await res.json()
  if (data.code === 1) {
    return true
  } else {
    return false
  }
}

export default function Home() {
  useEffect(() => {
    checkLogin().then((res) => {
      if (!res) {
        redirect("/")
      }
    })
  })

  return <h1>首页</h1>
}
