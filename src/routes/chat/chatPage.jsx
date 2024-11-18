import React, { useState, useEffect } from "react";
import { getMessageHistory } from "../api";
import { useParams } from "react-router-dom";
import { useUser } from "../../context/userContext";
import Message from "./components/Message";
import InputBox from "./components/inputBox/inputBox";

import "./style.css";

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const { windowID } = useParams();
  const { user } = useUser();

  const email = user.email;

  useEffect(() => {
    const initMessages = async () => {
      try {
        const res = await getMessageHistory(email, windowID);
        if (res.status == 200) {
          setMessages(res.data.messageHistory || []);
        }
      } catch (error) {
        console.error("Failed to fetch message history:", error.message);
      }
    };

    initMessages();
  }, [windowID]);

  const getChatGPTResponse = async (message) => {
    // 检查请求成功后，建立 SSE 连接
    const eventSource = new EventSource(
      `${
        import.meta.env.VITE_API_URL
      }/chat/conversation?email=${email}&windowID=${windowID}&message=${encodeURIComponent(
        message
      )}&token=${encodeURIComponent(localStorage.getItem("token"))}`
      // { withCredentials: true }
    );
    // 初始化流数据条目
    const initialTempMessage = {
      role: "assistant",
      content: "",
      loading: true,
    };
    setMessages((prevMessages) => {
      return [...prevMessages, initialTempMessage];
    });

    eventSource.onmessage = (event) => {
      if (event.data === "[DONE]") {
        console.log("Stream ended. Closing connection.");
        // 检测到结束标记后手动关闭连接，防止重连
        eventSource.close();
      } else {
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          const lastIndex = updatedMessages.length - 1;
          updatedMessages[lastIndex] = {
            ...updatedMessages[lastIndex],
            content:
              updatedMessages[lastIndex].content +
              event.data.replace(/\\n/g, "\n"),
            loading: false,
            // 将 event.data 逐字符添加到当前消息的 content 中，解码换行符
          };

          return updatedMessages;
        });
      }
    };

    eventSource.onerror = (error) => {
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("Connection closed normally.");
      } else {
        eventSource.close();
        console.error("SSE connection error:", error);
      }
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    // 添加用户消息
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: input },
    ]);

    // 获取 ChatGPT 回复
    await getChatGPTResponse(input);
    setInput("");
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((message, index) => (
          <Message
            key={index}
            content={message.content}
            role={message.role}
            isLoading={message.loading}
          />
        ))}
      </div>
      <InputBox
        value={input}
        onChange={setInput}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}

export default ChatPage;
