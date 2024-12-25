import React from "react";
import { Dropdown, message } from "antd";
import { useNavigate } from "react-router-dom";
import "./style.css";
import {
  MenuOutlined,
  UserOutlined,
  MailOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useUser } from "../../context/userContext";
import { generateInvitationCode } from "../api";

const Navbar = ({ visible, setVisible, navRef }) => {
  const { logout, user } = useUser();

  const navigate = useNavigate();
  const onChangeMenuVisible = () => {
    setVisible(!visible);
  };

  const handleGenerateInvatationCode = async (email) => {
    try {
      const { data } = await generateInvitationCode(email);
      if (data.success) {
        navigate("/account");
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  const items = [
    {
      key: "generateInvatationCode",
      label: "生成邀请码",
      icon: <MailOutlined />,
      onClick: () => handleGenerateInvatationCode(user.email),
    },
    {
      key: "delete",
      label: "退出登录",
      icon: <LogoutOutlined />,
      onClick: () => logout(),
    },
  ];

  return (
    <div ref={navRef} className="navbar-header">
      <div className="navbar-container">
        {/* 左侧 Logo */}
        <div className="navbar-logo">
          <span onClick={() => navigate("/")}>Ninjia AI</span>
          <span className="navbar-menu-button" onClick={onChangeMenuVisible}>
            <MenuOutlined />
          </span>
        </div>

        <div>
          <Dropdown menu={{ items }} trigger={["click"]}>
            <UserOutlined className="navbar-user-icon" />
          </Dropdown>
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
