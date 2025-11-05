import { useMemo, useRef, useState } from "react"

const placeholderOptions = ["name", "email", "phone", "company"]

const tokenPattern = /\$\{([\w-]+)\}/g

const TextAreaChip = () => {
  const [template, setTemplate] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  type Segment =
    | { type: "text"; content: string; key: string }
    | { type: "token"; content: string; raw: string; index: number; key: string }

  const segments = useMemo<Segment[]>(() => {
    const result: Segment[] = []
    let lastIndex = 0
    let occurrence = 0

    template.replace(tokenPattern, (match, name: string, offset) => {
      if (offset > lastIndex) {
        result.push({
          type: "text",
          content: template.slice(lastIndex, offset),
          key: `text-${lastIndex}`,
        })
      }

      result.push({
        type: "token",
        content: name,
        raw: match,
        index: occurrence,
        key: `token-${occurrence}-${name}`,
      })

      occurrence += 1
      lastIndex = offset + match.length
      return match
    })

    if (lastIndex < template.length) {
      result.push({
        type: "text",
        content: template.slice(lastIndex),
        key: `text-${lastIndex}`,
      })
    }

    if (result.length === 0) {
      result.push({ type: "text", content: "", key: "placeholder" })
    }

    return result
  }, [template])

  const currentTokenCounts = useMemo(() => {
    const counts = new Map<string, number>()
    const matches = template.match(tokenPattern)
    matches?.forEach((token) => {
      counts.set(token, (counts.get(token) ?? 0) + 1)
    })
    return counts
  }, [template])

  const restoreTextareaCursor = (cursor: number) => {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current
      if (!textarea) return
      textarea.focus()
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    const nextValue = event.target.value
    const nextCounts = new Map<string, number>()
    const matches = nextValue.match(tokenPattern)
    matches?.forEach((token) => {
      nextCounts.set(token, (nextCounts.get(token) ?? 0) + 1)
    })

    const hasMissingToken = Array.from(currentTokenCounts.entries()).some(
      ([token, count]) => nextCounts.get(token) !== count
    )

    if (hasMissingToken) {
      event.target.value = template
      restoreTextareaCursor(event.target.selectionStart ?? template.length)
      return
    }

    setTemplate(nextValue)
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key !== "Backspace" && event.key !== "Delete") return

    const textarea = event.currentTarget
    const { selectionStart, selectionEnd, value } = textarea
    if (selectionStart === null || selectionEnd === null) return

    const shouldBlock = Array.from(value.matchAll(tokenPattern)).some((match) => {
      const matchIndex = match.index ?? 0
      const matchEnd = matchIndex + match[0].length

      if (selectionStart !== selectionEnd) {
        return selectionStart < matchEnd && selectionEnd > matchIndex
      }

      if (event.key === "Backspace") {
        return selectionStart > matchIndex && selectionStart <= matchEnd
      }

      return selectionStart >= matchIndex && selectionStart < matchEnd
    })

    if (shouldBlock) {
      event.preventDefault()
    }
  }

  const handleInsert = (token: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const insertText = `\${${token}} `
    const { selectionStart, selectionEnd, value } = textarea
    const nextValue = value.slice(0, selectionStart) + insertText + value.slice(selectionEnd)

    setTemplate(nextValue)
    restoreTextareaCursor(selectionStart + insertText.length)
  }

  const handleRemoveToken = (occurrenceIndex: number) => {
    let removalStart = template.length

    setTemplate((prev) => {
      let counter = 0
      let lastIndex = 0
      let output = ""

      const regex = new RegExp(tokenPattern)
      let match: RegExpExecArray | null

      while ((match = regex.exec(prev)) !== null) {
        const start = match.index ?? 0
        const end = start + match[0].length

        if (counter === occurrenceIndex) {
          removalStart = start

          let skipEnd = end
          if (prev[skipEnd] === " ") {
            skipEnd += 1
          }

          output += prev.slice(lastIndex, start)
          lastIndex = skipEnd
        } else {
          output += prev.slice(lastIndex, end)
          lastIndex = end
        }

        counter += 1
      }

      output += prev.slice(lastIndex)
      return output
    })

    restoreTextareaCursor(removalStart)
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
      <h2 style={{ marginBottom: 16 }}>欢迎回来 👋</h2>

      <label
        htmlFor="home-template-input"
        style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
      >
        模板内容
      </label>

      <div
        style={{
          position: "relative",
          border: "1px solid #d0d5dd",
          borderRadius: 8,
          padding: 0,
          backgroundColor: "#f9fafb",
        }}
      >
        <textarea
          ref={textareaRef}
          id="home-template-input"
          value={template}
          rows={5}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="输入模板内容，可点击下方按钮插入占位符"
          style={{
            width: "100%",
            resize: "none",
            border: "none",
            outline: "none",
            padding: "12px 14px",
            background: "transparent",
            color: "transparent",
            caretColor: "#111827",
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily: "inherit",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        />
        <div
          aria-hidden={false}
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            padding: "12px 14px",
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily: "inherit",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: template ? "#111827" : "#9ca3af",
          }}
        >
          {template
            ? segments.map((segment) =>
                segment.type === "text" ? (
                  <span key={segment.key}>{segment.content}</span>
                ) : (
                  <span className="token-wrapper" key={segment.key}>
                    <span className="token-ghost">{segment.raw}</span>
                    <span className="token-visual">
                      <span className="token-chip">
                        <span className="token-label">{segment.raw}</span>
                        <button
                          type="button"
                          className="token-close"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            handleRemoveToken(segment.index)
                          }}
                          aria-label={`移除 ${segment.raw}`}
                        >
                          ×
                        </button>
                      </span>
                    </span>
                  </span>
                )
              )
            : "输入模板内容，可点击下方按钮插入占位符"}
        </div>
      </div>

      <div style={{ marginTop: 16, marginBottom: 12, fontWeight: 600 }}>插入变量</div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {placeholderOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleInsert(option)}
            style={{
              padding: "6px 12px",
              borderRadius: 20,
              border: "1px solid #2563eb",
              background: "#2563eb",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              transition: "background 0.2s ease",
            }}
          >
            插入 {`$\{${option}}`}
          </button>
        ))}
      </div>
      <style>
        {`
          .token-wrapper {
            position: relative;
            display: inline-block;
            vertical-align: baseline;
            pointer-events: auto;
          }

          .token-ghost {
            visibility: hidden;
            white-space: pre-wrap;
            font-size: 14px;
            line-height: 1.6;
          }

          .token-visual {
            position: absolute;
            inset: 0;
            display: inline-flex;
            align-items: center;
            pointer-events: none;
          }

          .token-chip {
            position: relative;
            display: inline-flex;
            align-items: center;
            pointer-events: auto;
          }

          .token-label {
            position: relative;
            z-index: 1;
            font-size: 14px;
            line-height: 1.6;
            color: #0b5394;
            padding: 0 2px;
          }

          .token-chip::before {
            content: "";
            position: absolute;
            inset: -4px -8px;
            border-radius: 999px;
            background: #e0f2fe;
            border: 1px solid #0b5394;
            z-index: 0;
          }

          .token-close {
            position: absolute;
            top: -6px;
            right: -10px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: none;
            background: #0b5394;
            color: #fff;
            font-size: 12px;
            line-height: 16px;
            cursor: pointer;
            padding: 0;
            pointer-events: auto;
          }

          .token-close:hover {
            background: #083763;
          }
        `}
      </style>
    </div>
  )
}

export default TextAreaChip
