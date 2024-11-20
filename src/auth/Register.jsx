import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import {
  register,
  sendVerificationCode,
  verifyVerificationCode,
  verifyInvitationCode,
} from "./api";

const validateMessages = {
  required: "请输入${label}",
  types: {
    email: "${label}格式不正确!",
  },
};

function Register({ onRegisterSuccess }) {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0); // 倒计时状态
  const [form] = Form.useForm(); // 创建 Form 实例

  // 获取验证码
  const handleSendCode = async () => {
    try {
      const email = form.getFieldValue("email");
      if (!email) {
        message.error("请先填写邮箱地址");
        return;
      }
      setCountdown(60); // 设置倒计时为 60 秒
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const res = await sendVerificationCode(email);
      if (res.status === 200) {
        message.success("验证码已发送到您的邮箱，请查收", 8);
      } else {
        message.error("发送验证码失败，请稍后重试", 8);
        setCountdown(0); // 重置倒计时
      }
    } catch (error) {
      message.error("发送验证码失败，请稍后重试", 8);
      setCountdown(0); // 重置倒计时
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { username, email, password, verificationCode, invitationCode } =
        values;
      const verifyRes = await verifyVerificationCode(email, verificationCode);
      const invitationRes = await verifyInvitationCode(email, invitationCode);
      if (!invitationRes.success) {
        setLoading(false);
        return message.error(invitationRes.message || "邀请码验证失败！");
      }
      if (!verifyRes.success) {
        setLoading(false);
        return message.error(
          verifyRes.message || "邮箱验证码验证失败！请检查输入或重新获取"
        );
      }
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
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      validateMessages={validateMessages}
    >
      <Form.Item label="用户名" name="username" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item
        label="邀请码"
        name="invitationCode"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="邮箱"
        name="email"
        rules={[{ required: true, type: "email" }]}
      >
        <Input type="email" />
      </Form.Item>
      <Form.Item
        label="邮箱验证asda码"
        name="verificationCode"
        rules={[{ required: true }]}
      >
        <Input
          addonAfter={
            <Button
              type="link"
              onClick={handleSendCode}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `${countdown}秒后重新发送` : "获取验证码"}
            </Button>
          }
        />
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
