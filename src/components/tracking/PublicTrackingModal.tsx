import React, { useState } from 'react';
import { api } from '../../lib/api';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  MapPin,
  Calendar,
  ShieldCheck,
  RefreshCw,
  QrCode
} from 'lucide-react';

interface PublicTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const PublicTrackingModal: React.FC<PublicTrackingModalProps> = ({
  isOpen,
  onClose,
  initialCode = ''
}) => {
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.getPublicTracking(code.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Código não localizado ou inválido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#121024] border border-[#2D2644] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
        {/* Glow Header */}
        <div className="bg-gradient-to-r from-[#8B5CF6]/20 via-[#D946EF]/10 to-[#8B5CF6]/20 p-6 border-b border-[#2D2644] relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-[#AAA6B5] hover:text-white hover:bg-[#1C1829] transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C4B5FD]">
              MoviLog Rastreamento Oficial Seguro
            </span>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-[#8B5CF6]" />
            <span>Rastrear Entrega ou Encomenda</span>
          </h3>
          <p className="text-xs text-[#AAA6B5] mt-1">
            Acompanhe o deslocamento em tempo real com proteção integral à privacidade e LGPD.
          </p>

          {/* Search Form */}
          <form onSubmit={handleTrack} className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#716A85]" />
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Digite o código (ex: DLV-2026-..., ENC-..., EXP-...)"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0D0B18] border border-[#2D2644] rounded-xl text-xs text-white placeholder-[#716A85] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#8B5CF6]/30 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Consultar</span>
            </button>
          </form>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="p-4 bg-[#1C1829] border border-[#2D2644] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-[#C4B5FD] bg-[#8B5CF6]/20 px-2 py-0.5 rounded border border-[#8B5CF6]/30">
                      {result.codigoRastreio}
                    </span>
                    <span className="text-xs text-[#AAA6B5]">• {result.transportadora}</span>
                  </div>
                  <span className="font-black text-white text-base block mt-1.5 capitalize">
                    Destinatário: {result.destinatarioResumido}
                  </span>
                  <span className="text-xs text-[#AAA6B5] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>{result.cidadeEstado}</span>
                  </span>
                </div>

                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                    result.status === 'entregue' || result.status === 'retirado'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : result.status === 'em_rota'
                      ? 'bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/40'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{result.status.replace('_', ' ')}</span>
                  </span>
                  {result.prazoPrevisto && (
                    <span className="text-[10px] text-[#AAA6B5] block mt-1">
                      Previsão: {new Date(result.prazoPrevisto).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Timeline */}
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                  Etapas de Rastreamento
                </h4>
                <div className="relative pl-6 border-l-2 border-[#2D2644] space-y-6">
                  {result.etapas?.map((etapa: any, idx: number) => (
                    <div key={idx} className="relative">
                      {/* Step Dot */}
                      <span className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 ${
                        etapa.concluido
                          ? 'bg-emerald-500 border-slate-900 shadow-md shadow-emerald-500/40'
                          : 'bg-[#1C1829] border-[#2D2644]'
                      }`} />
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${etapa.concluido ? 'text-white' : 'text-[#716A85]'}`}>
                          {etapa.label}
                        </span>
                        {etapa.dataHora && (
                          <span className="text-[10px] font-mono text-[#AAA6B5]">
                            {new Date(etapa.dataHora).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Banner */}
              <div className="p-3 bg-[#0D0B18] border border-[#2D2644] rounded-xl flex items-center gap-2.5 text-[11px] text-[#AAA6B5]">
                <ShieldCheck className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                <span>
                  Consulta protegida por token criptográfico. Nenhum dado pessoal sensível (CPF, telefone completo ou documento) é exposto publicamente.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
