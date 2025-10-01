
# API do Sistema de Delivery

API completa para sistema de delivery desenvolvida em Node.js + Express + MongoDB.

## 🚀 Características

- **CRUD completo** para pedidos, produtos, clientes e entregadores
- **Autenticação JWT** para segurança
- **Relatórios detalhados** de vendas e performance
- **Configurações flexíveis** do sistema
- **Validações robustas** de dados
- **Paginação** em todas as listagens
- **Filtros avançados** de busca
- **Estatísticas em tempo real**

## 📦 Instalação Local

```bash
# Clone o repositório
git clone <seu-repositorio>
cd api

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Execute em desenvolvimento
npm run dev

# Execute em produção
npm start
```

## 🌐 Deploy no Render (GRATUITO)

### 1. Preparação

1. Faça upload do código para GitHub
2. Acesse [render.com](https://render.com) e crie uma conta
3. Conecte sua conta GitHub

### 2. Configuração do Banco MongoDB

**Opção 1: MongoDB Atlas (Recomendado - Gratuito)**
1. Acesse [mongodb.com/atlas](https://mongodb.com/atlas)
2. Crie conta gratuita (512MB grátis)
3. Crie cluster gratuito
4. Configure usuário e senha
5. Obtenha string de conexão

**Opção 2: MongoDB no Render**
1. No Render, crie novo serviço PostgreSQL (ou use MongoDB externo)

### 3. Deploy da API

1. No Render, clique "New +" → "Web Service"
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: `delivery-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. Adicione variáveis de ambiente:
   ```
   NODE_ENV=production
   MONGODB_URI=sua_string_mongodb_atlas
   JWT_SECRET=sua_chave_secreta_forte
   FRONTEND_URL=https://seu-frontend.vercel.app
   ```

5. Clique "Create Web Service"

### 4. Configuração Final

Após deploy, sua API estará disponível em:
```
https://delivery-api-xxx.onrender.com
```

## 🔧 Configuração do Frontend

No seu frontend React, configure a URL da API:

```typescript
// src/config/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://delivery-api-xxx.onrender.com/api'
  : 'http://localhost:3001/api';

export default API_BASE_URL;
```

## 📚 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login do usuário
- `GET /api/auth/verify` - Verificar token

### Pedidos
- `GET /api/pedidos` - Listar pedidos
- `POST /api/pedidos` - Criar pedido
- `GET /api/pedidos/:id` - Buscar pedido
- `PATCH /api/pedidos/:id/status` - Atualizar status
- `DELETE /api/pedidos/:id` - Deletar pedido

### Produtos
- `GET /api/produtos` - Listar produtos
- `POST /api/produtos` - Criar produto
- `PUT /api/produtos/:id` - Atualizar produto
- `DELETE /api/produtos/:id` - Deletar produto

### Clientes
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Criar cliente
- `PUT /api/clientes/:id` - Atualizar cliente
- `DELETE /api/clientes/:id` - Deletar cliente

### Entregadores
- `GET /api/entregadores` - Listar entregadores
- `POST /api/entregadores` - Criar entregador
- `PUT /api/entregadores/:id` - Atualizar entregador
- `PATCH /api/entregadores/:id/status` - Alterar status

### Relatórios
- `GET /api/relatorios/vendas` - Relatório de vendas
- `GET /api/relatorios/produtos-vendidos` - Produtos mais vendidos
- `GET /api/relatorios/clientes` - Relatório de clientes
- `GET /api/relatorios/dashboard` - Dashboard resumo

### Configurações
- `GET /api/configuracoes` - Buscar configurações
- `PUT /api/configuracoes` - Atualizar configurações

## 🔐 Autenticação

Todas as rotas (exceto login) requerem token JWT:

```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

**Usuário padrão:**
- Email: `admin@delivery.com`
- Senha: `password`

## 💡 Alternativas Gratuitas ao Render

### 1. **Railway** (Recomendado)
- 500 horas grátis/mês
- Deploy automático via GitHub
- PostgreSQL gratuito incluído

### 2. **Vercel** (Para APIs simples)
- Unlimited deployments
- Serverless functions
- Ideal para Next.js API routes

### 3. **Heroku**
- 550 horas grátis/mês
- Postgres gratuito (10k rows)
- Dorme após 30min inativo

### 4. **Cyclic**
- Unlimited apps
- Deploy via GitHub
- DynamoDB gratuito

### 5. **Fly.io**
- 2,340 horas grátis/mês
- 3GB storage gratuito
- Deploy via Docker

## 📱 Próximos Passos

1. **Deploy da API no Render**
2. **Configurar MongoDB Atlas**
3. **Atualizar frontend para usar API**
4. **Testar todas as funcionalidades**
5. **Configurar domínio personalizado (opcional)**

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Helmet** - Segurança
- **CORS** - Cross-origin requests

## 📞 Suporte

Para dúvidas sobre deploy ou configuração, consulte:
- [Documentação do Render](https://render.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/)
