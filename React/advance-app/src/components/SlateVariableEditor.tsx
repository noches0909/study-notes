import { useCallback, useEffect, useMemo } from "react"
import { type BaseEditor, createEditor, type Descendant, Transforms } from "slate"
import {
  Editable,
  type RenderElementProps,
  Slate,
  useSlateStatic,
  withReact,
  ReactEditor,
} from "slate-react"

type VariableToken = {
  label: string
  value: string
}

type SlateVariableEditorProps = {
  variables?: VariableToken[]
  label?: string
  placeholder?: string
  description?: string
}

type EmptyText = { text: string }

type VariableElement = {
  type: "variable"
  label: string
  value: string
  children: EmptyText[]
}

type ParagraphElement = {
  type: "paragraph"
  children: Descendant[]
}

type CustomElement = ParagraphElement | VariableElement

type CustomText = EmptyText

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}

const defaultVariables: VariableToken[] = [
  { label: "姓名", value: "${name}" },
  { label: "手机号", value: "${mobile}" },
  { label: "职位", value: "${title}" },
  { label: "公司", value: "${company}" },
]

const styleId = "slate-variable-editor-styles"
const styles = `
.slate-variable-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slate-variable-editor {
  min-height: 140px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
}

.slate-variable-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.slate-variable-toolbar button {
  border: 1px solid #2563eb;
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  cursor: pointer;
}

.slate-variable-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e0f2fe;
  border: 1px solid #7dd3fc;
  color: #0c4a6e;
  font-size: 12px;
}

.slate-variable-tag button {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}
`

const useSlateVariableStyles = () => {
  useEffect(() => {
    if (typeof document === "undefined") return
    if (document.getElementById(styleId)) return
    const style = document.createElement("style")
    style.id = styleId
    style.textContent = styles
    document.head.appendChild(style)
  }, [])
}

const VariableTag = ({ attributes, element, children }: RenderElementProps) => {
  const editor = useSlateStatic()
  const handleRemove = useCallback(() => {
    const path = ReactEditor.findPath(editor, element)
    Transforms.removeNodes(editor, { at: path })
  }, [editor, element])

  const variableElement = element as VariableElement

  return (
    <span {...attributes} contentEditable={false} className="slate-variable-tag">
      <span>{variableElement.label}</span>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={handleRemove}>
        ×
      </button>
      {children}
    </span>
  )
}

const renderElement = (props: RenderElementProps) => {
  if (props.element.type === "variable") {
    return <VariableTag {...props} />
  }
  return (
    <p {...props.attributes} style={{ margin: 0 }}>
      {props.children}
    </p>
  )
}

const createVariableEditor = () => withVariables(withReact(createEditor()))

const withVariables = <T extends BaseEditor & ReactEditor>(editor: T) => {
  const { isInline, isVoid } = editor
  editor.isInline = (element) => (element.type === "variable" ? true : isInline(element))
  editor.isVoid = (element) => (element.type === "variable" ? true : isVoid(element))
  return editor
}

const initialValue: Descendant[] = [
  {
    type: "paragraph",
    children: [{ text: "" }],
  },
]

const SlateVariableEditor = ({
  variables = defaultVariables,
  label = "内容",
  placeholder = "请输入模板内容，可插入变量",
  description,
}: SlateVariableEditorProps) => {
  const editor = useMemo(() => createVariableEditor(), [])
  useSlateVariableStyles()

  const insertVariable = useCallback(
    (token: VariableToken) => {
      const variableNode: VariableElement = {
        type: "variable",
        label: token.label,
        value: token.value,
        children: [{ text: "" }],
      }
      Transforms.insertNodes(editor, variableNode)
      Transforms.insertText(editor, " ")
    },
    [editor]
  )

  return (
    <div className="slate-variable-wrapper">
      {label ? <label>{label}</label> : null}
      {description ? (
        <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>{description}</p>
      ) : null}
      <Slate editor={editor} initialValue={initialValue}>
        <Editable
          className="slate-variable-editor"
          placeholder={placeholder}
          renderElement={renderElement}
        />
      </Slate>
      <div className="slate-variable-toolbar" aria-label="可插入变量">
        {variables.map((item) => (
          <button key={item.value} type="button" onClick={() => insertVariable(item)}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SlateVariableEditor
