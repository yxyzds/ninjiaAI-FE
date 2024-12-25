import { useState, useEffect, useRef } from "react";
import { message, Button } from "antd";
import ConversationItem from "./components/ConversationItem";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/userContext";
import { getUserInfo, createChatWindow } from "../api";
import "./style.css";
import { PlusOutlined } from "@ant-design/icons";

function SideBar({ visible, setVisible, navRef }) {
  const [conversationsBrief, setConversationsBrief] = useState([]);
  const navigate = useNavigate();
  const { user } = useUser();
  const sidebarRef = useRef(null);

  if (!user) {
    navigate("/auth");
  }

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const userInfo = await getUserInfo(user.email);
        if (userInfo.status === 200) {
          setConversationsBrief(userInfo.data.conversationsBrief);
        } else {
          setConversationsBrief([]);
        }
      } catch (error) {
        message.error("加载用户信息失败，请刷新重试");
      }
    }

    fetchUserInfo();
  }, [user.email]);

  useEffect(() => {
    // 点击 sidebar 外部区域时关闭 sidebar
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !navRef.current.contains(event.target)
      ) {
        setVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setVisible, navRef]);

  const handleCreateWindow = async () => {
    try {
      const res = await createChatWindow(user.email);
      if (res.status == 201) {
        setConversationsBrief([
          res.data.conversationBrief,
          ...conversationsBrief,
        ]);
        navigate(`/chatPage/${res.data.conversationBrief.windowID}`);
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleDeleteConversation = (windowID) => {
    setConversationsBrief(
      conversationsBrief.filter((conv) => conv.windowID !== windowID)
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
            {conversationsBrief.map((conv) => (
              <ConversationItem
                key={conv.windowID}
                conversationBrief={conv}
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
