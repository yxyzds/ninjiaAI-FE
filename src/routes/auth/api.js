// src/api.js
import axios from "axios";

// 创建一个 axios 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // 配置基础 URL
  timeout: 8000, // 可选: 配置请求超时时间
  headers: {
    "Content-Type": "application/json",
  },
});

export const login = async (email, password) => {
  try {
    const { data } = await api.post("/users/loginUser", {
      email,
      password,
    });
    return data;
  } catch (error) {
    throw new Error("用户登录服务错误");
  }
};

export const register = async (username, email, password) => {
  try {
    const res = await api.post("/users/createUser", {
      username,
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

export const sendVerificationCode = async (email) => {
  try {
    const res = await api.get(`/users/getVerificationCode?email=${email}`);
    if (res.status == 200) {
      return res;
    } else {
      throw new Error(`Unexpected response status: ${res.message}`);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const verifyVerificationCode = async (email, code) => {
  try {
    const { data } = await api.get(
      `/users/verificationCodeVerify?email=${email}&code=${code}`
    );
    return data;
  } catch (error) {
    throw new Error("邮箱验证码校验客户端请求错误");
  }
};

export const verifyInvitationCode = async (email, code) => {
  try {
    const { data } = await api.get(
      `/invite/validateInviteCode?email=${email}&code=${code}`
    );
    return data;
  } catch (error) {
    throw new Error("邀请码校验客户端请求错误");
  }
};
