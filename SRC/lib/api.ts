// Configuração da API
declare const process: { env: { NODE_ENV?: string, VITE_MODE?: string } };
import { localDB } from './localDatabase';

// Verifica se estamos no ambiente Cordova
const isCordova = () => {
  return typeof window !== 'undefined' && window.document && (
    document.URL.indexOf('http://') === -1 && 
    document.URL.indexOf('https://') === -1
  );
};

// Verifica se há conexão com a internet
const isOnline = () => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

const API_BASE_URL = isCordova() || process.env.NODE_ENV === 'production'
  ? 'https://psja.onrender.com/api'  // URL do Render quando em produção ou Cordova
  : 'http://localhost:3001/api'  // API local para desenvolvimento

class ApiClient {
  private baseUrl: string
  private useLocalDB: boolean = true; // Sempre usar o banco local para evitar erros de conexão

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    // Se estamos usando o banco local e não é uma operação de sincronização
    if (this.useLocalDB && !endpoint.includes('/sync')) {
      return this.handleLocalRequest(endpoint, options);
    }

    // Caso contrário, tenta fazer a requisição online
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
      
      // Se falhar e não estamos usando o banco local, tenta usar o banco local como fallback
      if (!this.useLocalDB) {
        console.log('Tentando usar banco de dados local como fallback...');
        return this.handleLocalRequest(endpoint, options);
      }
      
      throw error
    }
  }
  
  // Manipula requisições localmente usando IndexedDB
  private async handleLocalRequest(endpoint: string, options: RequestInit = {}) {
    console.log(`Usando banco de dados local para: ${endpoint}`);
    const method = options.method || 'GET';
    
    try {
      // Extrai o tipo de recurso do endpoint (produtos, pedidos, etc.)
      // Remover a barra inicial se existir
      const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
      const parts = path.split('/');
      const resourceType = parts[0]; // primeiro segmento após remover a barra
      const resourceId = parts.length > 1 ? parts[1] : undefined;
      
      // Verificar se o resourceType é válido
      if (!resourceType) {
        throw new Error(`Tipo de recurso não especificado no endpoint: ${endpoint}`);
      }
      
      // Mapear o tipo de recurso para o nome da store no IndexedDB
      let storeName: string;
      switch (resourceType) {
        case 'produtos':
          storeName = 'produtos';
          break;
        case 'clientes':
          storeName = 'clientes';
          break;
        case 'pedidos':
          storeName = 'pedidos';
          break;
        case 'entregadores':
          storeName = 'entregadores';
          break;
        case 'configuracoes':
          storeName = 'configuracoes';
          break;
        default:
          throw new Error(`Tipo de recurso não suportado: ${resourceType}`);
      }
      
      // GET - Buscar dados
      if (method === 'GET') {
        if (resourceId) {
          // Buscar um item específico
          const item = await localDB.get(storeName as any, resourceId);
          if (!item) {
            throw new Error(`Item não encontrado: ${resourceType}/${resourceId}`);
          }
          return item;
        } else {
          // Buscar todos os itens
          const items = await localDB.getAll(storeName as any);
          // Formatar a resposta de acordo com o tipo de recurso
          switch (resourceType) {
            case 'produtos':
              return { produtos: items, total: items.length };
            case 'clientes':
              return { clientes: items, total: items.length };
            case 'pedidos':
              return { pedidos: items, total: items.length };
            case 'entregadores':
              return { entregadores: items, total: items.length };
            case 'configuracoes':
              return items.length > 0 ? items[0] : {};
            default:
              return { items, total: items.length };
          }
        }
      }
      // POST - Criar novo item
      else if (method === 'POST') {
        let data;
        try {
          data = JSON.parse(options.body as string);
        } catch (e) {
          throw new Error(`Erro ao analisar o corpo da requisição: ${e.message}`);
        }
        
        if (!data._id) {
          data._id = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }
        
        await localDB.put(storeName as any, data);
        return data;
      }
      // PUT/PATCH - Atualizar item existente
      else if (method === 'PUT' || method === 'PATCH') {
        if (!resourceId) {
          throw new Error(`ID não especificado para atualização: ${endpoint}`);
        }
        
        let data;
        try {
          data = JSON.parse(options.body as string);
        } catch (e) {
          throw new Error(`Erro ao analisar o corpo da requisição: ${e.message}`);
        }
        
        const existingItem = await localDB.get(storeName as any, resourceId);
        if (!existingItem) {
          throw new Error(`Item não encontrado para atualização: ${resourceType}/${resourceId}`);
        }
        
        const updatedItem = { ...existingItem, ...data };
        await localDB.put(storeName as any, updatedItem);
        return updatedItem;
      }
      // DELETE - Remover item
      else if (method === 'DELETE') {
        if (!resourceId) {
          throw new Error(`ID não especificado para exclusão: ${endpoint}`);
        }
        
        await localDB.delete(storeName as any, resourceId);
        return { success: true, message: `Item ${resourceId} excluído com sucesso` };
      }
      
      throw new Error(`Operação local não suportada: ${method} ${endpoint}`);
    } catch (error) {
      console.error(`Erro na operação local ${endpoint}:`, error);
      // Retornar um objeto de erro formatado em vez de lançar uma exceção
      return { 
        error: true, 
        message: error.message || 'Erro desconhecido na operação local',
        endpoint,
        method
      };
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
  
  // Sincronização de produtos com o banco local
  async sincronizarProdutos() {
    try {
      // Tenta buscar produtos da API remota
      const response = await fetch(`${this.baseUrl}/produtos`)
      if (response.ok) {
        const data = await response.json()
        if (data.produtos && Array.isArray(data.produtos)) {
          // Salva os produtos no banco local
          await localDB.sincronizarProdutos(data.produtos)
          console.log(`Sincronizados ${data.produtos.length} produtos com o banco local`)
          return data.produtos
        }
      }
      throw new Error('Falha ao sincronizar produtos')
    } catch (error) {
      console.error('Erro ao sincronizar produtos:', error)
      // Retorna os produtos do banco local em caso de erro
      const produtosLocais = await localDB.getAll('produtos')
      return produtosLocais
    }
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

  async deletePedido(id: string) {
    return this.request(`/pedidos/${id}`, {
      method: 'DELETE',
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

  async updateCliente(id: string, cliente: any) {
    return this.request(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cliente),
    })
  }

  async deleteCliente(id: string) {
    return this.request(`/clientes/${id}`, {
      method: 'DELETE',
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