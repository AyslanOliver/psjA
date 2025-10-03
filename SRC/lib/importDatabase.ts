import { localDB } from './localDatabase';

/**
 * Função para importar dados de arquivos JSON para o banco de dados local
 * @param jsonData Objeto contendo os dados a serem importados
 * @param collectionName Nome da coleção (produtos, clientes, pedidos, entregadores, configuracoes)
 */
export async function importDataToLocalDB(jsonData: any[], collectionName: string): Promise<void> {
  try {
    console.log(`Importando ${jsonData.length} itens para ${collectionName}...`);
    
    // Limpar a coleção atual antes de importar novos dados
    await clearCollection(collectionName as keyof any);
    
    // Importar cada item para a coleção
    for (const item of jsonData) {
      switch (collectionName) {
        case 'produtos':
          await createProduto(item);
          break;
        case 'clientes':
          await createCliente(item);
          break;
        case 'pedidos':
          await createPedido(item);
          break;
        case 'entregadores':
          await createEntregador(item);
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
    console.log(`Limpando coleção ${collectionName}...`);
    await clearCollection(collectionName as keyof any);
    console.log(`Coleção ${collectionName} limpa com sucesso!`);
  } catch (error) {
    console.error(`Erro ao limpar coleção ${collectionName}:`, error);
    throw error;
  }
}

// Implementar métodos auxiliares usando a estrutura correta do localDB
async function clearCollection(storeName: keyof any): Promise<void> {
  await localDB.clear(storeName);
}

async function createEntregador(entregador: any): Promise<void> {
  await localDB.add('entregadores', entregador);
}

async function createProduto(produto: any): Promise<void> {
  await localDB.add('produtos', produto);
}

async function createCliente(cliente: any): Promise<void> {
  await localDB.add('clientes', cliente);
}

async function createPedido(pedido: any): Promise<void> {
  await localDB.add('pedidos', pedido);
}