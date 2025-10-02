import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, MapPin } from 'lucide-react'
import { CreateClienteData, Endereco, Cliente } from '../../hooks/useClientes'

interface ClienteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateClienteData) => Promise<void>
  loading?: boolean
  cliente?: Cliente | null
  mode?: 'create' | 'edit'
}

export function ClienteModal({ isOpen, onClose, onSubmit, loading = false, cliente = null, mode = 'create' }: ClienteModalProps) {
  const [formData, setFormData] = useState<CreateClienteData>({
    nome: '',
    telefone: '',
    enderecos: [{
      nome: 'Principal',
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      referencia: '',
      principal: true
    }],
    observacoes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Preenche o formulário quando estiver editando
  useEffect(() => {
    if (mode === 'edit' && cliente) {
      setFormData({
        nome: cliente.nome || '',
        telefone: cliente.telefone || '',
        enderecos: cliente.enderecos && cliente.enderecos.length > 0 
          ? cliente.enderecos.map(endereco => ({
              nome: endereco.nome || '',
              rua: endereco.rua || '',
              numero: endereco.numero || '',
              complemento: endereco.complemento || '',
              bairro: endereco.bairro || '',
              referencia: endereco.referencia || '',
              principal: endereco.principal || false
            }))
          : [{
              nome: 'Principal',
              rua: '',
              numero: '',
              complemento: '',
              bairro: '',
              referencia: '',
              principal: true
            }],
        observacoes: cliente.observacoes || ''
      })
    } else {
      // Reset para modo de criação
      setFormData({
        nome: '',
        telefone: '',
        enderecos: [{
          nome: 'Principal',
          rua: '',
          numero: '',
          complemento: '',
          bairro: '',
          referencia: '',
          principal: true
        }],
        observacoes: ''
      })
    }
  }, [mode, cliente, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validações básicas
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório'
    } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.telefone)) {
      newErrors.telefone = 'Formato: (11) 99999-9999'
    }



    // Validação de endereços
    formData.enderecos.forEach((endereco, index) => {
      if (!endereco.nome.trim()) {
        newErrors[`endereco_${index}_nome`] = 'Nome do endereço é obrigatório'
      }
      if (!endereco.rua.trim()) {
        newErrors[`endereco_${index}_rua`] = 'Rua é obrigatória'
      }
      if (!endereco.numero.trim()) {
        newErrors[`endereco_${index}_numero`] = 'Número é obrigatório'
      }
      if (!endereco.bairro.trim()) {
        newErrors[`endereco_${index}_bairro`] = 'Bairro é obrigatório'
      }

    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
      handleClose()
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
    }
  }

  const handleClose = () => {
    setFormData({
      nome: '',
      telefone: '',
      enderecos: [{
        nome: 'Principal',
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        referencia: '',
        principal: true
      }],
      observacoes: ''
    })
    setErrors({})
    onClose()
  }

  const updateEndereco = (index: number, field: keyof Endereco, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      enderecos: prev.enderecos.map((endereco, i) => 
        i === index ? { ...endereco, [field]: value } : endereco
      )
    }))
  }

  const addEndereco = () => {
    setFormData(prev => ({
      ...prev,
      enderecos: [...prev.enderecos, {
        nome: `Endereço ${prev.enderecos.length + 1}`,
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        referencia: '',
        principal: false
      }]
    }))
  }

  const removeEndereco = (index: number) => {
    if (formData.enderecos.length > 1) {
      setFormData(prev => ({
        ...prev,
        enderecos: prev.enderecos.filter((_, i) => i !== index)
      }))
    }
  }

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
  }



  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'edit' ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Dados Pessoais */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nome ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nome completo"
                />
                {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    telefone: formatTelefone(e.target.value) 
                  }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.telefone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
                {errors.telefone && <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>}
              </div>






            </div>
          </div>

          {/* Endereços */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Endereços</h3>
              <button
                type="button"
                onClick={addEndereco}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Adicionar Endereço
              </button>
            </div>

            {formData.enderecos.map((endereco, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-500" />
                    <input
                      type="text"
                      value={endereco.nome}
                      onChange={(e) => updateEndereco(index, 'nome', e.target.value)}
                      className={`font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 ${
                        errors[`endereco_${index}_nome`] ? 'text-red-500' : ''
                      }`}
                      placeholder="Nome do endereço"
                    />
                  </div>
                  {formData.enderecos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEndereco(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={endereco.rua}
                      onChange={(e) => updateEndereco(index, 'rua', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`endereco_${index}_rua`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Rua *"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={endereco.numero}
                      onChange={(e) => updateEndereco(index, 'numero', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`endereco_${index}_numero`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Número *"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={endereco.complemento || ''}
                      onChange={(e) => updateEndereco(index, 'complemento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Complemento"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={endereco.bairro}
                      onChange={(e) => updateEndereco(index, 'bairro', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`endereco_${index}_bairro`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Bairro *"
                    />
                  </div>





                  <div className="md:col-span-2 lg:col-span-3">
                    <input
                      type="text"
                      value={endereco.referencia || ''}
                      onChange={(e) => updateEndereco(index, 'referencia', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ponto de referência"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={endereco.principal}
                      onChange={(e) => {
                        // Se marcar como principal, desmarcar todos os outros
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            enderecos: prev.enderecos.map((end, i) => ({
                              ...end,
                              principal: i === index
                            }))
                          }))
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Endereço principal</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Observações adicionais sobre o cliente"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}