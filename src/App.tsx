import { useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuthStore } from "./store/useAuthStore";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
import GetStarted from "./pages/GetStarted";
import CreateShop from "./pages/CreateShop";
import AddFirstProduct from "./pages/AddFirstProduct";
import AddProduct  from "./pages/AddProduct";
import MainLayout from "./components/MainLayout";

import Dashboard from "./pages/Dashboard";
import Order from "./pages/Order";
import Transactions from "./pages/Transactions";
import Inventory from "./pages/Inventory";
import Setting from "./pages/Setting";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import ManageMembers from "./pages/ManageMembers";
import InvitePartners from "./pages/InvitePartners";

function RootRedirect() {
  const user = useAuthStore((state) => state.user);

  return user?.isOnboardingComplete
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/get-started" replace />
}

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/", element: <RootRedirect /> },
      {
        element: <MainLayout />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/order", element: <Order /> },
          { path: "/transactions", element: <Transactions /> },
          { path: "/products", element: <Inventory /> },
          { path: "/settings", element: <Setting /> },
          { path: "/members", element: <ManageMembers /> },
          { path: "/invite-partners", element: <InvitePartners /> },
          { path: "/add-product", element: <AddProduct /> },
          { path: "/create-event", element: <CreateEvent /> },
          { path: "/edit-event", element: <EditEvent /> },
        ]
      },
      {
        path: "/get-started",
        element: <GetStarted />
      },
      {
        path: "/create-shop",
        element: <CreateShop />
      },
      {
        path: "/add-first-product",
        element: <AddFirstProduct />
      },
    ]
  },
  {
    path: "*", element: <div style={{ padding: '2rem' }}>404 Not Found</div>
  }
]);

function App() {
  const verifyUser = useAuthStore((state) => state.verifyUser);

  useEffect(() => {
    verifyUser();
  }, [verifyUser]);

  return <RouterProvider router={router} />;
};

export default App;
