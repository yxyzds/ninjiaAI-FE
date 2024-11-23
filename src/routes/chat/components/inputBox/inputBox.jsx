import React, { useState } from "react";
import { Input, Button, message, Upload } from "antd";
import {
  CloseCircleOutlined,
  UploadOutlined,
  SendOutlined,
} from "@ant-design/icons";
import "./style.css";
import { useUser } from "../../../../context/userContext";

const { TextArea } = Input;

function InputBox({ value, onChange, onSendMessage }) {
  const [fileNames, setFileNames] = useState([]); // 更改为状态管理文件名列表
  const [loading, setLoading] = useState(false); // 管理加载状态
  const [fileUrlList, setfileUrlList] = useState([]); // 更改为状态管理文件名列表
  const { user } = useUser();

  const props = {
    name: "file",
    action: "http://localhost:3000/njapi/chat/upload",
    showUploadList: false,
    data: { email: user.email },
    maxCount: 5,
    onChange(info) {
      console.log(info, "asd");
      if (info.file.status !== "uploading") {
        setLoading(true);
      }
      //通过状态码判断是否成功
      if (info.file.status === "done") {
        setLoading(false); // 上传完成时，重置 loading 状态
        setFileNames((prev) => [...prev, info.file.name]); // 添加文件名到列表
        console.log(info.file.response);
        const res = info.file.response;
        if (res.success) {
          setfileUrlList()
          message.success(`${info.file.name} 上传成功`);
        }
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} 上传失败.`);
      }
    },
    onRemove(file) {
      // 从列表中移除文件
      setFileNames((prev) => prev.filter((name) => name !== file.name));
    },
  };

  const handleRemoveFile = (name) => {
    setFileNames((prev) => prev.filter((fileName) => fileName !== name));
    message.success(`${name} 已移除`);
  };

  const onPress = (e) => {
    //换行
    if (!e.shiftKey) {
      onSendMessage();
    }
  };

  return (
    <div className="input-box-container">
      {fileNames.length > 0 && (
        <div className="file-name-display">
          {fileNames.map((name, index) => (
            <span key={index} className="file-name-item">
              {name.length > 12 ? name.slice(12) : name}
              <CloseCircleOutlined
                onClick={() => handleRemoveFile(name)}
                className="remove-icon"
              />
            </span>
          ))}
        </div>
      )}
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPressEnter={onPress} // 处理按键事件
        placeholder="向 chatgpt 提出任何问题并获得答案"
        autoSize={{ minRows: 2, maxRows: 7 }}
        className="input-area"
      />
      <div className="button-wrapper">
        <Upload {...props}>
          <Button icon={<UploadOutlined />} className="upload-button">
            附件上传
          </Button>
        </Upload>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={onSendMessage}
          loading={loading}
          disabled={loading}
          className="send-button"
        />
      </div>
    </div>
  );
}

export default InputBox;
