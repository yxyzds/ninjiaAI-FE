import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { register } from "./api";
import NinjiaForm from "../../components/NinjiaForm";

const validateMessages = {
  required: "请输入${label}",
  types: {
    email: "${label}格式不正确!",
  },
};

function Register({ verifiedData, onRegisterSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm(); // 创建 Form 实例

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { password } = values;
      const { email, verificationCode } = verifiedData;
      const username = email;
      const res = await register(username, email, password, verificationCode);
      if (res.status === 200) {
        message.success("注册成功！切换到登录页面", 8);
        form.resetFields();
        onRegisterSuccess();
        setLoading(false);
      } else {
        message.error(res.message || "注册失败，请重试");
      }
    } catch (err) {
      message.error(err.message || "注册服务失败，请稍后重试");
    }
    setLoading(false);
  };

  return (
    <NinjiaForm
      form={form}
      layout="vertical"
      onFinish={onFinish}
      validateMessages={validateMessages}
    >
      <NinjiaForm.Item
        label="密码"
        name="password"
        rules={[{ required: true }]}
      >
        <Input.Password />
      </NinjiaForm.Item>
      <NinjiaForm.Item
        label="确认密码"
        name="confirmPassword"
        dependencies={["password"]}
        rules={[
          { required: true, message: "请确认密码" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("两次输入密码不匹配"));
            },
          }),
        ]}
      >
        <Input.Password />
      </NinjiaForm.Item>
      <NinjiaForm.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          注 册
        </Button>
      </NinjiaForm.Item>
    </NinjiaForm>
  );
}

export default Register;
