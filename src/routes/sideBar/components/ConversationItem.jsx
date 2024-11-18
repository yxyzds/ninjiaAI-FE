import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Input, Button, Row, Col } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
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

  return (
    <Row
      className="conversation-item"
      justify="space-between"
      align="middle"
      key={conversation.windowID}
      gutter={2}
    >
      <Col flex="1" span={16}>
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
            {title.length > 10 ? `${title.slice(0, 10)}...` : title}
          </NavLink>
        )}
      </Col>
      <Col span={2}>
        <Button
          className="edit-button"
          onClick={() => setIsEditing(true)}
          icon={<EditOutlined />}
        />
      </Col>
      <Col span={2}>
        <Button
          className="delete-button"
          onClick={() => handleDeleteWindow(conversation.windowID)}
          icon={<DeleteOutlined />}
        />
      </Col>
    </Row>
  );
}
