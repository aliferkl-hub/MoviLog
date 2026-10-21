import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogisticsReceipt } from '../../types';
import { api } from '../../lib/api';
import {
  PackagePlus,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Search,
  Filter,
  Plus,
  X,
  FileText,
  Clock,
  Truck
} from 'lucide-react';

export const ReceiptsView: React.FC = () => {
  const { user, company, isMaster } = useAuth();
  const [receipts, setReceipts] = useState<LogisticsReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<LogisticsReceipt | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    fornecedor: '',
    remetente: '',
    transportadora: '',
    destinatarioSetor: 'Almoxarifado Geral',
    numeroNota: '',
    quantidadeVolumes: 1,
    pesoKg: 0,
    descricao: '',
    lote: '',
    avariasRegistradas: false,
    detalhesAvarias: ''
  });

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const res = await api.getReceipts(isMaster ? undefined : company?.id);
      setReceipts(res.receipts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, [company?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createReceipt(formData);
      setShowNewModal(false);
      setFormData({
        fornecedor: '',
        remetente: '',
        transportadora: '',
        destinatarioSetor: 'Almoxarifado Geral',
        numeroNota: '',
        quantidadeVolumes: 1,
        pesoKg: 0,
        descricao: '',
        lote: '',
        avariasRegistradas: false,
        detalhesAvarias: ''
      });
      await loadReceipts();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar recebimento');
    }
  };

  const handleOpenPrint = async (receipt: LogisticsReceipt) => {
    setSelectedReceiptForPrint(receipt);
    try {
      const res = await api.getQRCode(`RECEIPT:${receipt.numeroRecebimento}|QR:${receipt.codigoRastreioQR}`);
      setQrDataUrl(res.dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            <span>Recebimento e Conferência de Mercadorias</span>
          </h2>
          <p className="text-xs text-slate-400">
            Registro de entrada de volumes, fornecedores, etiquetas QR Code e controle de avarias
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Recebimento de Carga</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por número, fornecedor, nota ou transportadora..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Nº Recebimento / QR</th>
                <th className="p-3.5">Fornecedor / Remetente</th>
                <th className="p-3.5">Transportadora / NF</th>
                <th className="p-3.5">Volumes & Peso</th>
                <th className="p-3.5">Destino / Conferente</th>
                <th className="p-3.5">Status / Avarias</th>
                <th className="p-3.5 text-right">Etiqueta QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    Nenhum recebimento registrado ainda. Clique em "Novo Recebimento de Carga" para começar.
                  </td>
                </tr>
              ) : (
                receipts
                  .filter(r =>
                    r.numeroRecebimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.transportadora.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (r.numeroNota && r.numeroNota.includes(searchTerm))
                  )
                  .map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{r.numeroRecebimento}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">{r.codigoRastreioQR}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">{r.fornecedor}</div>
                        <div className="text-[11px] text-slate-400">{r.descricao}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-300">{r.transportadora}</div>
                        <div className="text-[11px] text-slate-500">NF: {r.numeroNota || 'S/N'}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{r.quantidadeVolumes} vol.</div>
                        <div className="text-[11px] text-slate-400">{r.pesoKg} kg</div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-200">{r.destinatarioSetor}</div>
                        <div className="text-[11px] text-slate-500">{r.conferenteNome}</div>
                      </td>
                      <td className="p-3.5">
                        {r.avariasRegistradas ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Com Avarias / Divergência</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Conferido 100%</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 mt-1">
                          {new Date(r.dataHora).toLocaleString('pt-BR')}
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenPrint(r)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Ver Etiqueta</span>
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="block md:hidden space-y-3">
        {receipts.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
            Nenhum recebimento registrado ainda.
          </div>
        ) : (
          receipts
            .filter(r =>
              r.numeroRecebimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
              r.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
              r.transportadora.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (r.numeroNota && r.numeroNota.includes(searchTerm))
            )
            .map(r => (
              <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div>
                    <span className="font-bold text-white text-sm">{r.numeroRecebimento}</span>
                    <div className="text-[10px] font-mono text-indigo-400">{r.codigoRastreioQR}</div>
                  </div>
                  {r.avariasRegistradas ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Avaria
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      100% Conferido
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-1">
                  <div className="text-slate-200">
                    <span className="text-slate-400">Fornecedor:</span> <strong className="text-white">{r.fornecedor}</strong>
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-400">Carga:</span> {r.quantidadeVolumes} vol. • {r.pesoKg} kg (NF: {r.numeroNota || 'S/N'})
                  </div>
                  <div className="text-slate-400">
                    <span className="text-slate-500">Transportadora:</span> {r.transportadora}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Destino: {r.destinatarioSetor} • Conferente: {r.conferenteNome}
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    {new Date(r.dataHora).toLocaleDateString('pt-BR')}
                  </span>
                  <button
                    onClick={() => handleOpenPrint(r)}
                    className="px-2.5 py-1 bg-slate-800 text-indigo-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Etiqueta</span>
                  </button>
                </div>
              </div>
            ))
        )}
      </div>

      {/* New Receipt Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 my-8">
            <button
              onClick={() => setShowNewModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Registrar Entrada de Mercadorias</h3>
            <p className="text-xs text-slate-400 mb-4">
              Preencha os dados do volume recebido. Uma etiqueta com código de barras e QR Code será gerada.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Fornecedor / Remetente *</label>
                  <input
                    type="text"
                    required
                    value={formData.fornecedor}
                    onChange={e => setFormData({ ...formData, fornecedor: e.target.value })}
                    placeholder="Ex: Fornecedor ABC Ltda"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Transportadora Responsável</label>
                  <input
                    type="text"
                    value={formData.transportadora}
                    onChange={e => setFormData({ ...formData, transportadora: e.target.value })}
                    placeholder="Ex: Braspress / Rodonaves"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nº Nota Fiscal / Doc</label>
                  <input
                    type="text"
                    value={formData.numeroNota}
                    onChange={e => setFormData({ ...formData, numeroNota: e.target.value })}
                    placeholder="Ex: 001.482.903"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quantidade de Volumes *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantidadeVolumes}
                    onChange={e => setFormData({ ...formData, quantidadeVolumes: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Peso Total (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.pesoKg}
                    onChange={e => setFormData({ ...formData, pesoKg: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Destinatário / Setor Interno</label>
                  <input
                    type="text"
                    value={formData.destinatarioSetor}
                    onChange={e => setFormData({ ...formData, destinatarioSetor: e.target.value })}
                    placeholder="Ex: Almoxarifado / Galpão B"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Lote / Identificador</label>
                  <input
                    type="text"
                    value={formData.lote}
                    onChange={e => setFormData({ ...formData, lote: e.target.value })}
                    placeholder="Ex: LOT-2026-X1"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Descrição dos Volumes</label>
                <textarea
                  rows={2}
                  value={formData.descricao}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: 5 caixas contendo componentes eletrônicos e cabos de alimentação"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.avariasRegistradas}
                    onChange={e => setFormData({ ...formData, avariasRegistradas: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-500 focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-rose-300">
                    Apresenta Avarias, Danos na Embalagem ou Divergência de Volumes
                  </span>
                </label>

                {formData.avariasRegistradas && (
                  <div className="mt-2.5">
                    <textarea
                      rows={2}
                      value={formData.detalhesAvarias}
                      onChange={e => setFormData({ ...formData, detalhesAvarias: e.target.value })}
                      placeholder="Descreva detalhadamente a avaria (ex: caixa amassada, lacre violado, volume faltante)..."
                      className="w-full bg-slate-900 border border-rose-500/40 rounded-lg p-2 text-xs text-rose-200"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-600/25"
                >
                  Confirmar e Gerar Etiqueta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable QR Code Label Modal */}
      {selectedReceiptForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white text-slate-900 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setSelectedReceiptForPrint(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1 rounded-lg transition print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Print Area */}
            <div className="border-2 border-dashed border-slate-400 rounded-xl p-4 bg-slate-50">
              <div className="flex items-center justify-between border-b pb-2 mb-3">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    LogiPredial • Expedição
                  </h4>
                  <p className="text-[10px] text-slate-500">Etiqueta de Controle e Rastreamento</p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-200 px-2 py-0.5 rounded">
                  {selectedReceiptForPrint.numeroRecebimento}
                </span>
              </div>

              <div className="flex items-center gap-4 my-3">
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="QR Code" className="w-28 h-28 border rounded-lg bg-white p-1" />
                )}
                <div className="text-[11px] space-y-1">
                  <div>
                    <span className="font-bold text-slate-700">Fornecedor:</span> {selectedReceiptForPrint.fornecedor}
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Volumes:</span> {selectedReceiptForPrint.quantidadeVolumes} vol ({selectedReceiptForPrint.pesoKg} kg)
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Destino:</span> {selectedReceiptForPrint.destinatarioSetor}
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">NF:</span> {selectedReceiptForPrint.numeroNota || 'S/N'}
                  </div>
                  <div className="font-mono text-[9px] text-slate-500 pt-1">
                    CÓDIGO: {selectedReceiptForPrint.codigoRastreioQR}
                  </div>
                </div>
              </div>

              <div className="border-t pt-2 text-[9px] text-slate-500 flex justify-between">
                <span>Recebido por: {selectedReceiptForPrint.conferenteNome}</span>
                <span>{new Date(selectedReceiptForPrint.dataHora).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 print:hidden">
              <button
                onClick={() => setSelectedReceiptForPrint(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Etiqueta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
