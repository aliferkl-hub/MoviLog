import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DeliveryItem, Vehicle, DeliveryRoute, RouteStop } from '../../types';
import { api } from '../../lib/api';
import { RouteMap } from './RouteMap';
import {
  Map,
  Navigation,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Layers,
  Send,
  Calendar,
  Sparkles,
  Loader2,
  X,
  MapPin,
  RefreshCw,
  FileText,
  UserCheck,
  Check
} from 'lucide-react';

export const DispatcherPlannerView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'planner' | 'published' | 'completed'>('planner');

  // Data
  const [pendingDeliveries, setPendingDeliveries] = useState<DeliveryItem[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(true);

  // Planner Selection
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<string[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [routeTitle, setRouteTitle] = useState('');

  // Route Engine Suggestion Result
  const [suggestedStops, setSuggestedStops] = useState<RouteStop[]>([]);
  const [estimatedKm, setEstimatedKm] = useState(0);
  const [estimatedMin, setEstimatedMin] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [capacityExceeded, setCapacityExceeded] = useState(false);
  const [planningLoading, setPlanningLoading] = useState(false);

  // Selected stop for highlighting on map
  const [selectedStopIdx, setSelectedStopIdx] = useState<number | undefined>(undefined);

  // Publishing State
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  // View single route modal / details
  const [viewingRoute, setViewingRoute] = useState<DeliveryRoute | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [delRes, vehRes, usrRes, rouRes] = await Promise.all([
        api.getDeliveries({ status: 'pendente' }),
        api.getFleetVehicles(),
        api.getCompanyUsers(),
        api.getRoutes()
      ]);

      setPendingDeliveries(delRes.deliveries);
      setVehicles(vehRes.vehicles);
      const drvs = usrRes.users.filter(u => u.role === 'driver');
      setDrivers(drvs);
      setRoutes(rouRes.routes);

      // Default vehicle
      if (vehRes.vehicles.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(vehRes.vehicles[0].id);
        if (vehRes.vehicles[0].motoristaVinculadoId) {
          setSelectedDriverId(vehRes.vehicles[0].motoristaVinculadoId);
        }
      }
    } catch (e: any) {
      console.error('Erro ao carregar dados do roteirista:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When vehicle changes, auto-fill driver if linked
  const handleVehicleChange = (vId: string) => {
    setSelectedVehicleId(vId);
    const v = vehicles.find(veh => veh.id === vId);
    if (v && v.motoristaVinculadoId) {
      setSelectedDriverId(v.motoristaVinculadoId);
    }
  };

  // Toggle delivery selection
  const toggleSelectDelivery = (id: string) => {
    if (selectedDeliveryIds.includes(id)) {
      setSelectedDeliveryIds(selectedDeliveryIds.filter(dId => dId !== id));
    } else {
      setSelectedDeliveryIds([...selectedDeliveryIds, id]);
    }
  };

  const selectAllPending = () => {
    if (selectedDeliveryIds.length === pendingDeliveries.length) {
      setSelectedDeliveryIds([]);
    } else {
      setSelectedDeliveryIds(pendingDeliveries.map(d => d.id));
    }
  };

  // Run Route Engine
  const handleRunPlanning = async () => {
    if (selectedDeliveryIds.length === 0) {
      alert('Selecione pelo menos uma entrega pendente para planejar a rota.');
      return;
    }
    if (!selectedVehicleId) {
      alert('Selecione um veículo da frota.');
      return;
    }

    setPlanningLoading(true);
    setWarnings([]);
    try {
      const res = await api.planRouteSuggestion({
        deliveryIds: selectedDeliveryIds,
        veiculoId: selectedVehicleId
      });

      setSuggestedStops(res.suggestedStops);
      setEstimatedKm(res.estimatedDistanceKm);
      setEstimatedMin(res.estimatedDurationMin);
      setCapacityExceeded(res.capacityExceeded);
      setWarnings(res.warnings);

      if (!routeTitle) {
        const v = vehicles.find(veh => veh.id === selectedVehicleId);
        setRouteTitle(`Rota ${v?.identificacao || 'Expresso'} - ${new Date().toLocaleDateString('pt-BR')}`);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao calcular rota.');
    } finally {
      setPlanningLoading(false);
    }
  };

  // Reorder Stops manually
  const moveStop = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= suggestedStops.length) return;
    const updated = [...suggestedStops];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    // Re-index ordem
    const reindexed = updated.map((s, idx) => ({ ...s, ordem: idx + 1 }));
    setSuggestedStops(reindexed);
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    if (suggestedStops.length === 0) return;
    try {
      await api.createRoute({
        titulo: routeTitle || 'Nova Rota em Preparação',
        veiculoId: selectedVehicleId,
        motoristaId: selectedDriverId,
        stops: suggestedStops,
        distanciaEstimadaKm: estimatedKm,
        tempoEstimadoMinutos: estimatedMin
      });

      alert('Rota salva em preparação com sucesso!');
      setSuggestedStops([]);
      setSelectedDeliveryIds([]);
      setRouteTitle('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar rota.');
    }
  };

  // Publish Route directly
  const handlePublishDirectly = async () => {
    if (suggestedStops.length === 0) return;
    if (!selectedDriverId) {
      alert('Selecione um motorista responsável antes de publicar a rota.');
      return;
    }

    setPublishLoading(true);
    try {
      // 1. Create Route
      const created = await api.createRoute({
        titulo: routeTitle || `Rota ${new Date().toLocaleDateString('pt-BR')}`,
        veiculoId: selectedVehicleId,
        motoristaId: selectedDriverId,
        stops: suggestedStops,
        distanciaEstimadaKm: estimatedKm,
        tempoEstimadoMinutos: estimatedMin
      });

      // 2. Publish Route
      await api.publishRoute(created.route.id);

      setPublishSuccess(`Rota ${created.route.codigoRota} publicada com sucesso para o motorista!`);
      setTimeout(() => setPublishSuccess(null), 6000);

      // Reset
      setSuggestedStops([]);
      setSelectedDeliveryIds([]);
      setRouteTitle('');
      await loadData();
      setActiveTab('published');
    } catch (err: any) {
      alert(err.message || 'Erro ao publicar rota.');
    } finally {
      setPublishLoading(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const selectedDeliveriesTotalKg = pendingDeliveries
    .filter(d => selectedDeliveryIds.includes(d.id))
    .reduce((acc, d) => acc + (d.pesoKg || 1), 0);
  const selectedDeliveriesTotalVol = pendingDeliveries
    .filter(d => selectedDeliveryIds.includes(d.id))
    .reduce((acc, d) => acc + (d.volumes || 1), 0);

  const activeRoutes = routes.filter(r => r.status === 'publicada' || r.status === 'em_andamento');
  const completedRoutes = routes.filter(r => r.status === 'concluida');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-sky-950/30 border border-indigo-500/30 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>LET’S LOG — Painel do Roteirista</span>
                </span>
                <span className="text-xs text-slate-400">Motor Inteligente de Roteirização</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Planejamento & Despacho de Rotas
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {publishSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{publishSuccess}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('planner')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'planner'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Planejar Nova Rota</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 text-slate-300 font-bold">
            {pendingDeliveries.length} pendentes
          </span>
        </button>

        <button
          onClick={() => setActiveTab('published')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'published'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Rotas Publicadas & Em Rota</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 text-slate-300 font-bold">
            {activeRoutes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Rotas Concluídas</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 text-slate-300 font-bold">
            {completedRoutes.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PLANNER WORKSPACE */}
      {activeTab === 'planner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Delivery Selection & Fleet (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Step 1: Vehicle & Driver Selection */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-400" />
                <span>1. Veículo & Motorista</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Veículo da Frota
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.identificacao} ({v.placa}) - {v.capacidadeKg}kg
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Motorista Atribuído
                  </label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Selecione o motorista...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vehicle Capacity Meter */}
              {selectedVehicle && (
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Capacidade de Carga (kg):</span>
                    <span className={`font-bold ${capacityExceeded ? 'text-rose-400' : 'text-slate-200'}`}>
                      {selectedDeliveriesTotalKg.toFixed(1)} / {selectedVehicle.capacidadeKg} kg
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        capacityExceeded ? 'bg-rose-500' : 'bg-indigo-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (selectedDeliveriesTotalKg / selectedVehicle.capacidadeKg) * 100)}%`
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Volumes selecionados:</span>
                    <span className="font-bold text-slate-200">
                      {selectedDeliveriesTotalVol} / {selectedVehicle.capacidadeVolumes} vol
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Pending Deliveries Picker */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>2. Entregas Disponíveis ({pendingDeliveries.length})</span>
                </h3>

                <button
                  onClick={selectAllPending}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {selectedDeliveryIds.length === pendingDeliveries.length ? 'Desmarcar Todas' : 'Marcar Todas'}
                </button>
              </div>

              {pendingDeliveries.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 italic">
                  Nenhuma entrega pendente para roteirização no momento. Cadastre novas entregas ou importe uma planilha.
                </p>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                  {pendingDeliveries.map(del => {
                    const isSelected = selectedDeliveryIds.includes(del.id);
                    return (
                      <div
                        key={del.id}
                        onClick={() => toggleSelectDelivery(del.id)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-indigo-950/30 border-indigo-500/50'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-1 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white truncate">{del.destinatario}</span>
                            <span className="text-[10px] font-mono font-bold text-slate-400">{del.codigoRastreio}</span>
                          </div>
                          <div className="text-[11px] text-slate-300 truncate mt-0.5">
                            {del.endereco}, {del.numero} - {del.bairro}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                            <span>{del.volumes} vol • {del.pesoKg} kg</span>
                            <span className={`font-bold uppercase ${del.prioridade === 'urgente' ? 'text-rose-400' : 'text-slate-400'}`}>
                              {del.prioridade}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={handleRunPlanning}
                disabled={selectedDeliveryIds.length === 0 || planningLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50"
              >
                {planningLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                <span>Calcular Sequência & Otimizar Rota ({selectedDeliveryIds.length})</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Map & Stops Sequencer (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Map Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Map className="w-4 h-4 text-indigo-400" />
                  <span>Visualização Geográfica da Rota</span>
                </h3>

                {estimatedKm > 0 && (
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-sky-400">~{estimatedKm} km estimados</span>
                    <span className="text-slate-400">|</span>
                    <span className="font-bold text-amber-400">~{estimatedMin} min de viagem</span>
                  </div>
                )}
              </div>

              <RouteMap
                stops={suggestedStops}
                vehicle={selectedVehicle}
                selectedStopIndex={selectedStopIdx}
                onSelectStop={(idx) => setSelectedStopIdx(idx)}
                height="320px"
              />
            </div>

            {/* Warnings Alert */}
            {warnings.length > 0 && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 space-y-1">
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Ordered Stops List */}
            {suggestedStops.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Sequência das Paradas ({suggestedStops.length} entregas)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Você pode reorganizar a ordem das paradas manualmente usando os botões subir e descer.
                    </p>
                  </div>

                  <input
                    type="text"
                    value={routeTitle}
                    onChange={(e) => setRouteTitle(e.target.value)}
                    placeholder="Nome / Identificação da Rota"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-full sm:w-64"
                  />
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {suggestedStops.map((stop, idx) => (
                    <div
                      key={stop.deliveryId}
                      className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        selectedStopIdx === idx
                          ? 'bg-indigo-950/40 border-indigo-500'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                          {stop.ordem}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{stop.destinatario}</div>
                          <div className="text-[11px] text-slate-300">{stop.enderecoCompleto}</div>
                          <div className="text-[10px] text-slate-400">
                            {stop.bairro} • {stop.volumes} vol ({stop.pesoKg} kg)
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveStop(idx, idx - 1)}
                          disabled={idx === 0}
                          title="Subir parada"
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveStop(idx, idx + 1)}
                          disabled={idx === suggestedStops.length - 1}
                          title="Descer parada"
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dispatch / Publish Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={handleSaveDraft}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                  >
                    Salvar em Preparação
                  </button>

                  <button
                    onClick={handlePublishDirectly}
                    disabled={publishLoading || !selectedDriverId}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                  >
                    {publishLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Confirmar e Publicar Rota para o Entregador</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2 & 3: ROUTES LIST */}
      {(activeTab === 'published' || activeTab === 'completed') && (
        <div className="space-y-4">
          {routes.filter(r => (activeTab === 'published' ? r.status !== 'concluida' : r.status === 'concluida')).length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
              <Navigation className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Nenhuma rota encontrada nesta categoria</h3>
              <p className="text-xs text-slate-400">
                Utilize a aba "Planejar Nova Rota" para agrupar entregas e publicar rotas para a sua frota.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {routes
                .filter(r => (activeTab === 'published' ? r.status !== 'concluida' : r.status === 'concluida'))
                .map(route => {
                  const isDone = route.status === 'concluida';
                  const inProgress = route.status === 'em_andamento';

                  return (
                    <div
                      key={route.id}
                      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-sky-400">{route.codigoRota}</span>
                          <span className="text-[10px] text-slate-500 ml-2">v{route.versao}</span>
                          <h4 className="text-base font-bold text-white mt-1">{route.titulo}</h4>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : inProgress
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          }`}
                        >
                          {route.status === 'em_preparacao' && 'Em preparação'}
                          {route.status === 'publicada' && 'Publicada (Aguardando motorista)'}
                          {route.status === 'em_andamento' && 'Em andamento'}
                          {route.status === 'concluida' && 'Concluída'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Motorista</span>
                          <span className="font-bold text-white text-xs">{route.motoristaNome}</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Veículo</span>
                          <span className="font-bold text-white text-xs">{route.veiculoPlaca}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                        <span>{route.totalParadas} paradas</span>
                        <span>{route.totalVolumes} volumes</span>
                        <span>{route.totalPesoKg} kg</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                        <span className="text-slate-500">
                          {new Date(route.criadaEm).toLocaleDateString('pt-BR')}
                        </span>
                        <button
                          onClick={() => setViewingRoute(route)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold transition"
                        >
                          Ver Mapa & Paradas
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: VER DETALHES DA ROTA */}
      {viewingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 my-8 space-y-4">
            <button
              onClick={() => setViewingRoute(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-sky-400">{viewingRoute.codigoRota} (v{viewingRoute.versao})</span>
                <h3 className="text-xl font-bold text-white">{viewingRoute.titulo}</h3>
                <p className="text-xs text-slate-400">
                  Motorista: {viewingRoute.motoristaNome} • Veículo: {viewingRoute.veiculoPlaca} ({viewingRoute.veiculoIdentificacao})
                </p>
              </div>
            </div>

            <RouteMap stops={viewingRoute.paradas} height="300px" />

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {viewingRoute.paradas.map(stop => (
                <div
                  key={stop.deliveryId}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-200 font-bold flex items-center justify-center text-xs">
                      {stop.ordem}
                    </span>
                    <div>
                      <span className="font-bold text-white">{stop.destinatario}</span>
                      <p className="text-[11px] text-slate-400">{stop.enderecoCompleto} - {stop.bairro}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      stop.status === 'entregue'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : stop.status === 'tentativa_falha'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {stop.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setViewingRoute(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
