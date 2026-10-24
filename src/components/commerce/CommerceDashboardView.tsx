import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { CommercialDashboardMetrics, CommercialSale } from '../../types';
import {
  BarChart3,
  TrendingUp,
  Boxes,
  AlertTriangle,
  DollarSign,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  PieChart,
  Calendar,
  Download,
  Info,
  Clock,
  Wine,
  Flame,
  ArrowRight
} from 'lucide-react';

interface CommerceDashboardViewProps {
  modulo: 'adega' | 'tabacaria';
  onNavigateToTab?: (tab: string) => void;
}

export const CommerceDashboardView: React.FC<CommerceDashboardViewProps> = ({ modulo, onNavigateToTab }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<CommercialDashboardMetrics | null>(null);
  const [salesHistory, setSalesHistory] = useState<CommercialSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [dashRes, salesRes] = await Promise.all([
        api.getCommerceDashboard(modulo),
        api.getCommerceSales(modulo)
      ]);
      setMetrics(dashRes);
      setSalesHistory(salesRes.sales || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar indicadores executivos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [modulo]);

  // Handle Export CSV
  const handleExportCSV = () => {
    if (!salesHistory || salesHistory.length === 0) return;
    const header = 'CodigoVenda;Data;Modulo;FormaPagamento;Subtotal;Desconto;Total;CustoEstimado;LucroBruto;Status\n';
    const rows = salesHistory
      .map(
        s =>
          `${s.codigoVenda};${new Date(s.criadoEm).toLocaleString('pt-BR')};${s.modulo};${s.formaPagamento};${s.subtotal.toFixed(2)};${s.descontoTotal.toFixed(2)};${s.valorTotal.toFixed(2)};${s.custoTotalEstimado.toFixed(2)};${s.lucroBrutoEstimado.toFixed(2)};${s.status}`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_vendas_${modulo}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121024] border border-[#262042] rounded-2xl p-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#8B5CF6]" />
            Painel Executivo & Indicadores — {modulo === 'adega' ? 'Adega & Bebidas' : 'Tabacaria & Headshop'}
          </h2>
          <p className="text-xs text-[#AAA6B5]">
            Métricas de faturamento, custo das mercadorias (CMV), margem bruta e desempenho de catálogo.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-[#1A1633] hover:bg-[#262042] border border-[#2E2854] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
        >
          <Download className="w-4 h-4 text-[#8B5CF6]" />
          <span>Exportar Vendas (CSV)</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-[#121024] border border-[#262042] rounded-2xl p-12 text-center text-xs text-[#AAA6B5]">
          Calculando métricas em tempo real...
        </div>
      ) : metrics ? (
        <>
          {/* Top 4 Primary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Vendas Hoje */}
            <div className="bg-[#121024] border border-[#262042] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#AAA6B5]">Vendas de Hoje</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-white">
                R$ {metrics.vendasHojeValor.toFixed(2)}
              </div>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <span>{metrics.vendasHojeQtd} pedidos concluídos hoje</span>
              </div>
            </div>

            {/* Vendas do Mês */}
            <div className="bg-[#121024] border border-[#262042] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#AAA6B5]">Faturamento no Mês</span>
                <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-white">
                R$ {metrics.vendasMesValor.toFixed(2)}
              </div>
              <div className="text-[11px] text-[#C4B5FD] mt-1">
                {metrics.vendasMesQtd} vendas registradas
              </div>
            </div>

            {/* Lucro Bruto Estimado */}
            <div className="bg-gradient-to-br from-[#1A1633] to-[#121024] border border-[#8B5CF6]/40 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#C4B5FD]">Lucro Bruto Estimado (Mês)</span>
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-teal-300">
                R$ {metrics.lucroBrutoMesEstimado.toFixed(2)}
              </div>
              <div className="text-[10px] text-[#AAA6B5] mt-1">
                Receita bruta (-) Custo CMV cadastrado
              </div>
            </div>

            {/* Valor do Estoque a Preço de Custo */}
            <div className="bg-[#121024] border border-[#262042] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#AAA6B5]">Estoque a Preço de Custo</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-white">
                R$ {metrics.valorEstoqueCusto.toFixed(2)}
              </div>
              <div className="text-[11px] text-[#AAA6B5] mt-1">
                {metrics.totalProdutos} produtos cadastrados
              </div>
            </div>
          </div>

          {/* Comparative Section: Adega vs Tabacaria */}
          <div className="bg-[#121024] border border-[#262042] rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#8B5CF6]" />
              Comparativo Consolidado: Adega vs Tabacaria
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card Adega */}
              <div className="p-4 rounded-xl bg-[#0A0714] border border-[#262042] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                    <Wine className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Adega & Bebidas</h4>
                    <p className="text-[11px] text-[#AAA6B5]">
                      {metrics.comparativoModulos.adega.totalProdutos} produtos | Estoque R${' '}
                      {metrics.comparativoModulos.adega.totalEstoqueValor.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#AAA6B5] block">Vendas no Mês</span>
                  <span className="text-sm font-black text-emerald-400">
                    R$ {metrics.comparativoModulos.adega.vendasMesValor.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Card Tabacaria */}
              <div className="p-4 rounded-xl bg-[#0A0714] border border-[#262042] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Tabacaria & Headshop</h4>
                    <p className="text-[11px] text-[#AAA6B5]">
                      {metrics.comparativoModulos.tabacaria.totalProdutos} produtos | Estoque R${' '}
                      {metrics.comparativoModulos.tabacaria.totalEstoqueValor.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#AAA6B5] block">Vendas no Mês</span>
                  <span className="text-sm font-black text-amber-400">
                    R$ {metrics.comparativoModulos.tabacaria.vendasMesValor.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid: Top Sellers (left) & Low Stock / Stagnant (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Sellers */}
            <div className="lg:col-span-6 bg-[#121024] border border-[#262042] rounded-2xl p-5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Produtos Mais Vendidos (Top Sellers)
              </h3>

              {metrics.topProdutosMaisVendidos.length === 0 ? (
                <p className="text-xs text-[#AAA6B5] py-8 text-center italic">
                  Nenhuma venda concluída para gerar ranking.
                </p>
              ) : (
                <div className="space-y-2">
                  {metrics.topProdutosMaisVendidos.map((prod, idx) => (
                    <div
                      key={prod.productId}
                      className="p-2.5 rounded-xl bg-[#0A0714] border border-[#262042] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#1A1633] text-[#C4B5FD] font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                          {prod.nome}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-400 block">
                          R$ {prod.valorTotal.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[#AAA6B5]">
                          {prod.quantidadeTotal} un vendidas
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock Alerts & Stagnant Items */}
            <div className="lg:col-span-6 space-y-4">
              {/* Low Stock Card */}
              <div className="bg-[#121024] border border-[#262042] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Produtos Abaixo do Estoque Mínimo ({metrics.produtosEstoqueBaixo.length})
                  </h3>
                  {onNavigateToTab && (
                    <button
                      onClick={() => onNavigateToTab('stock')}
                      className="text-[11px] text-[#8B5CF6] hover:text-[#C4B5FD] flex items-center gap-1"
                    >
                      <span>Repor Estoque</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {metrics.produtosEstoqueBaixo.length === 0 ? (
                  <p className="text-xs text-emerald-400/90 py-4 text-center">
                    Todos os produtos estão com níveis saudáveis de estoque.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {metrics.produtosEstoqueBaixo.map(p => (
                      <div
                        key={p.id}
                        className="p-2 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-white truncate max-w-[180px]">
                          {p.nome}
                        </span>
                        <div className="text-right">
                          <span className="text-amber-300 font-bold">
                            {p.estoqueAtual} {p.unidade}
                          </span>
                          <span className="text-[10px] text-[#AAA6B5] ml-1.5">
                            (mín: {p.estoqueMinimo})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stagnant Items Card */}
              <div className="bg-[#121024] border border-[#262042] rounded-2xl p-5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Produtos Parados em Estoque ({metrics.produtosParados.length})
                </h3>
                <p className="text-[11px] text-[#AAA6B5] mb-3">
                  Itens com saldo físico disponível porém sem nenhuma venda recente registrada.
                </p>

                {metrics.produtosParados.length === 0 ? (
                  <p className="text-xs text-[#AAA6B5] py-2 text-center italic">
                    Nenhum produto parado identificado.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {metrics.produtosParados.slice(0, 5).map(p => (
                      <div
                        key={p.id}
                        className="p-2 rounded-xl bg-[#0A0714] border border-[#262042] flex items-center justify-between text-xs"
                      >
                        <span className="text-white truncate max-w-[200px]">{p.nome}</span>
                        <span className="text-[#AAA6B5] text-[11px]">
                          Saldo: <strong className="text-white">{p.estoqueAtual} {p.unidade}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
