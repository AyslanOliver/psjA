const mongoose = require('mongoose');
const validator = require('validator');

const enderecoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  rua: {
    type: String,
    required: true
  },
  numero: {
    type: String,
    required: true
  },
  complemento: String,
  bairro: {
    type: String,
    required: true
  },
  cidade: String,
  cep: String,
  referencia: String,
  principal: {
    type: Boolean,
    default: false
  }
});

const clienteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  telefone: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(v);
      },
      message: 'Telefone inválido'
    }
  },

  enderecos: [enderecoSchema],
  ativo: {
    type: Boolean,
    default: true
  },
  totalPedidos: {
    type: Number,
    default: 0
  },
  valorTotalGasto: {
    type: Number,
    default: 0
  },
  ultimoPedido: Date,
  observacoes: String
}, {
  timestamps: true
});

// Middleware para garantir apenas um endereço principal
enderecoSchema.pre('save', async function(next) {
  if (this.principal) {
    const cliente = this.parent();
    cliente.enderecos.forEach(endereco => {
      if (endereco._id.toString() !== this._id.toString()) {
        endereco.principal = false;
      }
    });
  }
  next();
});

module.exports = mongoose.model('Cliente', clienteSchema);
