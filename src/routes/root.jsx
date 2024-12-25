import React, { useState, useRef } from "react";

import { Outlet } from "react-router-dom";
import SideBar from "./sideBar/SideBar";
import Navbar from "./navBar/navBar";

import "./root.css";

export default function Root() {
  const [visible, setVisible] = useState(false);
  const navRef = useRef(null);
  return (
    <>
      <Navbar visible={visible} setVisible={setVisible} navRef={navRef} />
      <SideBar visible={visible} setVisible={setVisible} navRef={navRef} />
      <div className="content-without-sidebar ">
        <div className="nav-gutter"></div>
        <div className="content-container">
          <Outlet />
        </div>
      </div>
    </>
  );
}
