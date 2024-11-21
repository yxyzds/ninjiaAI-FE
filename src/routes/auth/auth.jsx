import React, { useState } from "react";
import { Card } from "antd";
import Login from "./Login";
import Register from "./Register";
import Verify from "./Verify";

import "./auth.css";

function AuthPage() {
  const [currentForm, setCurrentForm] = useState("login"); // 当前表单
  const [verifiedData, setVerifiedData] = useState(null); // 验证通过的数据

  // 验证成功后保存数据并切换到注册表单
  const handleVerifySuccess = (data) => {
    setVerifiedData(data); // 保存邮箱和验证码
    setCurrentForm("register"); // 切换到注册表单
  };

  // 注册成功后切换到登录表单
  const onRegisterSuccess = () => {
    setCurrentForm("login"); // 切换到登录表单
  };

  // 根据当前表单类型渲染对应的组件
  const renderForm = () => {
    switch (currentForm) {
      case "login":
        return (
          <>
            <Login />
            <p className="auth-link">
              <span onClick={() => setCurrentForm("verify")}>前往注册</span>
            </p>
          </>
        );
      case "verify":
        return (
          <>
            <Verify handleVerifySuccess={handleVerifySuccess} />
            <p className="auth-link">
              已有账号,{" "}
              <span onClick={() => setCurrentForm("login")}>前往登录</span>
            </p>
          </>
        );
      case "register":
        return (
          <>
            <Register
              verifiedData={verifiedData}
              onRegisterSuccess={onRegisterSuccess}
            />
            <p className="auth-link">
              已有账号？{" "}
              <span onClick={() => setCurrentForm("login")}>登录</span>
            </p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="auth-container">
      <div>
        {/* SVG Logo */}
        <img src="/react.svg" alt="Logo" width="100" height="100" />
      </div>
      <Card className="auth-card" bordered={false}>
        {renderForm()}
      </Card>
    </div>
  );
}

export default AuthPage;
