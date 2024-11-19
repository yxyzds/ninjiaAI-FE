// components/LoginForm.js
import React, { useState, useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { login } from "./api";
import { useUser } from "../context/userContext";

const validateMessages = {
  required: "请输入${label}",
  types: {
    email: "${label}格式不正确!",
  },
};

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { setUser } = useUser();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const { email, password } = values;
      const data = await login(email, password);
      if (data.success) {
        const { token, user: userInfo } = data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userInfo));
        await setUser(userInfo);
        navigate("/");
      } else {
        message.error(data.message);
      }

      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error(err);
      message.error("出现了未知错误，请稍后重试！");
    }
  };

  return (
    <Form
      layout="vertical"
      onFinish={onFinish}
      validateMessages={validateMessages}
    >
      <Form.Item
        label="邮箱"
        name="email"
        rules={[
          {
            required: true,
            type: "email",
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item label="密码" name="password" rules={[{ required: true }]}>
        <Input.Password />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          登 录
        </Button>
      </Form.Item>
    </Form>
  );
}

export default Login;
