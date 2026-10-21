import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TheXLogSidebar } from './TheXLogSidebar';
import { DemoBanner } from './DemoBanner';
import {
  Menu,
  ShieldCheck,
  Radio,
  Plus,
  Compass,
  Bell,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface TheXLogLayoutProps {
  currentModule: string;
  activeView: string;
  onNavigate: (module: string, view?: string) => void;
  children: React.ReactNode;
}

export const TheXLogLayout: React.FC<TheXLogLayoutProps> = ({
  currentModule,
  activeView,
  onNavigate,
  children
}) => {
  const { user, company, isMaster, isDemo, demoDaysLeft, setIsPlanModalOpen } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Derive human-readable page title
  const getPageTitle = () => {
    if (currentModule === 'dashboard') return 'Visão Geral & Indicadores';
    if (currentModule === 'driver') return 'Painel do Entregador (Mobile & GPS)';
    if (currentModule === 'master') return 'Painel Master Owner — Gestão Global';
    if (currentModule === 'predial') return 'Gestão Predial & Controle de Encomendas';

    if (currentModule === 'routing') {
      switch (activeView) {
        case 'deliveries': return 'Gestão de Entregas & Destinatários';
        case 'import': return 'Importação de Planilhas (CSV/XLSX)';
        case 'planner': return 'Planejamento de Rotas & Roteirizador';
        case 'map': return 'Mapa Operacional em Tempo Real';
        case 'fleet': return 'Frota, Veículos & Rastreamento GPS';
        case 'drivers': return 'Motoristas & Condutores';
        case 'clients': return 'Clientes & Destinatários';
        case 'pod': return 'Comprovantes de Entrega (POD)';
        case 'occurrences': return 'Ocorrências & Insucessos Operacionais';
        case 'reports': return 'Relatórios Gerenciais & Exportação';
        default: return 'Logística Inteligente TheXLog';
      }
    }
    return 'TheXLog Suite';
  };

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100 flex flex-col selection:bg-violet-600 selection:text-white">
      {/* Sidebar Navigation */}
      <TheXLogSidebar
        currentModule={currentModule}
        activeView={activeView}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Layout with Left Padding for Sidebar */}
      <div className="lg:pl-64 flex flex-col flex-1 transition-all duration-300">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800/80 bg-[#07090e]/85 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
              title="Abrir Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">TheXLog /</span>
                <h1 className="text-sm font-bold text-white tracking-tight">{getPageTitle()}</h1>
              </div>
            </div>
          </div>

          {/* Right: Telemetry status, Company Pill & Master Badge */}
          <div className="flex items-center gap-3">
            {/* Live Telemetry Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Rede Operacional Conectada</span>
            </div>

            {/* Master Owner Badge */}
            {isMaster && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full flex items-center gap-1.5 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Master Owner</span>
              </span>
            )}

            {/* Company Info */}
            <div className="text-right hidden md:block">
              <span className="text-xs font-bold text-slate-200 block truncate max-w-[180px]">
                {company?.nomeFantasia || 'TheXLog Sede Global'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Demo expiration notice banner */}
        <DemoBanner />

        {/* Main Routed Page Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};
