import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { CommercialCashSession } from '../../types';
import {
  Wallet,
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  QrCode,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  User,
  X,
  History,
  TrendingUp,
  Info
} from 'lucide-react';

interface CommerceCashViewProps {
  modulo: 'adega' | 'tabacaria';
}

export const CommerceCashView: React.FC<CommerceCashViewProps> = ({ modulo }) => {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<CommercialCashSession | null>(null);
  const [pastSessions, setPastSessions] = useState<CommercialCashSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isOpenCashModal, setIsOpenCashModal] = useState(false);
  const [isCloseCashModal, setIsCloseCashModal] = useState(false);
  const [isMovementModal, setIsMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<'suprimento' | 'sangria'>('sangria');

  // Forms
  const [saldoInicialInput, setSaldoInicialInput] = useState('100.00');
  const [saldoContadoInput, setSaldoContadoInput] = useState('');
  const [observacoesFechamento, setObservacoesFechamento] = useState('');
  const [movimentoValor, setMovimentoValor] = useState('');
  const [movimentoMotivo, setMovimentoMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [currentRes, historyRes] = await Promise.all([
        api.getCurrentCashSession(modulo),
        api.getCashHistory()
      ]);
      setCurrentSession(currentRes.session || null);
      // Filter past sessions matching module or geral
      const list = (historyRes.sessions || []).filter(
        s => s.modulo === modulo || s.modulo === 'geral'
      );
      setPastSessions(list);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar dados do caixa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [modulo]);

  // Open Cash Register
  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const saldo = Math.max(0, parseFloat(saldoInicialInput) || 0);
      const res = await api.openCashSession({ saldoInicial: saldo, modulo });
      if (res.success) {
        setSuccessMsg(`Caixa aberto com sucesso com saldo inicial de R$ ${saldo.toFixed(2)}.`);
        setIsOpenCashModal(false);
        loadData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao abrir caixa.');
    } finally {
      setSubmitting(false);
    }
  };

  // Add Cash Movement (Sangria or Suprimento)
  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession) return;
    const valor = Math.max(0, parseFloat(movimentoValor) || 0);
    if (valor <= 0) {
      setErrorMsg('Informe um valor válido maior que zero.');
      return;
    }
    if (!movimentoMotivo.trim()) {
      setErrorMsg('Informe o motivo ou autorização da movimentação.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const res = await api.addCashMovement(currentSession.id, {
        tipo: movementType,
        valor,
        motivo: movimentoMotivo.trim()
      });
      if (res.success) {
        setSuccessMsg(
          `${movementType === 'sangria' ? 'Sangria' : 'Suprimento'} de R$ ${valor.toFixed(2)} registrado.`
        );
        setIsMovementModal(false);
        setMovimentoValor('');
        setMovimentoMotivo('');
        loadData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar movimentação.');
    } finally {
      setSubmitting(false);
    }
  };

  // Close Cash Register
  const handleCloseCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession) return;
    const saldoContado = Math.max(0, parseFloat(saldoContadoInput) || 0);

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const res = await api.closeCashSession(currentSession.id, {
        saldoContadoDinheiro: saldoContado,
        observacoes: observacoesFechamento.trim() || undefined
      });
      if (res.success) {
        const diff = res.diferenca;
        const diffText =
          diff === 0
            ? 'Caixa conciliado perfeitamente (diferença zero).'
            : diff > 0
            ? `Caixa fechado com SOBRA de R$ ${diff.toFixed(2)}.`
            : `Caixa fechado com FALTA de R$ ${Math.abs(diff).toFixed(2)}.`;

        setSuccessMsg(`Caixa fechado com sucesso. ${diffText}`);
        setIsCloseCashModal(false);
        setSaldoContadoInput('');
        setObservacoesFechamento('');
        loadData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao fechar caixa.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121024] border border-[#262042] rounded-2xl p-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#8B5CF6]" />
            Frente de Caixa & Conciliação — {modulo === 'adega' ? 'Adega' : 'Tabacaria'}
          </h2>
          <p className="text-xs text-[#AAA6B5]">
            Abertura, fechamento cego, sangrias, suprimentos de troco e conciliação de valores por forma de pagamento.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {currentSession ? (
            <>
              <button
                onClick={() => {
                  setMovementType('suprimento');
                  setIsMovementModal(true);
                }}
                className="px-3 py-2 bg-[#1A1633] hover:bg-[#262042] border border-[#2E2854] text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>+ Suprimento</span>
              </button>

              <button
                onClick={() => {
                  setMovementType('sangria');
                  setIsMovementModal(true);
                }}
                className="px-3 py-2 bg-[#1A1633] hover:bg-[#262042] border border-[#2E2854] text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>- Sangria</span>
              </button>

              <button
                onClick={() => {
                  setSaldoContadoInput(currentSession.saldoEsperadoDinheiro.toFixed(2));
                  setIsCloseCashModal(true);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-rose-900/30"
              >
                <Lock className="w-4 h-4" />
                <span>Fechar Caixa</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsOpenCashModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-900/30"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Novo Caixa</span>
            </button>
          )}
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

      {/* Current Active Session Status */}
      {currentSession ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Saldo Inicial */}
            <div className="bg-[#121024] border border-[#262042] rounded-2xl p-4">
              <span className="text-[11px] text-[#AAA6B5] block mb-1">Saldo Inicial (Troco)</span>
              <span className="text-lg font-black text-white">
                R$ {currentSession.saldoInicial.toFixed(2)}
              </span>
              <span className="text-[10px] text-[#716A86] block mt-1">Abertura do dia</span>
            </div>

            {/* Vendas Dinheiro */}
            <div className="bg-[#121024] border border-[#262042] rounded-2xl p-4">
              <span className="text-[11px] text-[#AAA6B5] block mb-1">Vendas em Dinheiro</span>
              <span className="text-lg font-black text-emerald-400">
                R$ {currentSession.totalVendasDinheiro.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-400/80 block mt-1">Em espécie na gaveta</span>
            </div>

            {/* Vendas PIX */}
            <div className="bg-[#121024] border border-[#262042] rounded-2xl p-4">
              <span className="text-[11px] text-[#AAA6B5] block mb-1">Vendas via PIX</span>
              <span className="text-lg font-black text-cyan-400">
                R$ {currentSession.totalVendasPix.toFixed(2)}
              </span>
              <span className="text-[10px] text-cyan-400/80 block mt-1">Direto na conta</span>
            </div>

            {/* Vendas Cartão */}
            <div className="bg-[#121024] border border-[#262042] rounded-2xl p-4">
              <span className="text-[11px] text-[#AAA6B5] block mb-1">Cartão Débito / Crédito</span>
              <span className="text-lg font-black text-purple-400">
                R$ {currentSession.totalVendasCartao.toFixed(2)}
              </span>
              <span className="text-[10px] text-purple-400/80 block mt-1">Maquininhas TEF/POS</span>
            </div>

            {/* Saldo Esperado em Espécie */}
            <div className="bg-gradient-to-br from-[#1A1633] to-[#121024] border border-[#8B5CF6]/40 rounded-2xl p-4">
              <span className="text-[11px] text-[#C4B5FD] font-semibold block mb-1">
                Saldo Esperado na Gaveta
              </span>
              <span className="text-xl font-black text-emerald-300">
                R$ {currentSession.saldoEsperadoDinheiro.toFixed(2)}
              </span>
              <span className="text-[10px] text-[#AAA6B5] block mt-1">
                Inicial + Entradas - Sangrias
              </span>
            </div>
          </div>

          {/* Session Details: Operator, Opening Time, Movements List */}
          <div className="bg-[#121024] border border-[#262042] rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-3 border-b border-[#262042] text-xs">
              <div className="flex items-center gap-2 text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold">Caixa Aberto: {currentSession.codigoSessao}</span>
                <span className="text-[#AAA6B5]">({new Date(currentSession.abertoEm).toLocaleString('pt-BR')})</span>
              </div>
              <div className="text-[#AAA6B5] mt-1 sm:mt-0">
                Operador Responsável: <strong className="text-white">{currentSession.operadorNome}</strong>
              </div>
            </div>

            {/* Manual Movements in this session */}
            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#8B5CF6]" />
              Movimentações Manuais na Sessão ({currentSession.movimentacoesManuais?.length || 0})
            </h4>

            {!currentSession.movimentacoesManuais || currentSession.movimentacoesManuais.length === 0 ? (
              <p className="text-xs text-[#AAA6B5] italic">Nenhuma sangria ou suprimento registrado nesta sessão.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {currentSession.movimentacoesManuais.map(m => (
                  <div
                    key={m.id}
                    className="p-2 rounded-xl bg-[#0A0714] border border-[#262042] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.tipo === 'sangria'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {m.tipo.toUpperCase()}
                      </span>
                      <span className="text-white font-medium">{m.motivo}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[#AAA6B5] text-[11px]">
                      <span>Autorizado: {m.autorizadoPor}</span>
                      <span>{new Date(m.dataHora).toLocaleTimeString('pt-BR')}</span>
                      <span
                        className={`font-bold ${
                          m.tipo === 'sangria' ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {m.tipo === 'sangria' ? '-' : '+'} R$ {m.valor.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#121024] border border-[#262042] rounded-2xl p-12 text-center text-[#AAA6B5] space-y-3">
          <Lock className="w-10 h-10 mx-auto text-[#262042]" />
          <h3 className="text-sm font-bold text-white">O caixa está fechado no momento</h3>
          <p className="text-xs max-w-md mx-auto">
            Abra o caixa informando o saldo inicial em dinheiro (troco) para iniciar a operação de frente de caixa do dia.
          </p>
          <button
            onClick={() => setIsOpenCashModal(true)}
            className="px-5 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition shadow-lg shadow-[#8B5CF6]/30"
          >
            <Unlock className="w-4 h-4" />
            <span>Abrir Caixa Agora</span>
          </button>
        </div>
      )}

      {/* Financial Reality Clarification Notice */}
      <div className="bg-[#121024]/60 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3 text-xs text-[#AAA6B5]">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-white">Transparência Financeira: Faturamento não é Lucro Líquido</p>
          <p className="leading-relaxed">
            Os totais de caixa exibem as entradas financeiras brutas recebidas no período. Para apurar o resultado real, consulte o painel executivo que desconta o Custo das Mercadorias Vendidas (CMV). As margens brutas calculadas não incluem despesas operacionais fixas (aluguel, energia, salários) ou impostos.
          </p>
        </div>
      </div>

      {/* Past Sessions History Table */}
      <div className="bg-[#121024] border border-[#262042] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#262042] flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-[#8B5CF6]" />
            Histórico de Fechamentos Anteriores
          </h3>
          <span className="text-[11px] text-[#AAA6B5]">{pastSessions.length} sessões registradas</span>
        </div>

        {pastSessions.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#AAA6B5]">Nenhum caixa fechado anteriormente.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#262042] bg-[#0A0714]/60 text-[11px] font-bold text-[#AAA6B5] uppercase">
                  <th className="py-3 px-4">Sessão</th>
                  <th className="py-3 px-4">Operador</th>
                  <th className="py-3 px-4">Abertura</th>
                  <th className="py-3 px-4">Fechamento</th>
                  <th className="py-3 px-4 text-right">Inicial</th>
                  <th className="py-3 px-4 text-right">Vendas Totais</th>
                  <th className="py-3 px-4 text-right">Saldo Esperado</th>
                  <th className="py-3 px-4 text-right">Saldo Contado</th>
                  <th className="py-3 px-4 text-right">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262042]/50">
                {pastSessions.map(s => {
                  const totalVendas =
                    s.totalVendasDinheiro + s.totalVendasPix + s.totalVendasCartao + s.totalVendasOutros;
                  const diff = s.diferenca || 0;

                  return (
                    <tr key={s.id} className="hover:bg-[#1A1633]/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-white">{s.codigoSessao}</td>
                      <td className="py-3 px-4 text-[#C4B5FD]">{s.operadorNome}</td>
                      <td className="py-3 px-4 text-[#AAA6B5] whitespace-nowrap">
                        {new Date(s.abertoEm).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-[#AAA6B5] whitespace-nowrap">
                        {s.fechadoEm ? new Date(s.fechadoEm).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-[#AAA6B5]">
                        R$ {s.saldoInicial.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        R$ {totalVendas.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#AAA6B5]">
                        R$ {s.saldoEsperadoDinheiro.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        R$ {(s.saldoContadoDinheiro ?? s.saldoEsperadoDinheiro).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-bold ${
                            diff === 0
                              ? 'text-emerald-400'
                              : diff > 0
                              ? 'text-blue-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {diff === 0 ? 'Exato' : (diff > 0 ? `+ R$ ${diff.toFixed(2)}` : `- R$ ${Math.abs(diff).toFixed(2)}`)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Open Cash */}
      {isOpenCashModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121024] border border-[#262042] rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-white">
            <button
              onClick={() => setIsOpenCashModal(false)}
              className="absolute top-4 right-4 text-[#AAA6B5] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-emerald-400" />
              Abertura de Caixa
            </h3>
            <p className="text-xs text-[#AAA6B5] mb-4">
              Informe o valor de troco inicial colocado na gaveta do caixa.
            </p>

            <form onSubmit={handleOpenCash} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                  Saldo Inicial / Fundo de Troco (R$) *
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required
                  value={saldoInicialInput}
                  onChange={e => setSaldoInicialInput(e.target.value)}
                  className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-base font-bold text-emerald-400 focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#262042]">
                <button
                  type="button"
                  onClick={() => setIsOpenCashModal(false)}
                  className="px-4 py-2 bg-[#1A1633] text-[#AAA6B5] hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/30"
                >
                  {submitting ? 'Abrindo...' : 'Confirmar Abertura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sangria / Suprimento */}
      {isMovementModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121024] border border-[#262042] rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-white">
            <button
              onClick={() => setIsMovementModal(false)}
              className="absolute top-4 right-4 text-[#AAA6B5] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              {movementType === 'sangria' ? (
                <>
                  <ArrowUpRight className="w-5 h-5 text-rose-400" />
                  Registrar Sangria de Caixa (Retirada)
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                  Registrar Suprimento de Caixa (Reforço)
                </>
              )}
            </h3>

            <form onSubmit={handleAddMovement} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                  Valor da Movimentação (R$) *
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0.01"
                  required
                  placeholder="0,00"
                  value={movimentoValor}
                  onChange={e => setMovimentoValor(e.target.value)}
                  className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-base font-bold text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                  Motivo / Destino / Autorização *
                </label>
                <textarea
                  required
                  rows={2}
                  value={movimentoMotivo}
                  onChange={e => setMovimentoMotivo(e.target.value)}
                  placeholder={
                    movementType === 'sangria'
                      ? 'Ex: Recolhimento de excesso para cofre; Pagamento de entrega motoboy.'
                      : 'Ex: Adição de moedas e notas de pequeno valor para troco.'
                  }
                  className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white placeholder-[#AAA6B5] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#262042]">
                <button
                  type="button"
                  onClick={() => setIsMovementModal(false)}
                  className="px-4 py-2 bg-[#1A1633] text-[#AAA6B5] hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition shadow-lg ${
                    movementType === 'sangria'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                  }`}
                >
                  {submitting ? 'Salvando...' : 'Confirmar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Close Cash Register */}
      {isCloseCashModal && currentSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121024] border border-[#262042] rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-white">
            <button
              onClick={() => setIsCloseCashModal(false)}
              className="absolute top-4 right-4 text-[#AAA6B5] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-400" />
              Fechamento & Conciliação de Caixa
            </h3>
            <p className="text-xs text-[#AAA6B5] mb-4">
              Realize a contagem física do dinheiro em espécie presente na gaveta e confirme os valores.
            </p>

            <form onSubmit={handleCloseCash} className="space-y-4">
              <div className="bg-[#0A0714] border border-[#262042] rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-[#AAA6B5]">
                  <span>Saldo Inicial:</span>
                  <span>R$ {currentSession.saldoInicial.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Vendas em Dinheiro:</span>
                  <span>+ R$ {currentSession.totalVendasDinheiro.toFixed(2)}</span>
                </div>
                {currentSession.suprimentos > 0 && (
                  <div className="flex justify-between text-cyan-400">
                    <span>Suprimentos Adicionados:</span>
                    <span>+ R$ {currentSession.suprimentos.toFixed(2)}</span>
                  </div>
                )}
                {currentSession.sangrias > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Sangrias Efetuadas:</span>
                    <span>- R$ {currentSession.sangrias.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-white pt-1 border-t border-[#262042]">
                  <span>Saldo Esperado em Espécie:</span>
                  <span>R$ {currentSession.saldoEsperadoDinheiro.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                  Saldo Físico Contado na Gaveta (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={saldoContadoInput}
                  onChange={e => setSaldoContadoInput(e.target.value)}
                  className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-base font-bold text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              {/* Live difference preview */}
              {saldoContadoInput && (
                <div className="text-xs flex justify-between items-center px-1">
                  <span className="text-[#AAA6B5]">Diferença Apurada:</span>
                  <span
                    className={`font-bold ${
                      parseFloat(saldoContadoInput) - currentSession.saldoEsperadoDinheiro === 0
                        ? 'text-emerald-400'
                        : parseFloat(saldoContadoInput) - currentSession.saldoEsperadoDinheiro > 0
                        ? 'text-blue-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {(parseFloat(saldoContadoInput) - currentSession.saldoEsperadoDinheiro) === 0
                      ? 'R$ 0,00 (Caixa Exato)'
                      : `R$ ${(parseFloat(saldoContadoInput) - currentSession.saldoEsperadoDinheiro).toFixed(2)}`}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[#AAA6B5] mb-1 block">
                  Observações de Fechamento (opcional)
                </label>
                <textarea
                  rows={2}
                  value={observacoesFechamento}
                  onChange={e => setObservacoesFechamento(e.target.value)}
                  placeholder="Justifique qualquer diferença de valores..."
                  className="w-full bg-[#0A0714] border border-[#262042] rounded-xl px-3 py-2 text-xs text-white placeholder-[#AAA6B5] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#262042]">
                <button
                  type="button"
                  onClick={() => setIsCloseCashModal(false)}
                  className="px-4 py-2 bg-[#1A1633] text-[#AAA6B5] hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-900/30"
                >
                  {submitting ? 'Encerrando...' : 'Confirmar Fechamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
