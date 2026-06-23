import { useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuthStore } from "./store/useAuthStore";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
import GetStarted from "./pages/GetStarted";

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
      // {
      //   element: <MainLayout />,
      //   children: [{ path: "/dashboard", element: <Dashboard /> }]
      // },
      {
        path: "/get-started",
        element: <GetStarted />
      }
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
