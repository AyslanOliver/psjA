const mongoose = require('mongoose');

const entregadorSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  cpf: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(v);
      },
      message: 'CPF inválido'
    }
  },
  cnh: {
    numero: String,
    categoria: {
      type: String,
      enum: ['A', 'B', 'AB']
    },
    validade: Date
  },
  veiculo: {
    tipo: {
      type: String,
      enum: ['moto', 'carro', 'bicicleta', 'a_pe'],
      required: true
    },
    placa: String,
    modelo: String,
    cor: String
  },
  endereco: {
    rua: String,
    numero: String,
    bairro: String,
    cidade: String,
    cep: String
  },
  status: {
    type: String,
    enum: ['disponivel', 'ocupado', 'offline'],
    default: 'offline'
  },
  ativo: {
    type: Boolean,
    default: true
  },
  disponivel: {
    type: Boolean,
    default: true
  },
  avaliacaoMedia: {
    type: Number,
    default: 5,
    min: 0,
    max: 5
  },
  totalEntregas: {
    type: Number,
    default: 0
  },
  comissao: {
    type: Number,
    default: 2.00
  },
  dataAdmissao: {
    type: Date,
    default: Date.now
  },
  observacoes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Entregador', entregadorSchema);
