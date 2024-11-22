import React, { useState, useEffect } from "react";
import { getInvitationCode } from "../api";
import { useUser } from "../../context/userContext";
import { message } from "antd";

export default function Account() {
  const [invitationCode, setInvitationCode] = useState("");
  const { user } = useUser();

  useEffect(() => {
    const fetchInvitationCode = async () => {
      try {
        const { data } = await getInvitationCode(user.email);
        if (data.success) {
          setInvitationCode(data.code);
        }
      } catch (err) {
        message.error(err.message);
      }
    };

    fetchInvitationCode(); // 调用异步函数
  }, [user.email]);

  return (
    <>
      <h2>您的邀请码是:{invitationCode}</h2>
    </>
  );
}
