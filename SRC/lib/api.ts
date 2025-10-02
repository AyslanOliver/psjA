// Configuração da API local
declare const process: { env: { NODE_ENV?: string } }; const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://delivery-api-xxx.onrender.com/api'  // URL do Render quando em produção
  : '/api'  // API local via proxy do Vite

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Erro na requisição ${endpoint}:`, error)
      throw error
    }
  }

  // Produtos
  async getProdutos(params: any = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/produtos${queryString ? `?${queryString}` : ''}`
    return this.request(endpoint)
  }

  async createProduto(produto: any) {
    return this.request('/produtos', {
      method: 'POST',
      body: JSON.stringify(produto),
    })
  }

  async updateProduto(id: string, produto: any) {
    return this.request(`/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(produto),
    })
  }

  async deleteProduto(id: string) {
    return this.request(`/produtos/${id}`, {
      method: 'DELETE',
    })
  }

  // Pedidos
  async getPedidos(params: any = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/pedidos${queryString ? `?${queryString}` : ''}`
    return this.request(endpoint)
  }

  async createPedido(pedido: any) {
    return this.request('/pedidos', {
      method: 'POST',
      body: JSON.stringify(pedido),
    })
  }

  async updatePedido(id: string, pedido: any) {
    return this.request(`/pedidos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pedido),
    })
  }

  async updatePedidoStatus(id: string, status: string) {
    return this.request(`/pedidos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  // Clientes
  async getClientes(params: any = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/clientes${queryString ? `?${queryString}` : ''}`
    return this.request(endpoint)
  }

  async createCliente(cliente: any) {
    return this.request('/clientes', {
      method: 'POST',
      body: JSON.stringify(cliente),
    })
  }

  // Entregadores
  async getEntregadores(params: any = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/entregadores${queryString ? `?${queryString}` : ''}`
    return this.request(endpoint)
  }

  async createEntregador(entregador: any) {
    return this.request('/entregadores', {
      method: 'POST',
      body: JSON.stringify(entregador),
    })
  }

  async updateEntregador(id: string, updates: any) {
    return this.request(`/entregadores/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteEntregador(id: string) {
    return this.request(`/entregadores/${id}`, {
      method: 'DELETE',
    })
  }

  // Configurações
  async getConfiguracoes() {
    return this.request('/configuracoes')
  }

  async updateConfiguracoes(configuracoes: any) {
    return this.request('/configuracoes', {
      method: 'PUT',
      body: JSON.stringify(configuracoes),
    })
  }

  async updateConfiguracaoCategoria(categoria: string, dados: any) {
    return this.request(`/configuracoes/${categoria}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    })
  }
}

// Instância da API
export const api = new ApiClient(API_BASE_URL)



export default api