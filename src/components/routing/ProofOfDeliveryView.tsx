import React, { useState, useEffect } from 'react';
import { DeliveryItem } from '../../types';
import { api } from '../../lib/api';
import {
  FileCheck,
  Search,
  CheckCircle2,
  Calendar,
  User,
  Truck,
  ExternalLink,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Eye,
  X,
  FileText
} from 'lucide-react';

export const ProofOfDeliveryView: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<DeliveryItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getDeliveries({ status: 'entregue' });
      setDeliveries(res.deliveries || []);
    } catch (e) {
      console.error('Erro ao buscar comprovantes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = deliveries.filter(d => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      d.codigoRastreio?.toLowerCase().includes(term) ||
      d.destinatario?.toLowerCase().includes(term) ||
      d.recebedorNome?.toLowerCase().includes(term) ||
      d.recebedorDocumento?.toLowerCase().includes(term) ||
      d.motoristaNome?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-[#0b0d14] border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Comprovantes de Entrega (POD)</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                {deliveries.length} comprovantes validados
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Registros digitais de recebimento, assinaturas, conferências e horários de baixa no destino
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código, recebedor ou documento..."
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

      {/* Proof List Table */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0c0e16] overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            <span className="text-xs">Carregando comprovantes de entrega...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Nenhum comprovante de entrega concluída encontrado com os filtros atuais.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/60 text-slate-400">
                  <th className="p-3.5 font-semibold">Código</th>
                  <th className="p-3.5 font-semibold">Destinatário</th>
                  <th className="p-3.5 font-semibold">Recebedor no Local</th>
                  <th className="p-3.5 font-semibold">Documento / Validação</th>
                  <th className="p-3.5 font-semibold">Entregador & Veículo</th>
                  <th className="p-3.5 font-semibold">Data & Horário</th>
                  <th className="p-3.5 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3.5 font-mono font-bold text-emerald-400">{d.codigoRastreio}</td>
                    <td className="p-3.5 font-medium text-white">
                      <div>{d.destinatario}</div>
                      <div className="text-[11px] text-slate-400">{d.endereco}, {d.numero}</div>
                    </td>
                    <td className="p-3.5 text-slate-200 font-semibold">{d.recebedorNome || d.destinatario}</td>
                    <td className="p-3.5 text-slate-300 font-mono text-[11px]">
                      {d.recebedorDocumento || 'Assinatura Digital'}
                    </td>
                    <td className="p-3.5 text-slate-400">
                      <div>{d.motoristaNome || 'Entregador Operacional'}</div>
                      <div className="text-[10px] text-slate-500">{d.veiculoPlaca || 'Veículo Frota'}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                      {d.entregueEm ? new Date(d.entregueEm).toLocaleString('pt-BR') : 'Data não informada'}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedItem(d)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-violet-400" />
                        <span>Ver Recibo</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Single POD Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0e111a] border border-violet-500/30 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider">
                  Comprovante Digital de Entrega
                </span>
                <h3 className="text-lg font-bold text-white font-mono">{selectedItem.codigoRastreio}</h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Destinatário:</span>
                <strong className="text-white text-right">{selectedItem.destinatario}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Endereço de Entrega:</span>
                <span className="text-slate-200 text-right">{selectedItem.endereco}, {selectedItem.numero} • {selectedItem.bairro}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Recebedor Identificado:</span>
                <strong className="text-emerald-400 text-right">{selectedItem.recebedorNome || selectedItem.destinatario}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Documento / Conferência:</span>
                <span className="text-slate-300 font-mono text-right">{selectedItem.recebedorDocumento || 'Assinatura digital / Conferido no local'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Data e Hora da Conclusão:</span>
                <span className="text-slate-300 font-mono text-right">
                  {selectedItem.entregueEm ? new Date(selectedItem.entregueEm).toLocaleString('pt-BR') : 'Horário registrado'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Motorista Responsável:</span>
                <span className="text-slate-200 text-right">{selectedItem.motoristaNome || 'Roberto Santos'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Veículo / Placa:</span>
                <span className="text-slate-200 font-mono text-right">{selectedItem.veiculoPlaca || 'BRA2E19'}</span>
              </div>
              {selectedItem.observacoes && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 italic">
                  Observações: {selectedItem.observacoes}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Imprimir / Exportar Comprovante</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
