import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CommercialPlan } from '../../types';
import { api, buildWhatsAppSalesUrl } from '../../lib/api';
import {
  Truck,
  Building,
  Package,
  Boxes,
  ShieldCheck,
  QrCode,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  ChevronRight,
  Users,
  Check,
  Send,
  Building2,
  KeyRound,
  ArrowUpRight
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const {
    setIsLoginModalOpen,
    setIsRegisterModalOpen,
    setIsMasterSetupOpen,
    isMasterInitialized,
    masterEmail,
    setSelectedPlanForCheckout,
    setIsPlanModalOpen
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'logistica' | 'predial'>('logistica');
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState('5511999999999');

  useEffect(() => {
    api.getPlans().then(res => {
      setPlans(res.plans);
      if (res.whatsappComercial) setWhatsappNumber(res.whatsappComercial);
    }).catch(console.error);
  }, []);

  const handleContractPlan = (plan: CommercialPlan) => {
    if (plan.tipo === 'demo') {
      setSelectedPlanForCheckout(plan.id);
      setIsRegisterModalOpen(true);
      return;
    }
    const solicitacaoId = `SOL-${Date.now().toString().slice(-6)}`;
    const url = buildWhatsAppSalesUrl(
      whatsappNumber,
      plan.nome,
      '',
      '',
      plan.precoMensal > 0 ? `R$ ${plan.precoMensal}/mês` : 'Sob Consulta',
      'Mensal',
      solicitacaoId
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar for Master & Login */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                LET’S LOG <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">LogiPredial Suite</span>
              </span>
              <p className="text-[10px] text-slate-400">Roteirização, Frota com GPS & Operações</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {!isMasterInitialized ? (
              <button
                onClick={() => setIsMasterSetupOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ativar Master Owner</span>
                <span className="sm:hidden">Master</span>
              </button>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Entrar</span>
              </button>
            )}

            <button
              onClick={() => {
                setSelectedPlanForCheckout('plan_demo');
                setIsRegisterModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/25"
            >
              <span>Testar 7 Dias Grátis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:py-24 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[250px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs font-semibold text-slate-300 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ecossistema Completo de Logística, Roteirização de Entregas e Gestão Integrada</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            LET’S LOG <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-violet-200">
              Roteirização Inteligente & Frota com GPS,
            </span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-200">
              Logística
            </span>{' '}
            e{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-orange-300">
              Gestão Predial
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Importação em lote de entregas (planilhas CSV/Excel), motor de roteirização geográfica com cálculo de carga e sequência,
            painel do entregador com navegação e GPS em tempo real, somados à expedição com QR Code e portaria com PIN.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setSelectedPlanForCheckout('plan_demo');
                setIsRegisterModalOpen(true);
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25"
            >
              <Boxes className="w-4 h-4" />
              <span>Solicitar Demonstração Gratuita (7 Dias)</span>
            </button>

            <a
              href="#planos"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <span>Ver Planos Comerciais</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Multiempresa com isolamento total de dados</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Contratação direta no WhatsApp com validação manual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Master Owner com acesso permanente permanente</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Products Showcase */}
      <section className="py-16 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Dois Módulos em Uma Solução
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Conheça as Funcionalidades Operacionais
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Alterne abaixo para explorar os recursos de cada módulo especializado.
            </p>

            <div className="mt-6 inline-flex p-1 bg-slate-800 rounded-2xl border border-slate-700/80">
              <button
                onClick={() => setActiveTab('logistica')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'logistica'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>1. Logística e Expedição Empresarial</span>
              </button>
              <button
                onClick={() => setActiveTab('predial')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'predial'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>2. Gestão Predial & Portaria</span>
              </button>
            </div>
          </div>

          {/* Module 1 Display */}
          {activeTab === 'logistica' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Recebimento com QR Code</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Registro imediato de entrada de volumes, fornecedor, transportadora, nota fiscal,
                  conferência detalhada e controle fotográfico de avarias com impressão de etiquetas QR Code.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                  <Boxes className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Estoque e Posições Físicas</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Controle por setor, corredor e prateleira. Alertas automáticos de estoque mínimo,
                  transferências internas e ajustes de inventário com justificativa auditada.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                  <Send className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Expedição e Despacho</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ordem de separação, conferência de cargas, atribuição de motorista e placa de veículo,
                  etiqueta de despacho e acompanhamento de etapas até a entrega ao cliente.
                </p>
              </div>
            </div>
          )}

          {/* Module 2 Display */}
          {activeTab === 'predial' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Encomendas com PIN & WhatsApp</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ao receber o pacote na portaria, o porteiro gera um código PIN individual e avisa o morador
                  com um clique via WhatsApp. A retirada exige a digitação correta do PIN.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Visitantes & Prestadores</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Controle de entrada e saída em tempo real na portaria com autorização do morador,
                  documento, empresa prestadora e tempo de permanência no local.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Estrutura de Blocos e Unidades</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cadastro de torres, andares, apartamentos e salas comerciais com proteção LGPD de dados
                  e histórico de moradores autorizados a retirar pacotes.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Transparência Comercial
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-2">
            Planos Comerciais Editáveis pelo Master Owner
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Inicie sua demonstração gratuita de 7 dias ou contrate diretamente com o administrador via WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => {
            const isDemo = p.tipo === 'demo';
            const isCustom = p.tipo === 'personalizado';

            return (
              <div
                key={p.id}
                className={`relative rounded-3xl p-6 border flex flex-col justify-between ${
                  p.destaque
                    ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/30 shadow-2xl'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {p.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                    Mais Escolhido
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-white">{p.nome}</h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{p.descricao}</p>

                  <div className="my-5">
                    {isDemo ? (
                      <div className="text-2xl font-black text-white">Grátis (7 Dias)</div>
                    ) : isCustom ? (
                      <div className="text-2xl font-black text-white">Sob Consulta</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-slate-400">R$</span>
                        <span className="text-3xl font-black text-white">{p.precoMensal}</span>
                        <span className="text-xs text-slate-400">/mês</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs space-y-1.5 py-3 border-y border-slate-800/80 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Usuários:</span>
                      <span className="font-bold text-white">{p.limites.maxUsuarios}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Unidades/Galpões:</span>
                      <span className="font-bold text-white">{p.limites.maxUnidades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Operações/mês:</span>
                      <span className="font-bold text-white">{p.limites.maxOperacoesMes.toLocaleString('pt-BR')}</span>
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
                    onClick={() => handleContractPlan(p)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      isDemo
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25'
                    }`}
                  >
                    {isDemo ? (
                      <>
                        <span>Criar Conta Demonstração</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        <span>Contratar no WhatsApp</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-300">LogiPredial SaaS</span>
            <span>• Plataforma Integrada de Logística, Expedição e Gestão Predial</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Master Owner Oficial: {masterEmail}</span>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-slate-400 hover:text-white underline underline-offset-4"
            >
              Área do Cliente
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
