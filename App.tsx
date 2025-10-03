
import * as React from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth, AuthProvider } from './SRC/hooks/useAuth.tsx'
import Layout from './SRC/components/Layout'
import LoginPage from './SRC/components/LoginPage'
import Dashboard from './SRC/pages/Dashboard'
import Produtos from './SRC/pages/Produtos'
import Pedidos from './SRC/pages/Pedidos'
import Clientes from './SRC/pages/Clientes'
import Entregadores from './SRC/pages/Entregadores'
import Entregas from './SRC/pages/Entregas'
import Relatorios from './SRC/pages/Relatorios'
import Configuracoes from './SRC/pages/Configuracoes'

function AppContent() {
  const { isAuthenticated, loading } = useAuth()

  console.log('AppContent - isAuthenticated:', isAuthenticated, 'loading:', loading)

  if (loading) {
    console.log('Showing loading screen')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('User not authenticated, showing login page')
    return (
      <>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: { background: '#363636', color: '#fff' },
            success: { style: { background: '#10b981' } },
            error: { style: { background: '#ef4444' } }
          }}
        />
        <LoginPage />
      </>
    )
  }

  console.log('User authenticated, showing main app')
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: { background: '#363636', color: '#fff' },
          success: { style: { background: '#10b981' } },
          error: { style: { background: '#ef4444' } }
        }}
      />
      
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="entregadores" element={<Entregadores />} />
            <Route path="entregas" element={<Entregas />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
