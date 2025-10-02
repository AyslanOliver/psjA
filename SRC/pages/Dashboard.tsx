
import React from 'react'
import { usePedidos } from '../hooks/usePedidos'
import { useProdutos } from '../hooks/useProdutos'
import { useEntregadores } from '../hooks/useEntregadores'

const Dashboard: React.FC = () => {
  const { pedidos, loading: pedidosLoading } = usePedidos()
  const { produtos, loading: produtosLoading } = useProdutos()
  const { entregadores, loading: entregadoresLoading } = useEntregadores()

  // Calcular estatísticas
  const totalPedidos = pedidos.length
  const pedidosPendentes = pedidos.filter(p => p.status === 'pendente').length
  const pedidosEmAndamento = pedidos.filter(p => p.status === 'em_andamento' || p.status === 'preparando').length
  const pedidosEntregues = pedidos.filter(p => p.status === 'entregue').length
  
  const totalProdutos = produtos.length
  const produtosAtivos = produtos.filter(p => p.disponivel !== false).length
  
  const totalEntregadores = entregadores.length
  const entregadoresDisponiveis = entregadores.filter(e => (e as any).disponivel === true || (e as any).status === 'disponivel').length

  // Pedidos recentes (últimos 5)
  const pedidosRecentes = pedidos
    .slice()
    .sort((a: any, b: any) => new Date(b.createdAt || b.dataHora || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.dataHora || a.updatedAt || 0).getTime())
    .slice(0, 5)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      case 'confirmado': return 'bg-orange-100 text-orange-800'
      case 'em_andamento': return 'bg-blue-100 text-blue-800'
      case 'preparando': return 'bg-amber-100 text-amber-800'
      case 'pronto': return 'bg-purple-100 text-purple-800'
      case 'saiu_entrega': return 'bg-indigo-100 text-indigo-800'
      case 'entregue': return 'bg-green-100 text-green-800'
      case 'cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente'
      case 'confirmado': return 'Confirmado'
      case 'em_andamento': return 'Em Andamento'
      case 'preparando': return 'Preparando'
      case 'pronto': return 'Pronto'
      case 'saiu_entrega': return 'Saiu para Entrega'
      case 'entregue': return 'Entregue'
      case 'cancelado': return 'Cancelado'
      default: return status
    }
  }

  if (pedidosLoading || produtosLoading || entregadoresLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Visão geral do seu negócio</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Pedidos */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{totalPedidos}</p>
            </div>
          </div>
        </div>

        {/* Pedidos Pendentes */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pedidos Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{pedidosPendentes}</p>
            </div>
          </div>
        </div>

        {/* Produtos Ativos */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Produtos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{produtosAtivos}</p>
            </div>
          </div>
        </div>

        {/* Entregadores Disponíveis */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Entregadores Disponíveis</p>
              <p className="text-2xl font-bold text-gray-900">{entregadoresDisponiveis}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos Recentes */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pedidos Recentes</h2>
          </div>
          <div className="p-6">
            {pedidosRecentes.length > 0 ? (
              <div className="space-y-4">
                {pedidosRecentes.map((pedido: any) => (
                  <div key={pedido._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                    <p className="font-medium text-gray-900">Pedido #{pedido.numeroPedido || (pedido._id ? `PED-${String(pedido._id).slice(-6)}` : '')}</p>
                    <p className="text-sm text-gray-600">{pedido.cliente?.nome || pedido.clienteNome || 'Cliente não informado'}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(pedido.createdAt || pedido.dataHora || Date.now()).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pedido.status)}`}>
                      {getStatusText(pedido.status)}
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      R$ {Number((pedido.total ?? pedido.valorTotal) || 0).toFixed(2)}
                    </p>
                  </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhum pedido encontrado</p>
            )}
          </div>
        </div>

        {/* Estatísticas Detalhadas */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Estatísticas Detalhadas</h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Status dos Pedidos */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Status dos Pedidos</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pendentes</span>
                  <span className="text-sm font-medium">{pedidosPendentes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Em Andamento</span>
                  <span className="text-sm font-medium">{pedidosEmAndamento}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Entregues</span>
                  <span className="text-sm font-medium">{pedidosEntregues}</span>
                </div>
              </div>
            </div>

            {/* Produtos */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Produtos</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total de Produtos</span>
                  <span className="text-sm font-medium">{totalProdutos}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Produtos Ativos</span>
                  <span className="text-sm font-medium">{produtosAtivos}</span>
                </div>
              </div>
            </div>

            {/* Entregadores */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Entregadores</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total de Entregadores</span>
                  <span className="text-sm font-medium">{totalEntregadores}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Disponíveis</span>
                  <span className="text-sm font-medium">{entregadoresDisponiveis}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-blue-700 font-medium">Novo Pedido</span>
          </button>
          
          <button className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-green-700 font-medium">Adicionar Produto</span>
          </button>
          
          <button className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-purple-700 font-medium">Cadastrar Entregador</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
