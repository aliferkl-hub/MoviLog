import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Boxes,
  Truck,
  Building,
  ShieldCheck,
  LogOut,
  Sparkles,
  Navigation,
  Compass,
  Radio,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  currentModule: 'routing' | 'driver' | 'logistica' | 'predial' | 'master';
  setCurrentModule: (mod: 'routing' | 'driver' | 'logistica' | 'predial' | 'master') => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentModule,
  setCurrentModule,
  activeView,
  setActiveView
}) => {
  const { user, company, isMaster, isDemo, demoDaysLeft, logout, setIsPlanModalOpen, isSubscriptionExpired } = useAuth();
  const isDriver = user?.role === 'driver';

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Company */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                LET’S LOG
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                LogiPredial Suite
              </span>
              {isMaster && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Master Owner</span>
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>{company?.nomeFantasia || 'Plataforma Global'}</span>
              {isDemo && (
                <span className="text-amber-400 font-medium">
                  • Demo ({demoDaysLeft}d restantes)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Module Switcher (Desktop) */}
        <div className="hidden md:flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          {isDriver ? (
            <button
              onClick={() => {
                setCurrentModule('driver');
                setActiveView('driver_panel');
              }}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-sky-600 text-white shadow-md flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Painel do Entregador</span>
            </button>
          ) : (
            <>
              {/* LET'S LOG Routing & Fleet */}
              <button
                onClick={() => {
                  setCurrentModule('routing');
                  setActiveView('planner');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  currentModule === 'routing'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Roteirização & Frota</span>
              </button>

              {/* Driver View switch for testing/admins */}
              <button
                onClick={() => {
                  setCurrentModule('driver');
                  setActiveView('driver_panel');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  currentModule === 'driver'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Modo Entregador</span>
              </button>

              {/* Logistics & Receipts */}
              <button
                onClick={() => {
                  setCurrentModule('logistica');
                  setActiveView('receipts');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  currentModule === 'logistica'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Logística & Estoque</span>
              </button>

              {/* Condo & Gatekeeper */}
              <button
                onClick={() => {
                  setCurrentModule('predial');
                  setActiveView('packages');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  currentModule === 'predial'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Gestão Predial</span>
              </button>

              {/* Master Owner */}
              {isMaster && (
                <button
                  onClick={() => {
                    setCurrentModule('master');
                    setActiveView('master_dashboard');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    currentModule === 'master'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Painel Master Owner</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Right: Plan Status, User & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isMaster && (
            <button
              onClick={() => setIsPlanModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isSubscriptionExpired
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : isDemo
                  ? 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40'
                  : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">
                {isSubscriptionExpired ? 'Assinatura Vencida (Renovar)' : isDemo ? 'Assinar Plano Comercial' : 'Meu Plano'}
              </span>
              <span className="sm:hidden">Planos</span>
            </button>
          )}

          <div className="hidden sm:block text-right">
            <div className="text-xs font-bold text-white">{user?.name}</div>
            <div className="text-[10px] text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</div>
          </div>

          <button
            onClick={() => logout()}
            title="Sair da Plataforma"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/50 border border-slate-700/80 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Module Bar */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-800 p-2 bg-slate-950 text-xs overflow-x-auto">
        <button
          onClick={() => {
            setCurrentModule('routing');
            setActiveView('planner');
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg whitespace-nowrap ${currentModule === 'routing' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'}`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Roteirização</span>
        </button>

        <button
          onClick={() => {
            setCurrentModule('driver');
            setActiveView('driver_panel');
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg whitespace-nowrap ${currentModule === 'driver' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'}`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Entregador</span>
        </button>

        <button
          onClick={() => {
            setCurrentModule('logistica');
            setActiveView('receipts');
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg whitespace-nowrap ${currentModule === 'logistica' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Logística</span>
        </button>

        <button
          onClick={() => {
            setCurrentModule('predial');
            setActiveView('packages');
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg whitespace-nowrap ${currentModule === 'predial' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Predial</span>
        </button>

        {isMaster && (
          <button
            onClick={() => {
              setCurrentModule('master');
              setActiveView('master_dashboard');
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg whitespace-nowrap ${currentModule === 'master' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-amber-400'}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Master</span>
          </button>
        )}
      </div>
    </header>
  );
};
