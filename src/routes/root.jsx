import { useEffect, useState } from "react";
import { NavLink, Form, useNavigate, Outlet } from "react-router-dom";
import { getUserInfo, createChatWindow } from "./api";
import { message } from "antd";
import { useUser } from "../context/userContext";

export default function Root() {
  const [conversations, setConversations] = useState([]);
  const navigate = useNavigate();
  const { user } = useUser();

  //测试跳转逻辑
  if (!user) {
    navigate("/auth");
  }

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const userInfo = await getUserInfo(user.email);
        if (userInfo.status === 200) {
          setConversations(userInfo.data.conversations);
          console.log(userInfo.data.conversations);
        } else {
          setConversations([]);
        }
      } catch (error) {
        message.error("Failed to load user info");
      }
    }

    fetchUserInfo();
  }, [user.email]);

  const handleSubmit = async () => {
    try {
      //获取数组数量，用于默认名称设置
      const lastIndex = conversations.length;
      const res = await createChatWindow(user.email, lastIndex);

      if (res.status == 201) {
        setConversations([res.data.conversation, ...conversations]);
        navigate(`/chatPage/${res.data.conversation.windowID}`);
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <>
      <div id="sidebar">
        <h1>Ninjia AI</h1>
        <div>
          <Form id="search-form" role="search">
            <input
              id="q"
              aria-label="Search contacts"
              placeholder="Search"
              type="search"
              name="q"
            />
            <div id="search-spinner" aria-hidden hidden={true} />
            <div className="sr-only" aria-live="polite"></div>
          </Form>
          <button onClick={handleSubmit}>New</button>
        </div>
        <nav>
          <ul>
            {conversations.map((conv) => (
              <li key={conv.windowID}>
                <NavLink
                  to={`chatPage/${conv.windowID}`}
                  className={({ isActive, isPending }) =>
                    isActive ? "active" : isPending ? "pending" : ""
                  }
                >
                  {conv.title}
                  {conv.favorite && <span>★</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div id="detail">
        <Outlet />
      </div>
    </>
  );
}
