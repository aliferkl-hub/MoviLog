import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { FinancialRecord, Vehicle, DeliveryRoute } from '../../types';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  Download,
  Printer,
  Calendar,
  Filter,
  Truck,
  Fuel,
  Wrench,
  Receipt,
  PieChart,
  Tag,
  CheckCircle2,
  Clock,
  Search
} from 'lucide-react';

export const FinancialView: React.FC = () => {
  const { user, company, isMaster } = useAuth();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [summary, setSummary] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    saldoOperacional: 0,
    margemPercentual: 0,
    totalLancamentos: 0,
    despesasPorCategoria: {} as Record<string, number>
  });
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  // New Record Form
  const [novoTipo, setNovoTipo] = useState<'receita' | 'despesa'>('despesa');
  const [novaCategoria, setNovaCategoria] = useState<string>('combustivel');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoValor, setNovoValor] = useState<number>(150);
  const [novaData, setNovaData] = useState<string>(new Date().toISOString().slice(0, 10));
  const [veiculoVinculadoId, setVeiculoVinculadoId] = useState<string>('');
  const [rotaVinculadaId, setRotaVinculadaId] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, sumRes, vehRes, rouRes] = await Promise.all([
        api.getFinancialRecords(),
        api.getFinancialSummary(),
        api.getFleetVehicles(),
        api.getRoutes()
      ]);
      setRecords(recRes.records || []);
      setSummary(sumRes);
      setVehicles(vehRes.vehicles || []);
      setRoutes(rouRes.routes || []);
    } catch (e) {
      console.error('Erro ao carregar dados financeiros:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company?.id]);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaDescricao || novoValor <= 0) {
      alert('Descrição e valor válido são obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      await api.createFinancialRecord({
        tipo: novoTipo,
        categoria: novaCategoria,
        descricao: novaDescricao,
        valor: novoValor,
        dataCompetencia: novaData,
        vehicleId: veiculoVinculadoId || undefined,
        routeId: rotaVinculadaId || undefined,
        observacoes: observacoes || undefined
      });
      setShowModal(false);
      setNovaDescricao('');
      setNovoValor(150);
      setObservacoes('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar lançamento financeiro');
    } finally {
      setSaving(false);
    }
  };

  const filteredRecords = records.filter(r => {
    if (filterTipo !== 'all' && r.tipo !== filterTipo) return false;
    if (filterCategoria !== 'all' && r.categoria !== filterCategoria) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.descricao.toLowerCase().includes(q) ||
        r.categoria.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121024] via-[#1a1435] to-[#121024] border border-[#2D2644] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Gestão Financeira & Custos
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              <span>Custos Operacionais & Faturamento</span>
            </h2>
            <p className="text-xs text-[#AAA6B5] mt-1">
              Controle de receitas de frete, despesas de combustível, manutenção, pedágio e margens da frota MoviLog.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lançamento</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-[#1C1829] hover:bg-[#252037] border border-[#2D2644] text-[#AAA6B5] hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-[#8B5CF6]" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-[#1C1829] border border-[#2D2644] rounded-xl">
            <div className="flex items-center justify-between text-xs text-[#AAA6B5]">
              <span>Receitas Totais</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-1">
              R$ {summary.totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-[#AAA6B5] mt-0.5 block">Fretes e serviços faturados</span>
          </div>

          <div className="p-4 bg-[#1C1829] border border-[#2D2644] rounded-xl">
            <div className="flex items-center justify-between text-xs text-[#AAA6B5]">
              <span>Despesas Totais</span>
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-black text-rose-400 font-mono mt-1">
              R$ {summary.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-[#AAA6B5] mt-0.5 block">Combustível, manutenção e custos</span>
          </div>

          <div className="p-4 bg-[#1C1829] border border-[#2D2644] rounded-xl">
            <div className="flex items-center justify-between text-xs text-[#AAA6B5]">
              <span>Saldo Operacional</span>
              <Receipt className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <div className={`text-xl font-black font-mono mt-1 ${summary.saldoOperacional >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {summary.saldoOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-[#AAA6B5] mt-0.5 block">Lucro bruto operacional</span>
          </div>

          <div className="p-4 bg-[#1C1829] border border-[#2D2644] rounded-xl">
            <div className="flex items-center justify-between text-xs text-[#AAA6B5]">
              <span>Margem Operacional</span>
              <PieChart className="w-4 h-4 text-[#C4B5FD]" />
            </div>
            <div className="text-xl font-black text-[#C4B5FD] font-mono mt-1">
              {summary.margemPercentual}%
            </div>
            <span className="text-[10px] text-[#AAA6B5] mt-0.5 block">Eficiência de custo de transporte</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121024] border border-[#2D2644] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#AAA6B5]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por descrição, categoria ou valor..."
            className="w-full pl-9 pr-4 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white placeholder-[#716A85] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterTipo}
            onChange={e => setFilterTipo(e.target.value)}
            className="px-3 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="all">Todas as Entradas</option>
            <option value="receita">Receitas (+)</option>
            <option value="despesa">Despesas (-)</option>
          </select>

          <select
            value={filterCategoria}
            onChange={e => setFilterCategoria(e.target.value)}
            className="px-3 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="all">Todas as Categorias</option>
            <option value="frete">Frete</option>
            <option value="combustivel">Combustível</option>
            <option value="manutencao">Manutenção</option>
            <option value="pedagio">Pedágio</option>
            <option value="salario">Salário / Diária</option>
            <option value="seguro">Seguro</option>
            <option value="aluguel_armazem">Armazém / Galpão</option>
            <option value="outros">Outros</option>
          </select>

          <button
            onClick={loadData}
            className="p-2 bg-[#1C1829] hover:bg-[#252037] border border-[#2D2644] rounded-xl text-[#AAA6B5] hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#8B5CF6]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-[#121024] border border-[#2D2644] rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2D2644] bg-[#16132C]/60 text-[11px] font-bold text-[#AAA6B5] uppercase tracking-wider">
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Descrição do Lançamento</th>
                <th className="py-3.5 px-4">Vínculo Operacional</th>
                <th className="py-3.5 px-4">Data Competência</th>
                <th className="py-3.5 px-4 text-right">Valor (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2644]/60 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#AAA6B5]">
                    <DollarSign className="w-8 h-8 text-[#716A85] mx-auto mb-2 opacity-50" />
                    <span>Nenhum lançamento financeiro registrado.</span>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-[#1A1633]/50 transition">
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        rec.tipo === 'receita'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {rec.tipo === 'receita' ? '+ Receita' : '- Despesa'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 capitalize font-medium text-[#C4B5FD]">
                      {rec.categoria.replace('_', ' ')}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-white block">{rec.descricao}</span>
                      {rec.observacoes && (
                        <span className="text-[10px] text-[#AAA6B5] block mt-0.5">{rec.observacoes}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#AAA6B5]">
                      {rec.vehicleId ? (
                        <span className="px-2 py-0.5 rounded bg-[#1C1829] border border-[#2D2644] text-[10px] font-mono">
                          Veículo: {vehicles.find(v => v.id === rec.vehicleId)?.placa || 'Veículo'}
                        </span>
                      ) : rec.routeId ? (
                        <span className="px-2 py-0.5 rounded bg-[#1C1829] border border-[#2D2644] text-[10px] font-mono">
                          Rota: {routes.find(r => r.id === rec.routeId)?.codigoRota || 'Rota'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#716A85]">Operação Geral</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#AAA6B5] font-mono text-[11px]">
                      {new Date(rec.dataCompetencia).toLocaleDateString('pt-BR')}
                    </td>

                    <td className={`py-3.5 px-4 text-right font-mono font-bold ${
                      rec.tipo === 'receita' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {rec.tipo === 'receita' ? '+' : '-'} R$ {rec.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Financial Record */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#121024] border border-[#2D2644] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Novo Lançamento Financeiro</span>
            </h3>

            <form onSubmit={handleCreateRecord} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">Tipo de Lançamento</label>
                  <select
                    value={novoTipo}
                    onChange={e => setNovoTipo(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="despesa">Despesa (-)</option>
                    <option value="receita">Receita (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">Categoria</label>
                  <select
                    value={novaCategoria}
                    onChange={e => setNovaCategoria(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="combustivel">Combustível</option>
                    <option value="frete">Receita de Frete</option>
                    <option value="manutencao">Manutenção Mecânica</option>
                    <option value="pedagio">Pedágio</option>
                    <option value="salario">Salário / Diária Entregador</option>
                    <option value="seguro">Seguro de Carga / Veículo</option>
                    <option value="aluguel_armazem">Aluguel / Galpão Logístico</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={novaDescricao}
                  onChange={e => setNovaDescricao(e.target.value)}
                  placeholder="Ex: Abastecimento Diesel S10 - Veículo Fiorino 01"
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white placeholder-[#716A85] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={novoValor}
                    onChange={e => setNovoValor(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">Data de Competência</label>
                  <input
                    type="date"
                    value={novaData}
                    onChange={e => setNovaData(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">Vincular a Veículo</label>
                  <select
                    value={veiculoVinculadoId}
                    onChange={e => setVeiculoVinculadoId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="">Nenhum</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.placa} ({v.identificacao})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">Vincular a Rota</label>
                  <select
                    value={rotaVinculadaId}
                    onChange={e => setRotaVinculadaId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="">Nenhuma</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.codigoRota} — {r.titulo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">Observações Adicionais</label>
                <input
                  type="text"
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  placeholder="Nota fiscal de combustível, comprovante, etc."
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white placeholder-[#716A85] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#2D2644]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#1C1829] hover:bg-[#252037] border border-[#2D2644] text-[#AAA6B5] rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Salvar Lançamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
