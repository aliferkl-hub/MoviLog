import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/landing/LandingPage';
import { LoginModal } from './components/auth/LoginModal';
import { MasterSetupModal } from './components/auth/MasterSetupModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { PlanModal } from './components/subscription/PlanModal';

// Layout & Dashboard
import { TheXLogLayout } from './components/layout/TheXLogLayout';
import { TheXLogDashboard } from './components/dashboard/TheXLogDashboard';

// Routing & Fleet
import { DeliveriesView } from './components/routing/DeliveriesView';
import { DispatcherPlannerView } from './components/routing/DispatcherPlannerView';
import { OperationalMapView } from './components/routing/OperationalMapView';
import { FleetView } from './components/routing/FleetView';
import { DriverPanelView } from './components/routing/DriverPanelView';
import { ClientsView } from './components/routing/ClientsView';
import { ProofOfDeliveryView } from './components/routing/ProofOfDeliveryView';
import { ExceptionsView } from './components/routing/ExceptionsView';
import { ReportsView } from './components/routing/ReportsView';

// Warehouse / Logistics
import { ReceiptsView } from './components/logistics/ReceiptsView';
import { InventoryView } from './components/logistics/InventoryView';
import { ShipmentsView } from './components/logistics/ShipmentsView';

// Predial / Condo
import { PackagesView } from './components/condo/PackagesView';
import { VisitorsView } from './components/condo/VisitorsView';
import { UnitsView } from './components/condo/UnitsView';

// Fiscal & Financial
import { FiscalView } from './components/fiscal/FiscalView';
import { FinancialView } from './components/financial/FinancialView';

import { MasterDashboard } from './components/master/MasterDashboard';
import { SettingsView } from './components/common/SettingsView';
import { UsersView } from './components/common/UsersView';
import { CommerceModuleView } from './components/commerce/CommerceModuleView';

