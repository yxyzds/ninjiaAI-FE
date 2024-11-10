// components/RegisterForm.js
import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import api from "./api";

const validateMessages = {
  required: "请输入${label}",
  types: {
    email: "${label}格式不正确!",
  },
};

const register = async (username, email, password) => {
  let code = 0;
  try {
    const res = await api.post("http://127.0.0.1:3000/users/createUser", {
      username,
      email,
      password,
    });
    code = res.data.code;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
  return code;
};

function Register({ onRegisterSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm(); // 创建 Form 实例

  const onFinish = async (values) => {
    setLoading(true);
    const { username, email, password } = values;
    const code = await register(username, email, password);
    console.log(code, "code");
    if (code == 200) {
      message.success("注册成功！切换到登录");
      form.resetFields();
      onRegisterSuccess();
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      validateMessages={validateMessages}
    >
      <Form.Item label="用户名" name="username" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="邮箱" name="email" rules={[{ required: true }]}>
        <Input type="email" />
      </Form.Item>
      <Form.Item label="密码" name="password" rules={[{ required: true }]}>
        <Input.Password />
      </Form.Item>
      <Form.Item
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
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          注 册
        </Button>
      </Form.Item>
    </Form>
  );
}

export default Register;
