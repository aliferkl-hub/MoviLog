import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DeliveryRoute, RouteStop, Vehicle } from '../../types';
import { api } from '../../lib/api';
import {
  Navigation,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  Play,
  Clock,
  Compass,
  FileText,
  User,
  ShieldCheck,
  RefreshCw,
  Loader2,
  ExternalLink,
  Check,
  X
} from 'lucide-react';

export const DriverPanelView: React.FC = () => {
  const { user } = useAuth();
  const [activeRoute, setActiveRoute] = useState<DeliveryRoute | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  // GPS Sharing State
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number; speed?: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Stop Action Modal State
  const [selectedStopIdx, setSelectedStopIdx] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'entregue' | 'tentativa_falha' | null>(null);
  const [recebedorNome, setRecebedorNome] = useState('');
  const [recebedorDocumento, setRecebedorDocumento] = useState('');
  const [motivoFalha, setMotivoFalha] = useState('Destinatário ausente no local');
  const [observacao, setObservacao] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadDriverRoute = async () => {
    setLoading(true);
    try {
      const res = await api.getDriverActiveRoute();
      setActiveRoute(res.activeRoute);
      if (res.vehicle) setVehicle(res.vehicle);
    } catch (err: any) {
      console.error('Erro ao buscar rota do motorista:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverRoute();
    const interval = setInterval(() => {
      api.getDriverActiveRoute().then(res => {
        if (res.activeRoute) setActiveRoute(res.activeRoute);
      }).catch(() => {});
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // GPS Toggle Handler
  const toggleGps = () => {
    if (gpsActive) {
      // Turn OFF
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setGpsActive(false);
      setGpsError(null);
    } else {
      // Turn ON
      if (!navigator.geolocation) {
        setGpsError('Geolocalização não suportada neste navegador.');
        return;
      }

      setGpsError(null);
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          setGpsActive(true);
          const { latitude, longitude, speed, accuracy } = position.coords;
          setLastCoords({
            lat: latitude,
            lng: longitude,
            speed: speed ? Math.round(speed * 3.6) : 0 // m/s to km/h
          });

          // Send real GPS to vehicle if assigned
          if (vehicle?.id) {
            try {
              await api.sendVehicleLocation(vehicle.id, {
                lat: latitude,
                lng: longitude,
                velocidade: speed ? speed * 3.6 : 0,
                precisao: accuracy,
                timestampDispositivo: new Date(position.timestamp).toISOString()
              });
            } catch (e) {
              // ignore transient errors
            }
          }
        },
        (err) => {
          setGpsError(`Permissão de localização negada ou indisponível: ${err.message}`);
          setGpsActive(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000
        }
      );
      watchIdRef.current = id;
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Start Route Action
  const handleStartRoute = async () => {
    if (!activeRoute) return;
    try {
      await api.startRoute(activeRoute.id);
      await loadDriverRoute();
      if (!gpsActive) toggleGps(); // Auto-prompt GPS on start
    } catch (err: any) {
      alert(err.message || 'Erro ao iniciar rota.');
    }
  };

  // Mark arrived
  const handleMarkArrived = async (stopIdx: number) => {
    if (!activeRoute) return;
    try {
      await api.updateStopStatus(activeRoute.id, stopIdx, { status: 'chegou' });
      await loadDriverRoute();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar chegada.');
    }
  };

  // Submit delivery outcome
  const handleSubmitOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoute || selectedStopIdx === null || !actionType) return;

    setActionLoading(true);
    try {
      await api.updateStopStatus(activeRoute.id, selectedStopIdx, {
        status: actionType,
        recebedorNome,
        recebedorDocumento,
        motivoFalha,
        observacao
      });

      setSelectedStopIdx(null);
      setActionType(null);
      setRecebedorNome('');
      setRecebedorDocumento('');
      setObservacao('');
      await loadDriverRoute();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar status da entrega.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Navigation App (Google Maps / Waze)
  const openNavigation = (stop: RouteStop) => {
    const dest = stop.lat && stop.lng
      ? `${stop.lat},${stop.lng}`
      : encodeURIComponent(`${stop.enderecoCompleto}, ${stop.cidade}`);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <span className="text-xs">Carregando painel do motorista...</span>
      </div>
    );
  }

  if (!activeRoute) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
          <Navigation className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">Nenhuma Rota Ativa Atribuída</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Você não possui rotas publicadas para o seu usuário ({user?.name}) no momento. Quando o roteirista publicar uma nova viagem, ela aparecerá aqui automaticamente.
        </p>
        <button
          onClick={loadDriverRoute}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Verificar Novamente</span>
        </button>
      </div>
    );
  }

  const completedStops = activeRoute.paradas.filter(s => s.status === 'entregue' || s.status === 'tentativa_falha').length;
  const progressPercent = Math.round((completedStops / activeRoute.totalParadas) * 100);

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-12">
      {/* Route Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-extrabold text-sky-400">{activeRoute.codigoRota}</span>
              <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-800 rounded-full">
                v{activeRoute.versao}
              </span>
            </div>
            <h2 className="text-lg font-black text-white mt-1">{activeRoute.titulo}</h2>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Veículo: <strong className="text-slate-200">{activeRoute.veiculoPlaca}</strong></span>
              <span>•</span>
              <span>Roteirista: {activeRoute.roteiristaNome}</span>
            </div>
          </div>

          <button
            onClick={loadDriverRoute}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            title="Atualizar rota"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Progresso da Viagem:</span>
            <span className="font-bold text-sky-400">{completedStops} / {activeRoute.totalParadas} paradas ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Start Route Button if published */}
        {activeRoute.status === 'publicada' && (
          <button
            onClick={handleStartRoute}
            className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Iniciar Deslocamento da Rota</span>
          </button>
        )}
      </div>

      {/* GPS Transmission Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            gpsActive
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <Radio className={`w-5 h-5 ${gpsActive ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              {gpsActive ? 'Transmissão GPS Ativa' : 'Transmissão GPS Desativada'}
            </span>
            <p className="text-[11px] text-slate-400">
              {gpsActive && lastCoords
                ? `${lastCoords.speed || 0} km/h • ${lastCoords.lat.toFixed(4)}, ${lastCoords.lng.toFixed(4)}`
                : 'Compartilhe sua localização durante o expediente para a central acompanhar'}
            </p>
          </div>
        </div>

        <button
          onClick={toggleGps}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
            gpsActive
              ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
          }`}
        >
          {gpsActive ? 'Desligar GPS' : 'Ativar GPS'}
        </button>
      </div>

      {gpsError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
          {gpsError}
        </div>
      )}

      {/* Paradas List (Ordered) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Paradas em Sequência ({activeRoute.paradas.length})
        </h3>

        {activeRoute.paradas.map((stop, idx) => {
          const isDone = stop.status === 'entregue';
          const isFailed = stop.status === 'tentativa_falha';
          const isArrived = stop.status === 'chegou';
          const isPending = stop.status === 'aguardando';

          return (
            <div
              key={stop.deliveryId}
              className={`rounded-3xl border p-4 transition space-y-3 ${
                isDone
                  ? 'bg-slate-950/40 border-slate-800/80 opacity-70'
                  : isFailed
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : isArrived
                  ? 'bg-indigo-950/30 border-indigo-500 shadow-lg shadow-indigo-600/10'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                    isDone
                      ? 'bg-emerald-500 text-slate-950'
                      : isFailed
                      ? 'bg-rose-500 text-white'
                      : isArrived
                      ? 'bg-indigo-500 text-white animate-bounce'
                      : 'bg-sky-600 text-white'
                  }`}>
                    {stop.ordem}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{stop.destinatario}</h4>
                    <span className="font-mono text-[10px] text-slate-400">{stop.codigoRastreio}</span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isFailed
                    ? 'bg-rose-500/20 text-rose-400'
                    : isArrived
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {isDone && 'Entregue'}
                  {isFailed && 'Falha / Não entregue'}
                  {isArrived && 'No local'}
                  {isPending && 'Aguardando'}
                </span>
              </div>

              {/* Address & Instructions */}
              <div className="text-xs text-slate-300 pl-11 space-y-1">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>{stop.enderecoCompleto} - {stop.bairro}, {stop.cidade}</span>
                </div>

                {stop.instrucoes && (
                  <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 mt-1">
                    Nota: {stop.instrucoes}
                  </div>
                )}

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Volumes: <strong className="text-slate-200">{stop.volumes}</strong></span>
                  <span>Peso: <strong className="text-slate-200">{stop.pesoKg} kg</strong></span>
                  {stop.janelaHorario && (
                    <span className="text-indigo-400 font-medium">Horário: {stop.janelaHorario}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons for this stop */}
              {!isDone && (
                <div className="pt-2 pl-11 flex flex-wrap items-center gap-2 border-t border-slate-800/80">
                  {/* Open Map Navigation */}
                  <button
                    onClick={() => openNavigation(stop)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-400 transition flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Navegar (Maps/Waze)</span>
                  </button>

                  {/* Call phone */}
                  {stop.telefone && (
                    <a
                      href={`tel:${stop.telefone}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ligar</span>
                    </a>
                  )}

                  {/* Cheguei */}
                  {isPending && (
                    <button
                      onClick={() => handleMarkArrived(idx)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-bold border border-indigo-500/40 transition"
                    >
                      Cheguei ao Local
                    </button>
                  )}

                  {/* Confirmar Entrega */}
                  <button
                    onClick={() => {
                      setSelectedStopIdx(idx);
                      setActionType('entregue');
                      setRecebedorNome(stop.destinatario);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmar Entrega</span>
                  </button>

                  {/* Tentativa Falha */}
                  <button
                    onClick={() => {
                      setSelectedStopIdx(idx);
                      setActionType('tentativa_falha');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/60 text-rose-400 text-xs font-bold border border-rose-500/30 transition"
                  >
                    Não Entregue
                  </button>
                </div>
              )}

              {/* Already Delivered Information */}
              {isDone && stop.recebedorNome && (
                <div className="pl-11 text-[11px] text-emerald-400 flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Recebido por: {stop.recebedorNome} ({stop.recebedorDocumento})</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: REGISTRAR STATUS DE ENTREGA */}
      {selectedStopIdx !== null && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4">
            <button
              onClick={() => {
                setSelectedStopIdx(null);
                setActionType(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                actionType === 'entregue'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}>
                {actionType === 'entregue' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {actionType === 'entregue' ? 'Comprovar Entrega Concluída' : 'Registrar Insucesso na Entrega'}
                </h3>
                <p className="text-xs text-slate-400">Parada #{selectedStopIdx + 1}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitOutcome} className="space-y-3.5">
              {actionType === 'entregue' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nome de Quem Recebeu *
                    </label>
                    <input
                      type="text"
                      required
                      value={recebedorNome}
                      onChange={(e) => setRecebedorNome(e.target.value)}
                      placeholder="Nome completo do recebedor"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Documento do Recebedor (RG / CPF)
                    </label>
                    <input
                      type="text"
                      value={recebedorDocumento}
                      onChange={(e) => setRecebedorDocumento(e.target.value)}
                      placeholder="Ex: 48.912.443-8"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Motivo da Tentativa sem Sucesso *
                  </label>
                  <select
                    value={motivoFalha}
                    onChange={(e) => setMotivoFalha(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Destinatário ausente no local">Destinatário ausente no local</option>
                    <option value="Endereço não localizado ou número não encontrado">Endereço não localizado / Número não existe</option>
                    <option value="Entrega recusada pelo destinatário">Entrega recusada pelo destinatário</option>
                    <option value="Horário comercial excedido ou local fechado">Local fechado / Fora de horário</option>
                    <option value="Área com restrição de acesso temporário">Área com restrição de acesso</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observações Operacionais</label>
                <textarea
                  rows={2}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Informações adicionais para auditoria da empresa..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStopIdx(null);
                    setActionType(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition flex items-center gap-2 ${
                    actionType === 'entregue' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Salvar Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
