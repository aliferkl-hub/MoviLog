import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CondoPackage, CondoUnit } from '../../types';
import { api } from '../../lib/api';
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  KeyRound,
  ShieldCheck,
  UserCheck,
  X,
  AlertCircle,
  Calendar,
  Building2,
  Truck,
  FileText,
  User,
  Copy,
  Check,
  Loader2,
  Barcode,
  Edit,
  RotateCcw
} from 'lucide-react';

interface PackagesViewProps {
  autoOpenReceive?: boolean;
}

export const PackagesView: React.FC<PackagesViewProps> = ({ autoOpenReceive = false }) => {
  const { user, company, isMaster } = useAuth();
  const [packages, setPackages] = useState<CondoPackage[]>([]);
  const [units, setUnits] = useState<CondoUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // Receive Modal
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);
  const [receiveError, setReceiveError] = useState<string | null>(null);
  const [receiveSuccessData, setReceiveSuccessData] = useState<{
    id: string;
    codigoPacote: string;
    pin: string;
    destinatarioNome: string;
    unidadeIdentificacao: string;
    transportadora: string;
    descricaoConteudo: string;
    codigoRastreio?: string;
  } | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  // Pickup Modal
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [selectedPkgForPickup, setSelectedPkgForPickup] = useState<CondoPackage | null>(null);
  const [pickupForm, setPickupForm] = useState({
    pin: '',
    retiradoPor: '',
    documentoRetirada: ''
  });
  const [pickupError, setPickupError] = useState<string | null>(null);

  // Status Edit Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPkgForStatus, setSelectedPkgForStatus] = useState<CondoPackage | null>(null);
  const [newStatus, setNewStatus] = useState<string>('aguardando_retirada');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [statusReceiver, setStatusReceiver] = useState<string>('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [dateFilter, setDateFilter] = useState<'todos' | 'hoje' | 'semana' | 'mes'>('todos');
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Receive Form
  const [receiveForm, setReceiveForm] = useState({
    unitId: '',
    unidadeIdentificacao: '',
    destinatarioNome: '',
    transportadora: 'Correios / Mercado Livre',
    nomeEntregador: '',
    descricaoConteudo: 'Caixa / Pacote',
    codigoRastreio: '',
    recebidoEm: new Date().toISOString().slice(0, 16),
    observacoes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [pkgRes, unitRes] = await Promise.all([
        api.getCondoPackages(isMaster ? undefined : company?.id),
        api.getCondoUnits(isMaster ? undefined : company?.id)
      ]);
      setPackages(pkgRes.packages || []);
      setUnits(unitRes.units || []);
    } catch (err) {
      console.error('Erro ao carregar encomendas e unidades:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (autoOpenReceive) {
      openReceiveModal();
    }
  }, [company?.id, autoOpenReceive]);

  const openReceiveModal = () => {
    setReceiveError(null);
    setReceiveForm({
      unitId: '',
      unidadeIdentificacao: '',
      destinatarioNome: '',
      transportadora: 'Correios / Mercado Livre',
      nomeEntregador: '',
      descricaoConteudo: 'Caixa / Pacote',
      codigoRastreio: '',
      recebidoEm: new Date().toISOString().slice(0, 16),
      observacoes: ''
    });
    setShowReceiveModal(true);
  };

  const handleUnitSelect = (unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    if (unit) {
      setReceiveForm(prev => ({
        ...prev,
        unitId: unit.id,
        unidadeIdentificacao: `${unit.bloco} - ${unit.numeroUnidade}`,
        destinatarioNome: unit.responsavelPrincipal
      }));
    }
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReceiveError(null);

    if (!receiveForm.unidadeIdentificacao.trim()) {
      setReceiveError('Informe o Bloco / Apartamento, Unidade ou Sala.');
      return;
    }
    if (!receiveForm.destinatarioNome.trim()) {
      setReceiveError('Informe o nome do morador ou destinatário.');
      return;
    }
    if (!receiveForm.transportadora.trim()) {
      setReceiveError('Informe a transportadora ou entregador.');
      return;
    }
    if (!receiveForm.descricaoConteudo.trim()) {
      setReceiveError('Informe a descrição ou conteúdo da mercadoria.');
      return;
    }

    setReceiveSubmitting(true);
    try {
      const res = await api.receivePackage(receiveForm);
      setShowReceiveModal(false);
      setReceiveSuccessData({
        id: res.pkg.id,
        codigoPacote: res.pkg.codigoPacote,
        pin: res.pkg.codigoRetiradaPin,
        destinatarioNome: res.pkg.destinatarioNome,
        unidadeIdentificacao: res.pkg.unidadeIdentificacao,
        transportadora: res.pkg.transportadora,
        descricaoConteudo: res.pkg.descricaoConteudo,
        codigoRastreio: res.pkg.codigoRastreio
      });
      setReceiveForm({
        unitId: '',
        unidadeIdentificacao: '',
        destinatarioNome: '',
        transportadora: 'Correios / Mercado Livre',
        nomeEntregador: '',
        descricaoConteudo: 'Caixa / Pacote',
        codigoRastreio: '',
        recebidoEm: new Date().toISOString().slice(0, 16),
        observacoes: ''
      });
      await loadData();
    } catch (err: any) {
      console.error('Falha ao registrar pacote:', err);
      setReceiveError(err.message || 'Erro ao registrar pacote na portaria. Verifique os campos.');
    } finally {
      setReceiveSubmitting(false);
    }
  };

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2500);
  };

  const handleNotifyResident = async (pkg: CondoPackage) => {
    try {
      const res = await api.notifyPackageRecipient(pkg.id);
      window.open(res.whatsappUrl, '_blank', 'noopener,noreferrer');
      setNotificationToast(`Link de mensagem para o morador de ${pkg.unidadeIdentificacao} aberto no WhatsApp.`);
      setTimeout(() => setNotificationToast(null), 4000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao preparar notificação para o morador');
    }
  };

  const handlePickupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkgForPickup) return;
    setPickupError(null);

    try {
      await api.pickupPackage(selectedPkgForPickup.id, pickupForm);
      setShowPickupModal(false);
      setSelectedPkgForPickup(null);
      setPickupForm({ pin: '', retiradoPor: '', documentoRetirada: '' });
      await loadData();
    } catch (err: any) {
      setPickupError(err.message || 'Código PIN incorreto ou erro na baixa');
    }
  };

  const handleOpenStatusModal = (pkg: CondoPackage) => {
    setSelectedPkgForStatus(pkg);
    setNewStatus(pkg.status);
    setStatusNotes(pkg.observacoes || '');
    setStatusReceiver(pkg.retiradoPor || pkg.destinatarioNome);
    setShowStatusModal(true);
  };

  const handleSaveStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkgForStatus) return;
    setStatusSubmitting(true);
    try {
      await api.updateCondoPackage(selectedPkgForStatus.id, {
        status: newStatus,
        observacoes: statusNotes,
        retiradoPor: statusReceiver,
        documentoRetirada: newStatus === 'retirado' ? 'Entrega presencial confirmada pela portaria' : undefined
      });
      setShowStatusModal(false);
      setSelectedPkgForStatus(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status da encomenda');
    } finally {
      setStatusSubmitting(false);
    }
  };

  // Real Metric Counters from actual records
  const totalPackagesCount = packages.length;
  const waitingPickupCount = packages.filter(p => p.status === 'aguardando_retirada' || p.status === 'notificado').length;
  const pickedUpCount = packages.filter(p => p.status === 'retirado').length;
  const notifiedCount = packages.filter(p => p.notificadoEm).length;

  // Filtered packages
  const filtered = packages.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.codigoPacote.toLowerCase().includes(term) ||
      p.codigoRetiradaPin.includes(term) ||
      p.destinatarioNome.toLowerCase().includes(term) ||
      p.unidadeIdentificacao.toLowerCase().includes(term) ||
      p.transportadora.toLowerCase().includes(term) ||
      p.descricaoConteudo.toLowerCase().includes(term) ||
      (p.codigoRastreio && p.codigoRastreio.toLowerCase().includes(term)) ||
      (p.nomeEntregador && p.nomeEntregador.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    // Status Filter
    if (statusFilter === 'aguardando' && p.status !== 'aguardando_retirada' && p.status !== 'notificado') return false;
    if (statusFilter === 'retirados' && p.status !== 'retirado') return false;
    if (statusFilter === 'ocorrencia' && p.status !== 'em_ocorrencia' && p.status !== 'devolvido') return false;

    // Date Filter
    if (dateFilter !== 'todos') {
      const pkgDate = new Date(p.recebidoEm);
      const now = new Date();
      if (dateFilter === 'hoje') {
        if (pkgDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'semana') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (pkgDate < weekAgo) return false;
      } else if (dateFilter === 'mes') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (pkgDate < monthAgo) return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F5F3FA] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#8B5CF6]" />
            <span>Gestão de Encomendas e Pacotes na Portaria</span>
          </h2>
          <p className="text-xs text-[#AAA6B5]">
            Recebimento com PIN seguro, aviso via WhatsApp e conferência rigorosa de retiradas
          </p>
        </div>

        <button
          onClick={openReceiveModal}
          className="px-4 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/25 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Mercadoria / Encomenda</span>
        </button>
      </div>

      {/* KPI Cards based on REAL DATA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#25222D] border border-[#393442] rounded-2xl p-4">
          <div className="flex items-center justify-between text-[#AAA6B5] text-xs">
            <span>Total Recebidas</span>
            <Package className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="text-2xl font-black text-[#F5F3FA] mt-1">{totalPackagesCount}</div>
          <p className="text-[10px] text-[#AAA6B5] mt-0.5">Registros salvos no banco</p>
        </div>

        <div className="bg-[#25222D] border border-[#393442] rounded-2xl p-4">
          <div className="flex items-center justify-between text-[#AAA6B5] text-xs">
            <span>Aguardando Retirada</span>
            <Clock className="w-4 h-4 text-[#C4B5FD]" />
          </div>
          <div className="text-2xl font-black text-[#C4B5FD] mt-1">{waitingPickupCount}</div>
          <p className="text-[10px] text-[#AAA6B5] mt-0.5">Sob guarda da portaria</p>
        </div>

        <div className="bg-[#25222D] border border-[#393442] rounded-2xl p-4">
          <div className="flex items-center justify-between text-[#AAA6B5] text-xs">
            <span>Entregues ao Morador</span>
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-2xl font-black text-[#10B981] mt-1">{pickedUpCount}</div>
          <p className="text-[10px] text-[#A7F3D0] mt-0.5">Retiradas concluídas</p>
        </div>

        <div className="bg-[#25222D] border border-[#393442] rounded-2xl p-4">
          <div className="flex items-center justify-between text-[#AAA6B5] text-xs">
            <span>Avisos Notificados</span>
            <MessageSquare className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="text-2xl font-black text-[#8B5CF6] mt-1">{notifiedCount}</div>
          <p className="text-[10px] text-[#AAA6B5] mt-0.5">Links WhatsApp enviados</p>
        </div>
      </div>

      {notificationToast && (
        <div className="p-3 bg-[#10B981]/15 border border-[#10B981]/30 rounded-xl text-[#A7F3D0] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#10B981]" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por morador, apto/sala, código, rastreio, PIN..."
            className="w-full bg-[#1D1B24] border border-[#393442] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Status filters */}
          <div className="flex items-center gap-1 bg-[#1D1B24] p-1 rounded-xl border border-[#393442]">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'aguardando', label: 'Aguardando' },
              { id: 'retirados', label: 'Entregues' },
              { id: 'ocorrencia', label: 'Ocorrências' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === f.id
                    ? 'bg-[#8B5CF6] text-white shadow-xs'
                    : 'text-[#AAA6B5] hover:text-[#F5F3FA]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Date filter dropdown */}
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value as any)}
            className="bg-[#1D1B24] border border-[#393442] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="todos">Qualquer Data</option>
            <option value="hoje">Hoje</option>
            <option value="semana">Últimos 7 dias</option>
            <option value="mes">Este Mês</option>
          </select>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-[#25222D] border border-[#393442] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-[#1D1B24] text-[#AAA6B5] uppercase tracking-wider text-[10px] border-b border-[#393442]">
              <tr>
                <th className="p-3.5">Código / Rastreio / PIN</th>
                <th className="p-3.5">Unidade & Destinatário</th>
                <th className="p-3.5">Transportadora & Mercadoria</th>
                <th className="p-3.5">Recebimento na Portaria</th>
                <th className="p-3.5">Status & Retirada</th>
                <th className="p-3.5 text-right">Ações da Portaria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#393442]/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#AAA6B5] text-xs">
                    Nenhuma encomenda localizada com os critérios pesquisados.
                  </td>
                </tr>
              ) : (
                filtered.map(pkg => {
                  const isPending = pkg.status !== 'retirado';

                  return (
                    <tr key={pkg.id} className="hover:bg-[#1D1B24]/50 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-[#F5F3FA] flex items-center gap-1.5 font-mono">
                          <span>{pkg.codigoPacote}</span>
                        </div>
                        {pkg.codigoRastreio && (
                          <div className="text-[10px] text-[#C4B5FD] font-mono mt-0.5 flex items-center gap-1">
                            <Barcode className="w-3 h-3 text-[#8B5CF6]" />
                            <span>Rastreio: {pkg.codigoRastreio}</span>
                          </div>
                        )}
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#C4B5FD] rounded font-mono text-[10px] font-bold mt-1">
                          <KeyRound className="w-3 h-3 text-[#8B5CF6]" />
                          <span>PIN: {pkg.codigoRetiradaPin}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-[#F5F3FA] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
                          <span>{pkg.unidadeIdentificacao}</span>
                        </div>
                        <div className="text-[11px] text-[#AAA6B5] mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3 text-[#AAA6B5]" />
                          <span>{pkg.destinatarioNome}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-[#F5F3FA] font-medium flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-[#8B5CF6]" />
                          <span>{pkg.transportadora}</span>
                          {pkg.nomeEntregador && <span className="text-[10px] text-[#AAA6B5]">({pkg.nomeEntregador})</span>}
                        </div>
                        <div className="text-[11px] text-[#AAA6B5] mt-0.5">{pkg.descricaoConteudo}</div>
                        {pkg.observacoes && (
                          <div className="text-[10px] text-[#C4B5FD]/90 mt-0.5 italic">Obs: {pkg.observacoes}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-[#AAA6B5]">
                        <div className="text-[#F5F3FA] font-medium">
                          {new Date(pkg.recebidoEm).toLocaleString('pt-BR')}
                        </div>
                        <div className="text-[10px] text-[#AAA6B5]">
                          Responsável: <strong className="text-[#F5F3FA]">{pkg.recebidoPorPorteiro}</strong>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            pkg.status === 'retirado'
                              ? 'bg-[#10B981]/20 text-[#A7F3D0] border border-[#10B981]/40'
                              : pkg.status === 'notificado'
                              ? 'bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/40'
                              : pkg.status === 'em_ocorrencia' || pkg.status === 'devolvido'
                              ? 'bg-[#EF4444]/20 text-rose-300 border border-[#EF4444]/40'
                              : 'bg-[#8B5CF6]/15 text-[#F5F3FA] border border-[#8B5CF6]/30'
                          }`}
                        >
                          {pkg.status === 'retirado' ? 'Entregue' : pkg.status.replace('_', ' ')}
                        </span>
                        {pkg.retiradoEm && (
                          <div className="text-[10px] text-[#AAA6B5] mt-1 space-y-0.5">
                            <div>Data: {new Date(pkg.retiradoEm).toLocaleString('pt-BR')}</div>
                            <div>Retirado por: <span className="text-[#F5F3FA] font-medium">{pkg.retiradoPor}</span></div>
                            {pkg.entreguePorPorteiro && (
                              <div className="text-[9px] text-[#AAA6B5]">Entregue por: {pkg.entreguePorPorteiro}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => handleNotifyResident(pkg)}
                                title="Abrir WhatsApp para enviar aviso e PIN ao morador"
                                className="px-2.5 py-1 bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#A7F3D0] border border-[#10B981]/40 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-[#10B981]" />
                                <span>Avisar</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPkgForPickup(pkg);
                                  setPickupForm({ pin: '', retiradoPor: pkg.destinatarioNome, documentoRetirada: '' });
                                  setPickupError(null);
                                  setShowPickupModal(true);
                                }}
                                className="px-2.5 py-1 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1 shadow-sm"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Entregar (PIN)</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-[#10B981] font-semibold inline-flex items-center gap-1 mr-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                            </span>
                          )}

                          <button
                            onClick={() => handleOpenStatusModal(pkg)}
                            title="Atualizar status ou observação"
                            className="p-1 rounded-lg text-[#AAA6B5] hover:text-[#F5F3FA] hover:bg-[#1D1B24] border border-[#393442] transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
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
          <div className="p-6 text-center text-[#AAA6B5] text-xs bg-[#25222D] border border-[#393442] rounded-2xl">
            Nenhuma encomenda encontrada com os filtros atuais.
          </div>
        ) : (
          filtered.map(pkg => {
            const isPending = pkg.status !== 'retirado';

            return (
              <div key={pkg.id} className="bg-[#25222D] border border-[#393442] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#393442]/80 pb-2.5">
                  <div>
                    <span className="font-extrabold text-[#F5F3FA] text-sm font-mono">{pkg.codigoPacote}</span>
                    <div className="text-[11px] text-[#C4B5FD] font-semibold">{pkg.unidadeIdentificacao}</div>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#C4B5FD] rounded-md font-mono text-xs font-bold">
                    <KeyRound className="w-3 h-3 text-[#8B5CF6]" />
                    <span>PIN: {pkg.codigoRetiradaPin}</span>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <div className="text-[#AAA6B5]">
                    Morador: <strong className="text-[#F5F3FA]">{pkg.destinatarioNome}</strong>
                  </div>
                  <div className="text-[#AAA6B5]">
                    Transportadora: <span className="text-[#F5F3FA]">{pkg.transportadora}</span>
                  </div>
                  {pkg.codigoRastreio && (
                    <div className="text-[11px] text-[#C4B5FD] font-mono">
                      Rastreio: {pkg.codigoRastreio}
                    </div>
                  )}
                  <div className="text-[#AAA6B5]">
                    Conteúdo: <span className="text-[#F5F3FA]">{pkg.descricaoConteudo}</span>
                  </div>
                  {pkg.observacoes && (
                    <div className="text-[11px] text-[#C4B5FD]/90 italic">
                      Obs: {pkg.observacoes}
                    </div>
                  )}
                  <div className="text-[10px] text-[#AAA6B5] pt-1">
                    Recebido em: {new Date(pkg.recebidoEm).toLocaleString('pt-BR')} por <strong>{pkg.recebidoPorPorteiro}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#393442]/80 pt-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      pkg.status === 'retirado'
                        ? 'bg-[#10B981]/20 text-[#A7F3D0] border border-[#10B981]/40'
                        : pkg.status === 'notificado'
                        ? 'bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/40'
                        : 'bg-[#8B5CF6]/15 text-[#F5F3FA] border border-[#8B5CF6]/30'
                    }`}
                  >
                    {pkg.status === 'retirado' ? 'Entregue' : pkg.status.replace('_', ' ')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleNotifyResident(pkg)}
                          className="px-2.5 py-1.5 bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#A7F3D0] border border-[#10B981]/40 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#10B981]" />
                          <span>Avisar</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPkgForPickup(pkg);
                            setPickupForm({ pin: '', retiradoPor: pkg.destinatarioNome, documentoRetirada: '' });
                            setPickupError(null);
                            setShowPickupModal(true);
                          }}
                          className="px-3 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Entregar</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-[#10B981] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Entregue
                      </span>
                    )}

                    <button
                      onClick={() => handleOpenStatusModal(pkg)}
                      className="p-1.5 rounded-lg text-[#AAA6B5] hover:text-[#F5F3FA] bg-[#1D1B24] border border-[#393442]"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Receive Modal with complete fields */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#1D1B24] border border-[#393442] rounded-2xl p-6 shadow-2xl text-[#F5F3FA] my-8">
            <button
              onClick={() => setShowReceiveModal(false)}
              className="absolute top-4 right-4 text-[#AAA6B5] hover:text-[#F5F3FA] p-1 rounded-lg hover:bg-[#25222D] transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F5F3FA]">Receber Mercadoria / Encomenda na Portaria</h3>
                <p className="text-xs text-[#AAA6B5]">
                  Preencha os dados do pacote. Um PIN único e seguro de 4 dígitos será gerado e persistido no banco de dados.
                </p>
              </div>
            </div>

            {receiveError && (
              <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{receiveError}</span>
              </div>
            )}

            <form onSubmit={handleReceiveSubmit} className="space-y-3.5">
              {units.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1">
                    Selecionar Unidade Cadastrada (Preenchimento Rápido)
                  </label>
                  <select
                    onChange={e => handleUnitSelect(e.target.value)}
                    className="w-full bg-[#25222D] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="">-- Selecione uma unidade ou preencha manualmente --</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.bloco} - {u.numeroUnidade} ({u.responsavelPrincipal})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Apartamento, Unidade ou Sala *</label>
                  <input
                    type="text"
                    required
                    value={receiveForm.unidadeIdentificacao}
                    onChange={e => setReceiveForm({ ...receiveForm, unidadeIdentificacao: e.target.value })}
                    placeholder="Ex: Bloco B - Apto 302"
                    className="w-full bg-[#25222D] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Nome do Destinatário ou Morador *</label>
                  <input
                    type="text"
                    required
                    value={receiveForm.destinatarioNome}
                    onChange={e => setReceiveForm({ ...receiveForm, destinatarioNome: e.target.value })}
                    placeholder="Ex: Mariana Silveira"
                    className="w-full bg-[#25222D] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Transportadora ou Entregador *</label>
                  <input
                    type="text"
                    required
                    value={receiveForm.transportadora}
                    onChange={e => setReceiveForm({ ...receiveForm, transportadora: e.target.value })}
                    placeholder="Ex: Mercado Livre / Correios / Shopee / DHL"
                    className="w-full bg-[#25222D] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Nome do Entregador (se houver)</label>
                  <input
                    type="text"
                    value={receiveForm.nomeEntregador}
                    onChange={e => setReceiveForm({ ...receiveForm, nomeEntregador: e.target.value })}
                    placeholder="Ex: Marcos Vinícius"
                    className="w-full bg-[#25222D] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Descrição da Mercadoria *</label>
                  <input
                    type="text"
                    required
                    value={receiveForm.descricaoConteudo}
                    onChange={e => setReceiveForm({ ...receiveForm, descricaoConteudo: e.target.value })}
                    placeholder="Ex: Caixa média Mercado Livre / Envelope Sedex"
                    className="w-full bg-[#25222D] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Código de Rastreio (se houver)</label>
                  <input
                    type="text"
                    value={receiveForm.codigoRastreio}
                    onChange={e => setReceiveForm({ ...receiveForm, codigoRastreio: e.target.value })}
                    placeholder="Ex: BR123456789SP / LOG-8841"
                    className="w-full bg-[#25222D] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Data e Hora do Recebimento</label>
                  <input
                    type="datetime-local"
                    value={receiveForm.recebidoEm}
                    onChange={e => setReceiveForm({ ...receiveForm, recebidoEm: e.target.value })}
                    className="w-full bg-[#25222D] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Funcionário Responsável</label>
                  <input
                    type="text"
                    disabled
                    value={user?.name || 'Porteiro da Guarita'}
                    className="w-full bg-[#25222D]/60 border border-[#393442]/60 rounded-xl px-3 py-2 text-xs text-[#AAA6B5] cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Observações da Portaria</label>
                <textarea
                  rows={2}
                  value={receiveForm.observacoes}
                  onChange={e => setReceiveForm({ ...receiveForm, observacoes: e.target.value })}
                  placeholder="Ex: Deixado na prateleira B / Pacote frágil / Embalagem lacrada"
                  className="w-full bg-[#25222D] border border-[#393442] rounded-xl p-2.5 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="pt-3 border-t border-[#393442] flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={receiveSubmitting}
                  onClick={() => setShowReceiveModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#AAA6B5] hover:text-[#F5F3FA] disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={receiveSubmitting}
                  className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold rounded-xl text-xs transition shadow-lg shadow-[#7C3AED]/25 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {receiveSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando no Banco...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Salvar no Banco & Gerar PIN</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real Success Confirmation Modal with PIN and WhatsApp Notification */}
      {receiveSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#1D1B24] border border-[#10B981]/40 rounded-3xl p-6 shadow-2xl text-[#F5F3FA]">
            <button
              onClick={() => setReceiveSuccessData(null)}
              className="absolute top-4 right-4 text-[#AAA6B5] hover:text-[#F5F3FA] p-1 rounded-lg hover:bg-[#25222D] transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-[#10B981]/20 text-[#A7F3D0] border border-[#10B981]/30 rounded-full mb-1">
                Salvo no Banco de Dados Real
              </span>
              <h3 className="text-xl font-black text-[#F5F3FA]">
                Encomenda {receiveSuccessData.codigoPacote} Recebida!
              </h3>
              <p className="text-xs text-[#AAA6B5] mt-1">
                Destinatário: <strong className="text-[#F5F3FA]">{receiveSuccessData.destinatarioNome}</strong> ({receiveSuccessData.unidadeIdentificacao})
              </p>
            </div>

            {/* PIN Highlight Box */}
            <div className="bg-[#25222D] border border-[#8B5CF6]/40 rounded-2xl p-4 mb-5 text-center">
              <span className="text-xs font-semibold text-[#C4B5FD] uppercase tracking-wider block">
                Código PIN de Retirada Seguro
              </span>
              <div className="text-4xl font-mono font-black text-[#8B5CF6] tracking-widest my-2 select-all">
                {receiveSuccessData.pin}
              </div>
              <p className="text-[11px] text-[#AAA6B5] leading-tight">
                Forneça este PIN ao morador. A retirada só poderá ser concluída mediante validação deste código.
              </p>
              <button
                type="button"
                onClick={() => handleCopyPin(receiveSuccessData.pin)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 text-[#C4B5FD] border border-[#8B5CF6]/40 rounded-lg text-xs font-bold transition"
              >
                {copiedPin ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPin ? 'PIN Copiado!' : 'Copiar Código PIN'}</span>
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const pkg = packages.find(p => p.id === receiveSuccessData.id) || {
                    id: receiveSuccessData.id,
                    codigoPacote: receiveSuccessData.codigoPacote,
                    codigoRetiradaPin: receiveSuccessData.pin,
                    destinatarioNome: receiveSuccessData.destinatarioNome,
                    unidadeIdentificacao: receiveSuccessData.unidadeIdentificacao,
                    transportadora: receiveSuccessData.transportadora,
                    descricaoConteudo: receiveSuccessData.descricaoConteudo,
                    recebidoEm: new Date().toISOString()
                  } as CondoPackage;
                  handleNotifyResident(pkg);
                }}
                className="w-full py-2.5 px-4 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/25"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Avisar Morador via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setReceiveSuccessData(null)}
                className="w-full py-2 px-4 bg-[#25222D] hover:bg-[#1D1B24] text-[#AAA6B5] hover:text-[#F5F3FA] border border-[#393442] font-semibold rounded-xl text-xs transition"
              >
                Concluir e Voltar à Lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Delivery Confirmation Modal with PIN */}
      {showPickupModal && selectedPkgForPickup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-[#1D1B24] border border-[#393442] rounded-2xl p-6 shadow-2xl text-[#F5F3FA]">
            <button
              onClick={() => setShowPickupModal(false)}
              className="absolute top-4 right-4 text-[#AAA6B5] hover:text-[#F5F3FA] p-1 rounded-lg hover:bg-[#25222D] transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F3FA]">Baixar Retirada da Encomenda</h3>
                <p className="text-xs text-[#AAA6B5]">
                  Pacote: <span className="font-bold text-[#F5F3FA]">{selectedPkgForPickup.codigoPacote}</span> • {selectedPkgForPickup.unidadeIdentificacao}
                </p>
              </div>
            </div>

            {pickupError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pickupError}</span>
              </div>
            )}

            <form onSubmit={handlePickupSubmit} className="space-y-3.5">
              <div className="p-3 bg-[#25222D] border border-[#393442] rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#AAA6B5]">Destinatário:</span>
                  <span className="font-bold text-[#F5F3FA]">{selectedPkgForPickup.destinatarioNome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#AAA6B5]">Conteúdo:</span>
                  <span className="text-[#F5F3FA]">{selectedPkgForPickup.descricaoConteudo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#AAA6B5]">Recebido na Portaria por:</span>
                  <span className="text-[#F5F3FA]">{selectedPkgForPickup.recebidoPorPorteiro}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#C4B5FD] mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>Código PIN de Retirada Obrigatório</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pickupForm.pin}
                    onChange={e => setPickupForm({ ...pickupForm, pin: e.target.value })}
                    placeholder="Digite o PIN de 4 dígitos"
                    className="w-full bg-[#25222D] border border-[#8B5CF6]/50 rounded-xl px-3 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <p className="text-[10px] text-[#AAA6B5] mt-1">
                  O morador recebeu este código pelo WhatsApp da portaria.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Nome de Quem Está Retirando *</label>
                <input
                  type="text"
                  required
                  value={pickupForm.retiradoPor}
                  onChange={e => setPickupForm({ ...pickupForm, retiradoPor: e.target.value })}
                  placeholder="Nome do morador ou terceiro autorizado"
                  className="w-full bg-[#25222D] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Documento Apresentado (RG ou CPF)</label>
                <input
                  type="text"
                  value={pickupForm.documentoRetirada}
                  onChange={e => setPickupForm({ ...pickupForm, documentoRetirada: e.target.value })}
                  placeholder="Ex: RG 12.345.678-9 (opcional se morador já for conhecido)"
                  className="w-full bg-[#25222D] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="pt-3 border-t border-[#393442] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPickupModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#AAA6B5] hover:text-[#F5F3FA]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-bold rounded-xl text-xs transition shadow-md shadow-[#10B981]/25"
                >
                  Validar PIN & Registrar Entrega
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Status / Notes Update Modal */}
      {showStatusModal && selectedPkgForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-[#1D1B24] border border-[#393442] rounded-2xl p-6 shadow-2xl text-[#F5F3FA]">
            <button
              onClick={() => setShowStatusModal(false)}
              className="absolute top-4 right-4 text-[#AAA6B5] hover:text-[#F5F3FA] p-1 rounded-lg hover:bg-[#25222D] transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 flex items-center justify-center">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F3FA]">Atualizar Status da Encomenda</h3>
                <p className="text-xs text-[#AAA6B5]">
                  Pacote: {selectedPkgForStatus.codigoPacote} • {selectedPkgForStatus.unidadeIdentificacao}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveStatusUpdate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Status da Mercadoria</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full bg-[#25222D] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="aguardando_retirada">Aguardando Retirada (na portaria)</option>
                  <option value="notificado">Notificado (aviso enviado)</option>
                  <option value="retirado">Entregue ao Morador</option>
                  <option value="devolvido">Devolvido à Transportadora</option>
                  <option value="em_ocorrencia">Em Ocorrência / Avaria</option>
                </select>
              </div>

              {newStatus === 'retirado' && (
                <div>
                  <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Responsável pela Retirada</label>
                  <input
                    type="text"
                    value={statusReceiver}
                    onChange={e => setStatusReceiver(e.target.value)}
                    placeholder="Nome de quem recebeu"
                    className="w-full bg-[#25222D] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Observações da Ocorrência / Portaria</label>
                <textarea
                  rows={3}
                  value={statusNotes}
                  onChange={e => setStatusNotes(e.target.value)}
                  placeholder="Informações adicionais sobre o pacote..."
                  className="w-full bg-[#25222D] border border-[#393442] rounded-xl p-2.5 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="pt-3 border-t border-[#393442] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#AAA6B5] hover:text-[#F5F3FA]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={statusSubmitting}
                  className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold rounded-xl text-xs transition shadow-md shadow-[#7C3AED]/25 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {statusSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
