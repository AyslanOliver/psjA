import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { toast } from 'react-hot-toast'

export interface Cliente {
  _id: string
  nome: string
  telefone: string
  enderecos: Endereco[]
  ativo: boolean
  totalPedidos: number
  valorTotalGasto: number
  ultimoPedido?: Date
  observacoes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Endereco {
  _id?: string
  nome: string
  rua: string
  numero: string
  complemento?: string
  bairro: string
  referencia?: string
  principal: boolean
}

export interface CreateClienteData {
  nome: string
  telefone: string
  enderecos: Omit<Endereco, '_id'>[]
  observacoes?: string
}

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClientes = async (params?: any) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getClientes(params)
      setClientes(Array.isArray(response.clientes) ? response.clientes : [])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  const createCliente = async (clienteData: CreateClienteData) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.createCliente(clienteData)
      
      // Adiciona o novo cliente à lista
      setClientes(prev => [response, ...(Array.isArray(prev) ? prev : [])])
      
      return response
    } catch (err: any) {
      setError(err.message || 'Erro ao criar cliente')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateCliente = async (id: string, clienteData: Partial<CreateClienteData>) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.updateCliente(id, clienteData)
      
      // Atualiza o cliente na lista
      setClientes(prev => prev.map(cliente => 
        cliente._id === id ? { ...cliente, ...response } : cliente
      ))
      
      toast.success('Cliente atualizado com sucesso!')
      return response
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar cliente')
      toast.error('Erro ao atualizar cliente')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteCliente = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      await api.deleteCliente(id)
      
      // Remove o cliente da lista
      setClientes(prev => prev.filter(cliente => cliente._id !== id))
      
      toast.success('Cliente excluído com sucesso!')
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir cliente')
      toast.error('Erro ao excluir cliente')
      throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  return {
    clientes,
    loading,
    error,
    fetchClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    refetch: fetchClientes
  }
}