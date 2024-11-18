import React from "react";
import ReactMarkdown from "react-markdown";
import { UserOutlined, RobotOutlined, CopyOutlined } from "@ant-design/icons";
import { Row, Col, message as antdMessage, Spin } from "antd";
import chatgptIcon from "../assets/chatgpt.svg"; // 引入本地的 SVG 文件

import "./style.css";

const Message = ({ content, role, isLoading }) => {
  const onCopy = (content) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        antdMessage.success("消息已复制到剪贴板");
      })
      .catch((err) => {
        console.error("复制失败：", err);
        antdMessage.error("复制失败，请重试");
      });
  };

  return (
    <Row
      className={`message ${role === "user" ? "user" : "assistant"}`}
      gutter={4}
    >
      <Col span={4}>
        <div className="message-icon">
          {role === "user" ? (
            <UserOutlined className="user-icon" />
          ) : (
            <img
              src="/public/chatgpt-6.svg"
              alt="ChatGPT"
              className="chatgpt-icon"
            />
          )}
        </div>
      </Col>
      <Col span={20}>
        <div className="message-content">
          {isLoading && role === "assistant" ? (
            <Spin size="small" className="loading-spinner" />
          ) : (
            <ReactMarkdown>{content}</ReactMarkdown>
          )}
        </div>
        {role === "assistant" ? (
          <div className="message-copy" onClick={() => onCopy(content)}>
            <CopyOutlined className="message-copy-icon" />
            复制
          </div>
        ) : null}
      </Col>
    </Row>
  );
};

export default Message;
