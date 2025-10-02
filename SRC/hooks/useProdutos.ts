
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { api } from '../lib/api'

interface Produto {
  _id: string
  nome: string
  descricao?: string
  categoria: string
  preco: number
  precoPromocional?: number
  disponivel: boolean
  estoque: number
  ingredientes?: string[]
  tempoPreparoMinutos: number
  categoria_detalhada?: string
  tamanhos?: Array<{
    nome: string
    preco: number
    disponivel: boolean
  }>
}

export const useProdutos = () => {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)

  console.log('useProdutos hook initialized, produtos count:', produtos.length)

  const fetchProdutos = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.getProdutos({
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 1000
      })
      setProdutos(response.produtos || [])
    } catch (error: unknown) {
      console.error('Erro ao buscar produtos:', error)
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }, [])

  const createProduto = async (produtoData: Omit<Produto, '_id'>) => {
    try {
      const novoProduto = {
        ...produtoData,
        criador: 'admin'
      }
      
      const produto = await api.createProduto(novoProduto)
      setProdutos(prev => [produto, ...prev])
      toast.success('Produto criado com sucesso!')
      return produto
    } catch (error: unknown) {
      console.error('Erro ao criar produto:', error)
      toast.error('Erro ao criar produto')
      throw error
    }
  }

  const updateProduto = async (produtoId: string, updates: Partial<Produto>) => {
    try {
      const produtoAtualizado = await api.updateProduto(produtoId, {
        ...updates,
        atualizadoEm: new Date().toISOString()
      })
      
      setProdutos(prev => prev.map(p => p._id === produtoId ? produtoAtualizado : p))
      toast.success('Produto atualizado com sucesso!')
      return produtoAtualizado
    } catch (error: unknown) {
      console.error('Erro ao atualizar produto:', error)
      toast.error('Erro ao atualizar produto')
      throw error
    }
  }

  const deleteProduto = async (produtoId: string) => {
    try {
      if (typeof produtoId !== 'string') {
        throw new Error('ID do produto deve ser uma string')
      }
      
      await api.deleteProduto(produtoId)
      setProdutos(prev => prev.filter(p => p._id !== produtoId))
      toast.success('Produto excluído com sucesso!')
    } catch (error: unknown) {
      console.error('Erro ao excluir produto:', error)
      toast.error('Erro ao excluir produto')
      throw error
    }
  }

  const toggleDisponibilidade = async (produtoId: string, disponivel: boolean) => {
    try {
      await updateProduto(produtoId, { disponivel })
    } catch (error) {
      console.error('Erro ao alterar disponibilidade:', error)
    }
  }

  useEffect(() => {
    fetchProdutos()
  }, [fetchProdutos])

  return {
    produtos,
    loading,
    fetchProdutos,
    createProduto,
    updateProduto,
    deleteProduto,
    toggleDisponibilidade
  }
}
