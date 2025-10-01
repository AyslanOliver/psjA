
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedidos');

// Listar todos os clientes
router.get('/', async (req, res) => {
  try {
    const { 
      busca,
      ativo,
      page = 1, 
      limit = 20,
      sortBy = 'nome',
      sortOrder = 'asc'
    } = req.query;

    const filter = {};
    
    if (ativo !== undefined) filter.ativo = ativo === 'true';
    
    if (busca) {
      filter.$or = [
        { nome: { $regex: busca, $options: 'i' } },
        { telefone: { $regex: busca, $options: 'i' } },
        { email: { $regex: busca, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    const clientes = await Cliente.find(filter)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await Cliente.countDocuments(filter);

    res.json({
      clientes,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Buscar cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Criar novo cliente
router.post('/', async (req, res) => {
  try {
    const cliente = new Cliente(req.body);
    await cliente.save();
    res.status(201).json(cliente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Atualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Deletar cliente
router.delete('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndDelete(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.json({ message: 'Cliente deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Histórico de pedidos do cliente
router.get('/:id/pedidos', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pedidos = await Pedido.find({ cliente: req.params.id })
      .sort({ dataHora: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('items.produto', 'nome preco');

    const total = await Pedido.countDocuments({ cliente: req.params.id });

    res.json({
      pedidos,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Adicionar endereço ao cliente
router.post('/:id/enderecos', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Se for o primeiro endereço ou marcado como principal
    if (cliente.enderecos.length === 0 || req.body.principal) {
      // Desmarcar outros endereços como principal
      cliente.enderecos.forEach(endereco => {
        endereco.principal = false;
      });
      req.body.principal = true;
    }

    cliente.enderecos.push(req.body);
    await cliente.save();
    
    res.status(201).json(cliente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Atualizar endereço do cliente
router.put('/:id/enderecos/:enderecoId', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    const endereco = cliente.enderecos.id(req.params.enderecoId);
    if (!endereco) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }

    // Se marcando como principal, desmarcar outros
    if (req.body.principal) {
      cliente.enderecos.forEach(end => {
        if (end._id.toString() !== req.params.enderecoId) {
          end.principal = false;
        }
      });
    }

    Object.assign(endereco, req.body);
    await cliente.save();
    
    res.json(cliente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Deletar endereço do cliente
router.delete('/:id/enderecos/:enderecoId', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    cliente.enderecos.id(req.params.enderecoId).remove();
    await cliente.save();
    
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
