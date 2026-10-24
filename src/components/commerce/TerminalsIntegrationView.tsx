import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Battery,
  ShieldCheck,
  Smartphone,
  Server,
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Sliders,
  Trash2,
  Edit2,
  X,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  Search,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../../lib/api';
import type {
  CommercialTerminal,
  CommercialTerminalTransaction,
  TerminalProvider,
  TerminalReconciliationReport
} from '../../types';

interface TerminalsIntegrationViewProps {
  initialModulo?: 'adega' | 'tabacaria' | 'ambos';
  onNavigateToPOS?: (modulo: 'adega' | 'tabacaria') => void;
}

export const TerminalsIntegrationView: React.FC<TerminalsIntegrationViewProps> = ({
  initialModulo = 'ambos',
  onNavigateToPOS
}) => {
  const [activeTab, setActiveTab] = useState<'terminais' | 'novo' | 'transacoes' | 'conciliacao'>('terminais');
  const [selectedModulo, setSelectedModulo] = useState<'adega' | 'tabacaria' | 'ambos'>(initialModulo);

  // Terminals State
  const [terminals, setTerminals] = useState<CommercialTerminal[]>([]);
  const [loadingTerminals, setLoadingTerminals] = useState(true);
  const [testingTerminalId, setTestingTerminalId] = useState<string | null>(null);
  const [testResultModal, setTestResultModal] = useState<{
    open: boolean;
    terminalNome: string;
    sucesso: boolean;
    mensagem: string;
    detalhes?: any;
    bateria?: number;
  }>({ open: false, terminalNome: '', sucesso: false, mensagem: '' });

  // Form State (New or Edit)
  const [editingTerminalId, setEditingTerminalId] = useState<string | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formProvedor, setFormProvedor] = useState<TerminalProvider>('mercadopago_point');
  const [formModelo, setFormModelo] = useState('Point Smart (A910 / P2)');
  const [formTipoEquipamento, setFormTipoEquipamento] = useState<'smart_pos' | 'pos_gprs' | 'tef_pinpad' | 'pos_manual'>('smart_pos');
  const [formIdentificador, setFormIdentificador] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formModulo, setFormModulo] = useState<'adega' | 'tabacaria' | 'ambos'>('adega');
  const [formPadrao, setFormPadrao] = useState(false);
  const [formModoOperacao, setFormModoOperacao] = useState<'cloud_api' | 'smart_pos_app' | 'tef_integrado' | 'manual_operador'>('cloud_api');
  // Credentials
  const [formMpAccessToken, setFormMpAccessToken] = useState('');
  const [formStonePartnerKey, setFormStonePartnerKey] = useState('');
  const [formStoneSecretKey, setFormStoneSecretKey] = useState('');
  const [formStoneMerchantId, setFormStoneMerchantId] = useState('');
  const [formTefHost, setFormTefHost] = useState('127.0.0.1');
  const [formTefPort, setFormTefPort] = useState('60906');
  const [formTefApiKey, setFormTefApiKey] = useState('');
  // Fees
  const [formTaxaDebito, setFormTaxaDebito] = useState('1.99');
  const [formTaxaCredito, setFormTaxaCredito] = useState('3.98');
  const [formTaxaPix, setFormTaxaPix] = useState('0.99');
  const [submittingTerminal, setSubmittingTerminal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Transactions State
  const [transactions, setTransactions] = useState<CommercialTerminalTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [filterTxStatus, setFilterTxStatus] = useState<string>('todos');

  // Reconciliation State
  const [reconciliation, setReconciliation] = useState<TerminalReconciliationReport | null>(null);
  const [loadingReconciliation, setLoadingReconciliation] = useState(false);
  const [filterRecModulo, setFilterRecModulo] = useState<string>('todos');

  // Load terminals
  const loadTerminals = async () => {
    try {
      setLoadingTerminals(true);
      const res = await api.getCommercialTerminals();
      if (res.success && res.terminals) {
        setTerminals(res.terminals);
      }
    } catch (err: any) {
      console.error('Erro ao carregar maquininhas:', err);
    } finally {
      setLoadingTerminals(false);
    }
  };

  // Load transactions
  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const res = await api.getTerminalTransactions({
        modulo: selectedModulo !== 'ambos' ? selectedModulo : undefined,
        status: filterTxStatus !== 'todos' ? filterTxStatus : undefined,
        limit: 100
      });
      if (res.success && res.transactions) {
        setTransactions(res.transactions);
      }
    } catch (err: any) {
      console.error('Erro ao carregar transações:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Load reconciliation
  const loadReconciliation = async () => {
    try {
      setLoadingReconciliation(true);
      const res = await api.getTerminalReconciliation({
        modulo: filterRecModulo !== 'todos' ? filterRecModulo : undefined
      });
      setReconciliation(res);
    } catch (err: any) {
      console.error('Erro ao gerar relatório de conciliação:', err);
    } finally {
      setLoadingReconciliation(false);
    }
  };

  useEffect(() => {
    loadTerminals();
  }, []);

  useEffect(() => {
    if (activeTab === 'transacoes') {
      loadTransactions();
    } else if (activeTab === 'conciliacao') {
      loadReconciliation();
    }
  }, [activeTab, selectedModulo, filterTxStatus, filterRecModulo]);

  // Quick Test Terminal Ping
  const handleTestTerminal = async (term: CommercialTerminal) => {
    try {
      setTestingTerminalId(term.id);
      const res = await api.testCommercialTerminal(term.id);
      setTestResultModal({
        open: true,
        terminalNome: term.nome,
        sucesso: res.success,
        mensagem: res.message,
        detalhes: res.details,
        bateria: res.batteryLevel
      });
      loadTerminals();
    } catch (err: any) {
      setTestResultModal({
        open: true,
        terminalNome: term.nome,
        sucesso: false,
        mensagem: err.message || 'Erro ao conectar ao terminal.',
        detalhes: err
      });
    } finally {
      setTestingTerminalId(null);
    }
  };

  // Toggle Default Terminal
  const handleToggleDefault = async (term: CommercialTerminal) => {
    try {
      await api.updateCommercialTerminal(term.id, { padrao: true });
      loadTerminals();
    } catch (err: any) {
      alert(err.message || 'Erro ao definir terminal padrão.');
    }
  };

  // Delete Terminal
  const handleDeleteTerminal = async (id: string) => {
    if (!confirm('Deseja realmente desvincular e remover este terminal? O histórico de transações passadas será preservado para auditoria.')) {
      return;
    }
    try {
      await api.deleteCommercialTerminal(id);
      loadTerminals();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover terminal.');
    }
  };

  // Prepare Edit
  const handleEditTerminal = (term: CommercialTerminal) => {
    setEditingTerminalId(term.id);
    setFormNome(term.nome);
    setFormProvedor(term.provedor);
    setFormModelo(term.modelo);
    setFormTipoEquipamento(term.tipoEquipamento);
    setFormIdentificador(term.identificadorProvedor);
    setFormSerial(term.serialNumber || '');
    setFormModulo(term.modulo);
    setFormPadrao(term.padrao);
    setFormModoOperacao(term.modoOperacao);
    setFormTaxaDebito(String(term.taxaDebitoPercentual || 1.99));
    setFormTaxaCredito(String(term.taxaCreditoPercentual || 3.98));
    setFormTaxaPix(String(term.taxaPixPercentual || 0.99));
    setFormMpAccessToken('');
    setFormStonePartnerKey('');
    setFormStoneSecretKey('');
    setFormStoneMerchantId('');
    setFormTefHost('127.0.0.1');
    setFormTefPort('60906');
    setFormTefApiKey('');
    setFormError(null);
    setFormSuccess(null);
    setActiveTab('novo');
  };

  // Save Terminal Form
  const handleSubmitTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formNome.trim()) {
      setFormError('Informe um nome de identificação claro para o terminal.');
      return;
    }

    if (formProvedor !== 'pos_manual' && !formIdentificador.trim()) {
      setFormError('Informe o identificador do provedor (Device ID da Point, Serial da Stone ou Código TEF).');
      return;
    }

    // Assemble credentials
    const credenciais: any = {};
    if (formProvedor === 'mercadopago_point') {
      if (formMpAccessToken.trim()) {
        credenciais.mpAccessToken = formMpAccessToken.trim();
      } else if (!editingTerminalId) {
        setFormError('Informe o Access Token do Mercado Pago (Produção ou Teste sandbox).');
        return;
      }
    } else if (formProvedor === 'stone_connect' || formProvedor === 'pagar_me') {
      if (formStonePartnerKey.trim()) credenciais.stonePartnerKey = formStonePartnerKey.trim();
      if (formStoneSecretKey.trim()) credenciais.stoneSecretKey = formStoneSecretKey.trim();
      if (formStoneMerchantId.trim()) credenciais.stoneMerchantId = formStoneMerchantId.trim();
      if (!editingTerminalId && (!formStonePartnerKey.trim() || !formStoneSecretKey.trim())) {
        setFormError('Para Stone Connect, informe a Partner Key e a Secret Key credenciadas no Stone Partner Portal.');
        return;
      }
    } else if (formProvedor === 'smartpos_tef') {
      credenciais.tefHost = formTefHost.trim() || '127.0.0.1';
      credenciais.tefPort = parseInt(formTefPort, 10) || 60906;
      if (formTefApiKey.trim()) credenciais.tefApiKey = formTefApiKey.trim();
    }

    try {
      setSubmittingTerminal(true);
      const payload = {
        nome: formNome.trim(),
        provedor: formProvedor,
        modelo: formModelo.trim(),
        tipoEquipamento: formTipoEquipamento,
        identificadorProvedor: formIdentificador.trim() || 'MANUAL_POS',
        serialNumber: formSerial.trim() || undefined,
        modulo: formModulo,
        padrao: formPadrao,
        modoOperacao: formModoOperacao,
        taxaDebitoPercentual: parseFloat(formTaxaDebito) || 1.99,
        taxaCreditoPercentual: parseFloat(formTaxaCredito) || 3.98,
        taxaPixPercentual: parseFloat(formTaxaPix) || 0.99,
        credenciais: Object.keys(credenciais).length > 0 ? credenciais : undefined
      };

      if (editingTerminalId) {
        await api.updateCommercialTerminal(editingTerminalId, payload);
        setFormSuccess('Terminal atualizado com sucesso!');
      } else {
        await api.createCommercialTerminal(payload);
        setFormSuccess('Terminal cadastrado e pronto para integração!');
      }

      await loadTerminals();
      setTimeout(() => {
        setActiveTab('terminais');
        setEditingTerminalId(null);
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar terminal.');
    } finally {
      setSubmittingTerminal(false);
    }
  };

  // Helper provider label and icon
  const getProviderInfo = (provider: TerminalProvider) => {
    switch (provider) {
      case 'mercadopago_point':
        return {
          name: 'Mercado Pago Point',
          badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
          desc: 'Cloud Integration API oficial (Smart, Pro 2, Air)'
        };
      case 'stone_connect':
      case 'pagar_me':
        return {
          name: 'Stone Connect 2.0',
          badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          desc: 'Stone Hub Cloud POS (Smart POS P2, P2-B)'
        };
      case 'smartpos_tef':
        return {
          name: 'SmartPOS / TEF Web',
          badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          desc: 'Multi-adquirente (Cielo LIO, PagBank, Rede, PinPads)'
        };
      case 'pos_manual':
      default:
        return {
          name: 'POS Manual (Autônomo)',
          badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          desc: 'Maquininha avulsa (SumUp, Minizinha, confirmação por NSU)'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Commercial Context Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0A0714] border border-[#262042] p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/30 to-cyan-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-md">
              <CreditCard className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Central de Integração de Maquininhas (POS / TEF)
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-widest">
                  Multi-Provedor Oficial
                </span>
              </h1>
              <p className="text-xs text-[#AAA6B5]">
                Gestão e homologação de terminais de pagamento para os caixas da <strong>Adega & Bebidas</strong> e <strong>Tabacaria & Headshop</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToPOS && (
            <button
              onClick={() => onNavigateToPOS(selectedModulo === 'tabacaria' ? 'tabacaria' : 'adega')}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-purple-950/40"
            >
              <span>Abrir PDV ({selectedModulo === 'tabacaria' ? 'Tabacaria' : 'Adega'})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              setEditingTerminalId(null);
              setFormNome('');
              setFormIdentificador('');
              setFormSerial('');
              setFormMpAccessToken('');
              setFormStonePartnerKey('');
              setFormStoneSecretKey('');
              setFormError(null);
              setFormSuccess(null);
              setActiveTab('novo');
            }}
            className="px-3.5 py-2 bg-[#1A1633] hover:bg-[#262042] border border-[#2E2854] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Novo Terminal</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[#262042] pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('terminais')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'terminais'
              ? 'bg-[#121024] text-white border-t border-x border-[#262042] text-purple-300'
              : 'text-[#AAA6B5] hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4 text-purple-400" />
          <span>Minhas Maquininhas ({terminals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('novo')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'novo'
              ? 'bg-[#121024] text-white border-t border-x border-[#262042] text-purple-300'
              : 'text-[#AAA6B5] hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>{editingTerminalId ? 'Editar Maquininha' : 'Cadastrar Terminal'}</span>
        </button>

        <button
          onClick={() => setActiveTab('transacoes')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'transacoes'
              ? 'bg-[#121024] text-white border-t border-x border-[#262042] text-purple-300'
              : 'text-[#AAA6B5] hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Histórico de Transações POS</span>
        </button>

        <button
          onClick={() => setActiveTab('conciliacao')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'conciliacao'
              ? 'bg-[#121024] text-white border-t border-x border-[#262042] text-purple-300'
              : 'text-[#AAA6B5] hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Relatório de Conciliação Financeira</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: TERMINAIS CADASTRADOS                              */}
      {/* ========================================================= */}
      {activeTab === 'terminais' && (
        <div className="space-y-4">
          {/* Sub-header Filter by Commercial Module */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121024]/60 border border-[#262042] p-3 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#AAA6B5]">Filtrar por Módulo Comercial:</span>
              <div className="flex items-center gap-1">
                {(['ambos', 'adega', 'tabacaria'] as const).map(mod => (
                  <button
                    key={mod}
                    onClick={() => setSelectedModulo(mod)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition ${
                      selectedModulo === mod
                        ? 'bg-[#8B5CF6]/30 text-white border border-[#8B5CF6]/50'
                        : 'text-[#AAA6B5] hover:bg-[#1A1633]'
                    }`}
                  >
                    {mod === 'ambos' ? 'Todos os Módulos' : mod === 'adega' ? 'Adega & Bebidas' : 'Tabacaria'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={loadTerminals}
              disabled={loadingTerminals}
              className="px-2.5 py-1 bg-[#1A1633] hover:bg-[#262042] text-[#AAA6B5] hover:text-white rounded-lg flex items-center gap-1.5 transition shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTerminals ? 'animate-spin' : ''}`} />
              <span>Atualizar Terminais</span>
            </button>
          </div>

          {/* Grid of Terminals */}
          {loadingTerminals ? (
            <div className="py-16 text-center text-xs text-[#AAA6B5] space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto" />
              <p>Carregando terminais e estado da conexão com adquirentes...</p>
            </div>
          ) : terminals.length === 0 ? (
            <div className="p-12 text-center bg-[#0A0714] border border-[#262042] rounded-2xl space-y-3">
              <Smartphone className="w-12 h-12 text-[#4E4766] mx-auto" />
              <h3 className="text-base font-bold text-white">Nenhum terminal cadastrado ainda</h3>
              <p className="text-xs text-[#AAA6B5] max-w-md mx-auto">
                Conecte a maquininha do seu estabelecimento (Mercado Pago Point, Stone Connect, TEF ou POS Manual) para receber vendas no PDV com confirmação automática.
              </p>
              <button
                onClick={() => setActiveTab('novo')}
                className="mt-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                Cadastrar Primeiro Terminal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {terminals
                .filter(t => selectedModulo === 'ambos' || t.modulo === selectedModulo || t.modulo === 'ambos')
                .map(terminal => {
                  const provInfo = getProviderInfo(terminal.provedor);
                  const isOnline = terminal.statusConexao === 'online';

                  return (
                    <div
                      key={terminal.id}
                      className="bg-[#0A0714] border border-[#262042] hover:border-purple-500/40 rounded-2xl p-5 flex flex-col justify-between gap-4 transition shadow-lg relative group"
                    >
                      {/* Top Badges */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${provInfo.badgeClass}`}>
                            {provInfo.name}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {terminal.padrao && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                                Padrão
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                                isOnline
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {isOnline ? (
                                <>
                                  <Wifi className="w-3 h-3 text-emerald-400" />
                                  <span>Online</span>
                                </>
                              ) : (
                                <>
                                  <WifiOff className="w-3 h-3 text-rose-400" />
                                  <span>Offline</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                            {terminal.nome}
                          </h3>
                          <p className="text-xs text-[#AAA6B5] flex items-center gap-1.5 mt-0.5">
                            <span>Modelo:</span>
                            <strong className="text-white font-mono">{terminal.modelo}</strong>
                          </p>
                        </div>

                        {/* Hardware Specs & IDs */}
                        <div className="p-3 rounded-xl bg-[#121024] border border-[#262042] space-y-1.5 text-xs font-mono">
                          <div className="flex items-center justify-between text-[#AAA6B5]">
                            <span>ID Provedor / Device:</span>
                            <strong className="text-cyan-300">{terminal.identificadorProvedor}</strong>
                          </div>

                          {terminal.serialNumber && (
                            <div className="flex items-center justify-between text-[#AAA6B5]">
                              <span>Serial Number:</span>
                              <span className="text-white">{terminal.serialNumber}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[#AAA6B5]">
                            <span>Módulo Vinculado:</span>
                            <span className="text-white font-bold uppercase">
                              {terminal.modulo === 'adega' ? 'Adega' : terminal.modulo === 'tabacaria' ? 'Tabacaria' : 'Adega & Tabacaria'}
                            </span>
                          </div>

                          {terminal.bateriaNivel !== undefined && (
                            <div className="flex items-center justify-between text-[#AAA6B5]">
                              <span className="flex items-center gap-1">
                                <Battery className="w-3.5 h-3.5 text-emerald-400" />
                                Bateria do Terminal:
                              </span>
                              <strong className="text-emerald-400">{terminal.bateriaNivel}%</strong>
                            </div>
                          )}
                        </div>

                        {/* Estimated Rates */}
                        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                          <div className="p-1.5 rounded-lg bg-[#121024] border border-[#262042]">
                            <span className="text-[#AAA6B5] block">Débito</span>
                            <strong className="text-emerald-400 font-mono text-xs">{terminal.taxaDebitoPercentual || 1.99}%</strong>
                          </div>
                          <div className="p-1.5 rounded-lg bg-[#121024] border border-[#262042]">
                            <span className="text-[#AAA6B5] block">Crédito</span>
                            <strong className="text-purple-400 font-mono text-xs">{terminal.taxaCreditoPercentual || 3.98}%</strong>
                          </div>
                          <div className="p-1.5 rounded-lg bg-[#121024] border border-[#262042]">
                            <span className="text-[#AAA6B5] block">PIX POS</span>
                            <strong className="text-cyan-400 font-mono text-xs">{terminal.taxaPixPercentual || 0.99}%</strong>
                          </div>
                        </div>

                        {/* Last connection test result */}
                        {terminal.ultimoResultadoTeste && (
                          <div className="text-[11px] text-[#AAA6B5] border-t border-[#262042] pt-2">
                            <span className="block text-[10px] text-[#716A86] mb-0.5">Último Teste de Conexão:</span>
                            <p className="line-clamp-2 leading-relaxed text-white">
                              {terminal.ultimoResultadoTeste.mensagem}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-[#262042] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={testingTerminalId === terminal.id}
                            onClick={() => handleTestTerminal(terminal)}
                            className="px-2.5 py-1.5 bg-[#1A1633] hover:bg-[#262042] border border-[#2E2854] text-cyan-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                            title="Testar ping e comunicação com o terminal"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${testingTerminalId === terminal.id ? 'animate-spin' : ''}`} />
                            <span>{testingTerminalId === terminal.id ? 'Testando...' : 'Testar Conexão'}</span>
                          </button>

                          {!terminal.padrao && (
                            <button
                              type="button"
                              onClick={() => handleToggleDefault(terminal)}
                              className="px-2 py-1.5 bg-[#121024] hover:bg-[#1A1633] text-[#AAA6B5] hover:text-purple-300 rounded-xl text-xs transition"
                              title="Definir como maquininha padrão no PDV"
                            >
                              Tornar Padrão
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditTerminal(terminal)}
                            className="p-1.5 text-[#AAA6B5] hover:text-white hover:bg-[#1A1633] rounded-lg transition"
                            title="Editar configurações"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTerminal(terminal.id)}
                            className="p-1.5 text-[#AAA6B5] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Remover terminal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Practical Guidelines Banner */}
          <div className="bg-[#121024] border border-[#262042] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-[#AAA6B5]">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <strong className="text-white block">Como funciona a autorização e o disparo no PDV:</strong>
                Ao fechar uma venda a cartão no PDV, o MoviLog envia a cobrança diretamente para a tela da maquininha cadastrada via nuvem. O cliente insere/aproxima o cartão, digita a senha e a confirmação com NSU e código de autorização retorna ao MoviLog automaticamente, baixando o estoque e registrando a conciliação.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CADASTRAR OU EDITAR TERMINAL                       */}
      {/* ========================================================= */}
      {activeTab === 'novo' && (
        <div className="max-w-4xl mx-auto bg-[#0A0714] border border-[#262042] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#262042]">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-400" />
                {editingTerminalId ? 'Editar Terminal de Pagamento' : 'Cadastrar Nova Maquininha'}
              </h2>
              <p className="text-xs text-[#AAA6B5]">
                Configure as credenciais seguras da sua adquirente para vincular o equipamento ao PDV da loja.
              </p>
            </div>
            {editingTerminalId && (
              <button
                onClick={() => {
                  setEditingTerminalId(null);
                  setActiveTab('terminais');
                }}
                className="px-3 py-1.5 bg-[#1A1633] text-white text-xs rounded-xl"
              >
                Cancelar Edição
              </button>
            )}
          </div>

          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmitTerminal} className="space-y-6">
            {/* 1. Seleção do Provedor */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                1. Selecione a Adquirente ou Provedor de Pagamento:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    id: 'mercadopago_point',
                    name: 'Mercado Pago Point',
                    subtitle: 'Point Smart / Pro 2 / Air',
                    type: 'Cloud API Oficial',
                    color: 'border-sky-500/40 bg-sky-950/20'
                  },
                  {
                    id: 'stone_connect',
                    name: 'Stone Connect 2.0',
                    subtitle: 'Smart POS P2 / Pagar.me',
                    type: 'Partner Cloud POS',
                    color: 'border-emerald-500/40 bg-emerald-950/20'
                  },
                  {
                    id: 'smartpos_tef',
                    name: 'SmartPOS / TEF Web',
                    subtitle: 'Cielo LIO, PagBank, Rede',
                    type: 'Multi-Adquirente',
                    color: 'border-purple-500/40 bg-purple-950/20'
                  },
                  {
                    id: 'pos_manual',
                    name: 'POS Autônomo',
                    subtitle: 'SumUp, Minizinha, Outros',
                    type: 'Manual com NSU',
                    color: 'border-amber-500/40 bg-amber-950/20'
                  }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setFormProvedor(p.id as TerminalProvider);
                      if (p.id === 'mercadopago_point') {
                        setFormModelo('Point Smart (A910 / P2)');
                        setFormModoOperacao('cloud_api');
                      } else if (p.id === 'stone_connect') {
                        setFormModelo('Stone Smart POS (P2)');
                        setFormModoOperacao('cloud_api');
                      } else if (p.id === 'smartpos_tef') {
                        setFormModelo('Cielo LIO V2 / V3');
                        setFormModoOperacao('tef_integrado');
                      } else {
                        setFormModelo('POS Autônomo Standalone');
                        setFormModoOperacao('manual_operador');
                        setFormIdentificador('MANUAL_POS');
                      }
                    }}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      formProvedor === p.id
                        ? `${p.color} ring-2 ring-purple-500`
                        : 'border-[#262042] bg-[#121024] hover:bg-[#1A1633]'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#AAA6B5] block">{p.type}</span>
                      <strong className="text-sm font-bold text-white block mt-0.5">{p.name}</strong>
                      <span className="text-xs text-[#AAA6B5] mt-1 block">{p.subtitle}</span>
                    </div>
                    {formProvedor === p.id && (
                      <div className="mt-2 text-right">
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center justify-end gap-1">
                          <Check className="w-3.5 h-3.5" /> Selecionado
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Identificação do Terminal e Equipamento */}
            <div className="p-4 rounded-xl bg-[#121024] border border-[#262042] space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-400" />
                2. Identificação e Vinculação da Loja
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-[#AAA6B5] mb-1 block">Nome de Identificação no PDV: *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maquininha Balcão Principal Adega"
                    value={formNome}
                    onChange={e => setFormNome(e.target.value)}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#AAA6B5] mb-1 block">Módulo Comercial Vinculado: *</label>
                  <select
                    value={formModulo}
                    onChange={e => setFormModulo(e.target.value as any)}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="adega">Adega & Bebidas</option>
                    <option value="tabacaria">Tabacaria & Headshop</option>
                    <option value="ambos">Ambos os Módulos (Geral)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[#AAA6B5] mb-1 block">Modelo do Equipamento:</label>
                  <input
                    type="text"
                    value={formModelo}
                    onChange={e => setFormModelo(e.target.value)}
                    placeholder="Ex: Point Smart, Stone P2, Cielo LIO"
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#AAA6B5] mb-1 block">
                    {formProvedor === 'mercadopago_point'
                      ? 'Device ID (Point): *'
                      : formProvedor === 'stone_connect'
                      ? 'Stone Serial / Terminal ID: *'
                      : formProvedor === 'smartpos_tef'
                      ? 'Código Lógico TEF (TID): *'
                      : 'Identificador Interno:'}
                  </label>
                  <input
                    type="text"
                    required={formProvedor !== 'pos_manual'}
                    placeholder={
                      formProvedor === 'mercadopago_point'
                        ? 'Ex: PA910-8837192 (exibido na tela da Point)'
                        : formProvedor === 'stone_connect'
                        ? 'Ex: STP2-4410294'
                        : formProvedor === 'smartpos_tef'
                        ? 'Ex: TEF01'
                        : 'MANUAL_POS'
                    }
                    value={formIdentificador}
                    onChange={e => setFormIdentificador(e.target.value)}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#AAA6B5] mb-1 block">Número de Série Físico (opcional):</label>
                  <input
                    type="text"
                    placeholder="Ex: SN9841029831"
                    value={formSerial}
                    onChange={e => setFormSerial(e.target.value)}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPadrao}
                    onChange={e => setFormPadrao(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-0 bg-[#0A0714] border-[#262042]"
                  />
                  <span>Definir como maquininha padrão deste módulo</span>
                </label>
              </div>
            </div>

            {/* 3. Credenciais Oficiais e Autenticação Segura */}
            {formProvedor !== 'pos_manual' && (
              <div className="p-4 rounded-xl bg-[#121024] border border-[#262042] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    3. Credenciais Oficiais da Adquirente (Armazenamento Seguro Backend)
                  </h3>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Criptografia & Isolamento por Empresa
                  </span>
                </div>

                {formProvedor === 'mercadopago_point' && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#AAA6B5] leading-relaxed">
                      Para autorizar a Point, informe o <strong>Access Token</strong> da conta Mercado Pago da sua empresa. Obtenha no portal <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Mercado Pago Developers</a> em "Suas Aplicações".
                    </p>
                    <div>
                      <label className="text-xs text-[#AAA6B5] mb-1 block">Access Token (Produção ou Testes): *</label>
                      <input
                        type="password"
                        placeholder={editingTerminalId ? '•••••••••••••••••••••••• (deixe em branco para manter o token atual)' : 'Ex: APP_USR-849201948201... ou TEST_DEMO_...'}
                        value={formMpAccessToken}
                        onChange={e => setFormMpAccessToken(e.target.value)}
                        className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}

                {(formProvedor === 'stone_connect' || formProvedor === 'pagar_me') && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#AAA6B5] leading-relaxed">
                      A integração com terminais Stone exige credenciamento oficial no Stone Partner Portal.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[#AAA6B5] mb-1 block">Stone Partner Key: *</label>
                        <input
                          type="password"
                          placeholder={editingTerminalId ? '•••••••••••••••• (mantém atual se vazio)' : 'Chave de Partner da Stone'}
                          value={formStonePartnerKey}
                          onChange={e => setFormStonePartnerKey(e.target.value)}
                          className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#AAA6B5] mb-1 block">Stone Secret Key: *</label>
                        <input
                          type="password"
                          placeholder={editingTerminalId ? '•••••••••••••••• (mantém atual se vazio)' : 'Chave Secreta'}
                          value={formStoneSecretKey}
                          onChange={e => setFormStoneSecretKey(e.target.value)}
                          className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#AAA6B5] mb-1 block">Stone Merchant ID (Afiliação):</label>
                        <input
                          type="text"
                          placeholder="Ex: STONE_MERCH_01928"
                          value={formStoneMerchantId}
                          onChange={e => setFormStoneMerchantId(e.target.value)}
                          className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formProvedor === 'smartpos_tef' && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#AAA6B5] leading-relaxed">
                      Conexão com servidor SiTef, Scope ou SmartPOS Bridge via protocolo REST local/remoto.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-[#AAA6B5] mb-1 block">Host / IP do Servidor TEF:</label>
                        <input
                          type="text"
                          placeholder="127.0.0.1 ou tef.minhaempresa.com"
                          value={formTefHost}
                          onChange={e => setFormTefHost(e.target.value)}
                          className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#AAA6B5] mb-1 block">Porta TEF:</label>
                        <input
                          type="text"
                          placeholder="60906"
                          value={formTefPort}
                          onChange={e => setFormTefPort(e.target.value)}
                          className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#AAA6B5] mb-1 block">Chave de API TEF (opcional):</label>
                        <input
                          type="password"
                          placeholder="Token do Integrador"
                          value={formTefApiKey}
                          onChange={e => setFormTefApiKey(e.target.value)}
                          className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Taxas de Adquirência para Conciliação */}
            <div className="p-4 rounded-xl bg-[#121024] border border-[#262042] space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                4. Taxas Contratadas da Maquininha (Para Conciliação e Lucro Líquido Real)
              </h3>
              <p className="text-xs text-[#AAA6B5]">
                O MoviLog deduz automaticamente essas taxas no fechamento das vendas a cartão para demonstrar o faturamento líquido e o lucro real em relatórios.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[#AAA6B5] mb-1 block">Taxa Débito (%):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formTaxaDebito}
                    onChange={e => setFormTaxaDebito(e.target.value)}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#AAA6B5] mb-1 block">Taxa Crédito à Vista (%):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formTaxaCredito}
                    onChange={e => setFormTaxaCredito(e.target.value)}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs font-mono text-purple-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#AAA6B5] mb-1 block">Taxa PIX na Maquininha (%):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formTaxaPix}
                    onChange={e => setFormTaxaPix(e.target.value)}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('terminais')}
                className="px-4 py-2.5 bg-[#121024] hover:bg-[#1A1633] border border-[#262042] text-[#AAA6B5] hover:text-white text-xs font-semibold rounded-xl transition"
              >
                Voltar à Lista
              </button>

              <button
                type="submit"
                disabled={submittingTerminal}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-purple-950/40"
              >
                {submittingTerminal && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingTerminalId ? 'Salvar Alterações' : 'Salvar e Ativar Terminal'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: HISTÓRICO DE TRANSAÇÕES POS                         */}
      {/* ========================================================= */}
      {activeTab === 'transacoes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A0714] border border-[#262042] p-4 rounded-xl text-xs">
            <div className="flex items-center gap-3">
              <span className="text-[#AAA6B5]">Status da Transação:</span>
              <select
                value={filterTxStatus}
                onChange={e => setFilterTxStatus(e.target.value)}
                className="bg-[#121024] border border-[#262042] rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="todos">Todos os Status</option>
                <option value="aprovado">Aprovado</option>
                <option value="recusado">Recusado</option>
                <option value="cancelado">Cancelado</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>

            <button
              onClick={loadTransactions}
              disabled={loadingTransactions}
              className="px-3 py-1.5 bg-[#1A1633] text-white rounded-xl flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTransactions ? 'animate-spin' : ''}`} />
              <span>Recarregar</span>
            </button>
          </div>

          <div className="bg-[#0A0714] border border-[#262042] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121024] text-[#AAA6B5] border-b border-[#262042] uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="p-3.5">Data / Hora</th>
                    <th className="p-3.5">Terminal / Provedor</th>
                    <th className="p-3.5">Módulo</th>
                    <th className="p-3.5">Operação / Bandeira</th>
                    <th className="p-3.5 text-right">Valor Bruto</th>
                    <th className="p-3.5 text-right">Taxa Est.</th>
                    <th className="p-3.5 text-right">Valor Líquido</th>
                    <th className="p-3.5">NSU / Autorização</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Venda Vinculada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1633]">
                  {loadingTransactions ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-[#AAA6B5]">
                        <RefreshCw className="w-5 h-5 animate-spin text-purple-400 mx-auto mb-2" />
                        Carregando histórico de transações...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-[#AAA6B5]">
                        Nenhuma transação de maquininha encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-[#121024]/60 transition">
                        <td className="p-3.5 font-mono text-[11px] text-[#AAA6B5] whitespace-nowrap">
                          {new Date(tx.criadoEm).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3.5">
                          <strong className="text-white block">{tx.terminalNome}</strong>
                          <span className="text-[10px] text-[#AAA6B5] font-mono">{tx.provedor}</span>
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            tx.modulo === 'adega' ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'
                          }`}>
                            {tx.modulo}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <strong className="text-white uppercase block">{tx.tipoOperacao}</strong>
                          <span className="text-[10px] text-[#AAA6B5]">
                            {tx.bandeira || 'Cartão'} {tx.ultimosDigitosCartao ? `(${tx.ultimosDigitosCartao})` : ''}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-white whitespace-nowrap">
                          R$ {tx.valorBruto.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right font-mono text-rose-400 whitespace-nowrap">
                          - R$ {tx.valorTaxaEstimada.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                          R$ {tx.valorLiquido.toFixed(2)}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] whitespace-nowrap">
                          <span className="text-cyan-300 block">NSU: {tx.nsu || 'N/D'}</span>
                          <span className="text-[#AAA6B5] text-[10px]">Aut: {tx.codigoAutorizacao || 'N/D'}</span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            tx.status === 'aprovado'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : tx.status === 'recusado'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : tx.status === 'cancelado'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] whitespace-nowrap">
                          {tx.codigoVenda ? (
                            <span className="text-purple-300 font-bold">{tx.codigoVenda}</span>
                          ) : (
                            <span className="text-amber-400/80 text-[10px]">Cobrança avulsa</span>
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

      {/* ========================================================= */}
      {/* TAB 4: RELATÓRIO DE CONCILIAÇÃO FINANCEIRA                */}
      {/* ========================================================= */}
      {activeTab === 'conciliacao' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A0714] border border-[#262042] p-4 rounded-xl text-xs">
            <div className="flex items-center gap-3">
              <span className="text-[#AAA6B5]">Módulo de Conciliação:</span>
              <select
                value={filterRecModulo}
                onChange={e => setFilterRecModulo(e.target.value)}
                className="bg-[#121024] border border-[#262042] rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="todos">Adega e Tabacaria (Consolidado)</option>
                <option value="adega">Somente Adega & Bebidas</option>
                <option value="tabacaria">Somente Tabacaria & Headshop</option>
              </select>
            </div>

            <button
              onClick={loadReconciliation}
              disabled={loadingReconciliation}
              className="px-3 py-1.5 bg-[#1A1633] text-white rounded-xl flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingReconciliation ? 'animate-spin' : ''}`} />
              <span>Auditar Conciliação Agora</span>
            </button>
          </div>

          {loadingReconciliation ? (
            <div className="py-16 text-center text-xs text-[#AAA6B5]">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
              Cruzando vendas registradas no PDV com transações capturadas nas maquininhas...
            </div>
          ) : reconciliation ? (
            <>
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#0A0714] border border-[#262042] space-y-1">
                  <span className="text-[11px] text-[#AAA6B5] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                    Vendas Cartão MoviLog:
                  </span>
                  <div className="text-xl font-black text-white font-mono">
                    R$ {reconciliation.resumo.valorTotalVendasMoviLog.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-[#AAA6B5]">
                    {reconciliation.resumo.totalVendasMoviLogCartao} vendas registradas no PDV
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0A0714] border border-[#262042] space-y-1">
                  <span className="text-[11px] text-[#AAA6B5] flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Bruto Aprovado Maquininha:
                  </span>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    R$ {reconciliation.resumo.valorTotalBrutoMaquininha.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-emerald-300/80">
                    {reconciliation.resumo.transacoesAprovadasQtd} transações capturadas no POS
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0A0714] border border-[#262042] space-y-1">
                  <span className="text-[11px] text-[#AAA6B5] flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    Taxas de Adquirência:
                  </span>
                  <div className="text-xl font-black text-rose-400 font-mono">
                    - R$ {reconciliation.resumo.valorTotalTaxasMaquininha.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-[#AAA6B5]">
                    Desconto médio contratado por terminal
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0A0714] border border-[#262042] space-y-1">
                  <span className="text-[11px] text-[#AAA6B5] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                    Recebimento Líquido Estimado:
                  </span>
                  <div className="text-xl font-black text-cyan-300 font-mono">
                    R$ {reconciliation.resumo.valorTotalLiquidoMaquininha.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-cyan-400/80">
                    Disponível para depósito em conta
                  </span>
                </div>
              </div>

              {/* Status Warning Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  reconciliation.resumo.divergenciasValorQtd > 0
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                    : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                }`}>
                  <div>
                    <span className="text-[10px] uppercase font-bold block">Divergências de Valor:</span>
                    <strong className="text-sm font-mono">{reconciliation.resumo.divergenciasValorQtd} ocorrências</strong>
                  </div>
                  {reconciliation.resumo.divergenciasValorQtd === 0 ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  )}
                </div>

                <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  reconciliation.resumo.vendasSemTransacaoQtd > 0
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                }`}>
                  <div>
                    <span className="text-[10px] uppercase font-bold block">Vendas sem Comprovante POS:</span>
                    <strong className="text-sm font-mono">{reconciliation.resumo.vendasSemTransacaoQtd} vendas</strong>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>

                <div className="p-3.5 rounded-xl border bg-[#121024] border-[#262042] text-[#AAA6B5] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold block text-white">Transações Órfãs (POS avulso):</span>
                    <strong className="text-sm font-mono text-cyan-300">{reconciliation.resumo.transacoesOrfasQtd} transações</strong>
                  </div>
                  <Info className="w-5 h-5 text-cyan-400" />
                </div>
              </div>

              {/* Reconciliation Ledger Table */}
              <div className="bg-[#0A0714] border border-[#262042] rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 bg-[#121024] border-b border-[#262042] flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Trilha de Auditoria da Conciliação (Venda x Comprovante da Maquininha)
                  </h3>
                  <span className="text-[10px] font-mono text-[#AAA6B5]">
                    {reconciliation.itens.length} registros auditados
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0A0714] text-[#AAA6B5] border-b border-[#262042] uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                        <th className="p-3.5">Status Conciliação</th>
                        <th className="p-3.5">Venda MoviLog</th>
                        <th className="p-3.5">Valor Venda</th>
                        <th className="p-3.5">Terminal / NSU</th>
                        <th className="p-3.5">Valor POS</th>
                        <th className="p-3.5 text-right">Taxa Adquirente</th>
                        <th className="p-3.5 text-right">Líquido</th>
                        <th className="p-3.5">Auditoria / Observação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1633]">
                      {reconciliation.itens.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-[#AAA6B5]">
                            Nenhuma venda ou transação a cartão para conciliar no período.
                          </td>
                        </tr>
                      ) : (
                        reconciliation.itens.map(item => (
                          <tr key={item.id} className="hover:bg-[#121024]/50 transition">
                            <td className="p-3.5 whitespace-nowrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                item.statusConciliacao === 'conciliado'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : item.statusConciliacao === 'divergencia_valor'
                                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                  : item.statusConciliacao === 'venda_sem_transacao'
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                  : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                              }`}>
                                {item.statusConciliacao.replace(/_/g, ' ')}
                              </span>
                            </td>

                            <td className="p-3.5 font-mono text-[11px] whitespace-nowrap">
                              {item.venda ? (
                                <div>
                                  <strong className="text-white block">{item.venda.codigoVenda}</strong>
                                  <span className="text-[10px] text-[#AAA6B5]">{item.venda.operadorNome}</span>
                                </div>
                              ) : (
                                <span className="text-amber-400/80 text-[10px]">Sem venda registrada</span>
                              )}
                            </td>

                            <td className="p-3.5 font-mono font-bold text-white whitespace-nowrap">
                              {item.venda ? `R$ ${item.venda.valorTotal.toFixed(2)}` : '—'}
                            </td>

                            <td className="p-3.5 whitespace-nowrap font-mono text-[11px]">
                              {item.transacao ? (
                                <div>
                                  <strong className="text-cyan-300 block">{item.transacao.terminalNome}</strong>
                                  <span className="text-[#AAA6B5] text-[10px]">NSU: {item.transacao.nsu || 'N/I'} ({item.transacao.bandeira || 'POS'})</span>
                                </div>
                              ) : (
                                <span className="text-rose-400/80 text-[10px]">Pendente de comprovante</span>
                              )}
                            </td>

                            <td className="p-3.5 font-mono font-bold text-white whitespace-nowrap">
                              {item.transacao ? `R$ ${item.transacao.valorBruto.toFixed(2)}` : '—'}
                            </td>

                            <td className="p-3.5 text-right font-mono text-rose-400 whitespace-nowrap">
                              {item.transacao ? `- R$ ${item.transacao.valorTaxaEstimada.toFixed(2)}` : '—'}
                            </td>

                            <td className="p-3.5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                              {item.transacao ? `R$ ${item.transacao.valorLiquido.toFixed(2)}` : '—'}
                            </td>

                            <td className="p-3.5 text-xs text-[#AAA6B5] max-w-xs">
                              {item.observacaoAuditoria}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Test Connection Live Result Modal */}
      {testResultModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0714] border border-[#262042] w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#262042]">
              <div className="flex items-center gap-2">
                {testResultModal.sucesso ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                )}
                <h3 className="text-sm font-bold text-white">
                  Resultado do Teste de Conexão
                </h3>
              </div>
              <button
                onClick={() => setTestResultModal(prev => ({ ...prev, open: false }))}
                className="text-[#AAA6B5] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#121024] border border-[#262042] space-y-1">
                <span className="text-[10px] text-[#AAA6B5] uppercase font-bold block">Terminal Testado:</span>
                <strong className="text-sm text-white block">{testResultModal.terminalNome}</strong>
                <p className={`text-xs mt-1 ${testResultModal.sucesso ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {testResultModal.mensagem}
                </p>
              </div>

              {testResultModal.bateria !== undefined && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121024] border border-[#262042] text-xs">
                  <span className="text-[#AAA6B5] flex items-center gap-1.5">
                    <Battery className="w-4 h-4 text-emerald-400" />
                    Nível de Bateria do Terminal:
                  </span>
                  <strong className="text-emerald-400 font-mono text-sm">{testResultModal.bateria}%</strong>
                </div>
              )}

              {testResultModal.detalhes && (
                <div className="p-2.5 rounded-xl bg-[#0A0714] border border-[#262042] text-[11px] font-mono text-[#AAA6B5] max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(testResultModal.detalhes, null, 2)}</pre>
                </div>
              )}
            </div>

            <button
              onClick={() => setTestResultModal(prev => ({ ...prev, open: false }))}
              className="w-full py-2 bg-[#1A1633] hover:bg-[#262042] text-white text-xs font-bold rounded-xl transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
