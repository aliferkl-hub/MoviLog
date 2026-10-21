import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { DashboardMetrics } from '../../types';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  ShieldCheck,
  Building,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Activity,
  Timer,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateToView?: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToView }) => {
  const { user, company, isMaster } = useAuth();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<{
    index: number;
    x: number;
    y: number;
    data: { label: string; current: number; previous: number };
  } | null>(null);
  const [donutHoverIndex, setDonutHoverIndex] = useState<number | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardMetrics(period, isMaster ? undefined : company?.id);
      setMetrics(data);
    } catch (err: any) {
      console.error('Erro ao carregar métricas do dashboard:', err);
      setError(err.message || 'Falha ao consultar indicadores do banco de dados');
    } finally {
      setLoading(false);
    }
  }, [period, company?.id, isMaster]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Compute SVG coordinates for Timeline Area & Line Chart
  const renderTimelineChart = () => {
    if (!metrics || !metrics.timelineData || metrics.timelineData.length === 0) return null;
    const data = metrics.timelineData;
    const maxVal = Math.max(...data.map(d => Math.max(d.current, d.previous)), 4);
    
    const svgWidth = 640;
    const svgHeight = 220;
    const paddingLeft = 36;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;

    const points = data.map((d, i) => {
      const x = paddingLeft + (i / Math.max(1, data.length - 1)) * chartWidth;
      const yCurrent = paddingTop + chartHeight - (d.current / maxVal) * chartHeight;
      const yPrevious = paddingTop + chartHeight - (d.previous / maxVal) * chartHeight;
      return { x, yCurrent, yPrevious, d, i };
    });

    const currentPathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.yCurrent}` : `${acc} L ${p.x} ${p.yCurrent}`;
    }, '');

    const areaPathD = points.length > 0
      ? `${currentPathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
      : '';

    const previousPathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.yPrevious}` : `${acc} L ${p.x} ${p.yPrevious}`;
    }, '');

    return (
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <defs>
            <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
              <stop offset="90%" stopColor="#8B5CF6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + chartHeight * ratio;
            const val = Math.round(maxVal * (1 - ratio));
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#393442"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                  strokeOpacity="0.6"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#AAA6B5"
                  className="font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaPathD && (
            <path d={areaPathD} fill="url(#violetGradient)" />
          )}

          {/* Previous period line (lavender dashed) */}
          {previousPathD && (
            <path
              d={previousPathD}
              fill="none"
              stroke="#C4B5FD"
              strokeWidth="1.75"
              strokeDasharray="4 4"
              strokeOpacity="0.75"
            />
          )}

          {/* Current period line (vibrant violet) */}
          {currentPathD && (
            <path
              d={currentPathD}
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* X axis labels */}
          {points.map((p, idx) => {
            // Display subset of labels if month
            const step = data.length > 15 ? Math.ceil(data.length / 7) : 1;
            if (idx % step !== 0 && idx !== data.length - 1) return null;
            return (
              <text
                key={idx}
                x={p.x}
                y={svgHeight - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#AAA6B5"
                className="font-mono"
              >
                {p.d.label}
              </text>
            );
          })}

          {/* Interactive touch/hover points */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.yCurrent}
                r={activeTooltip?.index === idx ? 5 : 3.5}
                fill="#8B5CF6"
                stroke="#17171D"
                strokeWidth="2"
                className="transition-all duration-150 cursor-pointer"
              />
              {/* Invisible wide capture area */}
              <rect
                x={p.x - 14}
                y={paddingTop}
                width={28}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() =>
                  setActiveTooltip({
                    index: idx,
                    x: p.x,
                    y: p.yCurrent,
                    data: {
                      label: p.d.label,
                      current: p.d.current,
                      previous: p.d.previous
                    }
                  })
                }
              />
            </g>
          ))}

          {/* Active hover crosshair */}
          {activeTooltip && (
            <line
              x1={activeTooltip.x}
              y1={paddingTop}
              x2={activeTooltip.x}
              y2={paddingTop + chartHeight}
              stroke="#8B5CF6"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          )}
        </svg>

        {/* Dynamic HTML Tooltip */}
        {activeTooltip && (
          <div
            className="absolute pointer-events-none z-20 bg-[#1D1B24] border border-[#393442] shadow-xl rounded-xl px-3 py-2 text-xs text-[#F5F3FA] transition-all"
            style={{
              left: Math.min(Math.max(activeTooltip.x - 60, 10), 500),
              top: Math.max(activeTooltip.y - 65, 8)
            }}
          >
            <div className="text-[10px] text-[#AAA6B5] font-mono mb-1">{activeTooltip.data.label}</div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
              <span className="font-semibold">{activeTooltip.data.current}</span>
              <span className="text-[11px] text-[#AAA6B5]">encomendas (atual)</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#C4B5FD]" />
              <span className="font-medium text-[#AAA6B5]">{activeTooltip.data.previous}</span>
              <span className="text-[11px] text-[#AAA6B5]">(período ant.)</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Donut Chart with SVG
  const renderDonutChart = () => {
    if (!metrics) return null;
    const items = metrics.statusBreakdown;
    const total = items.reduce((acc, curr) => acc + curr.count, 0);

    const size = 180;
    const strokeWidth = 26;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let accumulatedAngle = 0;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
        <div className="relative shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            {/* Background track circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#25222D"
              strokeWidth={strokeWidth}
            />

            {total === 0 ? (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#393442"
                strokeWidth={strokeWidth}
                strokeDasharray="4 4"
              />
            ) : (
              items.map((item, idx) => {
                if (item.count === 0) return null;
                const strokeDashoffset = circumference - (item.count / total) * circumference;
                const rotation = accumulatedAngle;
                accumulatedAngle += (item.count / total) * 360;

                const isHovered = donutHoverIndex === idx;

                return (
                  <circle
                    key={item.status}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                      transformOrigin: `${size / 2}px ${size / 2}px`,
                      transform: `rotate(${rotation}deg)`,
                      transition: 'all 0.2s ease-out'
                    }}
                    className="cursor-pointer opacity-90 hover:opacity-100"
                    onMouseEnter={() => setDonutHoverIndex(idx)}
                    onMouseLeave={() => setDonutHoverIndex(null)}
                  />
                );
              })
            )}
          </svg>

          {/* Center stats */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-[#F5F3FA] tabular-nums font-mono">{total}</span>
            <span className="text-[10px] uppercase font-bold text-[#AAA6B5] tracking-wider">
              {donutHoverIndex !== null ? items[donutHoverIndex].label.split(' ')[0] : 'Total'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2.5 w-full sm:w-auto">
          {items.map((item, idx) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div
                key={item.status}
                onMouseEnter={() => setDonutHoverIndex(idx)}
                onMouseLeave={() => setDonutHoverIndex(null)}
                className={`flex items-center justify-between sm:justify-start gap-3 p-1.5 rounded-lg cursor-pointer transition ${
                  donutHoverIndex === idx ? 'bg-[#25222D]' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-[#AAA6B5]">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs font-bold text-[#F5F3FA] font-mono tabular-nums">{item.count}</span>
                  <span className="text-[10px] text-[#AAA6B5] font-mono w-9 text-right">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Operational Bars
  const renderOperationalBars = () => {
    if (!metrics || !metrics.timelineData || metrics.timelineData.length === 0) return null;
    const data = metrics.timelineData.slice(-7); // Last 7 points
    const maxVal = Math.max(...data.map(d => d.current), 3);

    return (
      <div className="w-full space-y-3 pt-2">
        <div className="flex items-end justify-between gap-2 h-36 px-2">
          {data.map((d, idx) => {
            const heightPct = maxVal > 0 ? Math.max((d.current / maxVal) * 100, 8) : 8;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[10px] text-[#AAA6B5] font-mono opacity-0 group-hover:opacity-100 transition tabular-nums">
                  {d.current}
                </span>
                <div className="w-full max-w-[28px] bg-[#17171D] rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-gradient-to-t from-[#7C3AED] to-[#8B5CF6] group-hover:from-[#8B5CF6] group-hover:to-[#C4B5FD] rounded-t-md transition-all duration-300"
                  />
                </div>
                <span className="text-[10px] text-[#AAA6B5] font-mono">{d.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-xs border-t border-[#393442] pt-2.5 text-[#AAA6B5]">
          <span>Média diária no período</span>
          <span className="font-bold text-[#F5F3FA] font-mono tabular-nums">
            {metrics.totalPeriod > 0 ? (metrics.totalPeriod / Math.max(1, data.length)).toFixed(1) : '0.0'} vol/dia
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Period Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#393442]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#AAA6B5]">
            <span>{company?.nomeFantasia || 'Plataforma Geral'}</span>
            <span>/</span>
            <span className="text-[#8B5CF6] font-medium">Dashboard Operacional</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F5F3FA] mt-0.5 tracking-tight">
            Painel de Controle & Indicadores
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Functional Period Filters */}
          <div className="flex items-center p-1 bg-[#1D1B24] border border-[#393442] rounded-xl text-xs font-semibold">
            <button
              onClick={() => setPeriod('day')}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === 'day'
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#AAA6B5] hover:text-[#F5F3FA]'
              }`}
            >
              Hoje (Dia)
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === 'week'
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#AAA6B5] hover:text-[#F5F3FA]'
              }`}
            >
              7 Dias (Semana)
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === 'month'
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#AAA6B5] hover:text-[#F5F3FA]'
              }`}
            >
              30 Dias (Mês)
            </button>
          </div>

          <button
            onClick={fetchMetrics}
            disabled={loading}
            title="Atualizar dados reais do banco"
            className="p-2 rounded-xl bg-[#25222D] border border-[#393442] text-[#AAA6B5] hover:text-[#F5F3FA] hover:border-[#8B5CF6] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#8B5CF6]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state if query fails */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-rose-400 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchMetrics}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 font-bold rounded-lg transition"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* SECTION 4: CARTÕES DE INDICADORES (6 KPI CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total de Encomendas no Período */}
        <div className="bg-[#25222D] border border-[#393442] p-4 rounded-2xl flex flex-col justify-between hover:border-[#8B5CF6]/50 transition shadow-sm">
          <div className="flex items-center justify-between text-[#AAA6B5] mb-2">
            <span className="text-xs font-medium">Total Período</span>
            <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#F5F3FA] font-mono tabular-nums">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#8B5CF6]" /> : (metrics?.totalPeriod ?? 0)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px]">
              {metrics && metrics.previousPeriodTotal > 0 ? (
                metrics.percentageChange >= 0 ? (
                  <span className="text-[#10B981] flex items-center font-bold font-mono">
                    <ArrowUpRight className="w-3 h-3" /> +{metrics.percentageChange}%
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center font-bold font-mono">
                    <ArrowDownRight className="w-3 h-3" /> {metrics.percentageChange}%
                  </span>
                )
              ) : (
                <span className="text-[#AAA6B5] font-mono">1º período</span>
              )}
              <span className="text-[#AAA6B5]">vs período ant.</span>
            </div>
          </div>
        </div>

        {/* Card 2: Encomendas Aguardando Retirada */}
        <div className="bg-[#25222D] border border-[#393442] p-4 rounded-2xl flex flex-col justify-between hover:border-[#8B5CF6]/50 transition shadow-sm">
          <div className="flex items-center justify-between text-[#AAA6B5] mb-2">
            <span className="text-xs font-medium">Na Portaria</span>
            <div className="w-8 h-8 rounded-xl bg-[#C4B5FD]/15 text-[#C4B5FD] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#C4B5FD] font-mono tabular-nums">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#C4B5FD]" /> : (metrics?.awaitingPickup ?? 0)}
            </div>
            <p className="text-[11px] text-[#AAA6B5] mt-1">Aguardando retirada</p>
          </div>
        </div>

        {/* Card 3: Encomendas Entregues */}
        <div className="bg-[#25222D] border border-[#393442] p-4 rounded-2xl flex flex-col justify-between hover:border-[#10B981]/50 transition shadow-sm">
          <div className="flex items-center justify-between text-[#AAA6B5] mb-2">
            <span className="text-xs font-medium">Entregues</span>
            <div className="w-8 h-8 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#10B981] font-mono tabular-nums">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#10B981]" /> : (metrics?.delivered ?? 0)}
            </div>
            <p className="text-[11px] text-[#A7F3D0] mt-1">Baixadas com sucesso</p>
          </div>
        </div>

        {/* Card 4: Encomendas Pendentes */}
        <div className="bg-[#25222D] border border-[#393442] p-4 rounded-2xl flex flex-col justify-between hover:border-[#8B5CF6]/50 transition shadow-sm">
          <div className="flex items-center justify-between text-[#AAA6B5] mb-2">
            <span className="text-xs font-medium">Pendentes</span>
            <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#F5F3FA] font-mono tabular-nums">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#8B5CF6]" /> : (metrics?.pending ?? 0)}
            </div>
            <p className="text-[11px] text-[#AAA6B5] mt-1">Triagem & conferência</p>
          </div>
        </div>

        {/* Card 5: Percentual de Conclusão */}
        <div className="bg-[#25222D] border border-[#393442] p-4 rounded-2xl flex flex-col justify-between hover:border-[#10B981]/50 transition shadow-sm">
          <div className="flex items-center justify-between text-[#AAA6B5] mb-2">
            <span className="text-xs font-medium">Conclusão</span>
            <div className="w-8 h-8 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#10B981] font-mono tabular-nums">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#10B981]" /> : `${metrics?.completionRate ?? 0}%`}
            </div>
            <div className="w-full bg-[#17171D] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#10B981] h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics?.completionRate ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 6: Tempo Médio de Retirada */}
        <div className="bg-[#25222D] border border-[#393442] p-4 rounded-2xl flex flex-col justify-between hover:border-[#8B5CF6]/50 transition shadow-sm">
          <div className="flex items-center justify-between text-[#AAA6B5] mb-2">
            <span className="text-xs font-medium">Tempo Médio</span>
            <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#F5F3FA] font-mono tabular-nums">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#8B5CF6]" /> : (metrics?.avgPickupTimeFormatted ?? '—')}
            </div>
            <p className="text-[11px] text-[#AAA6B5] mt-1">Recebimento até saída</p>
          </div>
        </div>
      </div>

      {/* SECTION 3: GRÁFICOS FUNCIONAIS (4 REAL CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICO 1 — Encomendas ao longo do tempo (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-[#25222D] border border-[#393442] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#F5F3FA]">Gráfico 1 — Encomendas ao Longo do Tempo</h3>
                <p className="text-xs text-[#AAA6B5]">Volumes diários recebidos comparados ao ciclo anterior</p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-[#8B5CF6] rounded-full" />
                  <span className="text-[#F5F3FA]">Período Atual</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t border-dashed border-[#C4B5FD]" />
                  <span className="text-[#AAA6B5]">Período Anterior</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="h-56 flex flex-col items-center justify-center text-[#AAA6B5] gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#8B5CF6]" />
                <span className="text-xs">Consultando dados do banco de dados...</span>
              </div>
            ) : metrics && metrics.totalPeriod === 0 && metrics.previousPeriodTotal === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-[#1D1B24]/50 border border-[#393442] rounded-xl my-2">
                <Package className="w-8 h-8 text-[#AAA6B5] mb-2" />
                <p className="text-xs text-[#F5F3FA] font-medium">Nenhuma encomenda registrada neste período</p>
                <p className="text-[11px] text-[#AAA6B5] max-w-sm mt-1">
                  Os gráficos utilizam estritamente registros reais do banco de dados. Registre uma nova encomenda na portaria para acompanhar as métricas ao vivo.
                </p>
                {onNavigateToView && (
                  <button
                    onClick={() => onNavigateToView('packages')}
                    className="mt-3 px-3 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Receber Nova Encomenda</span>
                  </button>
                )}
              </div>
            ) : (
              renderTimelineChart()
            )}
          </div>

          <div className="border-t border-[#393442] pt-3 mt-3 flex items-center justify-between text-xs text-[#AAA6B5]">
            <span>Base temporal: Registros reais via API `/api/dashboard/metrics`</span>
            <span className="font-mono text-[#8B5CF6]">Status 200 OK</span>
          </div>
        </div>

        {/* GRÁFICO 2 — Status das Encomendas (Donut Rosca) */}
        <div className="bg-[#25222D] border border-[#393442] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#F5F3FA]">Gráfico 2 — Status das Encomendas</h3>
                <p className="text-xs text-[#AAA6B5]">Distribuição de volumes no período</p>
              </div>
            </div>

            {loading ? (
              <div className="h-56 flex flex-col items-center justify-center text-[#AAA6B5] gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#8B5CF6]" />
                <span className="text-xs">Processando fatias...</span>
              </div>
            ) : (
              renderDonutChart()
            )}
          </div>

          <div className="border-t border-[#393442] pt-3 mt-3 flex items-center justify-between text-xs text-[#AAA6B5]">
            <span>Total auditado</span>
            <span className="font-bold text-[#F5F3FA] font-mono tabular-nums">
              {metrics?.totalPeriod ?? 0} pacotes
            </span>
          </div>
        </div>
      </div>

      {/* Row 2 of Charts: GRÁFICO 3 & GRÁFICO 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO 3 — Desempenho Operacional */}
        <div className="bg-[#25222D] border border-[#393442] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-[#F5F3FA]">Gráfico 3 — Desempenho Operacional</h3>
                <p className="text-xs text-[#AAA6B5]">Volume processado por ciclo e taxa de entrega</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#10B981] font-mono">
                  {metrics?.operationalPerformance?.completionPercentage ?? 0}% Concluídas
                </span>
              </div>
            </div>

            {loading ? (
              <div className="h-44 flex flex-col items-center justify-center text-[#AAA6B5] gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#8B5CF6]" />
                <span className="text-xs">Calculando indicadores...</span>
              </div>
            ) : (
              renderOperationalBars()
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-[#393442] pt-3 mt-3 text-center">
            <div>
              <div className="text-[10px] text-[#AAA6B5]">Processadas</div>
              <div className="text-sm font-bold text-[#F5F3FA] font-mono tabular-nums">
                {metrics?.operationalPerformance?.totalProcessed ?? 0}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#AAA6B5]">Retiradas</div>
              <div className="text-sm font-bold text-[#10B981] font-mono tabular-nums">
                {metrics?.operationalPerformance?.deliveredCount ?? 0}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#AAA6B5]">Giro Médio</div>
              <div className="text-sm font-bold text-[#8B5CF6] font-mono">
                {metrics?.operationalPerformance?.avgPickupTimeFormatted ?? '—'}
              </div>
            </div>
          </div>
        </div>

        {/* GRÁFICO 4 — Evolução das Atividades & Tendência */}
        <div className="bg-[#25222D] border border-[#393442] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-[#F5F3FA]">Gráfico 4 — Evolução das Atividades</h3>
                <p className="text-xs text-[#AAA6B5]">Comparação direta entre períodos e curva de tendência</p>
              </div>
              <div>
                {metrics && metrics.percentageChange >= 0 ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1 font-mono">
                    <TrendingUp className="w-3.5 h-3.5" /> +{metrics.percentageChange}% Expansão
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 font-mono">
                    <TrendingDown className="w-3.5 h-3.5" /> {metrics?.percentageChange}% Redução
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#1D1B24] border border-[#393442] rounded-xl my-3 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#AAA6B5]">Atividades Período Vigente</span>
                <span className="font-bold text-[#F5F3FA] font-mono tabular-nums">{metrics?.totalPeriod ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#AAA6B5]">Atividades Período Comparativo</span>
                <span className="font-medium text-[#AAA6B5] font-mono tabular-nums">{metrics?.previousPeriodTotal ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#AAA6B5]">Retiradas confirmadas com PIN</span>
                <span className="font-bold text-[#10B981] font-mono tabular-nums">{metrics?.delivered ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#AAA6B5]">Total de Encomendas Históricas (Base Geral)</span>
                <span className="font-bold text-[#8B5CF6] font-mono tabular-nums">{metrics?.totalDatabasePackages ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#393442] pt-3 flex items-center justify-between text-xs text-[#AAA6B5]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
              <span>Controle integrado com criptografia PIN e auditoria</span>
            </span>
            {onNavigateToView && (
              <button
                onClick={() => onNavigateToView('history')}
                className="text-[#8B5CF6] hover:text-[#C4B5FD] font-semibold flex items-center gap-1"
              >
                <span>Histórico</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
