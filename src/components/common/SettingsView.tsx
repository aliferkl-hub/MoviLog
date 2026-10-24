import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Settings,
  Building,
  Phone,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { TerminalsIntegrationView } from '../commerce/TerminalsIntegrationView';

export const SettingsView: React.FC = () => {
  const { company, isMaster, refreshUser, isDemo, demoDaysLeft } = useAuth();
  const [activeTab, setActiveTab] = useState<'geral' | 'maquininhas'>('geral');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    nomeFantasia: company?.nomeFantasia || '',
    razaoSocial: company?.razaoSocial || '',
    cnpj: company?.cnpj || '',
    telefone: company?.telefone || '',
    endereco: company?.endereco || '',
    segmento: company?.segmento || 'Logística e Gestão Predial Integrada',
    responsavel: company?.responsavel || '',
    quantidadeFuncionarios: company?.quantidadeFuncionarios || 10
  });

  useEffect(() => {
    const fetchCompany = async () => {
      setLoading(true);
      try {
        const res = await api.getCompanyProfile();
        if (res.company) {
          setForm({
            nomeFantasia: res.company.nomeFantasia || '',
            razaoSocial: res.company.razaoSocial || '',
            cnpj: res.company.cnpj || '',
            telefone: res.company.telefone || '',
            endereco: res.company.endereco || '',
            segmento: res.company.segmento || 'Logística e Gestão Predial Integrada',
            responsavel: res.company.responsavel || '',
            quantidadeFuncionarios: res.company.quantidadeFuncionarios || 10
          });
        }
      } catch (err) {
        console.warn('Não foi possível carregar perfil atualizado da empresa:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nomeFantasia.trim() || !form.razaoSocial.trim()) {
      setError('Nome Fantasia e Razão Social são obrigatórios.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.updateCompanyProfile(form);
      setSaved(true);
      await refreshUser();
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F5F3FA] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#8B5CF6]" />
            <span>Configurações Operacionais & Empresa</span>
          </h2>
          <p className="text-xs text-[#AAA6B5]">
            Dados cadastrais, identificação corporativa e parâmetros gerais de funcionamento
          </p>
        </div>

        {/* Company Status Pill */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30 rounded-full flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5" />
            <span>{company?.tipoOperacao ? company.tipoOperacao.toUpperCase() : 'INTEGRADA'}</span>
          </span>
          {isDemo && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{demoDaysLeft} Dias de Demonstração</span>
            </span>
          )}
        </div>
      </div>

      {/* Sub-tabs: Dados da Empresa vs Pagamentos > Minhas Maquininhas */}
      <div className="flex items-center gap-2 border-b border-[#2D2644] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('geral')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'geral'
              ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30'
              : 'text-[#AAA6B5] hover:text-white hover:bg-[#121024]'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Dados da Empresa & Limites</span>
        </button>

        <button
          onClick={() => setActiveTab('maquininhas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'maquininhas'
              ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30'
              : 'text-[#AAA6B5] hover:text-white hover:bg-[#121024]'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>Configurações &gt; Pagamentos &gt; Minhas Maquininhas</span>
        </button>
      </div>

      {activeTab === 'maquininhas' ? (
        <TerminalsIntegrationView initialModulo="ambos" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 bg-[#121024] border border-[#2D2644] rounded-3xl p-6 sm:p-8 shadow-xl">
          {saved && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Configurações salvas e persistidas no servidor com sucesso!</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#AAA6B5] gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#8B5CF6]" />
              <span className="text-xs">Carregando dados da empresa...</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1.5">
                    Nome Fantasia <span className="text-[#8B5CF6]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nomeFantasia}
                    onChange={e => setForm({ ...form, nomeFantasia: e.target.value })}
                    required
                    placeholder="Ex: MoviLog Matriz"
                    className="w-full bg-[#0D0B18] border border-[#2D2644] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8B5CF6] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1.5">
                    Razão Social <span className="text-[#8B5CF6]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.razaoSocial}
                    onChange={e => setForm({ ...form, razaoSocial: e.target.value })}
                    required
                    placeholder="Ex: MoviLog Soluções em Logística Ltda"
                    className="w-full bg-[#0D0B18] border border-[#2D2644] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8B5CF6] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1.5">CNPJ</label>
                  <input
                    type="text"
                    value={form.cnpj}
                    onChange={e => setForm({ ...form, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="w-full bg-[#0D0B18] border border-[#2D2644] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8B5CF6] font-mono transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1.5">
                    WhatsApp / Telefone Operacional
                  </label>
                  <input
                    type="text"
                    value={form.telefone}
                    onChange={e => setForm({ ...form, telefone: e.target.value })}
                    placeholder="11999999999"
                    className="w-full bg-[#0D0B18] border border-[#2D2644] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8B5CF6] font-mono transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1.5">
                    Responsável Operacional
                  </label>
                  <input
                    type="text"
                    value={form.responsavel}
                    onChange={e => setForm({ ...form, responsavel: e.target.value })}
                    placeholder="Nome do gestor ou administrador"
                    className="w-full bg-[#0D0B18] border border-[#2D2644] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8B5CF6] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1.5">
                    Segmento de Atuação
                  </label>
                  <input
                    type="text"
                    value={form.segmento}
                    onChange={e => setForm({ ...form, segmento: e.target.value })}
                    placeholder="Ex: Transporte, Distribuição, Condomínio"
                    className="w-full bg-[#0D0B18] border border-[#2D2644] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8B5CF6] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAA6B5] mb-1.5">
                  Endereço Completo da Sede / Centro de Distribuição
                </label>
                <input
                  type="text"
                  value={form.endereco}
                  onChange={e => setForm({ ...form, endereco: e.target.value })}
                  placeholder="Av. Paulista, 1000, Bela Vista - São Paulo/SP - CEP 01310-100"
                  className="w-full bg-[#0D0B18] border border-[#2D2644] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8B5CF6] transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-[#8B5CF6]/25"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando no Servidor...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Configurações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Company Limits & Plan Details Card */}
        <div className="space-y-4">
          <div className="bg-[#121024] border border-[#2D2644] rounded-3xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#8B5CF6]" />
              <span>Limites da Assinatura</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 bg-[#0D0B18] border border-[#2D2644] rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#AAA6B5] block">Usuários Permitidos</span>
                  <span className="text-xs font-bold text-white font-mono">
                    {company?.limites?.maxUsuarios || 10} operadores
                  </span>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="p-3.5 bg-[#0D0B18] border border-[#2D2644] rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#AAA6B5] block">Unidades / Blocos</span>
                  <span className="text-xs font-bold text-white font-mono">
                    {company?.limites?.maxUnidades || 100} cadastradas
                  </span>
                </div>
                <Building className="w-4 h-4 text-[#8B5CF6]" />
              </div>

              <div className="p-3.5 bg-[#0D0B18] border border-[#2D2644] rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#AAA6B5] block">Capacidade Mensal</span>
                  <span className="text-xs font-bold text-white font-mono">
                    {company?.limites?.maxOperacoesMes || 1000} entregas/mês
                  </span>
                </div>
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#2D2644]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#AAA6B5]">Status do Cadastro:</span>
                <span className="font-bold text-emerald-400 uppercase font-mono text-[11px]">
                  {company?.statusCadastro || 'Ativo'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
