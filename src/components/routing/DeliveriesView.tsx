import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DeliveryItem } from '../../types';
import { api } from '../../lib/api';
import * as XLSX from 'xlsx';
import {
  Package,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  X,
  Loader2,
  Trash2,
  Calendar,
  Layers,
  Phone,
  FileText,
  UserCheck
} from 'lucide-react';

interface DeliveriesViewProps {
  initialShowImport?: boolean;
  initialShowManual?: boolean;
}

export const DeliveriesView: React.FC<DeliveriesViewProps> = ({
  initialShowImport = false,
  initialShowManual = false
}) => {
  const { user, isMaster } = useAuth();
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('todos');
  const [prioridadeFilter, setPrioridadeFilter] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showManualModal, setShowManualModal] = useState(initialShowManual);
  const [showImportModal, setShowImportModal] = useState(initialShowImport);
  const [actionNotification, setActionNotification] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setActionNotification({ text, type });
    setTimeout(() => setActionNotification(null), 5000);
  };

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    destinatario: '',
    cliente: '',
    telefone: '',
    email: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '',
    referencia: '',
    instrucoes: '',
    volumes: 1,
    pesoKg: 1,
    valorMercadoria: 0,
    prioridade: 'media',
    prazoEntrega: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    janelaHorarioInicio: '08:00',
    janelaHorarioFim: '18:00',
    observacoes: ''
  });
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Spreadsheet Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    acceptedCount: number;
    rejectedCount: number;
    rejected: any[];
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (statusFilter !== 'todos') filters.status = statusFilter;
      if (prioridadeFilter !== 'todas') filters.prioridade = prioridadeFilter;
      if (searchTerm.trim()) filters.search = searchTerm.trim();

      const res = await api.getDeliveries(filters);
      setDeliveries(res.deliveries);
    } catch (e: any) {
      console.error('Erro ao carregar entregas:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, [statusFilter, prioridadeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDeliveries();
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    setManualLoading(true);

    try {
      await api.createDelivery(manualForm);
      setShowManualModal(false);
      setManualForm({
        destinatario: '',
        cliente: '',
        telefone: '',
        email: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '',
        referencia: '',
        instrucoes: '',
        volumes: 1,
        pesoKg: 1,
        valorMercadoria: 0,
        prioridade: 'media',
        prazoEntrega: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
        janelaHorarioInicio: '08:00',
        janelaHorarioFim: '18:00',
        observacoes: ''
      });
      await loadDeliveries();
    } catch (err: any) {
      setManualError(err.message || 'Erro ao cadastrar entrega');
    } finally {
      setManualLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportResult(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setPreviewRows(data);
      } catch (err) {
        setImportError('Erro ao ler planilha. Verifique se o formato é válido (.csv ou .xlsx)');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (previewRows.length === 0) return;
    setImportLoading(true);
    setImportError(null);

    try {
      const res = await api.importDeliveries(previewRows);
      setImportResult({
        acceptedCount: res.acceptedCount,
        rejectedCount: res.rejectedCount,
        rejected: res.rejected
      });
      setPreviewRows([]);
      setImportFile(null);
      await loadDeliveries();
    } catch (err: any) {
      setImportError(err.message || 'Erro durante a importação');
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Destinatario: 'Farmácia Central Saúde',
        Cliente: 'Rede Farma Mais',
        Telefone: '11987654321',
        Email: 'contato@farmasaude.com.br',
        Endereco: 'Avenida Paulista',
        Numero: '1200',
        Complemento: 'Conjunto 51',
        Bairro: 'Bela Vista',
        Cidade: 'São Paulo',
        Estado: 'SP',
        CEP: '01310100',
        Volumes: 2,
        PesoKg: 3.5,
        Prioridade: 'alta',
        Instrucoes: 'Entregar na recepção comercial'
      },
      {
        Destinatario: 'Mercado Vila Nova',
        Cliente: 'Distribuidora Alimentos',
        Telefone: '11976543210',
        Email: 'compras@vilanova.com.br',
        Endereco: 'Rua Domingos de Morais',
        Numero: '850',
        Complemento: 'Loja',
        Bairro: 'Vila Mariana',
        Cidade: 'São Paulo',
        Estado: 'SP',
        CEP: '04010000',
        Volumes: 5,
        PesoKg: 12.0,
        Prioridade: 'media',
        Instrucoes: 'Recebimento das 08h às 12h'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo_Entregas');
    XLSX.writeFile(wb, 'modelo_importacao_entregas_movilog.xlsx');
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteDelivery(id);
      showNotification('Entrega removida com sucesso.', 'info');
      await loadDeliveries();
    } catch (err: any) {
      showNotification(err.message || 'Erro ao remover entrega.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {actionNotification && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-lg ${
          actionNotification.type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            : actionNotification.type === 'error'
            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
            : 'bg-sky-500/20 border-sky-500/40 text-sky-300'
        }`}>
          <span>{actionNotification.text}</span>
          <button onClick={() => setActionNotification(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-500/10 via-slate-900 to-indigo-950/30 border border-sky-500/30 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded-full">
                  LET’S LOG — Gestão de Mercadorias
                </span>
                <span className="text-xs text-slate-400">Cadastro & Importação em Lote</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Entregas & Pedidos
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
              title="Baixar planilha padrão XLSX"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Modelo XLSX</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-semibold text-indigo-300 transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Importar Planilha</span>
            </button>

            <button
              onClick={() => setShowManualModal(true)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-lg shadow-sky-600/25"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Entrega</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, destinatário, endereço ou CEP..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="todos">Todos os status</option>
            <option value="pendente">Pendentes (Não planejadas)</option>
            <option value="planejada">Planejadas em Rota</option>
            <option value="em_rota">Em Deslocamento</option>
            <option value="entregue">Entregues com Sucesso</option>
            <option value="tentativa_falha">Ocorrência / Tentativa Falha</option>
          </select>

          <select
            value={prioridadeFilter}
            onChange={(e) => setPrioridadeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="todas">Todas as prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>

      {/* Deliveries Table / Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
          <span className="text-xs">Carregando lista de entregas...</span>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Nenhuma entrega encontrada</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Cadastre entregas manualmente ou importe uma planilha (.xlsx ou .csv) para iniciar o planejamento e roteirização.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowManualModal(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition"
            >
              Cadastrar Manualmente
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              Importar Planilha
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Código / Status</th>
                  <th className="py-3.5 px-4">Destinatário & Contato</th>
                  <th className="py-3.5 px-4">Endereço & Região</th>
                  <th className="py-3.5 px-4">Volumes & Carga</th>
                  <th className="py-3.5 px-4">Prioridade / Prazo</th>
                  <th className="py-3.5 px-4">Rota / Motorista</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {deliveries.map((del) => {
                  const isPending = del.status === 'pendente';
                  const isDelivered = del.status === 'entregue';
                  const isFailed = del.status === 'tentativa_falha';

                  return (
                    <tr key={del.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-white text-xs">
                          {del.codigoRastreio}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                            isDelivered
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isFailed
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : isPending
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          }`}
                        >
                          {del.status === 'pendente' && 'Não planejada'}
                          {del.status === 'planejada' && 'Planejada em rota'}
                          {del.status === 'em_rota' && 'Em rota'}
                          {del.status === 'entregue' && 'Entregue'}
                          {del.status === 'tentativa_falha' && 'Ocorrência'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{del.destinatario}</div>
                        {del.cliente && (
                          <div className="text-[11px] text-slate-400">Cliente: {del.cliente}</div>
                        )}
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-sky-400" />
                          <span>{del.telefone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">
                          {del.endereco}, {del.numero}
                          {del.complemento ? ` (${del.complemento})` : ''}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {del.bairro} • {del.cidade} - CEP {del.cep}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>
                            {del.geocodificado
                              ? `${del.lat?.toFixed(4)}, ${del.lng?.toFixed(4)} (${del.geocodificacaoStatus})`
                              : 'Pendente de geocodificação'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{del.volumes} vol(s)</div>
                        <div className="text-[11px] text-slate-400">{del.pesoKg.toFixed(1)} kg total</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            del.prioridade === 'urgente'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : del.prioridade === 'alta'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {del.prioridade.toUpperCase()}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Até {del.prazoEntrega}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {del.routeId ? (
                          <div>
                            <span className="font-mono text-sky-400 font-bold">
                              Parada #{del.sequencia || 1}
                            </span>
                            <div className="text-[11px] text-slate-400">
                              Motorista: {del.motoristaNome || 'A definir'}
                            </div>
                            {del.veiculoPlaca && (
                              <div className="text-[10px] text-slate-500">Placa: {del.veiculoPlaca}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Aguardando roteirização</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isPending && (
                          <button
                            onClick={() => handleDelete(del.id)}
                            title="Remover entrega"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CADASTRO MANUAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-sky-500/40 rounded-3xl p-6 shadow-2xl text-slate-100 my-8">
            <button
              onClick={() => setShowManualModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Cadastrar Nova Entrega</h3>
                <p className="text-xs text-slate-400">Preencha os dados do destinatário e da carga</p>
              </div>
            </div>

            {manualError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <form onSubmit={handleCreateManual} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Destinatário / Contato no Local *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.destinatario}
                    onChange={(e) => setManualForm({ ...manualForm, destinatario: e.target.value })}
                    placeholder="Nome completo da pessoa ou empresa"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telefone / Celular *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.telefone}
                    onChange={(e) => setManualForm({ ...manualForm, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Endereço / Logradouro *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.endereco}
                    onChange={(e) => setManualForm({ ...manualForm, endereco: e.target.value })}
                    placeholder="Rua, Avenida, Alameda..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Número *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.numero}
                    onChange={(e) => setManualForm({ ...manualForm, numero: e.target.value })}
                    placeholder="Ex: 450"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={manualForm.complemento}
                    onChange={(e) => setManualForm({ ...manualForm, complemento: e.target.value })}
                    placeholder="Apto, Sala, Bloco..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Bairro *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.bairro}
                    onChange={(e) => setManualForm({ ...manualForm, bairro: e.target.value })}
                    placeholder="Ex: Pinheiros"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cidade *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.cidade}
                    onChange={(e) => setManualForm({ ...manualForm, cidade: e.target.value })}
                    placeholder="Ex: São Paulo"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">CEP *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.cep}
                    onChange={(e) => setManualForm({ ...manualForm, cep: e.target.value })}
                    placeholder="00000-000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Volumes e Carga */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Volumes *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={manualForm.volumes}
                    onChange={(e) => setManualForm({ ...manualForm, volumes: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Peso Total (kg) *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={manualForm.pesoKg}
                    onChange={(e) => setManualForm({ ...manualForm, pesoKg: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Prioridade</label>
                  <select
                    value={manualForm.prioridade}
                    onChange={(e) => setManualForm({ ...manualForm, prioridade: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Prazo Máximo</label>
                  <input
                    type="date"
                    required
                    value={manualForm.prazoEntrega}
                    onChange={(e) => setManualForm({ ...manualForm, prazoEntrega: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Instruções e Observações de Entrega
                </label>
                <textarea
                  rows={2}
                  value={manualForm.instrucoes}
                  onChange={(e) => setManualForm({ ...manualForm, instrucoes: e.target.value })}
                  placeholder="Ex: Entregar na portaria dos fundos, tocar interfone 402, pedir assinatura de conferência..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                >
                  {manualLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Salvar e Geocodificar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: IMPORTAÇÃO DE PLANILHA */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl text-slate-100 my-8">
            <button
              onClick={() => {
                setShowImportModal(false);
                setPreviewRows([]);
                setImportResult(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Importação em Lote de Entregas</h3>
                <p className="text-xs text-slate-400">Faça upload de planilhas nos formatos .xlsx, .xls ou .csv</p>
              </div>
            </div>

            {importError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Upload Box */}
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center transition mb-6 bg-slate-950/40">
              <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
              <p className="text-xs text-slate-200 font-semibold mb-1">
                Clique para selecionar ou arraste o arquivo da planilha
              </p>
              <p className="text-[11px] text-slate-400 mb-3">
                Formatos aceitos: Excel (.xlsx, .xls) ou Texto delimitado (.csv)
              </p>
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileUpload}
                className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
              />
            </div>

            {/* Preview Section */}
            {previewRows.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200">
                    Prévia dos Registros ({previewRows.length} linhas detectadas)
                  </h4>
                  <span className="text-[11px] text-slate-400">Verifique as colunas antes de confirmar</span>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 sticky top-0">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Destinatário</th>
                        <th className="p-2">Endereço</th>
                        <th className="p-2">Bairro / Cidade</th>
                        <th className="p-2">CEP</th>
                        <th className="p-2">Volumes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {previewRows.slice(0, 15).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-2 font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-2 font-medium text-white">{row.Destinatario || row.destinatario || row.CLIENTE || '—'}</td>
                          <td className="p-2">{row.Endereco || row.endereco || '—'}, {row.Numero || row.numero || 'S/N'}</td>
                          <td className="p-2">{row.Bairro || row.bairro || '—'} - {row.Cidade || row.cidade || 'São Paulo'}</td>
                          <td className="p-2 font-mono">{row.CEP || row.cep || '—'}</td>
                          <td className="p-2">{row.Volumes || row.volumes || 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setPreviewRows([]);
                      setImportFile(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={importLoading}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Confirmar e Importar {previewRows.length} Entregas</span>
                  </button>
                </div>
              </div>
            )}

            {/* Results Report */}
            {importResult && (
              <div className="space-y-4 mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Relatório de Importação Concluída</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <span className="text-xl font-black text-emerald-400">{importResult.acceptedCount}</span>
                    <p className="text-[11px] text-emerald-300">Entregas Aceitas e Geocodificadas</p>
                  </div>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                    <span className="text-xl font-black text-rose-400">{importResult.rejectedCount}</span>
                    <p className="text-[11px] text-rose-300">Linhas Rejeitadas (com erro ou duplicadas)</p>
                  </div>
                </div>

                {importResult.rejected.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pt-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Motivos das rejeições:</span>
                    {importResult.rejected.map((rej, i) => (
                      <div key={i} className="text-[11px] text-rose-400 p-2 rounded-lg bg-rose-950/20 border border-rose-500/20">
                        Linha {rej.row}: {rej.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
