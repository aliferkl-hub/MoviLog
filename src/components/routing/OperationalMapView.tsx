import React, { useState, useEffect } from 'react';
import { RouteStop, Vehicle, DeliveryRoute } from '../../types';
import { api } from '../../lib/api';
import { RouteMap } from './RouteMap';
import {
  Compass,
  MapPin,
  Truck,
  Navigation,
  RefreshCw,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Filter,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const OperationalMapView: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | undefined>(undefined);

  const loadOperationalData = async () => {
    setLoading(true);
    try {
      const [vehRes, rouRes] = await Promise.all([
        api.getFleetVehicles(),
        api.getRoutes()
      ]);
      setVehicles(vehRes.vehicles || []);
      setRoutes(rouRes.routes || []);
    } catch (e) {
      console.error('Erro ao carregar mapa operacional:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperationalData();
    const interval = setInterval(() => {
      api.getFleetVehicles().then(v => setVehicles(v.vehicles || [])).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Filter stops based on selected route
  const activeRoutes = routes.filter(r => r.status === 'publicada' || r.status === 'em_andamento');
  const displayRoutes = selectedRouteId === 'all'
    ? activeRoutes
    : routes.filter(r => r.id === selectedRouteId);

  const displayStops: RouteStop[] = displayRoutes.flatMap(r => r.paradas || []);

  const displayVehicle = selectedVehicleId === 'all'
    ? vehicles.find(v => v.ultimaLocalizacao?.lat)
    : vehicles.find(v => v.id === selectedVehicleId);

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-[#0b0d14] border border-slate-800/90 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Mapa Operacional em Tempo Real</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                {vehicles.filter(v => v.ultimaLocalizacao).length} veículos com telemetria
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Visualização simultânea de frotas rastreadas, rotas publicadas e sequência de paradas
            </p>
          </div>
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Select Route */}
          <select
            value={selectedRouteId}
            onChange={(e) => {
              setSelectedRouteId(e.target.value);
              setSelectedStopIndex(undefined);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value="all">Todas as Rotas Ativas ({activeRoutes.length})</option>
            {routes.map(r => (
              <option key={r.id} value={r.id}>
                {r.codigoRota} - {r.titulo} ({r.paradas.length} paradas)
              </option>
            ))}
          </select>

          {/* Select Vehicle */}
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value="all">Todos os Veículos da Frota ({vehicles.length})</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.placa} ({v.identificacao}) {v.ultimaLocalizacao ? '• GPS OK' : '• Sem GPS'}
              </option>
            ))}
          </select>

          <button
            onClick={loadOperationalData}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Atualizar posições"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative bg-slate-950">
        <RouteMap
          stops={displayStops}
          vehicle={displayVehicle}
          height="620px"
          selectedStopIndex={selectedStopIndex}
          onSelectStop={(idx) => setSelectedStopIndex(idx)}
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-2xl text-[11px] text-slate-300 space-y-1.5 max-w-xs">
          <div className="font-bold text-white text-xs mb-1">Legenda Operacional:</div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Entrega Concluída com Sucesso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-sky-500 shrink-0" />
            <span>Parada Pendente em Rota</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0" />
            <span>Tentativa Falha / Ocorrência</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 shrink-0 border border-white" />
            <span>Veículo com Telemetria Ativa</span>
          </div>
        </div>
      </div>

      {/* Selected Route / Stops Inspection List */}
      {displayStops.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#0b0d14] border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white">Paradas na Visualização Atual ({displayStops.length})</span>
            <span className="text-[11px] text-slate-500">Clique em uma parada para destacar no mapa</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {displayStops.map((s, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedStopIndex(idx)}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between gap-2 ${
                  selectedStopIndex === idx
                    ? 'bg-violet-950/40 border-violet-500 text-white'
                    : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] font-bold text-violet-400 shrink-0">
                    {s.ordem}
                  </span>
                  <div className="truncate">
                    <strong className="block truncate text-white">{s.destinatario}</strong>
                    <span className="text-[10px] text-slate-500 truncate block">{s.bairro} - {s.cidade}</span>
                  </div>
                </div>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                  s.status === 'entregue'
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : s.status === 'tentativa_falha'
                    ? 'text-rose-400 bg-rose-500/10'
                    : 'text-amber-400 bg-amber-500/10'
                }`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
