
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

import { api } from '../lib/api'

interface Entregador {
  _id: string
  nome: string
  telefone: string
  email?: string
  cpf?: string
  endereco?: {
    rua: string
    numero: string
    bairro: string
    cidade: string
    cep: string
  }
  veiculo: {
    tipo: 'moto' | 'bicicleta' | 'carro' | 'a_pe'
    modelo?: string
    placa?: string
    cor?: string
  }
  disponivel: boolean
  dataAdmissao?: string
  observacoes?: string
  totalEntregas?: number
  avaliacao?: number
  // Propriedades adicionais para compatibilidade
  entregasRealizadas: number
  avaliacaoMedia: number
  createdAt?: string
  updatedAt?: string
}

export const useEntregadores = () => {
  const [entregadores, setEntregadores] = useState<Entregador[]>([])
  const [loading, setLoading] = useState(false)

  console.log('useEntregadores hook initialized, entregadores count:', entregadores.length)

  const fetchEntregadores = useCallback(async () => {
    console.log('fetchEntregadores called')
    setLoading(true)
    try {
      const response = await api.getEntregadores({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      console.log('fetchEntregadores response:', response)
      setEntregadores(response.entregadores || [])
    } catch (error: unknown) {
      console.error('Erro ao buscar entregadores:', error)
      
      // Melhor tratamento de erro
      let errorMessage = 'Erro ao carregar entregadores'
      if (error instanceof Error) {
        errorMessage = error.message
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
      }
      
      toast.error(`Erro ao buscar entregadores: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [])

  // Helpers de formatação/validação
  const formatTelefone = (tel: string) => {
    const digits = (tel || '').replace(/\D/g, '')
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return tel
  }

  const isTelefoneValido = (tel: string) => /^(\(\d{2}\)\s\d{4,5}-\d{4})$/.test(tel)

  const formatCpf = (cpf: string) => {
    const digits = (cpf || '').replace(/\D/g, '')
    if (digits.length !== 11) return cpf
    return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`
  }

  const isCpfValidoFormato = (cpf: string) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)

  const createEntregador = async (entregadorData: Omit<Entregador, '_id' | 'entregasRealizadas' | 'avaliacaoMedia'>) => {
    try {
      // Normalizar telefone e CPF para o formato exigido pelo backend
      const telefoneFormatado = formatTelefone(entregadorData.telefone)
      const cpfFormatado = entregadorData.cpf ? formatCpf(entregadorData.cpf) : undefined

      if (!isTelefoneValido(telefoneFormatado)) {
        toast.error('Telefone inválido. Use (11) 99999-9999')
        throw new Error('Telefone inválido')
      }
      if (cpfFormatado && !isCpfValidoFormato(cpfFormatado)) {
        toast.error('CPF inválido. Use 000.000.000-00')
        throw new Error('CPF inválido')
      }
      if (!entregadorData.email) {
        toast.error('Email é obrigatório')
        throw new Error('Email obrigatório')
      }
      if (!entregadorData.veiculo?.tipo) {
        toast.error('Selecione o tipo de veículo')
        throw new Error('Veículo tipo obrigatório')
      }

      const novoEntregador = {
        ...entregadorData,
        telefone: telefoneFormatado,
        cpf: cpfFormatado || undefined,
        entregasRealizadas: 0,
        avaliacaoMedia: 0,
        criador: 'admin'
      }
      
      const entregador = await api.createEntregador(novoEntregador)
      setEntregadores(prev => [entregador, ...prev])
      toast.success('Entregador criado com sucesso!')
      return entregador
    } catch (error: unknown) {
      console.error('Erro ao criar entregador:', error)
      toast.error('Erro ao criar entregador')
      throw error
    }
  }

  const updateEntregador = async (entregadorId: string, entregadorData: Partial<Entregador>) => {
    try {
      const entregadorAtualizado = await api.updateEntregador(entregadorId, {
        ...entregadorData,
        atualizadoEm: new Date().toISOString()
      })
      
      setEntregadores(prev => prev.map(e => e._id === entregadorId ? entregadorAtualizado : e))
      toast.success('Entregador atualizado com sucesso!')
      return entregadorAtualizado
    } catch (error: unknown) {
      console.error('Erro ao atualizar entregador:', error)
      toast.error('Erro ao atualizar entregador')
      throw error
    }
  }

  const deleteEntregador = async (entregadorId: string) => {
    try {
      if (typeof entregadorId !== 'string') {
        throw new Error('ID do entregador deve ser uma string')
      }
      
      await api.deleteEntregador(entregadorId)
      setEntregadores(prev => prev.filter(e => e._id !== entregadorId))
      toast.success('Entregador excluído com sucesso!')
    } catch (error: unknown) {
      console.error('Erro ao excluir entregador:', error)
      toast.error('Erro ao excluir entregador')
      throw error
    }
  }

  const toggleDisponibilidade = async (entregadorId: string, disponivel: boolean) => {
    try {
      await updateEntregador(entregadorId, { disponivel })
    } catch (error) {
      console.error('Erro ao alterar disponibilidade:', error)
    }
  }

  useEffect(() => {
    fetchEntregadores()
  }, [fetchEntregadores])

  return {
    entregadores,
    loading,
    fetchEntregadores,
    createEntregador,
    updateEntregador,
    deleteEntregador,
    toggleDisponibilidade
  }
}
