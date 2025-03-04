import { useState, useCallback, useEffect } from "react"

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

  useEffect(() => {
    return () => {
      // 组件卸载时取消事件监听
      document.removeEventListener("mouseenter", handleMouseEnter)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [handleMouseEnter, handleMouseLeave])

  return {
    isHover,
    handleMouseEnter,
    handleMouseLeave,
  }
}

export default Demo
