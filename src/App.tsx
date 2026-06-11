import { useState } from 'react'
import Overview from './pages/Overview'
import Products from './pages/Products'

function App() {
  const [activeTab, setActiveTab] = useState('products')

  return (
    <>
      {activeTab === 'dashboard' && <Overview onNavigate={setActiveTab} />}
      {activeTab === 'products' && <Products onNavigate={setActiveTab} />}
    </>
  )
}

export default App