import { Loader2, ShieldCheck } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user, isMaster, isLoading, isSubscriptionExpired, setIsPlanModalOpen } = useAuth();

  // Active module & view
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  const [activeView, setActiveView] = useState<string>('overview');

  // Automatic initial routing based on user role
  useEffect(() => {
    if (!user) return;
    if (user.role === 'driver') {
      setCurrentModule('driver');
      setActiveView('driver_panel');
    } else if (user.role === 'concierge') {
      setCurrentModule('predial');
      setActiveView('packages');
    } else {
      setCurrentModule('dashboard');
      setActiveView('overview');
    }
  }, [user?.id, user?.role]);

  const handleNavigate = (module: string, view?: string) => {
    let targetModule = module;
    let targetView = view;

    // Normalize module and view aliases to avoid blank screens
    if (['deliveries', 'import', 'planner', 'routes', 'map', 'fleet', 'drivers', 'clients', 'pod', 'occurrences', 'reports'].includes(module)) {
      targetModule = 'routing';
      if (!view) {
        if (module === 'routes') targetView = 'planner';
        else targetView = module;
      }
    } else if (['receipts', 'inventory', 'shipments'].includes(module)) {
      targetModule = 'logistica';
      if (!view) targetView = module;
    } else if (['packages', 'visitors', 'units'].includes(module)) {
      targetModule = 'predial';
      if (!view) targetView = module;
    } else if (module === 'fiscal' || module === 'documents') {
      targetModule = 'fiscal';
      if (!view) targetView = 'documents';
    } else if (module === 'financial' || module === 'records') {
      targetModule = 'financial';
      if (!view) targetView = 'records';
    } else if (module === 'driver') {
      targetModule = 'driver';
      if (!view) targetView = 'driver_panel';
    } else if (module === 'users') {
      targetModule = 'master';
      targetView = 'users';
    } else if (module === 'settings') {
      targetModule = 'master';
      targetView = 'settings';
    } else if (module === 'terminals' || module === 'maquininhas') {
      targetModule = 'adega';
      targetView = 'terminals';
    }

    setCurrentModule(targetModule);
    if (targetView) {
      setActiveView(targetView);
    } else {
      // Defaults
      if (targetModule === 'dashboard') setActiveView('overview');
      else if (targetModule === 'routing') setActiveView('deliveries');
      else if (targetModule === 'logistica') setActiveView('receipts');
      else if (targetModule === 'predial') setActiveView('packages');
      else if (targetModule === 'driver') setActiveView('driver_panel');
      else if (targetModule === 'fiscal') setActiveView('documents');
      else if (targetModule === 'financial') setActiveView('records');
      else if (targetModule === 'adega' || targetModule === 'tabacaria') setActiveView('pos');
      else if (targetModule === 'master') setActiveView(isMaster ? 'master_dashboard' : 'settings');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070811] flex flex-col items-center justify-center text-[#AAA6B5] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]" />
        <span className="text-xs font-medium">Carregando plataforma MoviLog...</span>
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
    <>
      <TheXLogLayout
        currentModule={currentModule}
        activeView={activeView}
        onNavigate={handleNavigate}
      >
        {isSubscriptionExpired && !isMaster ? (
          <div className="bg-[#121024] border border-rose-500/30 rounded-3xl p-8 text-center max-w-xl mx-auto my-12 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/40">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Acesso Temporariamente Suspenso</h3>
            <p className="text-xs text-[#AAA6B5] mb-6 leading-relaxed">
              O período de demonstração ou plano de sua empresa expirou. Todos os seus dados, documentos fiscais,
              entregas e rotas estão completamente salvos. Escolha um plano para restaurar o acesso operacional.
            </p>
            <button
              onClick={() => setIsPlanModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-bold rounded-xl text-xs transition shadow-lg shadow-[#8B5CF6]/30"
            >
              Ver Opções de Assinatura e Planos
            </button>
          </div>
        ) : (
          <>
            {/* Dashboard MoviLog */}
            {currentModule === 'dashboard' && (
              <TheXLogDashboard onNavigate={handleNavigate} />
            )}

            {/* Routing & Deliveries Module */}
            {currentModule === 'routing' && activeView === 'deliveries' && (
              <DeliveriesView initialShowImport={false} initialShowManual={false} />
            )}
            {currentModule === 'routing' && activeView === 'create_manual' && (
              <DeliveriesView initialShowImport={false} initialShowManual={true} />
            )}
            {currentModule === 'routing' && activeView === 'import' && (
              <DeliveriesView initialShowImport={true} initialShowManual={false} />
            )}
            {currentModule === 'routing' && activeView === 'planner' && (
              <DispatcherPlannerView />
            )}
            {currentModule === 'routing' && activeView === 'map' && (
              <OperationalMapView />
            )}
            {currentModule === 'routing' && (activeView === 'fleet' || activeView === 'drivers') && (
              <FleetView />
            )}
            {currentModule === 'routing' && activeView === 'clients' && (
              <ClientsView />
            )}
            {currentModule === 'routing' && activeView === 'pod' && (
              <ProofOfDeliveryView />
            )}
            {currentModule === 'routing' && activeView === 'occurrences' && (
              <ExceptionsView />
            )}
            {currentModule === 'routing' && activeView === 'reports' && (
              <ReportsView />
            )}

            {/* Driver App Mobile View */}
            {currentModule === 'driver' && (
              <DriverPanelView />
            )}

            {/* Logistics / Warehouse Module */}
            {currentModule === 'logistica' && activeView === 'receipts' && (
              <ReceiptsView />
            )}
            {currentModule === 'logistica' && activeView === 'inventory' && (
              <InventoryView />
            )}
            {currentModule === 'logistica' && activeView === 'shipments' && (
              <ShipmentsView />
            )}

            {/* Predial / Condo Module */}
            {currentModule === 'predial' && activeView === 'packages' && (
              <PackagesView />
            )}
            {currentModule === 'predial' && activeView === 'visitors' && (
              <VisitorsView />
            )}
            {currentModule === 'predial' && activeView === 'units' && (
              <UnitsView />
            )}

            {/* Fiscal Module */}
            {currentModule === 'fiscal' && (
              <FiscalView />
            )}

            {/* Financial Module */}
            {currentModule === 'financial' && (
              <FinancialView />
            )}

            {/* Commercial Modules: Adega & Tabacaria */}
            {(currentModule === 'adega' || currentModule === 'tabacaria') && (
              <CommerceModuleView
                modulo={currentModule}
                activeView={activeView}
                onNavigate={handleNavigate}
              />
            )}

            {/* Master & Company Admin */}
            {currentModule === 'master' && activeView === 'users' && (
              <UsersView />
            )}
            {currentModule === 'master' && activeView === 'settings' && (
              <SettingsView />
            )}
            {currentModule === 'master' && (activeView === 'master_dashboard' || (!['users', 'settings'].includes(activeView))) && (
              isMaster ? <MasterDashboard /> : <SettingsView />
            )}
          </>
        )}
      </TheXLogLayout>

      {/* Global Modals */}
      <LoginModal />
      <MasterSetupModal />
      <RegisterModal />
      <PlanModal />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
