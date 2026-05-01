import React, { useState, useRef } from "react"
import { Button, theme, Transfer, Tree } from "antd"
import Dialog from "./Dialog"
// Customize Table Transfer
const isChecked = (selectedKeys, eventKey) => selectedKeys.includes(eventKey)
const generateTree = (treeNodes = [], checkedKeys = []) =>
  treeNodes.map(({ children, ...props }) => ({
    ...props,
    disabled: checkedKeys.includes(props.key),
    children: generateTree(children, checkedKeys),
  }))
const TreeTransfer = ({ dataSource, targetKeys = [], ...restProps }) => {
  const { token } = theme.useToken()
  const transferDataSource = []
  function flatten(list = []) {
    list.forEach((item) => {
      transferDataSource.push(item)
      flatten(item.children)
    })
  }
  flatten(dataSource)

  const childRef = useRef()

  const resetForm = () => {
    // console.log("重置表单")
  }

  const config = {
    title: "提示",
    btnTxt: ["关闭", "提交"],
    centered: true,
    width: "400px",
    afterClose: resetForm,
  }

  const [stateArr, setStateArr] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const open = (item) => {
    setEditingItem(item)
    childRef.current.open((values) => {
      setStateArr((prevStateArr) => {
        const nextItem = { ...item, title: values.name }
        const hasItem = prevStateArr.some((val) => val.key === item.key)
        return hasItem
          ? prevStateArr.map((val) => (val.key === item.key ? nextItem : val))
          : [...prevStateArr, nextItem]
      })
    })
  }

  return (
    <>
      <Transfer
        {...restProps}
        targetKeys={targetKeys}
        dataSource={transferDataSource}
        className="tree-transfer"
        render={(item) => {
          const editedItem = stateArr.find((val) => val.key === item.key)
          return (
            <>
              <div>{editedItem ? editedItem.title : item.title}</div>
              <Button type="text" onClick={() => open({ ...item })}>
                编辑
              </Button>
            </>
          )
        }}
        showSelectAll={false}
      >
        {({ direction, onItemSelect, selectedKeys }) => {
          if (direction === "left") {
            const checkedKeys = [...selectedKeys, ...targetKeys]
            return (
              <div
                style={{
                  padding: token.paddingXS,
                }}
              >
                <Tree
                  blockNode
                  checkable
                  checkStrictly
                  defaultExpandAll
                  checkedKeys={checkedKeys}
                  treeData={generateTree(dataSource, targetKeys)}
                  onCheck={(_, { node: { key } }) => {
                    onItemSelect(key, !isChecked(checkedKeys, key))
                  }}
                  onSelect={(_, { node: { key } }) => {
                    onItemSelect(key, !isChecked(checkedKeys, key))
                  }}
                />
              </div>
            )
          }
          return null
        }}
      </Transfer>
      <Dialog {...config} cRef={childRef}>
        <p>{editingItem?.title}</p>
      </Dialog>
    </>
  )
}
const treeData = [
  {
    key: "0-0",
    title: "0-0",
  },
  {
    key: "0-1",
    title: "0-1",
    children: [
      {
        key: "0-1-0",
        title: "0-1-0",
      },
      {
        key: "0-1-1",
        title: "0-1-1",
      },
    ],
  },
  {
    key: "0-2",
    title: "0-2",
  },
  {
    key: "0-3",
    title: "0-3",
  },
  {
    key: "0-4",
    title: "0-4",
  },
]
const App = () => {
  const [targetKeys, setTargetKeys] = useState([])
  const onChange = (keys) => {
    setTargetKeys(keys)
  }
  return <TreeTransfer dataSource={treeData} targetKeys={targetKeys} onChange={onChange} />
}
export default App
