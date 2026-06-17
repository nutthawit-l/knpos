import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import CreateShop from './pages/CreateShop';
import Order from './pages/Order';
import Transactions from './pages/Transactions';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import Login from './pages/Login';
import Register from './pages/Register';
import OTPVerify from './pages/OTPVerify';
import Sidebar from './components/Sidebar';
import { type Product } from './components/SwipeableProductRow';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    if (tab !== 'add-product') {
      setEditingProduct(undefined);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setActiveTab('add-product');
  };

  return (
    <>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onNavigate={handleNavigate}
      />
      {activeTab === 'dashboard' && (
        <Dashboard
          onNavigate={handleNavigate}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
      )}
      {activeTab === 'create-shop' && (
        <CreateShop
          onNavigate={handleNavigate}
        />
      )}
      {activeTab === 'order' && (
        <Order
          onNavigate={handleNavigate}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
      )}
      {activeTab === 'transactions' && (
        <Transactions
          onNavigate={handleNavigate}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
      )}
      {activeTab === 'products' && (
        <Products
          onNavigate={handleNavigate}
          onMenuClick={() => setIsSidebarOpen(true)}
          onEditProduct={handleEditProduct}
        />
      )}
      {activeTab === 'add-product' && (
        <AddProduct
          onNavigate={handleNavigate}
          onMenuClick={() => setIsSidebarOpen(true)}
          productToEdit={editingProduct}
        />
      )}
      {activeTab === 'login' && <Login onNavigate={handleNavigate} />}
      {activeTab === 'register' && <Register onNavigate={handleNavigate} />}
      {activeTab === 'otp-verify' && <OTPVerify onNavigate={handleNavigate} />}
    </>
  );
}

export default App;
