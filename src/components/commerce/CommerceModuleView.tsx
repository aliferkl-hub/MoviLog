import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CommercePOSView } from './CommercePOSView';
import { CommerceProductsView } from './CommerceProductsView';
import { CommerceStockView } from './CommerceStockView';
import { CommerceCashView } from './CommerceCashView';
import { CommercePurchasesView } from './CommercePurchasesView';
import { CommerceDashboardView } from './CommerceDashboardView';
import { TerminalsIntegrationView } from './TerminalsIntegrationView';
import {
  Wine,
  Flame,
  ShoppingCart,
  Package,
  Boxes,
  Wallet,
  Truck,
  BarChart3,
  ArrowRightLeft,
  CreditCard
} from 'lucide-react';

interface CommerceModuleViewProps {
  modulo: 'adega' | 'tabacaria';
  activeView?: string;
  onNavigate: (module: string, view?: string) => void;
}

export const CommerceModuleView: React.FC<CommerceModuleViewProps> = ({
  modulo,
  activeView = 'pos',
  onNavigate
}) => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<'pos' | 'products' | 'stock' | 'cash' | 'purchases' | 'dashboard' | 'terminals'>(
    (activeView as any) || 'pos'
  );

  useEffect(() => {
    if (activeView && ['pos', 'products', 'stock', 'cash', 'purchases', 'dashboard', 'terminals'].includes(activeView)) {
      setCurrentTab(activeView as any);
    }
  }, [activeView]);

  const isAdega = modulo === 'adega';

  const tabs = [
    { id: 'pos', label: 'Ponto de Venda (PDV)', icon: ShoppingCart },
    { id: 'products', label: 'Produtos & Preços', icon: Package },
    { id: 'stock', label: 'Estoque & Baixas', icon: Boxes },
    { id: 'cash', label: 'Caixa & Fechamento', icon: Wallet },
    { id: 'terminals', label: 'Minhas Maquininhas', icon: CreditCard },
    { id: 'purchases', label: 'Compras & Fornecedores', icon: Truck },
    { id: 'dashboard', label: 'Indicadores & Relatórios', icon: BarChart3 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Brand Identity and Quick Switch */}
      <div className="bg-gradient-to-r from-[#121024] via-[#1A1633] to-[#121024] border border-[#262042] rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${
              isAdega
                ? 'bg-purple-600/20 text-purple-400 border-purple-500/40 shadow-purple-900/20'
                : 'bg-amber-600/20 text-amber-400 border-amber-500/40 shadow-amber-900/20'
            }`}
          >
            {isAdega ? <Wine className="w-6 h-6" /> : <Flame className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-tight">
                {isAdega ? 'Módulo Adega & Bebidas' : 'Módulo Tabacaria & Headshop'}
              </h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isAdega
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                {isAdega ? 'Bebidas & Conveniência' : 'Tabacaria & Artigos'}
              </span>
            </div>
            <p className="text-xs text-[#AAA6B5]">
              Sistema de gestão comercial integrado: PDV rápido com leitor de código de barras, estoque em tempo real e conciliação de caixa.
            </p>
          </div>
        </div>

        {/* Quick Switch to the other commercial module */}
        <button
          onClick={() => onNavigate(isAdega ? 'tabacaria' : 'adega', currentTab)}
          className="px-3.5 py-2 bg-[#0A0714] hover:bg-[#1A1633] border border-[#262042] text-xs font-semibold text-[#C4B5FD] rounded-xl flex items-center gap-2 transition shrink-0"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>Alternar para {isAdega ? 'Tabacaria' : 'Adega'}</span>
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin border-b border-[#262042]">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentTab(tab.id as any);
                onNavigate(modulo, tab.id);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30'
                  : 'text-[#AAA6B5] hover:text-white hover:bg-[#121024]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div>
        {currentTab === 'pos' && (
          <CommercePOSView
            modulo={modulo}
            onNavigateToCash={() => {
              setCurrentTab('cash');
              onNavigate(modulo, 'cash');
            }}
          />
        )}

        {currentTab === 'products' && (
          <CommerceProductsView
            modulo={modulo}
            onNavigateToStock={() => {
              setCurrentTab('stock');
              onNavigate(modulo, 'stock');
            }}
          />
        )}

        {currentTab === 'stock' && (
          <CommerceStockView modulo={modulo} />
        )}

        {currentTab === 'cash' && (
          <CommerceCashView modulo={modulo} />
        )}

        {currentTab === 'terminals' && (
          <TerminalsIntegrationView
            initialModulo={modulo}
            onNavigateToPOS={(m) => {
              setCurrentTab('pos');
              onNavigate(m, 'pos');
            }}
          />
        )}

        {currentTab === 'purchases' && (
          <CommercePurchasesView modulo={modulo} />
        )}

        {currentTab === 'dashboard' && (
          <CommerceDashboardView
            modulo={modulo}
            onNavigateToTab={(tab) => {
              setCurrentTab(tab as any);
              onNavigate(modulo, tab);
            }}
          />
        )}
      </div>
    </div>
  );
};
