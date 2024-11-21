import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  UserOutlined,
  OpenAIOutlined,
  CopyOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { Row, Col, message as antdMessage, Spin, Popover } from "antd";

import "./style.css";

const Message = ({ content, role, isLoading }) => {
  const [copied, setCopy] = useState(false);
  const onCopy = (content) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopy(true);
        setTimeout(() => {
          setCopy(false);
        }, 3000);
        // antdMessage.success("消息已复制到剪贴板");
      })
      .catch((err) => {
        console.error("复制失败：", err);
        // antdMessage.error("复制失败，请重试");
      });
  };

  return (
    <Row
      className={`message ${role === "user" ? "user" : "assistant"}`}
      gutter={2}
    >
      <Col span={4}>
        <div className="message-icon">
          {role === "user" ? (
            <UserOutlined className="user-icon" />
          ) : (
            <OpenAIOutlined className="chatgpt-icon" />
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
            {copied ? (
              <CheckOutlined className="message-copy-icon" />
            ) : (
              <CopyOutlined className="message-copy-icon" />
            )}
          </div>
        ) : null}
      </Col>
    </Row>
  );
};

export default Message;
