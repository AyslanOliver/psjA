import { useState, useEffect } from 'react'
import { api } from '../lib/api'

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

  useEffect(() => {
    fetchClientes()
  }, [])

  return {
    clientes,
    loading,
    error,
    fetchClientes,
    createCliente,
    refetch: fetchClientes
  }
}