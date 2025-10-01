
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Pedido = require('../models/Pedidos');
const Produto = require('../models/Produtos');
const Cliente = require('../models/Cliente');
const Entregador = require('../models/Entregador');
const moment = require('moment');

// Relatório de vendas
router.get('/vendas', async (req, res) => {
  try {
    const { dataInicio, dataFim, periodo = 'dia' } = req.query;
    
    let inicio, fim;
    if (dataInicio && dataFim) {
      inicio = new Date(dataInicio);
      fim = new Date(dataFim);
    } else {
      // Últimos 30 dias por padrão
      fim = new Date();
      inicio = new Date();
      inicio.setDate(inicio.getDate() - 30);
    }

    const matchStage = {
      dataHora: { $gte: inicio, $lte: fim },
      status: { $ne: 'cancelado' }
    };

    let groupBy;
    switch (periodo) {
      case 'hora':
        groupBy = {
          year: { $year: '$dataHora' },
          month: { $month: '$dataHora' },
          day: { $dayOfMonth: '$dataHora' },
          hour: { $hour: '$dataHora' }
        };
        break;
      case 'dia':
        groupBy = {
          year: { $year: '$dataHora' },
          month: { $month: '$dataHora' },
          day: { $dayOfMonth: '$dataHora' }
        };
        break;
      case 'mes':
        groupBy = {
          year: { $year: '$dataHora' },
          month: { $month: '$dataHora' }
        };
        break;
      default:
        groupBy = {
          year: { $year: '$dataHora' },
          month: { $month: '$dataHora' },
          day: { $dayOfMonth: '$dataHora' }
        };
    }

    const vendas = await Pedido.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupBy,
          totalPedidos: { $sum: 1 },
          faturamento: { $sum: '$valorTotal' },
          ticketMedio: { $avg: '$valorTotal' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);

    // Estatísticas gerais
    const estatisticas = await Pedido.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPedidos: { $sum: 1 },
          faturamentoTotal: { $sum: '$valorTotal' },
          ticketMedio: { $avg: '$valorTotal' },
          maiorPedido: { $max: '$valorTotal' },
          menorPedido: { $min: '$valorTotal' }
        }
      }
    ]);

    res.json({
      vendas,
      estatisticas: estatisticas[0] || {},
      periodo: { inicio, fim }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Produtos mais vendidos
router.get('/produtos-vendidos', async (req, res) => {
  try {
    const { dataInicio, dataFim, limit = 10 } = req.query;
    
    let inicio, fim;
    if (dataInicio && dataFim) {
      inicio = new Date(dataInicio);
      fim = new Date(dataFim);
    } else {
      // Últimos 30 dias por padrão
      fim = new Date();
      inicio = new Date();
      inicio.setDate(inicio.getDate() - 30);
    }

    const produtosMaisVendidos = await Pedido.aggregate([
      {
        $match: {
          dataHora: { $gte: inicio, $lte: fim },
          status: { $ne: 'cancelado' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.produto',
          nome: { $first: '$items.nome' },
          quantidadeVendida: { $sum: '$items.quantidade' },
          faturamento: { $sum: { $multiply: ['$items.preco', '$items.quantidade'] } },
          precoMedio: { $avg: '$items.preco' }
        }
      },
      { $sort: { quantidadeVendida: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(produtosMaisVendidos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Relatório de clientes
router.get('/clientes', async (req, res) => {
  try {
    const { dataInicio, dataFim, limit = 10 } = req.query;
    
    let inicio, fim;
    if (dataInicio && dataFim) {
      inicio = new Date(dataInicio);
      fim = new Date(dataFim);
    } else {
      // Últimos 30 dias por padrão
      fim = new Date();
      inicio = new Date();
      inicio.setDate(inicio.getDate() - 30);
    }

    const clientesTop = await Pedido.aggregate([
      {
        $match: {
          dataHora: { $gte: inicio, $lte: fim },
          status: { $ne: 'cancelado' }
        }
      },
      {
        $group: {
          _id: '$cliente',
          totalPedidos: { $sum: 1 },
          valorTotal: { $sum: '$valorTotal' },
          ticketMedio: { $avg: '$valorTotal' },
          ultimoPedido: { $max: '$dataHora' }
        }
      },
      {
        $lookup: {
          from: 'clientes',
          localField: '_id',
          foreignField: '_id',
          as: 'cliente'
        }
      },
      { $unwind: '$cliente' },
      {
        $project: {
          nome: '$cliente.nome',
          telefone: '$cliente.telefone',
          totalPedidos: 1,
          valorTotal: 1,
          ticketMedio: 1,
          ultimoPedido: 1
        }
      },
      { $sort: { valorTotal: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Estatísticas gerais de clientes
    const estatisticas = await Cliente.aggregate([
      {
        $group: {
          _id: null,
          totalClientes: { $sum: 1 },
          clientesAtivos: { $sum: { $cond: ['$ativo', 1, 0] } },
          mediaGasto: { $avg: '$valorTotalGasto' },
          mediaPedidos: { $avg: '$totalPedidos' }
        }
      }
    ]);

    res.json({
      clientesTop,
      estatisticas: estatisticas[0] || {}
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Relatório de entregadores
router.get('/entregadores', async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    
    let inicio, fim;
    if (dataInicio && dataFim) {
      inicio = new Date(dataInicio);
      fim = new Date(dataFim);
    } else {
      // Últimos 30 dias por padrão
      fim = new Date();
      inicio = new Date();
      inicio.setDate(inicio.getDate() - 30);
    }

    const performanceEntregadores = await Pedido.aggregate([
      {
        $match: {
          dataEntrega: { $gte: inicio, $lte: fim },
          status: 'entregue',
          entregador: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$entregador',
          totalEntregas: { $sum: 1 },
          faturamentoTotal: { $sum: '$valorTotal' },
          tempoMedioEntrega: {
            $avg: {
              $divide: [
                { $subtract: ['$dataEntrega', '$dataHora'] },
                1000 * 60 // converter para minutos
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'entregadores',
          localField: '_id',
          foreignField: '_id',
          as: 'entregador'
        }
      },
      { $unwind: '$entregador' },
      {
        $project: {
          nome: '$entregador.nome',
          telefone: '$entregador.telefone',
          veiculo: '$entregador.veiculo.tipo',
          totalEntregas: 1,
          faturamentoTotal: 1,
          tempoMedioEntrega: { $round: ['$tempoMedioEntrega', 0] },
          comissao: '$entregador.comissao',
          comissaoTotal: {
            $multiply: [
              '$faturamentoTotal',
              { $divide: ['$entregador.comissao', 100] }
            ]
          },
          avaliacaoMedia: '$entregador.avaliacaoMedia'
        }
      },
      { $sort: { totalEntregas: -1 } }
    ]);

    res.json(performanceEntregadores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dashboard resumo
router.get('/dashboard', async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    const [
      pedidosHoje,
      pedidosOntem,
      faturamentoHoje,
      faturamentoOntem,
      pedidosPendentes,
      entregadoresAtivos,
      produtosAtivos,
      clientesTotal
    ] = await Promise.all([
      // Pedidos hoje
      Pedido.countDocuments({
        dataHora: { $gte: hoje, $lt: amanha },
        status: { $ne: 'cancelado' }
      }),
      // Pedidos ontem
      Pedido.countDocuments({
        dataHora: { $gte: ontem, $lt: hoje },
        status: { $ne: 'cancelado' }
      }),
      // Faturamento hoje
      Pedido.aggregate([
        {
          $match: {
            dataHora: { $gte: hoje, $lt: amanha },
            status: { $ne: 'cancelado' }
          }
        },
        { $group: { _id: null, total: { $sum: '$valorTotal' } } }
      ]),
      // Faturamento ontem
      Pedido.aggregate([
        {
          $match: {
            dataHora: { $gte: ontem, $lt: hoje },
            status: { $ne: 'cancelado' }
          }
        },
        { $group: { _id: null, total: { $sum: '$valorTotal' } } }
      ]),
      // Pedidos pendentes
      Pedido.countDocuments({ status: 'pendente' }),
      // Entregadores ativos
      Entregador.countDocuments({ status: 'disponivel', ativo: true }),
      // Produtos ativos
      Produto.countDocuments({ disponivel: true }),
      // Total de clientes
      Cliente.countDocuments({ ativo: true })
    ]);

    const faturamentoHojeTotal = faturamentoHoje[0]?.total || 0;
    const faturamentoOntemTotal = faturamentoOntem[0]?.total || 0;

    // Calcular variações percentuais
    const variacaoPedidos = pedidosOntem > 0 
      ? ((pedidosHoje - pedidosOntem) / pedidosOntem * 100).toFixed(1)
      : 0;

    const variacaoFaturamento = faturamentoOntemTotal > 0
      ? ((faturamentoHojeTotal - faturamentoOntemTotal) / faturamentoOntemTotal * 100).toFixed(1)
      : 0;

    res.json({
      pedidosHoje,
      pedidosOntem,
      variacaoPedidos: parseFloat(variacaoPedidos),
      faturamentoHoje: faturamentoHojeTotal,
      faturamentoOntem: faturamentoOntemTotal,
      variacaoFaturamento: parseFloat(variacaoFaturamento),
      pedidosPendentes,
      entregadoresAtivos,
      produtosAtivos,
      clientesTotal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
