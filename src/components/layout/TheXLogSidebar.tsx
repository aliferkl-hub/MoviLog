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
  Sparkles,
  FileText,
  Boxes,
  Send,
  DollarSign,
  QrCode,
  UserPlus,
  Wine,
  Flame
} from 'lucide-react';

export interface TheXLogSidebarProps {
  currentModule: string;
  activeView: string;
  onNavigate: (module: string, view?: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenPublicTrack?: () => void;
}

export const TheXLogSidebar: React.FC<TheXLogSidebarProps> = ({
  currentModule,
  activeView,
  onNavigate,
  mobileOpen,
  setMobileOpen,
  onOpenPublicTrack
}) => {
  const { user, company, isMaster, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role || 'driver';

  const navSections = [
    {
      title: 'Principal',
      items: [
        {
          id: 'overview',
          label: 'Painel MoviLog',
          icon: LayoutDashboard,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher', 'operator', 'financial'],
          module: 'dashboard',
          view: 'overview'
        }
      ]
    },
    {
      title: 'Operações de Transporte',
      items: [
        {
          id: 'deliveries',
          label: 'Gestão de Entregas',
          icon: Package,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'routing',
          view: 'deliveries'
        },
        {
          id: 'import',
          label: 'Importar Planilhas',
          icon: FileSpreadsheet,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'routing',
          view: 'import'
        },
        {
          id: 'routes',
          label: 'Roteirizador & Otimização',
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
      title: 'Armazém & Cadeia de Custódia',
      items: [
        {
          id: 'receipts',
          label: 'Recebimento & QR Code',
          icon: Truck,
          allowedRoles: ['master_owner', 'company_admin', 'operator', 'dispatcher'],
          module: 'logistica',
          view: 'receipts'
        },
        {
          id: 'inventory',
          label: 'Estoque & Posições',
          icon: Boxes,
          allowedRoles: ['master_owner', 'company_admin', 'operator', 'dispatcher'],
          module: 'logistica',
          view: 'inventory'
        },
        {
          id: 'shipments',
          label: 'Expedição & Despacho',
          icon: Send,
          allowedRoles: ['master_owner', 'company_admin', 'operator', 'dispatcher'],
          module: 'logistica',
          view: 'shipments'
        }
      ]
    },
    {
      title: 'Frota & Telemetria',
      items: [
        {
          id: 'fleet',
          label: 'Veículos & Rastreamento GPS',
          icon: Radio,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'routing',
          view: 'fleet'
        },
        {
          id: 'drivers',
          label: 'Motoristas & Condutores',
          icon: Users,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'routing',
          view: 'drivers'
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
      title: 'Central Fiscal',
      items: [
        {
          id: 'fiscal_docs',
          label: 'Documentos NF-e / CT-e',
          icon: FileText,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher', 'financial'],
          module: 'fiscal',
          view: 'documents'
        }
      ]
    },
    {
      title: 'Controle & Qualidade',
      items: [
        {
          id: 'pod',
          label: 'Comprovantes de Entrega (POD)',
          icon: FileCheck,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher', 'driver'],
          module: 'routing',
          view: 'pod'
        },
        {
          id: 'occurrences',
          label: 'Ocorrências & Insucessos',
          icon: AlertTriangle,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'routing',
          view: 'occurrences'
        },
        {
          id: 'clients',
          label: 'Destinatários & Clientes',
          icon: Users,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'routing',
          view: 'clients'
        }
      ]
    },
    {
      title: 'Gestão Predial & Portaria',
      items: [
        {
          id: 'packages',
          label: 'Encomendas & PIN Seguro',
          icon: Package,
          allowedRoles: ['master_owner', 'company_admin', 'operator', 'concierge'],
          module: 'predial',
          view: 'packages'
        },
        {
          id: 'visitors',
          label: 'Visitantes & Acessos',
          icon: UserPlus,
          allowedRoles: ['master_owner', 'company_admin', 'operator', 'concierge'],
          module: 'predial',
          view: 'visitors'
        },
        {
          id: 'units',
          label: 'Unidades & Moradores',
          icon: Building,
          allowedRoles: ['master_owner', 'company_admin', 'operator', 'concierge'],
          module: 'predial',
          view: 'units'
        }
      ]
    },
    {
      title: 'Comércio & Varejo Especializado',
      items: [
        {
          id: 'adega',
          label: 'Módulo Adega & Bebidas',
          icon: Wine,
          allowedRoles: ['master_owner', 'company_admin', 'operator', 'dispatcher', 'financial'],
          module: 'adega',
          view: 'pos'
        },
        {
          id: 'tabacaria',
          label: 'Módulo Tabacaria & Headshop',
          icon: Flame,
          allowedRoles: ['master_owner', 'company_admin', 'operator', 'dispatcher', 'financial'],
          module: 'tabacaria',
          view: 'pos'
        }
      ]
    },
    {
      title: 'Gestão Financeira',
      items: [
        {
          id: 'financial',
          label: 'Custos & Faturamento',
          icon: DollarSign,
          allowedRoles: ['master_owner', 'company_admin', 'financial'],
          module: 'financial',
          view: 'records'
        },
        {
          id: 'reports',
          label: 'Relatórios Gerenciais',
          icon: BarChart3,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher', 'financial'],
          module: 'routing',
          view: 'reports'
        }
      ]
    },
    {
      title: 'Administração & Gestão',
      items: [
        ...(isMaster ? [{
          id: 'master',
          label: 'Painel Master Owner',
          icon: ShieldCheck,
          allowedRoles: ['master_owner'],
          module: 'master',
          view: 'master_dashboard'
        }] : []),
        {
          id: 'team_users',
          label: 'Equipe & Colaboradores',
          icon: Users,
          allowedRoles: ['master_owner', 'company_admin', 'dispatcher'],
          module: 'master',
          view: 'users'
        },
        {
          id: 'company_settings',
          label: 'Configurações da Empresa',
          icon: Settings,
          allowedRoles: ['master_owner', 'company_admin'],
          module: 'master',
          view: 'settings'
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
    if (m === 'master' && currentModule === 'master' && v === activeView) return true;
    if (m === 'fiscal' && currentModule === 'fiscal') return true;
    if (m === 'financial' && currentModule === 'financial') return true;
    if (m === 'logistica' && currentModule === 'logistica' && v === activeView) return true;
    if (m === 'predial' && currentModule === 'predial' && v === activeView) return true;
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
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0A0914] border-r border-[#2D2644] transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#2D2644] shrink-0 bg-[#0A0914]">
          <div
            onClick={() => handleItemClick('dashboard', 'overview')}
            className="flex items-center gap-3 cursor-pointer group overflow-hidden"
          >
            {/* MoviLog Geometric Glowing Logo */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B5CF6] via-[#7C3AED] to-[#D946EF] p-[1.5px] shadow-lg shadow-[#8B5CF6]/30 shrink-0 group-hover:scale-105 transition">
              <div className="w-full h-full bg-[#0D0B18] rounded-[10px] flex items-center justify-center font-black text-white text-base">
                <span className="bg-gradient-to-r from-white via-[#C4B5FD] to-[#D946EF] bg-clip-text text-transparent">
                  M
                </span>
              </div>
            </div>

            {!collapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg tracking-tight text-white">
                    Movi<span className="text-[#8B5CF6]">Log</span>
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30">
                    SaaS
                  </span>
                </div>
                <span className="text-[10px] text-[#AAA6B5] tracking-wider block truncate">
                  Movimento inteligente
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-[#AAA6B5] hover:text-white hover:bg-[#1C1829] border border-transparent hover:border-[#2D2644] transition"
            title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-[#AAA6B5] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Public Tracking Shortcut Button in Sidebar */}
        {!collapsed && onOpenPublicTrack && (
          <div className="px-3 pt-3">
            <button
              onClick={onOpenPublicTrack}
              className="w-full py-2 px-3 rounded-xl bg-[#1C1829] hover:bg-[#252037] border border-[#8B5CF6]/30 text-xs font-semibold text-[#C4B5FD] flex items-center justify-between transition group shadow-sm"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>Rastreio Público</span>
              </div>
              <ChevronRight className="w-3 h-3 text-[#AAA6B5] group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        )}

        {/* Navigation Menu List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter(item =>
              isMaster || item.allowedRoles.includes(role)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                {!collapsed && (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#716A85]">
                    {section.title}
                  </div>
                )}

                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const active = isCurrentActive(item.module, item.view);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.module, item.view)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                        active
                          ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/25 font-bold'
                          : 'text-[#AAA6B5] hover:text-white hover:bg-[#16132C]'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          active
                            ? 'text-white scale-110'
                            : 'text-[#AAA6B5] group-hover:text-[#C4B5FD] group-hover:scale-105'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer User & Logout */}
        <div className="p-3 border-t border-[#2D2644] bg-[#0A0914] shrink-0">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-[#121024] border border-[#2D2644] ${
              collapsed ? 'justify-center p-1' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-xs font-bold text-[#C4B5FD] shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {user?.name || 'Operador MoviLog'}
                </span>
                <span className="text-[10px] text-[#AAA6B5] block truncate capitalize">
                  {user?.role.replace('_', ' ') || 'Motorista'}
                </span>
              </div>
            )}

            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg text-[#AAA6B5] hover:text-rose-400 hover:bg-[#1C1829] transition shrink-0"
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
