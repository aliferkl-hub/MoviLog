import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Company, SystemConfig } from '../types';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  systemConfig: Partial<SystemConfig> | null;
  isLoading: boolean;
  isMaster: boolean;
  isDemo: boolean;
  demoDaysLeft: number;
  isSubscriptionActive: boolean;
  isSubscriptionExpired: boolean;
  isMasterInitialized: boolean;
  masterEmail: string;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  initMaster: (pass: string, name: string, phone?: string) => Promise<void>;
  registerCompany: (payload: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  // UI state for modals
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isMasterSetupOpen: boolean;
  setIsMasterSetupOpen: (open: boolean) => void;
  isRegisterModalOpen: boolean;
  setIsRegisterModalOpen: (open: boolean) => void;
  isPlanModalOpen: boolean;
  setIsPlanModalOpen: (open: boolean) => void;
  selectedPlanForCheckout: string | null;
  setSelectedPlanForCheckout: (planId: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [systemConfig, setSystemConfig] = useState<Partial<SystemConfig> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMasterInitialized, setIsMasterInitialized] = useState<boolean>(false);
  const [masterEmail, setMasterEmail] = useState<string>('Alifermadeiro@hotmail.com');

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isMasterSetupOpen, setIsMasterSetupOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<string | null>(null);

  const checkAuthStatus = useCallback(async () => {
    try {
      const status = await api.getAuthStatus();
      setIsMasterInitialized(status.masterInitialized);
      if (status.masterEmail) setMasterEmail(status.masterEmail);
    } catch (e) {
      console.error('Failed to get auth status:', e);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setCompany(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await api.getMe();
      setUser(me.user);
      setCompany(me.company);
      if (me.systemConfig) {
        setSystemConfig(me.systemConfig);
      }
    } catch (err: any) {
      console.warn('Session invalid or expired:', err.message);
      removeStoredToken();
      setUser(null);
      setCompany(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
    refreshUser();
  }, [checkAuthStatus, refreshUser]);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setStoredToken(res.token);
    setUser(res.user);
    setCompany(res.company);
    setIsLoginModalOpen(false);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    } finally {
      removeStoredToken();
      setUser(null);
      setCompany(null);
    }
  };

  const initMaster = async (pass: string, name: string, phone?: string) => {
    const res = await api.initMaster({
      email: masterEmail,
      password: pass,
      name,
      phone
    });
    setStoredToken(res.token);
    setUser(res.user);
    setCompany(null);
    setIsMasterInitialized(true);
    setIsMasterSetupOpen(false);
  };

  const registerCompany = async (payload: any) => {
    const res = await api.registerCompany(payload);
    setStoredToken(res.token);
    setUser(res.user);
    setCompany(res.company);
    setIsRegisterModalOpen(false);
  };

  const isMaster = user?.role === 'master_owner' && user?.email.toLowerCase() === masterEmail.toLowerCase();
  const isDemo = company?.statusAssinatura === 'demo_ativa';

  let demoDaysLeft = 0;
  if (isDemo && company?.demoEndDate) {
    const diff = new Date(company.demoEndDate).getTime() - Date.now();
    demoDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const isSubscriptionActive = isMaster || (company?.statusAssinatura === 'assinatura_ativa' || company?.statusAssinatura === 'demo_ativa');
  const isSubscriptionExpired = company?.statusAssinatura === 'demo_expirada' || company?.statusAssinatura === 'assinatura_vencida';

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        systemConfig,
        isLoading,
        isMaster,
        isDemo,
        demoDaysLeft,
        isSubscriptionActive,
        isSubscriptionExpired,
        isMasterInitialized,
        masterEmail,
        login,
        logout,
        initMaster,
        registerCompany,
        refreshUser,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isMasterSetupOpen,
        setIsMasterSetupOpen,
        isRegisterModalOpen,
        setIsRegisterModalOpen,
        isPlanModalOpen,
        setIsPlanModalOpen,
        selectedPlanForCheckout,
        setSelectedPlanForCheckout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
