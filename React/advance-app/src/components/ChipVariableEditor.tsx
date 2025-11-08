import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ClipboardEvent as ReactClipboardEvent } from 'react'

export type VariableToken = {
  label: string
  value: string
}

type ChipVariableEditorProps = {
  label?: string
  placeholder?: string
  variables?: VariableToken[]
}

const defaultVariables: VariableToken[] = [
  { label: '姓名', value: '${name}' },
  { label: '手机号', value: '${mobile}' },
  { label: '职位', value: '${title}' },
  { label: '公司', value: '${company}' },
]

const styleId = 'chip-variable-editor-styles'

const chipVariableStyles = `
.chip-variable-field {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chip-variable-field label {
  font-size: 14px;
  color: #1f2937;
}

.chip-variable-editor {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 12px;
  min-height: 120px;
  line-height: 1.6;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
  outline: none;
}

.chip-variable-editor.is-empty::before {
  content: attr(data-placeholder);
  color: #9ca3af;
  pointer-events: none;
}

.chip-variable-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-variable-toolbar button {
  border: 1px solid #1677ff;
  background-color: rgba(22, 119, 255, 0.08);
  color: #1050b0;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  cursor: pointer;
}

.chip-variable-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  font-size: 12px;
  padding: 2px 8px;
  margin: 0 2px;
  background-color: #f0f5ff;
  border: 1px solid #adc6ff;
  color: #1d39c4;
  cursor: default;
}

.chip-variable-tag__remove {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}
`

const useChipVariableStyles = () => {
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (document.getElementById(styleId)) return
    const styleElement = document.createElement('style')
    styleElement.id = styleId
    styleElement.textContent = chipVariableStyles
    document.head.appendChild(styleElement)
  }, [])
}

const ChipVariableEditor = ({
  label = '内容',
  placeholder = '请输入消息模板，可插入变量',
  variables = defaultVariables,
}: ChipVariableEditorProps) => {
  useChipVariableStyles()

  const editorRef = useRef<HTMLDivElement>(null)
  const fieldId = useId()
  const [isEmpty, setIsEmpty] = useState(true)

  const syncEditorState = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const hasContent = editor.innerText.trim().length > 0 || editor.querySelector('[data-value]')
    setIsEmpty(!hasContent)
  }, [])

  useEffect(() => {
    syncEditorState()
  }, [syncEditorState])

  const focusEditor = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const selection = window.getSelection()
    if (!selection) return
    selection.removeAllRanges()
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    selection.addRange(range)
  }, [])

  const insertVariable = useCallback(
    (token: VariableToken) => {
      const editor = editorRef.current
      if (!editor) return

      editor.focus()
      const selection = window.getSelection()
      if (!selection) return

      if (!selection.anchorNode || !editor.contains(selection.anchorNode)) {
        const range = document.createRange()
        range.selectNodeContents(editor)
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
      }

      const range = selection.getRangeAt(0)
      range.deleteContents()

      const chipElement = document.createElement('span')
      chipElement.className = 'chip-variable-tag'
      chipElement.contentEditable = 'false'
      chipElement.dataset.value = token.value
      chipElement.dataset.label = token.label

      const textElement = document.createElement('span')
      textElement.textContent = token.label

      const removeButton = document.createElement('button')
      removeButton.className = 'chip-variable-tag__remove'
      removeButton.type = 'button'
      removeButton.setAttribute('aria-label', `删除${token.label}`)
      removeButton.textContent = '×'
      removeButton.addEventListener('click', (event) => {
        event.preventDefault()
        const nextSibling = chipElement.nextSibling
        chipElement.remove()
        if (
          nextSibling &&
          nextSibling.nodeType === Node.TEXT_NODE &&
          (nextSibling.textContent ?? '').trim() === ''
        ) {
          nextSibling.textContent = ''
        }
        syncEditorState()
      })

      chipElement.appendChild(textElement)
      chipElement.appendChild(removeButton)

      range.insertNode(chipElement)

      const trailingSpace = document.createTextNode('\u00a0')
      chipElement.parentNode?.insertBefore(trailingSpace, chipElement.nextSibling)

      selection.removeAllRanges()
      const newRange = document.createRange()
      newRange.setStartAfter(trailingSpace)
      newRange.collapse(true)
      selection.addRange(newRange)

      syncEditorState()
    },
    [syncEditorState]
  )

  const handleInput = useCallback(() => {
    syncEditorState()
  }, [syncEditorState])

  const handlePaste = useCallback((event: ReactClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  return (
    <div className="chip-variable-field">
      {label ? <label htmlFor={fieldId}>{label}</label> : null}
      <div
        id={fieldId}
        ref={editorRef}
        className={`chip-variable-editor ${isEmpty ? 'is-empty' : ''}`}
        contentEditable
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onClick={focusEditor}
        onInput={handleInput}
        onPaste={handlePaste}
      />
      <div className="chip-variable-toolbar" aria-label="可插入变量">
        {variables.map((item) => (
          <button key={item.value} type="button" onClick={() => insertVariable(item)}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ChipVariableEditor
