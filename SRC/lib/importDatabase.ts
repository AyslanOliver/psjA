import { localDB } from './localDatabase';

/**
 * Função para importar dados de arquivos JSON para o banco de dados local
 * @param jsonData Objeto contendo os dados a serem importados
 * @param collectionName Nome da coleção (produtos, clientes, pedidos, entregadores, configuracoes)
 */
export async function importDataToLocalDB(jsonData: any[], collectionName: string): Promise<void> {
  try {
    // Verificar se o banco de dados está inicializado
    await localDB.initDatabase();
    
    console.log(`Importando ${jsonData.length} itens para ${collectionName}...`);
    
    // Limpar a coleção atual antes de importar novos dados
    await localDB.clearCollection(collectionName);
    
    // Importar cada item para a coleção
    for (const item of jsonData) {
      switch (collectionName) {
        case 'produtos':
          await localDB.createProduto(item);
          break;
        case 'clientes':
          await localDB.createCliente(item);
          break;
        case 'pedidos':
          await localDB.createPedido(item);
          break;
        case 'entregadores':
          await localDB.createEntregador(item);
          break;
        case 'configuracoes':
          await localDB.salvarConfiguracoes(item);
          break;
        default:
          console.error(`Coleção não suportada: ${collectionName}`);
      }
    }
    
    console.log(`Importação para ${collectionName} concluída com sucesso!`);
  } catch (error) {
    console.error(`Erro ao importar dados para ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Função para importar dados de um arquivo JSON
 * @param file Arquivo JSON a ser importado
 * @param collectionName Nome da coleção
 */
export async function importFromJsonFile(file: File, collectionName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        if (event.target?.result) {
          const jsonData = JSON.parse(event.target.result as string);
          await importDataToLocalDB(jsonData, collectionName);
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Função auxiliar para limpar uma coleção no banco de dados local
 */
export async function clearLocalCollection(collectionName: string): Promise<void> {
  try {
    await localDB.clearCollection(collectionName);
    console.log(`Coleção ${collectionName} limpa com sucesso!`);
  } catch (error) {
    console.error(`Erro ao limpar coleção ${collectionName}:`, error);
    throw error;
  }
}

// Adicionar método para limpar coleção ao localDB
declare module './localDatabase' {
  interface PizzariaDB {
    clearCollection(storeName: string): Promise<void>;
    createEntregador(entregador: any): Promise<number>;
  }
}

// Implementar o método clearCollection no protótipo do localDB
localDB.clearCollection = async function(storeName: string): Promise<void> {
  const db = await this.getDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  await store.clear();
  await tx.done;
};

// Implementar o método createEntregador no protótipo do localDB
localDB.createEntregador = async function(entregador: any): Promise<number> {
  const db = await this.getDB();
  const tx = db.transaction('entregadores', 'readwrite');
  const store = tx.objectStore('entregadores');
  const id = await store.add(entregador);
  await tx.done;
  return id as number;
};