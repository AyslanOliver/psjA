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

// Middleware para atualizar contador de entregas do entregador
pedidoSchema.post('save', async function(doc) {
  // Se o status mudou para 'entregue' e há um entregador associado
  if (doc.status === 'entregue' && doc.entregador) {
    try {
      const Entregador = mongoose.model('Entregador');
      
      // Conta o total de entregas realizadas por este entregador
      const totalEntregas = await mongoose.model('Pedido').countDocuments({
        entregador: doc.entregador,
        status: 'entregue'
      });
      
      // Atualiza o campo totalEntregas no entregador
      await Entregador.findByIdAndUpdate(doc.entregador, {
        totalEntregas: totalEntregas
      });
      
      console.log(`Contador de entregas atualizado para entregador ${doc.entregador}: ${totalEntregas} entregas`);
    } catch (error) {
      console.error('Erro ao atualizar contador de entregas:', error);
    }
  }
});

// Middleware para atualizar contador quando status muda via findOneAndUpdate
pedidoSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.status === 'entregue' && doc.entregador) {
    try {
      const Entregador = mongoose.model('Entregador');
      
      // Conta o total de entregas realizadas por este entregador
      const totalEntregas = await mongoose.model('Pedido').countDocuments({
        entregador: doc.entregador,
        status: 'entregue'
      });
      
      // Atualiza o campo totalEntregas no entregador
      await Entregador.findByIdAndUpdate(doc.entregador, {
        totalEntregas: totalEntregas
      });
      
      console.log(`Contador de entregas atualizado para entregador ${doc.entregador}: ${totalEntregas} entregas`);
    } catch (error) {
      console.error('Erro ao atualizar contador de entregas:', error);
    }
  }
});

// Virtual field para compatibilidade com frontend
pedidoSchema.virtual('total').get(function() {
  return this.valorTotal;
});

// Garantir que virtuals sejam incluídos no JSON
pedidoSchema.set('toJSON', { virtuals: true });
pedidoSchema.set('toObject', { virtuals: true });

// Método para calcular valor total
pedidoSchema.methods.calcularTotal = function() {
  this.valorSubtotal = this.items.reduce((total, item) => {
    return total + (item.preco * item.quantidade);
  }, 0);
  this.valorTotal = this.valorSubtotal + this.taxaEntrega;
  return this.valorTotal;
};

module.exports = mongoose.model('Pedido', pedidoSchema);
