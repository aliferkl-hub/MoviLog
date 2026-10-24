import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { CommercialProduct, CommercialSupplier } from '../../types';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Barcode,
  Layers,
  ArrowUpDown,
  X,
  ShieldAlert
} from 'lucide-react';

interface CommerceProductsViewProps {
  modulo: 'adega' | 'tabacaria';
  onNavigateToStock?: () => void;
}

const ADEGA_CATEGORIES = [
  'Cervejas',
  'Vinhos & Espumantes',
  'Destilados (Gin, Vodka, Whisky)',
  'Bebidas Não Alcoólicas',
  'Água Mineral',
  'Refrigerantes',
  'Energéticos',
  'Gelo & Copos',
  'Snacks & Petiscos'
];

const TABACARIA_CATEGORIES = [
  'Sedas & Folhas',
  'Filtros & Tips',
  'Piteiras (Vidro / Madeira)',
  'Isqueiros & Maçaricos',
  'Tabacos Naturais & Desfiados',
  'Charutos & Cigarrilhas',
  'Palheiros Artesanais',
  'Dichavadores & Trituradores',
  'Cinzeiros & Bandejas',
  'Artigos Headshop & Acessórios'
];

export const CommerceProductsView: React.FC<CommerceProductsViewProps> = ({ modulo, onNavigateToStock }) => {
  const { user, isMaster } = useAuth();
  const [products, setProducts] = useState<CommercialProduct[]>([]);
  const [suppliers, setSuppliers] = useState<CommercialSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CommercialProduct | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    sku: '',
    codigoBarras: '',
    categoria: modulo === 'adega' ? ADEGA_CATEGORIES[0] : TABACARIA_CATEGORIES[0],
    descricao: '',
    marca: '',
    fornecedorId: '',
    precoCusto: '0.00',
    precoVenda: '0.00',
    estoqueAtual: '0',
    estoqueMinimo: '5',
    unidade: 'un',
    fotoUrl: '',
    idadeMinima: '18',
    ativo: true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [prodRes, supRes] = await Promise.all([
        api.getCommerceProducts(modulo),
        api.getCommerceSuppliers()
      ]);
      setProducts(prodRes.products || []);
      setSuppliers(supRes.suppliers || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [modulo]);

  const defaultCategories = modulo === 'adega' ? ADEGA_CATEGORIES : TABACARIA_CATEGORIES;

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      nome: '',
      sku: `${modulo === 'adega' ? 'ADG' : 'TAB'}-${Date.now().toString().slice(-5)}`,
      codigoBarras: '',
      categoria: defaultCategories[0],
      descricao: '',
      marca: '',
      fornecedorId: '',
      precoCusto: '0.00',
      precoVenda: '0.00',
      estoqueAtual: '0',
      estoqueMinimo: '5',
      unidade: 'un',
      fotoUrl: '',
      idadeMinima: '18',
      ativo: true
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (p: CommercialProduct) => {
    setEditingProduct(p);
    setFormData({
      nome: p.nome,
      sku: p.sku,
      codigoBarras: p.codigoBarras || '',
      categoria: p.categoria,
      descricao: p.descricao || '',
      marca: p.marca || '',
      fornecedorId: p.fornecedorId || '',
      precoCusto: p.precoCusto.toFixed(2),
      precoVenda: p.precoVenda.toFixed(2),
      estoqueAtual: p.estoqueAtual.toString(),
      estoqueMinimo: p.estoqueMinimo.toString(),
      unidade: p.unidade,
      fotoUrl: p.fotoUrl || '',
      idadeMinima: p.idadeMinima.toString(),
      ativo: p.ativo
    });
    setIsModalOpen(true);
  };

  // Submit Product (Create or Update)
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setErrorMsg('O nome do produto é obrigatório.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        modulo,
        nome: formData.nome.trim(),
        sku: formData.sku.trim() || `${modulo.toUpperCase()}-${Date.now().toString().slice(-4)}`,
        codigoBarras: formData.codigoBarras.trim() || undefined,
        categoria: formData.categoria,
        descricao: formData.descricao.trim() || undefined,
        marca: formData.marca.trim() || undefined,
        fornecedorId: formData.fornecedorId || undefined,
        precoCusto: Math.max(0, parseFloat(formData.precoCusto) || 0),
        precoVenda: Math.max(0, parseFloat(formData.precoVenda) || 0),
        estoqueAtual: Math.max(0, parseInt(formData.estoqueAtual) || 0),
        estoqueMinimo: Math.max(0, parseInt(formData.estoqueMinimo) || 0),
        unidade: formData.unidade.trim() || 'un',
        fotoUrl: formData.fotoUrl.trim() || undefined,
        idadeMinima: parseInt(formData.idadeMinima) || 0,
        ativo: formData.ativo
      };

      if (editingProduct) {
        await api.updateCommerceProduct(editingProduct.id, payload);
        setSuccessMsg('Produto atualizado com sucesso.');
      } else {
        await api.createCommerceProduct(payload);
        setSuccessMsg('Produto cadastrado com sucesso.');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar produto.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o produto "${nome}"?`)) return;
    try {
      await api.deleteCommerceProduct(id);
      setSuccessMsg(`Produto "${nome}" removido.`);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao remover produto.');
    }
  };

  // Seed sample products
  const handleSeedSamples = async () => {
    try {
      setSeeding(true);
      setErrorMsg(null);
      const res = await api.seedSampleCommerceProducts(modulo);
      setSuccessMsg(res.message);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar produtos de exemplo.');
    } finally {
      setSeeding(false);
    }
  };

  // Filtered list
  const filtered = products.filter(p => {
    const matchesSearch =
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.codigoBarras && p.codigoBarras.includes(search));
    const matchesCat = selectedCategory === 'all' || p.categoria === selectedCategory;
    const matchesLow = filterLowStock ? p.estoqueAtual <= p.estoqueMinimo : true;
    return matchesSearch && matchesCat && matchesLow;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121024] border border-[#262042] rounded-2xl p-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-[#8B5CF6]" />
            Catálogo de Produtos — {modulo === 'adega' ? 'Adega & Bebidas' : 'Tabacaria & Headshop'}
          </h2>
          <p className="text-xs text-[#AAA6B5]">
            Cadastro completo, precificação, código de barras e controle de estoque mínimo.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {products.length === 0 && (
            <button
              onClick={handleSeedSamples}
              disabled={seeding}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-amber-900/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>{seeding ? 'Carregando Exemplos...' : 'Carregar Catálogo de Exemplo'}</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-[#8B5CF6]/30"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
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

      {/* Filter and Search Bar */}
      <div className="bg-[#121024] border border-[#262042] rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#AAA6B5]" />
          <input
            type="text"
            placeholder="Filtrar por nome, SKU ou Código de barras..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0A0714] border border-[#262042] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#AAA6B5] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="all">Todas as Categorias</option>
            {defaultCategories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
              filterLowStock
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-[#0A0714] border-[#262042] text-[#AAA6B5] hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Estoque Baixo</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#121024] border border-[#262042] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#AAA6B5]">Carregando produtos...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[#AAA6B5] space-y-3">
            <Package className="w-10 h-10 mx-auto text-[#262042]" />
            <p className="text-sm font-semibold text-white">Nenhum produto cadastrado ou encontrado</p>
            <p className="text-xs max-w-md mx-auto">
              Utilize o botão "Novo Produto" para adicionar itens individualmente ou clique em "Carregar Catálogo de Exemplo" para carregar itens representativos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#262042] bg-[#0A0714]/60 text-[11px] font-bold text-[#AAA6B5] uppercase tracking-wider">
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">SKU / Cód. Barras</th>
                  <th className="py-3 px-4 text-right">Preço Custo</th>
                  <th className="py-3 px-4 text-right">Preço Venda</th>
                  <th className="py-3 px-4 text-right">Margem</th>
                  <th className="py-3 px-4 text-center">Estoque</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262042]/50 text-xs">
                {filtered.map(p => {
                  const isLow = p.estoqueAtual <= p.estoqueMinimo;
                  const isOut = p.estoqueAtual <= 0;
                  const margemValor = p.precoVenda - p.precoCusto;
                  const margemPercentual = p.precoCusto > 0 ? (margemValor / p.precoCusto) * 100 : 0;

                  return (
                    <tr key={p.id} className="hover:bg-[#1A1633]/30 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-bold text-white flex items-center gap-1.5">
                              {p.nome}
                              {p.idadeMinima >= 18 && (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1 rounded">
                                  +18
                                </span>
                              )}
                            </p>
                            {p.marca && <p className="text-[10px] text-[#AAA6B5]">{p.marca}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#8B5CF6]/10 text-[#C4B5FD] font-mono">
                          {p.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#AAA6B5]">
                        <div>{p.sku}</div>
                        {p.codigoBarras && <div className="text-[10px] text-[#716A86]">{p.codigoBarras}</div>}
                      </td>
                      <td className="py-3 px-4 text-right text-[#AAA6B5]">
                        R$ {p.precoCusto.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">
                        R$ {p.precoVenda.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`text-[11px] font-semibold ${
                            margemValor > 0 ? 'text-teal-400' : 'text-rose-400'
                          }`}
                        >
                          {margemPercentual.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isOut
                                ? 'bg-rose-500/20 text-rose-400'
                                : isLow
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {p.estoqueAtual} {p.unidade}
                          </span>
                          <span className="text-[9px] text-[#AAA6B5] mt-0.5">mín: {p.estoqueMinimo}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            p.ativo ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {p.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Editar Produto"
                            className="p-1.5 rounded-lg bg-[#1A1633] text-[#C4B5FD] hover:text-white hover:bg-[#8B5CF6]/30 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.nome)}
                            title="Excluir Produto"
                            className="p-1.5 rounded-lg bg-[#1A1633] text-rose-400 hover:text-white hover:bg-rose-600/30 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121024] border border-[#262042] rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative text-white">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#AAA6B5] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#8B5CF6]" />
              {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </h3>

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Cerveja IPA Artesanal 500ml"
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Código SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                {/* Código de Barras EAN */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Código de Barras (EAN-13 / GTIN)
                  </label>
                  <input
                    type="text"
                    value={formData.codigoBarras}
                    onChange={e => setFormData({ ...formData, codigoBarras: e.target.value })}
                    placeholder="Ex: 7891991000826"
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Categoria *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  >
                    {defaultCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Marca */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Marca / Fabricante
                  </label>
                  <input
                    type="text"
                    value={formData.marca}
                    onChange={e => setFormData({ ...formData, marca: e.target.value })}
                    placeholder="Ex: Colorado, Raw, Zomo"
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                {/* Preço de Custo */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Preço de Custo (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.precoCusto}
                    onChange={e => setFormData({ ...formData, precoCusto: e.target.value })}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                {/* Preço de Venda */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.precoVenda}
                    onChange={e => setFormData({ ...formData, precoVenda: e.target.value })}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                {/* Estoque Inicial / Atual */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Quantidade em Estoque *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.estoqueAtual}
                    onChange={e => setFormData({ ...formData, estoqueAtual: e.target.value })}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                {/* Estoque Mínimo */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.estoqueMinimo}
                    onChange={e => setFormData({ ...formData, estoqueMinimo: e.target.value })}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                {/* Unidade */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Unidade de Medida
                  </label>
                  <select
                    value={formData.unidade}
                    onChange={e => setFormData({ ...formData, unidade: e.target.value })}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="lata">Lata</option>
                    <option value="garrafa">Garrafa</option>
                    <option value="pack">Pack / Fardo</option>
                    <option value="caixa">Caixa</option>
                    <option value="pacote">Pacote</option>
                  </select>
                </div>

                {/* Idade Mínima (+18 check) */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Classificação Etária Legal
                  </label>
                  <select
                    value={formData.idadeMinima}
                    onChange={e => setFormData({ ...formData, idadeMinima: e.target.value })}
                    className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="18">Restrito a Maiores de 18 anos (+18)</option>
                    <option value="0">Livre para todas as idades (Água, Refrigerante, etc)</option>
                  </select>
                </div>

                {/* Status Ativo */}
                <div className="flex items-center gap-2 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                      className="w-4 h-4 rounded text-[#8B5CF6] focus:ring-0 bg-[#0A0714] border-[#262042]"
                    />
                    <span>Produto Ativo para Venda no PDV</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#262042]">
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
                  className="px-5 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#8B5CF6]/30 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{submitting ? 'Salvando...' : 'Salvar Produto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
