import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Vehicle } from '../../types';
import { api } from '../../lib/api';
import {
  Truck,
  Plus,
  Radio,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Gauge,
  BatteryCharging,
  Navigation,
  RefreshCw,
  UserCheck
} from 'lucide-react';

export const FleetView: React.FC = () => {
  const { user, isMaster } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    placa: '',
    identificacao: '',
    categoria: 'fiorino' as const,
    tipoPropriedade: 'proprio' as const,
    capacidadeKg: 650,
    capacidadeVolumes: 40,
    motoristaVinculadoId: '',
    tipoRastreamento: 'app_gps' as const
  });

  const loadFleetData = async () => {
    setLoading(true);
    try {
      const [vRes, uRes] = await Promise.all([
        api.getFleetVehicles(),
        api.getCompanyUsers()
      ]);
      setVehicles(vRes.vehicles);
      // Filter drivers
      const drvs = uRes.users.filter(u => u.role === 'driver');
      setDrivers(drvs);
    } catch (e: any) {
      console.error('Erro ao carregar frota:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFleetData();
    // Auto-refresh GPS positions every 15s
    const timer = setInterval(() => {
      api.getFleetVehicles().then(res => setVehicles(res.vehicles)).catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.createVehicle(formData);
      setShowModal(false);
      setFormData({
        placa: '',
        identificacao: '',
        categoria: 'fiorino',
        tipoPropriedade: 'proprio',
        capacidadeKg: 650,
        capacidadeVolumes: 40,
        motoristaVinculadoId: '',
        tipoRastreamento: 'app_gps'
      });
      await loadFleetData();
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar veículo');
    } finally {
      setSubmitting(false);
    }
  };

  const getGpsStatus = (veh: Vehicle) => {
    if (!veh.ultimaLocalizacao) {
      return { label: 'Sem sinal / Aguardando', color: 'text-slate-500 bg-slate-800' };
    }
    const diff = (Date.now() - new Date(veh.ultimaLocalizacao.atualizadoEm).getTime()) / 1000;
    if (diff < 180) { // < 3 min
      return { label: `Online (${Math.round(diff)}s atrás)`, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40' };
    }
    if (diff < 900) { // < 15 min
      return { label: `Recente (${Math.round(diff / 60)} min atrás)`, color: 'text-amber-400 bg-amber-500/20 border-amber-500/40' };
    }
    return { label: 'Offline', color: 'text-rose-400 bg-rose-500/20 border-rose-500/40' };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-600/15 via-slate-900 to-indigo-950/30 border border-violet-500/30 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-violet-500/20 text-violet-300 border border-violet-500/40 rounded-full flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>LET’S LOG — Gestão de Frota & GPS</span>
                </span>
                <span className="text-xs text-slate-400">Rastreamento Autorizado</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Veículos & Motoristas
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadFleetData}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar Posições</span>
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-lg shadow-violet-600/25"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Veículo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <span className="text-xs">Carregando frota e posições GPS...</span>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Nenhum veículo cadastrado na frota</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Cadastre os veículos que a sua empresa realmente utiliza (motos, vans, fiorinos, caminhões) para habilitar o motor de roteirização e o rastreamento ao vivo.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition"
          >
            Cadastrar Primeiro Veículo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((veh) => {
            const gps = getGpsStatus(veh);
            const isOnline = veh.ultimaLocalizacao && gps.label.startsWith('Online');

            return (
              <div
                key={veh.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {veh.categoria.toUpperCase()} • {veh.tipoPropriedade.toUpperCase()}
                    </span>
                    <h4 className="text-base font-bold text-white mt-0.5">{veh.identificacao}</h4>
                    <div className="font-mono text-xs font-black text-amber-400 mt-1 px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 inline-block">
                      {veh.placa}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${gps.color}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                    <span>{gps.label}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800/80">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Capacidade Peso</span>
                    <span className="font-bold text-white text-xs">{veh.capacidadeKg} kg</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Capacidade Volumes</span>
                    <span className="font-bold text-white text-xs">{veh.capacidadeVolumes} vol</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-violet-400" />
                      <span>Motorista Vinculado:</span>
                    </span>
                    <span className="font-semibold text-white">
                      {veh.motoristaVinculadoNome || 'Não vinculado'}
                    </span>
                  </div>

                  {veh.ultimaLocalizacao ? (
                    <div className="text-[11px] space-y-1 text-slate-400 pt-1 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>Coordenadas:</span>
                        </span>
                        <span className="font-mono text-slate-300">
                          {veh.ultimaLocalizacao.lat.toFixed(4)}, {veh.ultimaLocalizacao.lng.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-sky-400" />
                          <span>Velocidade:</span>
                        </span>
                        <span className="font-semibold text-slate-300">
                          {Math.round(veh.ultimaLocalizacao.velocidade || 0)} km/h
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic pt-1">
                      Nenhuma coordenada GPS recebida ainda. O entregador transmite quando inicia a rota.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Viagens realizadas: {veh.historicoViagensCount}</span>
                  <span className="capitalize font-semibold text-slate-300">
                    Status: {veh.statusOperacional.replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: NOVO VEÍCULO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-violet-500/40 rounded-3xl p-6 shadow-2xl text-slate-100 my-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Cadastrar Veículo na Frota</h3>
                <p className="text-xs text-slate-400">Cadastre somente os veículos realmente utilizados</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Placa do Veículo *</label>
                  <input
                    type="text"
                    required
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                    placeholder="BRA2E19"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Identificação / Nome *</label>
                  <input
                    type="text"
                    required
                    value={formData.identificacao}
                    onChange={(e) => setFormData({ ...formData, identificacao: e.target.value })}
                    placeholder="Ex: Fiorino Express 01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria *</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="moto">Moto / Ciclomotor</option>
                    <option value="fiorino">Fiorino / Utilitário Pequeno</option>
                    <option value="van">Van / Furgão Médio</option>
                    <option value="caminhao_leve">Caminhão 3/4 Leve</option>
                    <option value="caminhao_pesado">Caminhão Toco / Truck</option>
                    <option value="utilitario">Carro de Passeio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Propriedade</label>
                  <select
                    value={formData.tipoPropriedade}
                    onChange={(e) => setFormData({ ...formData, tipoPropriedade: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="proprio">Próprio da Empresa</option>
                    <option value="terceirizado">Terceirizado</option>
                    <option value="agregado">Motorista Agregado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Capacidade de Carga (kg) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.capacidadeKg}
                    onChange={(e) => setFormData({ ...formData, capacidadeKg: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Capacidade em Volumes *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.capacidadeVolumes}
                    onChange={(e) => setFormData({ ...formData, capacidadeVolumes: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vincular Motorista Habitual (Opcional)
                </label>
                <select
                  value={formData.motoristaVinculadoId}
                  onChange={(e) => setFormData({ ...formData, motoristaVinculadoId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="">Nenhum motorista fixo vinculado</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Salvar Veículo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
