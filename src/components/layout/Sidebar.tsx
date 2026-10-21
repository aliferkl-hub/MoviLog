import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PackagePlus,
  Package,
  Boxes,
  Building,
  UserCheck,
  History,
  Users,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  X,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const { user, company, isMaster, isDemo, demoDaysLeft, logout, setIsPlanModalOpen, isSubscriptionExpired } = useAuth();

  const handleSelectView = (view: string) => {
    setActiveView(view);
    setIsOpenMobile(false);
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Métricas gerais e gráficos',
    },
    {
      id: 'packages_receive',
      label: 'Portaria & Recebimento',
      icon: PackagePlus,
      description: 'Entrada rápida de volumes',
    },
    {
      id: 'packages',
      label: 'Gestão de Encomendas',
      icon: Package,
      description: 'Baixa com PIN e WhatsApp',
    },
    {
      id: 'logistics',
      label: 'Logística & Expedição',
      icon: Boxes,
      description: 'Cargas, estoque e despacho',
      hidden: !isMaster && !company?.modulos.includes('logistica'),
    },
    {
      id: 'units',
      label: 'Moradores & Unidades',
      icon: Building,
      description: 'Apartamentos e contatos',
      hidden: !isMaster && !company?.modulos.includes('predial'),
    },
    {
      id: 'visitors',
      label: 'Portaria & Visitantes',
      icon: UserCheck,
      description: 'Acessos e prestadores',
      hidden: !isMaster && !company?.modulos.includes('predial'),
    },
    {
      id: 'history',
      label: 'Consulta & Histórico',
      icon: History,
      description: 'Auditoria e registros passados',
    },
    {
      id: 'users',
      label: 'Usuários & Permissões',
      icon: Users,
      description: 'Operadores e porteiros',
    },
    {
      id: 'reports',
      label: 'Relatórios & Métricas',
      icon: BarChart3,
      description: 'Exportação e KPIs',
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      description: 'Parâmetros da empresa',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#1D1B24] border-r border-[#393442] flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand Header */}
        <div className="p-5 border-b border-[#393442]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center text-white shadow-lg shadow-[#7C3AED]/20 shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-base tracking-tight text-[#F5F3FA]">
                  LogiPredial
                </div>
                <div className="text-[11px] text-[#AAA6B5] truncate max-w-[140px]">
                  {company?.nomeFantasia || 'Plataforma Global'}
                </div>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsOpenMobile(false)}
              className="p-1 rounded-lg text-[#AAA6B5] hover:text-[#F5F3FA] hover:bg-[#25222D] md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Master Owner Special Status or Demo Banner in Sidebar */}
          {isMaster ? (
            <div className="mt-3.5 p-2 bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                <span className="text-xs font-bold text-[#F5F3FA]">Master Owner</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#10B981] bg-[#10B981]/20 px-1.5 py-0.5 rounded-md font-mono">
                Ativo
              </span>
            </div>
          ) : isDemo ? (
            <div className="mt-3.5 p-2 bg-[#25222D] border border-[#393442] rounded-xl flex items-center justify-between">
              <div className="text-[11px] text-[#AAA6B5]">
                Demonstração: <span className="text-[#8B5CF6] font-bold">{demoDaysLeft}d</span>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(true)}
                className="text-[10px] font-bold text-[#8B5CF6] hover:text-[#C4B5FD] flex items-center gap-0.5"
              >
                <span>Planos</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ) : null}
        </div>

        {/* Center: Navigation Menu Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            if (item.hidden) return null;
            const Icon = item.icon;
            const isActive = activeView === item.id || (item.id === 'packages_receive' && activeView === 'packages_receive');

            return (
              <button
                key={item.id}
                onClick={() => handleSelectView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left group ${
                  isActive
                    ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/20'
                    : 'text-[#AAA6B5] hover:text-[#F5F3FA] hover:bg-[#25222D]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition ${
                    isActive ? 'text-white' : 'text-[#AAA6B5] group-hover:text-[#8B5CF6]'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{item.label}</div>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                )}
              </button>
            );
          })}

          {/* Master Owner Exclusive Navigation Section */}
          {isMaster && (
            <div className="pt-3 mt-3 border-t border-[#393442]">
              <div className="px-3 pb-1 text-[10px] font-bold text-[#AAA6B5] uppercase tracking-wider">
                Administração Global
              </div>
              <button
                onClick={() => handleSelectView('master_dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left group ${
                  activeView === 'master_dashboard'
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/30'
                    : 'text-[#C4B5FD] hover:text-white hover:bg-[#25222D] border border-[#8B5CF6]/30'
                }`}
              >
                <ShieldCheck
                  className={`w-4 h-4 shrink-0 ${
                    activeView === 'master_dashboard' ? 'text-white' : 'text-[#8B5CF6]'
                  }`}
                />
                <div className="flex-1 min-w-0 truncate">Painel Master Owner</div>
                {activeView === 'master_dashboard' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
                )}
              </button>
            </div>
          )}
        </nav>

        {/* Bottom: Profile & Logout */}
        <div className="p-3 border-t border-[#393442] bg-[#17171D]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#25222D] border border-[#393442]">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#F5F3FA] truncate">
                {user?.name || 'Administrador'}
              </div>
              <div className="text-[10px] text-[#AAA6B5] truncate">
                {user?.email}
              </div>
            </div>

            <button
              onClick={() => logout()}
              title="Sair da Plataforma"
              className="p-1.5 rounded-lg text-[#AAA6B5] hover:text-[#EF4444] hover:bg-[#17171D] transition shrink-0 ml-2"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
