import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, AlertTriangle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { isMaster, isDemo, demoDaysLeft, isSubscriptionExpired, company, setIsPlanModalOpen } = useAuth();

  if (isMaster) return null;

  if (isSubscriptionExpired) {
    return (
      <div className="bg-rose-500/20 border-b border-rose-500/30 px-4 py-2.5 text-xs text-rose-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">
              Período de Demonstração ou Assinatura Expirada:
            </span>
            <span>
              Todos os seus registros e dados estão 100% seguros e preservados. Selecione um plano para continuar operando.
            </span>
          </div>

          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition flex items-center gap-1 shadow shrink-0"
          >
            <span>Assinar Plano Comercial</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (isDemo) {
    return (
      <div className="bg-[#25222D] border-b border-[#393442] px-4 py-2 text-xs text-[#AAA6B5]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
            <span>
              Você está utilizando o <strong className="text-[#F5F3FA]">Plano Demonstração</strong> ({demoDaysLeft} dia(s) restante(s)).
            </span>
          </div>

          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="text-[#8B5CF6] hover:text-[#C4B5FD] font-bold flex items-center gap-1 underline underline-offset-4"
          >
            <span>Assinar Plano Definitivo</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
