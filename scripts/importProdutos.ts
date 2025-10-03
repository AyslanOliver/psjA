import localDB from '../SRC/lib/localDatabase';
import { importDataToLocalDB } from '../SRC/lib/importDatabase';
import produtosData from '../pastelaria.produtos.json';

interface ProdutoMongoDB {
  _id: { $oid: string };
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  temVariacoes: boolean;
  imagem: string;
  disponivel: boolean;
  destaque: boolean;
  ingredientes: string[];
  alergicos: string[];
  tempoPreparacao: number;
  tamanhos: any[];
  createdAt: { $date: string };
  updatedAt: { $date: string };
  __v: number;
}

interface ProdutoLocal {
  _id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  temVariacoes: boolean;
  imagem: string;
  disponivel: boolean;
  destaque: boolean;
  ingredientes: string[];
  alergicos: string[];
  tempoPreparacao: number;
  tamanhos: any[];
  createdAt: string;
  updatedAt: string;
}

function transformarProduto(produto: ProdutoMongoDB): ProdutoLocal {
  return {
    _id: produto._id.$oid,
    nome: produto.nome,
    descricao: produto.descricao,
    preco: produto.preco,
    categoria: produto.categoria,
    temVariacoes: produto.temVariacoes,
    imagem: produto.imagem,
    disponivel: produto.disponivel,
    destaque: produto.destaque,
    ingredientes: produto.ingredientes,
    alergicos: produto.alergicos,
    tempoPreparacao: produto.tempoPreparacao,
    tamanhos: produto.tamanhos,
    createdAt: produto.createdAt.$date,
    updatedAt: produto.updatedAt.$date
  };
}

export async function importarProdutos(): Promise<{ sucesso: boolean; total?: number; erro?: string }> {
  try {
    console.log('Iniciando importação de produtos...');
    
    // Transformar produtos para o formato local
    const produtosTransformados = produtosData.map(transformarProduto);
    
    // Usar a função corrigida de importação
    await importDataToLocalDB(produtosTransformados, 'produtos');
    
    console.log(`${produtosTransformados.length} produtos importados com sucesso!`);
    
    return {
      sucesso: true,
      total: produtosTransformados.length
    };
  } catch (error) {
    console.error('Erro ao importar produtos:', error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Função para executar a importação diretamente
export async function executarImportacao() {
  const resultado = await importarProdutos();
  
  if (resultado.sucesso) {
    console.log(`✅ Importação concluída! ${resultado.total} produtos importados.`);
  } else {
    console.error(`❌ Erro na importação: ${resultado.erro}`);
  }
  
  return resultado;
}