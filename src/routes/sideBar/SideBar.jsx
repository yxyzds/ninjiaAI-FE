import React, { useState, useEffect, useRef } from "react";
import { message, Row, Col, Button } from "antd";
import ConversationItem from "./components/ConversationItem";
import { Form, useNavigate, Outlet } from "react-router-dom";
import { useUser } from "../../context/userContext";
import { getUserInfo, createChatWindow } from "../api";
import "./style.css";
import { PlusOutlined } from "@ant-design/icons";

function SideBar({ visible, setVisible }) {
  const [conversations, setConversations] = useState([]);
  const navigate = useNavigate();
  const { user } = useUser();
  const sidebarRef = useRef(null);

  //测试跳转逻辑
  if (!user) {
    navigate("/auth");
  }

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const userInfo = await getUserInfo(user.email);
        console;
        if (userInfo.status === 200) {
          setConversations(userInfo.data.conversations);
        } else {
          setConversations([]);
        }
      } catch (error) {
        message.error("Failed to load user info");
      }
    }

    fetchUserInfo();
  }, [user.email]);

  useEffect(() => {
    // 点击 sidebar 外部区域时关闭 sidebar
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCreateWindow = async () => {
    try {
      const res = await createChatWindow(user.email);
      if (res.status == 201) {
        setConversations([res.data.conversation, ...conversations]);
        navigate(`/chatPage/${res.data.conversation.windowID}`);
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleDeleteConversation = (windowID) => {
    setConversations(
      conversations.filter((conv) => conv.windowID !== windowID)
    );
  };
  return (
    <div
      ref={sidebarRef}
      className={`sidebar-container ${visible ? "open" : "closed"}`}
    >
      <div className="nav-gutter"></div>
      <div className="sidebar">
        {/* <h1>do some test</h1> */}
        <div className="sidebar-create-button">
          <Button onClick={handleCreateWindow} icon={<PlusOutlined />}>
            新聊天
          </Button>
        </div>
        <nav>
          <div>
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.windowID}
                conversation={conv}
                setVisible={setVisible}
                handleDeleteConversation={handleDeleteConversation}
              />
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

export default SideBar;
