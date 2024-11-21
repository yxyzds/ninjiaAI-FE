import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import {
  register,
  sendVerificationCode,
  verifyVerificationCode,
  verifyInvitationCode,
} from "./api";
import NinjiaForm from "../../components/NinjiaForm";

const validateMessages = {
  required: "请输入${label}",
  types: {
    email: "${label}格式不正确!",
  },
};

function Verify({ handleVerifySuccess, onRegisterSuccess }) {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0); // 倒计时状态
  const [form] = Form.useForm(); // 创建 Form 实例

  const verifyInvitation = async (email, invitationCode) => {
    const invitationRes = await verifyInvitationCode(email, invitationCode);
    if (invitationRes.success) {
      return true;
    }
    return false;
  };

  // 获取验证码
  const handleSendCode = async () => {
    try {
      const email = form.getFieldValue("email");
      const invitationCode = form.getFieldValue("invitationCode");
      if (!email) {
        message.error("请先填写邮箱地址");
        return;
      }
      if (!invitationCode) {
        message.error("请输入邀请码");
        return;
      }
      const invitationVerifed = await verifyInvitation(email, invitationCode);
      if (!invitationVerifed) {
        message.error("邀请码过期或失效");
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
      const { email, verificationCode, invitationCode } = values;
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
      if (verifyRes.success && invitationRes.success) {
        handleVerifySuccess({ email, verificationCode, invitationCode });
      }
    } catch (err) {
      message.error(err.message || "验证服务失败，请稍后重试");
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
        label="邀请码"
        name="invitationCode"
        rules={[{ required: true }]}
      >
        <Input />
      </NinjiaForm.Item>
      <NinjiaForm.Item
        label="邮箱"
        name="email"
        rules={[{ required: true, type: "email" }]}
      >
        <Input type="email" />
      </NinjiaForm.Item>
      <NinjiaForm.Item
        label="邮箱验证码"
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
      </NinjiaForm.Item>
      <NinjiaForm.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
           下 一 步
        </Button>
      </NinjiaForm.Item>
    </NinjiaForm>
  );
}

export default Verify;
