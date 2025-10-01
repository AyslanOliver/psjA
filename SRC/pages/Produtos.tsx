
import React, { useState } from 'react'
import { useProdutos } from '../hooks/useProdutos'

const Produtos: React.FC = () => {
  const { produtos, loading, createProduto, updateProduto, deleteProduto, toggleDisponibilidade } = useProdutos()
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [busca, setBusca] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  // Form state for new product
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    preco: '',
    precoPromocional: '',
    disponivel: true,
    estoque: '',
    imagemUrl: '',
    ingredientes: '',
    tempoPreparoMinutos: '',
    categoria_detalhada: '',
    sabor: '',
    temVariacoes: false,
    tamanhos: []
  })

  const categorias = [
    { value: 'pizzas', label: 'Pizzas', icon: '🍕' },
    { value: 'pasteis', label: 'Pastéis', icon: '🥟' },
    { value: 'lanches_na_chapa', label: 'Lanches Na Chapa', icon: '🥪' },
    { value: 'salgados', label: 'Salgados', icon: '🧀' },
    { value: 'bolo', label: 'Bolo', icon: '🍰' },
    { value: 'bebidas', label: 'Bebidas', icon: '🥤' }
  ]

  const produtosFiltrados = produtos.filter(produto => {
    const matchCategoria = !filtroCategoria || produto.categoria === filtroCategoria
    const matchBusca = !busca || produto.nome.toLowerCase().includes(busca.toLowerCase())
    return matchCategoria && matchBusca
  })

  const getCategoriaInfo = (categoria: string) => {
    const cat = categorias.find(c => c.value === categoria)
    return cat || { label: categoria, icon: '📦' }
  }

  const handleToggleDisponibilidade = async (produtoId: string) => {
    const produto = produtos.find(p => p._id === produtoId)
    if (produto) {
      await toggleDisponibilidade(produtoId, !produto.disponivel)
    }
  }

  const handleEditProduto = (produto: any) => {
    setFormData({
      nome: produto.nome || '',
      descricao: produto.descricao || '',
      categoria: produto.categoria || '',
      preco: produto.preco?.toString() || '',
      precoPromocional: produto.precoPromocional?.toString() || '',
      disponivel: produto.disponivel ?? true,
      estoque: produto.estoque?.toString() || '',
      imagemUrl: produto.imagemUrl || '',
      ingredientes: produto.ingredientes?.join(', ') || '',
      tempoPreparoMinutos: produto.tempoPreparoMinutos?.toString() || '',
      categoria_detalhada: produto.categoria_detalhada || '',
      sabor: produto.sabor || '',
      temVariacoes: produto.temVariacoes || false,
      tamanhos: produto.tamanhos || []
    })
    setEditingProduct(produto)
    setShowModal(true)
  }

  const handleDeleteProduto = async (produtoId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      await deleteProduto(produtoId)
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      categoria: '',
      preco: '',
      precoPromocional: '',
      disponivel: true,
      estoque: '',
      imagemUrl: '',
      ingredientes: '',
      tempoPreparoMinutos: '',
      categoria_detalhada: '',
      sabor: '',
      temVariacoes: false,
      tamanhos: []
    })
    setEditingProduct(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!formData.nome || !formData.categoria || !formData.preco) {
      alert('Por favor, preencha os campos obrigatórios: Nome, Categoria e Preço.')
      return
    }

    if (parseFloat(formData.preco) <= 0) {
      alert('O preço deve ser maior que zero.')
      return
    }

    setIsSubmitting(true)
    
    try {
      const produtoData = {
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        categoria: formData.categoria,
        preco: parseFloat(formData.preco),
        precoPromocional: formData.precoPromocional ? parseFloat(formData.precoPromocional) : undefined,
        disponivel: formData.disponivel,
        estoque: formData.estoque ? parseInt(formData.estoque) : 0,
        imagemUrl: formData.imagemUrl || undefined,
        ingredientes: formData.ingredientes ? formData.ingredientes.split(',').map(i => i.trim()).filter(i => i) : undefined,
        tempoPreparoMinutos: formData.tempoPreparoMinutos ? parseInt(formData.tempoPreparoMinutos) : 15,
        categoria_detalhada: formData.categoria_detalhada || undefined,
        sabor: formData.sabor || undefined,
        temVariacoes: formData.temVariacoes,
        tamanhos: formData.temVariacoes ? formData.tamanhos.map(t => ({
          nome: t.nome,
          preco: parseFloat(t.preco),
          descricao: t.descricao || undefined
        })) : undefined
      }

      if (editingProduct) {
        await updateProduto(editingProduct._id, produtoData)
      } else {
        await createProduto(produtoData)
      }
      
      resetForm()
      setShowModal(false)
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
    } finally {
      setIsSubmitting(false)
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
            <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
            <p className="text-gray-600 mt-2">Gerencie o cardápio da sua pastelaria</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{produtos.length}</p>
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
              <p className="text-2xl font-bold text-gray-900">
                {produtos.filter(p => p.disponivel).length}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {produtos.filter(p => !p.disponivel).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categorias</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(produtos.map(p => p.categoria)).size}
              </p>
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
              placeholder="Buscar produtos..."
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
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Todas as categorias</option>
              {categorias.map(categoria => (
                <option key={categoria.value} value={categoria.value}>
                  {categoria.icon} {categoria.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {produtosFiltrados.length} produto(s) encontrado(s)
          </span>
          {(busca || filtroCategoria) && (
            <button
              onClick={() => { setBusca(''); setFiltroCategoria('') }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Catálogo de Produtos
          </h2>
        </div>
        <div className="p-6">
          {produtosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {produtosFiltrados.map((produto) => {
                const categoriaInfo = getCategoriaInfo(produto.categoria)
                return (
                  <div key={produto._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img
                        src={produto.imagemUrl || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
                        alt={produto.nome}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          produto.disponivel 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {produto.disponivel ? 'Disponível' : 'Indisponível'}
                        </span>
                      </div>
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white bg-opacity-90 rounded-full">
                          {categoriaInfo.icon} {categoriaInfo.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {produto.nome}
                          {produto.sabor && (
                            <span className="text-sm font-normal text-blue-600 ml-2">
                              • {produto.sabor}
                            </span>
                          )}
                        </h3>
                        {produto.descricao && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {produto.descricao}
                          </p>
                        )}
                      </div>

                      {/* Exibição de Tamanhos */}
                      {produto.temVariacoes && produto.tamanhos && produto.tamanhos.length > 0 ? (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-2">Tamanhos disponíveis:</p>
                          <div className="space-y-1">
                            {produto.tamanhos.map((tamanho, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">
                                  {tamanho.nome}
                                  {tamanho.descricao && (
                                    <span className="text-gray-400 ml-1">({tamanho.descricao})</span>
                                  )}
                                </span>
                                <span className="font-semibold text-green-600">
                                  R$ {tamanho.preco.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-xl font-bold text-green-600">
                              R$ {produto.preco.toFixed(2)}
                            </span>
                            {produto.precoPromocional && (
                              <span className="text-sm text-gray-500 line-through ml-2">
                                R$ {produto.precoPromocional.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            Estoque: {produto.estoque || 0}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>Preparo: {produto.tempoPreparoMinutos || 15}min</span>
                        {produto.ingredientes && produto.ingredientes.length > 0 && (
                          <span>{produto.ingredientes.length} ingredientes</span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleDisponibilidade(produto._id)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            produto.disponivel
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {produto.disponivel ? 'Desativar' : 'Ativar'}
                        </button>
                        
                        <button
                          onClick={() => handleEditProduto(produto)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteProduto(produto._id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500">
                {busca || filtroCategoria 
                  ? 'Não há produtos que correspondam aos filtros aplicados.'
                  : 'Comece adicionando produtos ao seu catálogo.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Novo Produto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
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
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome do Produto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Pizza Margherita"
                  required
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sabor (especialmente para pizzas) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sabor {formData.categoria === 'pizzas' && '*'}
                </label>
                <input
                  type="text"
                  name="sabor"
                  value={formData.sabor}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Margherita, Calabresa, Portuguesa"
                  required={formData.categoria === 'pizzas'}
                />
              </div>

              {/* Tem Variações de Tamanho */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="temVariacoes"
                  checked={formData.temVariacoes}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Este produto tem variações de tamanho com preços diferentes
                </label>
              </div>

              {/* Preço e Preço Promocional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço *
                  </label>
                  <input
                    type="number"
                    name="preco"
                    value={formData.preco}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço Promocional
                  </label>
                  <input
                    type="number"
                    name="precoPromocional"
                    value={formData.precoPromocional}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Seção de Tamanhos (quando temVariacoes está marcado) */}
              {formData.temVariacoes && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Tamanhos e Preços</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure os diferentes tamanhos disponíveis para este produto.
                  </p>
                  
                  {formData.tamanhos.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-3">Nenhum tamanho configurado</p>
                      <button
                        type="button"
                        onClick={() => {
                          const novoTamanho = { nome: '', preco: '', descricao: '' };
                          setFormData(prev => ({
                            ...prev,
                            tamanhos: [...prev.tamanhos, novoTamanho]
                          }));
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Adicionar Primeiro Tamanho
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.tamanhos.map((tamanho, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-white rounded-lg border">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Nome *
                            </label>
                            <input
                              type="text"
                              value={tamanho.nome}
                              onChange={(e) => {
                                const novosTamanhos = [...formData.tamanhos];
                                novosTamanhos[index].nome = e.target.value;
                                setFormData(prev => ({ ...prev, tamanhos: novosTamanhos }));
                              }}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              placeholder="Ex: Pequena"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Preço *
                            </label>
                            <input
                              type="number"
                              value={tamanho.preco}
                              onChange={(e) => {
                                const novosTamanhos = [...formData.tamanhos];
                                novosTamanhos[index].preco = e.target.value;
                                setFormData(prev => ({ ...prev, tamanhos: novosTamanhos }));
                              }}
                              step="0.01"
                              min="0"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              placeholder="0.00"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Descrição
                            </label>
                            <input
                              type="text"
                              value={tamanho.descricao}
                              onChange={(e) => {
                                const novosTamanhos = [...formData.tamanhos];
                                novosTamanhos[index].descricao = e.target.value;
                                setFormData(prev => ({ ...prev, tamanhos: novosTamanhos }));
                              }}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              placeholder="Ex: 25cm"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => {
                                const novosTamanhos = formData.tamanhos.filter((_, i) => i !== index);
                                setFormData(prev => ({ ...prev, tamanhos: novosTamanhos }));
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={() => {
                          const novoTamanho = { nome: '', preco: '', descricao: '' };
                          setFormData(prev => ({
                            ...prev,
                            tamanhos: [...prev.tamanhos, novoTamanho]
                          }));
                        }}
                        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        + Adicionar Outro Tamanho
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrição detalhada do produto..."
                />
              </div>

              {/* Estoque e Tempo de Preparo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque
                  </label>
                  <input
                    type="number"
                    name="estoque"
                    value={formData.estoque}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempo de Preparo (minutos)
                  </label>
                  <input
                    type="number"
                    name="tempoPreparoMinutos"
                    value={formData.tempoPreparoMinutos}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="15"
                  />
                </div>
              </div>

              {/* URL da Imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Imagem
                </label>
                <input
                  type="url"
                  name="imagemUrl"
                  value={formData.imagemUrl}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              {/* Ingredientes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingredientes
                </label>
                <input
                  type="text"
                  name="ingredientes"
                  value={formData.ingredientes}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Separados por vírgula: tomate, queijo, manjericão"
                />
                <p className="text-xs text-gray-500 mt-1">Separe os ingredientes por vírgula</p>
              </div>

              {/* Categoria Detalhada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria Detalhada
                </label>
                <input
                  type="text"
                  name="categoria_detalhada"
                  value={formData.categoria_detalhada}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Pizza Doce, Lanche Vegano"
                />
              </div>

              {/* Disponível */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="disponivel"
                  checked={formData.disponivel}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Produto disponível para venda
                </label>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting 
                    ? (editingProduct ? 'Salvando...' : 'Criando...') 
                    : (editingProduct ? 'Salvar Alterações' : 'Criar Produto')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Produtos
