// src/api.js
import axios from "axios";

const token = localStorage.getItem("token");

// 创建一个 axios 实例
const apiPost = axios.create({
  baseURL: "http://localhost:3000", // 配置基础 URL
  timeout: 1000, // 可选: 配置请求超时时间
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});

const apiGet = axios.create({
  baseURL: "http://localhost:3000", // 配置基础 URL
  timeout: 1000, // 可选: 配置请求超时时间
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

//重写，进行错误处理和数据重构
export const getMessageHistory = async (email, windowID) => {
  let res = {};
  try {
    res = await apiPost.post(
      "http://localhost:3000/conversation/getConversation",
      {
        email,
        windowID,
      }
    );
    if (res.status == 200) {
      return res;
    } else {
      throw new Error(`获取消息历史失败: ${res.message}`);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return error;
  }
};

export const getUserInfo = async (email) => {
  let res = {};
  try {
    res = await apiGet.get(
      `http://localhost:3000/users/getUserInfo?email=${email}`
    );
    if (res.status == 200) {
      return res;
    } else {
      throw new Error(
        `无法获取用户信息，请稍后重试: ${res.status},${res.statusText}`
      );
    }
  } catch (error) {
    throw new Error(error.response.data.message || "网络请求错误");
  }
};

export const createChatWindow = async (email, index) => {
  try {
    const res = await apiPost.post(
      `http://127.0.0.1:3000/conversation/createChatWindow`,
      {
        email,
        index,
      }
    );
    if (res.status == 201) {
      return res;
    } else {
      throw new Error(
        `创建聊天窗口失败，请刷新重试: ${res.status},${res.statusText}`
      );
    }
  } catch (error) {
    throw new Error(error.response.data.message || "网络请求错误");
  }
};
