
const express = require('express');
const router = express.Router();
const Configuracao = require('../models/Configuracao');

// Buscar todas as configurações
router.get('/', async (req, res) => {
  try {
    let configuracao = await Configuracao.findOne();
    
    // Se não existir configuração, criar uma com valores padrão
    if (!configuracao) {
      configuracao = new Configuracao();
      await configuracao.save();
    }
    
    res.json(configuracao);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Buscar configuração específica
router.get('/:categoria', async (req, res) => {
  try {
    const { categoria } = req.params;
    
    let configuracao = await Configuracao.findOne();
    
    if (!configuracao) {
      configuracao = new Configuracao();
      await configuracao.save();
    }
    
    if (!configuracao[categoria]) {
      return res.status(404).json({ message: 'Categoria de configuração não encontrada' });
    }
    
    res.json(configuracao[categoria]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Atualizar configurações
router.put('/', async (req, res) => {
  try {
    let configuracao = await Configuracao.findOne();
    
    if (!configuracao) {
      configuracao = new Configuracao();
    }
    
    // Atualizar apenas campos permitidos
    const camposPermitidos = ['loja', 'delivery', 'pagamento', 'notificacoes', 'sistema', 'impressora'];
    
    camposPermitidos.forEach(campo => {
      if (req.body[campo]) {
        Object.assign(configuracao[campo], req.body[campo]);
      }
    });
    
    // Validações específicas
    if (req.body.delivery) {
      if (req.body.delivery.taxaEntrega && req.body.delivery.taxaEntrega < 0) {
        return res.status(400).json({ message: 'Taxa de entrega não pode ser negativa' });
      }
      
      if (req.body.delivery.pedidoMinimo && req.body.delivery.pedidoMinimo < 0) {
        return res.status(400).json({ message: 'Pedido mínimo não pode ser negativo' });
      }
    }
    
    await configuracao.save();
    
    res.json({ 
      message: 'Configurações atualizadas com sucesso',
      configuracao 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Atualizar categoria específica
router.put('/:categoria', async (req, res) => {
  try {
    const { categoria } = req.params;
    
    let configuracao = await Configuracao.findOne();
    
    if (!configuracao) {
      configuracao = new Configuracao();
    }
    
    if (!configuracao[categoria]) {
      return res.status(404).json({ message: 'Categoria de configuração não encontrada' });
    }
    
    Object.assign(configuracao[categoria], req.body);
    await configuracao.save();
    
    res.json({ 
      message: `Configurações de ${categoria} atualizadas com sucesso`,
      [categoria]: configuracao[categoria]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Resetar configurações para padrão
router.post('/reset', async (req, res) => {
  try {
    // Remover configuração existente
    await Configuracao.deleteMany({});
    
    // Criar nova configuração com valores padrão
    const configuracao = new Configuracao();
    await configuracao.save();
    
    res.json({ 
      message: 'Configurações resetadas para padrão',
      configuracao 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
