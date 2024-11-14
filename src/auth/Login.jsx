// components/LoginForm.js
import React, { useState } from "react";
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
    setLoading(true);
    const { email, password } = values;
    const res = await login(email, password);
    if (res.status == 200) {
      message.success("登录成功!");
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      navigate("/"); // 登录成功后跳转到主页
    } else {
      message.error("账号或密码错误");
    }
    setLoading(false);
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
