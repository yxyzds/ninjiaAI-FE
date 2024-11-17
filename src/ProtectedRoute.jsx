// ProtectedRoute.js
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function isTokenExpired() {
  const token = localStorage.getItem("token");

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // 转换为秒
    return decoded.exp < currentTime;
  } catch (error) {
    // 如果解码失败或其他错误，认为 token 无效
    return true;
  }
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  if (isTokenExpired()) {
    // 用户未认证，重定向到登录页面
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children; // 用户已认证，渲染对应的子组件
}

export default ProtectedRoute;
