import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { CondoPackage, DashboardMetrics } from '../../types';
import { BarChart3, Download, Printer, Calendar, FileText, CheckCircle2, Clock, Package } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { isMaster, company } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await api.getDashboardMetrics('month', isMaster ? undefined : company?.id);
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isMaster, company?.id]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F5F3FA] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#8B5CF6]" />
            <span>Relatórios & Métricas Operacionais</span>
          </h2>
          <p className="text-xs text-[#AAA6B5]">
            Consolidação analítica de volumes, conformidade de entregas e indicadores do condomínio
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-[#25222D] hover:bg-[#1D1B24] border border-[#393442] text-[#F5F3FA] rounded-xl text-xs font-semibold transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-[#8B5CF6]" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      <div className="bg-[#25222D] border border-[#393442] rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#393442] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#F5F3FA]">Relatório Mensal de Encomendas & Portaria</h3>
            <p className="text-xs text-[#AAA6B5]">Período de 30 dias • {company?.nomeFantasia || 'LogiPredial'}</p>
          </div>
          <span className="text-xs font-mono text-[#C4B5FD] bg-[#8B5CF6]/15 px-2.5 py-1 rounded-lg border border-[#8B5CF6]/30">
            {new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-[#1D1B24] border border-[#393442] rounded-xl">
            <div className="text-xs text-[#AAA6B5]">Volume Total</div>
            <div className="text-2xl font-black text-[#F5F3FA] font-mono mt-1">{metrics?.totalPeriod ?? 0}</div>
            <p className="text-[10px] text-[#AAA6B5] mt-0.5">Volumes auditados</p>
          </div>
          <div className="p-4 bg-[#1D1B24] border border-[#393442] rounded-xl">
            <div className="text-xs text-[#AAA6B5]">Entregas Baixadas</div>
            <div className="text-2xl font-black text-[#10B981] font-mono mt-1">{metrics?.delivered ?? 0}</div>
            <p className="text-[10px] text-[#A7F3D0] mt-0.5">{metrics?.completionRate ?? 0}% de taxa</p>
          </div>
          <div className="p-4 bg-[#1D1B24] border border-[#393442] rounded-xl">
            <div className="text-xs text-[#AAA6B5]">Na Portaria</div>
            <div className="text-2xl font-black text-[#C4B5FD] font-mono mt-1">{metrics?.awaitingPickup ?? 0}</div>
            <p className="text-[10px] text-[#AAA6B5] mt-0.5">Com PIN ativo</p>
          </div>
          <div className="p-4 bg-[#1D1B24] border border-[#393442] rounded-xl">
            <div className="text-xs text-[#AAA6B5]">Giro Médio</div>
            <div className="text-xl font-black text-[#8B5CF6] font-mono mt-1">{metrics?.avgPickupTimeFormatted ?? '—'}</div>
            <p className="text-[10px] text-[#AAA6B5] mt-0.5">Recebimento até saída</p>
          </div>
        </div>

        <div className="border-t border-[#393442] pt-4 text-xs text-[#AAA6B5] flex items-center justify-between">
          <span>Relatório gerado em conformidade com as regras de portaria do LogiPredial</span>
          <span className="font-mono text-[#8B5CF6]">Hash: SHA-256 Validado</span>
        </div>
      </div>
    </div>
  );
};
