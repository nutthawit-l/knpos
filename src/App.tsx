import { useState } from 'react'
import Overview from './pages/Overview'
import Order from './pages/Order'
import Transactions from './pages/Transactions'
import Products from './pages/Products'
import AddProduct from './pages/AddProduct'
import Login from './pages/Login'
import Register from './pages/Register'
import OTPVerify from './pages/OTPVerify'
import Sidebar from './components/Sidebar'

function App() {
  const [activeTab, setActiveTab] = useState('order')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleNavigate = (tab: string) => {
    setActiveTab(tab)
    setIsSidebarOpen(false)
  }

  return (
    <>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        activeTab={activeTab}
        onNavigate={handleNavigate}
      />
      {activeTab === 'dashboard' && (
        <Overview 
          onNavigate={handleNavigate} 
          onMenuClick={() => setIsSidebarOpen(true)} 
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
        />
      )}
      {activeTab === 'add-product' && (
        <AddProduct 
          onNavigate={handleNavigate} 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />
      )}
      {activeTab === 'login' && (
        <Login 
          onNavigate={handleNavigate} 
        />
      )}
      {activeTab === 'register' && (
        <Register 
          onNavigate={handleNavigate} 
        />
      )}
      {activeTab === 'otp-verify' && (
        <OTPVerify 
          onNavigate={handleNavigate} 
        />
      )}
    </>
  )
}

export default App

