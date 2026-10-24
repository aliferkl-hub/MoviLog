import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  CommercialSupplier,
  CommercialPurchase,
  CommercialProduct
} from '../../types';
import {
  Truck,
  Plus,
  Search,
  Building2,
  FileText,
  Boxes,
  CheckCircle,
  AlertTriangle,
  Calendar,
  X,
  DollarSign,
  Phone,
  Mail,
  User
} from 'lucide-react';

interface CommercePurchasesViewProps {
  modulo: 'adega' | 'tabacaria';
}

export const CommercePurchasesView: React.FC<CommercePurchasesViewProps> = ({ modulo }) => {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<'purchases' | 'suppliers'>('purchases');
  const [suppliers, setSuppliers] = useState<CommercialSupplier[]>([]);
  const [purchases, setPurchases] = useState<CommercialPurchase[]>([]);
  const [products, setProducts] = useState<CommercialProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Supplier Modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpjCpf: '',
    contatoNome: '',
    telefone: '',
    email: '',
    endereco: '',
    segmento: modulo === 'adega' ? 'adega' : 'tabacaria',
    observacoes: '',
    ativo: true
  });

  // Purchase Modal
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    fornecedorId: '',
    numeroNota: '',
    formaPagamento: 'Boleto 30d',
    observacoes: '',
    itens: [] as { productId: string; quantidade: number; custoUnitario: number }[]
  });
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState('');
  const [qtdToAdd, setQtdToAdd] = useState('10');
  const [costToAdd, setCostToAdd] = useState('10.00');

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [supRes, purRes, prodRes] = await Promise.all([
        api.getCommerceSuppliers(),
        api.getCommercePurchases(),
        api.getCommerceProducts(modulo)
      ]);
      setSuppliers(supRes.suppliers || []);
      setPurchases(purRes.purchases || []);
      setProducts(prodRes.products || []);
      if (prodRes.products && prodRes.products.length > 0 && !selectedProductIdToAdd) {
        setSelectedProductIdToAdd(prodRes.products[0].id);
        setCostToAdd(prodRes.products[0].precoCusto.toFixed(2));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar dados de compras e fornecedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [modulo]);

  // Handle Supplier Submit
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.razaoSocial.trim()) {
      setErrorMsg('Razão Social ou Nome do fornecedor é obrigatório.');
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg(null);
      await api.createCommerceSupplier({
        ...supplierForm,
        segmento: supplierForm.segmento as any
      });
      setSuccessMsg('Fornecedor cadastrado com sucesso.');
      setIsSupplierModalOpen(false);
      setSupplierForm({
        razaoSocial: '',
        nomeFantasia: '',
        cnpjCpf: '',
        contatoNome: '',
        telefone: '',
        email: '',
        endereco: '',
        segmento: modulo === 'adega' ? 'adega' : 'tabacaria',
        observacoes: '',
        ativo: true
      });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar fornecedor.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Item to Purchase Form
  const handleAddItemToPurchase = () => {
    const prod = products.find(p => p.id === selectedProductIdToAdd);
    if (!prod) return;
    const qtd = parseInt(qtdToAdd) || 1;
    const cost = parseFloat(costToAdd) || prod.precoCusto;

    setPurchaseForm(prev => {
      const existing = prev.itens.find(i => i.productId === prod.id);
      if (existing) {
        return {
          ...prev,
          itens: prev.itens.map(i =>
            i.productId === prod.id ? { ...i, quantidade: i.quantidade + qtd, custoUnitario: cost } : i
          )
        };
      }
      return {
        ...prev,
        itens: [...prev.itens, { productId: prod.id, quantidade: qtd, custoUnitario: cost }]
      };
    });
  };

  const handleRemoveItemFromPurchase = (productId: string) => {
    setPurchaseForm(prev => ({
      ...prev,
      itens: prev.itens.filter(i => i.productId !== productId)
    }));
  };

  // Submit Purchase (updates inventory)
  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseForm.fornecedorId) {
      setErrorMsg('Selecione o fornecedor.');
      return;
    }
    if (purchaseForm.itens.length === 0) {
      setErrorMsg('Adicione pelo menos um produto recebido à compra.');
      return;
    }

    const sup = suppliers.find(s => s.id === purchaseForm.fornecedorId);

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await api.createCommercePurchase({
        fornecedorId: purchaseForm.fornecedorId,
        fornecedorNome: sup ? (sup.nomeFantasia || sup.razaoSocial) : 'Fornecedor',
        numeroNota: purchaseForm.numeroNota.trim() || undefined,
        formaPagamento: purchaseForm.formaPagamento.trim() || undefined,
        observacoes: purchaseForm.observacoes.trim() || undefined,
        itens: purchaseForm.itens
      });

      if (res.success) {
        setSuccessMsg('Compra registrada e estoque das mercadorias incrementado com sucesso.');
        setIsPurchaseModalOpen(false);
        setPurchaseForm({
          fornecedorId: '',
          numeroNota: '',
          formaPagamento: 'Boleto 30d',
          observacoes: '',
          itens: []
        });
        loadData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar compra.');
    } finally {
      setSubmitting(false);
    }
  };

  // Total calculated for purchase
  const totalPurchaseValue = purchaseForm.itens.reduce(
    (acc, it) => acc + it.quantidade * it.custoUnitario,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121024] border border-[#262042] rounded-2xl p-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#8B5CF6]" />
            Compras & Fornecedores — {modulo === 'adega' ? 'Adega' : 'Tabacaria'}
          </h2>
          <p className="text-xs text-[#AAA6B5]">
            Registro de notas de entrada, fornecedores homologados e incremento automático de estoque por recebimento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="px-3.5 py-2 bg-[#1A1633] hover:bg-[#262042] border border-[#2E2854] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
          >
            <Building2 className="w-4 h-4 text-[#8B5CF6]" />
            <span>Novo Fornecedor</span>
          </button>

          <button
            onClick={() => {
              if (suppliers.length > 0) {
                setPurchaseForm(prev => ({ ...prev, fornecedorId: suppliers[0].id }));
              }
              setIsPurchaseModalOpen(true);
            }}
            className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-[#8B5CF6]/30"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Compra / Entrada</span>
          </button>
        </div>
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

      {/* Tabs: Purchases vs Suppliers */}
      <div className="flex items-center gap-2 border-b border-[#262042] pb-2">
        <button
          onClick={() => setSubTab('purchases')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            subTab === 'purchases'
              ? 'bg-[#8B5CF6] text-white'
              : 'text-[#AAA6B5] hover:text-white hover:bg-[#121024]'
          }`}
        >
          Pedidos de Compra & Entradas ({purchases.length})
        </button>
        <button
          onClick={() => setSubTab('suppliers')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            subTab === 'suppliers'
              ? 'bg-[#8B5CF6] text-white'
              : 'text-[#AAA6B5] hover:text-white hover:bg-[#121024]'
          }`}
        >
          Fornecedores Cadastrados ({suppliers.length})
        </button>
      </div>

      {/* Purchases List */}
      {subTab === 'purchases' && (
        <div className="bg-[#121024] border border-[#262042] rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#AAA6B5]">Carregando pedidos de compra...</div>
          ) : purchases.length === 0 ? (
            <div className="p-12 text-center text-[#AAA6B5] space-y-2">
              <FileText className="w-10 h-10 mx-auto text-[#262042]" />
              <p className="text-sm font-semibold text-white">Nenhuma compra registrada ainda</p>
              <p className="text-xs">
                Registre compras com itens e custos para dar entrada automática nas mercadorias no estoque.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#262042] bg-[#0A0714]/60 text-[11px] font-bold text-[#AAA6B5] uppercase">
                    <th className="py-3 px-4">Data Compra</th>
                    <th className="py-3 px-4">Fornecedor</th>
                    <th className="py-3 px-4">Nota / Fatura</th>
                    <th className="py-3 px-4">Itens Recebidos</th>
                    <th className="py-3 px-4 text-right">Valor Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262042]/50">
                  {purchases.map(p => (
                    <tr key={p.id} className="hover:bg-[#1A1633]/30 transition">
                      <td className="py-3 px-4 text-[#AAA6B5] whitespace-nowrap">
                        {new Date(p.dataCompra).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{p.fornecedorNome}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#C4B5FD]">
                        {p.numeroNota || 'S/N'}
                      </td>
                      <td className="py-3 px-4 text-[#AAA6B5]">
                        <div className="space-y-0.5">
                          {p.itens.map((it, idx) => (
                            <div key={idx} className="text-[11px]">
                              • {it.quantidade}x {it.nome} (R$ {it.custoUnitario.toFixed(2)} un)
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-400">
                        R$ {p.valorTotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {p.status === 'recebido' ? 'Estoque Creditado' : p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Suppliers List */}
      {subTab === 'suppliers' && (
        <div className="bg-[#121024] border border-[#262042] rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#AAA6B5]">Carregando fornecedores...</div>
          ) : suppliers.length === 0 ? (
            <div className="p-12 text-center text-[#AAA6B5] space-y-2">
              <Building2 className="w-10 h-10 mx-auto text-[#262042]" />
              <p className="text-sm font-semibold text-white">Nenhum fornecedor cadastrado</p>
              <p className="text-xs">
                Cadastre seus distribuidores de bebidas ou tabacaria para vincular aos pedidos de compra e custos.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#262042] bg-[#0A0714]/60 text-[11px] font-bold text-[#AAA6B5] uppercase">
                    <th className="py-3 px-4">Fornecedor / Razão Social</th>
                    <th className="py-3 px-4">Nome Fantasia</th>
                    <th className="py-3 px-4">CNPJ / CPF</th>
                    <th className="py-3 px-4">Contato & Comercial</th>
                    <th className="py-3 px-4">Segmento</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262042]/50">
                  {suppliers.map(s => (
                    <tr key={s.id} className="hover:bg-[#1A1633]/30 transition">
                      <td className="py-3 px-4 font-bold text-white">{s.razaoSocial}</td>
                      <td className="py-3 px-4 text-[#AAA6B5]">{s.nomeFantasia || '-'}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#C4B5FD]">
                        {s.cnpjCpf || 'Não informado'}
                      </td>
                      <td className="py-3 px-4 text-[#AAA6B5] space-y-0.5">
                        {s.contatoNome && <div className="text-white font-medium">{s.contatoNome}</div>}
                        {s.telefone && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-[#8B5CF6]" />
                            <span>{s.telefone}</span>
                          </div>
                        )}
                        {s.email && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Mail className="w-3 h-3 text-[#8B5CF6]" />
                            <span>{s.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#8B5CF6]/10 text-[#C4B5FD] font-mono capitalize">
                          {s.segmento}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            s.ativo ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {s.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: New Supplier */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121024] border border-[#262042] rounded-3xl p-6 max-w-lg w-full shadow-2xl relative text-white">
            <button
              onClick={() => setIsSupplierModalOpen(false)}
              className="absolute top-4 right-4 text-[#AAA6B5] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#8B5CF6]" />
              Cadastrar Novo Fornecedor
            </h3>

            <form onSubmit={handleSaveSupplier} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Razão Social / Nome Empresarial *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierForm.razaoSocial}
                    onChange={e => setSupplierForm({ ...supplierForm, razaoSocial: e.target.value })}
                    placeholder="Ex: Distribuidora de Bebidas Brasil LTDA"
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={supplierForm.nomeFantasia}
                    onChange={e => setSupplierForm({ ...supplierForm, nomeFantasia: e.target.value })}
                    placeholder="Ex: Disbebidas"
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    CNPJ ou CPF
                  </label>
                  <input
                    type="text"
                    value={supplierForm.cnpjCpf}
                    onChange={e => setSupplierForm({ ...supplierForm, cnpjCpf: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Nome do Contato
                  </label>
                  <input
                    type="text"
                    value={supplierForm.contatoNome}
                    onChange={e => setSupplierForm({ ...supplierForm, contatoNome: e.target.value })}
                    placeholder="Representante comercial"
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={supplierForm.telefone}
                    onChange={e => setSupplierForm({ ...supplierForm, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    E-mail Comercial
                  </label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    placeholder="vendas@fornecedor.com.br"
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Segmento
                  </label>
                  <select
                    value={supplierForm.segmento}
                    onChange={e => setSupplierForm({ ...supplierForm, segmento: e.target.value })}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="adega">Adega & Bebidas</option>
                    <option value="tabacaria">Tabacaria & Headshop</option>
                    <option value="ambos">Ambos os Segmentos</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#262042]">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 bg-[#1A1633] text-[#AAA6B5] hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#8B5CF6]/30"
                >
                  {submitting ? 'Salvando...' : 'Salvar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Purchase */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121024] border border-[#262042] rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative text-white">
            <button
              onClick={() => setIsPurchaseModalOpen(false)}
              className="absolute top-4 right-4 text-[#AAA6B5] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#8B5CF6]" />
              Registrar Compra / Entrada de Mercadorias
            </h3>
            <p className="text-xs text-[#AAA6B5] mb-4">
              Ao confirmar a compra, o estoque de cada produto será incrementado automaticamente e o histórico de compras registrado.
            </p>

            <form onSubmit={handleSubmitPurchase} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Fornecedor */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Fornecedor *
                  </label>
                  <select
                    required
                    value={purchaseForm.fornecedorId}
                    onChange={e => setPurchaseForm({ ...purchaseForm, fornecedorId: e.target.value })}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="">Selecione o Fornecedor...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nomeFantasia || s.razaoSocial}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Número da Nota */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Número da Nota / Pedido
                  </label>
                  <input
                    type="text"
                    value={purchaseForm.numeroNota}
                    onChange={e => setPurchaseForm({ ...purchaseForm, numeroNota: e.target.value })}
                    placeholder="Ex: NF-e 1042"
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              {/* Add Item Subsection */}
              <div className="bg-[#0A0714] border border-[#262042] rounded-2xl p-3 space-y-2">
                <span className="text-xs font-bold text-white block">Adicionar Produtos Recebidos:</span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <select
                      value={selectedProductIdToAdd}
                      onChange={e => {
                        setSelectedProductIdToAdd(e.target.value);
                        const prod = products.find(p => p.id === e.target.value);
                        if (prod) setCostToAdd(prod.precoCusto.toFixed(2));
                      }}
                      className="w-full bg-[#121024] border border-[#262042] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qtd"
                      value={qtdToAdd}
                      onChange={e => setQtdToAdd(e.target.value)}
                      className="w-full bg-[#121024] border border-[#262042] rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Custo un"
                      value={costToAdd}
                      onChange={e => setCostToAdd(e.target.value)}
                      className="w-full bg-[#121024] border border-[#262042] rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItemToPurchase}
                      className="w-full py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-bold transition"
                    >
                      + Incluir
                    </button>
                  </div>
                </div>

                {/* Items in purchase list */}
                {purchaseForm.itens.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-[#262042] max-h-36 overflow-y-auto">
                    {purchaseForm.itens.map(it => {
                      const prod = products.find(p => p.id === it.productId);
                      return (
                        <div
                          key={it.productId}
                          className="flex items-center justify-between text-xs bg-[#121024] p-2 rounded-xl"
                        >
                          <span className="text-white font-medium truncate max-w-[200px]">
                            {prod?.nome || 'Produto'}
                          </span>
                          <span className="text-[#AAA6B5]">
                            {it.quantidade} un x R$ {it.custoUnitario.toFixed(2)} = R${' '}
                            {(it.quantidade * it.custoUnitario).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromPurchase(it.productId)}
                            className="text-rose-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Total Summary */}
              <div className="flex justify-between items-center text-sm font-bold pt-2">
                <span className="text-white">Valor Total da Compra:</span>
                <span className="text-emerald-400 font-black text-base">
                  R$ {totalPurchaseValue.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#262042]">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 bg-[#1A1633] text-[#AAA6B5] hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#8B5CF6]/30 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{submitting ? 'Salvando...' : 'Confirmar e Atualizar Estoque'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
