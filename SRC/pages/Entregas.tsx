import React, { useState } from 'react'
import { usePedidos } from '../hooks/usePedidos'
import { useEntregadores } from '../hooks/useEntregadores'

const Entregas: React.FC = () => {
  const { pedidos, updateStatusPedido } = usePedidos()
  const { entregadores } = useEntregadores()
  const [filtroStatus, setFiltroStatus] = useState('')
  const [busca, setBusca] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedPedido, setSelectedPedido] = useState<string | null>(null)

  // Filtrar pedidos que são entregas (status: pronto, saiu_entrega, entregue)
  const entregasDisponiveis = pedidos.filter(pedido => 
    ['pronto', 'saiu_entrega', 'entregue'].includes(pedido.status)
  )

  const entregasFiltradas = entregasDisponiveis.filter(pedido => {
    const matchStatus = !filtroStatus || pedido.status === filtroStatus
    const matchBusca = !busca || 
      pedido.numeroPedido.toLowerCase().includes(busca.toLowerCase()) ||
      (pedido.cliente?.nome || pedido.clienteNome || '').toLowerCase().includes(busca.toLowerCase()) ||
      (pedido.entregadorNome && pedido.entregadorNome.toLowerCase().includes(busca.toLowerCase()))
    return matchStatus && matchBusca
  })

  const getStatusColor = (status: string) => {
    const colors = {
      'pronto': 'bg-green-100 text-green-800',
      'saiu_entrega': 'bg-blue-100 text-blue-800',
      'entregue': 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts = {
      'pronto': 'Pronto para Entrega',
      'saiu_entrega': 'Saiu para Entrega',
      'entregue': 'Entregue'
    }
    return texts[status as keyof typeof texts] || status
  }

  const handleAssignEntregador = async (pedidoId: string, entregadorNome: string) => {
    try {
      await updateStatusPedido(pedidoId, 'saiu_entrega', { entregadorNome })
      setShowAssignModal(false)
      setSelectedPedido(null)
    } catch (error) {
      console.error('Erro ao atribuir entregador:', error)
    }
  }

  const handleMarcarEntregue = async (pedidoId: string) => {
    try {
      await updateStatusPedido(pedidoId, 'entregue')
    } catch (error) {
      console.error('Erro ao marcar como entregue:', error)
    }
  }

  const calcularTempoEntrega = (horarioSaida?: string) => {
    if (!horarioSaida) return null
    const saida = new Date(horarioSaida)
    const agora = new Date()
    const diffMinutos = Math.floor((agora.getTime() - saida.getTime()) / (1000 * 60))
    return diffMinutos
  }

  const entregadoresDisponiveis = entregadores.filter(e => e.disponivel)

  const calcularEstatisticas = () => {
    const totalEntregas = entregasDisponiveis.length
    const prontasParaEntrega = entregasDisponiveis.filter(p => p.status === 'pronto').length
    const emTransito = entregasDisponiveis.filter(p => p.status === 'saiu_entrega').length
    const entregues = entregasDisponiveis.filter(p => p.status === 'entregue').length

    return {
      totalEntregas,
      prontasParaEntrega,
      emTransito,
      entregues
    }
  }

  const stats = calcularEstatisticas()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Entregas</h1>
            <p className="text-gray-600 mt-2">Gerencie as entregas em andamento</p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEntregas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Prontas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.prontasParaEntrega}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Em Trânsito</p>
              <p className="text-2xl font-bold text-gray-900">{stats.emTransito}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gray-100">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Entregues</p>
              <p className="text-2xl font-bold text-gray-900">{stats.entregues}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por número do pedido, cliente ou entregador..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Todos os Status</option>
              <option value="pronto">Pronto para Entrega</option>
              <option value="saiu_entrega">Saiu para Entrega</option>
              <option value="entregue">Entregue</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {entregasFiltradas.length} entrega(s) encontrada(s)
          </span>
          {(busca || filtroStatus) && (
            <button
              onClick={() => { setBusca(''); setFiltroStatus('') }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de Entregas */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Entregas Ativas
          </h2>
        </div>
        <div className="p-6">
          {entregasFiltradas.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {entregasFiltradas.map((pedido) => {
                const tempoEntrega = calcularTempoEntrega(pedido.horarioSaidaEntrega)
                
                const numeroExibicao = pedido.numeroPedido || (pedido._id ? `PED-${String(pedido._id).slice(-6)}` : '#')
                const nomeCliente = pedido.cliente?.nome || pedido.clienteNome || 'Cliente não informado'
                const telCliente = pedido.cliente?.telefone || pedido.clienteTelefone || 'Telefone não informado'
                const totalPedido = (typeof pedido.total === 'number' ? pedido.total : (typeof (pedido as any).valorTotal === 'number' ? (pedido as any).valorTotal : 0))

                return (
                  <div key={pedido._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    {/* Header do Card */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg text-gray-900">
                          {numeroExibicao}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(pedido.status)}`}>
                          {getStatusText(pedido.status)}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        R$ {Number(totalPedido || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* Informações do Cliente */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium text-gray-900">{nomeCliente}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-gray-600">{telCliente}</span>
                      </div>

                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="text-sm text-gray-600">
                          {pedido.enderecoEntrega ? (
                            <>
                              <p>
                                {(pedido.enderecoEntrega.rua || 'Rua não informada')}, {pedido.enderecoEntrega.numero || 's/n'}
                              </p>
                              {pedido.enderecoEntrega.complemento && (
                                <p>{pedido.enderecoEntrega.complemento}</p>
                              )}
                              <p>
                                {(pedido.enderecoEntrega.bairro || 'Bairro não informado')} - {(pedido.enderecoEntrega.cidade || 'Cidade não informada')}
                              </p>
                              {pedido.enderecoEntrega.referencia && (
                                <p className="text-blue-600">Ref: {pedido.enderecoEntrega.referencia}</p>
                              )}
                            </>
                          ) : (
                            <p className="text-gray-500">Endereço não informado</p>
                          )}
                        </div>
                      </div>

                      {/* Informações do Entregador */}
                      {pedido.entregadorNome && (
                        <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded-lg">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="text-sm font-medium text-blue-900">
                            Entregador: {pedido.entregadorNome}
                          </span>
                        </div>
                      )}

                      {/* Tempo de Entrega */}
                      {tempoEntrega !== null && pedido.status === 'saiu_entrega' && (
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-orange-600">
                            Em trânsito há {tempoEntrega} minutos
                          </span>
                        </div>
                      )}

                      {/* Informações de Pagamento */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Pagamento:</span>
                          <span className="font-medium">{pedido.formaPagamento}</span>
                        </div>
                        {typeof pedido.trocoParaValor === 'number' && pedido.trocoParaValor > 0 && (
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-gray-600">Troco para:</span>
                            <span className="font-medium text-red-600">R$ {Number(pedido.trocoParaValor || 0).toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {/* Observações */}
                      {pedido.observacoesPedido && (
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Obs:</strong> {pedido.observacoesPedido}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-200 pt-4">
                      {pedido.status === 'pronto' && (
                        <button
                          onClick={() => {
                            setSelectedPedido(pedido._id)
                            setShowAssignModal(true)
                          }}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Atribuir Entregador</span>
                        </button>
                      )}
                      
                      {pedido.status === 'saiu_entrega' && (
                        <button
                          onClick={() => handleMarcarEntregue(pedido._id)}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Marcar como Entregue</span>
                        </button>
                      )}

                      {pedido.status === 'entregue' && pedido.horarioEntrega && (
                        <div className="text-center text-sm text-gray-600">
                          Entregue em {new Date(pedido.horarioEntrega).toLocaleString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma entrega encontrada</h3>
              <p className="text-gray-500">
                {filtroStatus || busca 
                  ? 'Tente ajustar os filtros para ver mais entregas.'
                  : 'Não há entregas disponíveis no momento.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Atribuição de Entregador */}
      {showAssignModal && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Atribuir Entregador
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedPedido(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              {entregadoresDisponiveis.length > 0 ? (
                entregadoresDisponiveis.map((entregador) => (
                  <button
                    key={entregador._id}
                    onClick={() => handleAssignEntregador(selectedPedido, entregador.nome)}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{entregador.nome}</p>
                        <p className="text-sm text-gray-600">{entregador.telefone}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {entregador.veiculo?.tipo} {entregador.veiculo?.modelo && `- ${entregador.veiculo.modelo}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          {entregador.entregasRealizadas || 0} entregas
                        </p>
                        <div className="flex items-center">
                          <span className="text-xs text-yellow-600">★ {(entregador.avaliacaoMedia || 0).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-4">
                  <svg className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600">Nenhum entregador disponível</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedPedido(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Entregas