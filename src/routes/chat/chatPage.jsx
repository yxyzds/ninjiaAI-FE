import { useState, useEffect } from "react";
import { getMessageHistory } from "../api";
import { useParams } from "react-router-dom";
import { useUser } from "../../context/userContext";
import Message from "./components/Message";
import InputBox from "./components/inputBox/inputBox";
import IntroductionCards from "../../components/introduction/introduction";
import { message as messageNotification } from "antd";

import "./style.css";

const EXCEESSDAILYUSAGE = "[ERROR-EXCEESS-DAILYUSAGE]";

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const { windowID } = useParams();
  const { user } = useUser();

  const email = user.email;
  useEffect(() => {
    const initMessages = async () => {
      try {
        const data = await getMessageHistory(email, windowID);
        if (data.success) {
          setMessages(data.messageHistory || []);
        } else {
          messageNotification.error(data.message);
        }
      } catch (error) {
        messageNotification.error("获取对话消息错误，请刷新重试");
      }
    };

    initMessages();
  }, [windowID, email]);

  const getChatGPTResponse = async (message, file) => {
    // 检查请求成功后，建立 SSE 连接
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/chat/conversation?` +
        `email=${email}&` +
        `windowID=${windowID}&` +
        `message=${encodeURIComponent(message)}&` +
        `fileKey=${file?.s3Key || ""}&` +
        `fileName=${file?.fileName || ""}&` +
        `token=${encodeURIComponent(localStorage.getItem("token"))}`
    );

    const initApply = () => {
      // 初始化流数据条目
      const initialTempMessage = {
        role: "assistant",
        content: "",
        loading: true,
        referenceFile: file?.fileName,
      };

      setMessages((prevMessages) => {
        return [...prevMessages, initialTempMessage];
      });
    };

    initApply(); //待优化，会导致出现对话框但没内容
    //streaming type: {data:"content string" }
    eventSource.onmessage = (event) => {
      if (event.data === EXCEESSDAILYUSAGE) {
        messageNotification.error("已超过每日使用限额", 10);
        eventSource.close();
        return;
      }

      // initApply();
      if (event.data === "[DONE]") {
        console.log("Stream ended. Closing connection.");
        // 检测到结束标记后手动关闭连接，防止重连
        eventSource.close();
        return;
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
      console.log(eventSource.readyState);
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("Connection closed normally.");
      } else {
        eventSource.close();
        console.log(error);
        messageNotification.error("对话服务错误，请刷新重试");
      }
    };
  };

  const handleSendMessage = async (input, file) => {
    if (!input.trim()) return;
    // 添加用户消息
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: "user",
        content: input,
        referenceFile: file?.fileName,
      },
    ]);

    // 获取 ChatGPT 回复
    await getChatGPTResponse(input, file);
    setInput("");
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.length == 0 ? (
          <IntroductionCards />
        ) : (
          messages.map((message, index) => (
            <Message
              key={index}
              content={message.content}
              role={message.role}
              isLoading={message.loading}
              referenceFile={message.referenceFile}
            />
          ))
        )}
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
