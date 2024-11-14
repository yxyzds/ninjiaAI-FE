import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Input } from "antd";
import { deleteChatWindow, editChatWindow } from "../api";

export default function ConversationItem({
  conversation,
  handleDeleteConversation,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const handleBlur = async () => {
    updateWindowTitle(conversation.windowID, title);
    setIsEditing(false);
  };

  const updateWindowTitle = async (windowID, title) => {
    try {
      await editChatWindow(windowID, title);
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleDeleteWindow = async (windowID) => {
    try {
      await deleteChatWindow(windowID);
      handleDeleteConversation(windowID);
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <li key={conversation.windowID}>
      {isEditing ? (
        <Input
          type="text"
          value={title}
          onBlur={handleBlur}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      ) : (
        <>
          <NavLink
            to={`chatPage/${conversation.windowID}`}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {title}
          </NavLink>
        </>
      )}
      <button onClick={() => setIsEditing(true)}>Edit</button>
      <button onClick={() => handleDeleteWindow(conversation.windowID)}>
        Delete
      </button>
    </li>
  );
}
