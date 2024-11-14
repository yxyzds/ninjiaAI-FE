import * as React from "react";
import * as ReactDOM from "react-dom/client";
import Root from "./routes/root";
import ErrorPage from "./error-page";
import ChatPage from "./routes/chatPage";
import { UserProvider } from "./context/userContext";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Index from "./routes/index";
import AuthPage from "./routes/auth";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <UserProvider>
        <Root />
      </UserProvider>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Index /> },
      {
        path: "ChatPage/:windowID",
        element: <ChatPage />,
      },
    ],
  },
  {
    path: "/auth",
    element: (
      <UserProvider>
        <AuthPage />
      </UserProvider>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
