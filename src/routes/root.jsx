import React, { useState, useEffect } from "react";

import { Outlet } from "react-router-dom";
import SideBar from "./sideBar/SideBar";
import Navbar from "./navBar/navBar";

import "./root.css";

export default function Root() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // 禁止双指缩放
    const handleTouchStart = (event) => {
      if (event.touches.length > 1) {
        event.preventDefault(); // 禁止双指缩放
      }
    };

    // 禁止双击缩放
    let lastTouchEnd = 0;
    const handleTouchEnd = (event) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault(); // 禁止双击缩放
      }
      lastTouchEnd = now;
    };

    // 添加事件监听器
    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });

    // 在组件卸载时移除事件监听器
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <>
      <Navbar visible={visible} setVisible={setVisible} />
      <SideBar visible={visible} setVisible={setVisible} />
      <div className="content-without-sidebar ">
        <div className="nav-gutter"></div>
        <div className="content-container">
          <Outlet />
        </div>
      </div>
    </>
  );
}
