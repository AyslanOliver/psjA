
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Produto = require('../models/Produtos');

// Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    const { 
      categoria, 
      disponivel, 
      destaque,
      busca,
      page = 1, 
      limit = 20,
      sortBy = 'nome',
      sortOrder = 'asc'
    } = req.query;

    const filter = {};
    
    if (categoria) filter.categoria = categoria;
    if (disponivel !== undefined) filter.disponivel = disponivel === 'true';
    if (destaque !== undefined) filter.destaque = destaque === 'true';
    
    if (busca) {
      filter.$or = [
        { nome: { $regex: busca, $options: 'i' } },
        { descricao: { $regex: busca, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    const produtos = await Produto.find(filter)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await Produto.countDocuments(filter);

    res.json({
      produtos,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Buscar produto por ID
router.get('/:id', async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Criar novo produto
router.post('/', async (req, res) => {
  try {
    const produto = new Produto(req.body);
    await produto.save();
    res.status(201).json(produto);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Atualizar produto
router.put('/:id', async (req, res) => {
  try {
    const produto = await Produto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    
    res.json(produto);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Deletar produto
router.delete('/:id', async (req, res) => {
  try {
    const produto = await Produto.findByIdAndDelete(req.params.id);
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Listar categorias
router.get('/categorias/lista', async (req, res) => {
  try {
    const categorias = await Produto.distinct('categoria');
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Produtos em destaque
router.get('/destaque/lista', async (req, res) => {
  try {
    const produtos = await Produto.find({ 
      destaque: true, 
      disponivel: true 
    }).limit(10);
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Alterar disponibilidade
router.patch('/:id/disponibilidade', async (req, res) => {
  try {
    const { disponivel } = req.body;
    
    const produto = await Produto.findByIdAndUpdate(
      req.params.id,
      { disponivel },
      { new: true }
    );
    
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    
    res.json(produto);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
