import { useState, useEffect } from "react";
import {
  Modal,
  Upload,
  Button,
  List,
  message,
  Popconfirm,
  Spin,
  Radio,
} from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { useUser } from "../../../../context/userContext";
import {
  getUserUploadedFiles,
  deleteUserUploadedFile,
  getFileStatus,
} from "../../../../routes/api";
import "./style.css";

export default function FileModal({
  visible,
  onClose,
  onFileSelect,
  initialSelectedFile,
}) {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(initialSelectedFile);
  const { user } = useUser();

  const fileStateEnum = {
    processing: "processing",
    ready: "ready",
    failed: "failed",
  };

  const uploadProps = {
    name: "file",
    action: "http://localhost:3000/njapi/upload/uploadSingle",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    showUploadList: false,
    data: { email: user.email },
    multiple: false,
    accept:
      ".txt,.doc,.docx,.pdf,.xls,.xlsx,.csv,.md,.json,.xml,.ppt,.pptx" +
      ",.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.h,.hpp,.cs,.php,.html,.css,.scss,.less,.sql,.sh,.yaml,.yml,.ini,.conf,.env,.properties",
    beforeUpload: (file) => {
      // 检查文件大小（3MB = 3 * 1024 * 1024 bytes）
      const isLessThan3M = file.size / 1024 / 1024 < 3;
      if (!isLessThan3M) {
        message.error("文件大小不能超过3MB");
        return false;
      }

      // 检查是否存在同名文件
      const existingFile = fileList.find((item) => item.fileName === file.name);
      if (existingFile) {
        message.error(`文件 "${file.name}" 已存在`);
        return false;
      }
      //允许上传
      return true;
    },
    onChange(info) {
      if (info.file.status === "uploading") {
        setUploading(true);
      }
      if (info.file.status === "done") {
        setUploading(false);
        const res = info.file.response;
        if (res.success) {
          setFileList((prev) => [
            ...prev,
            {
              fileName: res.fileName,
              url: res.fileUrl,
              s3Key: res.s3Key,
            },
          ]);
          message.success(`${res.fileName} 上传成功`);
        }
      } else if (info.file.status === "error") {
        setUploading(false);
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  const handleDelete = async (file) => {
    try {
      // 调用删除文件的API
      const res = await deleteUserUploadedFile(user.email, file.fileName);
      if (res.data.success) {
        setFileList((prev) =>
          prev.filter((fileItem) => fileItem.fileName !== file.fileName)
        );
        message.success("文件删除成功");
      } else {
        message.error("文件删除失败");
      }
    } catch (error) {
      message.error("删除文件失败");
    }
  };

  const handleConfirm = async () => {
    if (!selectedFile) {
      message.warning("请选择一个文件");
      return;
    }
    const res = await getFileStatus(user.email, selectedFile.fileName);
    if (res.data.fileState === fileStateEnum.ready) {
      onFileSelect(selectedFile);
      onClose();
    }
    if (res.data.fileState === fileStateEnum.processing) {
      message.warning(
        "文件正在解析中，根据文件大小和网络情况需要1-3分钟，请稍后再试"
      );
    }
    if (res.data.fileState === fileStateEnum.failed) {
      message.error("文件解析失败，请重新上传");
    }
  };

  useEffect(() => {
    if (visible) {
      // 获取用户文件列表
      const fetchFiles = async () => {
        try {
          const res = await getUserUploadedFiles(user.email);
          setFileList(res.data.files);
        } catch (error) {
          message.error("获取文件列表失败");
        }
      };
      fetchFiles();
    }
  }, [visible, user.email]);

  useEffect(() => {
    // 当 Modal 打开时，设置初始选中的文件
    if (visible) {
      setSelectedFile(initialSelectedFile);
    }
  }, [visible, initialSelectedFile]);

  return (
    <Modal
      title="选择要使用的文件(单选)"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleConfirm}>
          确认选择
        </Button>,
      ]}
      width={600}
      centered
    >
      <Spin spinning={uploading} tip="文件上传中...">
        <div className="file-modal-content">
          <Upload {...uploadProps}>
            <Button
              icon={<UploadOutlined />}
              loading={uploading}
              disabled={uploading}
            >
              {uploading ? "上传中..." : "上传文件"}
            </Button>
          </Upload>

          <List
            className="file-list"
            itemLayout="horizontal"
            dataSource={fileList}
            renderItem={(file, index) => (
              <List.Item
                key={`${file.fileName}-${index}`}
                actions={[
                  <Popconfirm
                    key={`delete-${index}`}
                    title="删除文件"
                    description="确定要删除这个文件吗？"
                    onConfirm={() => handleDelete(file)}
                    okText="确定"
                    cancelText="取消"
                    disabled={uploading}
                  >
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={uploading}
                    />
                  </Popconfirm>,
                ]}
              >
                <div className="file-item-content">
                  <Radio
                    checked={selectedFile?.fileName === file.fileName}
                    onChange={() => setSelectedFile(file)}
                    disabled={uploading}
                  />
                  <span className="file-name">
                    {file.fileName.length > 50
                      ? file.fileName.slice(0, 50) + "..."
                      : file.fileName}
                  </span>
                </div>
              </List.Item>
            )}
          />
        </div>
      </Spin>
    </Modal>
  );
}
