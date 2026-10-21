import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  FileSpreadsheet,
  Navigation,
  Compass,
  Radio,
  Truck,
  Users,
  Building,
  FileCheck,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  UserCheck,
  Sparkles
} from 'lucide-react';

export interface TheXLogSidebarProps {
  currentModule: string;
  activeView: string;
  onNavigate: (module: string, view?: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const TheXLogSidebar: React.FC<TheXLogSidebarProps> = ({
  currentModule,
  activeView,
  onNavigate,
  mobileOpen,
  setMobileOpen
}) => {
  const { user, company, isMaster, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role || 'driver';

  // Navigation Items according to Specification 4
  const navSections = [
    {
      title: 'Operacional',
      items: [
        {
          id: 'overview',
          label: 'Visão Geral',
          icon: LayoutDashboard,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher', 'operator'],
          module: 'dashboard',
          view: 'overview'
        },
        {
          id: 'deliveries',
          label: 'Entregas',
          icon: Package,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'routing',
          view: 'deliveries'
        },
        {
          id: 'import',
          label: 'Importação de Planilhas',
          icon: FileSpreadsheet,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'routing',
          view: 'import'
        },
        {
          id: 'routes',
          label: 'Planejamento de Rotas',
          icon: Navigation,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'routing',
          view: 'planner'
        },
        {
          id: 'map',
          label: 'Mapa Operacional',
          icon: Compass,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'routing',
          view: 'map'
        }
      ]
    },
    {
      title: 'Frota & Rastreamento',
      items: [
        {
          id: 'gps',
          label: 'Rastreamento GPS',
          icon: Radio,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'routing',
          view: 'fleet'
        },
        {
          id: 'fleet',
          label: 'Frota e Veículos',
          icon: Truck,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'routing',
          view: 'fleet'
        },
        {
          id: 'drivers',
          label: 'Motoristas & Entregadores',
          icon: Users,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'routing',
          view: 'drivers'
        }
      ]
    },
    {
      title: 'Controle & Qualidade',
      items: [
        {
          id: 'clients',
          label: 'Clientes e Destinatários',
          icon: Users,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'routing',
          view: 'clients'
        },
        {
          id: 'pod',
          label: 'Comprovantes de Entrega',
          icon: FileCheck,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher', 'driver'],
          module: 'routing',
          view: 'pod'
        },
        {
          id: 'occurrences',
          label: 'Ocorrências / Insucessos',
          icon: AlertTriangle,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'routing',
          view: 'occurrences'
        },
        {
          id: 'reports',
          label: 'Relatórios Gerenciais',
          icon: BarChart3,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'routing',
          view: 'reports'
        }
      ]
    },
    {
      title: 'Módulos Especiais',
      items: [
        {
          id: 'condo',
          label: 'Gestão Predial (Portaria)',
          icon: Building,
          allowedRoles: ['master_owner', 'company_admin', 'operator'],
          module: 'predial',
          view: 'packages'
        },
        {
          id: 'driver_panel',
          label: 'Painel do Entregador',
          icon: UserCheck,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher', 'driver'],
          module: 'driver',
          view: 'driver_panel'
        }
      ]
    },
    {
      title: 'Administração',
      items: [
        {
          id: 'master',
          label: isMaster ? 'Painel Master Owner' : 'Configurações',
          icon: isMaster ? ShieldCheck : Settings,
          allowedRoles: ['master_owner'],
          module: 'master',
          view: 'master_dashboard'
        }
      ]
    }
  ];

  const handleItemClick = (moduleName: string, viewName?: string) => {
    onNavigate(moduleName, viewName);
    setMobileOpen(false);
  };

  const isCurrentActive = (m: string, v?: string) => {
    if (m === 'dashboard' && currentModule === 'dashboard') return true;
    if (m === 'driver' && currentModule === 'driver') return true;
    if (m === 'master' && currentModule === 'master') return true;
    if (m === 'predial' && currentModule === 'predial') return true;
    if (m === 'routing' && currentModule === 'routing' && v === activeView) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#07090e] border-r border-slate-800/80 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0 bg-[#07090e]">
          <div
            onClick={() => handleItemClick('dashboard', 'overview')}
            className="flex items-center gap-3 cursor-pointer group overflow-hidden"
          >
            {/* TheXLog Geometric Glowing Logo */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-600 p-[1.5px] shadow-lg shadow-violet-600/30 shrink-0 group-hover:scale-105 transition">
              <div className="w-full h-full bg-[#0b0d14] rounded-[10px] flex items-center justify-center font-black text-white text-base">
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                  X
                </span>
              </div>
            </div>

            {!collapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg text-white tracking-tight">TheXLog</span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    SaaS
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 tracking-wider block truncate">
                  Logística Inteligente
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
            title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter(item =>
              item.allowedRoles.includes(role) || isMaster
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                {!collapsed && (
                  <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                    {section.title}
                  </span>
                )}
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const active = isCurrentActive(item.module, item.view);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.module, item.view)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition group text-left ${
                        active
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition ${active ? 'text-white' : 'text-slate-400 group-hover:text-violet-400'}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Bottom User Card & Quick Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-[#07090e] shrink-0">
          <div className={`p-2.5 rounded-2xl bg-slate-950 border border-slate-800/90 flex items-center justify-between gap-3 ${collapsed ? 'flex-col' : ''}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center font-bold text-xs text-violet-300 shrink-0">
                {user?.name?.slice(0, 2).toUpperCase() || 'TX'}
              </div>
              {!collapsed && (
                <div className="truncate text-left">
                  <span className="text-xs font-bold text-white block truncate">
                    {user?.name || 'Administrador'}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate font-mono">
                    {isMaster ? 'Master Owner' : user?.role || 'Operador'}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition shrink-0"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
