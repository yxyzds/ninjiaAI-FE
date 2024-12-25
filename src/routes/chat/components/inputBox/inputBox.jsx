import { useState } from "react";
import { Input, Button, message } from "antd";
import {
  CloseCircleOutlined,
  UploadOutlined,
  SendOutlined,
} from "@ant-design/icons";
import "./style.css";
import FileModal from "../fileModal/FileModal";

const { TextArea } = Input;

function InputBox({ value, onChange, onSendMessage }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSendMessage = () => {
    onSendMessage(value, selectedFile);
  };

  const onPress = (e) => {
    if (!e.shiftKey) {
      handleSendMessage();
    }
  };

  return (
    <div className="input-box-container">
      {selectedFile && (
        <div className="file-name-display">
          <span className="file-name-item">
            {selectedFile.fileName.length > 50
              ? selectedFile.fileName.slice(0, 50) + "..."
              : selectedFile.fileName}
            <CloseCircleOutlined
              onClick={handleRemoveFile}
              className="remove-icon"
            />
          </span>
        </div>
      )}
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPressEnter={onPress}
        placeholder="向 chatgpt 提出任何问题并获得答案"
        autoSize={{ minRows: 2, maxRows: 7 }}
        className="input-area"
      />
      <div className="button-wrapper">
        <Button
          icon={<UploadOutlined />}
          className="upload-button"
          onClick={() => setIsModalVisible(true)}
        >
          附件上传
        </Button>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSendMessage}
          loading={loading}
          disabled={loading}
          className="send-button"
        />
      </div>

      <FileModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onFileSelect={handleFileSelect}
        initialSelectedFile={selectedFile}
      />
    </div>
  );
}

export default InputBox;
