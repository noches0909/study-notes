import { useState, useCallback } from "react"

function Demo() {
  const { isHover, handleMouseEnter, handleMouseLeave } = useHover(false)
  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {isHover ? "鼠标移入" : "鼠标移出"}
    </div>
  )
}

function useHover(bol) {
  const [isHover, setIsHover] = useState(bol)

  // 移入
  const handleMouseEnter = useCallback(() => {
    setIsHover(true)
  }, [])

  // 移出
  const handleMouseLeave = useCallback(() => {
    setIsHover(false)
  }, [])

  return {
    isHover,
    handleMouseEnter,
    handleMouseLeave,
  }
}

export default Demo
