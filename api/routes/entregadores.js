
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Entregador = require('../models/Entregador');
const Pedido = require('../models/Pedidos');

// Listar todos os entregadores
router.get('/', async (req, res) => {
  try {
    const { 
      status,
      ativo,
      busca,
      page = 1, 
      limit = 20,
      sortBy = 'nome',
      sortOrder = 'asc'
    } = req.query;

    const filter = {};
    
    if (status) filter.status = status;
    if (ativo !== undefined) filter.ativo = ativo === 'true';
    
    if (busca) {
      filter.$or = [
        { nome: { $regex: busca, $options: 'i' } },
        { telefone: { $regex: busca, $options: 'i' } },
        { email: { $regex: busca, $options: 'i' } }
      ];
    }

    // Validar campos de ordenação permitidos
    const allowedSortFields = ['nome', 'email', 'telefone', 'status', 'ativo', 'createdAt', 'updatedAt', 'dataAdmissao', 'totalEntregas'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'nome';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'asc';

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [validSortBy]: validSortOrder === 'desc' ? -1 : 1 }
    };

    const entregadores = await Entregador.find(filter)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await Entregador.countDocuments(filter);

    res.json({
      entregadores,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    console.error('Erro na rota GET /entregadores:', error);
    res.status(500).json({ message: error.message });
  }
});

// Buscar entregador por ID
router.get('/:id', async (req, res) => {
  try {
    const entregador = await Entregador.findById(req.params.id);
    if (!entregador) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }
    res.json(entregador);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Criar novo entregador
router.post('/', async (req, res) => {
  try {
    const entregador = new Entregador(req.body);
    await entregador.save();
    res.status(201).json(entregador);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Atualizar entregador (PATCH - atualização parcial)
router.patch('/:id', async (req, res) => {
  try {
    const entregador = await Entregador.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!entregador) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }
    
    res.json(entregador);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Deletar entregador
router.delete('/:id', async (req, res) => {
  try {
    const entregador = await Entregador.findByIdAndDelete(req.params.id);
    if (!entregador) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }
    res.json({ message: 'Entregador deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Alterar status do entregador
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const entregador = await Entregador.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!entregador) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }
    
    res.json(entregador);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Entregadores disponíveis
router.get('/disponiveis/lista', async (req, res) => {
  try {
    const entregadores = await Entregador.find({
      status: 'disponivel',
      ativo: true
    }).select('nome telefone veiculo avaliacaoMedia');
    
    res.json(entregadores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Histórico de entregas do entregador
router.get('/:id/entregas', async (req, res) => {
  try {
    const { page = 1, limit = 10, dataInicio, dataFim } = req.query;
    
    const filter = { 
      entregador: req.params.id,
      status: 'entregue'
    };

    if (dataInicio && dataFim) {
      filter.dataEntrega = {
        $gte: new Date(dataInicio),
        $lte: new Date(dataFim)
      };
    }
    
    const entregas = await Pedido.find(filter)
      .sort({ dataEntrega: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('cliente', 'nome telefone')
      .select('numero valorTotal dataHora dataEntrega endereco');

    const total = await Pedido.countDocuments(filter);

    res.json({
      entregas,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Estatísticas do entregador
router.get('/:id/estatisticas', async (req, res) => {
  try {
    const entregadorId = req.params.id;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const stats = await Promise.all([
      // Entregas hoje
      Pedido.countDocuments({
        entregador: entregadorId,
        status: 'entregue',
        dataEntrega: { $gte: hoje, $lt: amanha }
      }),
      // Total de entregas
      Pedido.countDocuments({
        entregador: entregadorId,
        status: 'entregue'
      }),
      // Faturamento do entregador hoje
      Pedido.aggregate([
        {
          $match: {
            entregador: mongoose.Types.ObjectId(entregadorId),
            status: 'entregue',
            dataEntrega: { $gte: hoje, $lt: amanha }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$valorTotal' }
          }
        }
      ]),
      // Tempo médio de entrega
      Pedido.aggregate([
        {
          $match: {
            entregador: mongoose.Types.ObjectId(entregadorId),
            status: 'entregue',
            dataEntrega: { $exists: true }
          }
        },
        {
          $project: {
            tempoEntrega: {
              $divide: [
                { $subtract: ['$dataEntrega', '$dataHora'] },
                1000 * 60 // converter para minutos
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            tempoMedio: { $avg: '$tempoEntrega' }
          }
        }
      ])
    ]);

    const entregador = await Entregador.findById(entregadorId);

    res.json({
      entregasHoje: stats[0],
      totalEntregas: stats[1],
      faturamentoHoje: stats[2][0]?.total || 0,
      tempoMedioEntrega: Math.round(stats[3][0]?.tempoMedio || 0),
      comissaoHoje: (stats[2][0]?.total || 0) * (entregador.comissao / 100),
      avaliacaoMedia: entregador.avaliacaoMedia
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sincronizar contadores de entregas (rota administrativa)
router.post('/sincronizar-entregas', async (req, res) => {
  try {
    const entregadores = await Entregador.find({});
    let atualizados = 0;

    for (const entregador of entregadores) {
      // Conta o total de entregas realizadas por este entregador
      const totalEntregas = await Pedido.countDocuments({
        entregador: entregador._id,
        status: 'entregue'
      });

      // Atualiza o campo totalEntregas no entregador
      await Entregador.findByIdAndUpdate(entregador._id, {
        totalEntregas: totalEntregas
      });

      atualizados++;
      console.log(`Entregador ${entregador.nome}: ${totalEntregas} entregas`);
    }

    res.json({
      message: `Contadores de entregas sincronizados com sucesso`,
      entregadoresAtualizados: atualizados
    });
  } catch (error) {
    console.error('Erro ao sincronizar contadores:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
