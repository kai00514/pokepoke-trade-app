"use client"

import React from "react"
import { Modal, Button } from "antd"
import { Card } from "antd"

const ListEditorModal: React.FC = () => {
  const [visible, setVisible] = React.useState(false)

  const showModal = () => {
    setVisible(true)
  }

  const handleOk = () => {
    setVisible(false)
  }

  const handleCancel = () => {
    setVisible(false)
  }

  return (
    <div>
      <Button type="primary" onClick={showModal}>
        Open Modal
      </Button>
      <Modal title="Trade Owned Lists" visible={visible} onOk={handleOk} onCancel={handleCancel}>
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {/* Card 1 */}
          <Card title="Card 1" style={{ width: 200 }}>
            <p>Content of Card 1</p>
          </Card>
          {/* Card 2 */}
          <Card title="Card 2" style={{ width: 200 }}>
            <p>Content of Card 2</p>
          </Card>
          {/* Card 3 */}
          <Card title="Card 3" style={{ width: 200 }}>
            <p>Content of Card 3</p>
          </Card>
          {/* Card 4 */}
          <Card title="Card 4" style={{ width: 200 }}>
            <p>Content of Card 4</p>
          </Card>
          {/* Card 5 */}
          <Card title="Card 5" style={{ width: 200 }}>
            <p>Content of Card 5</p>
          </Card>
          {/* Additional cards can be added here */}
        </div>
      </Modal>
    </div>
  )
}

export default ListEditorModal
