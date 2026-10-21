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
  ArrowUpRight,
  FileText,
  Radio,
  DollarSign
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

  const [activeTab, setActiveTab] = useState<'logistica' | 'predial' | 'fiscal'>('logistica');
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
    <div className="min-h-screen bg-[#070811] text-[#F5F3FA] flex flex-col selection:bg-[#8B5CF6] selection:text-white">
      {/* Top Bar for Master & Login */}
      <header className="border-b border-[#2D2644] bg-[#0A0914]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B5CF6] via-[#7C3AED] to-[#D946EF] p-[1.5px] shadow-lg shadow-[#8B5CF6]/30">
              <div className="w-full h-full bg-[#0D0B18] rounded-[10px] flex items-center justify-center font-black text-white text-base">
                <span className="bg-gradient-to-r from-white via-[#C4B5FD] to-[#D946EF] bg-clip-text text-transparent">
                  M
                </span>
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                Movi<span className="text-[#8B5CF6]">Log</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30">
                  SaaS Multiempresa
                </span>
              </span>
              <p className="text-[10px] text-[#AAA6B5]">Movimento inteligente. Controle total.</p>
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
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#AAA6B5] hover:text-white transition flex items-center gap-1.5 border border-[#2D2644] hover:border-[#8B5CF6]/40"
              >
                <Lock className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>Entrar no Sistema</span>
              </button>
            )}

            <button
              onClick={() => {
                setSelectedPlanForCheckout('plan_demo');
                setIsRegisterModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-[#8B5CF6]/25"
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
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-[#8B5CF6]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[280px] bg-[#D946EF]/10 rounded-full blur-[110px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A162B] border border-[#3E345D] text-xs font-semibold text-[#C4B5FD] mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-[#D946EF]" />
            <span>Ecossistema MoviLog — Logística, Roteirização, Documentos Fiscais & Gestão Predial</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Movi<span className="text-[#8B5CF6]">Log</span> <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#C4B5FD] to-[#D946EF]">
              Movimento inteligente.
            </span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#EC4899]">
              Controle total.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#AAA6B5] max-w-3xl mx-auto leading-relaxed">
            Plataforma unificada para transportadoras, operadores logísticos e edifícios empresariais:
            roteirizador geográfico com cálculo de capacidade, mapa operacional em tempo real,
            emissão fiscal de NF-e, CT-e e MDF-e, expedição com QR Code e portaria com PIN seguro.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setSelectedPlanForCheckout('plan_demo');
                setIsRegisterModalOpen(true);
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-[#8B5CF6]/30"
            >
              <Boxes className="w-4 h-4" />
              <span>Solicitar Demonstração Gratuita (7 Dias)</span>
            </button>

            <a
              href="#planos"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#121024] hover:bg-[#1A162B] border border-[#2D2644] text-[#F5F3FA] font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <span>Ver Planos Comerciais</span>
              <ChevronRight className="w-4 h-4 text-[#AAA6B5]" />
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-[#AAA6B5]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Multiempresa com isolamento seguro no servidor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Central Fiscal NF-e, CT-e e MDF-e com simulador</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Rastreamento público com link e PIN seguro</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Master Owner com controle global permanente</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Products Showcase */}
      <section className="py-16 bg-[#0A0914] border-y border-[#2D2644]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C4B5FD] bg-[#8B5CF6]/15 px-3 py-1 rounded-full border border-[#8B5CF6]/30">
              Arquitetura Modular Integrada
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Conheça os Módulos MoviLog
            </h2>
            <p className="text-xs text-[#AAA6B5] mt-2">
              Alterne abaixo para explorar os recursos de cada módulo especializado.
            </p>

            <div className="mt-6 inline-flex p-1 bg-[#121024] rounded-2xl border border-[#2D2644] flex-wrap justify-center gap-1">
              <button
                onClick={() => setActiveTab('logistica')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'logistica'
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/30'
                    : 'text-[#AAA6B5] hover:text-white'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>1. Transporte & Roteirizador</span>
              </button>
              <button
                onClick={() => setActiveTab('fiscal')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'fiscal'
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/30'
                    : 'text-[#AAA6B5] hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>2. Central Fiscal (NF-e/CT-e/MDF-e)</span>
              </button>
              <button
                onClick={() => setActiveTab('predial')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'predial'
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/30'
                    : 'text-[#AAA6B5] hover:text-white'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>3. Gestão Predial & Portaria</span>
              </button>
            </div>
          </div>

          {/* Module 1 Display: Logistics & Routing */}
          {activeTab === 'logistica' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#121024] border border-[#2D2644] rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center mb-4 border border-[#8B5CF6]/30">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Roteirizador & Otimização</h3>
                <p className="text-xs text-[#AAA6B5] leading-relaxed">
                  Sequenciamento de paradas com cálculo inteligente de quilometragem, tempo estimado e capacidade volumétrica e de peso por tipo de veículo.
                </p>
              </div>

              <div className="bg-[#121024] border border-[#2D2644] rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center mb-4 border border-[#8B5CF6]/30">
                  <Radio className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Mapa Operacional & GPS</h3>
                <p className="text-xs text-[#AAA6B5] leading-relaxed">
                  Telemetria ao vivo da frota, localização de motoristas, status de entregas em andamento e linha de tempo com estimativas de chegada.
                </p>
              </div>

              <div className="bg-[#121024] border border-[#2D2644] rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center mb-4 border border-[#8B5CF6]/30">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Expedição & QR Code</h3>
                <p className="text-xs text-[#AAA6B5] leading-relaxed">
                  Conferência física de carga, geração de etiquetas com QR Code rastreável, comprovante digital de entrega (POD) e gestão de avarias.
                </p>
              </div>
            </div>
          )}

          {/* Module 2 Display: Fiscal */}
          {activeTab === 'fiscal' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#121024] border border-[#2D2644] rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center mb-4 border border-[#8B5CF6]/30">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Emissão de NF-e, CT-e e MDF-e</h3>
                <p className="text-xs text-[#AAA6B5] leading-relaxed">
                  Geração em lote e individual de documentos fiscais de transporte e mercadorias com chave de acesso de 44 dígitos, protocolo e cálculo de frete.
                </p>
              </div>

              <div className="bg-[#121024] border border-[#2D2644] rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center mb-4 border border-[#8B5CF6]/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Simulador SEFAZ & Homologação</h3>
                <p className="text-xs text-[#AAA6B5] leading-relaxed">
                  Ambiente de testes para homologação com retorno imediato de autorização, além de suporte para certificado digital modelo A1.
                </p>
              </div>

              <div className="bg-[#121024] border border-[#2D2644] rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center mb-4 border border-[#8B5CF6]/30">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Visualizador XML & DANFE</h3>
                <p className="text-xs text-[#AAA6B5] leading-relaxed">
                  Pré-visualização do espelho DANFE / DACTE formatado para impressão, download do XML padrão nacional e carta de correção (CC-e).
                </p>
              </div>
            </div>
          )}

          {/* Module 3 Display: Predial */}
          {activeTab === 'predial' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#121024] border border-[#2D2644] rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center mb-4 border border-[#8B5CF6]/30">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Encomendas com PIN & WhatsApp</h3>
                <p className="text-xs text-[#AAA6B5] leading-relaxed">
                  Recebimento na portaria com geração automática de PIN de 4 dígitos e aviso instantâneo via WhatsApp. Baixa segura na retirada.
                </p>
              </div>

              <div className="bg-[#121024] border border-[#2D2644] rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center mb-4 border border-[#8B5CF6]/30">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Visitantes & Prestadores</h3>
                <p className="text-xs text-[#AAA6B5] leading-relaxed">
                  Controle rigoroso de portaria com registro de documento, empresa prestadora, morador autorizador e tempo de permanência.
                </p>
              </div>

              <div className="bg-[#121024] border border-[#2D2644] rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center mb-4 border border-[#8B5CF6]/30">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Unidades & Moradores</h3>
                <p className="text-xs text-[#AAA6B5] leading-relaxed">
                  Estrutura de torres, andares e conjuntos corporativos com proteção LGPD e histórico de retiradas por unidade.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C4B5FD] bg-[#8B5CF6]/15 px-3 py-1 rounded-full border border-[#8B5CF6]/30">
            Transparência Comercial
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-2">
            Planos Comerciais Gerenciados pelo Master Owner
          </h2>
          <p className="text-xs text-[#AAA6B5] mt-2">
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
                className={`relative rounded-3xl p-6 border flex flex-col justify-between transition-all ${
                  p.destaque
                    ? 'bg-[#121024] border-[#8B5CF6] ring-2 ring-[#8B5CF6]/40 shadow-2xl shadow-[#8B5CF6]/20'
                    : 'bg-[#0E0C1C] border-[#2D2644] hover:border-[#8B5CF6]/40'
                }`}
              >
                {p.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                    Mais Escolhido
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-white">{p.nome}</h3>
                  <p className="text-xs text-[#AAA6B5] mt-1 min-h-[36px]">{p.descricao}</p>

                  <div className="my-5">
                    {isDemo ? (
                      <div className="text-2xl font-black text-white">Grátis (7 Dias)</div>
                    ) : isCustom ? (
                      <div className="text-2xl font-black text-white">Sob Consulta</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-[#AAA6B5]">R$</span>
                        <span className="text-3xl font-black text-white">{p.precoMensal}</span>
                        <span className="text-xs text-[#AAA6B5]">/mês</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs space-y-1.5 py-3 border-y border-[#2D2644] text-[#C4B5FD]">
                    <div className="flex justify-between">
                      <span className="text-[#AAA6B5]">Usuários:</span>
                      <span className="font-bold text-white">{p.limites.maxUsuarios}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#AAA6B5]">Unidades/Galpões:</span>
                      <span className="font-bold text-white">{p.limites.maxUnidades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#AAA6B5]">Operações/mês:</span>
                      <span className="font-bold text-white">{p.limites.maxOperacoesMes.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-2 text-xs">
                    {p.recursos.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-[#AAA6B5]">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight text-white/90">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-[#2D2644]">
                  <button
                    onClick={() => handleContractPlan(p)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      isDemo
                        ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white shadow-lg shadow-[#8B5CF6]/25'
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
      <footer className="mt-auto border-t border-[#2D2644] bg-[#0A0914] py-8 text-xs text-[#716A85]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center font-bold text-white text-xs">
              M
            </div>
            <span className="font-bold text-white">Movi<span className="text-[#8B5CF6]">Log</span> SaaS</span>
            <span>• Movimento inteligente. Controle total.</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Master Owner Oficial: {masterEmail}</span>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-[#AAA6B5] hover:text-[#C4B5FD] underline underline-offset-4"
            >
              Acessar Plataforma
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
