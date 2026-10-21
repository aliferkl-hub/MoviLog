import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/landing/LandingPage';
import { Navbar } from './components/layout/Navbar';
import { DemoBanner } from './components/layout/DemoBanner';
import { LoginModal } from './components/auth/LoginModal';
import { MasterSetupModal } from './components/auth/MasterSetupModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { PlanModal } from './components/subscription/PlanModal';
import { MasterDashboard } from './components/master/MasterDashboard';
import { ReceiptsView } from './components/logistics/ReceiptsView';
import { InventoryView } from './components/logistics/InventoryView';
import { ShipmentsView } from './components/logistics/ShipmentsView';
import { PackagesView } from './components/condo/PackagesView';
import { VisitorsView } from './components/condo/VisitorsView';
import { UnitsView } from './components/condo/UnitsView';
import { DeliveriesView } from './components/routing/DeliveriesView';
import { FleetView } from './components/routing/FleetView';
import { DispatcherPlannerView } from './components/routing/DispatcherPlannerView';
import { DriverPanelView } from './components/routing/DriverPanelView';
import {
  Truck,
  Building,
  Package,
  Boxes,
  Send,
  UserPlus,
  Users,
  ShieldCheck,
  Loader2,
  Navigation,
  Compass,
  Radio,
  UserCheck
} from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user, company, isMaster, isLoading, isSubscriptionExpired, setIsPlanModalOpen } = useAuth();

  // Active module & view
  const [currentModule, setCurrentModule] = useState<'routing' | 'driver' | 'logistica' | 'predial' | 'master'>('routing');
  const [activeView, setActiveView] = useState<string>('planner');

  // Navigate automatically based on role and credentials when user logs in or changes
  useEffect(() => {
    if (!user) return;

    if (user.role === 'driver') {
      setCurrentModule('driver');
      setActiveView('driver_panel');
    } else if (user.role === 'dispatcher') {
      setCurrentModule('routing');
      setActiveView('planner');
    } else if (isMaster) {
      setCurrentModule('master');
      setActiveView('master_dashboard');
    } else if (company?.modulos?.includes('logistica')) {
      setCurrentModule('routing');
      setActiveView('planner');
    } else {
      setCurrentModule('predial');
      setActiveView('packages');
    }
  }, [user?.id, user?.role, isMaster]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <span className="text-xs">Carregando plataforma segura LET’S LOG...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage />
        <LoginModal />
        <MasterSetupModal />
        <RegisterModal />
        <PlanModal />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        currentModule={currentModule}
        setCurrentModule={setCurrentModule}
        activeView={activeView}
        setActiveView={setActiveView}
      />
      <DemoBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sub Navigation Bar for Selected Module */}
        {currentModule !== 'master' && currentModule !== 'driver' && (
          <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3 overflow-x-auto">
            {/* LET'S LOG Routing & Fleet Subtabs */}
            {currentModule === 'routing' && (
              <>
                <button
                  onClick={() => setActiveView('planner')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeView === 'planner'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  <span>Roteirizador & Otimização</span>
                </button>

                <button
                  onClick={() => setActiveView('deliveries')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeView === 'deliveries'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Entregas & Importação Planilhas</span>
                </button>

                <button
                  onClick={() => setActiveView('fleet')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeView === 'fleet'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>Frota & Rastreamento GPS</span>
                </button>
              </>
            )}

            {/* Logistics Module Subtabs */}
            {currentModule === 'logistica' && (
              <>
                <button
                  onClick={() => setActiveView('receipts')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeView === 'receipts'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Recebimento & QR Code</span>
                </button>

                <button
                  onClick={() => setActiveView('inventory')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeView === 'inventory'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Boxes className="w-4 h-4" />
                  <span>Estoque & Posições</span>
                </button>

                <button
                  onClick={() => setActiveView('shipments')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeView === 'shipments'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Expedição & Despacho</span>
                </button>
              </>
            )}

            {/* Condo Module Subtabs */}
            {currentModule === 'predial' && (
              <>
                <button
                  onClick={() => setActiveView('packages')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeView === 'packages'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Encomendas & PIN</span>
                </button>

                <button
                  onClick={() => setActiveView('visitors')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeView === 'visitors'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Portaria & Visitantes</span>
                </button>

                <button
                  onClick={() => setActiveView('units')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeView === 'units'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Unidades & Moradores</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Expired Subscription Block Screen for non-Master users */}
        {isSubscriptionExpired && !isMaster ? (
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-8 text-center max-w-xl mx-auto my-12">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Acesso Temporariamente Suspenso</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              O período de demonstração ou plano de sua empresa expirou. Todos os seus dados, recebimentos, estoques,
              entregas e rotas estão completamente salvos. Escolha um plano para restaurar o acesso operacional.
            </p>
            <button
              onClick={() => setIsPlanModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-sky-600/30"
            >
              Ver Opções de Assinatura e Planos
            </button>
          </div>
        ) : (
          <>
            {/* LET'S LOG Views */}
            {currentModule === 'routing' && activeView === 'planner' && <DispatcherPlannerView />}
            {currentModule === 'routing' && activeView === 'deliveries' && <DeliveriesView />}
            {currentModule === 'routing' && activeView === 'fleet' && <FleetView />}
            {currentModule === 'driver' && <DriverPanelView />}

            {/* Master Owner */}
            {currentModule === 'master' && <MasterDashboard />}

            {/* Logistics Views */}
            {currentModule === 'logistica' && activeView === 'receipts' && <ReceiptsView />}
            {currentModule === 'logistica' && activeView === 'inventory' && <InventoryView />}
            {currentModule === 'logistica' && activeView === 'shipments' && <ShipmentsView />}

            {/* Condo Views */}
            {currentModule === 'predial' && activeView === 'packages' && <PackagesView />}
            {currentModule === 'predial' && activeView === 'visitors' && <VisitorsView />}
            {currentModule === 'predial' && activeView === 'units' && <UnitsView />}
          </>
        )}
      </main>

      {/* Global Modals */}
      <LoginModal />
      <MasterSetupModal />
      <RegisterModal />
      <PlanModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
