
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Pedido = require('../models/Pedidos');
const Cliente = require('../models/Cliente');
const Produto = require('../models/Produtos');
const Entregador = require('../models/Entregador');

// Listar todos os pedidos
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      data, 
      cliente, 
      entregador,
      page = 1, 
      limit = 20,
      sortBy = 'dataHora',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    if (status) filter.status = status;
    if (cliente) filter.cliente = cliente;
    if (entregador) filter.entregador = entregador;
    
    if (data) {
      const startDate = new Date(data);
      const endDate = new Date(data);
      endDate.setDate(endDate.getDate() + 1);
      filter.dataHora = { $gte: startDate, $lt: endDate };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: [
        { path: 'cliente', select: 'nome telefone' },
        { path: 'entregador', select: 'nome telefone status' },
        { path: 'items.produto', select: 'nome categoria' }
      ]
    };

    const pedidos = await Pedido.find(filter)
      .populate(options.populate)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await Pedido.countDocuments(filter);

    res.json({
      pedidos,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Buscar pedido por ID
router.get('/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id)
      .populate('cliente')
      .populate('entregador')
      .populate('items.produto');
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }
    
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Criar novo pedido
router.post('/', async (req, res) => {
  try {
    const {
      cliente,
      clienteNome,
      clienteTelefone,
      clienteEmail,
      enderecoEntrega,
      itens,
      items,
      endereco,
      formaPagamento,
      taxaEntrega = 5.00,
      troco,
      trocoParaValor,
      observacoes,
      observacoesPedido,
      tempoEstimado = 30,
      tempoEstimadoMinutos = 30
    } = req.body;

    let clienteId = cliente;

    // Se não foi fornecido um ID de cliente, mas temos dados do cliente, criar automaticamente
    if (!clienteId && (clienteNome || clienteTelefone)) {
      try {
        // Formatar telefone para o padrão esperado pelo modelo
        let telefoneFormatado = clienteTelefone;
        if (clienteTelefone && !clienteTelefone.includes('(')) {
          // Converter de "75983124585" para "(75) 98312-4585"
          const digits = clienteTelefone.replace(/\D/g, '');
          if (digits.length === 11) {
            telefoneFormatado = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
          } else if (digits.length === 10) {
            telefoneFormatado = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
          }
        }

        // Verificar se já existe um cliente com esse telefone
        let clienteExistente = await Cliente.findOne({ 
          $or: [
            { telefone: telefoneFormatado },
            { telefone: clienteTelefone }
          ]
        });
        
        if (!clienteExistente) {
          // Criar novo cliente
          const dadosCliente = {
            nome: clienteNome || 'Cliente',
            telefone: telefoneFormatado
          };

          // Só adicionar email se não estiver vazio
          if (clienteEmail && clienteEmail.trim() !== '') {
            dadosCliente.email = clienteEmail;
          }

          // Adicionar endereço apenas se tiver dados válidos
          if (enderecoEntrega && enderecoEntrega.rua && enderecoEntrega.bairro && enderecoEntrega.cidade && enderecoEntrega.cep) {
            dadosCliente.enderecos = [{
              nome: 'Principal',
              rua: enderecoEntrega.rua,
              numero: enderecoEntrega.numero || 'S/N',
              complemento: enderecoEntrega.complemento || '',
              bairro: enderecoEntrega.bairro,
              cidade: enderecoEntrega.cidade,
              cep: enderecoEntrega.cep,
              referencia: enderecoEntrega.referencia || '',
              principal: true
            }];
          }

          const novoCliente = new Cliente(dadosCliente);
          
          await novoCliente.save();
          clienteId = novoCliente._id;
        } else {
          clienteId = clienteExistente._id;
        }
      } catch (clienteError) {
        console.error('Erro ao criar cliente:', clienteError);
        return res.status(400).json({ message: 'Erro ao processar dados do cliente' });
      }
    }

    // Validar cliente final
    if (clienteId) {
      const clienteExistente = await Cliente.findById(clienteId);
      if (!clienteExistente) {
        return res.status(400).json({ message: 'Cliente não encontrado' });
      }
    } else {
      return res.status(400).json({ message: 'Dados do cliente são obrigatórios' });
    }

    // Usar itens ou items (compatibilidade)
    const itemsPedido = itens || items || [];
    
    // Validar produtos e calcular valores
    let valorSubtotal = 0;
    const itemsValidados = [];

    for (const item of itemsPedido) {
      // Para pizzas, não validar produto no banco
      if (item.produtoId && item.produtoId.startsWith('pizza-')) {
        const itemValidado = {
          produto: new mongoose.Types.ObjectId(), // Gerar ObjectId temporário para pizzas
          nome: item.nome,
          preco: item.precoUnitario,
          quantidade: item.quantidade,
          observacoes: item.observacoes,
          sabor: item.sabores ? item.sabores.join(', ') : undefined,
          tamanho: item.tamanho
        };

        valorSubtotal += item.precoTotal;
        itemsValidados.push(itemValidado);
      } else {
        // Para outros produtos, validar no banco
        const produto = await Produto.findById(item.produtoId || item.produto);
        if (!produto) {
          return res.status(400).json({ message: `Produto ${item.produtoId || item.produto} não encontrado` });
        }
        if (!produto.disponivel) {
          return res.status(400).json({ message: `Produto ${produto.nome} não está disponível` });
        }

        const itemValidado = {
          produto: produto._id,
          nome: produto.nome,
          preco: produto.preco,
          quantidade: item.quantidade,
          observacoes: item.observacoes
        };

        // Adicionar sabor e tamanho se fornecidos
        if (item.sabor) {
          itemValidado.sabor = item.sabor;
        }
        if (item.tamanho) {
          itemValidado.tamanho = item.tamanho;
        }
        if (item.tamanhoDetalhes) {
          itemValidado.tamanhoDetalhes = item.tamanhoDetalhes;
        }

        valorSubtotal += produto.preco * item.quantidade;
        itemsValidados.push(itemValidado);
      }
    }

    const valorTotal = valorSubtotal + taxaEntrega;

    const pedido = new Pedido({
      cliente: clienteId,
      items: itemsValidados,
      endereco: {
        rua: enderecoEntrega?.rua || endereco?.rua || '',
        numero: enderecoEntrega?.numero || endereco?.numero || 'S/N',
        complemento: enderecoEntrega?.complemento || endereco?.complemento || '',
        referencia: enderecoEntrega?.referencia || endereco?.referencia || ''
      },
      formaPagamento,
      valorSubtotal,
      taxaEntrega,
      valorTotal,
      troco: trocoParaValor || troco,
      observacoes: observacoesPedido || observacoes,
      tempoEstimado: tempoEstimadoMinutos || tempoEstimado
    });

    await pedido.save();
    await pedido.populate([
      { path: 'cliente', select: 'nome telefone' },
      { path: 'items.produto', select: 'nome categoria' }
    ]);

    // Atualizar estatísticas do cliente
    await Cliente.findByIdAndUpdate(clienteId, {
      $inc: { totalPedidos: 1, valorTotalGasto: valorTotal },
      ultimoPedido: new Date()
    });

    res.status(201).json(pedido);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Atualizar status do pedido
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, entregador } = req.body;
    
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    // Validar entregador se status for 'saiu_entrega'
    if (status === 'saiu_entrega' && entregador) {
      const entregadorExistente = await Entregador.findById(entregador);
      if (!entregadorExistente) {
        return res.status(400).json({ message: 'Entregador não encontrado' });
      }
      pedido.entregador = entregador;
    }

    // Definir data de entrega se status for 'entregue'
    if (status === 'entregue') {
      pedido.dataEntrega = new Date();
      
      // Atualizar estatísticas do entregador
      if (pedido.entregador) {
        await Entregador.findByIdAndUpdate(pedido.entregador, {
          $inc: { totalEntregas: 1 },
          status: 'disponivel'
        });
      }
    }

    pedido.status = status;
    await pedido.save();
    
    await pedido.populate([
      { path: 'cliente', select: 'nome telefone' },
      { path: 'entregador', select: 'nome telefone' }
    ]);

    res.json(pedido);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cancelar pedido
router.patch('/:id/cancelar', async (req, res) => {
  try {
    const { motivo } = req.body;
    
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    if (pedido.status === 'entregue') {
      return res.status(400).json({ message: 'Não é possível cancelar pedido já entregue' });
    }

    pedido.status = 'cancelado';
    pedido.observacoes = `${pedido.observacoes || ''}\nCancelado: ${motivo}`;
    
    await pedido.save();
    res.json(pedido);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Deletar pedido
router.delete('/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    await Pedido.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pedido deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Estatísticas dos pedidos
router.get('/stats/resumo', async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const stats = await Promise.all([
      // Pedidos de hoje
      Pedido.countDocuments({
        dataHora: { $gte: hoje, $lt: amanha }
      }),
      // Pedidos pendentes
      Pedido.countDocuments({ status: 'pendente' }),
      // Pedidos em preparo
      Pedido.countDocuments({ status: 'preparando' }),
      // Pedidos saíram para entrega
      Pedido.countDocuments({ status: 'saiu_entrega' }),
      // Faturamento do dia
      Pedido.aggregate([
        {
          $match: {
            dataHora: { $gte: hoje, $lt: amanha },
            status: { $ne: 'cancelado' }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$valorTotal' }
          }
        }
      ])
    ]);

    res.json({
      pedidosHoje: stats[0],
      pedidosPendentes: stats[1],
      pedidosPreparando: stats[2],
      pedidosEntrega: stats[3],
      faturamentoHoje: stats[4][0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
