import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Input, Dropdown, Menu, Row, Col, message } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { deleteChatWindow, editChatWindow } from "../../api";
import "./style.css";
import { icons } from "antd/es/image/PreviewGroup";

export default function ConversationItem({
  conversation,
  handleDeleteConversation,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const handleBlur = async () => {
    updateWindowTitle(conversation.windowID, title);
    setIsEditing(false);
  };

  const updateWindowTitle = async (windowID, title) => {
    try {
      await editChatWindow(windowID, title);
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleDeleteWindow = async (windowID) => {
    try {
      await deleteChatWindow(windowID);
      handleDeleteConversation(windowID);
    } catch (err) {
      message.error(err.message);
    }
  };

  const items = [
    {
      key: "edit",
      label: "Edit",
      icon: <EditOutlined />,
      onClick: () => setIsEditing(true),
    },
    {
      key: "delete",
      label: "Delete",
      icon: <DeleteOutlined />,
      onClick: () => handleDeleteWindow(conversation.windowID),
    },
  ];

  return (
    <Row
      className="conversation-item"
      key={conversation.windowID}
    >
      <Col flex="1" span={20}>
        {isEditing ? (
          <Input
            type="text"
            value={title}
            onBlur={handleBlur}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        ) : (
          <NavLink
            to={`chatPage/${conversation.windowID}`}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {title.length > 16 ? `${title.slice(0, 16)}...` : title}
          </NavLink>
        )}
      </Col>
      <Col span={2}>
        {/* <Button
          className="edit-button"
          onClick={() => setIsEditing(true)}
          icon={<EditOutlined />}
        /> */}

        <Dropdown
          menu={{ items }}
          trigger={["click"]}
          placement="bottomRight"
          dropdownRender={(menu) => (
            <div style={{ transform: "translateX(80px)" }}>{menu}</div>
          )}
        >
          <SettingOutlined style={{ fontSize: "18px", cursor: "pointer" }} />
        </Dropdown>
      </Col>
      {/* <Col span={2}>
        <Button
          className="delete-button"
          onClick={() => handleDeleteWindow(conversation.windowID)}
          icon={<DeleteOutlined />}
        />
      </Col> */}
    </Row>
  );
}
