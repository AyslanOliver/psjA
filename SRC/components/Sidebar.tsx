
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {LayoutDashboard, Package, ShoppingCart, Users, Truck, BarChart3, Settings, ChefHat, UserCheck, X} from 'lucide-react'

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation()
  const isMobile = window.innerWidth < 768

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/produtos', icon: Package, label: 'Produtos' },
    { path: '/pedidos', icon: ShoppingCart, label: 'Pedidos' },
    { path: '/clientes', icon: UserCheck, label: 'Clientes' },
    { path: '/entregadores', icon: Users, label: 'Entregadores' },
    { path: '/entregas', icon: Truck, label: 'Entregas' },
    { path: '/relatorios', icon: BarChart3, label: 'Relatórios' },
    { path: '/configuracoes', icon: Settings, label: 'Configurações' }
  ]

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen flex flex-col shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChefHat className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="text-xl font-bold">Pastelaria</h1>
              <p className="text-sm text-gray-400">Sistema de Delivery</p>
            </div>
          </div>
          {isMobile && onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path, item.exact)
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-center text-sm text-gray-400">
          <p>© 2025 Pastelaria Delivery</p>
          <p>Versão 1.0.0</p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
