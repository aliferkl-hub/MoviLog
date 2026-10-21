import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { TheXLogSidebar } from './TheXLogSidebar';
import { DemoBanner } from './DemoBanner';
import { NotificationsDrawer } from '../notifications/NotificationsDrawer';
import { PublicTrackingModal } from '../tracking/PublicTrackingModal';
import { NotificationItem } from '../../types';
import {
  Menu,
  ShieldCheck,
  Radio,
  Plus,
  Compass,
  Bell,
  Sparkles,
  ExternalLink,
  Search,
  Calendar,
  Clock,
  QrCode
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
  const { user, company, isMaster, isDemo, demoDaysLeft } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPublicTrack, setShowPublicTrack] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Keep live time updated
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load notifications
  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [company?.id]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    } catch (e) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (e) {
      // ignore
    }
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    setShowPublicTrack(true);
  };

  // Human-readable page title
  const getPageTitle = () => {
    if (currentModule === 'dashboard') return 'Painel MoviLog — Visão Geral & Indicadores';
    if (currentModule === 'driver') return 'Painel do Entregador (App Mobile & GPS)';
    if (currentModule === 'master') return 'Painel Master Owner — Gestão Global & Licenças';
    if (currentModule === 'fiscal') return 'Central Fiscal — Emissão de NF-e, CT-e e MDF-e';
    if (currentModule === 'financial') return 'Gestão Financeira & Custos Operacionais';

    if (currentModule === 'logistica') {
      switch (activeView) {
        case 'receipts': return 'Recebimento & Conferência de Mercadorias';
        case 'inventory': return 'Estoque, Localizações & Posições';
        case 'shipments': return 'Expedição, Separação & Despacho';
        default: return 'Armazém & Cadeia de Custódia';
      }
    }

    if (currentModule === 'predial') {
      switch (activeView) {
        case 'packages': return 'Portaria — Encomendas & PIN Seguro';
        case 'visitors': return 'Portaria — Visitantes & Controle de Acesso';
        case 'units': return 'Condomínio — Unidades & Moradores';
        default: return 'Gestão Predial & Portaria';
      }
    }

    if (currentModule === 'routing') {
      switch (activeView) {
        case 'deliveries': return 'Gestão de Entregas & Importação';
        case 'import': return 'Importação de Planilhas (CSV/XLSX)';
        case 'planner': return 'Roteirizador Inteligente & Otimização';
        case 'map': return 'Mapa Operacional em Tempo Real';
        case 'fleet': return 'Frota de Veículos & Telemetria GPS';
        case 'drivers': return 'Motoristas & Condutores Cadastrados';
        case 'clients': return 'Clientes & Destinatários';
        case 'pod': return 'Comprovantes de Entrega (POD)';
        case 'occurrences': return 'Ocorrências & Insucessos Operacionais';
        case 'reports': return 'Relatórios Gerenciais & Exportações';
        default: return 'Logística Inteligente MoviLog';
      }
    }
    return 'MoviLog Suite';
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  return (
    <div className="min-h-screen bg-[#070811] text-[#F5F3FA] flex flex-col selection:bg-[#8B5CF6] selection:text-white font-sans">
      {/* Sidebar Navigation */}
      <TheXLogSidebar
        currentModule={currentModule}
        activeView={activeView}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onOpenPublicTrack={() => setShowPublicTrack(true)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 transition-all duration-300">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[#2D2644] bg-[#0A0914]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#AAA6B5] hover:text-white hover:bg-[#1C1829] border border-[#2D2644]"
              title="Abrir Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0 truncate">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#8B5CF6] font-mono font-bold hidden sm:inline">
                  Movi<span className="text-white">Log</span> /
                </span>
                <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                  {getPageTitle()}
                </h1>
              </div>
            </div>
          </div>

          {/* Center: Global Quick Tracking Search */}
          <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
            <form onSubmit={handleGlobalSearchSubmit} className="w-full relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#716A85]" />
              <input
                type="text"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                placeholder="Rastrear código ou PIN..."
                className="w-full pl-8 pr-4 py-1.5 bg-[#121024] border border-[#2D2644] rounded-xl text-xs text-white placeholder-[#716A85] focus:outline-none focus:border-[#8B5CF6] transition"
              />
            </form>
          </div>

          {/* Right: Date/Clock, Notifications, Telemetry, Master Badge & User */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Clock / Date */}
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-mono text-[#AAA6B5] bg-[#121024] px-2.5 py-1 rounded-xl border border-[#2D2644]">
              <Calendar className="w-3 h-3 text-[#8B5CF6]" />
              <span>{currentTime.toLocaleDateString('pt-BR')}</span>
              <span className="text-[#3E345D]">•</span>
              <Clock className="w-3 h-3 text-[#8B5CF6]" />
              <span>{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-xl text-[#AAA6B5] hover:text-white hover:bg-[#1C1829] border border-[#2D2644] transition"
              title="Notificações e Alertas"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D946EF] text-[9px] font-black text-white flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Operational Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Rede Operacional OK</span>
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
              <span className="text-xs font-bold text-white block truncate max-w-[160px]">
                {company?.nomeFantasia || 'MoviLog Matriz'}
              </span>
              <span className="text-[10px] text-[#AAA6B5] block truncate max-w-[160px]">
                {user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Demo expiration notice banner */}
        <DemoBanner />

        {/* Main Content View Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />

      {/* Public Tracking Modal */}
      <PublicTrackingModal
        isOpen={showPublicTrack}
        onClose={() => setShowPublicTrack(false)}
        initialCode={globalSearch}
      />
    </div>
  );
};
