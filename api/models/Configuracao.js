const mongoose = require('mongoose');

const configuracaoSchema = new mongoose.Schema({
  loja: {
    nome: {
      type: String,
      required: true,
      default: 'Minha Loja'
    },
    telefone: {
      type: String,
      required: true,
      default: '(11) 99999-9999'
    },
    email: {
      type: String,
      required: true,
      default: 'contato@minhaloja.com'
    },
    endereco: {
      rua: {
        type: String,
        required: true,
        default: 'Rua Principal'
      },
      numero: {
        type: String,
        required: true,
        default: '123'
      },
      bairro: {
        type: String,
        required: true,
        default: 'Centro'
      },
      cidade: {
        type: String,
        required: true,
        default: 'São Paulo'
      },
      cep: {
        type: String,
        required: true,
        default: '00000-000'
      }
    }
  },
  delivery: {
    taxaEntrega: {
      type: Number,
      default: 5.00,
      min: 0
    },
    tempoMedioEntrega: {
      type: Number,
      default: 30,
      min: 10
    },
    raioEntrega: {
      type: Number,
      default: 5,
      min: 1
    },
    pedidoMinimo: {
      type: Number,
      default: 20.00,
      min: 0
    },
    diasSemana: {
      segunda: { type: Boolean, default: true },
      terca: { type: Boolean, default: true },
      quarta: { type: Boolean, default: true },
      quinta: { type: Boolean, default: true },
      sexta: { type: Boolean, default: true },
      sabado: { type: Boolean, default: true },
      domingo: { type: Boolean, default: false }
    },
    horarios: {
      abertura: {
        type: String,
        default: '11:00'
      },
      fechamento: {
        type: String,
        default: '23:00'
      }
    }
  },
  pagamento: {
    aceitaPix: {
      type: Boolean,
      default: true
    },
    aceitaCartao: {
      type: Boolean,
      default: true
    },
    aceitaDinheiro: {
      type: Boolean,
      default: true
    },
    aceitaValeRefeicao: {
      type: Boolean,
      default: false
    },
    chavePix: {
      type: String,
      default: ''
    }
  },
  notificacoes: {
    push: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    whatsapp: {
      type: Boolean,
      default: true
    }
  },
  sistema: {
    tema: {
      type: String,
      enum: ['claro', 'escuro', 'auto'],
      default: 'claro'
    },
    idioma: {
      type: String,
      enum: ['pt-BR', 'en-US', 'es-ES'],
      default: 'pt-BR'
    },
    timezone: {
      type: String,
      default: 'America/Sao_Paulo'
    },
    backupAutomatico: {
      type: Boolean,
      default: true
    }
  },
  impressora: {
    habilitada: {
      type: Boolean,
      default: false
    },
    tipo: {
      type: String,
      enum: ['usb', 'bluetooth', 'wifi'],
      default: 'bluetooth'
    },
    porta: {
      type: String,
      default: 'COM1'
    },
    ip: {
      type: String,
      default: '192.168.1.100'
    },
    larguraPapel: {
      type: Number,
      enum: [58, 80],
      default: 58
    },
    cortarPapel: {
      type: Boolean,
      default: true
    },
    imprimirLogo: {
      type: Boolean,
      default: false
    },
    logoUrl: {
      type: String,
      default: ''
    },
    rodape: {
      type: String,
      default: 'Obrigado pela preferência!'
    },
    testeImpressao: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Método para obter configurações padrão
configuracaoSchema.statics.obterConfiguracoesPadrao = function() {
  return new this();
};

// Método para atualizar configurações específicas
configuracaoSchema.methods.atualizarSecao = function(secao, dados) {
  if (this[secao]) {
    Object.assign(this[secao], dados);
  }
  return this.save();
};

module.exports = mongoose.model('Configuracao', configuracaoSchema);