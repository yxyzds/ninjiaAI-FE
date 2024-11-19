import React from "react";
import { Menu, Layout, Button } from "antd";
import { useNavigate } from "react-router-dom";
import "./style.css";
import { MenuOutlined } from "@ant-design/icons";

const Navbar = ({ visible, setVisible }) => {
  const navigate = useNavigate();
  const onChangeMenuVisible = () => {
    setVisible(!visible);
  };

  return (
    <div className="navbar-header">
      <div className="navbar-container">
        {/* 左侧 Logo */}
        <div className="navbar-logo" onClick={() => navigate("/")}>
          Ninjia AI{" "}
        </div>
        <span className="navbar-menu-button" onClick={onChangeMenuVisible}>
          <MenuOutlined />
        </span>
        <div>
          {/* <span className="navbar-contact">
            <MailOutlined width={32} height={32} />
            联系
          </span> */}
        </div>
        {/* 右侧菜单 */}
        {/* <Menu theme="dark" mode="horizontal">
          <Menu.Item key="contact" icon={<MailOutlined />}>
            <a>联系</a>
          </Menu.Item>
        </Menu> */}
      </div>
    </div>
  );
};

export default Navbar;
