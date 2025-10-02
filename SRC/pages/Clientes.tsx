
import React, { useState, useEffect } from 'react'
import { Search, Plus, Eye, Edit, Trash2, Phone, Mail, MapPin, Calendar, DollarSign, Package } from 'lucide-react'
import { api } from '../lib/api'
import { useClientes } from '../hooks/useClientes'
import { ClienteModal } from '../components/modals/ClienteModal'

const Clientes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { clientes, loading, error, createCliente } = useClientes()

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ativo':
        return { label: 'Ativo', color: 'bg-green-100 text-green-800', icon: '✅' }
      case 'vip':
        return { label: 'VIP', color: 'bg-purple-100 text-purple-800', icon: '👑' }
      case 'inativo':
        return { label: 'Inativo', color: 'bg-red-100 text-red-800', icon: '⏸️' }
      default:
        return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800', icon: '❓' }
    }
  }

  const filteredClientes = clientes?.filter(cliente =>
    (cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cliente?.telefone?.includes(searchTerm))
  ) || []

  const handleCreateCliente = async (clienteData: any) => {
    try {
      await createCliente(clienteData)
      setIsModalOpen(false)
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-2">Gerencie sua base de clientes</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="mt-4 sm:mt-0 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{clientes?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
              <p className="text-2xl font-bold text-gray-900">
                {clientes?.filter(c => c?.ativo).length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">
                {clientes?.reduce((acc, c) => acc + (c?.totalPedidos || 0), 0) || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {(clientes?.reduce((acc, c) => acc + (c?.valorTotalGasto || 0), 0) || 0).toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClientes.map((cliente) => {
          const enderecosPrincipal = cliente.enderecos?.find(e => e.principal) || cliente.enderecos?.[0]
          const ticketMedio = cliente.totalPedidos > 0 ? cliente.valorTotalGasto / cliente.totalPedidos : 0
          
          return (
            <div key={cliente._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xl">
                      {cliente?.nome?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{cliente?.nome || 'Nome não informado'}</h3>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        cliente?.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {cliente?.ativo ? '✓ Ativo' : '✗ Inativo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {cliente?.telefone || 'Telefone não informado'}
                  </div>
                  {enderecosPrincipal && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="line-clamp-1">
                        {enderecosPrincipal.rua}, {enderecosPrincipal.numero} - {enderecosPrincipal.bairro}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Cliente desde {cliente?.createdAt ? new Date(cliente.createdAt).toLocaleDateString('pt-BR') : 'Data não informada'}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{cliente?.totalPedidos || 0}</p>
                    <p className="text-sm text-gray-500">Pedidos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">R$ {(cliente?.valorTotalGasto || 0).toFixed(0)}</p>
                    <p className="text-sm text-gray-500">Total Gasto</p>
                  </div>
                </div>

                {/* Last Order */}
                {cliente.ultimoPedido && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700">Último pedido:</p>
                    <p className="text-sm text-gray-600">
                      {new Date(cliente.ultimoPedido).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-gray-500">
                    Ticket médio: R$ {ticketMedio.toFixed(2)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredClientes.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cliente encontrado</h3>
          <p className="text-gray-500">Tente ajustar o termo de busca</p>
        </div>
      )}

      {/* Modal */}
      <ClienteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCliente}
        loading={loading}
      />
    </div>
  )
}


export default Clientes
