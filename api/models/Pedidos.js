const mongoose = require('mongoose');

const itemPedidoSchema = new mongoose.Schema({
  produto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produto',
    required: true
  },
  nome: {
    type: String,
    required: true
  },
  preco: {
    type: Number,
    required: true
  },
  quantidade: {
    type: Number,
    required: true,
    min: 1
  },
  observacoes: String,
  sabor: {
    type: String,
    required: false
  },
  tamanho: {
    type: String,
    required: false
  },
  tamanhoDetalhes: {
    nome: String,
    preco: Number,
    descricao: String
  }
});

const pedidoSchema = new mongoose.Schema({
  numero: {
    type: String,
    unique: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  items: [itemPedidoSchema],
  endereco: {
    rua: { type: String, required: true },
    numero: { type: String, required: true },
    complemento: String,
    referencia: String
  },
  status: {
    type: String,
    enum: ['pendente', 'em_andamento', 'confirmado', 'preparando', 'pronto', 'saiu_entrega', 'entregue', 'cancelado'],
    default: 'pendente'
  },
  entregador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entregador'
  },
  formaPagamento: {
    type: String,
    enum: ['dinheiro', 'cartao', 'pix', 'vale_refeicao'],
    required: true
  },
  valorSubtotal: {
    type: Number,
    required: true
  },
  taxaEntrega: {
    type: Number,
    default: 0
  },
  valorTotal: {
    type: Number,
    required: true
  },
  troco: Number,
  observacoes: String,
  tempoEstimado: {
    type: Number,
    default: 30
  },
  dataHora: {
    type: Date,
    default: Date.now
  },
  dataEntrega: Date
}, {
  timestamps: true
});

// Middleware para gerar número do pedido
pedidoSchema.pre('save', async function(next) {
  if (!this.numero) {
    const count = await mongoose.model('Pedido').countDocuments();
    this.numero = String(count + 1).padStart(6, '0');
  }
  next();
});

// Método para calcular valor total
pedidoSchema.methods.calcularTotal = function() {
  this.valorSubtotal = this.items.reduce((total, item) => {
    return total + (item.preco * item.quantidade);
  }, 0);
  this.valorTotal = this.valorSubtotal + this.taxaEntrega;
  return this.valorTotal;
};

module.exports = mongoose.model('Pedido', pedidoSchema);
