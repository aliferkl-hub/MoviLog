import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MasterStats, Company, CommercialPlan, PaymentRequest, AuditLog } from '../../types';
import { api } from '../../lib/api';
import {
  ShieldCheck,
  Building2,
  DollarSign,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Settings,
  Phone,
  FileText,
  AlertTriangle,
  RefreshCw,
  Plus,
  Edit,
  Save,
  Search,
  Sliders,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';

export const MasterDashboard: React.FC = () => {
  const { user, masterEmail, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'payments' | 'plans' | 'config' | 'audit'>('overview');
  const [stats, setStats] = useState<MasterStats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Config Form
  const [config, setConfig] = useState({
    nomePlataforma: '',
    whatsappComercial: '',
    mensagemWhatsappPadrao: '',
    diasDemonstracao: 7
  });
  const [configSaved, setConfigSaved] = useState(false);

  // Selected company for action modal
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [extendDays, setExtendDays] = useState(7);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [companyStatus, setCompanyStatus] = useState<any>('ativo');

  // Plan editing modal
  const [editingPlan, setEditingPlan] = useState<CommercialPlan | null>(null);

  const loadAllMasterData = async () => {
    setLoading(true);
    try {
      const [s, c, p, pl, cfg, logs] = await Promise.all([
        api.getMasterStats(),
        api.getMasterCompanies(),
        api.getMasterPayments(),
        api.getMasterPlans(),
        api.getMasterConfig(),
        api.getMasterAuditLogs()
      ]);
      setStats(s);
      setCompanies(c.companies);
      setPayments(p.payments);
      setPlans(pl.plans);
      setConfig(cfg.config);
      setAuditLogs(logs.logs);
    } catch (err) {
      console.error('Error fetching master data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllMasterData();
  }, []);

  const handleVerifyPayment = async (id: string, action: 'aprovar' | 'rejeitar', observacoes?: string) => {
    try {
      await api.verifyPayment(id, { action, observacoes });
      await loadAllMasterData();
    } catch (err: any) {
      alert(err.message || 'Erro ao processar pagamento');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateMasterConfig(config);
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações');
    }
  };

  const handleUpdateCompany = async () => {
    if (!selectedCompany) return;
    try {
      await api.updateMasterCompany(selectedCompany.id, {
        statusCadastro: companyStatus,
        planoId: selectedPlanId || selectedCompany.planoId,
        extendDemoDays: extendDays > 0 ? extendDays : undefined
      });
      setSelectedCompany(null);
      await loadAllMasterData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar empresa');
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      await api.updateMasterPlan(editingPlan.id, editingPlan);
      setEditingPlan(null);
      await loadAllMasterData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar plano');
    }
  };

  const handleSeedData = async () => {
    try {
      const res = await api.seedSampleData();
      alert(res.message);
      await loadAllMasterData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1D1B24] border border-[#393442] rounded-3xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6] shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/40 rounded-full font-mono">
                  Painel de Controle Máximo
                </span>
                <span className="text-xs text-[#AAA6B5]">Acesso Permanente Vitalício</span>
              </div>
              <h1 className="text-2xl font-black text-[#F5F3FA] mt-1">
                Administrador Master Owner
              </h1>
              <p className="text-xs text-[#AAA6B5]">
                Logado com e-mail autorizado: <span className="font-mono text-[#C4B5FD] font-bold">{masterEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllMasterData}
              className="px-3.5 py-2 rounded-xl bg-[#25222D] hover:bg-[#1D1B24] border border-[#393442] text-xs font-semibold text-[#F5F3FA] transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8B5CF6]' : ''}`} />
              <span>Atualizar Dados</span>
            </button>
            <button
              onClick={handleSeedData}
              className="px-3.5 py-2 rounded-xl bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 text-xs font-semibold text-[#C4B5FD] transition flex items-center gap-2"
            >
              <Database className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Inserir Dados Iniciais</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#393442] pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Visão Geral & Métricas', icon: DollarSign },
          { id: 'companies', label: 'Empresas Cadastradas', icon: Building2, badge: companies.length },
          { id: 'payments', label: 'Verificação de Pagamentos', icon: CheckCircle2, badge: payments.filter(p => p.status === 'pendente').length, badgeColor: 'bg-[#8B5CF6] text-white' },
          { id: 'plans', label: 'Planos & Precificação', icon: Sliders },
          { id: 'config', label: 'WhatsApp & Plataforma', icon: Phone },
          { id: 'audit', label: 'Logs de Auditoria', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/20'
                  : 'text-[#AAA6B5] hover:text-[#F5F3FA] hover:bg-[#25222D]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${tab.badgeColor || 'bg-[#17171D] text-[#AAA6B5]'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & REAL METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Receita Confirmada (Real)</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-2">
                R$ {(stats?.totalVerifiedRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Calculada estritamente de pagamentos aprovados</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Empresas Cadastradas</span>
                <Building2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">
                {stats?.totalCompanies || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {stats?.activeSubs || 0} ativas • {stats?.demoActive || 0} em demonstração
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Pagamentos em Análise</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 mt-2">
                {stats?.pendingPayments || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Aguardando conferência do Master Owner</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Demonstrações Expiradas</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400 mt-2">
                {stats?.demoExpired || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Potenciais conversões comerciais</p>
            </div>
          </div>

          {/* Quick Pending Payments Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Solicitações de Pagamento Recentes</h3>
              </div>
              <button
                onClick={() => setActiveTab('payments')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <span>Ver todas as solicitações</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {payments.filter(p => p.status === 'pendente').length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/60">
                Nenhum pagamento pendente no momento. Todas as assinaturas estão verificadas.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {payments.filter(p => p.status === 'pendente').map(p => (
                  <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white">{p.companyName}</div>
                      <div className="text-xs text-slate-400">
                        Plano: <span className="text-indigo-400 font-semibold">{p.planoNome}</span> • Valor: <span className="text-emerald-400 font-semibold">R$ {p.valor}</span> • Método: {p.metodoPagamento}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Ref: {p.comprovanteReferencia} • Solicitado em: {new Date(p.solicitadoEm).toLocaleString('pt-BR')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleVerifyPayment(p.id, 'aprovar')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md shadow-emerald-600/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirmar Pagamento</span>
                      </button>
                      <button
                        onClick={() => handleVerifyPayment(p.id, 'rejeitar')}
                        className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejeitar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPANIES MANAGEMENT */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, razão social, CNPJ ou e-mail..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="text-xs text-slate-400">
              Total: <span className="font-bold text-white">{companies.length}</span> empresas registradas
            </div>
          </div>

          {/* DESKTOP COMPANIES TABLE */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[750px]">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Empresa / CNPJ</th>
                    <th className="p-3.5">Responsável / Contato</th>
                    <th className="p-3.5">Operação / Módulos</th>
                    <th className="p-3.5">Status Assinatura</th>
                    <th className="p-3.5">Período / Validade</th>
                    <th className="p-3.5 text-right">Ações Master</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {companies
                    .filter(c =>
                      c.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (c.cnpj && c.cnpj.includes(searchTerm))
                    )
                    .map(comp => {
                      const isExpired = comp.statusAssinatura === 'demo_expirada' || comp.statusAssinatura === 'assinatura_vencida';
                      const planName = plans.find(p => p.id === comp.planoId)?.nome || comp.planoId;

                      return (
                        <tr key={comp.id} className="hover:bg-slate-800/30 transition">
                          <td className="p-3.5">
                            <div className="font-bold text-white">{comp.nomeFantasia}</div>
                            <div className="text-[11px] text-slate-400">{comp.razaoSocial}</div>
                            {comp.cnpj && <div className="text-[10px] font-mono text-slate-500">{comp.cnpj}</div>}
                          </td>
                          <td className="p-3.5">
                            <div className="text-slate-200">{comp.responsavel}</div>
                            <div className="text-[11px] text-slate-400">{comp.email}</div>
                            <div className="text-[11px] text-slate-500">{comp.telefone}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="capitalize text-slate-300 font-medium">{comp.tipoOperacao}</div>
                            <div className="flex gap-1 mt-1">
                              {comp.modulos.map(m => (
                                <span key={m} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] uppercase font-bold">
                                  {m}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                comp.statusAssinatura === 'assinatura_ativa'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : comp.statusAssinatura === 'demo_ativa'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                  : comp.statusAssinatura === 'pagamento_em_analise'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {comp.statusAssinatura.replace('_', ' ')}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1">{planName}</div>
                          </td>
                          <td className="p-3.5 text-[11px] text-slate-400">
                            {comp.statusAssinatura === 'demo_ativa' && comp.demoEndDate && (
                              <div>Até: {new Date(comp.demoEndDate).toLocaleDateString('pt-BR')}</div>
                            )}
                            {comp.statusAssinatura === 'assinatura_ativa' && comp.subscriptionEndDate && (
                              <div>Até: {new Date(comp.subscriptionEndDate).toLocaleDateString('pt-BR')}</div>
                            )}
                            {isExpired && <span className="text-rose-400 font-semibold">Expirado</span>}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setSelectedCompany(comp);
                                setSelectedPlanId(comp.planoId);
                                setCompanyStatus(comp.statusCadastro);
                              }}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-xs font-semibold transition"
                            >
                              Gerenciar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE COMPANIES CARD VIEW */}
          <div className="block md:hidden space-y-3">
            {companies
              .filter(c =>
                c.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.cnpj && c.cnpj.includes(searchTerm))
              )
              .map(comp => {
                const planName = plans.find(p => p.id === comp.planoId)?.nome || comp.planoId;
                return (
                  <div key={comp.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div>
                        <span className="font-bold text-white text-sm">{comp.nomeFantasia}</span>
                        {comp.cnpj && <div className="text-[10px] font-mono text-slate-400">{comp.cnpj}</div>}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          comp.statusAssinatura === 'assinatura_ativa'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : comp.statusAssinatura === 'demo_ativa'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {comp.statusAssinatura.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="text-slate-300">
                        <span className="text-slate-500">Responsável:</span> {comp.responsavel} ({comp.email})
                      </div>
                      <div className="text-slate-300">
                        <span className="text-slate-500">Plano Atual:</span> <strong className="text-white">{planName}</strong>
                      </div>
                      {comp.demoEndDate && comp.statusAssinatura === 'demo_ativa' && (
                        <div className="text-[10px] text-amber-400">
                          Demo até: {new Date(comp.demoEndDate).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      {comp.subscriptionEndDate && comp.statusAssinatura === 'assinatura_ativa' && (
                        <div className="text-[10px] text-emerald-400">
                          Válido até: {new Date(comp.subscriptionEndDate).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-800/80 pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedCompany(comp);
                          setSelectedPlanId(comp.planoId);
                          setCompanyStatus(comp.statusCadastro);
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-xs font-semibold"
                      >
                        Gerenciar Empresa
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Action Modal for Selected Company */}
          {selectedCompany && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
              <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-bold text-white mb-1">
                  Gerenciar Empresa: {selectedCompany.nomeFantasia}
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Alterações com privilégio Master Owner com registro em logs de auditoria.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Situação Cadastral</label>
                    <select
                      value={companyStatus}
                      onChange={e => setCompanyStatus(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="suspenso">Suspenso (Bloqueia acesso)</option>
                      <option value="encerrado">Encerrado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Alterar Plano Manualmente</label>
                    <select
                      value={selectedPlanId}
                      onChange={e => setSelectedPlanId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nome} - R$ {p.precoMensal}/mês
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Prorrogar Demonstração / Adicionar Dias (+ Dias)
                    </label>
                    <div className="flex items-center gap-2">
                      {[7, 15, 30].map(days => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setExtendDays(days)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            extendDays === days ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          +{days} Dias
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedCompany(null)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleUpdateCompany}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-amber-500/20"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENTS VERIFICATION CENTER */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Central de Verificação e Liberação Manual de Pagamentos</h3>
              <p className="text-xs text-slate-400">
                Conforme as regras de negócio, nenhuma assinatura é liberada automaticamente sem a confirmação manual do Master Owner.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Empresa</th>
                    <th className="p-3.5">Plano / Duração</th>
                    <th className="p-3.5">Valor (R$)</th>
                    <th className="p-3.5">Método / Referência</th>
                    <th className="p-3.5">Data da Solicitação</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                        Nenhum pagamento registrado no momento.
                      </td>
                    </tr>
                  ) : (
                    payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-3.5 font-bold text-white">{p.companyName}</td>
                        <td className="p-3.5">
                          <div className="text-indigo-400 font-semibold">{p.planoNome}</div>
                          <div className="text-[10px] text-slate-400">{p.periodoMeses} mês(es)</div>
                        </td>
                        <td className="p-3.5 font-bold text-emerald-400">
                          R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5">
                          <div className="text-slate-300">{p.metodoPagamento}</div>
                          <div className="text-[10px] font-mono text-slate-500">{p.comprovanteReferencia}</div>
                        </td>
                        <td className="p-3.5 text-[11px] text-slate-400">
                          {new Date(p.solicitadoEm).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              p.status === 'aprovado'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : p.status === 'rejeitado'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {p.status === 'pendente' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleVerifyPayment(p.id, 'aprovar')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                              >
                                Aprovar e Liberar
                              </button>
                              <button
                                onClick={() => handleVerifyPayment(p.id, 'rejeitar')}
                                className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold transition"
                              >
                                Rejeitar
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500">
                              {p.aprovadoPor ? `Verificado por ${p.aprovadoPor}` : 'Concluído'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMMERCIAL PLANS & PRICING */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Central de Planos e Precificação</h3>
              <p className="text-xs text-slate-400">
                Altere valores, limites de usuários, unidades e recursos sem necessidade de modificar código.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(p => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-white">{p.nome}</h4>
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 bg-slate-800 rounded">
                      {p.tipo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{p.descricao}</p>

                  <div className="my-4 py-3 border-y border-slate-800 flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">Mensal</div>
                      <div className="text-xl font-bold text-white">R$ {p.precoMensal}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Anual</div>
                      <div className="text-xl font-bold text-white">R$ {p.precoAnual}</div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    <div>Max Usuários: <span className="font-bold text-white">{p.limites.maxUsuarios}</span></div>
                    <div>Max Unidades: <span className="font-bold text-white">{p.limites.maxUnidades}</span></div>
                    <div>Max Operações/mês: <span className="font-bold text-white">{p.limites.maxOperacoesMes}</span></div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className={`text-[10px] font-bold ${p.ativo ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {p.ativo ? '● Ativo para contratação' : '○ Inativo'}
                  </span>
                  <button
                    onClick={() => setEditingPlan({ ...p })}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar Plano</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Edit Plan Modal */}
          {editingPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
              <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
                <button
                  onClick={() => setEditingPlan(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-bold text-white mb-3">
                  Editar Plano: {editingPlan.nome}
                </h3>

                <form onSubmit={handleSavePlan} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Plano</label>
                    <input
                      type="text"
                      value={editingPlan.nome}
                      onChange={e => setEditingPlan({ ...editingPlan, nome: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Preço Mensal (R$)</label>
                      <input
                        type="number"
                        value={editingPlan.precoMensal}
                        onChange={e => setEditingPlan({ ...editingPlan, precoMensal: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Preço Anual (R$)</label>
                      <input
                        type="number"
                        value={editingPlan.precoAnual}
                        onChange={e => setEditingPlan({ ...editingPlan, precoAnual: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Max Usuários</label>
                      <input
                        type="number"
                        value={editingPlan.limites.maxUsuarios}
                        onChange={e => setEditingPlan({
                          ...editingPlan,
                          limites: { ...editingPlan.limites, maxUsuarios: Number(e.target.value) }
                        })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Max Unidades</label>
                      <input
                        type="number"
                        value={editingPlan.limites.maxUnidades}
                        onChange={e => setEditingPlan({
                          ...editingPlan,
                          limites: { ...editingPlan.limites, maxUnidades: Number(e.target.value) }
                        })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Max Operações</label>
                      <input
                        type="number"
                        value={editingPlan.limites.maxOperacoesMes}
                        onChange={e => setEditingPlan({
                          ...editingPlan,
                          limites: { ...editingPlan.limites, maxOperacoesMes: Number(e.target.value) }
                        })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPlan(null)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: WHATSAPP & PLATFORM CONFIG */}
      {activeTab === 'config' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-3xl">
          <h3 className="text-base font-bold text-white mb-1">Configurações Oficiais de Vendas no WhatsApp</h3>
          <p className="text-xs text-slate-400 mb-6">
            Configure o número oficial de WhatsApp para contratações e as mensagens geradas automaticamente.
          </p>

          {configSaved && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Configurações atualizadas com sucesso!</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nome Oficial da Plataforma</label>
              <input
                type="text"
                value={config.nomePlataforma}
                onChange={e => setConfig({ ...config, nomePlataforma: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Número Oficial do WhatsApp Comercial (DDI + DDD + Número)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={config.whatsappComercial}
                  onChange={e => setConfig({ ...config, whatsappComercial: e.target.value })}
                  placeholder="Ex: 5511999999999"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Este número receberá todas as conversas iniciadas pelos botões de contratação de planos.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Prazo Padrão de Demonstração (Dias)</label>
              <input
                type="number"
                value={config.diasDemonstracao}
                onChange={e => setConfig({ ...config, diasDemonstracao: Number(e.target.value) })}
                className="w-32 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="mt-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-md shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configurações da Plataforma</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: GLOBAL AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Trilha de Auditoria Geral da Plataforma</h3>
              <p className="text-xs text-slate-400">
                Registro imutável de todas as ações administrativas, login, alterações e retiradas.
              </p>
            </div>
            <span className="text-xs text-slate-500">{auditLogs.length} eventos</span>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] sticky top-0">
                <tr>
                  <th className="p-3">Data / Hora</th>
                  <th className="p-3">Usuário</th>
                  <th className="p-3">Empresa</th>
                  <th className="p-3">Ação</th>
                  <th className="p-3">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="p-3 text-slate-400 shrink-0">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-slate-200">
                      <div>{log.userName}</div>
                      <div className="text-[10px] text-slate-500">{log.userEmail}</div>
                    </td>
                    <td className="p-3 text-slate-300">
                      {log.companyName || '— Master Global —'}
                    </td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-bold text-[10px]">
                        {log.acao}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 font-sans text-xs">
                      {log.detalhes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
