import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CondoUnit } from '../../types';
import { api } from '../../lib/api';
import {
  Building,
  Plus,
  Search,
  Users,
  Phone,
  Mail,
  X,
  Edit
} from 'lucide-react';

export const UnitsView: React.FC = () => {
  const { company, isMaster } = useAuth();
  const [units, setUnits] = useState<CondoUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    bloco: 'Torre 1',
    andar: '1º Andar',
    numeroUnidade: '',
    responsavelPrincipal: '',
    email: '',
    telefone: '',
    observacoes: ''
  });

  const loadUnits = async () => {
    setLoading(true);
    try {
      const res = await api.getCondoUnits(isMaster ? undefined : company?.id);
      setUnits(res.units);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, [company?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveCondoUnit(formData);
      setShowModal(false);
      setFormData({
        bloco: 'Torre 1',
        andar: '1º Andar',
        numeroUnidade: '',
        responsavelPrincipal: '',
        email: '',
        telefone: '',
        observacoes: ''
      });
      await loadUnits();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar unidade');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F5F3FA] flex items-center gap-2">
            <Building className="w-5 h-5 text-[#8B5CF6]" />
            <span>Unidades, Blocos e Moradores</span>
          </h2>
          <p className="text-xs text-[#AAA6B5]">
            Cadastro predial de apartamentos, salas comerciais e moradores autorizados
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-[#7C3AED]/20"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Unidade</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por unidade, morador, bloco ou telefone..."
            className="w-full bg-[#25222D] border border-[#393442] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-[#25222D] border border-[#393442] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-[#1D1B24] text-[#AAA6B5] uppercase tracking-wider text-[10px] border-b border-[#393442]">
              <tr>
                <th className="p-3.5">Bloco / Torre</th>
                <th className="p-3.5">Unidade / Apto</th>
                <th className="p-3.5">Morador Responsável</th>
                <th className="p-3.5">Contato / WhatsApp</th>
                <th className="p-3.5">E-mail</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#393442]/60">
              {units.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#AAA6B5] text-xs">
                    Nenhuma unidade predial cadastrada ainda.
                  </td>
                </tr>
              ) : (
                units
                  .filter(u =>
                    u.numeroUnidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.responsavelPrincipal.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.bloco.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.telefone.includes(searchTerm)
                  )
                  .map(unit => (
                    <tr key={unit.id} className="hover:bg-[#1D1B24]/40 transition">
                      <td className="p-3.5 font-semibold text-[#F5F3FA]">{unit.bloco}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-[#C4B5FD] bg-[#8B5CF6]/15 px-2.5 py-1 rounded-lg border border-[#8B5CF6]/30">
                          {unit.numeroUnidade}
                        </span>
                        <div className="text-[10px] text-[#AAA6B5] mt-1">{unit.andar}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{unit.responsavelPrincipal}</div>
                        {unit.observacoes && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{unit.observacoes}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{unit.telefone || 'Não informado'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>{unit.email || '—'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">
                          Ativo
                        </span>
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
        {units.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
            Nenhuma unidade predial cadastrada ainda.
          </div>
        ) : (
          units
            .filter(u =>
              u.numeroUnidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.responsavelPrincipal.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.bloco.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.telefone.includes(searchTerm)
            )
            .map(unit => (
              <div key={unit.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 text-xs">
                      {unit.numeroUnidade}
                    </span>
                    <span className="text-xs text-white font-semibold">{unit.bloco}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">
                    Ativo
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="text-slate-200">
                    <span className="text-slate-400">Morador:</span> <strong className="text-white">{unit.responsavelPrincipal}</strong>
                  </div>
                  <div className="text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{unit.telefone || 'Não informado'}</span>
                  </div>
                  {unit.email && (
                    <div className="text-slate-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{unit.email}</span>
                    </div>
                  )}
                  {unit.observacoes && (
                    <div className="text-[10px] text-amber-300/80">
                      Obs: {unit.observacoes}
                    </div>
                  )}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Add Unit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 my-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Cadastrar Unidade Predial</h3>
            <p className="text-xs text-slate-400 mb-4">
              Informe a identificação da unidade e dados do morador para recebimento e notificações.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Bloco / Torre</label>
                  <input
                    type="text"
                    required
                    value={formData.bloco}
                    onChange={e => setFormData({ ...formData, bloco: e.target.value })}
                    placeholder="Torre A"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Andar</label>
                  <input
                    type="text"
                    value={formData.andar}
                    onChange={e => setFormData({ ...formData, andar: e.target.value })}
                    placeholder="2º Andar"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nº Unidade / Apto *</label>
                  <input
                    type="text"
                    required
                    value={formData.numeroUnidade}
                    onChange={e => setFormData({ ...formData, numeroUnidade: e.target.value })}
                    placeholder="Apto 204"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Morador ou Responsável Principal *</label>
                <input
                  type="text"
                  required
                  value={formData.responsavelPrincipal}
                  onChange={e => setFormData({ ...formData, responsavelPrincipal: e.target.value })}
                  placeholder="Nome completo do morador titular"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    required
                    value={formData.telefone}
                    onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="morador@email.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Observações Internas (LGPD protegida)</label>
                <input
                  type="text"
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Ex: Autorizado a receber encomendas na ausência"
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
                  Salvar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
