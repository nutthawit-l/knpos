import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useOrderStore } from './store/useOrderStore';
import Dashboard from './pages/Dashboard';
import CreateShop from './pages/CreateShop';
import CreateEvent from './pages/CreateEvent';
import Order from './pages/Order';
import Transactions from './pages/Transactions';
import Inventory from './pages/Inventory';
import AddProduct from './pages/AddProduct';
import Login from './pages/Login';
import Register from './pages/Register';
import OTPVerify from './pages/OTPVerify';
import Setting from './pages/Setting';
import Sidebar from './components/Sidebar';
import { type Product } from './components/SwipeableProductRow';

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { hasEvent } = useOrderStore();
  const hasNoShop = !user?.shopId;

  const [activeTab, setActiveTab] = useState(() => {
    return (location.state as any)?.activeTab || 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (location.state && (location.state as any).activeTab) {
      setActiveTab((location.state as any).activeTab);
      // Clean up location state so that fresh page reload doesn't trigger the old tab
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleNavigate = (tab: string) => {
    if (tab === 'logout') {
      const confirmLogout = window.confirm('Are you sure you want to logout?');
      if (confirmLogout) {
        logout();
      }
      return;
    }
    if (tab === 'create-shop') {
      navigate('/create-shop');
      return;
    }
    if (tab === 'add-product') {
      navigate('/new-product');
      return;
    }
    if (hasNoShop) {
      return;
    }
    if (!hasEvent && tab !== 'dashboard' && tab !== 'add-product' && tab !== 'create-event') {
      return;
    }
    if (tab === 'settings') {
      navigate('/setting');
      return;
    }
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const handleEditProduct = (product: Product) => {
    navigate('/new-product', { state: { productToEdit: product } });
  };

  const isAllowedTab = activeTab === 'dashboard' || activeTab === 'add-product' || activeTab === 'create-event';
  const activeTabToRender = hasNoShop ? 'dashboard' : (!hasEvent && !isAllowedTab ? 'dashboard' : activeTab);

  return (
    <>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTabToRender}
        onNavigate={handleNavigate}
      />
      {activeTabToRender === 'dashboard' && (
        <Dashboard
          onNavigate={handleNavigate}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
      )}
      {activeTabToRender === 'create-event' && (
        <CreateEvent
          onNavigate={handleNavigate}
        />
      )}
      {activeTabToRender === 'order' && (
        <Order
          onNavigate={handleNavigate}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
      )}
      {activeTabToRender === 'transactions' && (
        <Transactions
          onNavigate={handleNavigate}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
      )}
      {activeTabToRender === 'products' && (
        <Inventory
          onNavigate={handleNavigate}
          onEditProduct={handleEditProduct}
        />
      )}
    </>
  );
}

function App() {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
  const navigate = useNavigate();
  const hasNoShop = isAuthenticated && !user?.shopId;

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#fff8f8] font-quicksand text-text-brown">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-[16px]">Loading Charni POS...</p>
        </div>
      </div>
    );
  }

  const handleSettingNavigate = (tab: string) => {
    if (tab === 'login') {
      navigate('/login');
    } else if (tab === 'settings') {
      navigate('/setting');
    } else {
      navigate('/dashboard', { state: { activeTab: tab } });
    }
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />
      <Route
        path="/verify-otp"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <OTPVerify />}
      />
      <Route
        path="/create-shop"
        element={
          isAuthenticated ? (
            user?.shopId ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <CreateShop />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/new-product"
        element={
          isAuthenticated ? (
            hasNoShop ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AddProduct />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/setting"
        element={
          isAuthenticated ? (
            hasNoShop ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Setting onNavigate={handleSettingNavigate} />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}

export default App;
