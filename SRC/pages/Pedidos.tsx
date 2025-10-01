
import React, { useState } from 'react'
import { usePedidos } from '../hooks/usePedidos'
import { useProdutos } from '../hooks/useProdutos'

const Pedidos: React.FC = () => {
  const { pedidos, loading, createPedido } = usePedidos()
  const { produtos } = useProdutos()
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    clienteNome: '',
    clienteTelefone: '',
    clienteEmail: '',
    enderecoEntrega: {
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      cep: '',
      referencia: ''
    },
    itens: [] as Array<{
      produtoId: string
      nome: string
      quantidade: number
      precoUnitario: number
      precoTotal: number
      observacoes?: string
      tamanho?: string
    }>,
    formaPagamento: 'dinheiro',
    trocoParaValor: 0,
    taxaEntrega: 5.00,
    desconto: 0,
    observacoesPedido: '',
    tempoEstimadoMinutos: 30
  })

  const [selectedProduto, setSelectedProduto] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [observacoesItem, setObservacoesItem] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [selectedTamanho, setSelectedTamanho] = useState('')
  const [selectedSabores, setSelectedSabores] = useState<string[]>([])

  const statusOptions = [
    { value: 'pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'em_andamento', label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
    { value: 'pronto', label: 'Pronto', color: 'bg-purple-100 text-purple-800' },
    { value: 'saiu_entrega', label: 'Saiu para Entrega', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'entregue', label: 'Entregue', color: 'bg-green-100 text-green-800' },
    { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
  ]

  const pedidosFiltrados = filtroStatus === 'todos' 
    ? pedidos 
    : pedidos.filter(pedido => pedido.status === filtroStatus)

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    return statusOption?.color || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    return statusOption?.label || status
  }

  const handleStatusChange = (pedidoId: string, novoStatus: string) => {
    // Implementar mudança de status
    console.log(`Mudando status do pedido ${pedidoId} para ${novoStatus}`)
  }

  // Form handlers
  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any>),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const addItemToPedido = () => {
    if (selectedCategoria === 'pizzas') {
      // Para pizzas, usar tamanho e sabores
      if (!selectedTamanho || selectedSabores.length === 0) {
        alert('Por favor, selecione o tamanho e pelo menos um sabor para a pizza.');
        return;
      }

      const precosPorTamanho = {
        'Pequena': 25.00,
        'Média': 35.00,
        'Grande': 45.00,
        'Família': 55.00
      };

      const precoBase = precosPorTamanho[selectedTamanho as keyof typeof precosPorTamanho] || 0;
      const nomeItem = `Pizza ${selectedTamanho} - ${selectedSabores.join(', ')}`;

      const novoItem = {
        produtoId: 'pizza-' + Date.now(),
        nome: nomeItem,
        quantidade,
        precoUnitario: precoBase,
        precoTotal: precoBase * quantidade,
        observacoes: observacoesItem || undefined,
        tamanho: selectedTamanho,
        sabores: selectedSabores
      };

      setFormData(prev => ({
        ...prev,
        itens: [...prev.itens, novoItem]
      }));

      // Reset apenas os campos específicos da pizza
      setSelectedTamanho('');
      setSelectedSabores([]);
      setQuantidade(1);
      setObservacoesItem('');
    } else {
      // Para outras categorias, usar produto normal
      if (!selectedProduto) {
        alert('Por favor, selecione um produto.');
        return;
      }

      const produto = produtos.find(p => p._id === selectedProduto);
      if (!produto) return;

      const novoItem = {
        produtoId: produto._id,
        nome: produto.nome,
        quantidade,
        precoUnitario: produto.preco,
        precoTotal: produto.preco * quantidade,
        observacoes: observacoesItem || undefined
      };

      setFormData(prev => ({
        ...prev,
        itens: [...prev.itens, novoItem]
      }));

      // Reset campos
      setSelectedProduto('');
      setSelectedTamanho('');
      setQuantidade(1);
      setObservacoesItem('');
    }
  }

  const removeItemFromPedido = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }))
  }

  const calculateSubtotal = () => {
    return formData.itens.reduce((sum, item) => sum + item.precoTotal, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + formData.taxaEntrega - formData.desconto
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.itens.length === 0) {
      alert('Adicione pelo menos um item ao pedido')
      return
    }

    try {
      const pedidoData = {
        ...formData,
        subtotal: calculateSubtotal(),
        total: calculateTotal(),
        status: 'recebido'
      }

      await createPedido(pedidoData)
      setShowModal(false)
      
      // Reset form
      setFormData({
        clienteNome: '',
        clienteTelefone: '',
        clienteEmail: '',
        enderecoEntrega: {
          rua: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          cep: '',
          referencia: ''
        },
        itens: [],
        formaPagamento: 'dinheiro',
        trocoParaValor: 0,
        taxaEntrega: 5.00,
        desconto: 0,
        observacoesPedido: '',
        tempoEstimadoMinutos: 30
      })
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
    }
  }

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
            <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
            <p className="text-gray-600 mt-2">Gerencie todos os pedidos do sistema</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Novo Pedido</span>
          </button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{pedidos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">
                {pedidos.filter(p => p.status === 'pendente').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Em Andamento</p>
              <p className="text-2xl font-bold text-gray-900">
                {pedidos.filter(p => p.status === 'em_andamento').length}
              </p>
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
              <p className="text-sm font-medium text-gray-600">Entregues</p>
              <p className="text-2xl font-bold text-gray-900">
                {pedidos.filter(p => p.status === 'entregue').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
          </svg>
          <label className="text-sm font-medium text-gray-700">Filtrar por status:</label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos os Status</option>
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de Pedidos ({pedidosFiltrados.length})
          </h2>
        </div>
        <div className="p-6">
          {pedidosFiltrados.length > 0 ? (
            <div className="space-y-4">
              {pedidosFiltrados.map((pedido) => (
                <div key={pedido._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Pedido #{pedido._id}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pedido.status)}`}>
                          {getStatusText(pedido.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Cliente</p>
                          <p className="font-medium text-gray-900">{pedido.clienteNome}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Telefone</p>
                          <p className="font-medium text-gray-900">{pedido.clienteTelefone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Data do Pedido</p>
                          <p className="font-medium text-gray-900">
                            {pedido.criadoEm ? new Date(pedido.criadoEm).toLocaleDateString('pt-BR') : 'Data não disponível'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Valor Total</p>
                          <p className="font-bold text-green-600 text-lg">
                            R$ {(pedido.total ?? 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {pedido.enderecoEntrega && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-1">Endereço de Entrega</p>
                          <p className="text-sm text-gray-900">
                            {pedido.enderecoEntrega.rua}, {pedido.enderecoEntrega.numero}
                            {pedido.enderecoEntrega.complemento && `, ${pedido.enderecoEntrega.complemento}`}
                            <br />
                            {pedido.enderecoEntrega.bairro} - {pedido.enderecoEntrega.cidade}
                            <br />
                            CEP: {pedido.enderecoEntrega.cep}
                          </p>
                        </div>
                      )}

                      {pedido.itens && pedido.itens.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">Itens do Pedido</p>
                          <div className="space-y-1">
                            {pedido.itens.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.quantidade}x {item.nome}</span>
                                <span>R$ {(item.precoTotal ?? 0).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <select
                        value={pedido.status}
                        onChange={(e) => handleStatusChange(pedido._id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {statusOptions.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Ver Detalhes
                      </button>
                      
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-500">Não há pedidos com o filtro selecionado.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Novo Pedido */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Novo Pedido</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados do Cliente */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.clienteNome}
                      onChange={(e) => handleInputChange('clienteNome', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome completo do cliente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.clienteTelefone}
                      onChange={(e) => handleInputChange('clienteTelefone', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                </div>
              </div>

              {/* Endereço de Entrega */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço de Entrega</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rua *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.enderecoEntrega.rua}
                      onChange={(e) => handleInputChange('enderecoEntrega.rua', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.enderecoEntrega.numero}
                      onChange={(e) => handleInputChange('enderecoEntrega.numero', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123"
                    />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Complemento
                     </label>
                     <input
                       type="text"
                       value={formData.enderecoEntrega.complemento}
                       onChange={(e) => handleInputChange('enderecoEntrega.complemento', e.target.value)}
                       className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="Apto, casa, etc."
                     />
                   </div>
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Referência
                     </label>
                     <input
                       type="text"
                       value={formData.enderecoEntrega.referencia}
                       onChange={(e) => handleInputChange('enderecoEntrega.referencia', e.target.value)}
                       className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="Ponto de referência"
                     />
                   </div>
                </div>
              </div>

              {/* Itens do Pedido */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Itens do Pedido</h3>
                
                {/* Adicionar Item */}
                 <div className="p-4 bg-white rounded-lg border space-y-4">
                   {/* Categoria */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Categoria
                     </label>
                     <select
                       value={selectedCategoria}
                       onChange={(e) => {
                         setSelectedCategoria(e.target.value);
                         setSelectedProduto('');
                         setSelectedTamanho('');
                         setSelectedSabores([]);
                       }}
                       className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     >
                       <option value="">Selecione uma categoria</option>
                       <option value="pasteis">Pastéis</option>
                       <option value="pizzas">Pizzas</option>
                       <option value="lanches">Lanches</option>
                       <option value="hamburgueres">Hambúrgueres</option>
                       <option value="bebidas">Bebidas</option>
                     </select>
                   </div>

                   {/* Produto (para categorias que não são pizzas) */}
                   {selectedCategoria && selectedCategoria !== 'pizzas' && (
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Produto
                       </label>
                       <select
                         value={selectedProduto}
                         onChange={(e) => {
                           setSelectedProduto(e.target.value);
                           setSelectedTamanho('');
                           setSelectedSabores([]);
                         }}
                         className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       >
                         <option value="">Selecione um produto</option>
                         {produtos
                           .filter(p => p.disponivel && p.categoria === selectedCategoria)
                           .map(produto => (
                             <option key={produto._id} value={produto._id}>
                               {produto.nome} - R$ {produto.preco.toFixed(2)}
                             </option>
                           ))}
                       </select>
                     </div>
                   )}

                   {/* Tamanho para produtos com variações (não pizzas) */}
                   {selectedCategoria && selectedCategoria !== 'pizzas' && selectedProduto && (() => {
                     const produto = produtos.find(p => p._id === selectedProduto);
                     return produto?.temVariacoes && produto?.tamanhos?.length > 0;
                   })() && (
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Tamanho *
                       </label>
                       <select
                         value={selectedTamanho}
                         onChange={(e) => setSelectedTamanho(e.target.value)}
                         className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                         required
                       >
                         <option value="">Selecione o tamanho</option>
                         {(() => {
                           const produto = produtos.find(p => p._id === selectedProduto);
                           return produto?.tamanhos?.map((tamanho: any) => (
                             <option key={tamanho.nome} value={tamanho.nome}>
                               {tamanho.nome} - R$ {tamanho.preco.toFixed(2)} {tamanho.descricao && `(${tamanho.descricao})`}
                             </option>
                           ));
                         })()}
                       </select>
                     </div>
                   )}

                   {/* Tamanho (aparece imediatamente quando seleciona pizzas) */}
                   {selectedCategoria === 'pizzas' && (
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Tamanho da Pizza *
                       </label>
                       <select
                         value={selectedTamanho}
                         onChange={(e) => {
                           setSelectedTamanho(e.target.value);
                           setSelectedSabores([]);
                         }}
                         className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                         required
                       >
                         <option value="">Selecione o tamanho</option>
                         <option value="Pequena">Pequena - R$ 25,00</option>
                         <option value="Média">Média - R$ 35,00</option>
                         <option value="Grande">Grande - R$ 45,00</option>
                         <option value="Família">Família - R$ 55,00</option>
                       </select>
                     </div>
                   )}

                   {/* Sabores (aparece após selecionar tamanho da pizza) */}
                   {selectedCategoria === 'pizzas' && selectedTamanho && (
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Sabores da Pizza (máximo 3)
                       </label>
                       <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                         {[
                           'Margherita',
                           'Pepperoni',
                           'Calabresa',
                           'Quatro Queijos',
                           'Portuguesa',
                           'Frango com Catupiry',
                           'Bacon',
                           'Vegetariana',
                           'Napolitana',
                           'Atum'
                         ].map(sabor => (
                           <label key={sabor} className="flex items-center">
                             <input
                               type="checkbox"
                               checked={selectedSabores.includes(sabor)}
                               onChange={(e) => {
                                 if (e.target.checked && selectedSabores.length < 3) {
                                   setSelectedSabores([...selectedSabores, sabor]);
                                 } else if (!e.target.checked) {
                                   setSelectedSabores(selectedSabores.filter(s => s !== sabor));
                                 }
                               }}
                               disabled={!selectedSabores.includes(sabor) && selectedSabores.length >= 3}
                               className="mr-2"
                             />
                             <span className="text-sm">{sabor}</span>
                           </label>
                         ))}
                       </div>
                       {selectedSabores.length > 0 && (
                         <p className="text-sm text-gray-600 mt-2">
                           Sabores selecionados: {selectedSabores.join(', ')}
                         </p>
                       )}
                     </div>
                   )}

                   {/* Quantidade e Observações */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Quantidade
                       </label>
                       <input
                         type="number"
                         min="1"
                         value={quantidade}
                         onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                         className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Observações
                       </label>
                       <input
                         type="text"
                         value={observacoesItem}
                         onChange={(e) => setObservacoesItem(e.target.value)}
                         className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                         placeholder="Observações do item"
                       />
                     </div>
                   </div>

                   {/* Botão Adicionar */}
                   <div className="flex justify-end">
                     <button
                       type="button"
                       onClick={addItemToPedido}
                       disabled={
                         selectedCategoria === 'pizzas' 
                           ? (!selectedTamanho || selectedSabores.length === 0)
                           : (() => {
                               if (!selectedProduto) return true;
                               const produto = produtos.find(p => p._id === selectedProduto);
                               if (produto?.temVariacoes && produto?.tamanhos?.length > 0) {
                                 return !selectedTamanho;
                               }
                               return false;
                             })()
                       }
                       className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                     >
                       Adicionar Item
                     </button>
                   </div>
                 </div>

                {/* Lista de Itens */}
                {formData.itens.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Itens Adicionados:</h4>
                    {formData.itens.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div className="flex-1">
                          <span className="font-medium">{item.quantidade}x {item.nome}</span>
                          {item.sabor && (
                            <span className="text-sm text-blue-600 ml-2">Sabor: {item.sabor}</span>
                          )}
                          {item.tamanho && (
                            <span className="text-sm text-purple-600 ml-2">Tamanho: {item.tamanho}</span>
                          )}
                          {item.observacoes && (
                            <span className="text-sm text-gray-600 ml-2">({item.observacoes})</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-green-600">
                            R$ {item.precoTotal.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItemFromPedido(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagamento e Valores */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pagamento e Valores</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Forma de Pagamento *
                    </label>
                    <select
                      required
                      value={formData.formaPagamento}
                      onChange={(e) => handleInputChange('formaPagamento', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="pix">PIX</option>
                      <option value="vale_refeicao">Vale Refeição</option>
                    </select>
                  </div>
                  {formData.formaPagamento === 'dinheiro' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Troco para
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.trocoParaValor}
                        onChange={(e) => handleInputChange('trocoParaValor', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taxa de Entrega
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.taxaEntrega}
                      onChange={(e) => handleInputChange('taxaEntrega', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desconto
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.desconto}
                      onChange={(e) => handleInputChange('desconto', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tempo Estimado (minutos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.tempoEstimadoMinutos}
                      onChange={(e) => handleInputChange('tempoEstimadoMinutos', parseInt(e.target.value) || 30)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações do Pedido
                    </label>
                    <textarea
                      value={formData.observacoesPedido}
                      onChange={(e) => handleInputChange('observacoesPedido', e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Observações gerais do pedido"
                    />
                  </div>
                </div>

                {/* Resumo dos Valores */}
                {formData.itens.length > 0 && (
                  <div className="mt-4 p-4 bg-white rounded-lg border">
                    <h4 className="font-medium text-gray-900 mb-2">Resumo do Pedido</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>R$ {calculateSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de Entrega:</span>
                        <span>R$ {formData.taxaEntrega.toFixed(2)}</span>
                      </div>
                      {formData.desconto > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Desconto:</span>
                          <span>- R$ {formData.desconto.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t pt-1">
                        <span>Total:</span>
                        <span className="text-green-600">R$ {calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formData.itens.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Criar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Pedidos
