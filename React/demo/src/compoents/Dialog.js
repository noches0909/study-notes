import React, { useState, useImperativeHandle } from "react"
import PropTypes from "prop-types"
import { Modal } from "antd"

let ok = () => {}
const DialogCom = ({ btnTxt = ["取消", "确定"], children, cRef, autoClose = true, ...reset }) => {
  const [visible, setVisible] = useState(false)

  const open = (cb) => {
    setVisible(true)
    ok = cb
  }

  useImperativeHandle(cRef, () => ({
    open: (cb) => open(cb),
  }))

  const handleCancel = () => {
    setVisible(false)
  }

  const handleOk = () => {
    autoClose && setVisible(false)
    ok({ name: 123 })
  }

  return (
    <Modal
      {...reset}
      maskClosable={false}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={btnTxt[1]}
      cancelText={btnTxt[0]}
    >
      {children}
    </Modal>
  )
}

DialogCom.propTypes = {
  btnTxt: PropTypes.array,
  children: PropTypes.any.isRequired,
  cRef: PropTypes.object.isRequired,
  autoClose: PropTypes.bool,
}

export default DialogCom
