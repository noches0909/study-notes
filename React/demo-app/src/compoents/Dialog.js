import React, { useState, useImperativeHandle, useRef } from "react"
import PropTypes from "prop-types"
import { Modal } from "antd"

const DialogCom = ({ btnTxt = ["取消", "确定"], children, cRef, autoClose = true, ...reset }) => {
  const [visible, setVisible] = useState(false)
  const okRef = useRef(() => {})

  const open = (cb) => {
    setVisible(true)
    okRef.current = cb
  }

  useImperativeHandle(cRef, () => ({
    open: (cb) => open(cb),
  }))

  const handleCancel = () => {
    setVisible(false)
  }

  const handleOk = () => {
    autoClose && setVisible(false)
    okRef.current({ name: 123 })
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
