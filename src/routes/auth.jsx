// AuthPage.js
import React, { useState } from "react";
import { Card, Tabs } from "antd";
import Login from "../auth/Login";
import Register from "../auth/Register";

function AuthPage() {
  const [activeKey, setActiveKey] = useState("1"); // 设置初始选项卡为登录页

  const onRegisterSuccess = () => {
    setActiveKey("1"); // 切换到登录页
  };

  return (
    <div style={styles.container}>
      {/* Logo 区域 */}
      <div style={styles.logoContainer}>
        {/* 在此插入你的 SVG logo */}
        <img src="/react.svg" alt="Logo" width="100" height="100" />
        {/* <Logo width="60" height="60" /> */}
      </div>
      <Card style={styles.card} bordered={false}>
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          centered
          items={[
            {
              label: "登录",
              key: "1",
              children: <Login />,
            },
            {
              label: "注册",
              key: "2",
              children: <Register onRegisterSuccess={onRegisterSuccess} />,
            },
          ]}
        ></Tabs>
      </Card>
    </div>
  );
}

export default AuthPage;

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#f0f2f5",
  },
  logoContainer: {
    marginBottom: 16,
    color: "#1890ff", // logo 颜色，可以根据需要调整
  },
  card: {
    width: 400,
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    borderRadius: "8px",
  },
};
