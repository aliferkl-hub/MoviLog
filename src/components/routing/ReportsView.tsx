import React, { useState, useEffect } from 'react';
import { DeliveryItem, DeliveryRoute, Vehicle } from '../../types';
import { api } from '../../lib/api';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Package,
  Truck,
  Layers,
  Clock,
  Filter,
  Loader2,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [delRes, rouRes, vehRes] = await Promise.all([
        api.getDeliveries(),
        api.getRoutes(),
        api.getFleetVehicles()
      ]);
      setDeliveries(delRes.deliveries || []);
      setRoutes(rouRes.routes || []);
      setVehicles(vehRes.vehicles || []);
    } catch (e) {
      console.error('Erro ao carregar relatórios:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const total = deliveries.length;
  const entregues = deliveries.filter(d => d.status === 'entregue').length;
  const falhas = deliveries.filter(d => d.status === 'tentativa_falha').length;
  const pendentes = deliveries.filter(d => d.status === 'pendente').length;
  const emRota = deliveries.filter(d => d.status === 'em_rota' || d.status === 'planejada').length;

  const totalKg = deliveries.reduce((acc, d) => acc + (d.pesoKg || 0), 0);
  const totalVolumes = deliveries.reduce((acc, d) => acc + (d.volumes || 0), 0);
  const taxaSucesso = (entregues + falhas) > 0 ? Math.round((entregues / (entregues + falhas)) * 100) : 100;

  const exportExcel = () => {
    const dataToExport = deliveries.map(d => ({
      'Código de Rastreio': d.codigoRastreio,
      'Destinatário': d.destinatario,
      'Telefone': d.telefone,
      'Endereço': `${d.endereco}, ${d.numero}`,
      'Bairro': d.bairro,
      'Cidade': d.cidade,
      'UF': d.estado || 'SP',
      'CEP': d.cep,
      'Volumes': d.volumes,
      'Peso (kg)': d.pesoKg,
      'Prioridade': d.prioridade,
      'Status Operacional': d.status,
      'Recebedor': d.recebedorNome || '',
      'Documento Recebedor': d.recebedorDocumento || '',
      'Data Conclusão': d.entregueEm || '',
      'Motivo Insucesso': d.motivoFalha || '',
      'Motorista': d.motoristaNome || '',
      'Veículo': d.veiculoPlaca || '',
      'Data Cadastro': d.criadoEm
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatorio_Entregas');
    XLSX.writeFile(wb, `TheXLog_Relatorio_Operacional_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0b0d14] border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Relatórios Gerenciais & Indicadores Operacionais</span>
            </h2>
            <p className="text-xs text-slate-400">
              Auditoria de desempenho, volume transportado e exportação de dados consolidados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportExcel}
            disabled={deliveries.length === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Planilha Excel (.xlsx)</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c0e16] border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Taxa de Sucesso em Entregas</span>
          <div className="text-2xl font-black font-mono text-emerald-400">{taxaSucesso}%</div>
          <span className="text-[11px] text-slate-500">{entregues} de {entregues + falhas} finalizadas</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c0e16] border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Carga Total Movimentada</span>
          <div className="text-2xl font-black font-mono text-white">{totalKg.toFixed(1)} kg</div>
          <span className="text-[11px] text-slate-500">em {totalVolumes} volumes</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c0e16] border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Rotas Criadas no Período</span>
          <div className="text-2xl font-black font-mono text-violet-400">{routes.length}</div>
          <span className="text-[11px] text-slate-500">{routes.filter(r => r.status === 'concluida').length} concluídas</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c0e16] border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Veículos em Operação</span>
          <div className="text-2xl font-black font-mono text-sky-400">{vehicles.length}</div>
          <span className="text-[11px] text-slate-500">{vehicles.filter(v => v.statusOperacional === 'em_rota').length} em rota ativa</span>
        </div>
      </div>

      {/* Breakdown by City & Neighborhood */}
      <div className="p-6 rounded-3xl bg-[#0b0d14] border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>Resumo de Distribuição Territorial</span>
        </h3>
        <p className="text-xs text-slate-400">
          Distribuição de entregas por cidade e polo regional
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {Array.from(new Set(deliveries.map(d => d.cidade || 'São Paulo'))).map((cidade, i) => {
            const count = deliveries.filter(d => (d.cidade || 'São Paulo') === cidade).length;
            const pct = Math.round((count / (total || 1)) * 100);
            return (
              <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-white">{cidade}</span>
                  <span className="font-mono text-violet-400">{count} entregas ({pct}%)</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div style={{ width: `${pct}%` }} className="bg-violet-500 h-full rounded-full" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
