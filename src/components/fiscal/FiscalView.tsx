import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { FiscalConfig, FiscalDocument, DeliveryItem } from '../../types';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Printer,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Layers,
  Truck,
  Building,
  Key,
  Calendar,
  DollarSign,
  Send,
  Eye,
  FileCheck,
  Lock,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

export const FiscalView: React.FC = () => {
  const { user, company, isMaster } = useAuth();
  const [activeTab, setActiveTab] = useState<'documents' | 'emit' | 'config'>('documents');
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [config, setConfig] = useState<FiscalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<FiscalDocument | null>(null);
  const [showXmlModal, setShowXmlModal] = useState(false);
  const [showDanfeModal, setShowDanfeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCceModal, setShowCceModal] = useState(false);
  const [cceText, setCceText] = useState('');
  const [cceLoading, setCceLoading] = useState(false);

  // Feedback notification state
  const [fiscalNotification, setFiscalNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFiscalNotification({ type, message });
    setTimeout(() => {
      setFiscalNotification(null);
    }, 6000);
  };

  // Deliveries for linking
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);

  // Emission Form State
  const [emitTipo, setEmitTipo] = useState<'nfe' | 'cte' | 'mdfe' | 'nfse' | 'nfce'>('nfe');
  const [emitDestNome, setEmitDestNome] = useState('');
  const [emitDestDoc, setEmitDestDoc] = useState('');
  const [emitDestEnd, setEmitDestEnd] = useState('');
  const [emitDestCidade, setEmitDestCidade] = useState('São Paulo');
  const [emitDestUF, setEmitDestUF] = useState('SP');
  const [emitDestCEP, setEmitDestCEP] = useState('');
  const [emitNatOp, setEmitNatOp] = useState('Venda de Mercadorias para Entrega');
  const [emitCfop, setEmitCfop] = useState('5102');
  const [emitDescricao, setEmitDescricao] = useState('');
  const [emitValorProds, setEmitValorProds] = useState<number>(350.0);
  const [emitValorFrete, setEmitValorFrete] = useState<number>(45.0);
  const [emitLinkedDeliveryId, setEmitLinkedDeliveryId] = useState<string>('');
  const [emitSubmitting, setEmitSubmitting] = useState(false);
  const [emitSuccessMessage, setEmitSuccessMessage] = useState<string | null>(null);

  // Config Form State
  const [configCnpj, setConfigCnpj] = useState('');
  const [configRazao, setConfigRazao] = useState('');
  const [configNomeFantasia, setConfigNomeFantasia] = useState('');
  const [configIE, setConfigIE] = useState('');
  const [configIM, setConfigIM] = useState('');
  const [configRegime, setConfigRegime] = useState<'simples_nacional' | 'lucro_presumido' | 'lucro_real'>('simples_nacional');
  const [configAmbiente, setConfigAmbiente] = useState<'homologacao' | 'producao'>('homologacao');
  const [configProvedor, setConfigProvedor] = useState<'simulador_homologacao' | 'focus_nfe' | 'nuvem_fiscal' | 'sefaz_direta'>('simulador_homologacao');
  const [configSaving, setConfigSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsRes, cfgRes, delRes] = await Promise.all([
        api.getFiscalDocuments(),
        api.getFiscalConfig(),
        api.getDeliveries()
      ]);
      setDocuments(docsRes.documents || []);
      if (cfgRes.config) {
        setConfig(cfgRes.config);
        setConfigCnpj(cfgRes.config.cnpj || '');
        setConfigRazao(cfgRes.config.razaoSocial || '');
        setConfigNomeFantasia(cfgRes.config.nomeFantasia || '');
        setConfigIE(cfgRes.config.inscricaoEstadual || '');
        setConfigIM(cfgRes.config.inscricaoMunicipal || '');
        setConfigRegime(cfgRes.config.regimeTributario || 'simples_nacional');
        setConfigAmbiente(cfgRes.config.ambiente || 'homologacao');
        setConfigProvedor(cfgRes.config.provedorIntegracao || 'simulador_homologacao');
      }
      setDeliveries(delRes.deliveries || []);
    } catch (e) {
      console.error('Erro ao carregar Central Fiscal:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company?.id]);

  // Handle Delivery Link Autofill
  const handleSelectDelivery = (deliveryId: string) => {
    setEmitLinkedDeliveryId(deliveryId);
    if (!deliveryId) return;
    const d = deliveries.find(item => item.id === deliveryId);
    if (d) {
      setEmitDestNome(d.destinatario);
      setEmitDestEnd(`${d.endereco}, ${d.numero}${d.complemento ? ' - ' + d.complemento : ''} - ${d.bairro}`);
      setEmitDestCidade(d.cidade || 'São Paulo');
      setEmitDestUF(d.estado || 'SP');
      setEmitDestCEP(d.cep || '');
      setEmitDescricao(`Transporte / Entrega de ${d.volumes} volume(s) (${d.pesoKg} kg) - Cód: ${d.codigoRastreio}`);
      if (d.valorMercadoria && d.valorMercadoria > 0) {
        setEmitValorProds(d.valorMercadoria);
      }
    }
  };

  // Handle Emit Fiscal Document
  const handleEmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emitDestNome || !emitDestDoc) {
      showNotification('error', 'Preencha os campos obrigatórios do destinatário.');
      return;
    }
    setEmitSubmitting(true);
    setEmitSuccessMessage(null);
    try {
      const payload = {
        tipo: emitTipo,
        destinatarioNome: emitDestNome,
        destinatarioDocumento: emitDestDoc,
        destinatarioEndereco: emitDestEnd,
        destinatarioCidade: emitDestCidade,
        destinatarioUF: emitDestUF,
        destinatarioCEP: emitDestCEP,
        naturezaOperacao: emitNatOp,
        cfop: emitCfop,
        valorTotalProdutos: emitValorProds,
        valorFrete: emitValorFrete,
        valorSeguro: 0,
        valorOutros: 0,
        deliveryId: emitLinkedDeliveryId || undefined,
        itens: [
          {
            itemNumero: 1,
            descricao: emitDescricao || `Mercadoria / Carga Logística - ${emitDestNome}`,
            ncm: '84713012',
            cfop: emitCfop,
            quantidade: 1,
            unidadeMedida: 'UN',
            valorUnitario: emitValorProds,
            valorTotal: emitValorProds,
            aliquotaICMS: emitTipo === 'nfse' ? 0 : 12.0,
            valorICMS: emitTipo === 'nfse' ? 0 : emitValorProds * 0.12
          }
        ]
      };

      const res = await api.emitFiscalDocument(payload);
      setEmitSuccessMessage(res.message);
      setSelectedDoc(res.document);
      await loadData();
      showNotification('success', res.message || 'Documento fiscal emitido com sucesso!');
      setActiveTab('documents');
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao emitir documento fiscal');
    } finally {
      setEmitSubmitting(false);
    }
  };

  // Handle Save Fiscal Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    try {
      await api.saveFiscalConfig({
        cnpj: configCnpj,
        razaoSocial: configRazao,
        nomeFantasia: configNomeFantasia,
        inscricaoEstadual: configIE,
        inscricaoMunicipal: configIM,
        regimeTributario: configRegime,
        ambiente: configAmbiente,
        provedorIntegracao: configProvedor
      });
      showNotification('success', 'Configurações fiscais salvas com sucesso!');
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao salvar configurações fiscais');
    } finally {
      setConfigSaving(false);
    }
  };

  // Handle Cancel Document
  const handleConfirmCancel = async () => {
    if (!selectedDoc) return;
    if (cancelReason.trim().length < 15) {
      showNotification('error', 'A justificativa de cancelamento fiscal exige no mínimo 15 caracteres.');
      return;
    }
    setCancelLoading(true);
    try {
      await api.cancelFiscalDocument(selectedDoc.id, cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
      await loadData();
      showNotification('success', 'Documento fiscal cancelado com sucesso no motor fiscal!');
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao cancelar documento fiscal');
    } finally {
      setCancelLoading(false);
    }
  };

  // Handle CC-e (Carta de Correção)
  const handleConfirmCce = async () => {
    if (!selectedDoc) return;
    if (cceText.trim().length < 15) {
      showNotification('error', 'O texto da Carta de Correção (CC-e) exige no mínimo 15 caracteres.');
      return;
    }
    setCceLoading(true);
    try {
      await api.sendFiscalCorrection(selectedDoc.id, cceText);
      setShowCceModal(false);
      setCceText('');
      await loadData();
      showNotification('success', 'Carta de Correção Eletrônica (CC-e) registrada com sucesso!');
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao registrar Carta de Correção');
    } finally {
      setCceLoading(false);
    }
  };

  // Download XML helper
  const handleDownloadXml = (doc: FiscalDocument) => {
    const blob = new Blob([doc.xmlConteudo], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.chaveAcesso}-proc${doc.tipo.toUpperCase()}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered documents list
  const filteredDocs = documents.filter(d => {
    if (filterTipo !== 'all' && d.tipo !== filterTipo) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.chaveAcesso.toLowerCase().includes(q) ||
        d.destinatarioNome.toLowerCase().includes(q) ||
        String(d.numero).includes(q) ||
        d.destinatarioDocumento.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121024] via-[#1a1435] to-[#121024] border border-[#2D2644] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/30">
                Módulo Fiscal Integrado
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                config?.ambiente === 'producao'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {config?.ambiente === 'producao' ? 'Ambiente Produção SEFAZ' : 'Ambiente Homologação Autorizado'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#8B5CF6]" />
              <span>Central Fiscal & Documentos Eletrônicos</span>
            </h2>
            <p className="text-xs text-[#AAA6B5] mt-1">
              Emissão e gestão de NF-e (produtos), CT-e (transporte de carga), MDF-e (manifesto) e NFS-e integrados à expedição e rotas MoviLog.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('emit')}
              className="px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#8B5CF6]/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Emitir Documento Fiscal</span>
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className="px-3.5 py-2 bg-[#1C1829] hover:bg-[#252037] border border-[#2D2644] text-[#F5F3FA] rounded-xl text-xs font-semibold transition flex items-center gap-2"
            >
              <Settings className="w-4 h-4 text-[#8B5CF6]" />
              <span>Parâmetros</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mt-6 border-t border-[#2D2644]/60 pt-4">
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'documents'
                ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/25'
                : 'text-[#AAA6B5] hover:text-white hover:bg-[#1C1829]'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Documentos Emitidos ({documents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('emit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'emit'
                ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/25'
                : 'text-[#AAA6B5] hover:text-white hover:bg-[#1C1829]'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Nova Emissão Fiscal</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'config'
                ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/25'
                : 'text-[#AAA6B5] hover:text-white hover:bg-[#1C1829]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Configuração Fiscal da Empresa</span>
          </button>
        </div>
      </div>

      {/* Global Notification Banner */}
      {fiscalNotification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
          fiscalNotification.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {fiscalNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{fiscalNotification.message}</span>
          </div>
          <button
            onClick={() => setFiscalNotification(null)}
            className="text-white/60 hover:text-white ml-3 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: DOCUMENTS LIST */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-[#121024] border border-[#2D2644] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#AAA6B5]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por Chave de Acesso, Destinatário, CNPJ ou Número..."
                className="w-full pl-9 pr-4 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white placeholder-[#716A85] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={filterTipo}
                onChange={e => setFilterTipo(e.target.value)}
                className="px-3 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
              >
                <option value="all">Todos os Modelos</option>
                <option value="nfe">NF-e (Mod. 55)</option>
                <option value="cte">CT-e (Mod. 57 Carga)</option>
                <option value="mdfe">MDF-e (Mod. 58 Manifesto)</option>
                <option value="nfse">NFS-e (Serviços)</option>
                <option value="nfce">NFC-e (Consumidor)</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
              >
                <option value="all">Todos os Status</option>
                <option value="autorizado">Autorizados</option>
                <option value="cancelado">Cancelados</option>
                <option value="rejeitado">Rejeitados</option>
              </select>

              <button
                onClick={loadData}
                className="p-2 bg-[#1C1829] hover:bg-[#252037] border border-[#2D2644] rounded-xl text-[#AAA6B5] hover:text-white transition"
                title="Atualizar"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#8B5CF6]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-[#121024] border border-[#2D2644] rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2D2644] bg-[#16132C]/60 text-[11px] font-bold text-[#AAA6B5] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Modelo / Doc</th>
                    <th className="py-3.5 px-4">Chave de Acesso (44 dígitos)</th>
                    <th className="py-3.5 px-4">Destinatário & UF</th>
                    <th className="py-3.5 px-4">Valor Total</th>
                    <th className="py-3.5 px-4">Emissão</th>
                    <th className="py-3.5 px-4">Status SEFAZ</th>
                    <th className="py-3.5 px-4 text-right">Ações Oficiais</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2644]/60 text-xs">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#AAA6B5]">
                        <FileText className="w-10 h-10 text-[#716A85] mx-auto mb-2 opacity-50" />
                        <span className="block font-medium">Nenhum documento fiscal encontrado.</span>
                        <span className="text-[11px] text-[#716A85] mt-1 block">
                          Clique em "Emitir Documento Fiscal" para gerar a primeira NF-e, CT-e ou MDF-e.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map(doc => (
                      <tr key={doc.id} className="hover:bg-[#1A1633]/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center font-bold text-[#C4B5FD] text-[11px] uppercase">
                              {doc.tipo}
                            </span>
                            <div>
                              <span className="font-bold text-white block">Nº {doc.numero}</span>
                              <span className="text-[10px] text-[#AAA6B5]">Série {doc.serie}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[11px] text-[#C4B5FD] tracking-tight block">
                            {doc.chaveAcesso}
                          </span>
                          <span className="text-[10px] text-[#AAA6B5]">
                            Prot: {doc.protocoloAutorizacao}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-white block truncate max-w-[180px]">
                            {doc.destinatarioNome}
                          </span>
                          <span className="text-[10px] text-[#AAA6B5] block">
                            {doc.destinatarioDocumento} • {doc.destinatarioCidade}/{doc.destinatarioUF}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-emerald-400 font-mono block">
                            R$ {doc.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {doc.valorFrete > 0 && (
                            <span className="text-[10px] text-[#AAA6B5]">
                              Frete: R$ {doc.valorFrete.toFixed(2)}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[#AAA6B5] text-[11px]">
                          {new Date(doc.dataEmissao).toLocaleDateString('pt-BR')} {new Date(doc.dataEmissao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            doc.status === 'autorizado'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : doc.status === 'cancelado'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {doc.status === 'autorizado' && <CheckCircle2 className="w-3 h-3" />}
                            {doc.status === 'cancelado' && <XCircle className="w-3 h-3" />}
                            <span>{doc.status.toUpperCase()}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedDoc(doc);
                                setShowDanfeModal(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#1C1829] hover:bg-[#2A2440] border border-[#2D2644] text-[#F5F3FA] hover:text-[#C4B5FD] text-[11px] font-medium transition flex items-center gap-1"
                              title="Visualizar DANFE / DACTE"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#8B5CF6]" />
                              <span>{doc.tipo === 'cte' ? 'DACTE' : doc.tipo === 'mdfe' ? 'DAMDFE' : 'DANFE'}</span>
                            </button>

                            <button
                              onClick={() => handleDownloadXml(doc)}
                              className="p-1.5 rounded-lg bg-[#1C1829] hover:bg-[#2A2440] border border-[#2D2644] text-[#AAA6B5] hover:text-white transition"
                              title="Baixar XML Oficial"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {doc.status === 'autorizado' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedDoc(doc);
                                    setShowCceModal(true);
                                  }}
                                  className="px-2 py-1.5 rounded-lg bg-[#1C1829] hover:bg-[#2A2440] border border-[#2D2644] text-amber-400 text-[10px] font-bold transition"
                                  title="Carta de Correção Eletrônica (CC-e)"
                                >
                                  CC-e
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedDoc(doc);
                                    setShowCancelModal(true);
                                  }}
                                  className="px-2 py-1.5 rounded-lg bg-[#1C1829] hover:bg-rose-950/40 border border-[#2D2644] text-rose-400 text-[10px] font-bold transition"
                                  title="Cancelar Documento Fiscal"
                                >
                                  Cancelar
                                </button>
                              </>
                            )}
                          </div>
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

      {/* TAB 2: EMIT FISCAL DOCUMENT */}
      {activeTab === 'emit' && (
        <div className="bg-[#121024] border border-[#2D2644] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#2D2644] pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-[#8B5CF6]" />
                <span>Emissão de Documento Fiscal Eletrônico</span>
              </h3>
              <p className="text-xs text-[#AAA6B5] mt-0.5">
                Validação de campos tributários, cálculo de impostos e autorização pelo motor SEFAZ.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#AAA6B5]">Vincular Entrega:</span>
              <select
                value={emitLinkedDeliveryId}
                onChange={e => handleSelectDelivery(e.target.value)}
                className="px-3 py-1.5 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6] max-w-xs"
              >
                <option value="">Nenhuma (Preenchimento Manual)</option>
                {deliveries.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.codigoRastreio} — {d.destinatario} ({d.cidade})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleEmit} className="space-y-6">
            {/* Document Type Selector */}
            <div>
              <label className="block text-xs font-bold text-[#AAA6B5] uppercase mb-2">
                Modelo do Documento Fiscal
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { id: 'nfe', label: 'NF-e (Mod. 55)', desc: 'Produtos / Mercadorias' },
                  { id: 'cte', label: 'CT-e (Mod. 57)', desc: 'Conhecimento Transporte' },
                  { id: 'mdfe', label: 'MDF-e (Mod. 58)', desc: 'Manifesto de Cargas' },
                  { id: 'nfse', label: 'NFS-e (Serviços)', desc: 'Prestação de Serviços' },
                  { id: 'nfce', label: 'NFC-e (Mod. 65)', desc: 'Venda ao Consumidor' }
                ].map(item => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setEmitTipo(item.id as any);
                      if (item.id === 'cte') {
                        setEmitNatOp('Prestação de Serviço de Transporte Rodoviário de Carga');
                        setEmitCfop('5353');
                      } else {
                        setEmitNatOp('Venda de Mercadorias para Entrega');
                        setEmitCfop('5102');
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      emitTipo === item.id
                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/20'
                        : 'bg-[#1C1829] border-[#2D2644] text-[#AAA6B5] hover:text-white hover:bg-[#252037]'
                    }`}
                  >
                    <span className="font-bold text-xs block text-white">{item.label}</span>
                    <span className="text-[10px] text-[#AAA6B5] block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#2D2644] pt-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">
                  Nome / Razão Social do Destinatário *
                </label>
                <input
                  type="text"
                  required
                  value={emitDestNome}
                  onChange={e => setEmitDestNome(e.target.value)}
                  placeholder="Nome completo ou Razão Social"
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white placeholder-[#716A85] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">
                  CNPJ ou CPF do Destinatário *
                </label>
                <input
                  type="text"
                  required
                  value={emitDestDoc}
                  onChange={e => setEmitDestDoc(e.target.value)}
                  placeholder="00.000.000/0000-00 ou CPF"
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white placeholder-[#716A85] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">
                  Endereço Completo de Destino
                </label>
                <input
                  type="text"
                  value={emitDestEnd}
                  onChange={e => setEmitDestEnd(e.target.value)}
                  placeholder="Logradouro, número, bairro"
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white placeholder-[#716A85] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">Cidade</label>
                  <input
                    type="text"
                    value={emitDestCidade}
                    onChange={e => setEmitDestCidade(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={emitDestUF}
                    onChange={e => setEmitDestUF(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>
            </div>

            {/* Operations & CFOP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#2D2644] pt-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">
                  Natureza da Operação
                </label>
                <input
                  type="text"
                  value={emitNatOp}
                  onChange={e => setEmitNatOp(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">
                  CFOP
                </label>
                <input
                  type="text"
                  value={emitCfop}
                  onChange={e => setEmitCfop(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">
                  Descrição da Carga / Mercadoria / Serviço
                </label>
                <textarea
                  rows={2}
                  value={emitDescricao}
                  onChange={e => setEmitDescricao(e.target.value)}
                  placeholder="Descrição técnica dos produtos ou serviços de transporte contratados..."
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white placeholder-[#716A85] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">
                  Valor dos Produtos / Serviço (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={emitValorProds}
                  onChange={e => setEmitValorProds(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">
                  Valor do Frete (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={emitValorFrete}
                  onChange={e => setEmitValorFrete(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="p-3 bg-[#1C1829] border border-[#2D2644] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#AAA6B5] block uppercase font-bold">Valor Total Calculado</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    R$ {(emitValorProds + emitValorFrete).toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#AAA6B5] block">ICMS Estimado (12%)</span>
                  <span className="text-xs font-mono text-[#C4B5FD]">
                    R$ {(emitValorProds * 0.12).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-[#2D2644] pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className="px-4 py-2 bg-[#1C1829] hover:bg-[#252037] border border-[#2D2644] text-[#AAA6B5] rounded-xl text-xs font-semibold transition"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={emitSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#8B5CF6]/30 flex items-center gap-2 disabled:opacity-50"
              >
                {emitSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transmitindo ao SEFAZ...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Transmitir & Autorizar {emitTipo.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: CONFIGURATION */}
      {activeTab === 'config' && (
        <div className="bg-[#121024] border border-[#2D2644] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#2D2644] pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#8B5CF6]" />
                <span>Configurações & Parâmetros Fiscais da Empresa</span>
              </h3>
              <p className="text-xs text-[#AAA6B5] mt-0.5">
                Definição do regime tributário, ambiente de transmissão (Homologação / Produção) e integração SEFAZ.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400">
                Certificado Digital A1 Integrado (Válido até 31/12/2027)
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">CNPJ Emitente</label>
                <input
                  type="text"
                  value={configCnpj}
                  onChange={e => setConfigCnpj(e.target.value)}
                  placeholder="00.000.000/0001-91"
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">Razão Social</label>
                <input
                  type="text"
                  value={configRazao}
                  onChange={e => setConfigRazao(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">Inscrição Estadual (IE)</label>
                <input
                  type="text"
                  value={configIE}
                  onChange={e => setConfigIE(e.target.value)}
                  placeholder="111.222.333.444"
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">Inscrição Municipal (IM)</label>
                <input
                  type="text"
                  value={configIM}
                  onChange={e => setConfigIM(e.target.value)}
                  placeholder="999888-7"
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">Regime Tributário</label>
                <select
                  value={configRegime}
                  onChange={e => setConfigRegime(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="simples_nacional">1 - Simples Nacional</option>
                  <option value="lucro_presumido">2 - Lucro Presumido</option>
                  <option value="lucro_real">3 - Lucro Real</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">Ambiente de Emissão</label>
                <select
                  value={configAmbiente}
                  onChange={e => setConfigAmbiente(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="homologacao">2 - Homologação (Testes com Autorização SEFAZ)</option>
                  <option value="producao">1 - Produção com Validade Fiscal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">Provedor de Mensageria Fiscal</label>
                <select
                  value={configProvedor}
                  onChange={e => setConfigProvedor(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="simulador_homologacao">Motor SEFAZ Homologação MoviLog</option>
                  <option value="focus_nfe">Focus NFe API Gateway</option>
                  <option value="nuvem_fiscal">Nuvem Fiscal SDK</option>
                  <option value="sefaz_direta">SEFAZ Direta (WebServices SP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#AAA6B5] mb-1">Próxima NF-e / CT-e</label>
                <input
                  type="text"
                  disabled
                  value={`Série ${config?.serieNFe || 1} • Próx. Nº ${config?.proximoNumeroNFe || 1}`}
                  className="w-full px-3.5 py-2 bg-[#161324] border border-[#2D2644] rounded-xl text-xs text-[#AAA6B5] font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="p-4 bg-[#1C1829] border border-[#2D2644] rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-[#8B5CF6] shrink-0 mt-0.5" />
              <div className="text-xs text-[#AAA6B5] leading-relaxed">
                <span className="font-bold text-white block">Instrução de Segurança Fiscal</span>
                Em conformidade com as exigências de privacidade e segurança fiscal, certificados digitais e segredos de produção são criptografados no servidor. As emissões são vinculadas a um log auditável com ID de usuário, IP e timestamp.
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={configSaving}
                className="px-6 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#8B5CF6]/30 flex items-center gap-2"
              >
                {configSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Salvar Parâmetros Fiscais</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: DANFE / DACTE VIEWER */}
      {showDanfeModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#121024] border border-[#2D2644] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#2D2644] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#C4B5FD] font-bold">
                  {selectedDoc.tipo.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedDoc.tipo === 'cte'
                      ? 'DACTE — Documento Auxiliar do CT-e'
                      : selectedDoc.tipo === 'mdfe'
                      ? 'DAMDFE — Documento Auxiliar do MDF-e'
                      : selectedDoc.tipo === 'nfse'
                      ? 'DANFSE — Documento Auxiliar da NFS-e'
                      : 'DANFE — Documento Auxiliar da NF-e'}
                  </h3>
                  <span className="text-xs text-[#AAA6B5] font-mono">
                    Chave: {selectedDoc.chaveAcesso}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#1C1829] hover:bg-[#252037] border border-[#2D2644] text-[#F5F3FA] rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => handleDownloadXml(selectedDoc)}
                  className="px-3 py-1.5 bg-[#1C1829] hover:bg-[#252037] border border-[#2D2644] text-[#F5F3FA] rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Baixar XML</span>
                </button>
                <button
                  onClick={() => setShowDanfeModal(false)}
                  className="p-1.5 rounded-lg text-[#AAA6B5] hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Header Representation */}
            <div className="border border-[#3E345D] rounded-xl p-4 bg-[#16132C] space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-[#3E345D] pb-4">
                <div>
                  <span className="text-[10px] text-[#AAA6B5] block uppercase font-bold">Emitente</span>
                  <span className="font-bold text-white text-sm block mt-0.5">{selectedDoc.emitenteRazao}</span>
                  <span className="text-slate-300 font-mono text-[11px] block mt-0.5">CNPJ: {selectedDoc.emitenteCNPJ}</span>
                  <span className="text-slate-400 block text-[11px]">Av. Paulista, 1000 - São Paulo/SP</span>
                </div>

                <div className="text-center border-x border-[#3E345D] px-4">
                  <span className="font-black text-lg text-white block">
                    {selectedDoc.tipo === 'cte' ? 'DACTE' : selectedDoc.tipo === 'mdfe' ? 'DAMDFE' : selectedDoc.tipo === 'nfse' ? 'DANFSE' : 'DANFE'}
                  </span>
                  <span className="text-[10px] text-[#AAA6B5] block uppercase">
                    {selectedDoc.tipo === 'cte'
                      ? 'Documento Auxiliar do Conhecimento de Transporte Eletrônico'
                      : selectedDoc.tipo === 'mdfe'
                      ? 'Documento Auxiliar do Manifesto Eletrônico de Documentos Fiscais'
                      : selectedDoc.tipo === 'nfse'
                      ? 'Documento Auxiliar da Nota Fiscal de Serviços Eletrônica'
                      : 'Documento Auxiliar da Nota Fiscal Eletrônica'}
                  </span>
                  <span className="text-xs font-bold text-[#C4B5FD] block mt-1">
                    Nº {selectedDoc.numero} • Série {selectedDoc.serie}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 mt-1 block">
                    SEFAZ AUTORIZADO (Ambiente {selectedDoc.ambiente.toUpperCase()})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[#AAA6B5] block uppercase font-bold">Protocolo de Autorização</span>
                  <span className="font-mono text-white text-xs block font-bold mt-0.5">{selectedDoc.protocoloAutorizacao}</span>
                  <span className="text-[10px] text-[#AAA6B5] block mt-1">Data / Hora:</span>
                  <span className="text-slate-300 block text-[11px]">{new Date(selectedDoc.dataEmissao).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              {/* Recipient Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-[#3E345D] pb-4">
                <div>
                  <span className="text-[10px] text-[#AAA6B5] block uppercase font-bold">Destinatário / Remetente</span>
                  <span className="font-bold text-white block text-sm mt-0.5">{selectedDoc.destinatarioNome}</span>
                  <span className="text-slate-300 font-mono text-[11px] block mt-0.5">CPF / CNPJ: {selectedDoc.destinatarioDocumento}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#AAA6B5] block uppercase font-bold">Endereço de Entrega</span>
                  <span className="text-slate-300 block text-xs mt-0.5">{selectedDoc.destinatarioEndereco || 'Não informado'}</span>
                  <span className="text-slate-400 block text-[11px]">{selectedDoc.destinatarioCidade} - {selectedDoc.destinatarioUF} • CEP: {selectedDoc.destinatarioCEP || '00000-000'}</span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <span className="text-[10px] text-[#AAA6B5] block uppercase font-bold mb-2">Dados dos Produtos / Serviços</span>
                <table className="w-full text-left text-xs border border-[#3E345D]">
                  <thead className="bg-[#1C1829] text-[10px] text-[#AAA6B5] uppercase">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2">Descrição</th>
                      <th className="p-2">NCM</th>
                      <th className="p-2">CFOP</th>
                      <th className="p-2">Qtd</th>
                      <th className="p-2">Valor Unit.</th>
                      <th className="p-2">Total</th>
                      <th className="p-2">ICMS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3E345D]">
                    {selectedDoc.itens.map(item => (
                      <tr key={item.itemNumero}>
                        <td className="p-2 font-mono">{item.itemNumero}</td>
                        <td className="p-2 font-semibold text-white">{item.descricao}</td>
                        <td className="p-2 font-mono">{item.ncm}</td>
                        <td className="p-2 font-mono">{item.cfop}</td>
                        <td className="p-2">{item.quantidade}</td>
                        <td className="p-2 font-mono">R$ {item.valorUnitario.toFixed(2)}</td>
                        <td className="p-2 font-mono font-bold text-white">R$ {item.valorTotal.toFixed(2)}</td>
                        <td className="p-2 font-mono text-emerald-400">R$ {item.valorICMS.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#1C1829] p-3 rounded-xl border border-[#3E345D]">
                <div>
                  <span className="text-[10px] text-[#AAA6B5] block uppercase">Base Cálculo ICMS</span>
                  <span className="font-mono text-white text-xs font-bold">R$ {selectedDoc.baseCalculoICMS.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#AAA6B5] block uppercase">Valor ICMS</span>
                  <span className="font-mono text-white text-xs font-bold">R$ {selectedDoc.valorICMS.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#AAA6B5] block uppercase">Valor Frete</span>
                  <span className="font-mono text-white text-xs font-bold">R$ {selectedDoc.valorFrete.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 block uppercase font-bold">Valor Total Nota</span>
                  <span className="font-mono text-emerald-400 text-sm font-black">R$ {selectedDoc.valorTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANCEL JUSTIFICATION */}
      {showCancelModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#121024] border border-[#2D2644] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Cancelamento Fiscal SEFAZ</span>
            </h3>
            <p className="text-xs text-[#AAA6B5]">
              Documento: <strong className="text-white">{selectedDoc.tipo.toUpperCase()} Nº {selectedDoc.numero}</strong>
            </p>
            <p className="text-xs text-[#AAA6B5]">
              Informe a justificativa formal para transmissão do evento de cancelamento ao Fisco (mínimo de 15 caracteres):
            </p>
            <textarea
              rows={3}
              required
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Ex: Cancelamento motivado por erro no preenchimento de endereço e recusa da mercadoria."
              className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white placeholder-[#716A85] focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-between text-[11px] text-[#AAA6B5]">
              <span>{cancelReason.length} / 15 caracteres mínimos</span>
              <span className={cancelReason.length >= 15 ? 'text-emerald-400' : 'text-rose-400'}>
                {cancelReason.length >= 15 ? 'Válido' : 'Insuficiente'}
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-3.5 py-2 bg-[#1C1829] hover:bg-[#252037] border border-[#2D2644] text-[#AAA6B5] rounded-xl text-xs font-semibold"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelLoading || cancelReason.length < 15}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {cancelLoading ? 'Transmitindo...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CARTA DE CORREÇÃO (CC-e) */}
      {showCceModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#121024] border border-[#2D2644] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-400" />
              <span>Carta de Correção Eletrônica (CC-e)</span>
            </h3>
            <p className="text-xs text-[#AAA6B5]">
              Documento: <strong className="text-white">{selectedDoc.tipo.toUpperCase()} Nº {selectedDoc.numero}</strong>
            </p>
            <p className="text-xs text-[#AAA6B5]">
              A CC-e serve para sanar irregularidades que não envolvam valores, impostos, dados cadastrais de destinatário ou alteração de data de emissão.
            </p>
            <textarea
              rows={3}
              required
              value={cceText}
              onChange={e => setCceText(e.target.value)}
              placeholder="Ex: Fica retificado o endereço de entrega para Rua Nova, 123, mantendo-se os demais termos."
              className="w-full px-3.5 py-2 bg-[#1C1829] border border-[#2D2644] rounded-xl text-xs text-white placeholder-[#716A85] focus:outline-none focus:border-amber-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCceModal(false)}
                className="px-3.5 py-2 bg-[#1C1829] hover:bg-[#252037] border border-[#2D2644] text-[#AAA6B5] rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCce}
                disabled={cceLoading || cceText.length < 15}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {cceLoading ? 'Enviando...' : 'Transmitir CC-e'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
