import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { CommercialProduct, CommercialSale, CommercialCashSession, PixCharge, CommercialTerminal } from '../../types';
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
  Barcode,
  X,
  Copy,
  RefreshCw,
  ArrowLeft,
  Clock,
  ShieldCheck,
  Receipt,
  Wifi,
  WifiOff,
  Smartphone,
  Battery,
  Terminal
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
  const [verificacaoMaioridade, setVerificacaoMaioridade] = useState(false);
  const [currentCashSession, setCurrentCashSession] = useState<CommercialCashSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<CommercialSale | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito'>('dinheiro');
  const [dinheiroRecebido, setDinheiroRecebido] = useState<string>('');

  // PIX state
  const [pixCharge, setPixCharge] = useState<PixCharge | null>(null);
  const [pixQrCodeDataUrl, setPixQrCodeDataUrl] = useState<string>('');
  const [pixLoading, setPixLoading] = useState(false);
  const [pixPolling, setPixPolling] = useState(false);
  const [pixManualComprovante, setPixManualComprovante] = useState('');
  const [pixProviderStatus, setPixProviderStatus] = useState<any>(null);

  // Card POS State
  const [cartaoBandeira, setCartaoBandeira] = useState('Visa');
  const [cartaoNsu, setCartaoNsu] = useState('');
  const [cartaoAprovadoConfirmado, setCartaoAprovadoConfirmado] = useState(false);
  const [cartaoStatus, setCartaoStatus] = useState<'aguardando' | 'aprovado' | 'recusado'>('aguardando');

  // Multi-Provider Terminal Hardware Integration State
  const [terminals, setTerminals] = useState<CommercialTerminal[]>([]);
  const [selectedTerminal, setSelectedTerminal] = useState<CommercialTerminal | null>(null);
  const [terminalDispatching, setTerminalDispatching] = useState(false);
  const [terminalWaitingApproval, setTerminalWaitingApproval] = useState(false);
  const [activePaymentIntentId, setActivePaymentIntentId] = useState<string | null>(null);
  const [isManualPosMode, setIsManualPosMode] = useState(false);
  const [terminalMessage, setTerminalMessage] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [prodRes, cashRes, pixInfoRes, termRes] = await Promise.all([
        api.getCommerceProducts(modulo),
        api.getCurrentCashSession(modulo),
        api.getPixProviderInfo(),
        api.getCommercialTerminals({ modulo, ativo: 'true' })
      ]);
      setProducts(prodRes.products || []);
      setCurrentCashSession(cashRes.session || null);
      setPixProviderStatus(pixInfoRes);
      
      const termList = termRes.terminals || [];
      setTerminals(termList);
      if (termList.length > 0) {
        const defaultTerm = termList.find(t => t.padrao) || termList[0];
        setSelectedTerminal(defaultTerm);
        if (defaultTerm.provedor === 'pos_manual') {
          setIsManualPosMode(true);
        }
      }
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

  // Check which cart items have legal 18+ age restriction
  // Items without restriction (sedas, filtros, piteiras, dichavadores, cinzeiros, isqueiros, água, etc.)
  // are classificacaoLegal === 'sem_restricao' and DO NOT trigger age verification!
  const restrictedCartItems = cart.filter(item => {
    const classif = item.product.classificacaoLegal;
    if (classif === 'bebida_alcoolica' || classif === 'tabaco_derivados' || classif === 'outro_restrito') {
      return true;
    }
    if (classif === 'sem_restricao') {
      return false;
    }
    // Fallback for legacy items
    return item.product.idadeMinima >= 18;
  });

  const hasRestrictedItems = restrictedCartItems.length > 0;

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
    setDinheiroRecebido('');
    setVerificacaoMaioridade(false);
    setErrorMsg(null);
    setIsPaymentModalOpen(false);
    setPixCharge(null);
    setPixQrCodeDataUrl('');
    setCartaoAprovadoConfirmado(false);
    setCartaoNsu('');
    setCartaoStatus('aguardando');
    setTerminalWaitingApproval(false);
    setActivePaymentIntentId(null);
    setTerminalMessage(null);
  };

  // Totals calculations
  const subtotal = cart.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0);
  const valorTotal = Math.max(0, subtotal - (Number(descontoGeral) || 0));
  const numDinheiroRecebido = parseFloat(dinheiroRecebido) || 0;
  const trocoDinheiro = formaPagamento === 'dinheiro' && numDinheiroRecebido > valorTotal ? numDinheiroRecebido - valorTotal : 0;

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

  // Open Payment Modal
  const handleOpenPayment = () => {
    if (cart.length === 0) {
      setErrorMsg('O carrinho está vazio.');
      return;
    }

    if (hasRestrictedItems && !verificacaoMaioridade) {
      setErrorMsg('Atenção: O carrinho contém produtos com restrição legal de idade (+18 anos). É obrigatório conferir o documento e marcar a verificação de maioridade legal antes de prosseguir.');
      return;
    }

    // Default cash received to valorTotal for quick entry
    setDinheiroRecebido(valorTotal.toFixed(2));
    setCartaoStatus('aguardando');
    setCartaoAprovadoConfirmado(false);
    setErrorMsg(null);
    setIsPaymentModalOpen(true);
  };

  // Generate PIX Charge (Real BACEN BR Code)
  const handleGeneratePix = async () => {
    try {
      setPixLoading(true);
      setErrorMsg(null);
      const res = await api.generatePixCharge({
        modulo,
        valor: valorTotal,
        descricao: `Venda ${modulo.toUpperCase()} - MoviLog PDV`
      });

      const charge = res.charge || (res as any).pix;
      if (res.success && charge) {
        setPixCharge(charge);
        const payloadToEncode = charge.qrCodePayload || charge.copiaECola || '';
        if (charge.qrCodeDataUrl) {
          setPixQrCodeDataUrl(charge.qrCodeDataUrl);
        } else if (payloadToEncode) {
          const generatedUrl = await QRCode.toDataURL(payloadToEncode, {
            width: 240,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
          setPixQrCodeDataUrl(generatedUrl);
        }
      } else {
        setErrorMsg('Não foi possível gerar a cobrança PIX.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao gerar cobrança PIX.');
    } finally {
      setPixLoading(false);
    }
  };

  // Check PIX Status / Manual confirmation
  const handleCheckPixStatus = async () => {
    if (!pixCharge) return;
    try {
      setPixPolling(true);
      const res = await api.getPixChargeStatus(pixCharge.txid);
      const charge = res.charge || (res as any).pix;
      if (charge) {
        setPixCharge(charge);
        if (charge.status === 'pago') {
          // Finalize sale automatically
          await executeFinalizeSale('pix', {
            txid: charge.txid,
            chavePix: charge.chavePix,
            endToEndId: charge.endToEndId,
            metodo: 'pix_dinamico'
          });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao verificar status do PIX.');
    } finally {
      setPixPolling(false);
    }
  };

  // Operator manual PIX confirmation with banking proof
  const handleConfirmPixManual = async () => {
    if (!pixCharge) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const res = await api.confirmPixManual({
        txid: pixCharge.txid,
        comprovanteReferencia: pixManualComprovante.trim() || undefined
      });
      const charge = res.charge || (res as any).pix;
      if (res.success && charge) {
        setPixCharge(charge);
        await executeFinalizeSale('pix', {
          txid: charge.txid,
          chavePix: charge.chavePix,
          endToEndId: charge.endToEndId,
          conferidoPor: user?.name || (user as any)?.nome || 'Operador',
          comprovante: pixManualComprovante.trim(),
          metodo: 'pix_conferido_operador'
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao confirmar recebimento PIX.');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel PIX Charge
  const handleCancelPix = async () => {
    if (!pixCharge) return;
    try {
      await api.cancelPixCharge({ txid: pixCharge.txid });
      setPixCharge(null);
      setPixQrCodeDataUrl('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cancelar cobrança PIX.');
    }
  };

  // Copy PIX Code
  const handleCopyPixCode = () => {
    if (!pixCharge) return;
    navigator.clipboard.writeText(pixCharge.copiaECola);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  // Execute Sale Registration on Backend (Centralized, Idempotent)
  const executeFinalizeSale = async (
    metodo: 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito',
    detalhesPagamento?: any
  ) => {
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const idempotencyKey = `sale-${modulo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const payload = {
        modulo,
        itens: cart.map(item => ({
          productId: item.product.id,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          desconto: item.desconto
        })),
        formaPagamento: metodo,
        valorPago: metodo === 'dinheiro' ? (numDinheiroRecebido || valorTotal) : valorTotal,
        descontoGeral: Number(descontoGeral) || 0,
        clienteNome: clienteNome.trim() || undefined,
        clienteDocumento: clienteDocumento.trim() || undefined,
        verificacaoMaioridade: hasRestrictedItems ? verificacaoMaioridade : true,
        idempotencyKey,
        detalhesPagamento
      };

      const res = await api.createCommerceSale(payload);
      if (res.success && res.sale) {
        setCompletedSale(res.sale);
        clearCart();
        // Refresh products to update stock numbers & refresh cash session
        loadData();
      } else {
        setErrorMsg((res as any).message || 'Erro ao registrar venda no PDV.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar venda.');
    } finally {
      setSubmitting(false);
    }
  };

  // Finalize Cash Sale
  const handleConfirmCashSale = async () => {
    if (numDinheiroRecebido < valorTotal) {
      setErrorMsg(`Valor em dinheiro recebido (R$ ${numDinheiroRecebido.toFixed(2)}) é inferior ao total (R$ ${valorTotal.toFixed(2)}).`);
      return;
    }
    await executeFinalizeSale('dinheiro', {
      valorRecebido: numDinheiroRecebido,
      trocoDevolvido: trocoDinheiro
    });
  };

  // Finalize Card Sale (External Terminal Conference)
  const handleConfirmCardSale = async (tipo: 'cartao_debito' | 'cartao_credito') => {
    if (!cartaoAprovadoConfirmado) {
      setErrorMsg('Confirme que a transação foi aprovada na maquininha física e o comprovante foi emitido.');
      return;
    }
    await executeFinalizeSale(tipo, {
      bandeira: cartaoBandeira,
      nsu: cartaoNsu.trim() || 'POS-MANUAL',
      terminal: selectedTerminal ? selectedTerminal.nome : 'Maquininha Física Externa (POS Independente)',
      terminalId: selectedTerminal?.id,
      statusTerminal: 'Aprovado'
    });
  };

  // Send Charge Directly to Connected Smart Terminal
  const handleSendToTerminal = async () => {
    if (!selectedTerminal) {
      setErrorMsg('Nenhuma maquininha selecionada para cobrança.');
      return;
    }

    try {
      setTerminalDispatching(true);
      setErrorMsg(null);
      setTerminalWaitingApproval(true);
      setTerminalMessage(`Enviando cobrança de R$ ${valorTotal.toFixed(2)} para ${selectedTerminal.nome}...`);

      const idempotencyKey = `intent-${modulo}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const res = await api.createTerminalPaymentIntent(selectedTerminal.id, {
        valor: valorTotal,
        tipoOperacao: formaPagamento === 'cartao_debito' ? 'debito' : 'credito',
        modulo,
        idempotencyKey
      });

      if (!res.success) {
        setTerminalWaitingApproval(false);
        setErrorMsg(res.message || 'Falha ao enviar cobrança para o terminal.');
        return;
      }

      setActivePaymentIntentId(res.transaction.id);
      setTerminalMessage(res.message || 'Cobrança enviada com sucesso ao terminal!');

      // If approved immediately (or sandbox simulation mode)
      if (res.transaction.status === 'aprovado') {
        setCartaoNsu(res.transaction.nsu || 'APROVADO');
        if (res.transaction.bandeira) setCartaoBandeira(res.transaction.bandeira);
        setCartaoAprovadoConfirmado(true);
        setCartaoStatus('aprovado');
        setTerminalWaitingApproval(false);

        // Finalize sale directly
        await executeFinalizeSale(formaPagamento as 'cartao_debito' | 'cartao_credito', {
          terminalId: selectedTerminal.id,
          terminalNome: selectedTerminal.nome,
          transactionId: res.transaction.id,
          paymentIntentId: res.transaction.paymentIntentId,
          nsu: res.transaction.nsu,
          cartaoAutorizacao: res.transaction.codigoAutorizacao,
          cartaoBandeira: res.transaction.bandeira,
          ultimosDigitosCartao: res.transaction.ultimosDigitosCartao,
          taxaPercentual: res.transaction.taxaPercentualAplicada,
          valorTaxa: res.transaction.valorTaxaEstimada,
          valorLiquido: res.transaction.valorLiquido
        });
      }
    } catch (err: any) {
      setTerminalWaitingApproval(false);
      setErrorMsg(err.message || 'Erro ao processar cobrança na maquininha.');
    } finally {
      setTerminalDispatching(false);
    }
  };

  const handleCancelTerminalIntent = async () => {
    if (!activePaymentIntentId) {
      setTerminalWaitingApproval(false);
      return;
    }
    try {
      await api.cancelTerminalPaymentIntent(activePaymentIntentId);
      setTerminalWaitingApproval(false);
      setActivePaymentIntentId(null);
      setTerminalMessage('Operação cancelada no terminal.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cancelar operação no terminal.');
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
              <p className="text-sm font-bold">Nenhum caixa aberto para a {modulo === 'adega' ? 'Adega' : 'Tabacaria'}</p>
              <p className="text-xs text-amber-200/80">
                Para registrar vendas neste PDV, é obrigatório abrir o caixa do dia informando o fundo de troco inicial.
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
                const isRestricted =
                  prod.classificacaoLegal === 'bebida_alcoolica' ||
                  prod.classificacaoLegal === 'tabaco_derivados' ||
                  prod.classificacaoLegal === 'outro_restrito' ||
                  (prod.idadeMinima >= 18 && prod.classificacaoLegal !== 'sem_restricao');

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
                        {isRestricted ? (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded shrink-0">
                            +18
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded shrink-0">
                            Livre
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

        {/* Right Side: Cart & Checkout Overview */}
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
                  {cart.map(item => {
                    const isRestricted =
                      item.product.classificacaoLegal === 'bebida_alcoolica' ||
                      item.product.classificacaoLegal === 'tabaco_derivados' ||
                      item.product.classificacaoLegal === 'outro_restrito' ||
                      (item.product.idadeMinima >= 18 && item.product.classificacaoLegal !== 'sem_restricao');

                    return (
                      <div
                        key={item.product.id}
                        className="bg-[#0A0714] border border-[#262042] rounded-xl p-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-bold text-white truncate">{item.product.nome}</p>
                            {isRestricted ? (
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1 rounded">
                                +18
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-400/10 px-1 rounded">
                                Livre
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
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom: Totals, Discounts, 18+ Check & Proceed to Payment Button */}
            {cart.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#262042] space-y-3">
                {/* 18+ Verification Checkbox (Only if restricted items are present) */}
                {hasRestrictedItems ? (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-amber-300">
                        Controle Legal de Idade (+18 Anos Obrigatório)
                      </p>
                      <p className="text-[11px] text-amber-200/80 mb-2 leading-tight">
                        Este carrinho contém itens de venda controlada:
                        <strong className="block text-white mt-0.5">
                          {restrictedCartItems.map(i => i.product.nome).join(', ')}
                        </strong>
                        Proibida a venda para menores de 18 anos (Lei Federal nº 9.294/1996, ECA Lei 8.069/90 e Lei 13.106/2015).
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={verificacaoMaioridade}
                          onChange={e => setVerificacaoMaioridade(e.target.checked)}
                          className="w-4 h-4 rounded text-[#8B5CF6] focus:ring-0 bg-[#0A0714] border-[#262042]"
                        />
                        <span className="text-xs font-semibold text-white">
                          Confirmo que o cliente possui 18 anos ou mais (documento oficial verificado)
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Venda Livre: Todos os itens do carrinho são livres de restrição etária (acessórios/conveniência).</span>
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

                {/* Proceed to Payment Window */}
                <button
                  type="button"
                  disabled={hasRestrictedItems && !verificacaoMaioridade}
                  onClick={handleOpenPayment}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg ${
                    hasRestrictedItems && !verificacaoMaioridade
                      ? 'bg-[#1A1633] text-[#716A86] cursor-not-allowed border border-[#262042]'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Finalizar Venda (R$ {valorTotal.toFixed(2)})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* JANELA DE PAGAMENTO FUNCIONAL (Payment Modal)                             */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121024] border border-[#8B5CF6]/40 rounded-3xl p-6 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative text-white">
            <button
              onClick={() => {
                if (pixCharge && pixCharge.status === 'aguardando_pagamento') {
                  if (!window.confirm('Existe uma cobrança PIX aguardando pagamento. Deseja realmente voltar ao carrinho?')) return;
                }
                setIsPaymentModalOpen(false);
              }}
              className="absolute top-4 right-4 text-[#AAA6B5] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 mb-4 border-b border-[#262042]">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#8B5CF6] px-2 py-0.5 rounded bg-[#8B5CF6]/10 font-bold">
                  Frente de Caixa — {modulo === 'adega' ? 'Adega' : 'Tabacaria'}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Finalização e Realização do Pagamento
                </h3>
                <p className="text-xs text-[#AAA6B5]">
                  Operador: <strong className="text-white">{user?.name || (user as any)?.nome || 'Operador'}</strong> | Itens no pedido: {cart.reduce((a, b) => a + b.quantidade, 0)} un.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-[#AAA6B5] block">Valor Total</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  R$ {valorTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Resumo compacto de itens do pedido */}
            <div className="bg-[#0A0714] border border-[#262042] rounded-2xl p-3 mb-4 max-h-36 overflow-y-auto">
              <span className="text-[10px] font-bold uppercase text-[#716A86] block mb-1">
                Itens da Compra ({cart.length})
              </span>
              <div className="space-y-1 text-xs">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[#C4B5FD]">
                    <span className="truncate max-w-[320px]">
                      {item.quantidade}x {item.product.nome}
                    </span>
                    <span className="font-mono text-white font-semibold">
                      R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              {descontoGeral > 0 && (
                <div className="flex justify-between text-xs text-amber-400 pt-1 mt-1 border-t border-[#262042]">
                  <span>Desconto Aplicado:</span>
                  <span className="font-mono">- R$ {Number(descontoGeral).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Error Message inside modal */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Seleção da Forma de Pagamento */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-[#AAA6B5] mb-2 block">
                Selecione a Forma de Pagamento:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setFormaPagamento('dinheiro')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                    formaPagamento === 'dinheiro'
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-[#0A0714] border-[#262042] text-[#AAA6B5] hover:text-white'
                  }`}
                >
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold">Dinheiro</span>
                  <span className="text-[10px] text-[#716A86]">Em espécie</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormaPagamento('pix');
                    if (!pixCharge) handleGeneratePix();
                  }}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                    formaPagamento === 'pix'
                      ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                      : 'bg-[#0A0714] border-[#262042] text-[#AAA6B5] hover:text-white'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs font-bold">PIX</span>
                  <span className="text-[10px] text-[#716A86]">QR Code Real</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormaPagamento('cartao_debito')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                    formaPagamento === 'cartao_debito'
                      ? 'bg-blue-500/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-[#0A0714] border-[#262042] text-[#AAA6B5] hover:text-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <span className="text-xs font-bold">Cartão Débito</span>
                  <span className="text-[10px] text-[#716A86]">Maquininha POS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormaPagamento('cartao_credito')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                    formaPagamento === 'cartao_credito'
                      ? 'bg-purple-500/20 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                      : 'bg-[#0A0714] border-[#262042] text-[#AAA6B5] hover:text-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  <span className="text-xs font-bold">Cartão Crédito</span>
                  <span className="text-[10px] text-[#716A86]">Maquininha POS</span>
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* TAB DINHEIRO                                              */}
            {/* ========================================================= */}
            {formaPagamento === 'dinheiro' && (
              <div className="bg-[#0A0714] border border-[#262042] rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#262042]">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Pagamento em Espécie (Gaveta Física)
                  </span>
                  <span className="text-xs font-mono text-[#AAA6B5]">
                    Total: <strong className="text-emerald-400">R$ {valorTotal.toFixed(2)}</strong>
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                    Valor Recebido do Cliente (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={dinheiroRecebido}
                    onChange={e => setDinheiroRecebido(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-[#121024] border border-[#262042] rounded-xl px-4 py-2.5 text-lg font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Troco preview */}
                <div className="p-3 rounded-xl bg-[#121024] border border-[#262042] flex items-center justify-between text-xs">
                  <span className="text-[#AAA6B5]">Troco a ser Devolvido:</span>
                  <span
                    className={`font-mono text-base font-black ${
                      trocoDinheiro > 0 ? 'text-amber-400' : 'text-white'
                    }`}
                  >
                    R$ {trocoDinheiro.toFixed(2)}
                  </span>
                </div>

                {numDinheiroRecebido > 0 && numDinheiroRecebido < valorTotal && (
                  <p className="text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Valor recebido é menor que o total da venda (Faltam R$ {(valorTotal - numDinheiroRecebido).toFixed(2)}).
                  </p>
                )}

                <button
                  type="button"
                  disabled={submitting || numDinheiroRecebido < valorTotal}
                  onClick={handleConfirmCashSale}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg ${
                    submitting || numDinheiroRecebido < valorTotal
                      ? 'bg-[#1A1633] text-[#716A86] cursor-not-allowed border border-[#262042]'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                  }`}
                >
                  {submitting ? (
                    <span>Registrando venda e movimentando gaveta...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirmar Recebimento em Dinheiro (R$ {valorTotal.toFixed(2)})</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB PIX (BACEN BR Code Real)                              */}
            {/* ========================================================= */}
            {formaPagamento === 'pix' && (
              <div className="bg-[#0A0714] border border-[#262042] rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#262042]">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    Cobrança PIX com QR Code Real (Padrão BACEN / EMVCo)
                  </span>
                  <span className="text-xs font-mono text-[#AAA6B5]">
                    Valor Exato: <strong className="text-cyan-400">R$ {valorTotal.toFixed(2)}</strong>
                  </span>
                </div>

                {!pixCharge ? (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-xs text-[#AAA6B5]">
                      Clique abaixo para gerar o QR Code dinâmico do Banco Central para esta venda.
                    </p>
                    <button
                      type="button"
                      disabled={pixLoading}
                      onClick={handleGeneratePix}
                      className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 transition shadow-lg shadow-cyan-900/30"
                    >
                      {pixLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Gerando BR Code BACEN...</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4" />
                          <span>Gerar Cobrança PIX (R$ {valorTotal.toFixed(2)})</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121024] border border-[#262042] text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            pixCharge.status === 'pago'
                              ? 'bg-emerald-400 animate-none'
                              : pixCharge.status === 'cancelado' || pixCharge.status === 'expirado'
                              ? 'bg-rose-400'
                              : 'bg-cyan-400 animate-pulse'
                          }`}
                        ></span>
                        <span className="font-bold text-white">
                          Status:{' '}
                          {pixCharge.status === 'pago'
                            ? 'Pago e Confirmado'
                            : pixCharge.status === 'aguardando_pagamento'
                            ? 'Aguardando Pagamento do Cliente'
                            : pixCharge.status === 'expirado'
                            ? 'Cobrança Expirada'
                            : 'Cancelada'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#AAA6B5]">
                        TXID: {pixCharge.txid}
                      </span>
                    </div>

                    {/* Visual QR Code + Copia e Cola */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#121024] border border-[#262042] rounded-2xl p-4">
                      {pixQrCodeDataUrl ? (
                        <div className="p-2 bg-white rounded-2xl shrink-0 shadow-lg">
                          <img
                            src={pixQrCodeDataUrl}
                            alt="QR Code PIX BACEN"
                            className="w-44 h-44 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-44 h-44 rounded-2xl bg-[#0A0714] flex items-center justify-center text-xs text-[#AAA6B5]">
                          Carregando QR...
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-2.5 w-full">
                        <div>
                          <span className="text-[11px] text-[#AAA6B5] block mb-1">
                            Código PIX Copia e Cola (BR Code Oficial):
                          </span>
                          <div className="p-2 rounded-xl bg-[#0A0714] border border-[#262042] text-[10px] font-mono text-[#C4B5FD] break-all max-h-20 overflow-y-auto">
                            {pixCharge.copiaECola}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleCopyPixCode}
                            className="px-3 py-1.5 bg-[#1A1633] hover:bg-[#262042] border border-[#2E2854] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                          >
                            <Copy className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{copiedPix ? 'Copiado!' : 'Copiar Código PIX'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={pixPolling}
                            onClick={handleCheckPixStatus}
                            className="px-3 py-1.5 bg-[#1A1633] hover:bg-[#262042] border border-[#2E2854] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${pixPolling ? 'animate-spin' : ''}`} />
                            <span>Verificar Pagamento</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleCancelPix}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl transition"
                          >
                            Cancelar Cobrança
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Provedor & Conferência de Comprovante */}
                    <div className="bg-[#121024]/60 border border-cyan-500/20 rounded-2xl p-3.5 text-xs space-y-2">
                      <div className="flex items-center justify-between text-[#AAA6B5]">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                          Conferência pelo Operador de Caixa:
                        </span>
                        <span className="text-[10px] text-cyan-300 font-mono">
                          Chave: {pixCharge.chavePix}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#AAA6B5] leading-relaxed">
                        Quando o cliente realiza o pagamento pelo app do banco, confira a notificação na conta ou solicite o comprovante na tela do celular do cliente.
                      </p>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Autenticação bancária / ID do comprovante (opcional)"
                          value={pixManualComprovante}
                          onChange={e => setPixManualComprovante(e.target.value)}
                          className="flex-1 bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white placeholder-[#716A86] focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleConfirmPixManual}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{submitting ? 'Confirmando...' : 'Confirmar Recebimento do PIX'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB CARTÃO (DÉBITO E CRÉDITO — CENTRAL DE MAQUININHAS)      */}
            {/* ========================================================= */}
            {(formaPagamento === 'cartao_debito' || formaPagamento === 'cartao_credito') && (
              <div className="bg-[#0A0714] border border-[#262042] rounded-2xl p-4 space-y-4">
                {/* Header & Terminal Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262042]">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-purple-400" />
                      Integração de Maquininha — {formaPagamento === 'cartao_debito' ? 'Cartão de Débito' : 'Cartão de Crédito'}
                    </span>
                    <span className="text-[11px] text-[#AAA6B5]">
                      Módulo: <strong className="text-white uppercase">{modulo === 'adega' ? 'Adega & Bebidas' : 'Tabacaria'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#AAA6B5]">
                      Total a cobrar: <strong className="text-emerald-400 font-bold text-sm">R$ {valorTotal.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>

                {/* Terminal Selection Dropdown / Selector */}
                <div className="p-3.5 rounded-xl bg-[#121024] border border-[#262042] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                      Terminal Selecionado no Caixa:
                    </label>
                    {selectedTerminal && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                        selectedTerminal.statusConexao === 'online'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}>
                        {selectedTerminal.statusConexao === 'online' ? (
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
                    )}
                  </div>

                  {terminals.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {terminals.map(term => (
                        <button
                          key={term.id}
                          type="button"
                          onClick={() => {
                            setSelectedTerminal(term);
                            if (term.provedor === 'pos_manual') {
                              setIsManualPosMode(true);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                            selectedTerminal?.id === term.id
                              ? 'bg-purple-950/25 border-purple-500/50 ring-1 ring-purple-500'
                              : 'bg-[#0A0714] border-[#262042] hover:bg-[#1A1633]'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <strong className="text-xs font-bold text-white block truncate">{term.nome}</strong>
                            <span className="text-[10px] text-[#AAA6B5] block font-mono">{term.modelo}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                            term.provedor === 'mercadopago_point'
                              ? 'bg-sky-500/20 text-sky-400'
                              : term.provedor === 'stone_connect'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : term.provedor === 'smartpos_tef'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {term.provedor === 'mercadopago_point' ? 'Point' : term.provedor === 'stone_connect' ? 'Stone' : term.provedor === 'smartpos_tef' ? 'TEF' : 'Manual'}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
                      Nenhuma maquininha cadastrada para este módulo. A venda pode ser confirmada no modo manual ou você pode cadastrar um terminal em <strong>Configurações &gt; Minhas Maquininhas</strong>.
                    </div>
                  )}

                  {/* Mode switcher (Automatic Smart POS vs Manual Voucher) */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#AAA6B5]">
                      Modo atual: <strong className="text-white">{isManualPosMode ? 'Conferência Manual de Comprovante' : 'Disparo Automático via Nuvem'}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsManualPosMode(!isManualPosMode)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 underline"
                    >
                      {isManualPosMode ? 'Alternar para Envio Automático' : 'Alternar para Digitação Manual'}
                    </button>
                  </div>
                </div>

                {/* AUTOMATIC SMART POS FLOW */}
                {!isManualPosMode && selectedTerminal && selectedTerminal.provedor !== 'pos_manual' ? (
                  <div className="p-4 rounded-xl bg-[#121024] border border-purple-500/30 space-y-4">
                    {terminalWaitingApproval ? (
                      <div className="py-6 text-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto animate-pulse text-purple-300">
                          <CreditCard className="w-8 h-8 animate-bounce text-purple-400" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white">Aguardando cliente na maquininha...</h4>
                          <p className="text-xs text-[#AAA6B5]">
                            Peça ao cliente para <strong>aproximar ou inserir o cartão</strong> no terminal <strong>{selectedTerminal.nome}</strong> e digitar a senha.
                          </p>
                          <div className="text-lg font-black text-emerald-400 font-mono pt-1">
                            R$ {valorTotal.toFixed(2)} ({formaPagamento === 'cartao_debito' ? 'DÉBITO' : 'CRÉDITO'})
                          </div>
                        </div>

                        {terminalMessage && (
                          <p className="text-xs text-cyan-300 font-mono bg-[#0A0714] p-2 rounded-xl border border-[#262042] max-w-sm mx-auto">
                            {terminalMessage}
                          </p>
                        )}

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleCancelTerminalIntent}
                            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/30 transition"
                          >
                            Cancelar Cobrança na Maquininha
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 text-center py-2">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-300">
                          <Smartphone className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Pronto para enviar cobrança</h4>
                          <p className="text-xs text-[#AAA6B5]">
                            O valor de <strong className="text-white">R$ {valorTotal.toFixed(2)}</strong> será enviado diretamente para a tela do terminal <strong>{selectedTerminal.nome}</strong>.
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={terminalDispatching}
                          onClick={handleSendToTerminal}
                          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
                        >
                          {terminalDispatching ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Enviando para maquininha...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4" />
                              <span>Enviar Cobrança para a Maquininha</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* MANUAL POS FLOW (AUTÔNOMO / DIGITAÇÃO MANUAL) */
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-[#121024] border border-[#262042] space-y-2">
                      <p className="font-bold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#8B5CF6]/30 text-[#C4B5FD] font-mono text-center leading-5 text-[11px]">
                          1
                        </span>
                        Digite o valor exato no teclado da maquininha:
                      </p>
                      <div className="p-2.5 rounded-xl bg-[#0A0714] text-center font-mono font-black text-xl text-emerald-400">
                        R$ {valorTotal.toFixed(2)} ({formaPagamento === 'cartao_debito' ? 'DÉBITO' : 'CRÉDITO'})
                      </div>
                      <p className="text-[11px] text-[#AAA6B5]">
                        Solicite ao cliente que insira ou aproxime o cartão e digite sua senha pessoal no equipamento físico.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#121024] border border-[#262042] space-y-3">
                      <p className="font-bold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#8B5CF6]/30 text-[#C4B5FD] font-mono text-center leading-5 text-[11px]">
                          2
                        </span>
                        Conferência do Comprovante Impresso pela Maquininha:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-[#AAA6B5] mb-1 block">Bandeira do Cartão:</label>
                          <select
                            value={cartaoBandeira}
                            onChange={e => setCartaoBandeira(e.target.value)}
                            className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                          >
                            <option value="Visa">Visa</option>
                            <option value="Mastercard">Mastercard</option>
                            <option value="Elo">Elo</option>
                            <option value="Hipercard">Hipercard</option>
                            <option value="American Express">American Express (Amex)</option>
                            <option value="Outra">Outra Bandeira</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] text-[#AAA6B5] mb-1 block">Código de Autorização / NSU (filipeta):</label>
                          <input
                            type="text"
                            placeholder="Ex: 849201"
                            value={cartaoNsu}
                            onChange={e => setCartaoNsu(e.target.value)}
                            className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-[#716A86] focus:outline-none focus:border-[#8B5CF6]"
                          />
                        </div>
                      </div>

                      <label className="flex items-start gap-2.5 pt-2 border-t border-[#262042] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cartaoAprovadoConfirmado}
                          onChange={e => setCartaoAprovadoConfirmado(e.target.checked)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-0 bg-[#0A0714] border-[#262042] mt-0.5"
                        />
                        <span className="text-xs text-white leading-tight">
                          Confirmo que a transação foi <strong>APROVADA</strong> na maquininha física e o comprovante foi conferido pelo operador.
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCartaoStatus('recusado');
                          setErrorMsg('Transação recusada na maquininha física. Solicite outro meio de pagamento ou outro cartão.');
                        }}
                        className="flex-1 py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl transition"
                      >
                        Cartão Recusado
                      </button>

                      <button
                        type="button"
                        disabled={submitting || !cartaoAprovadoConfirmado}
                        onClick={() => handleConfirmCardSale(formaPagamento as 'cartao_debito' | 'cartao_credito')}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg ${
                          submitting || !cartaoAprovadoConfirmado
                            ? 'bg-[#1A1633] text-[#716A86] cursor-not-allowed border border-[#262042]'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30'
                        }`}
                      >
                        {submitting ? (
                          <span>Registrando venda...</span>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Confirmar e Concluir Venda</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Back button */}
            <div className="pt-4 border-t border-[#262042] flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-[#AAA6B5] hover:text-white flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Carrinho</span>
              </button>
              <span className="text-[11px] text-[#716A86]">
                MoviLog PDV Seguro • Auditoria de Vendas
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPROVANTE DE VENDA CONCLUÍDA                                           */}
      {/* ========================================================================= */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
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
                    <span className="text-emerald-400 font-mono">R$ {it.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-0.5 text-[11px] pt-1">
                <div className="flex justify-between">
                  <span className="text-[#AAA6B5]">Subtotal:</span>
                  <span className="font-mono">R$ {completedSale.subtotal.toFixed(2)}</span>
                </div>
                {completedSale.descontoTotal > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Desconto:</span>
                    <span className="font-mono">- R$ {completedSale.descontoTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-white text-xs pt-1 border-t border-[#262042]">
                  <span>TOTAL PAGO:</span>
                  <span className="text-emerald-400 font-mono">R$ {completedSale.valorTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-[#AAA6B5] pt-0.5">
                  <span>Forma:</span>
                  <span className="uppercase text-white font-bold">{completedSale.formaPagamento}</span>
                </div>
                {completedSale.troco && completedSale.troco > 0 ? (
                  <div className="flex justify-between text-[10px] text-amber-400">
                    <span>Troco Devolvido:</span>
                    <span className="font-mono">R$ {completedSale.troco.toFixed(2)}</span>
                  </div>
                ) : null}

                {completedSale.detalhesPagamento?.nsu && (
                  <div className="flex justify-between text-[10px] text-[#716A86]">
                    <span>NSU / Autorização:</span>
                    <span className="font-mono">{completedSale.detalhesPagamento.nsu}</span>
                  </div>
                )}
                {completedSale.detalhesPagamento?.txid && (
                  <div className="flex justify-between text-[10px] text-[#716A86]">
                    <span>TXID PIX:</span>
                    <span className="font-mono">{completedSale.detalhesPagamento.txid}</span>
                  </div>
                )}
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
