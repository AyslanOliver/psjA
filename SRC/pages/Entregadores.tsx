
import { useState } from 'react'
import { useEntregadores } from '../hooks/useEntregadores'

const Entregadores: React.FC = () => {
  const { entregadores, loading, createEntregador, toggleDisponibilidade, deleteEntregador, updateEntregador } = useEntregadores()
  const [showModal, setShowModal] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [busca, setBusca] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state for new delivery person
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf: '',
    endereco: {
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      cep: ''
    },
    veiculo: {
      tipo: 'moto' as 'moto' | 'bicicleta' | 'carro' | 'a_pe',
      modelo: '',
      placa: '',
      cor: ''
    },
    disponivel: true,
    dataAdmissao: '',
    observacoes: ''
  })

  const tiposVeiculo = [
    { value: 'moto', label: 'Moto', icon: '🏍️' },
    { value: 'bicicleta', label: 'Bicicleta', icon: '🚲' },
    { value: 'carro', label: 'Carro', icon: '🚗' },
    { value: 'a_pe', label: 'A pé', icon: '🚶' }
  ]

  const entregadoresFiltrados = entregadores.filter(entregador => {
    const matchStatus = !filtroStatus || 
      (filtroStatus === 'disponivel' && (entregador.disponivel === true || (entregador as any).status === 'disponivel')) ||
      (filtroStatus === 'indisponivel' && (entregador.disponivel === false || (entregador as any).status !== 'disponivel'))
    const matchBusca = !busca || entregador.nome.toLowerCase().includes(busca.toLowerCase())
    return matchStatus && matchBusca
  })

  const getTipoVeiculoInfo = (tipo: string) => {
    const veiculo = tiposVeiculo.find(v => v.value === tipo)
    return veiculo || { label: tipo, icon: '🚚' }
  }

  const handleToggleDisponibilidade = async (entregadorId: string, disponivelAtual?: boolean) => {
    try {
      await toggleDisponibilidade(entregadorId, !(disponivelAtual === true))
    } catch (err) {
      console.error('Erro ao alternar disponibilidade:', err)
      alert('Falha ao alterar disponibilidade')
    }
  }

  const handleDelete = async (entregadorId: string) => {
    if (!confirm('Deseja realmente excluir este entregador?')) return
    try {
      await deleteEntregador(entregadorId)
    } catch (err) {
      console.error('Erro ao excluir entregador:', err)
      alert('Falha ao excluir entregador')
    }
  }

  const handleEditBasic = async (entregadorId: string) => {
    // Exemplo simples: alternar ativo para true ao editar rápido (pode ser expandido depois com modal)
    try {
      await updateEntregador(entregadorId, { ativo: true })
    } catch (err) {
      console.error('Erro ao atualizar entregador:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      telefone: '',
      email: '',
      cpf: '',
      endereco: {
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        cep: ''
      },
      veiculo: {
        tipo: 'moto' as 'moto' | 'bicicleta' | 'carro' | 'a_pe',
        modelo: '',
        placa: '',
        cor: ''
      },
      disponivel: true,
      dataAdmissao: '',
      observacoes: ''
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (name.startsWith('endereco.')) {
      const enderecoField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          [enderecoField]: value
        }
      }))
    } else if (name.startsWith('veiculo.')) {
      const veiculoField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        veiculo: {
          ...prev.veiculo,
          [veiculoField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!formData.nome || !formData.telefone || !formData.veiculo.tipo) {
      alert('Por favor, preencha os campos obrigatórios: Nome, Telefone e Tipo de Veículo.')
      return
    }

    // Validação de telefone (formato básico)
    const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/
    if (!telefoneRegex.test(formData.telefone.replace(/\D/g, ''))) {
      alert('Por favor, insira um telefone válido.')
      return
    }

    setIsSubmitting(true)
    
    try {
      const entregadorData = {
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email || undefined,
        cpf: formData.cpf || undefined,
        endereco: (formData.endereco.rua || formData.endereco.cidade) ? {
          rua: formData.endereco.rua,
          numero: formData.endereco.numero,
          bairro: formData.endereco.bairro,
          cidade: formData.endereco.cidade,
          cep: formData.endereco.cep
        } : undefined,
        veiculo: {
          tipo: formData.veiculo.tipo,
          modelo: formData.veiculo.modelo || undefined,
          placa: formData.veiculo.placa || undefined,
          cor: formData.veiculo.cor || undefined
        },
        disponivel: formData.disponivel,
        dataAdmissao: formData.dataAdmissao || new Date().toISOString(),
        observacoes: formData.observacoes || undefined
      }

      await createEntregador(entregadorData)
      resetForm()
      setShowModal(false)
    } catch (error) {
      console.error('Erro ao criar entregador:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const calcularEstatisticas = () => {
    const totalEntregadores = entregadores.length
    const disponiveis = entregadores.filter(e => e.disponivel).length
    const totalEntregas = entregadores.reduce((acc, e) => acc + (e.entregasRealizadas || 0), 0)
    const avaliacaoMedia = entregadores.length > 0 
      ? entregadores.reduce((acc, e) => acc + (e.avaliacaoMedia || 0), 0) / entregadores.length

      : 0

    return {
      totalEntregadores,
      disponiveis,
      indisponiveis: totalEntregadores - disponiveis,
      totalEntregas,
      avaliacaoMedia: Number(avaliacaoMedia.toFixed(1))
    }
  }

  const stats = calcularEstatisticas()

  if (loading) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Entregadores</h1>
            <p className="text-gray-600 mt-2">Gerencie sua equipe de entregadores</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Novo Entregador</span>
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEntregadores}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Disponíveis</p>
              <p className="text-2xl font-bold text-gray-900">{stats.disponiveis}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Indisponíveis</p>
              <p className="text-2xl font-bold text-gray-900">{stats.indisponiveis}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Entregas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEntregas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avaliação Média</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avaliacaoMedia}</p>
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
              placeholder="Buscar entregadores..."
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
              <option value="">Todos os status</option>
              <option value="disponivel">Disponíveis</option>
              <option value="indisponivel">Indisponíveis</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {entregadoresFiltrados.length} entregador(es) encontrado(s)
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

      {/* Lista de Entregadores */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Equipe de Entregadores
          </h2>
        </div>
        <div className="p-6">
          {entregadoresFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entregadoresFiltrados.map((entregador) => {
                const veiculoInfo = getTipoVeiculoInfo(entregador.veiculo?.tipo || 'moto')
                const isDisponivel = (entregador.disponivel === true) || ((entregador as any).status === 'disponivel')
                return (
                  <div key={entregador._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {entregador.nome}
                        </h3>
                        <div className="flex items-center space-x-2 mb-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            isDisponivel 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {isDisponivel ? 'Disponível' : 'Indisponível'}
                          </span>
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                            <span className="text-sm font-medium">{entregador.avaliacaoMedia || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{entregador.telefone}</span>
                      </div>
                      
                      {entregador.endereco && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{entregador.endereco.bairro}, {entregador.endereco.cidade}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="text-lg">{veiculoInfo.icon}</span>
                        <span>
                          {veiculoInfo.label}
                          {entregador.veiculo?.modelo && ` - ${entregador.veiculo.modelo}`}
                        </span>
                      </div>

                      {entregador.veiculo?.placa && (
                        <div className="text-sm text-gray-600 ml-6">
                          Placa: {entregador.veiculo.placa}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-gray-900">{entregador.entregasRealizadas || 0}</div>
                        <div className="text-gray-600">Entregas</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-gray-900">
                          {entregador.dataAdmissao ? new Date(entregador.dataAdmissao).getFullYear() : 'N/A'}
                        </div>
                        <div className="text-gray-600">Desde</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleDisponibilidade(entregador._id!, entregador.disponivel)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isDisponivel
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {isDisponivel ? 'Desativar' : 'Ativar'}
                      </button>
                      
                      <button onClick={() => handleEditBasic(entregador._id!)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      <button onClick={() => handleDelete(entregador._id!)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum entregador encontrado</h3>
              <p className="text-gray-500">
                {busca || filtroStatus 
                  ? 'Não há entregadores que correspondam aos filtros aplicados.'
                  : 'Comece adicionando entregadores à sua equipe.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Novo Entregador */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Novo Entregador</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome completo do entregador"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rua
                    </label>
                    <input
                      type="text"
                      name="endereco.rua"
                      value={formData.endereco.rua}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome da rua"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número
                    </label>
                    <input
                      type="text"
                      name="endereco.numero"
                      value={formData.endereco.numero}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bairro
                    </label>
                    <input
                      type="text"
                      name="endereco.bairro"
                      value={formData.endereco.bairro}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome do bairro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      name="endereco.cidade"
                      value={formData.endereco.cidade}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome da cidade"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP
                    </label>
                    <input
                      type="text"
                      name="endereco.cep"
                      value={formData.endereco.cep}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>

              {/* Veículo */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Veículo *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo *
                    </label>
                    <select
                      name="veiculo.tipo"
                      value={formData.veiculo.tipo}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {tiposVeiculo.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modelo
                    </label>
                    <input
                      type="text"
                      name="veiculo.modelo"
                      value={formData.veiculo.modelo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Honda CG 160"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placa
                    </label>
                    <input
                      type="text"
                      name="veiculo.placa"
                      value={formData.veiculo.placa}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ABC-1234"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor
                    </label>
                    <input
                      type="text"
                      name="veiculo.cor"
                      value={formData.veiculo.cor}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Vermelha"
                    />
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Admissão
                  </label>
                  <input
                    type="date"
                    name="dataAdmissao"
                    value={formData.dataAdmissao}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="disponivel"
                    checked={formData.disponivel}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Disponível para entregas
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Informações adicionais sobre o entregador..."
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Criando...' : 'Criar Entregador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Entregadores
