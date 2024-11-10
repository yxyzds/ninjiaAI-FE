import * as React from "react";
import * as ReactDOM from "react-dom/client";
import Root, {
  loader as rootLoader,
  action as rootAction,
} from "./routes/root";
import ErrorPage from "./error-page";
import ChatPage from "./routes/chatPage";
import EditContact, { action as editAction } from "./routes/edit";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Index from "./routes/index";
import AuthPage from "./routes/auth";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    loader: rootLoader,
    action: rootAction,

    children: [
      { index: true, element: <Index /> },

      {
        path: "ChatPage/:windowID",
        element: <ChatPage />,
      },
      // {
      //   path: "contacts/:contactId/edit",
      //   element: <EditContact />,
      //   loader: contactLoader,
      //   action: editAction,
      // },
      // {
      //   path: "contacts/:contactId/destroy",
      //   action: destroyAction,
      //   errorElement: <div>Oops! There was an error.</div>,
      // },
    ],
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
