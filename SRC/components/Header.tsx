
import * as React from 'react'
import { useAuth } from '../hooks/useAuth'
import {Bell, User, LogOut, Menu} from 'lucide-react'
import toast from 'react-hot-toast'

interface HeaderProps {
  onToggleSidebar?: () => void
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, isAuthenticated, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logout realizado com sucesso!')
    } catch {
      toast.error('Erro ao fazer logout')
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Sistema de Delivery
          </h2>
          <p className="text-sm text-gray-500">
            Gerencie seus pedidos e entregas
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User menu */}
        {isAuthenticated && user ? (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-800">
                  {user.userName || user.email}
                </p>
                <p className="text-xs text-gray-500">
                  {user.userRole === 'ADMIN' ? 'Administrador' : 'Usuário'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            Não autenticado
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
