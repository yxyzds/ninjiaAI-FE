// src/api.js
import axios from "axios";

const token = localStorage.getItem("token");

// 创建一个 axios 实例
const apiJson = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // 配置基础 URL
  timeout: 8000, // 可选: 配置请求超时时间
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});

const apiParams = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // 配置基础 URL
  timeout: 8000, // 可选: 配置请求超时时间
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// 添加请求拦截器，在每次请求之前动态添加 token
const addAuthToken = (config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

apiJson.interceptors.request.use(addAuthToken, (error) => {
  return Promise.reject(error);
});

apiParams.interceptors.request.use(addAuthToken, (error) => {
  return Promise.reject(error);
});

//重写，进行错误处理和数据重构
export const getMessageHistory = async (email, windowID) => {
  try {
    const { data } = await apiJson.post("/conversation/getConversation", {
      email,
      windowID,
    });
    return data;
  } catch (error) {
    throw new Error("获取消息历史失败,服务端错误");
  }
};

export const getUserInfo = async (email) => {
  let res = {};
  try {
    res = await apiParams.get(`/users/getUserInfo?email=${email}`);
    if (res.status == 200) {
      return res;
    } else {
      throw new Error(
        `无法获取用户信息，请稍后重试: ${res.status},${res.statusText}`
      );
    }
  } catch (error) {
    console.log(error);
    throw new Error(error, "getUserInfo-网络请求错误");
  }
};

export const createChatWindow = async (email) => {
  try {
    const res = await apiJson.post(`/conversation/createChatWindow`, {
      email,
    });
    if (res.status == 201) {
      return res;
    } else {
      throw new Error(
        `创建聊天窗口失败，请刷新重试: ${res.status},${res.statusText}`
      );
    }
  } catch (error) {
    throw new Error("网络请求错误，创建聊天窗口失败");
  }
};

export const editChatWindow = async (windowID, title) => {
  try {
    const res = await apiJson.post(`/conversation/editChatWindow`, {
      windowID,
      title,
    });
    if (res.status == 200) {
      return res;
    } else {
      throw new Error(
        `创建聊天窗口失败，请刷新重试: ${res.status},${res.statusText}`
      );
    }
  } catch (error) {
    throw new Error("网络请求错误，编辑聊天窗口失败");
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
    throw new Error("网络请求错误，删除聊天窗口失败");
  }
};

export const generateInvitationCode = async (email) => {
  try {
    const res = await apiParams.get(
      `/invite/generateInviteCode?email=${email}`
    );
    if (res.status == 200) {
      return res;
    } else {
      throw new Error(`创建邀请码失败: ${res.status},${res.statusText}`);
    }
  } catch (error) {
    throw new Error("网络请求错误，创建邀请码失败");
  }
};

export const getInvitationCode = async (email) => {
  try {
    const res = await apiParams.get(`/invite/getInviteCode?email=${email}`);
    if (res.status == 200) {
      return res;
    } else {
      throw new Error(`创建邀请码失败: ${res.status},${res.statusText}`);
    }
  } catch (error) {
    throw new Error("网络请求错误，获取邀请码失败");
  }
};

export const getUserUploadedFiles = async (email) => {
  try {
    const res = await apiParams.get(
      `/upload/getUserUploadedFiles?email=${email}`
    );
    if (res.status == 200) {
      return res;
    } else {
      throw new Error(`获取文件列表失败: ${res.status},${res.statusText}`);
    }
  } catch (error) {
    throw new Error("网络请求错误，获取文件列表失败");
  }
};

export const deleteUserUploadedFile = async (email, fileName) => {
  try {
    const res = await apiParams.delete(
      `/upload/deleteUserUploadedFile?email=${email}&fileName=${fileName}`
    );
    return res;
  } catch (error) {
    throw new Error("网络请求错误，删除文件失败");
  }
};

export const getFileStatus = async (email, fileName) => {
  try {
    const res = await apiParams.get(
      `/upload/getFileStatus?email=${email}&fileName=${fileName}`
    );
    return res;
  } catch (error) {
    throw new Error("网络请求错误，获取文件状态失败");
  }
};
