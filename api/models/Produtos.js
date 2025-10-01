
const mongoose = require('mongoose');

// Schema para variações de tamanho (especialmente para pizzas)
const tamanhoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true // Ex: "Pequena", "Média", "Grande", "Família"
  },
  preco: {
    type: Number,
    required: true,
    min: 0
  },
  descricao: String // Ex: "25cm", "30cm", "35cm", "40cm"
}, { _id: false });

const produtoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  descricao: {
    type: String,
    required: true
  },
  preco: {
    type: Number,
    required: true,
    min: 0
  },
  categoria: {
    type: String,
    required: true,
    enum: ['pizzas', 'pasteis', 'lanches_na_chapa', 'salgados', 'bolo', 'bebidas']
  },
  // Campos específicos para pizzas e produtos com variações
  sabor: {
    type: String, // Ex: "Margherita", "Calabresa", "Portuguesa"
    trim: true
  },
  tamanhos: [tamanhoSchema], // Array de tamanhos com preços diferentes
  temVariacoes: {
    type: Boolean,
    default: false // true para pizzas que têm tamanhos diferentes
  },
  disponivel: {
    type: Boolean,
    default: true
  },
  destaque: {
    type: Boolean,
    default: false
  },
  ingredientes: [String],
  alergicos: [String],
  tempoPreparacao: {
    type: Number,
    default: 15
  },
  calorias: Number,
  peso: String
}, {
  timestamps: true
});

// Índices para busca
produtoSchema.index({ nome: 'text', descricao: 'text' });
produtoSchema.index({ categoria: 1, disponivel: 1 });

module.exports = mongoose.model('Produto', produtoSchema);
