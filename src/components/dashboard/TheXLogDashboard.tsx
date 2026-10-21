import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DeliveryItem, DeliveryRoute, Vehicle, User } from '../../types';
import { api } from '../../lib/api';
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
  FileText
} from 'lucide-react';

interface TheXLogDashboardProps {
  onNavigate: (module: string, view?: string) => void;
}

export const TheXLogDashboard: React.FC<TheXLogDashboardProps> = ({ onNavigate }) => {
  const { user, company, isMaster } = useAuth();
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadData = async () => {
    setLoading(true);
    try {
      const [delRes, rouRes, vehRes, usrRes] = await Promise.all([
        api.getDeliveries(),
        api.getRoutes(),
        api.getFleetVehicles(),
        api.getCompanyUsers()
      ]);
      setDeliveries(delRes.deliveries || []);
      setRoutes(rouRes.routes || []);
      setVehicles(vehRes.vehicles || []);
      const drvs = (usrRes.users || []).filter(u => u.role === 'driver');
      setDrivers(drvs);
      setLastRefreshed(new Date());
    } catch (e) {
      console.error('Erro ao carregar dashboard TheXLog:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  // Real calculations
  const totalDeliveries = deliveries.length;
  const pendingDeliveries = deliveries.filter(d => d.status === 'pendente').length;
  const inRouteDeliveries = deliveries.filter(d => d.status === 'em_rota' || d.status === 'planejada').length;
  const completedDeliveries = deliveries.filter(d => d.status === 'entregue').length;
  const failedDeliveries = deliveries.filter(d => d.status === 'tentativa_falha').length;

  const totalFinished = completedDeliveries + failedDeliveries;
  const successRate = totalFinished > 0 ? Math.round((completedDeliveries / totalFinished) * 100) : 100;

  const totalKgDispatched = deliveries.reduce((acc, d) => acc + (d.pesoKg || 0), 0);
  const totalVolumesDispatched = deliveries.reduce((acc, d) => acc + (d.volumes || 0), 0);

  // Routes
  const publishedRoutes = routes.filter(r => r.status === 'publicada' || r.status === 'em_andamento').length;
  const activeRoutes = routes.filter(r => r.status === 'em_andamento').length;
  const completedRoutes = routes.filter(r => r.status === 'concluida').length;

  // Vehicles
  const onlineVehicles = vehicles.filter(v => {
    if (!v.ultimaLocalizacao?.atualizadoEm) return false;
    const diffMin = (Date.now() - new Date(v.ultimaLocalizacao.atualizadoEm).getTime()) / 60000;
    return diffMin < 15;
  }).length;
  const vehiclesInRoute = vehicles.filter(v => v.statusOperacional === 'em_rota').length;
  const totalFleetKgCapacity = vehicles.reduce((acc, v) => acc + (v.capacidadeKg || 0), 0);

  // Priority breakdown
  const urgentDeliveries = deliveries.filter(d => d.prioridade === 'urgente' && d.status === 'pendente').length;
  const highDeliveries = deliveries.filter(d => d.prioridade === 'alta' && d.status === 'pendente').length;

  // Recent deliveries list (max 5)
  const recentDeliveries = [...deliveries]
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d0f18] via-[#121124] to-[#0d0f18] border border-violet-500/20 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/30">
                TheXLog Executive Engine
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {company?.nomeFantasia || 'Plataforma Corporativa'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Visão Geral das Operações
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Monitoramento unificado de distribuição, roteirização inteligente, telemetria veicular e ocorrências em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-2"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-violet-400' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <button
              onClick={() => onNavigate('deliveries', 'create_manual')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-violet-600/25"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Entrega</span>
            </button>

            <button
              onClick={() => onNavigate('routes', 'planner')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-violet-500/30 text-violet-300 hover:text-white text-xs font-bold transition flex items-center gap-2"
            >
              <Navigation className="w-4 h-4 text-violet-400" />
              <span>Planejar Rota</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (8 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Deliveries */}
        <div
          onClick={() => onNavigate('deliveries')}
          className="cursor-pointer group p-5 rounded-2xl bg-[#0c0e16] border border-slate-800/80 hover:border-violet-500/40 transition shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Total de Entregas</span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center group-hover:scale-110 transition">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-black text-white tabular-nums">
              {totalDeliveries}
            </span>
            <span className="text-[11px] text-slate-500">volumes: {totalVolumesDispatched}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-violet-400 transition">
            <span>Ver listagem completa</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Pending Deliveries */}
        <div
          onClick={() => onNavigate('deliveries')}
          className="cursor-pointer group p-5 rounded-2xl bg-[#0c0e16] border border-slate-800/80 hover:border-amber-500/40 transition shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Entregas Pendentes</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 tabular-nums">
              {pendingDeliveries}
            </span>
            {urgentDeliveries > 0 && (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
                {urgentDeliveries} urgentes
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-amber-400 transition">
            <span>Aguardando roteirização</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* In Route */}
        <div
          onClick={() => onNavigate('map')}
          className="cursor-pointer group p-5 rounded-2xl bg-[#0c0e16] border border-slate-800/80 hover:border-sky-500/40 transition shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Em Rota / Deslocamento</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-black text-sky-400 tabular-nums">
              {inRouteDeliveries}
            </span>
            <span className="text-[11px] text-slate-500">em {publishedRoutes} rota(s)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-sky-400 transition">
            <span>Ver mapa em tempo real</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Success Rate / Delivered */}
        <div
          onClick={() => onNavigate('pod')}
          className="cursor-pointer group p-5 rounded-2xl bg-[#0c0e16] border border-slate-800/80 hover:border-emerald-500/40 transition shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Concluídas & Taxa</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 tabular-nums">
              {completedDeliveries}
            </span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              ({successRate}%)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-emerald-400 transition">
            <span>Comprovantes de entrega</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Failed / Insucessos */}
        <div
          onClick={() => onNavigate('occurrences')}
          className="cursor-pointer group p-5 rounded-2xl bg-[#0c0e16] border border-slate-800/80 hover:border-rose-500/40 transition shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Ocorrências / Insucessos</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-black text-rose-400 tabular-nums">
              {failedDeliveries}
            </span>
            <span className="text-[11px] text-slate-500">requerem atenção</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-rose-400 transition">
            <span>Ver motivos e reagendar</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Published & Active Routes */}
        <div
          onClick={() => onNavigate('routes')}
          className="cursor-pointer group p-5 rounded-2xl bg-[#0c0e16] border border-slate-800/80 hover:border-indigo-500/40 transition shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Rotas de Entrega</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-black text-indigo-300 tabular-nums">
              {routes.length}
            </span>
            <span className="text-[11px] text-slate-500">{activeRoutes} em trânsito</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-indigo-400 transition">
            <span>Roteirizador de viagens</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Fleet & Telemetry */}
        <div
          onClick={() => onNavigate('fleet')}
          className="cursor-pointer group p-5 rounded-2xl bg-[#0c0e16] border border-slate-800/80 hover:border-violet-500/40 transition shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Frota & Rastreamento GPS</span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center group-hover:scale-110 transition">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-black text-white tabular-nums">
              {vehicles.length}
            </span>
            <span className="text-[11px] text-emerald-400 font-bold">
              • {onlineVehicles} online
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-violet-400 transition">
            <span>Capacidade total: {totalFleetKgCapacity} kg</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Drivers */}
        <div
          onClick={() => onNavigate('drivers')}
          className="cursor-pointer group p-5 rounded-2xl bg-[#0c0e16] border border-slate-800/80 hover:border-slate-700 transition shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Motoristas & Condutores</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-black text-white tabular-nums">
              {drivers.length}
            </span>
            <span className="text-[11px] text-slate-500">cadastrados</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-slate-300 transition">
            <span>Gestão de condutores</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Main Charts & Operational Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Delivery Status Visual Distribution (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0b0d14] border border-slate-800/90 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                <span>Distribuição Operacional de Entregas</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Valores reais computados com base nos dados ativos da sua empresa
              </p>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Total: {totalDeliveries} registros
            </span>
          </div>

          {/* Visual Bar Breakdown */}
          {totalDeliveries === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenhuma entrega cadastrada ainda. Cadastre manualmente ou importe uma planilha para visualizar o gráfico.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stacked Progress Bar */}
              <div className="h-5 w-full bg-slate-900 rounded-xl overflow-hidden flex shadow-inner border border-slate-800">
                {completedDeliveries > 0 && (
                  <div
                    style={{ width: `${(completedDeliveries / totalDeliveries) * 100}%` }}
                    className="bg-emerald-500 hover:brightness-110 transition-all duration-500"
                    title={`Concluídas: ${completedDeliveries}`}
                  />
                )}
                {inRouteDeliveries > 0 && (
                  <div
                    style={{ width: `${(inRouteDeliveries / totalDeliveries) * 100}%` }}
                    className="bg-sky-500 hover:brightness-110 transition-all duration-500"
                    title={`Em Rota: ${inRouteDeliveries}`}
                  />
                )}
                {pendingDeliveries > 0 && (
                  <div
                    style={{ width: `${(pendingDeliveries / totalDeliveries) * 100}%` }}
                    className="bg-amber-500 hover:brightness-110 transition-all duration-500"
                    title={`Pendentes: ${pendingDeliveries}`}
                  />
                )}
                {failedDeliveries > 0 && (
                  <div
                    style={{ width: `${(failedDeliveries / totalDeliveries) * 100}%` }}
                    className="bg-rose-500 hover:brightness-110 transition-all duration-500"
                    title={`Insucessos: ${failedDeliveries}`}
                  />
                )}
              </div>

              {/* Status Breakdown Legend & Numerical Values */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs text-slate-400">Entregues</span>
                  </div>
                  <span className="text-lg font-mono font-bold text-white tabular-nums">
                    {completedDeliveries}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-1.5 font-mono">
                    ({Math.round((completedDeliveries / (totalDeliveries || 1)) * 100)}%)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                    <span className="text-xs text-slate-400">Em Rota</span>
                  </div>
                  <span className="text-lg font-mono font-bold text-white tabular-nums">
                    {inRouteDeliveries}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-1.5 font-mono">
                    ({Math.round((inRouteDeliveries / (totalDeliveries || 1)) * 100)}%)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-xs text-slate-400">Pendentes</span>
                  </div>
                  <span className="text-lg font-mono font-bold text-white tabular-nums">
                    {pendingDeliveries}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-1.5 font-mono">
                    ({Math.round((pendingDeliveries / (totalDeliveries || 1)) * 100)}%)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-xs text-slate-400">Insucesso</span>
                  </div>
                  <span className="text-lg font-mono font-bold text-white tabular-nums">
                    {failedDeliveries}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-1.5 font-mono">
                    ({Math.round((failedDeliveries / (totalDeliveries || 1)) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Routing Action Prompt */}
          {pendingDeliveries > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-slate-900 border border-violet-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/30">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Existem {pendingDeliveries} entregas aguardando roteirização
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Otimize sequenciamento por CEP, reduza custos de combustível e publique para os condutores.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('routes', 'planner')}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition shrink-0"
              >
                Abrir Roteirizador
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Fleet Status & Operational Health */}
        <div className="p-6 rounded-3xl bg-[#0b0d14] border border-slate-800/90 shadow-xl space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-violet-400" />
                <span>Saúde da Frota & Telemetria</span>
              </h2>
              <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/30">
                GPS Ativo
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <span className="text-slate-400">Veículos com sinal recente:</span>
                <span className="font-mono font-bold text-emerald-400">{onlineVehicles} / {vehicles.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <span className="text-slate-400">Veículos em rota ativa:</span>
                <span className="font-mono font-bold text-sky-400">{vehiclesInRoute} em operação</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <span className="text-slate-400">Capacidade de carga total:</span>
                <span className="font-mono font-bold text-slate-200">{totalKgDispatched.toFixed(1)} / {totalFleetKgCapacity} kg</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <span className="text-slate-400">Motoristas vinculados:</span>
                <span className="font-mono font-bold text-slate-200">{drivers.length} condutores</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <button
              onClick={() => onNavigate('map')}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-violet-400" />
              <span>Acessar Mapa Operacional ao Vivo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activity & Deliveries Feed */}
      <div className="p-6 rounded-3xl bg-[#0b0d14] border border-slate-800/90 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-violet-400" />
              <span>Entregas Recentes Cadastradas</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Últimos lançamentos registrados no sistema
            </p>
          </div>

          <button
            onClick={() => onNavigate('deliveries')}
            className="text-xs font-bold text-violet-400 hover:text-violet-300 transition flex items-center gap-1"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentDeliveries.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Nenhuma entrega registrada. Utilize os botões superiores para iniciar a operação.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400">
                  <th className="pb-3 font-semibold">Código</th>
                  <th className="pb-3 font-semibold">Destinatário</th>
                  <th className="pb-3 font-semibold">Endereço & Bairro</th>
                  <th className="pb-3 font-semibold">Cidade/UF</th>
                  <th className="pb-3 font-semibold">Prioridade</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recentDeliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 font-mono font-bold text-violet-400">{d.codigoRastreio}</td>
                    <td className="py-3 font-medium text-white">{d.destinatario}</td>
                    <td className="py-3 text-slate-300">{d.endereco}, {d.numero} • {d.bairro}</td>
                    <td className="py-3 text-slate-400">{d.cidade}/{d.estado || 'SP'}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        d.prioridade === 'urgente'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : d.prioridade === 'alta'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {d.prioridade}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        d.status === 'entregue'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : d.status === 'em_rota'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                          : d.status === 'tentativa_falha'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {d.status === 'em_rota' ? 'Em Rota' : d.status === 'tentativa_falha' ? 'Insucesso' : d.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-500 font-mono">
                      {new Date(d.criadoEm).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
