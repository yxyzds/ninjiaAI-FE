import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  UserOutlined,
  OpenAIOutlined,
  CopyOutlined,
  CheckOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { Row, Col, Spin } from "antd";

import "./style.css";

const Message = ({ content, role, isLoading, referenceFile }) => {
  const [copied, setCopy] = useState(false);
  const onCopy = (content) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopy(true);
        setTimeout(() => {
          setCopy(false);
        }, 3000);
      })
      .catch((err) => {
        console.error("复制失败：", err);
      });
  };

  const renderers = {
    // 标题渲染器
    heading({ level, children }) {
      const Tag = `h${level}`;
      return <Tag className={`markdown-heading h${level}`}>{children}</Tag>;
    },

    // 段落渲染器
    paragraph({ children }) {
      return <p className="markdown-paragraph">{children}</p>;
    },

    // 链接渲染器
    link({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="markdown-link"
        >
          {children}
        </a>
      );
    },

    // 无序列表渲染器
    list({ ordered, children }) {
      return ordered ? (
        <ol className="markdown-ordered-list">{children}</ol>
      ) : (
        <ul className="markdown-unordered-list">{children}</ul>
      );
    },

    // 列表项渲染器
    listItem({ children }) {
      return <li className="markdown-list-item">{children}</li>;
    },

    // 行内代码渲染器
    code({ className, children }) {
      const isInline = !className || className.length === 0; // 没有 className 则是行内代码
      if (isInline) {
        return <code className="markdown-inline-code">{children}</code>;
      }
      return (
        <pre className="markdown-code-block">
          <code>{children}</code>
        </pre>
      );
    },
  };

  return (
    <Row
      className={`message ${role === "user" ? "user" : "assistant"}`}
      gutter={2}
    >
      <Col span={3}>
        <div className="message-icon">
          {role === "user" ? (
            <UserOutlined className="user-icon" />
          ) : (
            <OpenAIOutlined className="chatgpt-icon" />
          )}
        </div>
      </Col>
      <Col span={20}>
        {referenceFile && (
          <div className="reference-file">
            <div className="reference-file-label">
              <FileOutlined />
              参考文件：
            </div>
            <div className="reference-file-content">
              {referenceFile}
            </div>
          </div>
        )}
        <div className="message-content">
          {isLoading && role === "assistant" ? (
            <Spin size="small" className="loading-spinner" />
          ) : (
            <ReactMarkdown components={renderers}>{content}</ReactMarkdown>
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
