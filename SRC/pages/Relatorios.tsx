import React, { useState, useMemo } from 'react'
import { usePedidos } from '../hooks/usePedidos';
import { useProdutos } from '../hooks/useProdutos';
import { useEntregadores } from '../hooks/useEntregadores';
import { 
  BarChart3, 
  TrendingUp,   
  TrendingDown,
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  Download,
  Filter,
  Clock,
  Star,
  Target
} from 'lucide-react';

interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  conversionRate: number;
  topProducts: Array<{
    id: string;
    nome: string;
    quantidade: number;
    revenue: number;
  }>;
  peakHours: Array<{
    hour: number;
    orders: number;
  }>;
  averageDeliveryTime: number;
  deliveryPersonnelPerformance: Array<{
    id: string;
    nome: string;
    deliveries: number;
    totalRevenue: number;
    averageRating: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
  }>;
}

const Relatorios: React.FC = () => {
  const { pedidos, loading: pedidosLoading } = usePedidos();
  const { produtos, loading: produtosLoading } = useProdutos();
  const { entregadores, loading: entregadoresLoading } = useEntregadores();

  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [reportType, setReportType] = useState('geral');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const isLoading = pedidosLoading || produtosLoading || entregadoresLoading || loading;

  // Função para filtrar dados por período
  const filterDataByPeriod = (data: any[], dateField: string = 'dataHora') => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const days = parseInt(selectedPeriod);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
    }

    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  // Dados filtrados
  const filteredOrders = useMemo(() => {
    return filterDataByPeriod(pedidos || []);
  }, [pedidos, selectedPeriod, customStartDate, customEndDate]);

  // Cálculo dos dados do relatório
  const reportData: ReportData = useMemo(() => {
    if (!filteredOrders.length) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageTicket: 0,
        conversionRate: 0,
        topProducts: [],
        peakHours: [],
        averageDeliveryTime: 0,
        deliveryPersonnelPerformance: [],
        dailyRevenue: [],
        statusDistribution: []
      };
    }

    // Receita total e pedidos
    const completedOrders = filteredOrders.filter(pedido => 
      pedido.status === 'entregue'
    );
    
    const totalRevenue = completedOrders.reduce((sum, pedido) => sum + (pedido.valorTotal || 0), 0);
    const totalOrders = filteredOrders.length;
    const averageTicket = totalOrders > 0 ? totalRevenue / completedOrders.length : 0;

    // Taxa de conversão (pedidos entregues / total de pedidos)
    const conversionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0;

    // Produtos mais vendidos
    const productSales = new Map();
    completedOrders.forEach(pedido => {
      if (pedido.items && Array.isArray(pedido.items)) {
        pedido.items.forEach((item: any) => {
          const productId = item.produto?._id || item.produtoId || 'unknown';
          const productName = item.produto?.nome || item.nome || 'Produto sem nome';
          const quantity = item.quantidade || 0;
          const price = item.preco || item.produto?.preco || 0;
          
          if (productSales.has(productId)) {
            const existing = productSales.get(productId);
            existing.quantidade += quantity;
            existing.revenue += quantity * price;
          } else {
            productSales.set(productId, {
              id: productId,
              nome: productName,
              quantidade: quantity,
              revenue: quantity * price
            });
          }
        });
      }
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    // Horários de pico
    const hourlyOrders = new Array(24).fill(0);
    filteredOrders.forEach(pedido => {
      const hour = new Date(pedido.dataHora).getHours();
      hourlyOrders[hour]++;
    });

    const peakHours = hourlyOrders
      .map((orders, hour) => ({ hour, orders }))
      .filter(item => item.orders > 0)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 6);

    // Tempo médio de entrega
    const deliveredOrders = filteredOrders.filter(pedido => 
      pedido.status === 'entregue' && pedido.dataHora && pedido.dataEntrega
    );
    
    const totalDeliveryTime = deliveredOrders.reduce((sum, pedido) => {
      const orderTime = new Date(pedido.dataHora).getTime();
      const deliveryTime = new Date(pedido.dataEntrega).getTime();
      return sum + (deliveryTime - orderTime);
    }, 0);

    const averageDeliveryTime = deliveredOrders.length > 0 
      ? totalDeliveryTime / deliveredOrders.length / (1000 * 60) // em minutos
      : 0;

    // Performance dos entregadores
    const deliveryPerformance = new Map();
    completedOrders.forEach(pedido => {
      const entregadorId = pedido.entregador?._id || pedido.entregadorId;
      const entregadorNome = pedido.entregador?.nome || 'Entregador não identificado';
      
      if (entregadorId) {
        if (deliveryPerformance.has(entregadorId)) {
          const existing = deliveryPerformance.get(entregadorId);
          existing.deliveries++;
          existing.totalRevenue += pedido.valorTotal || 0;
          if (pedido.avaliacao) {
            existing.ratings.push(pedido.avaliacao);
          }
        } else {
          deliveryPerformance.set(entregadorId, {
            id: entregadorId,
            nome: entregadorNome,
            deliveries: 1,
            totalRevenue: pedido.valorTotal || 0,
            ratings: pedido.avaliacao ? [pedido.avaliacao] : []
          });
        }
      }
    });

    const deliveryPersonnelPerformance = Array.from(deliveryPerformance.values())
      .map(performer => ({
        ...performer,
        averageRating: performer.ratings.length > 0 
          ? performer.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / performer.ratings.length 
          : 0
      }))
      .sort((a, b) => b.deliveries - a.deliveries);

    // Receita diária
    const dailyRevenueMap = new Map();
    completedOrders.forEach(pedido => {
      const date = new Date(pedido.dataHora).toISOString().split('T')[0];
      if (dailyRevenueMap.has(date)) {
        const existing = dailyRevenueMap.get(date);
        existing.orders++;
        existing.revenue += pedido.valorTotal || 0;
      } else {
        dailyRevenueMap.set(date, {
          date,
          orders: 1,
          revenue: pedido.valorTotal || 0,
        });
      }
    });

    const dailyRevenue = Array.from(dailyRevenueMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Distribuição de status
    const statusCount = new Map();
    filteredOrders.forEach(pedido => {
      const status = pedido.status || 'indefinido';
      statusCount.set(status, (statusCount.get(status) || 0) + 1);
    });

    const statusDistribution = Array.from(statusCount.entries())
      .map(([status, count]) => ({ status, count }));

    return {
      totalRevenue,
      totalOrders,
      averageTicket,
      conversionRate,
      topProducts,
      peakHours,
      averageDeliveryTime,
      deliveryPersonnelPerformance,
      dailyRevenue,
      statusDistribution
    };
  }, [filteredOrders]);

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para exportar relatório
  const exportarRelatorio = () => {
    const dataToExport = {
      periodo: selectedPeriod,
      tipoRelatorio: reportType,
      dataGeracao: new Date().toISOString(),
      dados: reportData,
      pedidosFiltrados: filteredOrders.length,
      resumo: {
        receitaTotal: formatCurrency(reportData.totalRevenue),
        totalPedidos: reportData.totalOrders,
        ticketMedio: formatCurrency(reportData.averageTicket),
        taxaConversao: `${reportData.conversionRate.toFixed(1)}%`
      }
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${reportType}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Relatório exportado com sucesso!');
  };

  const periods = [
    { value: '7', label: 'Últimos 7 dias' },
    { value: '30', label: 'Últimos 30 dias' },
    { value: '90', label: 'Últimos 90 dias' },
    { value: 'custom', label: 'Período personalizado' }
  ];

  const reportTypes = [
    { value: 'geral', label: 'Relatório Geral' },
    { value: 'vendas', label: 'Vendas' },
    { value: 'produtos', label: 'Produtos' },
    { value: 'entregadores', label: 'Entregadores' },
    { value: 'operacional', label: 'Operacional' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="mr-3 h-8 w-8 text-blue-600" />
              Relatórios
            </h1>
            <p className="text-gray-600 mt-2">
              Análise detalhada do desempenho do seu negócio
            </p>
          </div>
          
          <button
            onClick={exportarRelatorio}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Exportar Relatório</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Relatório
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {reportTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedPeriod === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(reportData.totalRevenue)}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">
              {reportData.conversionRate.toFixed(1)}% taxa de conversão
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.totalOrders}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Package className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-sm text-blue-600">
              {filteredOrders.filter(p => p.status === 'entregue').length} entregues
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(reportData.averageTicket)}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
            <span className="text-sm text-purple-600">
              Por pedido entregue
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tempo Médio de Entrega</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(reportData.averageDeliveryTime)} min
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Clock className="h-4 w-4 text-orange-500 mr-1" />
            <span className="text-sm text-orange-600">
              Tempo médio de entrega
            </span>
          </div>
        </div>
      </div>

      {/* Conteúdo baseado no tipo de relatório */}
      {reportType === 'geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Produtos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Produtos Mais Vendidos
            </h3>
            <div className="space-y-4">
              {reportData.topProducts.map((produto, index) => (
                <div key={produto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{produto.nome}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(produto.revenue)} em vendas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{produto.quantidade}</p>
                    <p className="text-sm text-gray-600">vendidos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Horários de Pico */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Horários de Pico
            </h3>
            <div className="space-y-3">
              {reportData.peakHours.map((hour, index) => (
                <div key={hour.hour} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">
                      {hour.hour}:00 - {hour.hour + 1}:00
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">{hour.orders}</span>
                    <span className="text-sm text-gray-600 ml-1">pedidos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reportType === 'entregadores' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance dos Entregadores
          </h3>
          <div className="space-y-4">
            {reportData.deliveryPersonnelPerformance.map((entregador, index) => (
              <div key={entregador.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{entregador.nome}</p>
                    <p className="text-sm text-gray-600">
                      {entregador.deliveries} entregas • {formatCurrency(entregador.totalRevenue)} em vendas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold text-gray-900">
                      {entregador.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">avaliação média</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportType === 'operacional' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Status do Sistema
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">Entregadores Ativos</span>
                <span className="text-lg font-bold text-gray-600">
                  {entregadores?.filter(e => e.disponivel).length || 0}/{entregadores?.length || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">Produtos Disponíveis</span>
                <span className="text-lg font-bold text-gray-600">
                  {produtos?.filter(p => p.disponivel).length || 0}/{produtos?.length || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">Pedidos Pendentes</span>
                <span className="text-lg font-bold text-gray-600">
                  {filteredOrders.filter(p => !['entregue', 'cancelado'].includes(p.status)).length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Distribuição de Status
            </h3>
            <div className="space-y-3">
              {reportData.statusDistribution.map((status, index) => (
                <div key={status.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900 capitalize">
                    {status.status.replace('_', ' ')}
                  </span>
                  <span className="font-semibold text-gray-900">{status.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Resumo do Período
            </h3>
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-green-700">
                  {reportData.conversionRate.toFixed(1)}%
                </p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">Tempo Médio de Entrega</p>
                <p className="text-2xl font-bold text-blue-700">
                  {Math.round(reportData.averageDeliveryTime)} min
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Relatorios