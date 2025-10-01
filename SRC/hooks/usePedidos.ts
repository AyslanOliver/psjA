
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { lumi, api } from '../lib/api'

interface ItemPedido {
  produtoId: string
  nome: string
  quantidade: number
  precoUnitario: number
  precoTotal: number
  observacoes?: string
  sabor?: string
  tamanho?: string
  tamanhoDetalhes?: {
    nome: string
    preco: number
    descricao: string
  }
}

interface EnderecoPedido {
  rua: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  cep: string
  referencia?: string
}

interface Pedido {
  _id: string
  numeroPedido: string
  clienteNome: string
  clienteTelefone: string
  clienteEmail?: string
  enderecoEntrega: EnderecoPedido
  itens: ItemPedido[]
  subtotal: number
  taxaEntrega: number
  desconto: number
  total: number
  formaPagamento: string
  trocoParaValor?: number
  status: string
  tempoEstimadoMinutos: number
  observacoesPedido?: string
  entregadorNome?: string
  horarioSaidaEntrega?: string
  horarioEntrega?: string
  criadoEm: string
  atualizadoEm: string
}

export const usePedidos = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(false)

  console.log('usePedidos hook initialized, pedidos count:', pedidos.length)

  const fetchPedidos = useCallback(async (filtroStatus?: string) => {
    console.log('fetchPedidos called with filter:', filtroStatus)
    setLoading(true)
    try {
      const filter = filtroStatus ? { status: filtroStatus } : {}
      const response = await lumi.entities.pedidos.list({
        filter,
        sort: { criadoEm: -1 }
      })
      console.log('fetchPedidos response:', response)
      setPedidos(response.list as unknown as Pedido[] || [])
    } catch (error: unknown) {
      console.error('Erro ao buscar pedidos:', error)
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }, [])

  const createPedido = async (pedidoData: Omit<Pedido, '_id' | 'numeroPedido' | 'criadoEm' | 'atualizadoEm'>) => {
    try {
      const numeroPedido = `PED-${Date.now().toString().slice(-6)}`
      
      const novoPedido = {
        ...pedidoData,
        numeroPedido,
        criador: 'admin',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }
      
      const pedido = await lumi.entities.pedidos.create(novoPedido) as unknown as Pedido
      setPedidos(prev => [pedido, ...prev])
      toast.success(`Pedido ${numeroPedido} criado com sucesso!`)
      return pedido
    } catch (error: unknown) {
      console.error('Erro ao criar pedido:', error)
      toast.error('Erro ao criar pedido')
      throw error
    }
  }

  const updatePedido = async (pedidoId: string, pedidoData: Partial<Pedido>) => {
    try {
      const pedidoAtualizado = await lumi.entities.pedidos.update(pedidoId, {
        ...pedidoData,
        atualizadoEm: new Date().toISOString()
      }) as unknown as Pedido
      
      setPedidos(prev => prev.map(p => p._id === pedidoId ? pedidoAtualizado : p))
      toast.success('Pedido atualizado com sucesso!')
      return pedidoAtualizado
    } catch (error: unknown) {
      console.error('Erro ao atualizar pedido:', error)
      toast.error('Erro ao atualizar pedido')
      throw error
    }
  }

  const updateStatusPedido = async (pedidoId: string, novoStatus: string, dadosAdicionais?: Record<string, unknown>) => {
    try {
      if (typeof pedidoId !== 'string') {
        throw new Error('ID do pedido deve ser uma string')
      }
      
      const updatedData: Partial<Pedido> = {
        status: novoStatus,
        atualizadoEm: new Date().toISOString(),
        ...dadosAdicionais
      }
      
      if (novoStatus === 'saiu_entrega') {
        updatedData.horarioSaidaEntrega = new Date().toISOString()
      } else if (novoStatus === 'entregue') {
        updatedData.horarioEntrega = new Date().toISOString()
      }
      
      const pedidoAtualizado = await api.updatePedidoStatus(pedidoId, novoStatus) as unknown as Pedido
      setPedidos(prev => prev.map(p => p._id === pedidoId ? pedidoAtualizado : p))
      
      const statusTexto = {
        'pendente': 'Pendente',
        'confirmado': 'Confirmado',
        'em_andamento': 'Em Andamento',
        'preparando': 'Em Preparo',
        'pronto': 'Pronto',
        'saiu_entrega': 'Saiu para Entrega',
        'entregue': 'Entregue',
        'cancelado': 'Cancelado'
      }
      
      toast.success(`Status atualizado para: ${statusTexto[novoStatus as keyof typeof statusTexto]}`)
      return pedidoAtualizado
    } catch (error: unknown) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status do pedido')
      throw error
    }
  }

  const deletePedido = async (pedidoId: string) => {
    try {
      if (typeof pedidoId !== 'string') {
        throw new Error('ID do pedido deve ser uma string')
      }
      
      // fallback: remove does not exist, so we patch with a "deleted" flag
      await lumi.entities.pedidos.update(pedidoId, { deleted: true, atualizadoEm: new Date().toISOString() })
      setPedidos(prev => prev.filter(p => p._id !== pedidoId))
      toast.success('Pedido excluído com sucesso!')
    } catch (error: unknown) {
      console.error('Erro ao excluir pedido:', error)
      toast.error('Erro ao excluir pedido')
      throw error
    }
  }

  const getPedidosPorStatus = useCallback((status: string) => {
    return pedidos.filter(pedido => pedido.status === status)
  }, [pedidos])

  const calcularEstatisticas = useCallback(() => {
    const hoje = new Date().toISOString().split('T')[0]
    const pedidosHoje = pedidos.filter(p => p.criadoEm.startsWith(hoje))
    
    return {
      totalPedidos: pedidos.length,
      pedidosHoje: pedidosHoje.length,
      faturamentoHoje: pedidosHoje.reduce((acc, p) => acc + p.total, 0),
      pedidosAtivos: pedidos.filter(p => !['entregue', 'cancelado'].includes(p.status)).length
    }
  }, [pedidos])

  useEffect(() => {
    fetchPedidos()
  }, [fetchPedidos])

  return {
    pedidos,
    loading,
    fetchPedidos,
    createPedido,
    updatePedido,
    updateStatusPedido,
    deletePedido,
    getPedidosPorStatus,
    calcularEstatisticas
  }
}
