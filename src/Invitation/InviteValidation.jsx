import React from "react";
import { Form, Input, Button, message, Typography, Card } from "antd";
import "./InviteValidation.css"; // 引入自定义样式文件
const { Text } = Typography;
const InviteValidation = ({ onValidateSuccess }) => {
  const onFinish = async (values) => {
    const { inviteCode } = values;

    try {
      // 调用后台 API 验证邀请码
      const response = await fetch(`/api/invite/validate?code=${inviteCode}`, {
        method: "GET",
      });
      const data = await response.json();

      if (data.success) {
        message.success(data.message);
        if (onValidateSuccess) onValidateSuccess();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      console.error("Error validating invite code:", error);
      message.error("验证邀请码时出错，请稍后再试。");
    }
  };

  return (
    <div className="invite-validation-container">
      <Form
        name="inviteForm"
        layout="vertical"
        onFinish={onFinish}
        className="invite-validation-form"
      >
        <Form.Item
          label="邀请码"
          name="inviteCode"
          rules={[{ required: true, message: "请输入邀请码" }]}
        >
          <Input placeholder="请输入您的邀请码" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            验证邀请码
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default InviteValidation;
