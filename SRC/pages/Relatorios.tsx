import React, { useState, useMemo } from 'react'
import { usePedidos } from '../hooks/usePedidos'
import { useProdutos } from '../hooks/useProdutos'
import { useEntregadores } from '../hooks/useEntregadores'
import { 
  BarChart3, 
  TrendingUp,   
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  Calendar,
  Download,
  Filter,
  Clock,
  Star,
  Target
} from 'lucide-react'

const Relatorios: React.FC = () => {
  const { pedidos } = usePedidos()
  const { produtos } = useProdutos()
  const { entregadores } = useEntregadores()
  
  const [periodoSelecionado, setPeriodoSelecionado] = useState('hoje')
  const [tipoRelatorio, setTipoRelatorio] = useState('vendas')

  // Funções auxiliares para filtrar dados por período
  const filtrarPorPeriodo = (data: string) => {
    const hoje = new Date()
    const dataItem = new Date(data)
    
    switch (periodoSelecionado) {
      case 'hoje':
        return dataItem.toDateString() === hoje.toDateString()
      case 'semana':
        const inicioSemana = new Date(hoje)
        inicioSemana.setDate(hoje.getDate() - 7)
        return dataItem >= inicioSemana
      case 'mes':
        return dataItem.getMonth() === hoje.getMonth() && dataItem.getFullYear() === hoje.getFullYear()
      case 'ano':
        return dataItem.getFullYear() === hoje.getFullYear()
      default:
        return true
    }
  }

  // Métricas calculadas
  const metricas = useMemo(() => {
    const pedidosFiltrados = pedidos.filter(p => filtrarPorPeriodo(p.createdAt))
    const pedidosEntregues = pedidosFiltrados.filter(p => p.status === 'entregue')
    
    const faturamentoTotal = pedidosEntregues.reduce((acc, p) => acc + p.total, 0)
    const ticketMedio = pedidosEntregues.length > 0 ? faturamentoTotal / pedidosEntregues.length : 0
    const totalPedidos = pedidosFiltrados.length
    const taxaConversao = totalPedidos > 0 ? (pedidosEntregues.length / totalPedidos) * 100 : 0
    
    // Produtos mais vendidos
    const produtosMaisVendidos = pedidosEntregues
      .flatMap(p => p.itens)
      .reduce((acc: any, item) => {
        const key = item.nome
        acc[key] = (acc[key] || 0) + item.quantidade
        return acc
      }, {})
    
    const topProdutos = Object.entries(produtosMaisVendidos)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([nome, quantidade]) => ({ nome, quantidade }))

    // Horários de pico
    const pedidosPorHora = pedidosFiltrados.reduce((acc: any, pedido) => {
      const hora = new Date(pedido.createdAt).getHours()
      acc[hora] = (acc[hora] || 0) + 1
      return acc
    }, {})

    const horarioPico = Object.entries(pedidosPorHora)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]

    // Tempo médio de entrega
    const temposEntrega = pedidosEntregues
      .filter(p => p.horarioSaidaEntrega && p.horarioEntrega)
      .map(p => {
        const saida = new Date(p.horarioSaidaEntrega!)
        const entrega = new Date(p.horarioEntrega!)
        return (entrega.getTime() - saida.getTime()) / (1000 * 60) // em minutos
      })
    
    const tempoMedioEntrega = temposEntrega.length > 0 
      ? temposEntrega.reduce((acc, tempo) => acc + tempo, 0) / temposEntrega.length 
      : 0

    // Performance dos entregadores
    const performanceEntregadores = entregadores.map(entregador => {
      const entregasEntregador = pedidosEntregues.filter(p => p.entregadorNome === entregador.nome)
      return {
        nome: entregador.nome,
        entregas: entregasEntregador.length,
        avaliacao: entregador.avaliacaoMedia,
        disponivel: entregador.disponivel
      }
    }).sort((a, b) => b.entregas - a.entregas)

    return {
      faturamentoTotal,
      ticketMedio,
      totalPedidos,
      pedidosEntregues: pedidosEntregues.length,
      taxaConversao,
      topProdutos,
      horarioPico: horarioPico ? `${horarioPico[0]}:00` : 'N/A',
      tempoMedioEntrega,
      performanceEntregadores
    }
  }, [pedidos, entregadores, periodoSelecionado])

  const periodos = [
    { value: 'hoje', label: 'Hoje' },
    { value: 'semana', label: 'Última Semana' },
    { value: 'mes', label: 'Este Mês' },
    { value: 'ano', label: 'Este Ano' }
  ]

  const tiposRelatorio = [
    { value: 'vendas', label: 'Vendas' },
    { value: 'produtos', label: 'Produtos' },
    { value: 'entregadores', label: 'Entregadores' },
    { value: 'operacional', label: 'Operacional' }
  ]

  const exportarRelatorio = () => {
    const dados = {
      periodo: periodoSelecionado,
      tipo: tipoRelatorio,
      metricas,
      geradoEm: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${tipoRelatorio}-${periodoSelecionado}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-2">
            Análises e métricas do seu negócio
          </p>
        </div>
        <button
          onClick={exportarRelatorio}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Exportar</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={periodoSelecionado}
              onChange={(e) => setPeriodoSelecionado(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {periodos.map(periodo => (
                <option key={periodo.value} value={periodo.value}>
                  {periodo.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={tipoRelatorio}
              onChange={(e) => setTipoRelatorio(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {tiposRelatorio.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Faturamento</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                R$ {metricas.faturamentoTotal.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pedidos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metricas.totalPedidos}
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                R$ {metricas.ticketMedio.toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metricas.taxaConversao.toFixed(1)}%
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo baseado no tipo de relatório */}
      {tipoRelatorio === 'vendas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Produtos Mais Vendidos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Produtos Mais Vendidos</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {metricas.topProdutos.map((produto, index) => (
                  <div key={produto.nome} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <span className="font-medium text-gray-900">{produto.nome}</span>
                    </div>
                    <span className="text-lg font-bold text-gray-600">
                      {`${produto.quantidade} unidades`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Métricas de Tempo */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Métricas Operacionais</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Horário de Pico</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {metricas.horarioPico}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Tempo Médio de Entrega</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {metricas.tempoMedioEntrega.toFixed(0)} min
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Pedidos Entregues</span>
                </div>
                <span className="text-lg font-bold text-purple-600">
                  {metricas.pedidosEntregues}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tipoRelatorio === 'produtos' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Análise de Produtos</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{produtos.length}</p>
                <p className="text-sm text-gray-600">Total de Produtos</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">
                  {produtos.filter(p => p.disponivel).length}
                </p>
                <p className="text-sm text-gray-600">Produtos Disponíveis</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(produtos.map(p => p.categoria)).size}
                </p>
                <p className="text-sm text-gray-600">Categorias</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Produtos Mais Vendidos</h3>
              {metricas.topProdutos.map((produto, index) => (
                <div key={produto.nome} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{produto.nome}</p>
                      <p className="text-sm text-gray-600">{`${produto.quantidade} unidades vendidas`}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tipoRelatorio === 'entregadores' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Performance dos Entregadores</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {metricas.performanceEntregadores.map((entregador) => (
                <div key={entregador.nome} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{entregador.nome}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{entregador.entregas} entregas</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>{entregador.avaliacao.toFixed(1)}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          entregador.disponivel 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {entregador.disponivel ? 'Disponível' : 'Indisponível'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tipoRelatorio === 'operacional' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Métricas de Eficiência</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Taxa de Conversão</p>
                  <p className="text-sm text-gray-600">Pedidos entregues / Total de pedidos</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {metricas.taxaConversao.toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Tempo Médio de Entrega</p>
                  <p className="text-sm text-gray-600">Da saída até a entrega</p>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {metricas.tempoMedioEntrega.toFixed(0)} min
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Horário de Pico</p>
                  <p className="text-sm text-gray-600">Maior volume de pedidos</p>
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  {metricas.horarioPico}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Status Geral</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">Entregadores Ativos</span>
                <span className="text-lg font-bold text-gray-600">
                  {entregadores.filter(e => e.disponivel).length}/{entregadores.length}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">Produtos Disponíveis</span>
                <span className="text-lg font-bold text-gray-600">
                  {produtos.filter(p => p.disponivel).length}/{produtos.length}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">Pedidos em Andamento</span>
                <span className="text-lg font-bold text-gray-600">
                  {pedidos.filter(p => !['entregue', 'cancelado'].includes(p.status)).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Relatorios