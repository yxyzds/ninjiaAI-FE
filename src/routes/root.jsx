import React, { useState, useEffect } from "react";

import { Outlet } from "react-router-dom";
import SideBar from "./sideBar/SideBar";
import Navbar from "./navBar/navBar";

import "./root.css";

export default function Root() {
  const [visible, setVisible] = useState(false);

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
