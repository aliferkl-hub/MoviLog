import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Users,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Mail,
  Phone,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Truck,
  Building,
  UserCheck,
  DollarSign,
  Plus
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { user, isMaster, company } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'driver',
    phone: ''
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getCompanyUsers();
      setUsers(res.users || []);
    } catch (err: any) {
      console.warn('Erro ao carregar colaboradores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [company?.id]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Nome, e-mail e senha são obrigatórios.');
      return;
    }
    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.createCompanyUser(form);
      setSuccessMsg(`Colaborador ${form.name} cadastrado com sucesso!`);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'driver', phone: '' });
      await loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Falha ao cadastrar colaborador.');
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'master_owner': return { text: 'Master Owner', color: 'text-amber-300 bg-amber-500/20 border-amber-500/30' };
      case 'company_admin': return { text: 'Administrador', color: 'text-violet-300 bg-violet-500/20 border-violet-500/30' };
      case 'dispatcher': return { text: 'Roteirista / Despachante', color: 'text-blue-300 bg-blue-500/20 border-blue-500/30' };
      case 'driver': return { text: 'Motorista / Entregador', color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' };
      case 'operator': return { text: 'Operador / Almoxarifado', color: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30' };
      case 'concierge': return { text: 'Portaria & Guarita', color: 'text-fuchsia-300 bg-fuchsia-500/20 border-fuchsia-500/30' };
      case 'financial': return { text: 'Financeiro', color: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30' };
      default: return { text: role, color: 'text-gray-300 bg-gray-500/20 border-gray-500/30' };
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F5F3FA] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#8B5CF6]" />
            <span>Equipe, Operadores & Colaboradores</span>
          </h2>
          <p className="text-xs text-[#AAA6B5]">
            Gerenciamento de motoristas, porteiros, conferentes e administradores da empresa
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-[#8B5CF6]/30 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Colaborador</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Active User Highlight */}
      <div className="bg-[#121024] border border-[#2D2644] rounded-3xl p-6 shadow-xl">
        <h3 className="text-xs font-bold text-[#AAA6B5] uppercase tracking-wider mb-3">Sua Sessão Ativa</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0D0B18] border border-[#2D2644] rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6] font-bold text-lg">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm">{user?.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono ${getRoleLabel(user?.role || '').color}`}>
                  {getRoleLabel(user?.role || '').text}
                </span>
              </div>
              <div className="text-xs text-[#AAA6B5] flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>{user?.email}</span>
                </span>
                {user?.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{user.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right sm:border-l sm:border-[#2D2644] sm:pl-6 text-xs text-[#AAA6B5]">
            <span>Empresa Vinculada</span>
            <span className="font-bold text-white block truncate max-w-[200px]">
              {company?.nomeFantasia || 'MoviLog Matriz'}
            </span>
          </div>
        </div>
      </div>

      {/* Team Filter & Listing */}
      <div className="bg-[#121024] border border-[#2D2644] rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#716A85]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail ou telefone..."
              className="w-full pl-10 pr-4 py-2 bg-[#0D0B18] border border-[#2D2644] rounded-xl text-xs text-white placeholder-[#716A85] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-[#0D0B18] border border-[#2D2644] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="all">Todos os Cargos ({users.length})</option>
              <option value="driver">Motoristas / Entregadores</option>
              <option value="operator">Operadores de Logística</option>
              <option value="concierge">Portaria & Guarita</option>
              <option value="dispatcher">Roteiristas & Despacho</option>
              <option value="company_admin">Administradores</option>
              <option value="financial">Financeiro</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#AAA6B5] gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#8B5CF6]" />
            <span className="text-xs">Carregando lista de colaboradores...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-[#AAA6B5] border border-dashed border-[#2D2644] rounded-2xl p-6">
            <Users className="w-10 h-10 mx-auto text-[#716A85] mb-2" />
            <p className="text-xs font-semibold text-white">Nenhum colaborador encontrado.</p>
            <p className="text-[11px] text-[#716A85] mt-1">
              {search || roleFilter !== 'all' ? 'Tente ajustar os filtros de busca.' : 'Clique em "Novo Colaborador" para adicionar motoristas e operadores.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(collab => {
              const roleInfo = getRoleLabel(collab.role);
              return (
                <div
                  key={collab.id}
                  className="p-4 bg-[#0D0B18] border border-[#2D2644] hover:border-[#8B5CF6]/50 rounded-2xl transition shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center font-bold text-white text-sm shrink-0">
                        {collab.name?.charAt(0) || 'C'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{collab.name}</span>
                        <span className="text-[11px] text-[#AAA6B5] block truncate">{collab.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#2D2644]/60">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono ${roleInfo.color}`}>
                      {roleInfo.text}
                    </span>
                    {collab.phone ? (
                      <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{collab.phone}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#716A85]">Sem telefone</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Collaborator Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#121024] border border-[#2D2644] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative p-6 sm:p-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-[#AAA6B5] hover:text-white hover:bg-[#1C1829] transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6]">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Novo Colaborador</h3>
                <p className="text-[11px] text-[#AAA6B5]">Crie credenciais de acesso para sua equipe</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-[#0D0B18] border border-[#2D2644] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAA6B5] mb-1">E-mail de Login *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="joao@empresa.com.br"
                  className="w-full bg-[#0D0B18] border border-[#2D2644] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Senha Inicial *</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 dígitos"
                    className="w-full bg-[#0D0B18] border border-[#2D2644] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="11988887777"
                    className="w-full bg-[#0D0B18] border border-[#2D2644] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Função / Perfil de Acesso *</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-[#0D0B18] border border-[#2D2644] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="driver">Motorista / Entregador (Acesso ao App Mobile & GPS)</option>
                  <option value="operator">Operador / Almoxarifado (Recebimento e Estoque)</option>
                  <option value="concierge">Porteiro / Recepção (Encomendas & Visitantes)</option>
                  <option value="dispatcher">Roteirista / Despachante (Torre de Controle)</option>
                  <option value="financial">Financeiro & Custos</option>
                  <option value="company_admin">Administrador da Empresa (Gestão Geral)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-[#AAA6B5] hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-[#8B5CF6]/30 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Cadastrar Colaborador</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
