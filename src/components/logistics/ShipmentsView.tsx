import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShipmentOrder } from '../../types';
import { api } from '../../lib/api';
import {
  Send,
  Truck,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  X,
  FileCheck,
  AlertTriangle,
  QrCode,
  MapPin,
  Calendar,
  PackageCheck
} from 'lucide-react';

export const ShipmentsView: React.FC = () => {
  const { company, isMaster } = useAuth();
  const [shipments, setShipments] = useState<ShipmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    destinatario: '',
    enderecoEntrega: '',
    cidade: 'São Paulo / SP',
    transportadora: '',
    entregadorNome: '',
    placaVeiculo: '',
    volumes: 1,
    pesoKg: 0
  });

  const loadShipments = async () => {
    setLoading(true);
    try {
      const res = await api.getShipments(isMaster ? undefined : company?.id);
      setShipments(res.shipments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, [company?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createShipment(formData);
      setShowModal(false);
      setFormData({
        destinatario: '',
        enderecoEntrega: '',
        cidade: 'São Paulo / SP',
        transportadora: '',
        entregadorNome: '',
        placaVeiculo: '',
        volumes: 1,
        pesoKg: 0
      });
      await loadShipments();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar expedição');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.updateShipmentStatus(id, { status: newStatus });
      await loadShipments();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status');
    }
  };

  // Real KPIs computed from stored records
  const totalShipments = shipments.length;
  const inPreparation = shipments.filter(s => s.status === 'separacao' || s.status === 'conferido').length;
  const inTransit = shipments.filter(s => s.status === 'despachado').length;
  const delivered = shipments.filter(s => s.status === 'entregue').length;

  const filtered = shipments.filter(s =>
    s.numeroExpedicao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.destinatario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.codigoRastreio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.transportadora.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.placaVeiculo && s.placaVeiculo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-400" />
            <span>Expedição e Despacho de Cargas</span>
          </h2>
          <p className="text-xs text-slate-400">
            Conferência de separação, etiquetagem, despacho e rastreamento de entregas
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Ordem de Expedição</span>
        </button>
      </div>

      {/* Real KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Ordens</span>
            <Send className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{totalShipments}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Expedições registradas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Em Separação</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">{inPreparation}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Aguardando despacho</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Em Trânsito</span>
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400 mt-1">{inTransit}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Despachadas com motorista</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Entregues</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{delivered}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Concluídas com sucesso</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por destinatário, ordem, rastreio ou transportadora..."
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
                <th className="p-3.5">Nº Expedição / Rastreio</th>
                <th className="p-3.5">Destinatário & Cidade</th>
                <th className="p-3.5">Transportadora / Veículo</th>
                <th className="p-3.5">Volumes & Peso</th>
                <th className="p-3.5">Status do Despacho</th>
                <th className="p-3.5 text-right">Avançar Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                    Nenhuma expedição criada ainda. Clique em "Nova Ordem de Expedição" para iniciar.
                  </td>
                </tr>
              ) : (
                filtered.map(s => {
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{s.numeroExpedicao}</div>
                        <div className="text-[10px] font-mono text-indigo-400 mt-0.5">{s.codigoRastreio}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">{s.destinatario}</div>
                        <div className="text-[11px] text-slate-400">{s.cidade}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-200">{s.transportadora}</div>
                        {s.placaVeiculo && (
                          <div className="text-[10px] text-slate-400">
                            Placa: <span className="font-mono text-white">{s.placaVeiculo}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{s.volumes} vol.</div>
                        <div className="text-[11px] text-slate-400">{s.pesoKg} kg</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            s.status === 'entregue'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : s.status === 'despachado'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : s.status === 'conferido'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {s.status}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {new Date(s.dataCriacao).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {s.status === 'separacao' && (
                            <button
                              onClick={() => handleUpdateStatus(s.id, 'conferido')}
                              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition"
                            >
                              Conferir
                            </button>
                          )}
                          {s.status === 'conferido' && (
                            <button
                              onClick={() => handleUpdateStatus(s.id, 'despachado')}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                            >
                              Despachar Carga
                            </button>
                          )}
                          {s.status === 'despachado' && (
                            <button
                              onClick={() => handleUpdateStatus(s.id, 'entregue')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                            >
                              Confirmar Entrega
                            </button>
                          )}
                          {s.status === 'entregue' && (
                            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="block md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
            Nenhuma expedição criada ainda.
          </div>
        ) : (
          filtered.map(s => {
            return (
              <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div>
                    <span className="font-extrabold text-white text-sm">{s.numeroExpedicao}</span>
                    <div className="text-[10px] font-mono text-indigo-400">{s.codigoRastreio}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      s.status === 'entregue'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : s.status === 'despachado'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : s.status === 'conferido'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div className="text-slate-200">
                    <span className="text-slate-400">Destinatário:</span> <strong className="text-white">{s.destinatario}</strong>
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-400">Cidade:</span> {s.cidade}
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-400">Transportadora:</span> {s.transportadora} {s.placaVeiculo ? `(${s.placaVeiculo})` : ''}
                  </div>
                  <div className="text-slate-400">
                    <span className="text-slate-500">Carga:</span> {s.volumes} volumes • {s.pesoKg} kg
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    {new Date(s.dataCriacao).toLocaleDateString('pt-BR')}
                  </span>

                  <div>
                    {s.status === 'separacao' && (
                      <button
                        onClick={() => handleUpdateStatus(s.id, 'conferido')}
                        className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold"
                      >
                        Conferir
                      </button>
                    )}
                    {s.status === 'conferido' && (
                      <button
                        onClick={() => handleUpdateStatus(s.id, 'despachado')}
                        className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                      >
                        Despachar
                      </button>
                    )}
                    {s.status === 'despachado' && (
                      <button
                        onClick={() => handleUpdateStatus(s.id, 'entregue')}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                      >
                        Entregar
                      </button>
                    )}
                    {s.status === 'entregue' && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Entregue
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Shipment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 my-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Criar Ordem de Expedição</h3>
            <p className="text-xs text-slate-400 mb-4">
              Informe o destinatário, transportadora e volumes a serem despachados.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Destinatário / Cliente *</label>
                <input
                  type="text"
                  required
                  value={formData.destinatario}
                  onChange={e => setFormData({ ...formData, destinatario: e.target.value })}
                  placeholder="Nome do cliente ou empresa destinatária"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Endereço de Entrega</label>
                  <input
                    type="text"
                    value={formData.enderecoEntrega}
                    onChange={e => setFormData({ ...formData, enderecoEntrega: e.target.value })}
                    placeholder="Rua, número, complemento"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cidade / UF</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={e => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="São Paulo / SP"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Transportadora</label>
                  <input
                    type="text"
                    value={formData.transportadora}
                    onChange={e => setFormData({ ...formData, transportadora: e.target.value })}
                    placeholder="Frota Própria"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Entregador / Motorista</label>
                  <input
                    type="text"
                    value={formData.entregadorNome}
                    onChange={e => setFormData({ ...formData, entregadorNome: e.target.value })}
                    placeholder="Nome motorista"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Placa do Veículo</label>
                  <input
                    type="text"
                    value={formData.placaVeiculo}
                    onChange={e => setFormData({ ...formData, placaVeiculo: e.target.value })}
                    placeholder="ABC-1234"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Volumes *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.volumes}
                    onChange={e => setFormData({ ...formData, volumes: Number(e.target.value) })}
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

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-600/25"
                >
                  Criar Ordem de Despacho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
