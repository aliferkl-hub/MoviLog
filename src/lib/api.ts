import {
  User,
  Company,
  CommercialPlan,
  PaymentRequest,
  AuditLog,
  LogisticsReceipt,
  InventoryItem,
  StockMovement,
  ShipmentOrder,
  DeliveryItem,
  Vehicle,
  DeliveryRoute,
  RouteStop,
  CondoUnit,
  CondoPackage,
  CondoVisitor,
  MasterStats,
  DashboardMetrics,
  FiscalConfig,
  FiscalDocument,
  FinancialRecord,
  NotificationItem,
  CommercialProduct,
  CommercialStockMovement,
  CommercialSale,
  CommercialCashSession,
  CommercialSupplier,
  CommercialPurchase,
  CommercialDashboardMetrics
} from '../types';

const TOKEN_KEY = 'logipredial_auth_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Erro ${response.status}: ${response.statusText}`;
    const err = new Error(errorMsg) as Error & { status?: number; data?: any };
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  getAuthStatus: () => request<{ masterInitialized: boolean; masterEmail: string; plataforma: string }>('/api/auth/status'),
  initMaster: (payload: { email: string; password: string; name: string; phone?: string }) =>
    request<{ token: string; user: User; message: string }>('/api/auth/init-master', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: User; company: Company | null }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () =>
    request<{
      user: User;
      company: Company | null;
      systemConfig: { whatsappComercial: string; nomePlataforma: string; diasDemonstracao: number };
    }>('/api/auth/me'),
  logout: () =>
    request<{ message: string }>('/api/auth/logout', { method: 'POST' }),
  registerCompany: (payload: any) =>
    request<{ token: string; user: User; company: Company; message: string }>('/api/auth/register-company', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Public / Plans / WhatsApp
  getPlans: () =>
    request<{ plans: CommercialPlan[]; whatsappComercial: string; mensagemPadrao: string }>('/api/plans'),
  requestSubscription: (payload: { planoId: string; metodoPagamento?: string; comprovanteReferencia?: string; periodoMeses?: number }) =>
    request<{ message: string; payment: PaymentRequest }>('/api/subscription/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getQRCode: (text: string) =>
    request<{ dataUrl: string; text: string }>(`/api/qrcode?text=${encodeURIComponent(text)}`),

  // Master Owner
  getMasterStats: () => request<MasterStats>('/api/master/stats'),
  getMasterCompanies: () => request<{ companies: Company[] }>('/api/master/companies'),
  updateMasterCompany: (id: string, payload: any) =>
    request<{ company: Company; message: string }>(`/api/master/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  getMasterPlans: () => request<{ plans: CommercialPlan[] }>('/api/master/plans'),
  updateMasterPlan: (id: string, payload: Partial<CommercialPlan>) =>
    request<{ plan: CommercialPlan; message: string }>(`/api/master/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  createMasterPlan: (payload: Partial<CommercialPlan>) =>
    request<{ plan: CommercialPlan; message: string }>('/api/master/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMasterConfig: () => request<{ config: any }>('/api/master/config'),
  updateMasterConfig: (payload: any) =>
    request<{ config: any; message: string }>('/api/master/config', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getMasterPayments: () => request<{ payments: PaymentRequest[] }>('/api/master/payments'),
  verifyPayment: (id: string, payload: { action: 'aprovar' | 'rejeitar'; observacoes?: string }) =>
    request<{ message: string; payment: PaymentRequest; company?: Company }>(`/api/master/payments/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMasterAuditLogs: () => request<{ logs: AuditLog[] }>('/api/master/audit-logs'),
  seedSampleData: () => request<{ message: string; sampleCompany?: Company }>('/api/seed-sample-data', { method: 'POST' }),

  // Logistics
  getReceipts: (companyId?: string) =>
    request<{ receipts: LogisticsReceipt[] }>(companyId ? `/api/logistics/receipts?companyId=${companyId}` : '/api/logistics/receipts'),
  createReceipt: (payload: any) =>
    request<{ receipt: LogisticsReceipt }>('/api/logistics/receipts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getInventory: (companyId?: string) =>
    request<{ items: InventoryItem[] }>(companyId ? `/api/logistics/inventory?companyId=${companyId}` : '/api/logistics/inventory'),
  saveInventoryItem: (payload: any) =>
    request<{ item: InventoryItem }>('/api/logistics/inventory', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  recordStockMovement: (payload: any) =>
    request<{ movement: StockMovement; item: InventoryItem }>('/api/logistics/movement', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getShipments: (companyId?: string) =>
    request<{ shipments: ShipmentOrder[] }>(companyId ? `/api/logistics/shipments?companyId=${companyId}` : '/api/logistics/shipments'),
  createShipment: (payload: any) =>
    request<{ shipment: ShipmentOrder }>('/api/logistics/shipments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateShipmentStatus: (id: string, payload: { status: string; ocorrenciaTexto?: string }) =>
    request<{ shipment: ShipmentOrder }>(`/api/logistics/shipments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Condo & Concierge
  getCondoUnits: (companyId?: string) =>
    request<{ units: CondoUnit[] }>(companyId ? `/api/condo/units?companyId=${companyId}` : '/api/condo/units'),
  saveCondoUnit: (payload: any) =>
    request<{ unit: CondoUnit }>('/api/condo/units', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCondoPackages: (companyId?: string) =>
    request<{ packages: CondoPackage[] }>(companyId ? `/api/condo/packages?companyId=${companyId}` : '/api/condo/packages'),
  receivePackage: (payload: any) =>
    request<{ pkg: CondoPackage }>('/api/condo/packages', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  notifyPackageRecipient: (id: string) =>
    request<{ message: string; pkg: CondoPackage; whatsappUrl: string }>(`/api/condo/packages/${id}/notify`, {
      method: 'POST',
    }),
  pickupPackage: (id: string, payload: { pin: string; retiradoPor: string; documentoRetirada?: string }) =>
    request<{ message: string; pkg: CondoPackage }>(`/api/condo/packages/${id}/pickup`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCondoPackage: (id: string, payload: any) =>
    request<{ message?: string; pkg: CondoPackage }>(`/api/condo/packages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  getDashboardMetrics: (period: 'day' | 'week' | 'month' = 'week', companyId?: string) => {
    const params = new URLSearchParams();
    if (period) params.set('period', period);
    if (companyId) params.set('companyId', companyId);
    return request<DashboardMetrics>(`/api/dashboard/metrics?${params.toString()}`);
  },
  getCondoVisitors: (companyId?: string) =>
    request<{ visitors: CondoVisitor[] }>(companyId ? `/api/condo/visitors?companyId=${companyId}` : '/api/condo/visitors'),
  checkInVisitor: (payload: any) =>
    request<{ visitor: CondoVisitor }>('/api/condo/visitors', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  checkOutVisitor: (id: string) =>
    request<{ message: string; visitor: CondoVisitor }>(`/api/condo/visitors/${id}/checkout`, {
      method: 'PATCH',
    }),

  // LET'S LOG — Deliveries & Spreadsheet Import
  getDeliveries: (filters: Record<string, string> = {}) => {
    const params = new URLSearchParams(filters);
    return request<{ deliveries: DeliveryItem[] }>(`/api/deliveries?${params.toString()}`);
  },
  createDelivery: (payload: any) =>
    request<{ message: string; delivery: DeliveryItem }>('/api/deliveries', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  importDeliveries: (rows: any[]) =>
    request<{
      message: string;
      totalReceived: number;
      acceptedCount: number;
      rejectedCount: number;
      accepted: DeliveryItem[];
      rejected: any[];
    }>('/api/deliveries/import', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    }),
  updateDelivery: (id: string, payload: any) =>
    request<{ message: string; delivery: DeliveryItem }>(`/api/deliveries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteDelivery: (id: string) =>
    request<{ message: string }>(`/api/deliveries/${id}`, {
      method: 'DELETE',
    }),

  // LET'S LOG — Fleet & GPS
  getFleetVehicles: (companyId?: string) =>
    request<{ vehicles: Vehicle[] }>(companyId ? `/api/fleet/vehicles?companyId=${companyId}` : '/api/fleet/vehicles'),
  createVehicle: (payload: any) =>
    request<{ message: string; vehicle: Vehicle }>('/api/fleet/vehicles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateVehicle: (id: string, payload: any) =>
    request<{ message: string; vehicle: Vehicle }>(`/api/fleet/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  sendVehicleLocation: (id: string, location: { lat: number; lng: number; velocidade?: number; precisao?: number; bateria?: number; timestampDispositivo?: string }) =>
    request<{ success: boolean; location: any }>(`/api/fleet/vehicles/${id}/location`, {
      method: 'POST',
      body: JSON.stringify(location),
    }),
  getVehicleLocation: (id: string) =>
    request<{ veiculoId: string; placa: string; identificacao: string; ultimaLocalizacao: any }>(`/api/fleet/vehicles/${id}/location`),

  // LET'S LOG — Route Planning & Execution
  planRouteSuggestion: (payload: { deliveryIds: string[]; veiculoId: string }) =>
    request<{
      vehicle: Vehicle;
      totalDeliveries: number;
      totalVolumes: number;
      totalWeightKg: number;
      capacityExceeded: boolean;
      warnings: string[];
      estimatedDistanceKm: number;
      estimatedDurationMin: number;
      suggestedStops: RouteStop[];
    }>('/api/routes/plan-suggest', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getRoutes: (companyId?: string) =>
    request<{ routes: DeliveryRoute[] }>(companyId ? `/api/routes?companyId=${companyId}` : '/api/routes'),
  getRouteById: (id: string) =>
    request<{ route: DeliveryRoute; vehicle?: Vehicle }>(`/api/routes/${id}`),
  createRoute: (payload: any) =>
    request<{ message: string; route: DeliveryRoute }>('/api/routes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateRoute: (id: string, payload: any) =>
    request<{ message: string; route: DeliveryRoute }>(`/api/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  reviewRoute: (id: string, motivo?: string) =>
    request<{ message: string; route: DeliveryRoute }>(`/api/routes/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    }),
  publishRoute: (id: string) =>
    request<{ message: string; route: DeliveryRoute }>(`/api/routes/${id}/publish`, {
      method: 'POST',
    }),
  startRoute: (id: string) =>
    request<{ message: string; route: DeliveryRoute }>(`/api/routes/${id}/start`, {
      method: 'POST',
    }),
  updateStopStatus: (routeId: string, stopIndex: number, payload: any) =>
    request<{ message: string; stop: RouteStop; route: DeliveryRoute }>(`/api/routes/${routeId}/stops/${stopIndex}/status`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getDriverActiveRoute: () =>
    request<{ activeRoute: DeliveryRoute | null; vehicle?: Vehicle }>('/api/driver/active-route'),

  // Company Profile & Settings
  getCompanyProfile: () =>
    request<{ company: Company }>('/api/company/profile'),
  updateCompanyProfile: (payload: Partial<Company>) =>
    request<{ message: string; company: Company }>('/api/company/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // LET'S LOG — Company Team (Drivers, Dispatchers)
  getCompanyUsers: (companyId?: string) =>
    request<{ users: any[] }>(companyId ? `/api/company/users?companyId=${companyId}` : '/api/company/users'),
  createCompanyUser: (payload: any) =>
    request<{ message: string; user: any }>('/api/company/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // MoviLog — Central Fiscal
  getFiscalConfig: (companyId?: string) =>
    request<{ config: FiscalConfig }>(companyId ? `/api/fiscal/config?companyId=${companyId}` : '/api/fiscal/config'),
  saveFiscalConfig: (payload: Partial<FiscalConfig>) =>
    request<{ message: string; config: FiscalConfig }>('/api/fiscal/config', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getFiscalDocuments: (filters: Record<string, string> = {}) => {
    const params = new URLSearchParams(filters);
    return request<{ documents: FiscalDocument[] }>(`/api/fiscal/documents?${params.toString()}`);
  },
  getFiscalDocumentById: (id: string) =>
    request<{ document: FiscalDocument }>(`/api/fiscal/documents/${id}`),
  emitFiscalDocument: (payload: any) =>
    request<{ message: string; document: FiscalDocument }>('/api/fiscal/emit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  cancelFiscalDocument: (id: string, motivo: string) =>
    request<{ message: string; document: FiscalDocument }>(`/api/fiscal/documents/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    }),
  sendFiscalCorrection: (id: string, correcao: string) =>
    request<{ message: string; document: FiscalDocument }>(`/api/fiscal/documents/${id}/correction`, {
      method: 'POST',
      body: JSON.stringify({ correcao }),
    }),

  // MoviLog — Financeiro & Custos
  getFinancialRecords: (filters: Record<string, string> = {}) => {
    const params = new URLSearchParams(filters);
    return request<{ records: FinancialRecord[] }>(`/api/financial/records?${params.toString()}`);
  },
  createFinancialRecord: (payload: any) =>
    request<{ message: string; record: FinancialRecord }>('/api/financial/records', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getFinancialSummary: (companyId?: string) =>
    request<{
      totalReceitas: number;
      totalDespesas: number;
      saldoOperacional: number;
      margemPercentual: number;
      totalLancamentos: number;
      despesasPorCategoria: Record<string, number>;
    }>(companyId ? `/api/financial/summary?companyId=${companyId}` : '/api/financial/summary'),

  // MoviLog — Notificações
  getNotifications: () =>
    request<{ notifications: NotificationItem[] }>('/api/notifications'),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () =>
    request<{ success: boolean; message: string }>('/api/notifications/read-all', { method: 'POST' }),

  // MoviLog — Rastreamento Público Seguro
  getPublicTracking: (code: string) =>
    request<any>(`/api/tracking/public/${encodeURIComponent(code)}`),

  // Adega & Tabacaria Commercial Suite
  getCommerceProducts: (modulo?: 'adega' | 'tabacaria') =>
    request<{ products: CommercialProduct[] }>(modulo ? `/api/commerce/products?modulo=${modulo}` : '/api/commerce/products'),
  createCommerceProduct: (data: Partial<CommercialProduct>) =>
    request<{ success: boolean; product: CommercialProduct }>('/api/commerce/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCommerceProduct: (id: string, data: Partial<CommercialProduct>) =>
    request<{ success: boolean; product: CommercialProduct }>(`/api/commerce/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCommerceProduct: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/commerce/products/${id}`, {
      method: 'DELETE',
    }),
  seedSampleCommerceProducts: (modulo: 'adega' | 'tabacaria') =>
    request<{ success: boolean; count: number; message: string }>('/api/commerce/products/sample-seed', {
      method: 'POST',
      body: JSON.stringify({ modulo }),
    }),
  getCommerceStockMovements: (productId?: string) =>
    request<{ movements: CommercialStockMovement[] }>(productId ? `/api/commerce/stock-movements?productId=${productId}` : '/api/commerce/stock-movements'),
  adjustCommerceStock: (data: { productId: string; tipo: string; quantidade: number; motivo: string }) =>
    request<{ success: boolean; movement: CommercialStockMovement; product: CommercialProduct }>('/api/commerce/stock/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCurrentCashSession: (modulo?: 'adega' | 'tabacaria') =>
    request<{ session: CommercialCashSession | null }>(modulo ? `/api/commerce/cash/current?modulo=${modulo}` : '/api/commerce/cash/current'),
  openCashSession: (data: { saldoInicial: number; modulo?: 'adega' | 'tabacaria' }) =>
    request<{ success: boolean; session: CommercialCashSession }>('/api/commerce/cash/open', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  addCashMovement: (sessionId: string, data: { tipo: 'suprimento' | 'sangria'; valor: number; motivo: string }) =>
    request<{ success: boolean; session: CommercialCashSession }>(`/api/commerce/cash/${sessionId}/movement`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  closeCashSession: (sessionId: string, data: { saldoContadoDinheiro: number; observacoes?: string }) =>
    request<{ success: boolean; session: CommercialCashSession; diferenca: number }>(`/api/commerce/cash/${sessionId}/close`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCashHistory: () =>
    request<{ sessions: CommercialCashSession[] }>('/api/commerce/cash/history'),
  createCommerceSale: (data: {
    modulo: 'adega' | 'tabacaria' | 'misto';
    itens: { productId: string; quantidade: number; precoUnitario: number; desconto?: number }[];
    formaPagamento: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'misto';
    valorPago?: number;
    descontoGeral?: number;
    clienteNome?: string;
    clienteDocumento?: string;
    verificacaoMaioridade: boolean;
  }) =>
    request<{ success: boolean; sale: CommercialSale }>('/api/commerce/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCommerceSales: (modulo?: 'adega' | 'tabacaria') =>
    request<{ sales: CommercialSale[] }>(modulo ? `/api/commerce/sales?modulo=${modulo}` : '/api/commerce/sales'),
  cancelCommerceSale: (id: string, data: { motivo: string }) =>
    request<{ success: boolean; sale: CommercialSale }>(`/api/commerce/sales/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCommerceSuppliers: () =>
    request<{ suppliers: CommercialSupplier[] }>('/api/commerce/suppliers'),
  createCommerceSupplier: (data: Partial<CommercialSupplier>) =>
    request<{ success: boolean; supplier: CommercialSupplier }>('/api/commerce/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCommercePurchases: () =>
    request<{ purchases: CommercialPurchase[] }>('/api/commerce/purchases'),
  createCommercePurchase: (data: {
    fornecedorId: string;
    fornecedorNome: string;
    numeroNota?: string;
    formaPagamento?: string;
    observacoes?: string;
    itens: { productId: string; quantidade: number; custoUnitario: number }[];
  }) =>
    request<{ success: boolean; purchase: CommercialPurchase }>('/api/commerce/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCommerceDashboard: (modulo?: 'adega' | 'tabacaria') =>
    request<CommercialDashboardMetrics>(modulo ? `/api/commerce/dashboard?modulo=${modulo}` : '/api/commerce/dashboard'),
};

// WhatsApp Sales helper generator
export const buildWhatsAppSalesUrl = (
  whatsappNumber: string,
  planName: string,
  companyName: string = '',
  cnpj: string = '',
  priceStr: string = '',
  periodStr: string = 'Mensal',
  solicitacaoId?: string
): string => {
  const cleanPhone = (whatsappNumber || '5511999999999').replace(/\D/g, '');
  const solicitacaoLine = solicitacaoId ? `\nIdentificador da Solicitação: ${solicitacaoId}` : '';
  const message = `Olá! Tenho interesse em contratar a plataforma MoviLog (${planName}).

Empresa: ${companyName || 'Nova Empresa'}
CNPJ: ${cnpj || 'A informar'}
Plano: ${planName}
Valor informado: ${priceStr || 'A combinar'}
Período: ${periodStr}${solicitacaoLine}

Gostaria de receber instruções para ativação imediata.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
