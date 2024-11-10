// components/LoginForm.js
import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import api from "./api";

const validateMessages = {
  required: "请输入${label}",
  types: {
    email: "${label}格式不正确!",
  },
};

const login = async (email, password) => {
  let code = 0;
  try {
    const res = await api.post("http://127.0.0.1:3000/users/loginUser", {
      email,
      password,
    });
    code = res.data.code;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
  return code;
};

const getMessageHistory = async (email, windowID) => {
  let res = {};
  try {
    res = await api.post("http://localhost:3000/chat/getConversationHistory", {
      email,
      windowID,
    });
    res = res.data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
  console.log(res, "res");
};

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    const { email, password } = values;
    const code = await login(email, password);
    await getMessageHistory(
      "369@gmail.com",
      "9103dd95-f05e-4dc6-b5bc-ea37be18e23a"
    );

    if (code == 200) {
      localStorage.setItem("token", "dummy-auth-token");
      message.success("登录成功!");
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
