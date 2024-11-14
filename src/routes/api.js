// src/api.js
import axios from "axios";

const token = localStorage.getItem("token");
// 创建一个 axios 实例
const apiJson = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // 配置基础 URL
  timeout: 1000, // 可选: 配置请求超时时间
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});

const apiParams = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // 配置基础 URL
  timeout: 1000, // 可选: 配置请求超时时间
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

//重写，进行错误处理和数据重构
export const getMessageHistory = async (email, windowID) => {
  let res = {};
  try {
    res = await apiJson.post(
      "/conversation/getConversation",
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
    res = await apiParams.get(
      `/users/getUserInfo?email=${email}`
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

export const createChatWindow = async (email) => {
  try {
    const res = await apiJson.post(
      `/conversation/createChatWindow`,
      {
        email,
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

export const editChatWindow = async (windowID, title) => {
  try {
    const res = await apiJson.post(
      `/conversation/editChatWindow`,
      {
        windowID,
        title,
      }
    );
    if (res.status == 200) {
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

export const deleteChatWindow = async (windowID) => {
  try {
    const res = await apiParams.delete(
      `/conversation/deleteChatWindow?windowID=${windowID}`
    );
    if (res.status == 200) {
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
