import React from "react";
import { Input, Button } from "antd";
import {
  PaperClipOutlined,
  AudioOutlined,
  SendOutlined,
} from "@ant-design/icons";
import "./style.css";

const { TextArea } = Input;

function InputBox({ value, onChange, onSendMessage }) {
  return (
    <div className="input-box-container">
      <div className="input-box-wrapper">
        {/* <Button
          icon={<PaperClipOutlined />}
          shape="circle"
          className="icon-button"
        />
        <Button
          icon={<AudioOutlined />}
          shape="circle"
          className="icon-button"
        /> */}
        <TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPressEnter={onSendMessage}
          placeholder="向 chatgpt 提出任何问题并获得答案"
          autoSize={{ minRows: 3, maxRows: 5 }}
          className="input-area"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={onSendMessage}
          className="send-button"
        />
      </div>
    </div>
  );
}

export default InputBox;
