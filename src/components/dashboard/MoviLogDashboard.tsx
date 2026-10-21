import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  DeliveryItem,
  DeliveryRoute,
  Vehicle,
  User,
  FiscalDocument,
  LogisticsReceipt,
  CondoPackage
} from '../../types';
import {
  TrendingUp,
  Package,
  Truck,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  Users,
  Compass,
  ArrowUpRight,
  RefreshCw,
  Plus,
  FileSpreadsheet,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  FileText,
  Boxes,
  Send,
  Building,
  DollarSign,
  Search,
  ExternalLink,
  Receipt
} from 'lucide-react';

interface MoviLogDashboardProps {
  onNavigate: (module: string, view?: string) => void;
  onOpenPublicTrack: () => void;
}

export const MoviLogDashboard: React.FC<MoviLogDashboardProps> = ({
  onNavigate,
  onOpenPublicTrack
}) => {
  const { user, company, isMaster } = useAuth();
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [receipts, setReceipts] = useState<LogisticsReceipt[]>([]);
  const [packages, setPackages] = useState<CondoPackage[]>([]);
  const [fiscalDocs, setFiscalDocs] = useState<FiscalDocument[]>([]);
  const [financialSummary, setFinancialSummary] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    saldoOperacional: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month'>('week');

  const loadAllMetrics = async () => {
    setLoading(true);
    try {
      const [
        delRes,
        rouRes,
        vehRes,
        recRes,
        pkgRes,
        fisRes,
        finRes
      ] = await Promise.all([
        api.getDeliveries(),
        api.getRoutes(),
        api.getFleetVehicles(),
        api.getReceipts(),
        api.getCondoPackages(),
        api.getFiscalDocuments(),
        api.getFinancialSummary()
      ]);

      setDeliveries(delRes.deliveries || []);
      setRoutes(rouRes.routes || []);
      setVehicles(vehRes.vehicles || []);
      setReceipts(recRes.receipts || []);
      setPackages(pkgRes.packages || []);
      setFiscalDocs(fisRes.documents || []);
      setFinancialSummary({
        totalReceitas: finRes.totalReceitas || 0,
        totalDespesas: finRes.totalDespesas || 0,
        saldoOperacional: finRes.saldoOperacional || 0
      });
      setLastRefreshed(new Date());
    } catch (e) {
      console.error('Erro ao carregar métricas MoviLog:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllMetrics();
  }, [company?.id]);

  // Derived metrics
  const totalDeliveries = deliveries.length;
  const pendingDeliveries = deliveries.filter(d => d.status === 'pendente' || d.status === 'planejada').length;
  const inTransitDeliveries = deliveries.filter(d => d.status === 'em_rota').length;
  const deliveredDeliveries = deliveries.filter(d => d.status === 'entregue').length;
  const failedDeliveries = deliveries.filter(d => d.status === 'tentativa_falha' || d.status === 'cancelada').length;
  const completionRate = totalDeliveries > 0 ? Math.round((deliveredDeliveries / totalDeliveries) * 100) : 0;

  const totalRoutes = routes.length;
  const activeRoutes = routes.filter(r => r.status === 'em_andamento' || r.status === 'publicada').length;
  const finishedRoutes = routes.filter(r => r.status === 'concluida').length;

  const vehiclesOnline = vehicles.filter(v => v.ultimaLocalizacao?.status === 'online').length;
  const vehiclesAvailable = vehicles.filter(v => v.statusOperacional === 'disponivel').length;
  const vehiclesInRoute = vehicles.filter(v => v.statusOperacional === 'em_rota').length;

  const totalVolumesReceived = receipts.reduce((sum, r) => sum + (r.quantidadeVolumes || 0), 0);
  const condoPackagesPending = packages.filter(p => p.status === 'aguardando_retirada' || p.status === 'notificado').length;

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-[#121024] via-[#1b1536] to-[#121024] border border-[#2D2644] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#D946EF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/30">
                Torre de Controle Operacional
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Dados em Tempo Real</span>
              </span>
              <span className="text-[10px] text-[#AAA6B5]">
                Atualizado às {lastRefreshed.toLocaleTimeString('pt-BR')}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Movi</span>
              <span className="text-[#8B5CF6]">Log</span>
              <span className="text-xs font-normal text-[#AAA6B5] ml-2 hidden sm:inline">
                • Movimento inteligente. Controle total.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-[#AAA6B5] mt-1 max-w-2xl leading-relaxed">
              Painel unificado com expedição, roteirização, rastreamento de veículos, conferência de armazém, central fiscal e gestão de portaria predial.
            </p>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('routing', 'deliveries')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-lg shadow-[#8B5CF6]/30 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Entrega</span>
            </button>

            <button
              onClick={() => onNavigate('routing', 'planner')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1C1829] hover:bg-[#252037] text-white border border-[#2D2644] transition flex items-center gap-2"
            >
              <Navigation className="w-4 h-4 text-[#8B5CF6]" />
              <span>Criar Rota</span>
            </button>

            <button
              onClick={() => onNavigate('fiscal', 'documents')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1C1829] hover:bg-[#252037] text-white border border-[#2D2644] transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Central Fiscal</span>
            </button>

            <button
              onClick={onOpenPublicTrack}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1C1829] hover:bg-[#252037] text-[#C4B5FD] border border-[#8B5CF6]/40 transition flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Rastrear Código</span>
            </button>

            <button
              onClick={loadAllMetrics}
              className="p-2 rounded-xl bg-[#1C1829] hover:bg-[#252037] border border-[#2D2644] text-[#AAA6B5] hover:text-white transition"
              title="Recarregar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#8B5CF6]' : ''}`} />
            </button>
          </div>
        </div>

        {/* 6 Metric Highlight Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-[#2D2644]/60">
          <div className="p-3.5 bg-[#1C1829]/70 border border-[#2D2644] rounded-2xl">
            <span className="text-[11px] font-semibold text-[#AAA6B5] block">Entregas Totais</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{totalDeliveries}</span>
            <span className="text-[10px] text-emerald-400 mt-0.5 block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{completionRate}% concluídas</span>
            </span>
          </div>

          <div className="p-3.5 bg-[#1C1829]/70 border border-[#2D2644] rounded-2xl">
            <span className="text-[11px] font-semibold text-[#AAA6B5] block">Em Trânsito</span>
            <span className="text-2xl font-black text-[#8B5CF6] font-mono mt-1 block">{inTransitDeliveries}</span>
            <span className="text-[10px] text-[#AAA6B5] mt-0.5 block">
              {pendingDeliveries} na fila / pendentes
            </span>
          </div>

          <div className="p-3.5 bg-[#1C1829]/70 border border-[#2D2644] rounded-2xl">
            <span className="text-[11px] font-semibold text-[#AAA6B5] block">Rotas em Execução</span>
            <span className="text-2xl font-black text-sky-400 font-mono mt-1 block">{activeRoutes}</span>
            <span className="text-[10px] text-[#AAA6B5] mt-0.5 block">
              {finishedRoutes} finalizadas hoje
            </span>
          </div>

          <div className="p-3.5 bg-[#1C1829]/70 border border-[#2D2644] rounded-2xl">
            <span className="text-[11px] font-semibold text-[#AAA6B5] block">Frota Online</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{vehiclesOnline}</span>
            <span className="text-[10px] text-[#AAA6B5] mt-0.5 block">
              de {vehicles.length} veículos cadastrados
            </span>
          </div>

          <div className="p-3.5 bg-[#1C1829]/70 border border-[#2D2644] rounded-2xl">
            <span className="text-[11px] font-semibold text-[#AAA6B5] block">Documentos Fiscais</span>
            <span className="text-2xl font-black text-[#D946EF] font-mono mt-1 block">{fiscalDocs.length}</span>
            <span className="text-[10px] text-emerald-400 mt-0.5 block">
              NF-e / CT-e autorizados
            </span>
          </div>

          <div className="p-3.5 bg-[#1C1829]/70 border border-[#2D2644] rounded-2xl">
            <span className="text-[11px] font-semibold text-[#AAA6B5] block">Portaria / Encomendas</span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">{condoPackagesPending}</span>
            <span className="text-[10px] text-[#AAA6B5] mt-0.5 block">
              Aguardando retirada (PIN)
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Deliveries Status & Operational Map Teaser */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deliveries Status Flow */}
        <div className="lg:col-span-2 bg-[#121024] border border-[#2D2644] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2D2644] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-[#8B5CF6]" />
                <span>Fluxo de Estados de Entregas & Cargas</span>
              </h3>
              <span className="text-[11px] text-[#AAA6B5]">Status ponta a ponta com rastreabilidade MoviLog</span>
            </div>

            <button
              onClick={() => onNavigate('routing', 'deliveries')}
              className="text-xs font-bold text-[#8B5CF6] hover:text-[#C4B5FD] flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-[#1C1829] border border-[#2D2644] text-center">
              <span className="text-[10px] text-[#AAA6B5] font-semibold uppercase block">Pendentes</span>
              <span className="text-xl font-black text-white font-mono mt-1 block">
                {deliveries.filter(d => d.status === 'pendente').length}
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Aguardando rota</span>
            </div>

            <div className="p-3 rounded-xl bg-[#1C1829] border border-[#2D2644] text-center">
              <span className="text-[10px] text-[#AAA6B5] font-semibold uppercase block">Planejadas</span>
              <span className="text-xl font-black text-sky-400 font-mono mt-1 block">
                {deliveries.filter(d => d.status === 'planejada').length}
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Em roteirização</span>
            </div>

            <div className="p-3 rounded-xl bg-[#1C1829] border border-[#2D2644] text-center">
              <span className="text-[10px] text-[#AAA6B5] font-semibold uppercase block">Em Rota</span>
              <span className="text-xl font-black text-[#8B5CF6] font-mono mt-1 block">
                {inTransitDeliveries}
              </span>
              <span className="text-[9px] text-[#C4B5FD] block mt-0.5">Com motorista</span>
            </div>

            <div className="p-3 rounded-xl bg-[#1C1829] border border-[#2D2644] text-center">
              <span className="text-[10px] text-[#AAA6B5] font-semibold uppercase block">Entregues</span>
              <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">
                {deliveredDeliveries}
              </span>
              <span className="text-[9px] text-emerald-300 block mt-0.5">Comprovante OK</span>
            </div>

            <div className="p-3 rounded-xl bg-[#1C1829] border border-[#2D2644] text-center">
              <span className="text-[10px] text-[#AAA6B5] font-semibold uppercase block">Ocorrências</span>
              <span className="text-xl font-black text-rose-400 font-mono mt-1 block">
                {failedDeliveries}
              </span>
              <span className="text-[9px] text-rose-300 block mt-0.5">Insucessos / ausente</span>
            </div>
          </div>

          {/* Recent Deliveries List */}
          <div className="divide-y divide-[#2D2644]/60">
            {deliveries.slice(0, 5).map(del => (
              <div key={del.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-[#1C1829]/40 px-2 rounded-lg transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center font-mono font-bold text-[10px] text-[#C4B5FD]">
                    {del.codigoRastreio.slice(-3)}
                  </div>
                  <div>
                    <span className="font-bold text-white block">{del.destinatario}</span>
                    <span className="text-[10px] text-[#AAA6B5] block">
                      {del.endereco}, {del.numero} • {del.cidade}
                    </span>
                  </div>
                </div>

                <div className="text-right flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    del.status === 'entregue'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : del.status === 'em_rota'
                      ? 'bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    {del.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fast Action Cards & Telemetry */}
        <div className="bg-[#121024] border border-[#2D2644] rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#2D2644] pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Telemetria & Frota Ativa</span>
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono">GPS AO VIVO</span>
            </div>

            <div className="space-y-3">
              {vehicles.slice(0, 4).map(v => (
                <div key={v.id} className="p-3 bg-[#1C1829] border border-[#2D2644] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-[#8B5CF6]" />
                    <div>
                      <span className="font-bold text-white text-xs block">{v.placa}</span>
                      <span className="text-[10px] text-[#AAA6B5] block capitalize">{v.identificacao} • {v.categoria}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      v.ultimaLocalizacao?.status === 'online'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {v.ultimaLocalizacao?.status || 'disponível'}
                    </span>
                    {v.ultimaLocalizacao?.velocidade !== undefined && (
                      <span className="text-[10px] text-[#AAA6B5] block mt-0.5 font-mono">
                        {v.ultimaLocalizacao.velocidade} km/h
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('routing', 'map')}
            className="w-full py-2.5 rounded-xl bg-[#1C1829] hover:bg-[#252037] border border-[#2D2644] text-xs font-bold text-white transition flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-[#8B5CF6]" />
            <span>Abrir Mapa Operacional Completo</span>
          </button>
        </div>
      </div>

      {/* Grid: Financial & Fiscal Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financial Highlights */}
        <div className="bg-[#121024] border border-[#2D2644] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2D2644] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Resultados Financeiros do Período</span>
              </h3>
              <span className="text-[11px] text-[#AAA6B5]">Custos de transporte e faturamento operacional</span>
            </div>

            <button
              onClick={() => onNavigate('financial', 'records')}
              className="text-xs font-bold text-[#8B5CF6] hover:text-[#C4B5FD] flex items-center gap-1"
            >
              <span>Detalhes</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#1C1829] border border-[#2D2644]">
              <span className="text-[10px] text-[#AAA6B5] block uppercase">Faturamento</span>
              <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">
                R$ {financialSummary.totalReceitas.toFixed(2)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#1C1829] border border-[#2D2644]">
              <span className="text-[10px] text-[#AAA6B5] block uppercase">Custos / Despesas</span>
              <span className="text-base font-black text-rose-400 font-mono mt-0.5 block">
                R$ {financialSummary.totalDespesas.toFixed(2)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#1C1829] border border-[#2D2644]">
              <span className="text-[10px] text-[#AAA6B5] block uppercase">Saldo Operacional</span>
              <span className="text-base font-black text-white font-mono mt-0.5 block">
                R$ {financialSummary.saldoOperacional.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Fiscal Highlights */}
        <div className="bg-[#121024] border border-[#2D2644] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2D2644] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D946EF]" />
                <span>Central Fiscal & Documentos Autorizados</span>
              </h3>
              <span className="text-[11px] text-[#AAA6B5]">NF-e, CT-e, MDF-e vinculados às rotas</span>
            </div>

            <button
              onClick={() => onNavigate('fiscal', 'documents')}
              className="text-xs font-bold text-[#8B5CF6] hover:text-[#C4B5FD] flex items-center gap-1"
            >
              <span>Central Fiscal</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {fiscalDocs.length === 0 ? (
              <div className="py-6 text-center text-[#AAA6B5] text-xs">
                Nenhum documento fiscal emitido ainda.
              </div>
            ) : (
              fiscalDocs.slice(0, 3).map(doc => (
                <div key={doc.id} className="p-2.5 bg-[#1C1829] border border-[#2D2644] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">
                      {doc.tipo.toUpperCase()} Nº {doc.numero} • {doc.destinatarioNome}
                    </span>
                    <span className="text-[10px] font-mono text-[#AAA6B5] block">
                      Chave: {doc.chaveAcesso.slice(0, 20)}...
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-emerald-400 font-mono block">
                      R$ {doc.valorTotal.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-emerald-300 uppercase font-bold">
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
