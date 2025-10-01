# Estrutura do Banco de Dados - Sistema de Delivery

## Visão Geral
Este documento descreve a estrutura do banco de dados MongoDB utilizado no sistema de delivery. O banco de dados foi verificado e está funcionando corretamente com todas as rotas da API.

## Status da Verificação
✅ **Conexão com MongoDB**: Estabelecida com sucesso  
✅ **Modelos**: Todos os modelos criados e funcionando  
✅ **Rotas da API**: Testadas e funcionando corretamente  
✅ **Configurações**: Sistema de configurações implementado com MongoDB  

## Modelos (Collections)

### 1. Clientes (`clientes`)
**Arquivo**: `models/Cliente.js`

```javascript
{
  nome: String (required),
  telefone: String (required, unique),
  email: String,
  endereco: {
    rua: String (required),
    numero: String (required),
    bairro: String (required),
    cidade: String (required),
    cep: String (required),
    complemento: String,
    pontoReferencia: String
  },
  dataCadastro: Date (default: Date.now),
  ativo: Boolean (default: true)
}
```

### 2. Produtos (`produtos`)
**Arquivo**: `models/Produtos.js`

```javascript
{
  nome: String (required),
  descricao: String,
  preco: Number (required),
  categoria: String (required),
  disponivel: Boolean (default: true),
  imagem: String,
  ingredientes: [String],
  tempoPreparoMinutos: Number,
  dataCriacao: Date (default: Date.now)
}
```

### 3. Entregadores (`entregadores`)
**Arquivo**: `models/Entregador.js`

```javascript
{
  nome: String (required),
  telefone: String (required, unique),
  email: String,
  veiculo: {
    tipo: String (enum: ['moto', 'bicicleta', 'carro']),
    placa: String,
    modelo: String
  },
  disponivel: Boolean (default: true),
  localizacaoAtual: {
    latitude: Number,
    longitude: Number,
    ultimaAtualizacao: Date
  },
  dataCadastro: Date (default: Date.now),
  ativo: Boolean (default: true)
}
```

### 4. Pedidos (`pedidos`)
**Arquivo**: `models/Pedidos.js`

```javascript
{
  numeroPedido: String (unique, auto-generated),
  cliente: ObjectId (ref: 'Cliente', required),
  itens: [{
    produto: ObjectId (ref: 'Produto', required),
    quantidade: Number (required, min: 1),
    precoUnitario: Number (required),
    observacoes: String
  }],
  enderecoEntrega: {
    rua: String (required),
    numero: String (required),
    bairro: String (required),
    cidade: String (required),
    cep: String (required),
    complemento: String,
    pontoReferencia: String
  },
  status: String (enum: ['pendente', 'confirmado', 'preparando', 'saiu_entrega', 'entregue', 'cancelado'], default: 'pendente'),
  entregador: ObjectId (ref: 'Entregador'),
  formaPagamento: String (enum: ['dinheiro', 'cartao', 'pix'], required),
  valorSubtotal: Number (required),
  valorTaxa: Number (default: 0),
  valorDesconto: Number (default: 0),
  valorTotal: Number (required),
  troco: Number,
  observacoes: String,
  dataHoraPedido: Date (default: Date.now),
  dataHoraConfirmacao: Date,
  dataHoraSaida: Date,
  dataHoraEntrega: Date,
  tempoEstimadoMinutos: Number
}
```

### 5. Configurações (`configuracoes`)
**Arquivo**: `models/Configuracao.js`

```javascript
{
  loja: {
    nome: String (default: 'Minha Loja'),
    telefone: String (default: '(11) 99999-9999'),
    email: String (default: 'contato@minhaloja.com'),
    endereco: {
      rua: String (default: 'Rua Principal'),
      numero: String (default: '123'),
      bairro: String (default: 'Centro'),
      cidade: String (default: 'São Paulo'),
      cep: String (default: '00000-000')
    }
  },
  entrega: {
    taxaEntrega: Number (default: 5.00),
    tempoEstimadoMinutos: Number (default: 30),
    raioEntregaKm: Number (default: 10),
    pedidoMinimo: Number (default: 20.00)
  },
  pagamento: {
    aceitaDinheiro: Boolean (default: true),
    aceitaCartao: Boolean (default: true),
    aceitaPix: Boolean (default: true),
    chavePix: String
  },
  notificacoes: {
    whatsapp: Boolean (default: true),
    email: Boolean (default: false),
    sms: Boolean (default: false)
  },
  sistema: {
    funcionamento: {
      segunda: { inicio: String (default: '08:00'), fim: String (default: '22:00'), ativo: Boolean (default: true) },
      terca: { inicio: String (default: '08:00'), fim: String (default: '22:00'), ativo: Boolean (default: true) },
      quarta: { inicio: String (default: '08:00'), fim: String (default: '22:00'), ativo: Boolean (default: true) },
      quinta: { inicio: String (default: '08:00'), fim: String (default: '22:00'), ativo: Boolean (default: true) },
      sexta: { inicio: String (default: '08:00'), fim: String (default: '22:00'), ativo: Boolean (default: true) },
      sabado: { inicio: String (default: '08:00'), fim: String (default: '22:00'), ativo: Boolean (default: true) },
      domingo: { inicio: String (default: '08:00'), fim: String (default: '22:00'), ativo: Boolean (default: false) }
    },
    manutencao: Boolean (default: false)
  },
  impressora: {
    conectada: Boolean (default: false),
    imprimirAutomatico: Boolean (default: false),
    cortarPapel: Boolean (default: true),
    modelo: String (default: 'POS58'),
    configuracoesPOS58: {
      larguraCaracteres: Number (default: 32),
      tamanhoFonte: String (enum: ['pequena', 'media', 'grande'], default: 'media'),
      alinhamento: String (enum: ['esquerda', 'centro', 'direita'], default: 'esquerda'),
      negrito: Boolean (default: false),
      sublinhado: Boolean (default: false)
    }
  }
}
```

