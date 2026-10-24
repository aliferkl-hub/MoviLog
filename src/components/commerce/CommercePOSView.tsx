import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { CommercialProduct, CommercialSale, CommercialCashSession } from '../../types';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Printer,
  DollarSign,
  CreditCard,
  QrCode,
  ShieldAlert,
  ArrowRight,
  User,
  Barcode,
  RotateCcw,
  Receipt,
  X
} from 'lucide-react';

interface CommercePOSViewProps {
  modulo: 'adega' | 'tabacaria';
  onNavigateToCash?: () => void;
}

interface CartItem {
  product: CommercialProduct;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
}

export const CommercePOSView: React.FC<CommercePOSViewProps> = ({ modulo, onNavigateToCash }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<CommercialProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [descontoGeral, setDescontoGeral] = useState<number>(0);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteDocumento, setClienteDocumento] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito'>('dinheiro');
  const [valorPago, setValorPago] = useState<string>('');
  const [verificacaoMaioridade, setVerificacaoMaioridade] = useState(false);
  const [currentCashSession, setCurrentCashSession] = useState<CommercialCashSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<CommercialSale | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [prodRes, cashRes] = await Promise.all([
        api.getCommerceProducts(modulo),
        api.getCurrentCashSession(modulo)
      ]);
      setProducts(prodRes.products || []);
      setCurrentCashSession(cashRes.session || null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar dados do PDV.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [modulo]);

  // Categories list based on module
  const categories = Array.from(new Set(products.map(p => p.categoria))).filter(Boolean);

  // Filtered products for quick selection
  const filteredProducts = products.filter(p => {
    if (!p.ativo) return false;
    const matchesSearch =
      p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.codigoBarras && p.codigoBarras.includes(searchQuery));
    const matchesCat = selectedCategory === 'all' || p.categoria === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Check if any cart item requires 18+ age verification
  const hasRestrictedItems = cart.some(item => item.product.idadeMinima >= 18);

  // Cart operations
  const addToCart = (product: CommercialProduct) => {
    if (product.estoqueAtual <= 0) {
      setErrorMsg(`Produto "${product.nome}" sem estoque disponível.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantidade + 1 > product.estoqueAtual) {
          setErrorMsg(`Quantidade solicitada excede o estoque disponível (${product.estoqueAtual} un).`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantidade: 1,
          precoUnitario: product.precoVenda,
          desconto: 0
        }
      ];
    });
    setErrorMsg(null);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const novaQtd = item.quantidade + delta;
            if (novaQtd > item.product.estoqueAtual) {
              setErrorMsg(`Estoque insuficiente. Máximo disponível: ${item.product.estoqueAtual} un.`);
              return item;
            }
            return novaQtd > 0 ? { ...item, quantidade: novaQtd } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDescontoGeral(0);
    setValorPago('');
    setVerificacaoMaioridade(false);
    setErrorMsg(null);
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0);
  const valorTotal = Math.max(0, subtotal - (Number(descontoGeral) || 0));
  const numValorPago = parseFloat(valorPago) || 0;
  const troco = formaPagamento === 'dinheiro' && numValorPago > valorTotal ? numValorPago - valorTotal : 0;

  // Handle direct Barcode / Enter key in search box
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = searchQuery.trim();
      if (!code) return;
      const exactMatch = products.find(
        p => (p.codigoBarras && p.codigoBarras === code) || p.sku.toLowerCase() === code.toLowerCase()
      );
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery('');
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchQuery('');
      }
    }
  };

  // Finalize Sale
  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      setErrorMsg('O carrinho está vazio.');
      return;
    }

    if (hasRestrictedItems && !verificacaoMaioridade) {
      setErrorMsg('Atenção: A venda contém itens de controle restrito (álcool/tabaco). Confirme a verificação de maioridade legal (18+ anos).');
      return;
    }

    if (formaPagamento === 'dinheiro' && numValorPago > 0 && numValorPago < valorTotal) {
      setErrorMsg(`Valor pago em dinheiro (R$ ${numValorPago.toFixed(2)}) é inferior ao total (R$ ${valorTotal.toFixed(2)}).`);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        modulo,
        itens: cart.map(item => ({
          productId: item.product.id,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          desconto: item.desconto
        })),
        formaPagamento,
        valorPago: formaPagamento === 'dinheiro' ? (numValorPago || valorTotal) : valorTotal,
        descontoGeral: Number(descontoGeral) || 0,
        clienteNome: clienteNome.trim() || undefined,
        clienteDocumento: clienteDocumento.trim() || undefined,
        verificacaoMaioridade: hasRestrictedItems ? verificacaoMaioridade : true
      };

      const res = await api.createCommerceSale(payload);
      if (res.success && res.sale) {
        setCompletedSale(res.sale);
        clearCart();
        // Refresh products to update stock numbers
        const prodRes = await api.getCommerceProducts(modulo);
        setProducts(prodRes.products || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar venda no PDV.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Caixa Session Status Alert */}
      {!currentCashSession && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-amber-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-bold">Nenhum caixa aberto para o operador atual</p>
              <p className="text-xs text-amber-200/80">
                As vendas serão registradas normalmente, mas é recomendável abrir o caixa para controle de suprimento e sangria.
              </p>
            </div>
          </div>
          {onNavigateToCash && (
            <button
              onClick={onNavigateToCash}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold rounded-xl transition shrink-0"
            >
              Abrir Caixa Agora
            </button>
          )}
        </div>
      )}

      {/* Main Grid: Catalog (left) & Cart/Checkout (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Product Search & Quick Grid */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search bar & Barcode simulator */}
          <div className="bg-[#121024] border border-[#262042] rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-[#AAA6B5]" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Buscar por nome, SKU ou Código de Barras (Enter para bipar)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full bg-[#0A0714] border border-[#262042] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#AAA6B5] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#1A1633] border border-[#2E2854] rounded-xl text-[11px] text-[#C4B5FD]">
                <Barcode className="w-4 h-4 text-[#8B5CF6]" />
                <span>Leitor Ativo</span>
              </div>
            </div>
          </div>

          {/* Categories Pill Bar */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-[#121024] text-[#AAA6B5] hover:text-white border border-[#262042]'
                }`}
              >
                Todos ({products.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#8B5CF6] text-white'
                      : 'bg-[#121024] text-[#AAA6B5] hover:text-white border border-[#262042]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Product Cards Grid */}
          {loading ? (
            <div className="bg-[#121024] border border-[#262042] rounded-2xl p-12 text-center text-[#AAA6B5] text-xs">
              Carregando catálogo de {modulo === 'adega' ? 'Adega' : 'Tabacaria'}...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-[#121024] border border-[#262042] rounded-2xl p-12 text-center text-[#AAA6B5] space-y-2">
              <p className="text-sm font-semibold text-white">Nenhum produto encontrado</p>
              <p className="text-xs">
                {products.length === 0
                  ? 'Cadastre novos produtos na aba "Produtos" ou carregue a carga inicial de exemplo.'
                  : 'Nenhum produto corresponde à busca ou categoria selecionada.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
              {filteredProducts.map(prod => {
                const isOutOfStock = prod.estoqueAtual <= 0;
                const isLowStock = prod.estoqueAtual > 0 && prod.estoqueAtual <= prod.estoqueMinimo;

                return (
                  <button
                    key={prod.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(prod)}
                    className={`text-left p-3 rounded-2xl border transition flex flex-col justify-between ${
                      isOutOfStock
                        ? 'bg-[#0E0C1A] border-rose-950/40 opacity-50 cursor-not-allowed'
                        : 'bg-[#121024] border-[#262042] hover:border-[#8B5CF6] hover:shadow-lg hover:shadow-[#8B5CF6]/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-mono uppercase text-[#8B5CF6] px-1.5 py-0.5 rounded bg-[#8B5CF6]/10 truncate max-w-[90px]">
                          {prod.categoria}
                        </span>
                        {prod.idadeMinima >= 18 && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded shrink-0">
                            +18
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug mb-1">
                        {prod.nome}
                      </h4>
                      <p className="text-[10px] text-[#AAA6B5] font-mono">
                        SKU: {prod.sku}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#262042]/50 flex items-end justify-between">
                      <div>
                        <div className="text-sm font-black text-emerald-400">
                          R$ {prod.precoVenda.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-[#AAA6B5]">
                          Estoque: {prod.estoqueAtual} {prod.unidade}
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-xl bg-[#8B5CF6]/20 text-[#C4B5FD] flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Cart, Subtotal, 18+ Verification & Payment */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#121024] border border-[#262042] rounded-2xl p-5 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#262042]">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#8B5CF6]" />
                  <h3 className="text-sm font-bold text-white">Carrinho de Compras</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#C4B5FD] font-semibold">
                    {cart.reduce((a, b) => a + b.quantidade, 0)} itens
                  </span>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar
                  </button>
                )}
              </div>

              {/* Error message */}
              {errorMsg && (
                <div className="mb-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="py-12 text-center text-[#AAA6B5] space-y-2">
                  <ShoppingCart className="w-10 h-10 mx-auto text-[#262042]" />
                  <p className="text-xs">O carrinho está vazio.</p>
                  <p className="text-[11px] text-[#716A86]">Selecione produtos ao lado ou use o leitor de código de barras.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div
                      key={item.product.id}
                      className="bg-[#0A0714] border border-[#262042] rounded-xl p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-white truncate">{item.product.nome}</p>
                          {item.product.idadeMinima >= 18 && (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1 rounded">
                              +18
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#AAA6B5]">
                          R$ {item.precoUnitario.toFixed(2)} cada
                        </p>
                      </div>

                      {/* Qtd Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded-lg bg-[#1A1633] text-[#AAA6B5] hover:text-white flex items-center justify-center transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white w-6 text-center">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded-lg bg-[#1A1633] text-[#AAA6B5] hover:text-white flex items-center justify-center transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right shrink-0 min-w-[70px]">
                        <span className="text-xs font-bold text-emerald-400">
                          R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-[#AAA6B5] hover:text-rose-400 p-1 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom: Totals, Discounts, Payment & 18+ Check */}
            {cart.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#262042] space-y-3">
                {/* 18+ Verification Checkbox (Legal requirement) */}
                {hasRestrictedItems && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-amber-300">
                        Controle Legal de Idade (+18 Anos)
                      </p>
                      <p className="text-[11px] text-amber-200/80 mb-2 leading-tight">
                        Este pedido contém bebidas alcoólicas ou artigos de tabacaria. É proibida a venda para menores de 18 anos (Lei 8.069/90 e Lei 13.106/15).
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={verificacaoMaioridade}
                          onChange={e => setVerificacaoMaioridade(e.target.checked)}
                          className="w-4 h-4 rounded text-[#8B5CF6] focus:ring-0 bg-[#0A0714] border-[#262042]"
                        />
                        <span className="text-xs font-semibold text-white">
                          Confirmo que o cliente possui 18 anos ou mais (documento verificado)
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Subtotal & Discount */}
                <div className="space-y-1.5 text-xs text-[#AAA6B5]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-white">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Desconto (R$):</span>
                    <input
                      type="number"
                      min="0"
                      step="0.50"
                      value={descontoGeral || ''}
                      onChange={e => setDescontoGeral(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0,00"
                      className="w-24 bg-[#0A0714] border border-[#262042] rounded-lg px-2 py-1 text-right text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>
                  <div className="flex justify-between text-base font-black text-white pt-1 border-t border-[#262042]">
                    <span>Total a Pagar:</span>
                    <span className="text-emerald-400">R$ {valorTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="text-[11px] font-semibold text-[#AAA6B5] mb-1.5 block">
                    Forma de Pagamento:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormaPagamento('dinheiro')}
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                        formaPagamento === 'dinheiro'
                          ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-white'
                          : 'bg-[#0A0714] border-[#262042] text-[#AAA6B5] hover:text-white'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-bold">Dinheiro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormaPagamento('pix')}
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                        formaPagamento === 'pix'
                          ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-white'
                          : 'bg-[#0A0714] border-[#262042] text-[#AAA6B5] hover:text-white'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-cyan-400" />
                      <span className="text-[10px] font-bold">PIX</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormaPagamento('cartao_debito')}
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                        formaPagamento === 'cartao_debito'
                          ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-white'
                          : 'bg-[#0A0714] border-[#262042] text-[#AAA6B5] hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-blue-400" />
                      <span className="text-[10px] font-bold">Débito</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormaPagamento('cartao_credito')}
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                        formaPagamento === 'cartao_credito'
                          ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-white'
                          : 'bg-[#0A0714] border-[#262042] text-[#AAA6B5] hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-purple-400" />
                      <span className="text-[10px] font-bold">Crédito</span>
                    </button>
                  </div>
                </div>

                {/* Cash received & change calculation */}
                {formaPagamento === 'dinheiro' && (
                  <div className="bg-[#0A0714] border border-[#262042] rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#AAA6B5]">Valor Recebido (R$):</span>
                      <input
                        type="number"
                        min={valorTotal}
                        step="1.00"
                        placeholder={valorTotal.toFixed(2)}
                        value={valorPago}
                        onChange={e => setValorPago(e.target.value)}
                        className="w-28 bg-[#121024] border border-[#262042] rounded-lg px-2 py-1 text-right text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                      />
                    </div>
                    {troco > 0 && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#262042]">
                        <span className="font-semibold text-amber-400">Troco a devolver:</span>
                        <span className="font-bold text-amber-400 text-sm">R$ {troco.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Optional Customer Identification */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Nome do Cliente (opcional)"
                    value={clienteNome}
                    onChange={e => setClienteNome(e.target.value)}
                    className="bg-[#0A0714] border border-[#262042] rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-[#AAA6B5] focus:outline-none focus:border-[#8B5CF6]"
                  />
                  <input
                    type="text"
                    placeholder="CPF/CNPJ (opcional)"
                    value={clienteDocumento}
                    onChange={e => setClienteDocumento(e.target.value)}
                    className="bg-[#0A0714] border border-[#262042] rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-[#AAA6B5] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                {/* Confirm Sale Button */}
                <button
                  type="button"
                  disabled={submitting || (hasRestrictedItems && !verificacaoMaioridade)}
                  onClick={handleFinalizeSale}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg ${
                    submitting || (hasRestrictedItems && !verificacaoMaioridade)
                      ? 'bg-[#1A1633] text-[#716A86] cursor-not-allowed border border-[#262042]'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30'
                  }`}
                >
                  {submitting ? (
                    <span>Processando e Atualizando Estoque...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirmar Venda (R$ {valorTotal.toFixed(2)})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completed Sale Voucher Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121024] border border-[#8B5CF6]/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-white">
            <button
              onClick={() => setCompletedSale(null)}
              className="absolute top-4 right-4 text-[#AAA6B5] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/40">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Venda Confirmada com Sucesso!</h3>
              <p className="text-xs text-[#AAA6B5]">Código: {completedSale.codigoVenda}</p>
            </div>

            {/* Printable Voucher Section */}
            <div id="sale-receipt" className="bg-[#0A0714] border border-[#262042] rounded-2xl p-4 text-xs font-mono space-y-2 mb-4 text-[#C4B5FD]">
              <div className="text-center border-b border-[#262042] pb-2 text-[11px] font-sans">
                <p className="font-bold text-white uppercase">MoviLog Comercial — {completedSale.modulo.toUpperCase()}</p>
                <p className="text-[#AAA6B5] text-[10px]">{new Date(completedSale.criadoEm).toLocaleString('pt-BR')}</p>
                <p className="text-[#AAA6B5] text-[10px]">Operador: {completedSale.operadorNome}</p>
              </div>

              <div className="space-y-1 py-1 border-b border-[#262042]">
                {completedSale.itens.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[200px] text-white">
                      {it.quantidade}x {it.nome}
                    </span>
                    <span className="text-emerald-400">R$ {it.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-0.5 text-[11px] pt-1">
                <div className="flex justify-between">
                  <span className="text-[#AAA6B5]">Subtotal:</span>
                  <span>R$ {completedSale.subtotal.toFixed(2)}</span>
                </div>
                {completedSale.descontoTotal > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Desconto:</span>
                    <span>- R$ {completedSale.descontoTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-white text-xs pt-1 border-t border-[#262042]">
                  <span>TOTAL:</span>
                  <span className="text-emerald-400">R$ {completedSale.valorTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-[#AAA6B5]">
                  <span>Pagamento:</span>
                  <span className="uppercase text-white">{completedSale.formaPagamento}</span>
                </div>
                {completedSale.troco && completedSale.troco > 0 ? (
                  <div className="flex justify-between text-[10px] text-amber-400">
                    <span>Troco:</span>
                    <span>R$ {completedSale.troco.toFixed(2)}</span>
                  </div>
                ) : null}
              </div>

              {completedSale.verificacaoMaioridade && (
                <div className="pt-2 border-t border-[#262042] text-[9px] text-[#AAA6B5] text-center italic">
                  [Venda auditada com verificação de maioridade 18+]
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 px-4 bg-[#1A1633] hover:bg-[#262042] border border-[#2E2854] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4 text-[#8B5CF6]" />
                <span>Imprimir Comprovante</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 px-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold rounded-xl transition"
              >
                Nova Venda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
