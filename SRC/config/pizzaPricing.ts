// Configuração de preços automáticos para pizzas
export interface TamanhoPizza {
  nome: string;
  preco: number;
  descricao?: string;
}

export interface PrecoPizza {
  tamanhos: TamanhoPizza[];
  saboresEspeciais: string[];
  precosEspeciais: {
    [tamanho: string]: number;
  };
}

export const PIZZA_PRICING_CONFIG: PrecoPizza = {
  // Tamanhos e valores padrão
  tamanhos: [
    { nome: 'Brotinho (N15)', preco: 9.00, descricao: '15cm' },
    { nome: 'Brotão (N20)', preco: 12.00, descricao: '20cm' },
    { nome: 'Pequena (N25)', preco: 25.00, descricao: '25cm' },
    { nome: 'Média (N15)', preco: 38.00, descricao: '30cm' },
    { nome: 'Grande (N30)', preco: 45.00, descricao: '35cm' },
    { nome: 'Família (N40)', preco: 55.00, descricao: '40cm' }
  ],
  
  // Sabores que têm preços especiais
  saboresEspeciais: [
    'Atum',
    'Bacon'
  ],
  
  // Preços especiais para sabores Atum e Bacon
  precosEspeciais: {
    'Média (N15)': 45.00,
    'Grande (N30)': 55.00,
    'Família (N40)': 60.00
  }
};

// Lista completa de sabores disponíveis
export const SABORES_DISPONIVEIS = [
  // Pizzas Tradicionais (conforme cardápio)
  'Baiana',
  'Frango c/ Catupiry',
  'Mineira',
  'Calabresa',
  'Mista',
  'Portuguesa',
  'Frango',
  'Milho Verde',
  'Presunto',
  
  // Pizzas Especiais (preços diferenciados)
  'Atum',
  'Bacon'
];

// Função para obter o preço de uma pizza baseado no tamanho e sabor
export const getPizzaPrice = (tamanho: string, sabor?: string): number => {
  // Normalizar o nome do tamanho (remover descrições extras)
  const tamanhoNormalizado = tamanho.includes('(') 
    ? tamanho.split('(')[0].trim() 
    : tamanho;

  // Verificar se é sabor especial e se tem preço especial para este tamanho
  if (sabor && PIZZA_PRICING_CONFIG.saboresEspeciais.includes(sabor)) {
    const precoEspecial = PIZZA_PRICING_CONFIG.precosEspeciais[tamanhoNormalizado];
    if (precoEspecial) {
      return precoEspecial;
    }
  }

  // Buscar preço padrão pelo tamanho
  const tamanhoConfig = PIZZA_PRICING_CONFIG.tamanhos.find(t => 
    t.nome.includes(tamanhoNormalizado) || tamanhoNormalizado.includes(t.nome.split('(')[0].trim())
  );

  return tamanhoConfig ? tamanhoConfig.preco : 0;
};

// Função para verificar se um sabor é especial
export const isSaborEspecial = (sabor: string): boolean => {
  return PIZZA_PRICING_CONFIG.saboresEspeciais.includes(sabor);
};

// Função para obter todos os tamanhos disponíveis
export const getTamanhosDisponiveis = (): TamanhoPizza[] => {
  return PIZZA_PRICING_CONFIG.tamanhos;
};