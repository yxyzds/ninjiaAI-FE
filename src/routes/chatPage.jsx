import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import api from "./api";

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const getMessageHistory = async (email, windowID) => {
      let res = {};
      try {
        res = await api.post(
          "http://localhost:3000/chat/getConversationHistory",
          {
            email,
            windowID,
          }
        );
        res = res.data;
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setMessages(res.messageHistory || []);
    };

    getMessageHistory("369@gmail.com", "a58e7d7a-0324-436f-be0c-c66217423d97");
  }, []);

  const getChatGPTResponse = async (message) => {
    const email = "369@gmail.com";
    const windowID = "a58e7d7a-0324-436f-be0c-c66217423d97";
    // 检查请求成功后，建立 SSE 连接
    const eventSource = new EventSource(
      `http://localhost:3000/chat/conversation?email=${email}&windowID=${windowID}&message=${encodeURIComponent(
        message
      )}`
      // { withCredentials: true }
    );
    // 初始化流数据条目
    const initialTempMessage = { role: "assistant", content: "" };
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
    <div style={styles.container}>
      <div style={styles.chatBox}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={
              message.role === "user"
                ? styles.userMessage
                : styles.chatgptMessage
            }
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        ))}
      </div>

      <div style={styles.inputContainer}>
        <input
          type="text"
          placeholder="输入消息..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={styles.input}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button onClick={handleSendMessage} style={styles.sendButton}>
          发送
        </button>
      </div>
    </div>
  );
}

export default ChatPage;

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100vh",
    padding: "16px",
    backgroundColor: "#f5f5f5",
  },
  chatBox: {
    width: "100%",
    maxHeight: "80%",
    overflowY: "auto",
    padding: "16px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    marginBottom: "16px",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#e1f5fe",
    padding: "10px",
    borderRadius: "8px",
    margin: "8px 0",
    maxWidth: "70%",
  },
  chatgptMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e0e0e0",
    padding: "10px",
    borderRadius: "8px",
    margin: "8px 0",
    maxWidth: "70%",
  },
  inputContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    maxWidth: "800px",
  },
  input: {
    flex: 1,
    padding: "10px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    outline: "none",
    marginRight: "8px",
  },
  sendButton: {
    padding: "10px 16px",
    fontSize: "16px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};
