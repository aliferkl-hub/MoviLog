import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { CommercialProduct, CommercialStockMovement } from '../../types';
import {
  Boxes,
  ArrowUpRight,
  ArrowDownLeft,
  SlidersHorizontal,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  X,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';

interface CommerceStockViewProps {
  modulo: 'adega' | 'tabacaria';
}

export const CommerceStockView: React.FC<CommerceStockViewProps> = ({ modulo }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<CommercialProduct[]>([]);
  const [movements, setMovements] = useState<CommercialStockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Adjustment Modal Form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [tipoAjuste, setTipoAjuste] = useState<'ajuste_manual' | 'perda_avaria' | 'vencimento' | 'entrada_compra'>('ajuste_manual');
  const [quantidadeAjuste, setQuantidadeAjuste] = useState('1');
  const [motivoAjuste, setMotivoAjuste] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [prodRes, movRes] = await Promise.all([
        api.getCommerceProducts(modulo),
        api.getCommerceStockMovements()
      ]);
      setProducts(prodRes.products || []);
      // Filter movements belonging to this module
      const filteredMovs = (movRes.movements || []).filter(m => m.modulo === modulo);
      setMovements(filteredMovs);
      if (prodRes.products && prodRes.products.length > 0 && !selectedProductId) {
        setSelectedProductId(prodRes.products[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar movimentações de estoque.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [modulo]);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleOpenAdjustModal = (prodId?: string) => {
    if (prodId) setSelectedProductId(prodId);
    else if (products.length > 0) setSelectedProductId(products[0].id);
    setTipoAjuste('ajuste_manual');
    setQuantidadeAjuste('1');
    setMotivoAjuste('');
    setIsModalOpen(true);
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setErrorMsg('Selecione um produto.');
      return;
    }
    const qtd = parseInt(quantidadeAjuste);
    if (!qtd || qtd === 0) {
      setErrorMsg('A quantidade deve ser diferente de zero.');
      return;
    }
    if (!motivoAjuste.trim()) {
      setErrorMsg('O motivo ou justificativa do ajuste é obrigatório para auditoria.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await api.adjustCommerceStock({
        productId: selectedProductId,
        tipo: tipoAjuste,
        quantidade: qtd,
        motivo: motivoAjuste.trim()
      });

      if (res.success) {
        setSuccessMsg(`Ajuste de estoque efetuado com sucesso para "${res.product.nome}". Novo saldo: ${res.product.estoqueAtual} un.`);
        setIsModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar ajuste de estoque.');
    } finally {
      setSubmitting(false);
    }
  };

  // Movement badge format helper
  const getMovementBadge = (tipo: string) => {
    switch (tipo) {
      case 'entrada_compra':
        return { label: 'Entrada / Compra', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'saida_venda':
        return { label: 'Saída / Venda PDV', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'perda_avaria':
        return { label: 'Perda / Quebra', class: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
      case 'vencimento':
        return { label: 'Vencimento', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'devolucao':
        return { label: 'Devolução / Estorno', class: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      default:
        return { label: 'Ajuste Manual', class: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    }
  };

  // Filtered movements
  const filteredMovements = movements.filter(m => {
    const matchesSearch =
      m.productNome.toLowerCase().includes(search.toLowerCase()) ||
      m.motivo.toLowerCase().includes(search.toLowerCase()) ||
      m.usuarioNome.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || m.tipo === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121024] border border-[#262042] rounded-2xl p-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#8B5CF6]" />
            Controle de Estoque & Movimentações — {modulo === 'adega' ? 'Adega' : 'Tabacaria'}
          </h2>
          <p className="text-xs text-[#AAA6B5]">
            Histórico completo de entradas, saídas, perdas, quebras, validade e ajustes autorizados com trilha de auditoria.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdjustModal()}
          className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-[#8B5CF6]/30"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Ajustar Saldo / Registrar Baixa</span>
        </button>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-[#121024] border border-[#262042] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#AAA6B5]" />
          <input
            type="text"
            placeholder="Buscar por produto, motivo ou operador..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0A0714] border border-[#262042] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#AAA6B5] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6] w-full sm:w-auto"
        >
          <option value="all">Todos os Tipos de Movimento</option>
          <option value="saida_venda">Saída / Venda PDV</option>
          <option value="entrada_compra">Entrada / Compra</option>
          <option value="ajuste_manual">Ajuste Manual</option>
          <option value="perda_avaria">Perda / Quebra / Avaria</option>
          <option value="vencimento">Vencimento de Validade</option>
          <option value="devolucao">Devolução</option>
        </select>
      </div>

      {/* Movements Table */}
      <div className="bg-[#121024] border border-[#262042] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#AAA6B5]">Carregando movimentações...</div>
        ) : filteredMovements.length === 0 ? (
          <div className="p-12 text-center text-[#AAA6B5] space-y-2">
            <Boxes className="w-10 h-10 mx-auto text-[#262042]" />
            <p className="text-sm font-semibold text-white">Nenhuma movimentação de estoque registrada</p>
            <p className="text-xs">
              As movimentações são criadas automaticamente em vendas no PDV, recebimento de compras ou ajustes manuais autorizados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#262042] bg-[#0A0714]/60 text-[11px] font-bold text-[#AAA6B5] uppercase tracking-wider">
                  <th className="py-3 px-4">Data & Hora</th>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4 text-center">Qtd</th>
                  <th className="py-3 px-4 text-center">Saldo Anterior</th>
                  <th className="py-3 px-4 text-center">Novo Saldo</th>
                  <th className="py-3 px-4">Motivo / Justificativa</th>
                  <th className="py-3 px-4">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262042]/50 text-xs">
                {filteredMovements.map(m => {
                  const badge = getMovementBadge(m.tipo);
                  const isPositive = m.quantidade > 0;

                  return (
                    <tr key={m.id} className="hover:bg-[#1A1633]/30 transition">
                      <td className="py-3 px-4 text-[11px] text-[#AAA6B5] whitespace-nowrap">
                        {new Date(m.criadoEm).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {m.productNome}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.class}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPositive ? `+${m.quantidade}` : m.quantidade} un
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-[#AAA6B5]">
                        {m.quantidadeAnterior} un
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-white">
                        {m.quantidadeNova} un
                      </td>
                      <td className="py-3 px-4 text-[#AAA6B5] max-w-xs truncate" title={m.motivo}>
                        {m.motivo}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#C4B5FD] whitespace-nowrap">
                        {m.usuarioNome}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Stock Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121024] border border-[#262042] rounded-3xl p-6 max-w-lg w-full shadow-2xl relative text-white">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#AAA6B5] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-[#8B5CF6]" />
              Ajuste Manual de Estoque & Baixa de Avarias
            </h3>
            <p className="text-xs text-[#AAA6B5] mb-4">
              Cada ajuste manual é gravado com o nome do operador e requer motivo explícito para conformidade de auditoria.
            </p>

            <form onSubmit={handleSubmitAdjustment} className="space-y-4">
              {/* Product Select */}
              <div>
                <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                  Produto *
                </label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome} (Atual: {p.estoqueAtual} {p.unidade} - SKU: {p.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* Movement Type */}
              <div>
                <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                  Tipo de Movimentação *
                </label>
                <select
                  value={tipoAjuste}
                  onChange={e => setTipoAjuste(e.target.value as any)}
                  className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="ajuste_manual">Ajuste Manual (Balanço / Inventário)</option>
                  <option value="perda_avaria">Perda / Avaria / Quebra (Saída)</option>
                  <option value="vencimento">Vencimento de Validade (Baixa / Descarte)</option>
                  <option value="entrada_compra">Entrada Manual Avulsa (Incremento)</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                  Quantidade a movimentar (Use valor positivo para adicionar, negativo para subtrair) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    required
                    value={quantidadeAjuste}
                    onChange={e => setQuantidadeAjuste(e.target.value)}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-[#8B5CF6]"
                  />
                  {selectedProduct && (
                    <div className="text-xs text-[#AAA6B5] shrink-0">
                      Saldo resultante:{' '}
                      <strong className="text-white">
                        {Math.max(0, selectedProduct.estoqueAtual + (parseInt(quantidadeAjuste) || 0))} {selectedProduct.unidade}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                  Motivo / Justificativa detalhada *
                </label>
                <textarea
                  required
                  rows={2}
                  value={motivoAjuste}
                  onChange={e => setMotivoAjuste(e.target.value)}
                  placeholder="Ex: Garrafa trincada durante movimentação interna; Conferência de balanço quinzenal."
                  className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white placeholder-[#AAA6B5] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#262042]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#1A1633] text-[#AAA6B5] hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#8B5CF6]/30"
                >
                  {submitting ? 'Gravando...' : 'Confirmar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