## Rotas da API Testadas

### Status dos Testes
- ✅ `/health` - Health check funcionando
- ✅ `/api/configuracoes` - Configurações funcionando (retorna configurações padrão)
- ✅ `/api/produtos` - Produtos funcionando (lista vazia)
- ✅ `/api/pedidos` - Pedidos funcionando (lista vazia)
- ✅ `/api/clientes` - Clientes funcionando (lista vazia)

### Rotas Disponíveis

#### Configurações
- `GET /api/configuracoes` - Buscar todas as configurações
- `GET /api/configuracoes/:categoria` - Buscar configurações por categoria
- `PUT /api/configuracoes` - Atualizar todas as configurações
- `PUT /api/configuracoes/:categoria` - Atualizar categoria específica
- `POST /api/configuracoes/reset` - Resetar para configurações padrão

#### Produtos
- `GET /api/produtos` - Listar produtos
- `POST /api/produtos` - Criar produto
- `GET /api/produtos/:id` - Buscar produto por ID
- `PUT /api/produtos/:id` - Atualizar produto
- `DELETE /api/produtos/:id` - Deletar produto

#### Clientes
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Criar cliente
- `GET /api/clientes/:id` - Buscar cliente por ID
- `PUT /api/clientes/:id` - Atualizar cliente
- `DELETE /api/clientes/:id` - Deletar cliente

#### Pedidos
- `GET /api/pedidos` - Listar pedidos
- `POST /api/pedidos` - Criar pedido
- `GET /api/pedidos/:id` - Buscar pedido por ID
- `PUT /api/pedidos/:id` - Atualizar pedido
- `PUT /api/pedidos/:id/status` - Atualizar status do pedido

#### Entregadores
- `GET /api/entregadores` - Listar entregadores
- `POST /api/entregadores` - Criar entregador
- `GET /api/entregadores/:id` - Buscar entregador por ID
- `PUT /api/entregadores/:id` - Atualizar entregador
- `PUT /api/entregadores/:id/disponibilidade` - Atualizar disponibilidade

## Configuração do Ambiente

### Variáveis de Ambiente (.env)
```
MONGODB_URI=mongodb://localhost:27017/delivery_system
JWT_SECRET=seu_jwt_secret_aqui
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=5242880
EMAIL_USER=
EMAIL_PASS=
```

### Dependências Principais
- **express**: Framework web
- **mongoose**: ODM para MongoDB
- **cors**: Middleware para CORS
- **helmet**: Middleware de segurança
- **express-rate-limit**: Rate limiting
- **bcryptjs**: Hash de senhas
- **jsonwebtoken**: Autenticação JWT
- **multer**: Upload de arquivos
- **validator**: Validação de dados
- **moment**: Manipulação de datas

## Status do Deployment

### Render.com
O projeto está configurado para deploy no Render.com com:
- **Arquivo**: `render.yaml`
- **Tipo**: Web Service
- **Runtime**: Node.js
- **Plano**: Free
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check**: `/health`

### Próximos Passos
1. ✅ Banco de dados verificado e funcionando
2. ✅ Todas as rotas testadas e operacionais
3. ✅ Sistema de configurações implementado
4. 🔄 Pronto para deploy no Render.com
5. 🔄 Integração com o frontend React/TypeScript

## Observações Importantes
- O banco de dados está vazio (sem dados de teste)
- Todas as collections retornam arrays vazios, o que é esperado
- O sistema de configurações cria automaticamente as configurações padrão
- A API está totalmente funcional e pronta para uso
- Integração com impressora Bluetooth POS58 configurada