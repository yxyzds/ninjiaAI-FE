import React, { useEffect } from "react";
import { Form } from "antd";

const NinjiaForm = (props) => {
  useEffect(() => {
    const handleFocus = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        resetViewport();
      }
    };
    //点击输入框，调整窗口缩放
    const resetViewport = () => {
      let viewport = document.querySelector("meta[name=viewport]");
      if (!viewport) {
        viewport = document.createElement("meta");
        viewport.setAttribute("name", "viewport");
        document.head.appendChild(viewport);
      }
      viewport.setAttribute("content", "width=device-width, initial-scale=1");
    };

    document.addEventListener("focusin", handleFocus);

    return () => {
      document.removeEventListener("focusin", handleFocus);
    };
  }, []);

  return <Form {...props}>{props.children}</Form>;
};

// 明确导出 Form.Item
NinjiaForm.Item = Form.Item;

export default NinjiaForm;
