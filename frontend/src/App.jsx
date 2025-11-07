import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import EmployeeOverview from './components/EmployeeOverview'

function App() {
  const [activePage, setActivePage] = useState('dashboard')

  const handleNavigate = (page) => {
    setActivePage(page)
  }

  const renderContent = () => {
    switch (activePage) {
      case 'employees':
        return <EmployeeOverview />
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Settings
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <p className="text-gray-600">Settings page coming soon...</p>
            </div>
          </div>
        )
      case 'dashboard':
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />

      <main className="flex-1 overflow-y-auto bg-white">
        <Header />
        {renderContent()}
      </main>
    </div>
  )
}

export default App