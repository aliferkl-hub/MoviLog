import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CommercialPlan } from '../../types';
import { api, buildWhatsAppSalesUrl } from '../../lib/api';
import { X, Check, MessageSquare, ShieldCheck, Clock, Send, AlertCircle, ArrowUpRight } from 'lucide-react';

export const PlanModal: React.FC = () => {
  const { isPlanModalOpen, setIsPlanModalOpen, company, systemConfig, isMaster, refreshUser } = useAuth();
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [billingCycle, setBillingCycle] = useState<'mensal' | 'anual'>('mensal');
  const [selectedPlan, setSelectedPlan] = useState<CommercialPlan | null>(null);
  
  // Payment confirmation submission form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('PIX Instantâneo');
  const [paymentRef, setPaymentRef] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isPlanModalOpen) {
      api.getPlans().then(res => {
        setPlans(res.plans);
        setWhatsappNumber(res.whatsappComercial);
      }).catch(console.error);
    }
  }, [isPlanModalOpen]);

  if (!isPlanModalOpen) return null;

  const handleWhatsAppCheckout = (plan: CommercialPlan) => {
    setSelectedPlan(plan);
    const solicitacaoId = `SOL-${Date.now().toString().slice(-6)}`;
    const price = billingCycle === 'anual' ? (plan.precoAnual ? `R$ ${plan.precoAnual}/ano` : `R$ ${plan.precoMensal * 12}/ano`) : `R$ ${plan.precoMensal}/mês`;
    const period = billingCycle === 'anual' ? 'Anual (12 meses)' : 'Mensal (30 dias)';
    const url = buildWhatsAppSalesUrl(
      whatsappNumber || systemConfig?.whatsappComercial || '5511999999999',
      plan.nome,
      company?.nomeFantasia || '',
      company?.cnpj || '',
      price,
      period,
      solicitacaoId
    );
    window.open(url, '_blank', 'noopener,noreferrer');
    setPaymentRef(`Ref: ${solicitacaoId} - PIX`);
    setShowPaymentForm(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setSubmittingPayment(true);
    setFeedbackMsg(null);

    try {
      const res = await api.requestSubscription({
        planoId: selectedPlan.id,
        metodoPagamento: paymentMethod,
        comprovanteReferencia: paymentRef,
        periodoMeses: billingCycle === 'anual' ? 12 : 1
      });
      setFeedbackMsg({ type: 'success', text: res.message });
      await refreshUser();
      setTimeout(() => {
        setShowPaymentForm(false);
        setIsPlanModalOpen(false);
      }, 2500);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erro ao registrar solicitação' });
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 my-8">
        <button
          onClick={() => {
            setIsPlanModalOpen(false);
            setShowPaymentForm(false);
            setFeedbackMsg(null);
          }}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Planos Comerciais
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-2">
            Escolha o Plano Ideal Para Sua Operação
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Contratação direta via WhatsApp com ativação segura verificada pelo Master Owner.
          </p>

          {isMaster && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Você está conectado como Master Owner: seu acesso é vitalício e gratuito a todos os planos.</span>
            </div>
          )}

          {/* Billing Toggle */}
          <div className="mt-5 inline-flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setBillingCycle('mensal')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                billingCycle === 'mensal' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Faturamento Mensal
            </button>
            <button
              onClick={() => setBillingCycle('anual')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                billingCycle === 'anual' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Faturamento Anual</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                Economize até 17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => {
            const isCustom = p.tipo === 'personalizado';
            const price = billingCycle === 'anual' ? (p.precoAnual ? p.precoAnual / 12 : p.precoMensal) : p.precoMensal;
            const isCurrent = company?.planoId === p.id && company?.statusAssinatura === 'assinatura_ativa';

            return (
              <div
                key={p.id}
                className={`relative rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                  p.destaque
                    ? 'bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                {p.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                    Mais Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">{p.nome}</h3>
                    {isCurrent && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                        Plano Atual
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{p.descricao}</p>

                  <div className="my-4">
                    {isCustom ? (
                      <div className="text-xl font-bold text-white">Sob Consulta</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-slate-400 font-medium">R$</span>
                        <span className="text-2xl font-extrabold text-white">
                          {price.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </span>
                        <span className="text-xs text-slate-400">/mês</span>
                      </div>
                    )}
                    {billingCycle === 'anual' && !isCustom && p.precoAnual > 0 && (
                      <p className="text-[10px] text-slate-500 mt-0.5">Cobrado anualmente: R$ {p.precoAnual}</p>
                    )}
                  </div>

                  <div className="text-xs space-y-1.5 py-3 border-y border-slate-800">
                    <div className="text-slate-300 font-semibold text-[11px] uppercase tracking-wider text-slate-400">
                      Limites Operacionais:
                    </div>
                    <div className="text-slate-300 flex items-center justify-between">
                      <span className="text-slate-400">Usuários:</span>
                      <span className="font-semibold text-white">{p.limites.maxUsuarios}</span>
                    </div>
                    <div className="text-slate-300 flex items-center justify-between">
                      <span className="text-slate-400">Unidades/Galpões:</span>
                      <span className="font-semibold text-white">{p.limites.maxUnidades}</span>
                    </div>
                    <div className="text-slate-300 flex items-center justify-between">
                      <span className="text-slate-400">Operações/mês:</span>
                      <span className="font-semibold text-white">{p.limites.maxOperacoesMes.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-2 text-xs">
                    {p.recursos.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => handleWhatsAppCheckout(p)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      p.destaque
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-white" />
                    <span>Contratar no WhatsApp</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Confirmation Section */}
        {showPaymentForm && selectedPlan && (
          <div className="mt-8 p-6 bg-slate-800/90 border border-indigo-500/40 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  Já realizou o pagamento do {selectedPlan.nome}?
                </h4>
                <p className="text-xs text-slate-400">
                  Informe os dados ou referência do comprovante para o Master Owner verificar e liberar seu plano.
                </p>
              </div>
            </div>

            {feedbackMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {feedbackMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Forma de Pagamento Utilizada</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="PIX Instantâneo">PIX Instantâneo</option>
                  <option value="Transferência TED/DOC">Transferência TED/DOC</option>
                  <option value="Boleto Bancário">Boleto Bancário</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Depósito em Conta">Depósito em Conta</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Referência / Código / Comprovante</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Código de transação PIX ou ID do comprovante"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingPayment ? 'Enviando...' : 'Notificar Pagamento ao Master'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Ativação segura com validação manual
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" /> Sem fidelidade obrigatória nos planos mensais
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Atendimento direto no WhatsApp
          </span>
        </div>
      </div>
    </div>
  );
};
