// Serviço de banco de dados local usando IndexedDB
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PizzariaDB extends DBSchema {
  produtos: {
    key: string;
    value: any;
    indexes: { 'by-categoria': string };
  };
  clientes: {
    key: string;
    value: any;
    indexes: { 'by-nome': string };
  };
  pedidos: {
    key: string;
    value: any;
    indexes: { 'by-status': string; 'by-data': Date };
  };
  entregadores: {
    key: string;
    value: any;
    indexes: { 'by-nome': string; 'by-status': string };
  };
  configuracoes: {
    key: string;
    value: any;
  };
}

class LocalDatabase {
  private dbPromise: Promise<IDBPDatabase<PizzariaDB>>;
  private dbName = 'pizzaria-local-db';
  private dbVersion = 1;

  constructor() {
    this.dbPromise = this.initDatabase();
  }

  private async initDatabase() {
    return openDB<PizzariaDB>(this.dbName, this.dbVersion, {
      upgrade(db) {
        // Produtos
        if (!db.objectStoreNames.contains('produtos')) {
          const produtosStore = db.createObjectStore('produtos', { keyPath: '_id' });
          produtosStore.createIndex('by-categoria', 'categoria');
        }

        // Clientes
        if (!db.objectStoreNames.contains('clientes')) {
          const clientesStore = db.createObjectStore('clientes', { keyPath: '_id' });
          clientesStore.createIndex('by-nome', 'nome');
        }

        // Pedidos
        if (!db.objectStoreNames.contains('pedidos')) {
          const pedidosStore = db.createObjectStore('pedidos', { keyPath: '_id' });
          pedidosStore.createIndex('by-status', 'status');
          pedidosStore.createIndex('by-data', 'createdAt');
        }

        // Entregadores
        if (!db.objectStoreNames.contains('entregadores')) {
          const entregadoresStore = db.createObjectStore('entregadores', { keyPath: '_id' });
          entregadoresStore.createIndex('by-nome', 'nome');
          entregadoresStore.createIndex('by-status', 'status');
        }

        // Configurações
        if (!db.objectStoreNames.contains('configuracoes')) {
          db.createObjectStore('configuracoes', { keyPath: 'id' });
        }
      }
    });
  }

  // Métodos genéricos CRUD
  async getAll(storeName: keyof PizzariaDB) {
    const db = await this.dbPromise;
    return db.getAll(storeName);
  }

  async get(storeName: keyof PizzariaDB, id: string) {
    const db = await this.dbPromise;
    return db.get(storeName, id);
  }

  async add(storeName: keyof PizzariaDB, item: any) {
    const db = await this.dbPromise;
    return db.add(storeName, item);
  }

  async put(storeName: keyof PizzariaDB, item: any) {
    const db = await this.dbPromise;
    return db.put(storeName, item);
  }

  async delete(storeName: keyof PizzariaDB, id: string) {
    const db = await this.dbPromise;
    return db.delete(storeName, id);
  }

  async clear(storeName: keyof PizzariaDB) {
    const db = await this.dbPromise;
    return db.clear(storeName);
  }

  // Métodos específicos para produtos
  async getProdutosByCategoria(categoria: string) {
    const db = await this.dbPromise;
    return db.getAllFromIndex('produtos', 'by-categoria', categoria);
  }

  // Métodos específicos para pedidos
  async getPedidosByStatus(status: string) {
    const db = await this.dbPromise;
    return db.getAllFromIndex('pedidos', 'by-status', status);
  }

  // Métodos de sincronização
  async sincronizarProdutos(produtos: any[]) {
    const db = await this.dbPromise;
    const tx = db.transaction('produtos', 'readwrite');
    await Promise.all([
      ...produtos.map(produto => tx.store.put(produto)),
      tx.done
    ]);
    return true;
  }

  async sincronizarClientes(clientes: any[]) {
    const db = await this.dbPromise;
    const tx = db.transaction('clientes', 'readwrite');
    await Promise.all([
      ...clientes.map(cliente => tx.store.put(cliente)),
      tx.done
    ]);
    return true;
  }

  async sincronizarPedidos(pedidos: any[]) {
    const db = await this.dbPromise;
    const tx = db.transaction('pedidos', 'readwrite');
    await Promise.all([
      ...pedidos.map(pedido => tx.store.put(pedido)),
      tx.done
    ]);
    return true;
  }

  async salvarConfiguracoes(configuracoes: any) {
    const db = await this.dbPromise;
    return db.put('configuracoes', { ...configuracoes, id: 'app-config' });
  }

  async getConfiguracoes() {
    const db = await this.dbPromise;
    return db.get('configuracoes', 'app-config');
  }
}

export const localDB = new LocalDatabase();
export default localDB;