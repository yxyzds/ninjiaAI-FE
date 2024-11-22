// src/contexts/UserContext.js
import React, { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const UserContext = createContext({});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    // 尝试从 localStorage 中获取用户信息
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : {};
  });

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser({});
    navigate("/");
  };

  return (
    <UserContext.Provider value={{ user, logout, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
