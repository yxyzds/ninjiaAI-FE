// src/api.js
import axios from "axios";

// 创建一个 axios 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // 配置基础 URL
  timeout: 1000, // 可选: 配置请求超时时间
  headers: {
    "Content-Type": "application/json",
  },
});


export const login = async (email, password) => {
  try {
    const res = await api.post("/users/loginUser", {
      email,
      password,
    });
    if (res.status == 200) {
      return res;
    } else {
      throw new Error(`Unexpected response status: ${res.message}`);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const register = async (username, email, password) => {
  let code = 0;
  try {
    const res = await api.post("/users/createUser", {
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
