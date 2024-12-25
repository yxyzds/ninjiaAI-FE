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
import { useNavigate } from "react-router-dom";

export default function ConversationItem({
  conversationBrief,
  handleDeleteConversation,
  setVisible,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(conversationBrief.title);
  const navigate = useNavigate();
  const handleBlur = async () => {
    updateWindowTitle(conversationBrief.windowID, title);
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
      navigate("/");
    } catch (err) {
      message.error(err.message);
    }
  };

  const closeSidebarInMobile = () => {
    setVisible(false);
  };

  const items = [
    {
      key: "edit",
      label: "重命名",
      icon: <EditOutlined />,
      onClick: () => setIsEditing(true),
    },
    {
      key: "delete",
      label: "删除",
      icon: <DeleteOutlined />,
      onClick: () => handleDeleteWindow(conversationBrief.windowID),
    },
  ];

  return (
    <Row className="conversation-item" key={conversationBrief.windowID}>
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
            to={`chatPage/${conversationBrief.windowID}`}
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={closeSidebarInMobile}
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
            <div
              className="conversation-item-editMenu"
              onMouseDown={(e) => e.stopPropagation()} //阻止冒泡，挂载到body后会点击会触发sideBar关闭
            >
              {menu}
            </div>
          )}
          overlayStyle={{
            position: "fixed",
          }}
          getPopupContainer={() => document.body} //挂载到body上保证不被遮挡
        >
          <SettingOutlined style={{ fontSize: "16px", cursor: "pointer" }} />
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
