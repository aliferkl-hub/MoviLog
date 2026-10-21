import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CondoVisitor, CondoUnit } from '../../types';
import { api } from '../../lib/api';
import {
  UserPlus,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  LogOut,
  ShieldAlert,
  X,
  Users,
  Briefcase
} from 'lucide-react';

export const VisitorsView: React.FC = () => {
  const { company, isMaster } = useAuth();
  const [visitors, setVisitors] = useState<CondoVisitor[]>([]);
  const [units, setUnits] = useState<CondoUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    documento: '',
    tipo: 'visitante' as 'visitante' | 'prestador_servico' | 'entregador' | 'corretor',
    empresa: '',
    unidadeDestino: '',
    moradorAutorizador: '',
    observacoes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [visRes, unitRes] = await Promise.all([
        api.getCondoVisitors(isMaster ? undefined : company?.id),
        api.getCondoUnits(isMaster ? undefined : company?.id)
      ]);
      setVisitors(visRes.visitors);
      setUnits(unitRes.units);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company?.id]);

  const handleUnitSelect = (unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    if (unit) {
      setFormData({
        ...formData,
        unidadeDestino: `${unit.bloco} - ${unit.numeroUnidade}`,
        moradorAutorizador: unit.responsavelPrincipal
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.checkInVisitor(formData);
      setShowModal(false);
      setFormData({
        nomeCompleto: '',
        documento: '',
        tipo: 'visitante',
        empresa: '',
        unidadeDestino: '',
        moradorAutorizador: '',
        observacoes: ''
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar entrada');
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await api.checkOutVisitor(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar saída');
    }
  };

  const activeVisitors = visitors.filter(v => v.status === 'no_local');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <span>Controle de Acesso e Visitantes na Portaria</span>
          </h2>
          <p className="text-xs text-slate-400">
            Registro de entrada e saída em tempo real, autorização do morador e controle de prestadores
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Entrada na Portaria</span>
        </button>
      </div>

      {/* KPI banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Pessoas No Local Agora</div>
            <div className="text-xl font-black text-amber-400">{activeVisitors.length}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Acessos Finalizados Hoje</div>
            <div className="text-xl font-black text-emerald-400">
              {visitors.filter(v => v.status === 'finalizado').length}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Prestadores de Serviço</div>
            <div className="text-xl font-black text-indigo-400">
              {visitors.filter(v => v.tipo === 'prestador_servico').length}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por visitante, documento, unidade ou empresa..."
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
                <th className="p-3.5">Nome / Documento</th>
                <th className="p-3.5">Tipo / Empresa</th>
                <th className="p-3.5">Destino / Autorizado Por</th>
                <th className="p-3.5">Horário de Entrada</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ação Portaria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {visitors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                    Nenhum visitante registrado no momento.
                  </td>
                </tr>
              ) : (
                visitors
                  .filter(v =>
                    v.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    v.documento.includes(searchTerm) ||
                    v.unidadeDestino.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (v.empresa && v.empresa.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map(v => {
                    const isInside = v.status === 'no_local';

                    return (
                      <tr key={v.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-white">{v.nomeCompleto}</div>
                          <div className="text-[10px] font-mono text-slate-400">Doc: {v.documento || 'Não informado'}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="capitalize font-semibold text-slate-300">
                            {v.tipo.replace('_', ' ')}
                          </span>
                          {v.empresa && <div className="text-[10px] text-slate-500">{v.empresa}</div>}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-indigo-400">{v.unidadeDestino}</div>
                          <div className="text-[11px] text-slate-400">{v.moradorAutorizador}</div>
                        </td>
                        <td className="p-3.5 text-slate-300">
                          <div>{new Date(v.dataHoraEntrada).toLocaleTimeString('pt-BR')}</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(v.dataHoraEntrada).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="p-3.5">
                          {isInside ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                              ● No Local
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400">
                              Saída em {v.dataHoraSaida ? new Date(v.dataHoraSaida).toLocaleTimeString('pt-BR') : ''}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {isInside ? (
                            <button
                              onClick={() => handleCheckOut(v.id)}
                              className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Registrar Saída</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500">Finalizado</span>
                          )}
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
        {visitors.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
            Nenhum visitante registrado no momento.
          </div>
        ) : (
          visitors
            .filter(v =>
              v.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
              v.documento.includes(searchTerm) ||
              v.unidadeDestino.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (v.empresa && v.empresa.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            .map(v => {
              const isInside = v.status === 'no_local';

              return (
                <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div>
                      <span className="font-bold text-white text-sm">{v.nomeCompleto}</span>
                      <div className="text-[10px] text-slate-400 font-mono">Doc: {v.documento || 'Não informado'}</div>
                    </div>
                    {isInside ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ● No Local
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400">
                        Finalizado
                      </span>
                    )}
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="text-slate-300">
                      <span className="text-slate-500">Tipo:</span> <strong className="capitalize text-slate-200">{v.tipo.replace('_', ' ')}</strong> {v.empresa ? `(${v.empresa})` : ''}
                    </div>
                    <div className="text-slate-300">
                      <span className="text-slate-500">Destino:</span> <span className="font-bold text-indigo-400">{v.unidadeDestino}</span> • Autorizado por: {v.moradorAutorizador}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Entrada: {new Date(v.dataHoraEntrada).toLocaleString('pt-BR')}
                    </div>
                    {v.dataHoraSaida && (
                      <div className="text-[10px] text-slate-500">
                        Saída: {new Date(v.dataHoraSaida).toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>

                  {isInside && (
                    <div className="border-t border-slate-800/80 pt-2 flex justify-end">
                      <button
                        onClick={() => handleCheckOut(v.id)}
                        className="px-3 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Registrar Saída</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>

      {/* CheckIn Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 my-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Registrar Entrada de Visitante ou Prestador</h3>
            <p className="text-xs text-slate-400 mb-4">
              Identificação na portaria, vinculação à unidade de destino e conferência com o morador.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome Completo do Visitante *</label>
                <input
                  type="text"
                  required
                  value={formData.nomeCompleto}
                  onChange={e => setFormData({ ...formData, nomeCompleto: e.target.value })}
                  placeholder="Nome do visitante / prestador"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Documento (RG ou CPF)</label>
                  <input
                    type="text"
                    value={formData.documento}
                    onChange={e => setFormData({ ...formData, documento: e.target.value })}
                    placeholder="00.000.000-0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Acesso</label>
                  <select
                    value={formData.tipo}
                    onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="visitante">Visitante / Convidado</option>
                    <option value="prestador_servico">Prestador de Serviço / Manutenção</option>
                    <option value="entregador">Entregador Externo</option>
                    <option value="corretor">Corretor / Vistoriador</option>
                  </select>
                </div>
              </div>

              {formData.tipo === 'prestador_servico' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Empresa Prestadora de Serviço</label>
                  <input
                    type="text"
                    value={formData.empresa}
                    onChange={e => setFormData({ ...formData, empresa: e.target.value })}
                    placeholder="Ex: Net Claro Fibra / Enel"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              )}

              {units.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Selecionar Unidade de Destino
                  </label>
                  <select
                    onChange={e => handleUnitSelect(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Selecione a unidade autorizadora --</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.bloco} - {u.numeroUnidade} ({u.responsavelPrincipal})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unidade de Destino *</label>
                  <input
                    type="text"
                    required
                    value={formData.unidadeDestino}
                    onChange={e => setFormData({ ...formData, unidadeDestino: e.target.value })}
                    placeholder="Ex: Torre A - Apto 302"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Morador que Autorizou</label>
                  <input
                    type="text"
                    value={formData.moradorAutorizador}
                    onChange={e => setFormData({ ...formData, moradorAutorizador: e.target.value })}
                    placeholder="Nome do morador"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Observações da Portaria</label>
                <input
                  type="text"
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Ex: Portando caixa de ferramentas"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
                >
                  Registrar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
