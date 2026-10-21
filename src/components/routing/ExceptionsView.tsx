import React, { useState, useEffect } from 'react';
import { DeliveryItem } from '../../types';
import { api } from '../../lib/api';
import {
  AlertTriangle,
  Search,
  RotateCcw,
  Clock,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Filter,
  Loader2,
  RefreshCw,
  FileText,
  User
} from 'lucide-react';

export const ExceptionsView: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getDeliveries({ status: 'tentativa_falha' });
      setDeliveries(res.deliveries || []);
    } catch (e) {
      console.error('Erro ao buscar ocorrências:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [feedback, setFeedback] = useState<string | null>(null);

  const handleReschedule = async (deliveryId: string) => {
    setActionLoadingId(deliveryId);
    try {
      await api.updateDelivery(deliveryId, {
        status: 'pendente',
        routeId: undefined,
        sequencia: undefined
      });
      setFeedback('Entrega reagendada com sucesso para nova rota!');
      setTimeout(() => setFeedback(null), 4000);
      await loadData();
    } catch (err: any) {
      setFeedback(err.message || 'Erro ao reagendar entrega.');
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = deliveries.filter(d => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      d.codigoRastreio?.toLowerCase().includes(term) ||
      d.destinatario?.toLowerCase().includes(term) ||
      d.motivoFalha?.toLowerCase().includes(term) ||
      d.endereco?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-[#0b0d14] border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Gestão de Ocorrências & Insucessos</span>
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                {deliveries.length} ocorrências pendentes
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Tratamento de insucessos de entrega, ausência de recebedor, divergências e reagendamentos operacionais
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código, destinatário ou motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 w-64"
            />
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-400' : ''}`} />
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-violet-600/20 border border-violet-500/40 rounded-xl text-violet-200 text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Exception Cards / List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
          <span className="text-xs">Carregando ocorrências operacionais...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0c0e16] border border-slate-800 text-slate-400 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Nenhuma Ocorrência Pendente</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Todas as entregas foram concluídas com sucesso ou não há insucessos aguardando tratativa no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="p-5 rounded-2xl bg-[#0c0e16] border border-rose-500/20 hover:border-rose-500/40 transition shadow-lg space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono font-bold text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                    {d.codigoRastreio}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                    {d.tentativas || 1}ª tentativa
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{d.destinatario}</h4>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{d.endereco}, {d.numero} • {d.bairro}</span>
                  </div>
                  {d.telefone && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{d.telefone}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                  <div className="text-rose-400 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Motivo: {d.motivoFalha || 'Destinatário ausente'}</span>
                  </div>
                  {d.observacoes && (
                    <p className="text-[11px] text-slate-400 italic">
                      Obs: "{d.observacoes}"
                    </p>
                  )}
                  <div className="text-[10px] text-slate-500 pt-1">
                    Registrado em: {new Date(d.atualizadoEm).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleReschedule(d.id)}
                  disabled={actionLoadingId === d.id}
                  className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/20"
                >
                  {actionLoadingId === d.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>Reagendar para Nova Rota</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
