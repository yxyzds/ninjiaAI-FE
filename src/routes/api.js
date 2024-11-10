// src/api.js
import axios from "axios";

// 创建一个 axios 实例
const api = axios.create({
  baseURL: "http://localhost:3000", // 配置基础 URL
  timeout: 1000, // 可选: 配置请求超时时间
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
