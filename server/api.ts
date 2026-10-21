import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import {
  db,
  User,
  Company,
  CommercialPlan,
  PaymentRequest,
  LogisticsReceipt,
  InventoryItem,
  StockMovement,
  ShipmentOrder,
  DeliveryItem,
  Vehicle,
  RouteStop,
  DeliveryRoute,
  CondoUnit,
  CondoPackage,
  CondoVisitor,
  FiscalConfig,
  FiscalDocument,
  FinancialRecord,
  NotificationItem,
  generateChaveAcessoNFe,
  hashPassword,
  verifyPassword,
  createSession,
  getSessionUser,
  destroySession
} from './db.js';
import { geocodeAddress, calculateDistanceKm } from './geocoding.js';

export const apiRouter = Router();

// Extend Request with authenticated user
interface AuthRequest extends Request {
  user?: User;
  company?: Company;
}

// Authentication Middleware
const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Autenticação necessária' });
    return;
  }
  const token = authHeader.substring(7);
  const user = getSessionUser(token);
  if (!user) {
    res.status(401).json({ error: 'Sessão inválida ou expirada' });
    return;
  }
  req.user = user;

  if (user.companyId) {
    const company = db.companies.find(c => c.id === user.companyId);
    if (company) {
      req.company = company;
    }
  } else if (user.role === 'master_owner') {
    req.company = ensureDefaultCompany(req);
  }
  next();
};

// Helper to ensure at least one active operational company exists
export const ensureDefaultCompany = (req?: AuthRequest): Company => {
  if (db.companies.length > 0) {
    return db.companies[0];
  }
  const defaultMasterCompany: Company = {
    id: crypto.randomUUID(),
    razaoSocial: 'LogiPredial - Gestão Operacional e Logística Ltda',
    nomeFantasia: 'LogiPredial Sede Matriz',
    cnpj: '00.000.000/0001-91',
    responsavel: req?.user?.name || 'Alifer Madeiro',
    email: req?.user?.email || db.systemConfig.masterEmail,
    telefone: req?.user?.phone || '11973479473',
    endereco: 'Av. Paulista, 1000 - São Paulo/SP',
    segmento: 'Logística, Expedição e Gestão Predial Integrada',
    quantidadeFuncionarios: 15,
    tipoOperacao: 'integrada',
    modulos: ['logistica', 'predial'],
    planoId: 'plan_empresarial',
    statusCadastro: 'ativo',
    statusAssinatura: 'assinatura_ativa',
    limites: {
      maxUsuarios: 9999,
      maxUnidades: 9999,
      maxOperacoesMes: 99999
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.companies.push(defaultMasterCompany);
  db.save();
  return defaultMasterCompany;
};

// Helper to reliably resolve the target company ID for operational actions
export const getEffectiveCompanyId = (req: AuthRequest): string => {
  if (req.company?.id) return req.company.id;
  if (req.user?.companyId) return req.user.companyId;
  if (req.body?.companyId && typeof req.body.companyId === 'string' && req.body.companyId.trim()) {
    return req.body.companyId.trim();
  }
  if (req.query?.companyId && typeof req.query.companyId === 'string' && req.query.companyId.trim()) {
    return req.query.companyId.trim();
  }
  const headerCompany = req.headers['x-company-id'];
  if (headerCompany && typeof headerCompany === 'string' && headerCompany.trim()) {
    return headerCompany.trim();
  }

  const comp = ensureDefaultCompany(req);
  return comp.id;
};

// Master Owner Authorization Middleware
const requireMaster = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }
  const masterEmail = db.systemConfig.masterEmail.toLowerCase();
  const isMasterUser = req.user.role === 'master_owner' && (
    req.user.email.toLowerCase() === masterEmail ||
    req.user.email.toLowerCase() === 'alifergael76@gmail.com'
  );
  if (!isMasterUser) {
    res.status(403).json({ error: 'Acesso restrito ao Administrador Master Owner' });
    return;
  }
  next();
};

// Subscription Check Middleware (Master Owner is completely exempt)
const checkSubscription = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }
  // Master Owner always has full permanent access
  if (req.user.role === 'master_owner') {
    next();
    return;
  }

  const company = req.company;
  if (!company) {
    res.status(403).json({ error: 'Empresa não encontrada' });
    return;
  }

  if (company.statusCadastro === 'suspenso' || company.statusCadastro === 'encerrado') {
    res.status(403).json({ error: 'Acesso da empresa suspenso ou encerrado pelo administrador' });
    return;
  }

  // Check Demo status
  if (company.statusAssinatura === 'demo_ativa') {
    if (company.demoEndDate) {
      const now = new Date().getTime();
      const end = new Date(company.demoEndDate).getTime();
      if (now > end) {
        company.statusAssinatura = 'demo_expirada';
        company.updatedAt = new Date().toISOString();
        db.save();
        res.status(402).json({
          error: 'Período de demonstração expirado',
          statusAssinatura: 'demo_expirada'
        });
        return;
      }
    }
  } else if (company.statusAssinatura === 'assinatura_ativa') {
    if (company.subscriptionEndDate) {
      const now = new Date().getTime();
      const end = new Date(company.subscriptionEndDate).getTime();
      if (now > end) {
        company.statusAssinatura = 'assinatura_vencida';
        company.updatedAt = new Date().toISOString();
        db.save();
        res.status(402).json({
          error: 'Assinatura vencida. Favor renovar.',
          statusAssinatura: 'assinatura_vencida'
        });
        return;
      }
    }
  } else {
    res.status(402).json({
      error: 'Plano não ativo. Escolha um plano para continuar.',
      statusAssinatura: company.statusAssinatura
    });
    return;
  }

  next();
};

// ==========================================
// 1. AUTH & INITIALIZATION
// ==========================================

// Get system initialization status
apiRouter.get('/auth/status', (req: Request, res: Response) => {
  const masterEmail = db.systemConfig.masterEmail;
  const masterUser = db.users.find(u => u.role === 'master_owner' && u.email.toLowerCase() === masterEmail.toLowerCase());
  res.json({
    masterInitialized: !!masterUser && db.systemConfig.masterInitialized,
    masterEmail: masterEmail,
    plataforma: db.systemConfig.nomePlataforma
  });
});

// Initialize Master Owner account securely
apiRouter.post('/auth/init-master', (req: Request, res: Response) => {
  const { email, password, name, phone } = req.body;
  const expectedEmail = db.systemConfig.masterEmail.toLowerCase();

  if (!email || email.trim().toLowerCase() !== expectedEmail) {
    res.status(400).json({ error: `O e-mail de ativação deve ser exatamente ${db.systemConfig.masterEmail}` });
    return;
  }

  const existingMaster = db.users.find(u => u.role === 'master_owner' && u.email.toLowerCase() === expectedEmail);
  if (existingMaster && db.systemConfig.masterInitialized) {
    res.status(400).json({ error: 'O Master Owner já foi inicializado anteriormente. Faça login diretamente.' });
    return;
  }

  if (!password || password.length < 8) {
    res.status(400).json({ error: 'A senha do Master Owner deve possuir pelo menos 8 caracteres' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const masterUser: User = {
    id: existingMaster ? existingMaster.id : crypto.randomUUID(),
    email: db.systemConfig.masterEmail,
    name: name || 'Administrador Master Owner',
    passwordHash: hash,
    salt: salt,
    role: 'master_owner',
    companyId: null,
    phone: phone || '',
    active: true,
    createdAt: new Date().toISOString()
  };

  if (existingMaster) {
    const index = db.users.findIndex(u => u.id === existingMaster.id);
    db.users[index] = masterUser;
  } else {
    db.users.push(masterUser);
  }

  db.systemConfig.masterInitialized = true;
  db.save();

  db.logAudit({
    userId: masterUser.id,
    userEmail: masterUser.email,
    userName: masterUser.name,
    acao: 'INICIALIZACAO_MASTER',
    detalhes: 'Conta Master Owner inicializada e verificada com sucesso',
    ip: req.ip
  });

  const token = createSession(masterUser.id);
  res.json({
    message: 'Master Owner inicializado com sucesso',
    token,
    user: {
      id: masterUser.id,
      email: masterUser.email,
      name: masterUser.name,
      role: masterUser.role,
      companyId: null
    }
  });
});

// Standard Login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    return;
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || !user.active) {
    res.status(401).json({ error: 'Credenciais inválidas ou usuário inativo' });
    return;
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const company = user.companyId ? db.companies.find(c => c.id === user.companyId) : null;
  const token = createSession(user.id);

  db.logAudit({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    companyId: company?.id,
    companyName: company?.nomeFantasia,
    acao: 'LOGIN',
    detalhes: `Usuário efetuou login (${user.role})`,
    ip: req.ip
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId
    },
    company
  });
});

// Get Current User Profile
apiRouter.get('/auth/me', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  let company = req.company || null;

  // Refresh demo expiration check
  if (company && company.statusAssinatura === 'demo_ativa' && company.demoEndDate) {
    if (new Date().getTime() > new Date(company.demoEndDate).getTime()) {
      company.statusAssinatura = 'demo_expirada';
      company.updatedAt = new Date().toISOString();
      db.save();
    }
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      phone: user.phone
    },
    company,
    systemConfig: {
      whatsappComercial: db.systemConfig.whatsappComercial,
      nomePlataforma: db.systemConfig.nomePlataforma,
      diasDemonstracao: db.systemConfig.diasDemonstracao
    }
  });
});

// Logout
apiRouter.post('/auth/logout', authenticate, (req: AuthRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    destroySession(authHeader.substring(7));
  }
  res.json({ message: 'Sessão encerrada com sucesso' });
});

// Register New Company & Start Demo / Account
apiRouter.post('/auth/register-company', (req: Request, res: Response) => {
  const {
    razaoSocial,
    nomeFantasia,
    cnpj,
    responsavel,
    email,
    telefone,
    endereco,
    segmento,
    quantidadeFuncionarios,
    tipoOperacao,
    modulos,
    planoId,
    adminPassword
  } = req.body;

  if (!nomeFantasia || !email || !responsavel || !adminPassword) {
    res.status(400).json({ error: 'Nome fantasia, e-mail, responsável e senha são obrigatórios' });
    return;
  }

  const existingEmail = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existingEmail) {
    res.status(400).json({ error: 'Já existe um usuário cadastrado com este e-mail' });
    return;
  }

  const plan = db.plans.find(p => p.id === (planoId || 'plan_demo')) || db.plans[0];
  const companyId = crypto.randomUUID();
  const now = new Date();
  const demoDurationDays = db.systemConfig.diasDemonstracao || 7;
  const demoEndDate = new Date(now.getTime() + demoDurationDays * 24 * 60 * 60 * 1000).toISOString();

  const isDemo = plan.tipo === 'demo';

  const newCompany: Company = {
    id: companyId,
    razaoSocial: razaoSocial || nomeFantasia,
    nomeFantasia,
    cnpj: cnpj || '',
    responsavel,
    email: email.trim().toLowerCase(),
    telefone: telefone || '',
    endereco: endereco || '',
    segmento: segmento || 'Logística e Gestão Predial',
    quantidadeFuncionarios: Number(quantidadeFuncionarios) || 1,
    tipoOperacao: tipoOperacao || 'integrada',
    modulos: Array.isArray(modulos) && modulos.length > 0 ? modulos : ['logistica', 'predial'],
    planoId: plan.id,
    statusCadastro: 'ativo',
    statusAssinatura: isDemo ? 'demo_ativa' : 'aguardando_pagamento',
    demoStartDate: now.toISOString(),
    demoEndDate: demoEndDate,
    limites: plan.limites,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const { hash, salt } = hashPassword(adminPassword);
  const adminUser: User = {
    id: crypto.randomUUID(),
    email: email.trim().toLowerCase(),
    name: responsavel,
    passwordHash: hash,
    salt,
    role: 'company_admin',
    companyId: companyId,
    phone: telefone || '',
    active: true,
    createdAt: now.toISOString()
  };

  db.companies.push(newCompany);
  db.users.push(adminUser);
  db.save();

  db.logAudit({
    userId: adminUser.id,
    userEmail: adminUser.email,
    userName: adminUser.name,
    companyId: newCompany.id,
    companyName: newCompany.nomeFantasia,
    acao: 'CADASTRO_EMPRESA',
    detalhes: `Empresa cadastrada com plano ${plan.nome} (${isDemo ? 'Demonstração 7 dias' : 'Comercial'})`,
    ip: req.ip
  });

  const token = createSession(adminUser.id);
  res.status(201).json({
    message: 'Empresa cadastrada com sucesso',
    token,
    user: {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      companyId: adminUser.companyId
    },
    company: newCompany
  });
});

// ==========================================
// 2. PUBLIC & SUBSCRIPTION ENDPOINTS
// ==========================================

// Get available public plans
apiRouter.get('/plans', (req: Request, res: Response) => {
  const activePlans = db.plans.filter(p => p.ativo);
  res.json({
    plans: activePlans,
    whatsappComercial: db.systemConfig.whatsappComercial,
    mensagemPadrao: db.systemConfig.mensagemWhatsappPadrao
  });
});

// Request plan or submit payment proof (company)
apiRouter.post('/subscription/request', authenticate, (req: AuthRequest, res: Response) => {
  const company = req.company;
  if (!company) {
    res.status(400).json({ error: 'Nenhuma empresa associada' });
    return;
  }

  const { planoId, metodoPagamento, comprovanteReferencia, periodoMeses } = req.body;
  const plan = db.plans.find(p => p.id === planoId);
  if (!plan) {
    res.status(404).json({ error: 'Plano selecionado não encontrado' });
    return;
  }

  const months = Number(periodoMeses) || 1;
  const valorTotal = months === 12 ? (plan.precoAnual || plan.precoMensal * 12) : plan.precoMensal * months;

  const paymentReq: PaymentRequest = {
    id: crypto.randomUUID(),
    companyId: company.id,
    companyName: company.nomeFantasia,
    planoId: plan.id,
    planoNome: plan.nome,
    valor: valorTotal,
    periodoMeses: months,
    metodoPagamento: metodoPagamento || 'PIX / Transferência Bancária',
    comprovanteReferencia: comprovanteReferencia || `Solicitação via WhatsApp em ${new Date().toLocaleDateString('pt-BR')}`,
    status: 'pendente',
    solicitadoEm: new Date().toISOString()
  };

  db.payments.unshift(paymentReq);
  company.statusAssinatura = 'pagamento_em_analise';
  company.updatedAt = new Date().toISOString();
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId: company.id,
    companyName: company.nomeFantasia,
    acao: 'SOLICITACAO_PLANO',
    detalhes: `Solicitação do plano ${plan.nome} (R$ ${valorTotal}) enviada para conferência do Master Owner`,
    ip: req.ip
  });

  res.json({
    message: 'Solicitação registrada com sucesso. Aguardando verificação do pagamento pelo Master Owner.',
    payment: paymentReq
  });
});

// Generate QR Code as DataURL helper
apiRouter.get('/qrcode', async (req: Request, res: Response) => {
  const text = (req.query.text as string) || 'LogiPredial';
  try {
    const dataUrl = await QRCode.toDataURL(text, { width: 250, margin: 2 });
    res.json({ dataUrl, text });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar QR Code' });
  }
});

// ==========================================
// 3. MASTER OWNER EXCLUSIVE ENDPOINTS
// ==========================================

// Master Dashboard Stats & KPIs
apiRouter.get('/master/stats', authenticate, requireMaster, (req: AuthRequest, res: Response) => {
  const totalCompanies = db.companies.length;
  const demoActive = db.companies.filter(c => c.statusAssinatura === 'demo_ativa').length;
  const demoExpired = db.companies.filter(c => c.statusAssinatura === 'demo_expirada').length;
  const pendingPayments = db.payments.filter(p => p.status === 'pendente').length;
  const activeSubs = db.companies.filter(c => c.statusAssinatura === 'assinatura_ativa').length;
  
  // Real revenue calculated strictly from confirmed approved payments
  const approvedPayments = db.payments.filter(p => p.status === 'aprovado');
  const totalVerifiedRevenue = approvedPayments.reduce((acc, curr) => acc + (curr.valor || 0), 0);

  res.json({
    totalCompanies,
    demoActive,
    demoExpired,
    pendingPayments,
    activeSubs,
    totalVerifiedRevenue,
    totalUsers: db.users.length,
    totalReceipts: db.logisticsReceipts.length,
    totalPackages: db.condoPackages.length,
    totalVisitors: db.condoVisitors.length
  });
});

// Master: List all companies
apiRouter.get('/master/companies', authenticate, requireMaster, (req: AuthRequest, res: Response) => {
  res.json({ companies: db.companies });
});

// Master: Update company (extend demo, change status, alter plan)
apiRouter.patch('/master/companies/:id', authenticate, requireMaster, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const company = db.companies.find(c => c.id === id);
  if (!company) {
    res.status(404).json({ error: 'Empresa não encontrada' });
    return;
  }

  const {
    statusCadastro,
    statusAssinatura,
    planoId,
    limites,
    extendDemoDays,
    modulos
  } = req.body;

  if (statusCadastro) company.statusCadastro = statusCadastro;
  if (statusAssinatura) company.statusAssinatura = statusAssinatura;
  if (modulos) company.modulos = modulos;
  if (limites) company.limites = { ...company.limites, ...limites };

  if (planoId && planoId !== company.planoId) {
    const newPlan = db.plans.find(p => p.id === planoId);
    if (newPlan) {
      company.planoId = newPlan.id;
      company.limites = newPlan.limites;
    }
  }

  if (extendDemoDays) {
    const days = Number(extendDemoDays);
    const baseDate = company.demoEndDate ? new Date(company.demoEndDate) : new Date();
    const newEnd = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
    company.demoEndDate = newEnd.toISOString();
    company.statusAssinatura = 'demo_ativa';
  }

  company.updatedAt = new Date().toISOString();
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId: company.id,
    companyName: company.nomeFantasia,
    acao: 'ALTERACAO_EMPRESA_MASTER',
    detalhes: `Configurações da empresa ${company.nomeFantasia} alteradas pelo Master Owner`,
    ip: req.ip
  });

  res.json({ message: 'Empresa atualizada com sucesso', company });
});

// Master: List & Manage Plans
apiRouter.get('/master/plans', authenticate, requireMaster, (req: AuthRequest, res: Response) => {
  res.json({ plans: db.plans });
});

apiRouter.put('/master/plans/:id', authenticate, requireMaster, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const index = db.plans.findIndex(p => p.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Plano não encontrado' });
    return;
  }

  const updatedPlan: CommercialPlan = {
    ...db.plans[index],
    ...req.body
  };
  db.plans[index] = updatedPlan;
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    acao: 'EDICAO_PLANO',
    detalhes: `Plano ${updatedPlan.nome} atualizado pelo Master Owner (Preço: R$ ${updatedPlan.precoMensal}/mês)`,
    ip: req.ip
  });

  res.json({ message: 'Plano atualizado com sucesso', plan: updatedPlan });
});

apiRouter.post('/master/plans', authenticate, requireMaster, (req: AuthRequest, res: Response) => {
  const newPlan: CommercialPlan = {
    id: `plan_${Date.now()}`,
    nome: req.body.nome || 'Novo Plano',
    tipo: req.body.tipo || 'personalizado',
    descricao: req.body.descricao || '',
    precoMensal: Number(req.body.precoMensal) || 0,
    precoAnual: Number(req.body.precoAnual) || 0,
    duracaoDias: Number(req.body.duracaoDias) || 30,
    modulosPermitidos: req.body.modulosPermitidos || ['logistica', 'predial'],
    limites: req.body.limites || { maxUsuarios: 10, maxUnidades: 100, maxOperacoesMes: 500 },
    recursos: req.body.recursos || [],
    destaque: !!req.body.destaque,
    ativo: true
  };

  db.plans.push(newPlan);
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    acao: 'CRIACAO_PLANO',
    detalhes: `Novo plano criado: ${newPlan.nome}`,
    ip: req.ip
  });

  res.status(201).json({ message: 'Plano criado com sucesso', plan: newPlan });
});

// Master: System Config & WhatsApp
apiRouter.get('/master/config', authenticate, requireMaster, (req: AuthRequest, res: Response) => {
  res.json({ config: db.systemConfig });
});

apiRouter.put('/master/config', authenticate, requireMaster, (req: AuthRequest, res: Response) => {
  const { whatsappComercial, mensagemWhatsappPadrao, diasDemonstracao, nomePlataforma } = req.body;
  if (whatsappComercial) db.systemConfig.whatsappComercial = whatsappComercial.replace(/\D/g, '');
  if (mensagemWhatsappPadrao) db.systemConfig.mensagemWhatsappPadrao = mensagemWhatsappPadrao;
  if (diasDemonstracao) db.systemConfig.diasDemonstracao = Number(diasDemonstracao);
  if (nomePlataforma) db.systemConfig.nomePlataforma = nomePlataforma;

  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    acao: 'CONFIGURACOES_SISTEMA',
    detalhes: `Configurações da plataforma e WhatsApp atualizadas pelo Master Owner`,
    ip: req.ip
  });

  res.json({ message: 'Configurações salvas com sucesso', config: db.systemConfig });
});

// Master: Payments Verification Center
apiRouter.get('/master/payments', authenticate, requireMaster, (req: AuthRequest, res: Response) => {
  res.json({ payments: db.payments });
});

// Master: Verify payment manually and activate subscription
apiRouter.post('/master/payments/:id/verify', authenticate, requireMaster, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { action, observacoes } = req.body; // 'aprovar' or 'rejeitar'

  const payment = db.payments.find(p => p.id === id);
  if (!payment) {
    res.status(404).json({ error: 'Registro de pagamento não encontrado' });
    return;
  }

  const company = db.companies.find(c => c.id === payment.companyId);
  const now = new Date();

  if (action === 'aprovar') {
    payment.status = 'aprovado';
    payment.aprovadoEm = now.toISOString();
    payment.aprovadoPor = req.user!.email;
    payment.observacoes = observacoes || 'Pagamento confirmado e verificado pelo Master Owner';

    if (company) {
      const plan = db.plans.find(p => p.id === payment.planoId) || db.plans.find(p => p.id === 'plan_profissional')!;
      company.planoId = plan.id;
      company.limites = plan.limites;
      company.statusAssinatura = 'assinatura_ativa';
      company.subscriptionStartDate = now.toISOString();
      
      const durationDays = (payment.periodoMeses || 1) * 30;
      const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      company.subscriptionEndDate = endDate.toISOString();
      company.updatedAt = now.toISOString();
    }

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      companyId: company?.id,
      companyName: company?.nomeFantasia,
      acao: 'CONFIRMACAO_PAGAMENTO',
      detalhes: `Pagamento de R$ ${payment.valor} APROVADO pelo Master Owner. Plano ${payment.planoNome} ativado por ${payment.periodoMeses} mês(es).`,
      ip: req.ip
    });

  } else {
    payment.status = 'rejeitado';
    payment.observacoes = observacoes || 'Pagamento não confirmado ou não localizado na conta.';
    if (company && company.statusAssinatura === 'pagamento_em_analise') {
      company.statusAssinatura = 'aguardando_pagamento';
      company.updatedAt = now.toISOString();
    }

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      companyId: company?.id,
      companyName: company?.nomeFantasia,
      acao: 'REJEICAO_PAGAMENTO',
      detalhes: `Pagamento de R$ ${payment.valor} REJEITADO pelo Master Owner: ${payment.observacoes}`,
      ip: req.ip
    });
  }

  db.save();
  res.json({ message: `Pagamento ${payment.status} com sucesso`, payment, company });
});

// Master: Global Audit Logs
apiRouter.get('/master/audit-logs', authenticate, requireMaster, (req: AuthRequest, res: Response) => {
  res.json({ logs: db.auditLogs.slice(0, 500) });
});

// ==========================================
// 4. LOGISTICS & EXPEDITION MODULE
// ==========================================

// Inward Receipts List
apiRouter.get('/logistics/receipts', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = req.user!.role === 'master_owner' && req.query.companyId ? (req.query.companyId as string) : req.user!.companyId;
  const receipts = companyId 
    ? db.logisticsReceipts.filter(r => r.companyId === companyId)
    : db.logisticsReceipts;
  res.json({ receipts });
});

// Inward Receipt Creation
apiRouter.post('/logistics/receipts', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  if (!companyId) {
    res.status(400).json({ error: 'Empresa obrigatória' });
    return;
  }

  const {
    fornecedor,
    remetente,
    transportadora,
    destinatarioSetor,
    numeroNota,
    quantidadeVolumes,
    pesoKg,
    descricao,
    lote,
    avariasRegistradas,
    detalhesAvarias
  } = req.body;

  const count = db.logisticsReceipts.filter(r => r.companyId === companyId).length + 1;
  const numeroRecebimento = `REC-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`;
  const codigoRastreioQR = `LOG-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const receipt: LogisticsReceipt = {
    id: crypto.randomUUID(),
    companyId,
    numeroRecebimento,
    fornecedor: fornecedor || 'Não informado',
    remetente: remetente || fornecedor || 'Diversos',
    transportadora: transportadora || 'Transportadora Própria',
    destinatarioSetor: destinatarioSetor || 'Almoxarifado Geral',
    numeroNota: numeroNota || '',
    quantidadeVolumes: Number(quantidadeVolumes) || 1,
    pesoKg: Number(pesoKg) || 0,
    descricao: descricao || 'Volumes diversos',
    lote: lote || '',
    avariasRegistradas: !!avariasRegistradas,
    detalhesAvarias: detalhesAvarias || '',
    conferenteNome: req.user!.name,
    status: avariasRegistradas ? 'divergencia' : 'conferido',
    codigoRastreioQR,
    dataHora: new Date().toISOString()
  };

  db.logisticsReceipts.unshift(receipt);
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId,
    companyName: req.company?.nomeFantasia,
    acao: 'RECEBIMENTO_MERCADORIA',
    detalhes: `Recebimento ${receipt.numeroRecebimento} registrado com ${receipt.quantidadeVolumes} volume(s). Fornecedor: ${receipt.fornecedor}`,
    ip: req.ip
  });

  res.status(201).json({ receipt });
});

// Inventory List
apiRouter.get('/logistics/inventory', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = req.user!.role === 'master_owner' && req.query.companyId ? (req.query.companyId as string) : req.user!.companyId;
  const items = companyId ? db.inventory.filter(i => i.companyId === companyId) : db.inventory;
  res.json({ items });
});

// Inventory Item Add / Edit
apiRouter.post('/logistics/inventory', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  if (!companyId) {
    res.status(400).json({ error: 'Empresa obrigatória' });
    return;
  }

  const { id, sku, nome, categoria, quantidade, estoqueMinimo, unidadeMedida, setor, corredor, posicao, valorUnitario } = req.body;

  if (id) {
    const item = db.inventory.find(i => i.id === id && i.companyId === companyId);
    if (!item) {
      res.status(404).json({ error: 'Item não encontrado' });
      return;
    }
    item.nome = nome || item.nome;
    item.categoria = categoria || item.categoria;
    item.estoqueMinimo = Number(estoqueMinimo) ?? item.estoqueMinimo;
    item.unidadeMedida = unidadeMedida || item.unidadeMedida;
    item.setor = setor || item.setor;
    item.corredor = corredor || item.corredor;
    item.posicao = posicao || item.posicao;
    item.valorUnitario = Number(valorUnitario) ?? item.valorUnitario;
    item.ultimaMovimentacao = new Date().toISOString();
    db.save();
    res.json({ item });
    return;
  }

  const newItem: InventoryItem = {
    id: crypto.randomUUID(),
    companyId,
    sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
    nome: nome || 'Produto sem nome',
    categoria: categoria || 'Geral',
    quantidade: Number(quantidade) || 0,
    estoqueMinimo: Number(estoqueMinimo) || 5,
    unidadeMedida: unidadeMedida || 'UN',
    setor: setor || 'Galpão 1',
    corredor: corredor || 'C-01',
    posicao: posicao || 'P-01',
    valorUnitario: Number(valorUnitario) || 0,
    ultimaMovimentacao: new Date().toISOString()
  };

  db.inventory.unshift(newItem);
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId,
    companyName: req.company?.nomeFantasia,
    acao: 'CADASTRO_PRODUTO',
    detalhes: `Produto ${newItem.nome} (SKU: ${newItem.sku}) cadastrado na posição ${newItem.setor}/${newItem.corredor}/${newItem.posicao}`,
    ip: req.ip
  });

  res.status(201).json({ item: newItem });
});

// Stock Movement (in, out, transfer, adjustment)
apiRouter.post('/logistics/movement', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = req.company?.id || req.user!.companyId;
  const { itemId, tipo, quantidade, motivo, destino } = req.body;

  const item = db.inventory.find(i => i.id === itemId && i.companyId === companyId);
  if (!item) {
    res.status(404).json({ error: 'Produto não encontrado' });
    return;
  }

  const qty = Number(quantidade);
  if (isNaN(qty) || qty <= 0) {
    res.status(400).json({ error: 'Quantidade inválida' });
    return;
  }

  const saldoAnterior = item.quantidade;
  let saldoAtual = saldoAnterior;

  if (tipo === 'entrada') {
    saldoAtual = saldoAnterior + qty;
  } else if (tipo === 'saida') {
    if (saldoAnterior < qty) {
      res.status(400).json({ error: 'Saldo insuficiente em estoque' });
      return;
    }
    saldoAtual = saldoAnterior - qty;
  } else if (tipo === 'ajuste') {
    saldoAtual = qty; // For adjustment, qty is the new counted quantity
  } else if (tipo === 'transferencia') {
    // transfer position
    if (destino) {
      item.posicao = destino;
    }
  }

  item.quantidade = saldoAtual;
  item.ultimaMovimentacao = new Date().toISOString();

  const movement: StockMovement = {
    id: crypto.randomUUID(),
    companyId: companyId!,
    itemId: item.id,
    itemNome: item.nome,
    sku: item.sku,
    tipo,
    quantidade: qty,
    saldoAnterior,
    saldoAtual,
    motivo: motivo || 'Movimentação operacional',
    origem: `${item.setor}/${item.corredor}`,
    destino: destino || item.posicao,
    responsavelNome: req.user!.name,
    dataHora: new Date().toISOString()
  };

  db.stockMovements.unshift(movement);
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId: companyId!,
    companyName: req.company?.nomeFantasia,
    acao: 'MOVIMENTACAO_ESTOQUE',
    detalhes: `${tipo.toUpperCase()} de ${qty} un em ${item.nome}. Saldo: ${saldoAnterior} -> ${saldoAtual}. Motivo: ${motivo}`,
    ip: req.ip
  });

  res.json({ movement, item });
});

// Shipments / Despacho
apiRouter.get('/logistics/shipments', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = req.user!.role === 'master_owner' && req.query.companyId ? (req.query.companyId as string) : req.user!.companyId;
  const shipments = companyId ? db.shipments.filter(s => s.companyId === companyId) : db.shipments;
  res.json({ shipments });
});

apiRouter.post('/logistics/shipments', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  if (!companyId) {
    res.status(400).json({ error: 'Empresa obrigatória' });
    return;
  }

  const {
    destinatario,
    enderecoEntrega,
    cidade,
    transportadora,
    entregadorNome,
    placaVeiculo,
    volumes,
    pesoKg
  } = req.body;

  const count = db.shipments.filter(s => s.companyId === companyId).length + 1;
  const numeroExpedicao = `EXP-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`;
  const codigoRastreio = `TRK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const shipment: ShipmentOrder = {
    id: crypto.randomUUID(),
    companyId,
    numeroExpedicao,
    destinatario: destinatario || 'Cliente Destinatário',
    enderecoEntrega: enderecoEntrega || '',
    cidade: cidade || 'São Paulo / SP',
    transportadora: transportadora || 'Frota Própria',
    entregadorNome: entregadorNome || '',
    placaVeiculo: placaVeiculo || '',
    volumes: Number(volumes) || 1,
    pesoKg: Number(pesoKg) || 0,
    status: 'separacao',
    codigoRastreio,
    responsavelDespacho: req.user!.name,
    dataCriacao: new Date().toISOString()
  };

  db.shipments.unshift(shipment);
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId,
    companyName: req.company?.nomeFantasia,
    acao: 'CRIACAO_EXPEDICAO',
    detalhes: `Ordem de expedição ${shipment.numeroExpedicao} gerada para ${shipment.destinatario} (${shipment.volumes} volumes)`,
    ip: req.ip
  });

  res.status(201).json({ shipment });
});

apiRouter.patch('/logistics/shipments/:id/status', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = req.company?.id || req.user!.companyId;
  const { status, ocorrenciaTexto } = req.body;

  const shipment = db.shipments.find(s => s.id === id && (req.user!.role === 'master_owner' || s.companyId === companyId));
  if (!shipment) {
    res.status(404).json({ error: 'Ordem de expedição não encontrada' });
    return;
  }

  shipment.status = status;
  if (status === 'despachado') {
    shipment.dataDespacho = new Date().toISOString();
  } else if (status === 'entregue') {
    shipment.dataEntrega = new Date().toISOString();
  }
  if (ocorrenciaTexto) {
    shipment.ocorrenciaTexto = ocorrenciaTexto;
  }

  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId: shipment.companyId,
    acao: 'STATUS_EXPEDICAO',
    detalhes: `Status da expedição ${shipment.numeroExpedicao} atualizado para ${status.toUpperCase()}`,
    ip: req.ip
  });

  res.json({ shipment });
});

// ==========================================
// 5. CONDOMINIUM & CONCIERGE MODULE
// ==========================================

// Units list
apiRouter.get('/condo/units', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = req.user!.role === 'master_owner' && req.query.companyId ? (req.query.companyId as string) : req.user!.companyId;
  const units = companyId ? db.condoUnits.filter(u => u.companyId === companyId) : db.condoUnits;
  res.json({ units });
});

// Unit add/edit
apiRouter.post('/condo/units', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  if (!companyId) {
    res.status(400).json({ error: 'Empresa obrigatória' });
    return;
  }

  const { id, bloco, andar, numeroUnidade, responsavelPrincipal, email, telefone, moradores, observacoes } = req.body;

  if (id) {
    const unit = db.condoUnits.find(u => u.id === id && u.companyId === companyId);
    if (!unit) {
      res.status(404).json({ error: 'Unidade não encontrada' });
      return;
    }
    unit.bloco = bloco || unit.bloco;
    unit.andar = andar || unit.andar;
    unit.numeroUnidade = numeroUnidade || unit.numeroUnidade;
    unit.responsavelPrincipal = responsavelPrincipal || unit.responsavelPrincipal;
    unit.email = email || unit.email;
    unit.telefone = telefone || unit.telefone;
    unit.moradores = moradores || unit.moradores;
    unit.observacoes = observacoes ?? unit.observacoes;
    db.save();
    res.json({ unit });
    return;
  }

  const newUnit: CondoUnit = {
    id: crypto.randomUUID(),
    companyId,
    bloco: bloco || 'Torre A',
    andar: andar || '1º Andar',
    numeroUnidade: numeroUnidade || 'Apto 101',
    responsavelPrincipal: responsavelPrincipal || 'Morador Responsável',
    email: email || '',
    telefone: telefone || '',
    moradores: moradores || [],
    observacoes: observacoes || '',
    ativo: true
  };

  db.condoUnits.push(newUnit);
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId,
    companyName: req.company?.nomeFantasia,
    acao: 'CADASTRO_UNIDADE_PREDIAL',
    detalhes: `Unidade cadastrada: ${newUnit.bloco} - ${newUnit.numeroUnidade} (${newUnit.responsavelPrincipal})`,
    ip: req.ip
  });

  res.status(201).json({ unit: newUnit });
});

// Packages list
apiRouter.get('/condo/packages', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = req.user!.role === 'master_owner' && req.query.companyId
    ? (req.query.companyId as string)
    : (req.user!.companyId || (req.query.companyId as string) || req.company?.id || db.companies[0]?.id);
  const packages = companyId ? db.condoPackages.filter(p => p.companyId === companyId) : db.condoPackages;
  res.json({ packages });
});

// Register Package in Concierge
apiRouter.post('/condo/packages', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  if (!companyId) {
    res.status(400).json({ error: 'Empresa obrigatória para o registro da encomenda' });
    return;
  }

  const {
    unitId,
    unidadeIdentificacao,
    destinatarioNome,
    transportadora,
    nomeEntregador,
    descricaoConteudo,
    recebidoEm,
    observacoes
  } = req.body;

  if (!unidadeIdentificacao || !String(unidadeIdentificacao).trim()) {
    res.status(400).json({ error: 'A identificação da unidade ou apartamento é obrigatória' });
    return;
  }

  if (!destinatarioNome || !String(destinatarioNome).trim()) {
    res.status(400).json({ error: 'O nome do morador destinatário é obrigatório' });
    return;
  }

  if (!transportadora || !String(transportadora).trim()) {
    res.status(400).json({ error: 'A transportadora ou empresa de entrega é obrigatória' });
    return;
  }

  if (!descricaoConteudo || !String(descricaoConteudo).trim()) {
    res.status(400).json({ error: 'A descrição ou conteúdo do pacote é obrigatória' });
    return;
  }

  // Auto-link or auto-create unit if not already present
  let resolvedUnitId = unitId || '';
  if (!resolvedUnitId && unidadeIdentificacao) {
    const existingUnit = db.condoUnits.find(u =>
      u.companyId === companyId &&
      (`${u.bloco} - ${u.numeroUnidade}`.toLowerCase() === String(unidadeIdentificacao).trim().toLowerCase() ||
       u.numeroUnidade.toLowerCase() === String(unidadeIdentificacao).trim().toLowerCase())
    );
    if (existingUnit) {
      resolvedUnitId = existingUnit.id;
    } else {
      const newUnit: CondoUnit = {
        id: crypto.randomUUID(),
        companyId,
        bloco: String(unidadeIdentificacao).includes('-') ? String(unidadeIdentificacao).split('-')[0].trim() : 'Bloco Principal',
        andar: '1º Andar',
        numeroUnidade: String(unidadeIdentificacao).includes('-') ? String(unidadeIdentificacao).split('-')[1].trim() : String(unidadeIdentificacao).trim(),
        responsavelPrincipal: String(destinatarioNome).trim(),
        email: '',
        telefone: '',
        moradores: [],
        ativo: true
      };
      db.condoUnits.push(newUnit);
      resolvedUnitId = newUnit.id;
    }
  }

  const count = db.condoPackages.filter(p => p.companyId === companyId).length + 1;
  const codigoPacote = `ENC-${String(count).padStart(4, '0')}`;
  // 4-digit cryptographically secure retrieval PIN for resident confirmation
  const codigoRetiradaPin = crypto.randomInt(1000, 10000).toString();

  const pkg: CondoPackage = {
    id: crypto.randomUUID(),
    companyId,
    codigoPacote,
    unitId: resolvedUnitId,
    unidadeIdentificacao: String(unidadeIdentificacao).trim(),
    destinatarioNome: String(destinatarioNome).trim(),
    transportadora: String(transportadora).trim(),
    nomeEntregador: nomeEntregador ? String(nomeEntregador).trim() : '',
    descricaoConteudo: String(descricaoConteudo).trim(),
    codigoRetiradaPin,
    status: 'aguardando_retirada',
    recebidoPorPorteiro: req.user!.name || 'Porteiro da Guarita',
    recebidoEm: recebidoEm ? new Date(recebidoEm).toISOString() : new Date().toISOString(),
    observacoes: observacoes ? String(observacoes).trim() : ''
  };

  db.condoPackages.unshift(pkg);
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId,
    companyName: req.company?.nomeFantasia || 'LogiPredial Matriz',
    acao: 'RECEBIMENTO_ENCOMENDA_PORTARIA',
    detalhes: `Encomenda ${pkg.codigoPacote} recebida para ${pkg.unidadeIdentificacao} (${pkg.destinatarioNome}). PIN seguro: ${pkg.codigoRetiradaPin}`,
    ip: req.ip
  });

  res.status(201).json({
    pkg,
    message: `Encomenda ${pkg.codigoPacote} recebida com sucesso! Código PIN gerado: ${pkg.codigoRetiradaPin}`
  });
});

// Notify Resident via WhatsApp format link
apiRouter.post('/condo/packages/:id/notify', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = getEffectiveCompanyId(req);

  const pkg = db.condoPackages.find(p => p.id === id && (req.user!.role === 'master_owner' || p.companyId === companyId));
  if (!pkg) {
    res.status(404).json({ error: 'Encomenda não encontrada' });
    return;
  }

  pkg.status = 'notificado';
  pkg.notificadoEm = new Date().toISOString();
  db.save();

  // Find resident phone if unitId present
  let phone = '';
  if (pkg.unitId) {
    const unit = db.condoUnits.find(u => u.id === pkg.unitId);
    if (unit && unit.telefone) phone = unit.telefone.replace(/\D/g, '');
  }

  const notificationText = `📦 *Aviso de Encomenda na Portaria*\n\nOlá, ${pkg.destinatarioNome} (${pkg.unidadeIdentificacao})!\nUma encomenda chegou para você via ${pkg.transportadora}.\n\n*Código do Pacote:* ${pkg.codigoPacote}\n*PIN de Retirada:* ${pkg.codigoRetiradaPin}\n*Conteúdo:* ${pkg.descricaoConteudo}\n*Horário de Recebimento:* ${new Date(pkg.recebidoEm).toLocaleString('pt-BR')}\n\nPor favor, apresente este código PIN na portaria para retirar sua encomenda com segurança.`;

  const encoded = encodeURIComponent(notificationText);
  const whatsappUrl = phone ? `https://wa.me/55${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId: pkg.companyId,
    acao: 'NOTIFICACAO_MORADOR',
    detalhes: `Link de notificação WhatsApp preparado para morador de ${pkg.unidadeIdentificacao} (Pacote ${pkg.codigoPacote})`,
    ip: req.ip
  });

  res.json({ message: 'Link de notificação WhatsApp gerado com sucesso', pkg, whatsappUrl });
});

// Pickup package with PIN check
apiRouter.post('/condo/packages/:id/pickup', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = getEffectiveCompanyId(req);
  const { pin, retiradoPor, documentoRetirada } = req.body;

  const pkg = db.condoPackages.find(p => p.id === id && (req.user!.role === 'master_owner' || p.companyId === companyId));
  if (!pkg) {
    res.status(404).json({ error: 'Encomenda não encontrada' });
    return;
  }

  if (pkg.status === 'retirado') {
    res.status(400).json({ error: 'Esta encomenda já foi retirada anteriormente' });
    return;
  }

  // Strict PIN verification (mandatory for all non-master operators)
  if (req.user!.role !== 'master_owner') {
    if (!pin || String(pin).trim() !== pkg.codigoRetiradaPin) {
      res.status(400).json({ error: 'Código PIN de retirada incorreto ou não fornecido' });
      return;
    }
  }

  pkg.status = 'retirado';
  pkg.retiradoEm = new Date().toISOString();
  pkg.retiradoPor = (retiradoPor && String(retiradoPor).trim()) || pkg.destinatarioNome;
  pkg.documentoRetirada = documentoRetirada || 'Identificação confirmada na portaria';
  pkg.entreguePorPorteiro = req.user!.name;
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId: pkg.companyId,
    acao: 'RETIRADA_ENCOMENDA',
    detalhes: `Encomenda ${pkg.codigoPacote} retirada por ${pkg.retiradoPor} (Doc: ${pkg.documentoRetirada}) com PIN validado por ${req.user!.name}`,
    ip: req.ip
  });

  res.json({ message: 'Encomenda retirada e baixada com sucesso', pkg });
});

// Update condo package status and details
apiRouter.patch('/condo/packages/:id', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = getEffectiveCompanyId(req);

  const pkg = db.condoPackages.find(p => p.id === id && (req.user!.role === 'master_owner' || p.companyId === companyId));
  if (!pkg) {
    res.status(404).json({ error: 'Encomenda não encontrada' });
    return;
  }

  const { status, observacoes, retiradoPor, documentoRetirada, destinatarioNome, transportadora, descricaoConteudo } = req.body;
  if (status) {
    pkg.status = status;
    if (status === 'retirado' && !pkg.retiradoEm) {
      pkg.retiradoEm = new Date().toISOString();
      pkg.entreguePorPorteiro = req.user!.name;
    }
  }
  if (observacoes !== undefined) pkg.observacoes = observacoes;
  if (retiradoPor !== undefined) pkg.retiradoPor = retiradoPor;
  if (documentoRetirada !== undefined) pkg.documentoRetirada = documentoRetirada;
  if (destinatarioNome !== undefined) pkg.destinatarioNome = destinatarioNome;
  if (transportadora !== undefined) pkg.transportadora = transportadora;
  if (descricaoConteudo !== undefined) pkg.descricaoConteudo = descricaoConteudo;

  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId: pkg.companyId,
    acao: 'ATUALIZACAO_ENCOMENDA',
    detalhes: `Encomenda ${pkg.codigoPacote} atualizada. Status: ${pkg.status}`,
    ip: req.ip
  });

  res.json({ message: 'Encomenda atualizada com sucesso', pkg });
});

// Dashboard Metrics (Condo & Portaria analytics)
apiRouter.get('/dashboard/metrics', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = req.user!.role === 'master_owner' && req.query.companyId
    ? (req.query.companyId as string)
    : (req.user!.companyId || (req.query.companyId as string) || req.company?.id || db.companies[0]?.id);

  const period = ((req.query.period as string) || 'week') as 'day' | 'week' | 'month';
  const allPackages = companyId ? db.condoPackages.filter(p => p.companyId === companyId) : db.condoPackages;

  const now = new Date();
  let days = 7;
  if (period === 'day') days = 1;
  else if (period === 'month') days = 30;

  const currentCutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousCutoff = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

  const currentPackages = allPackages.filter(p => new Date(p.recebidoEm) >= currentCutoff);
  const previousPackages = allPackages.filter(p => {
    const d = new Date(p.recebidoEm);
    return d >= previousCutoff && d < currentCutoff;
  });

  const totalPeriod = currentPackages.length;
  const previousPeriodTotal = previousPackages.length;
  const percentageChange = previousPeriodTotal === 0
    ? (totalPeriod > 0 ? 100 : 0)
    : Math.round(((totalPeriod - previousPeriodTotal) / previousPeriodTotal) * 100);

  const awaitingPickup = allPackages.filter(p => p.status === 'aguardando_retirada' || p.status === 'notificado').length;
  const delivered = allPackages.filter(p => p.status === 'retirado').length;
  const pending = awaitingPickup;
  const completionRate = allPackages.length > 0 ? Math.round((delivered / allPackages.length) * 100) : 0;

  // Average pickup time
  const deliveredWithTimes = allPackages.filter(p => p.status === 'retirado' && p.retiradoEm && p.recebidoEm);
  let avgPickupMinutes = 0;
  if (deliveredWithTimes.length > 0) {
    const totalMinutes = deliveredWithTimes.reduce((acc, p) => {
      const diff = new Date(p.retiradoEm!).getTime() - new Date(p.recebidoEm).getTime();
      return acc + Math.max(0, diff / 60000);
    }, 0);
    avgPickupMinutes = Math.round(totalMinutes / deliveredWithTimes.length);
  }
  const hours = Math.floor(avgPickupMinutes / 60);
  const mins = avgPickupMinutes % 60;
  const avgPickupTimeFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  // Timeline Data
  const timelineData: { date: string; label: string; current: number; previous: number }[] = [];
  if (period === 'day') {
    for (let i = 0; i < 24; i += 3) {
      const label = `${String(i).padStart(2, '0')}:00`;
      timelineData.push({
        date: label,
        label,
        current: currentPackages.filter(p => new Date(p.recebidoEm).getHours() >= i && new Date(p.recebidoEm).getHours() < i + 3).length,
        previous: previousPackages.filter(p => new Date(p.recebidoEm).getHours() >= i && new Date(p.recebidoEm).getHours() < i + 3).length,
      });
    }
  } else if (period === 'week') {
    const daysName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().split('T')[0];
      const prevD = new Date(now.getTime() - (i + 7) * 24 * 60 * 60 * 1000);
      const prevDayStr = prevD.toISOString().split('T')[0];
      timelineData.push({
        date: dayStr,
        label: daysName[d.getDay()],
        current: currentPackages.filter(p => p.recebidoEm.startsWith(dayStr)).length,
        previous: previousPackages.filter(p => p.recebidoEm.startsWith(prevDayStr)).length,
      });
    }
  } else {
    for (let i = 29; i >= 0; i -= 3) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().split('T')[0];
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      timelineData.push({
        date: dayStr,
        label,
        current: currentPackages.filter(p => {
          const pDate = new Date(p.recebidoEm);
          const diffDays = Math.floor((now.getTime() - pDate.getTime()) / (24 * 60 * 60 * 1000));
          return diffDays >= i - 2 && diffDays <= i;
        }).length,
        previous: previousPackages.filter(p => {
          const pDate = new Date(p.recebidoEm);
          const diffDays = Math.floor((now.getTime() - pDate.getTime()) / (24 * 60 * 60 * 1000));
          return diffDays >= i + 28 && diffDays <= i + 30;
        }).length,
      });
    }
  }

  // Status breakdown
  const statusMap: Record<string, { label: string; color: string }> = {
    aguardando_retirada: { label: 'Aguardando Retirada', color: '#F59E0B' },
    notificado: { label: 'Notificado (WhatsApp)', color: '#3B82F6' },
    retirado: { label: 'Entregue ao Morador', color: '#10B981' },
    devolvido: { label: 'Devolvido ao Remetente', color: '#EF4444' },
    em_ocorrencia: { label: 'Em Ocorrência', color: '#8B5CF6' }
  };

  const statusBreakdown = Object.keys(statusMap).map(st => ({
    status: st,
    label: statusMap[st].label,
    count: allPackages.filter(p => p.status === st).length,
    color: statusMap[st].color
  }));

  const metricsResponse = {
    period,
    totalPeriod,
    previousPeriodTotal,
    percentageChange,
    awaitingPickup,
    delivered,
    pending,
    completionRate,
    avgPickupTimeFormatted,
    avgPickupMinutes,
    timelineData,
    statusBreakdown,
    operationalPerformance: {
      totalProcessed: allPackages.length,
      deliveredCount: delivered,
      completionPercentage: completionRate,
      avgPickupTimeFormatted,
      awaitingPickupCount: awaitingPickup
    },
    activityEvolution: {
      currentTotal: totalPeriod,
      previousTotal: previousPeriodTotal,
      growthPercentage: percentageChange,
      trend: percentageChange >= 0 ? ('up' as const) : ('down' as const),
      timeline: timelineData
    },
    totalDatabasePackages: allPackages.length
  };

  res.json(metricsResponse);
});

// Visitors & Access Control
apiRouter.get('/condo/visitors', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = req.user!.role === 'master_owner' && req.query.companyId
    ? (req.query.companyId as string)
    : (req.user!.companyId || (req.query.companyId as string) || req.company?.id || db.companies[0]?.id);
  const visitors = companyId ? db.condoVisitors.filter(v => v.companyId === companyId) : db.condoVisitors;
  res.json({ visitors });
});

// Check-in visitor
apiRouter.post('/condo/visitors', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  if (!companyId) {
    res.status(400).json({ error: 'Empresa obrigatória' });
    return;
  }

  const { nomeCompleto, documento, tipo, empresa, unidadeDestino, moradorAutorizador, observacoes } = req.body;

  if (!nomeCompleto || !unidadeDestino) {
    res.status(400).json({ error: 'Nome do visitante e unidade de destino são obrigatórios' });
    return;
  }

  const visitor: CondoVisitor = {
    id: crypto.randomUUID(),
    companyId,
    nomeCompleto,
    documento: documento || '',
    tipo: tipo || 'visitante',
    empresa: empresa || '',
    unidadeDestino,
    moradorAutorizador: moradorAutorizador || 'Autorizado pelo Morador',
    porteiroEntrada: req.user!.name,
    dataHoraEntrada: new Date().toISOString(),
    status: 'no_local',
    observacoes: observacoes || ''
  };

  db.condoVisitors.unshift(visitor);
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId,
    companyName: req.company?.nomeFantasia,
    acao: 'ENTRADA_VISITANTE',
    detalhes: `Entrada autorizada: ${visitor.nomeCompleto} (${visitor.tipo}) com destino à ${visitor.unidadeDestino}`,
    ip: req.ip
  });

  res.status(201).json({ visitor });
});

// Check-out visitor
apiRouter.patch('/condo/visitors/:id/checkout', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = req.company?.id || req.user!.companyId;

  const visitor = db.condoVisitors.find(v => v.id === id && (req.user!.role === 'master_owner' || v.companyId === companyId));
  if (!visitor) {
    res.status(404).json({ error: 'Visitante não encontrado' });
    return;
  }

  visitor.status = 'finalizado';
  visitor.dataHoraSaida = new Date().toISOString();
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId: visitor.companyId,
    acao: 'SAIDA_VISITANTE',
    detalhes: `Saída registrada: ${visitor.nomeCompleto} da unidade ${visitor.unidadeDestino}`,
    ip: req.ip
  });

  res.json({ message: 'Saída registrada com sucesso', visitor });
});

// Seed Initial Demo Company & Data if completely empty
apiRouter.post('/seed-sample-data', authenticate, requireMaster, (req: AuthRequest, res: Response) => {
  if (db.companies.length > 0) {
    res.json({ message: 'Dados de demonstração já existem ou empresas já cadastradas' });
    return;
  }

  const sampleCompanyId = crypto.randomUUID();
  const sampleCompany: Company = {
    id: sampleCompanyId,
    razaoSocial: 'LogiExpress & Condomínio Solar Ltda',
    nomeFantasia: 'LogiExpress Matriz',
    cnpj: '12.345.678/0001-90',
    responsavel: 'Carlos Eduardo Oliveira',
    email: 'operacao@logiexpress.com.br',
    telefone: '11987654321',
    endereco: 'Av. Paulista, 1000 - São Paulo/SP',
    segmento: 'Logística e Gestão Predial Integrada',
    quantidadeFuncionarios: 15,
    tipoOperacao: 'integrada',
    modulos: ['logistica', 'predial'],
    planoId: 'plan_demo',
    statusCadastro: 'ativo',
    statusAssinatura: 'demo_ativa',
    demoStartDate: new Date().toISOString(),
    demoEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    limites: db.plans[0].limites,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.companies.push(sampleCompany);

  // Seed sample products
  db.inventory.push(
    {
      id: crypto.randomUUID(),
      companyId: sampleCompanyId,
      sku: 'PAL-EUR-01',
      nome: 'Palete Padrão Europeu 120x80cm',
      categoria: 'Estruturas',
      quantidade: 45,
      estoqueMinimo: 10,
      unidadeMedida: 'UN',
      setor: 'Galpão A',
      corredor: 'C-02',
      posicao: 'P-08',
      valorUnitario: 85.00,
      ultimaMovimentacao: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      companyId: sampleCompanyId,
      sku: 'CXA-OND-30',
      nome: 'Caixa Papelão Ondulado Triplo 40x30x20',
      categoria: 'Embalagens',
      quantidade: 180,
      estoqueMinimo: 30,
      unidadeMedida: 'UN',
      setor: 'Galpão B',
      corredor: 'C-01',
      posicao: 'P-03',
      valorUnitario: 12.50,
      ultimaMovimentacao: new Date().toISOString()
    }
  );

  // Seed sample units
  const unit1Id = crypto.randomUUID();
  db.condoUnits.push(
    {
      id: unit1Id,
      companyId: sampleCompanyId,
      bloco: 'Torre Aurora',
      andar: '4º Andar',
      numeroUnidade: 'Apto 402',
      responsavelPrincipal: 'Dra. Mariana Silveira',
      email: 'mariana.silveira@email.com',
      telefone: '11991234567',
      moradores: [{ nome: 'Lucas Silveira', parentesco: 'Filho', telefone: '11991234568' }],
      ativo: true
    },
    {
      id: crypto.randomUUID(),
      companyId: sampleCompanyId,
      bloco: 'Torre Aurora',
      andar: '5º Andar',
      numeroUnidade: 'Apto 501',
      responsavelPrincipal: 'Roberto Albuquerque',
      email: 'roberto.albuquerque@email.com',
      telefone: '11998765432',
      moradores: [],
      ativo: true
    }
  );

  // Seed sample package
  db.condoPackages.push({
    id: crypto.randomUUID(),
    companyId: sampleCompanyId,
    codigoPacote: 'ENC-0001',
    unitId: unit1Id,
    unidadeIdentificacao: 'Torre Aurora - Apto 402',
    destinatarioNome: 'Dra. Mariana Silveira',
    transportadora: 'Mercado Livre Express',
    nomeEntregador: 'Marcos Vinicius',
    descricaoConteudo: 'Caixa de Livros e Eletrônicos',
    codigoRetiradaPin: '7419',
    status: 'aguardando_retirada',
    recebidoPorPorteiro: 'Porteiro Noturno',
    recebidoEm: new Date().toISOString()
  });

  // Seed sample logistics receipt
  db.logisticsReceipts.push({
    id: crypto.randomUUID(),
    companyId: sampleCompanyId,
    numeroRecebimento: 'REC-2026-001',
    fornecedor: 'Distribuidora Global Sul Ltda',
    remetente: 'Centro Logístico Campinas',
    transportadora: 'Braspress Transportes Rápidos',
    destinatarioSetor: 'Almoxarifado Central',
    numeroNota: 'NF-892341',
    quantidadeVolumes: 12,
    pesoKg: 340.5,
    descricao: 'Componentes e materiais para montagem',
    avariasRegistradas: false,
    conferenteNome: 'Operador Logístico Sênior',
    status: 'conferido',
    codigoRastreioQR: 'LP-REC-2026-001',
    dataHora: new Date().toISOString()
  });

  // Seed sample shipment
  db.shipments.push({
    id: crypto.randomUUID(),
    companyId: sampleCompanyId,
    numeroExpedicao: 'EXP-2026-001',
    destinatario: 'Construtora Horizonte Verde',
    enderecoEntrega: 'Rua das Flores, 450 - Centro',
    cidade: 'São Paulo - SP',
    transportadora: 'Total Express',
    entregadorNome: 'Ricardo Santos',
    placaVeiculo: 'BRA2E19',
    volumes: 4,
    pesoKg: 85.0,
    status: 'despachado',
    codigoRastreio: 'TRK-9812401-SP',
    responsavelDespacho: 'Supervisor de Expedição',
    dataCriacao: new Date().toISOString(),
    dataDespacho: new Date().toISOString()
  });

  // Seed sample visitors
  db.condoVisitors.push(
    {
      id: crypto.randomUUID(),
      companyId: sampleCompanyId,
      nomeCompleto: 'Felipe Mendes Carneiro',
      documento: '42.891.332-9',
      tipo: 'prestador_servico',
      empresa: 'Fibra Telecom Instalações',
      unidadeDestino: 'Torre Aurora - Apto 402',
      moradorAutorizador: 'Dra. Mariana Silveira',
      porteiroEntrada: 'Porteiro Noturno',
      dataHoraEntrada: new Date().toISOString(),
      status: 'no_local',
      observacoes: 'Manutenção de roteador de fibra'
    },
    {
      id: crypto.randomUUID(),
      companyId: sampleCompanyId,
      nomeCompleto: 'Ana Carolina Dias',
      documento: '33.102.944-1',
      tipo: 'visitante',
      unidadeDestino: 'Torre Aurora - Apto 501',
      moradorAutorizador: 'Roberto Albuquerque',
      porteiroEntrada: 'Porteiro Noturno',
      dataHoraEntrada: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      dataHoraSaida: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      status: 'finalizado',
      observacoes: 'Visita social'
    }
  );

  // Seed sample driver user if not exists
  let driverUser = db.users.find(u => u.role === 'driver' && u.companyId === sampleCompanyId);
  if (!driverUser) {
    const { hash, salt } = hashPassword('motorista123');
    driverUser = {
      id: crypto.randomUUID(),
      companyId: sampleCompanyId,
      email: 'motorista.sp@letlog.com.br',
      name: 'Carlos Alberto Silva (Motorista)',
      passwordHash: hash,
      salt,
      role: 'driver',
      phone: '11988887777',
      active: true,
      createdAt: new Date().toISOString()
    };
    db.users.push(driverUser);
  }

  // Seed sample vehicles
  if (db.vehicles.filter(v => v.companyId === sampleCompanyId).length === 0) {
    db.vehicles.push(
      {
        id: crypto.randomUUID(),
        companyId: sampleCompanyId,
        placa: 'BRA2E19',
        identificacao: 'Fiorino Express 01',
        categoria: 'fiorino',
        tipoPropriedade: 'proprio',
        capacidadeKg: 650,
        capacidadeVolumes: 50,
        motoristaVinculadoId: driverUser.id,
        motoristaVinculadoNome: driverUser.name,
        statusOperacional: 'disponivel',
        tipoRastreamento: 'app_gps',
        ultimaLocalizacao: {
          lat: -23.5505,
          lng: -46.6333,
          velocidade: 32,
          precisao: 8,
          atualizadoEm: new Date().toISOString(),
          status: 'online'
        },
        historicoViagensCount: 14,
        criadoEm: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        companyId: sampleCompanyId,
        placa: 'RTE4B88',
        identificacao: 'Moto Agilidade 02',
        categoria: 'moto',
        tipoPropriedade: 'proprio',
        capacidadeKg: 40,
        capacidadeVolumes: 8,
        statusOperacional: 'disponivel',
        tipoRastreamento: 'app_gps',
        historicoViagensCount: 42,
        criadoEm: new Date().toISOString()
      }
    );
  }

  // Seed sample deliveries if empty
  if (db.deliveries.filter(d => d.companyId === sampleCompanyId).length === 0) {
    const sampleDeliveries = [
      {
        destinatario: 'Hospital São Lucas - Recepção Central',
        cliente: 'Rede Hospitalar Paulista',
        telefone: '11987654321',
        endereco: 'Avenida Paulista',
        numero: '1200',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
        volumes: 3,
        pesoKg: 14.5,
        prioridade: 'urgente' as const,
        prazoEntrega: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
        janelaHorarioInicio: '08:00',
        janelaHorarioFim: '12:00',
        lat: -23.5615,
        lng: -46.6559,
        instrucoes: 'Entregar na doca de suprimentos com NF anexada'
      },
      {
        destinatario: 'Drogaria FarmaVida',
        cliente: 'Laboratório Farmacêutico',
        telefone: '11976543210',
        endereco: 'Rua Domingos de Morais',
        numero: '850',
        bairro: 'Vila Mariana',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '04010000',
        volumes: 5,
        pesoKg: 18.0,
        prioridade: 'alta' as const,
        prazoEntrega: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
        janelaHorarioInicio: '09:00',
        janelaHorarioFim: '14:00',
        lat: -23.5855,
        lng: -46.6385,
        instrucoes: 'Recebimento das 08h às 14h'
      },
      {
        destinatario: 'Escritório Advocacia Pinheiro',
        cliente: 'Gráfica Express',
        telefone: '11965432109',
        endereco: 'Rua Funchal',
        numero: '418',
        complemento: '12º andar',
        bairro: 'Vila Olímpia',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '04551060',
        volumes: 2,
        pesoKg: 6.0,
        prioridade: 'media' as const,
        prazoEntrega: new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0],
        lat: -23.5935,
        lng: -46.6872,
        instrucoes: 'Entregar na recepção'
      },
      {
        destinatario: 'Livraria & Café Cultura',
        cliente: 'Editora Nacional',
        telefone: '11954321098',
        endereco: 'Rua Fradique Coutinho',
        numero: '912',
        bairro: 'Pinheiros',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '05416001',
        volumes: 4,
        pesoKg: 22.5,
        prioridade: 'media' as const,
        prazoEntrega: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
        lat: -23.5601,
        lng: -46.6908,
        instrucoes: 'Conferir volumes com o gerente'
      }
    ];

    sampleDeliveries.forEach((d, i) => {
      db.deliveries.push({
        id: crypto.randomUUID(),
        companyId: sampleCompanyId,
        codigoRastreio: `LL-${Date.now().toString().slice(-4)}00${i + 1}`,
        destinatario: d.destinatario,
        cliente: d.cliente,
        telefone: d.telefone,
        endereco: d.endereco,
        numero: d.numero,
        complemento: (d as any).complemento,
        bairro: d.bairro,
        cidade: d.cidade,
        estado: d.estado,
        cep: d.cep,
        volumes: d.volumes,
        pesoKg: d.pesoKg,
        prioridade: d.prioridade,
        prazoEntrega: d.prazoEntrega,
        janelaHorarioInicio: d.janelaHorarioInicio,
        janelaHorarioFim: d.janelaHorarioFim,
        lat: d.lat,
        lng: d.lng,
        geocodificado: true,
        geocodificacaoStatus: 'ok',
        status: 'pendente',
        tentativas: 0,
        instrucoes: d.instrucoes,
        origemImportacao: 'manual',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      });
    });
  }

  db.save();
  res.json({ message: 'Dados de demonstração gerados com sucesso para a empresa inicial', sampleCompany });
});

// ==========================================
// 6. LET'S LOG — DELIVERIES & SPREADSHEET IMPORT
// ==========================================

// List deliveries with multi-criteria filters
apiRouter.get('/deliveries', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = req.user!.role === 'master_owner' && req.query.companyId
    ? (req.query.companyId as string)
    : getEffectiveCompanyId(req);

  let list = db.deliveries.filter(d => d.companyId === companyId);

  // Status filter
  if (req.query.status && typeof req.query.status === 'string' && req.query.status !== 'todos') {
    list = list.filter(d => d.status === req.query.status);
  }

  // Priority filter
  if (req.query.prioridade && typeof req.query.prioridade === 'string' && req.query.prioridade !== 'todas') {
    list = list.filter(d => d.prioridade === req.query.prioridade);
  }

  // City filter
  if (req.query.cidade && typeof req.query.cidade === 'string' && req.query.cidade.trim()) {
    const c = (req.query.cidade as string).toLowerCase().trim();
    list = list.filter(d => d.cidade.toLowerCase().includes(c));
  }

  // Neighborhood filter
  if (req.query.bairro && typeof req.query.bairro === 'string' && req.query.bairro.trim()) {
    const b = (req.query.bairro as string).toLowerCase().trim();
    list = list.filter(d => d.bairro.toLowerCase().includes(b));
  }

  // Search filter
  if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim()) {
    const term = (req.query.search as string).toLowerCase().trim();
    list = list.filter(d =>
      d.destinatario.toLowerCase().includes(term) ||
      d.codigoRastreio.toLowerCase().includes(term) ||
      d.endereco.toLowerCase().includes(term) ||
      d.cep.includes(term) ||
      (d.cliente && d.cliente.toLowerCase().includes(term))
    );
  }

  // Sort: newest first
  list.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  res.json({ deliveries: list });
});

// Create manual delivery with strict validation and geocoding
apiRouter.post('/deliveries', authenticate, checkSubscription, async (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const rawDestinatario = req.body.destinatario || req.body.cliente || req.body.clienteNome;
  const destinatario = rawDestinatario ? String(rawDestinatario).trim() : '';
  const {
    cliente,
    telefone,
    email,
    endereco,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    cep,
    referencia,
    instrucoes,
    volumes,
    pesoKg,
    valorMercadoria,
    prioridade,
    prazoEntrega,
    janelaHorarioInicio,
    janelaHorarioFim,
    observacoes
  } = req.body;

  // Strict location & mandatory fields validation
  if (!destinatario || !telefone || !endereco || !numero || !bairro || !cidade || !cep) {
    res.status(400).json({
      error: 'Dados obrigatórios ausentes: destinatário, telefone, endereço, número, bairro, cidade e CEP são necessários para cadastrar a entrega.'
    });
    return;
  }

  const cleanCep = String(cep).replace(/\D/g, '');
  if (cleanCep.length < 8) {
    res.status(400).json({ error: 'CEP inválido. O CEP deve conter 8 dígitos numéricos.' });
    return;
  }

  // Duplicate detection by code or exact address + recipient
  const existingDup = db.deliveries.find(d =>
    d.companyId === companyId &&
    d.status !== 'cancelada' &&
    d.destinatario.toLowerCase().trim() === destinatario.toLowerCase().trim() &&
    d.endereco.toLowerCase().trim() === endereco.toLowerCase().trim() &&
    d.numero.trim() === String(numero).trim() &&
    d.cep.replace(/\D/g, '') === cleanCep
  );

  if (existingDup) {
    res.status(409).json({
      error: `Possível duplicidade identificada: já existe a entrega ${existingDup.codigoRastreio} com mesmo destinatário e endereço nesta empresa.`
    });
    return;
  }

  // Geocoding
  const geo = await geocodeAddress(endereco, String(numero), bairro, cidade, cleanCep);

  const deliveryCount = db.deliveries.filter(d => d.companyId === companyId).length + 1;
  const codigoRastreio = `LL-${Date.now().toString().slice(-4)}${String(deliveryCount).padStart(3, '0')}`;

  const now = new Date().toISOString();
  const newDelivery: DeliveryItem = {
    id: crypto.randomUUID(),
    companyId,
    codigoRastreio,
    destinatario: String(destinatario).trim(),
    cliente: cliente ? String(cliente).trim() : undefined,
    telefone: String(telefone).trim(),
    email: email ? String(email).trim() : undefined,
    endereco: String(endereco).trim(),
    numero: String(numero).trim(),
    complemento: complemento ? String(complemento).trim() : undefined,
    bairro: String(bairro).trim(),
    cidade: String(cidade).trim(),
    estado: estado ? String(estado).trim() : 'SP',
    cep: cleanCep,
    referencia: referencia ? String(referencia).trim() : undefined,
    instrucoes: instrucoes ? String(instrucoes).trim() : undefined,
    volumes: Number(volumes) > 0 ? Number(volumes) : 1,
    pesoKg: Number(pesoKg) > 0 ? Number(pesoKg) : 1,
    valorMercadoria: valorMercadoria ? Number(valorMercadoria) : undefined,
    prioridade: prioridade || 'media',
    prazoEntrega: prazoEntrega || new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    janelaHorarioInicio: janelaHorarioInicio || undefined,
    janelaHorarioFim: janelaHorarioFim || undefined,
    lat: geo.status !== 'falha' ? geo.lat : undefined,
    lng: geo.status !== 'falha' ? geo.lng : undefined,
    geocodificado: geo.status !== 'falha',
    geocodificacaoStatus: geo.status,
    status: 'pendente',
    tentativas: 0,
    observacoes: observacoes ? String(observacoes).trim() : undefined,
    origemImportacao: 'manual',
    criadoEm: now,
    atualizadoEm: now
  };

  db.deliveries.push(newDelivery);
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId,
    acao: 'CADASTRO_ENTREGA',
    detalhes: `Entrega ${newDelivery.codigoRastreio} (${newDelivery.destinatario} - ${newDelivery.bairro}) cadastrada manualmente`,
    ip: req.ip
  });

  res.status(201).json({
    message: 'Entrega cadastrada com sucesso',
    delivery: newDelivery
  });
});

// Batch import of spreadsheet data (CSV or Excel) with complete audit and reporting
apiRouter.post('/deliveries/import', authenticate, checkSubscription, async (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const { rows } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: 'Nenhum registro recebido para importação.' });
    return;
  }

  const accepted: DeliveryItem[] = [];
  const rejected: { row: number; data: any; reason: string }[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const rowNum = i + 1;

    // Normalizing field names from various spreadsheet headers
    const destinatario = raw.destinatario || raw.Destinatario || raw.CLIENTE || raw.cliente || raw.Nome || raw.nome;
    const telefone = raw.telefone || raw.Telefone || raw.Contato || raw.contato || raw.celular || raw.Fone;
    const endereco = raw.endereco || raw.Endereco || raw.Logradouro || raw.Rua || raw.rua;
    const numero = raw.numero || raw.Numero || raw.Num || 'S/N';
    const complemento = raw.complemento || raw.Complemento || '';
    const bairro = raw.bairro || raw.Bairro;
    const cidade = raw.cidade || raw.Cidade || raw.Municipio || 'São Paulo';
    const estado = raw.estado || raw.Estado || raw.UF || 'SP';
    const cep = String(raw.cep || raw.CEP || '').replace(/\D/g, '');
    const volumes = Number(raw.volumes || raw.Volumes || raw.Qtd || 1) || 1;
    const pesoKg = Number(raw.pesoKg || raw.peso || raw.Peso || 1) || 1;
    const prioridade = raw.prioridade || raw.Prioridade || 'media';
    const prazo = raw.prazo || raw.prazoEntrega || new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];
    const instrucoes = raw.instrucoes || raw.observacoes || raw.Instrucoes || '';

    // Validation
    if (!destinatario || String(destinatario).trim().length < 2) {
      rejected.push({ row: rowNum, data: raw, reason: 'Nome do destinatário ausente ou inválido.' });
      continue;
    }
    if (!endereco || String(endereco).trim().length < 3) {
      rejected.push({ row: rowNum, data: raw, reason: 'Endereço / logradouro ausente ou incompleto.' });
      continue;
    }
    if (!bairro || String(bairro).trim().length < 2) {
      rejected.push({ row: rowNum, data: raw, reason: 'Bairro ausente.' });
      continue;
    }
    if (!cep || cep.length < 8) {
      rejected.push({ row: rowNum, data: raw, reason: 'CEP inválido (são necessários 8 dígitos numéricos).' });
      continue;
    }

    // Duplicate check
    const isDup = db.deliveries.some(d =>
      d.companyId === companyId &&
      d.status !== 'cancelada' &&
      d.destinatario.toLowerCase().trim() === String(destinatario).toLowerCase().trim() &&
      d.endereco.toLowerCase().trim() === String(endereco).toLowerCase().trim() &&
      d.numero.trim() === String(numero).trim() &&
      d.cep.replace(/\D/g, '') === cep
    );

    if (isDup) {
      rejected.push({ row: rowNum, data: raw, reason: 'Duplicidade detectada: entrega com mesmo destinatário, endereço e CEP já existente.' });
      continue;
    }

    // Geocode (with offline fallback guaranteed)
    const geo = await geocodeAddress(String(endereco), String(numero), String(bairro), String(cidade), cep);

    const deliveryCount = db.deliveries.filter(d => d.companyId === companyId).length + accepted.length + 1;
    const codigoRastreio = `LL-IMP-${String(deliveryCount).padStart(4, '0')}`;

    const newDelivery: DeliveryItem = {
      id: crypto.randomUUID(),
      companyId,
      codigoRastreio,
      destinatario: String(destinatario).trim(),
      cliente: raw.cliente ? String(raw.cliente).trim() : undefined,
      telefone: telefone ? String(telefone).trim() : '11999999999',
      email: raw.email ? String(raw.email).trim() : undefined,
      endereco: String(endereco).trim(),
      numero: String(numero).trim(),
      complemento: complemento ? String(complemento).trim() : undefined,
      bairro: String(bairro).trim(),
      cidade: String(cidade).trim(),
      estado: String(estado).trim(),
      cep,
      referencia: raw.referencia ? String(raw.referencia).trim() : undefined,
      instrucoes: instrucoes ? String(instrucoes).trim() : undefined,
      volumes,
      pesoKg,
      valorMercadoria: raw.valor ? Number(raw.valor) : undefined,
      prioridade: (['baixa', 'media', 'alta', 'urgente'].includes(String(prioridade).toLowerCase()) ? String(prioridade).toLowerCase() : 'media') as any,
      prazoEntrega: String(prazo),
      janelaHorarioInicio: raw.janelaInicio || undefined,
      janelaHorarioFim: raw.janelaFim || undefined,
      lat: geo.status !== 'falha' ? geo.lat : undefined,
      lng: geo.status !== 'falha' ? geo.lng : undefined,
      geocodificado: geo.status !== 'falha',
      geocodificacaoStatus: geo.status,
      status: 'pendente',
      tentativas: 0,
      origemImportacao: 'planilha_csv',
      criadoEm: now,
      atualizadoEm: now
    };

    accepted.push(newDelivery);
  }

  // Persist accepted deliveries
  if (accepted.length > 0) {
    db.deliveries.push(...accepted);
    db.save();

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      companyId,
      acao: 'IMPORTACAO_PLANILHA',
      detalhes: `Importação em lote concluída: ${accepted.length} entregas aceitas, ${rejected.length} rejeitadas`,
      ip: req.ip
    });
  }

  res.json({
    message: `Importação processada: ${accepted.length} entregas importadas com sucesso, ${rejected.length} rejeitadas.`,
    totalReceived: rows.length,
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    accepted,
    rejected
  });
});

// Update delivery (status, notes, or assigned vehicle/driver)
apiRouter.patch('/deliveries/:id', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const { id } = req.params;

  const delivery = db.deliveries.find(d => d.id === id && (req.user!.role === 'master_owner' || d.companyId === companyId));
  if (!delivery) {
    res.status(404).json({ error: 'Entrega não encontrada' });
    return;
  }

  const {
    status,
    observacoes,
    prioridade,
    recebedorNome,
    recebedorDocumento,
    motivoFalha
  } = req.body;

  if (status) delivery.status = status;
  if (observacoes !== undefined) delivery.observacoes = observacoes;
  if (prioridade) delivery.prioridade = prioridade;
  if (recebedorNome) delivery.recebedorNome = recebedorNome;
  if (recebedorDocumento) delivery.recebedorDocumento = recebedorDocumento;
  if (motivoFalha) delivery.motivoFalha = motivoFalha;
  if (status === 'entregue') delivery.entregueEm = new Date().toISOString();

  delivery.atualizadoEm = new Date().toISOString();
  db.save();

  res.json({ message: 'Entrega atualizada com sucesso', delivery });
});

// Delete unassigned delivery
apiRouter.delete('/deliveries/:id', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const { id } = req.params;

  const index = db.deliveries.findIndex(d => d.id === id && (req.user!.role === 'master_owner' || d.companyId === companyId));
  if (index === -1) {
    res.status(404).json({ error: 'Entrega não encontrada' });
    return;
  }

  const del = db.deliveries[index];
  if (del.status === 'em_rota' || del.status === 'entregue') {
    res.status(400).json({ error: 'Não é possível excluir entregas que já foram publicadas em rota ou entregues.' });
    return;
  }

  db.deliveries.splice(index, 1);
  db.save();

  res.json({ message: 'Entrega removida com sucesso' });
});

// ==========================================
// 7. LET'S LOG — FLEET & VEHICLE GPS TRACKING
// ==========================================

// List company fleet vehicles
apiRouter.get('/fleet/vehicles', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = req.user!.role === 'master_owner' && req.query.companyId
    ? (req.query.companyId as string)
    : getEffectiveCompanyId(req);

  const list = db.vehicles.filter(v => v.companyId === companyId);
  res.json({ vehicles: list });
});

// Register new vehicle
apiRouter.post('/fleet/vehicles', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const {
    placa,
    identificacao,
    categoria,
    tipoPropriedade,
    capacidadeKg,
    capacidadeVolumes,
    motoristaVinculadoId,
    tipoRastreamento
  } = req.body;

  if (!placa || !identificacao || !categoria || !capacidadeKg || !capacidadeVolumes) {
    res.status(400).json({ error: 'Placa, identificação, categoria, capacidade em kg e em volumes são obrigatórios.' });
    return;
  }

  const cleanPlaca = String(placa).toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Check duplicate license plate in company
  const exists = db.vehicles.find(v => v.companyId === companyId && v.placa === cleanPlaca);
  if (exists) {
    res.status(409).json({ error: `Veículo com a placa ${cleanPlaca} já está cadastrado nesta empresa.` });
    return;
  }

  let motoristaNome: string | undefined = undefined;
  if (motoristaVinculadoId) {
    const drv = db.users.find(u => u.id === motoristaVinculadoId);
    if (drv) motoristaNome = drv.name;
  }

  const newVehicle: Vehicle = {
    id: crypto.randomUUID(),
    companyId,
    placa: cleanPlaca,
    identificacao: String(identificacao).trim(),
    categoria: categoria || 'fiorino',
    tipoPropriedade: tipoPropriedade || 'proprio',
    capacidadeKg: Number(capacidadeKg),
    capacidadeVolumes: Number(capacidadeVolumes),
    motoristaVinculadoId: motoristaVinculadoId || undefined,
    motoristaVinculadoNome: motoristaNome,
    statusOperacional: 'disponivel',
    tipoRastreamento: tipoRastreamento || 'app_gps',
    historicoViagensCount: 0,
    criadoEm: new Date().toISOString()
  };

  db.vehicles.push(newVehicle);
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId,
    acao: 'CADASTRO_VEICULO',
    detalhes: `Veículo ${newVehicle.identificacao} (${newVehicle.placa}) cadastrado na frota`,
    ip: req.ip
  });

  res.status(201).json({ message: 'Veículo cadastrado com sucesso', vehicle: newVehicle });
});

// Update vehicle (status, driver link, maintenance)
apiRouter.patch('/fleet/vehicles/:id', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const { id } = req.params;

  const vehicle = db.vehicles.find(v => v.id === id && (req.user!.role === 'master_owner' || v.companyId === companyId));
  if (!vehicle) {
    res.status(404).json({ error: 'Veículo não encontrado' });
    return;
  }

  const {
    identificacao,
    categoria,
    capacidadeKg,
    capacidadeVolumes,
    motoristaVinculadoId,
    statusOperacional,
    tipoRastreamento
  } = req.body;

  if (identificacao) vehicle.identificacao = String(identificacao).trim();
  if (categoria) vehicle.categoria = categoria;
  if (capacidadeKg) vehicle.capacidadeKg = Number(capacidadeKg);
  if (capacidadeVolumes) vehicle.capacidadeVolumes = Number(capacidadeVolumes);
  if (statusOperacional) vehicle.statusOperacional = statusOperacional;
  if (tipoRastreamento) vehicle.tipoRastreamento = tipoRastreamento;

  if (motoristaVinculadoId !== undefined) {
    vehicle.motoristaVinculadoId = motoristaVinculadoId || undefined;
    if (motoristaVinculadoId) {
      const drv = db.users.find(u => u.id === motoristaVinculadoId);
      vehicle.motoristaVinculadoNome = drv?.name;
    } else {
      vehicle.motoristaVinculadoNome = undefined;
    }
  }

  db.save();
  res.json({ message: 'Veículo atualizado com sucesso', vehicle });
});

// Live GPS coordinate update from authorized driver device or tracker
apiRouter.post('/fleet/vehicles/:id/location', authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { lat, lng, velocidade, precisao, bateria, timestampDispositivo } = req.body;

  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    res.status(400).json({ error: 'Coordenadas de latitude e longitude inválidas (valores numéricos finitos obrigatórios)' });
    return;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    res.status(400).json({ error: 'Coordenadas fora dos limites geográficos válidos (-90 a 90 de latitude, -180 a 180 de longitude)' });
    return;
  }

  const vehicle = db.vehicles.find(v => v.id === id);
  if (!vehicle) {
    res.status(404).json({ error: 'Veículo não encontrado' });
    return;
  }

  // Security: only master owner, company admin, or assigned driver can send GPS updates
  if (req.user!.role !== 'master_owner') {
    if (vehicle.companyId !== req.user!.companyId) {
      res.status(403).json({ error: 'Acesso negado para este veículo' });
      return;
    }
    if (req.user!.role === 'driver' && vehicle.motoristaVinculadoId && vehicle.motoristaVinculadoId !== req.user!.id) {
      res.status(403).json({ error: 'Você não está vinculado a este veículo' });
      return;
    }
  }

  // Out-of-order & stale message protection
  const now = new Date();
  const deviceTime = timestampDispositivo ? new Date(timestampDispositivo) : now;

  if (vehicle.ultimaLocalizacao?.timestampDispositivo) {
    const prevDeviceTime = new Date(vehicle.ultimaLocalizacao.timestampDispositivo);
    if (!isNaN(prevDeviceTime.getTime()) && !isNaN(deviceTime.getTime())) {
      if (deviceTime.getTime() < prevDeviceTime.getTime()) {
        res.status(400).json({
          error: 'Pacote de telemetria descartado: leitura fora de ordem (timestamp do dispositivo anterior à última leitura registrada)',
          ultimaLeitura: vehicle.ultimaLocalizacao
        });
        return;
      }
      if (deviceTime.getTime() === prevDeviceTime.getTime() && vehicle.ultimaLocalizacao.lat === lat && vehicle.ultimaLocalizacao.lng === lng) {
        res.status(200).json({
          success: true,
          message: 'Telemetria repetida (já registrada anteriormente)',
          location: vehicle.ultimaLocalizacao
        });
        return;
      }
    }
  }

  // Velocity sanity check (anti-spoofing heuristic against teleportation)
  if (vehicle.ultimaLocalizacao && vehicle.ultimaLocalizacao.lat && vehicle.ultimaLocalizacao.lng) {
    const prevTime = vehicle.ultimaLocalizacao.atualizadoEm ? new Date(vehicle.ultimaLocalizacao.atualizadoEm).getTime() : 0;
    const timeDeltaSeconds = (now.getTime() - prevTime) / 1000;
    if (timeDeltaSeconds > 0 && timeDeltaSeconds < 3600) {
      const distKm = calculateDistanceKm(vehicle.ultimaLocalizacao.lat, vehicle.ultimaLocalizacao.lng, lat, lng);
      const impliedSpeedKmh = (distKm / (timeDeltaSeconds / 3600));
      // Flag anomalous impossible speed (e.g., > 300 km/h)
      if (impliedSpeedKmh > 300) {
        res.status(400).json({
          error: `Anomalia de telemetria detectada: velocidade implícita de ${Math.round(impliedSpeedKmh)} km/h excede o limite operacional seguro (possível coordenada adulterada ou salto de sinal GPS).`,
          distanciaKm: distKm,
          intervaloSegundos: timeDeltaSeconds
        });
        return;
      }
    }
  }

  vehicle.ultimaLocalizacao = {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    velocidade: velocidade !== undefined ? Number(velocidade) : 0,
    precisao: precisao !== undefined ? Number(precisao) : 10,
    bateria: bateria !== undefined ? Number(bateria) : undefined,
    timestampDispositivo: deviceTime.toISOString(),
    recebidoEm: now.toISOString(),
    atualizadoEm: now.toISOString(),
    origem: req.user!.name || 'driver_device',
    status: 'online'
  };

  db.save();
  res.json({ success: true, message: 'Localização atualizada', location: vehicle.ultimaLocalizacao });
});

// Query single vehicle
apiRouter.get('/fleet/vehicles/:id', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const { id } = req.params;
  const vehicle = db.vehicles.find(v => v.id === id && (req.user!.role === 'master_owner' || v.companyId === companyId));
  if (!vehicle) {
    res.status(404).json({ error: 'Veículo não encontrado' });
    return;
  }
  res.json({ vehicle });
});

// Query vehicle live location
apiRouter.get('/fleet/vehicles/:id/location', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const { id } = req.params;
  const vehicle = db.vehicles.find(v => v.id === id && (req.user!.role === 'master_owner' || v.companyId === companyId));
  if (!vehicle) {
    res.status(404).json({ error: 'Veículo não encontrado' });
    return;
  }
  res.json({
    veiculoId: vehicle.id,
    placa: vehicle.placa,
    identificacao: vehicle.identificacao,
    ultimaLocalizacao: vehicle.ultimaLocalizacao || null
  });
});

// ==========================================
// 8. LET'S LOG — ROUTE ENGINE & DISPATCHER PANEL
// ==========================================

// Route planning suggestion engine
apiRouter.post('/routes/plan-suggest', authenticate, checkSubscription, async (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const { deliveryIds, veiculoId } = req.body;

  if (!Array.isArray(deliveryIds) || deliveryIds.length === 0) {
    res.status(400).json({ error: 'Selecione pelo menos uma entrega para planejar a rota.' });
    return;
  }

  const vehicle = db.vehicles.find(v => v.id === veiculoId && v.companyId === companyId);
  if (!vehicle) {
    res.status(404).json({ error: 'Veículo selecionado não encontrado na frota.' });
    return;
  }

  const deliveries = db.deliveries.filter(d => deliveryIds.includes(d.id) && d.companyId === companyId);
  if (deliveries.length === 0) {
    res.status(400).json({ error: 'Nenhuma entrega válida encontrada com os IDs fornecidos.' });
    return;
  }

  // Calculate totals and capacity warnings
  const totalVolumes = deliveries.reduce((acc, d) => acc + (d.volumes || 1), 0);
  const totalWeightKg = deliveries.reduce((acc, d) => acc + (d.pesoKg || 1), 0);

  const warnings: string[] = [];
  let capacityExceeded = false;

  if (totalWeightKg > vehicle.capacidadeKg) {
    capacityExceeded = true;
    warnings.push(`Capacidade de peso excedida: Carga total de ${totalWeightKg.toFixed(1)} kg excede o limite do veículo de ${vehicle.capacidadeKg} kg.`);
  }

  if (totalVolumes > vehicle.capacidadeVolumes) {
    capacityExceeded = true;
    warnings.push(`Capacidade volumétrica excedida: ${totalVolumes} volumes excedem o limite de ${vehicle.capacidadeVolumes} do veículo.`);
  }

  // Separate deliveries with valid coordinates from those with incomplete/failed coordinates
  const withCoords = deliveries.filter(d => typeof d.lat === 'number' && typeof d.lng === 'number');
  const withoutCoords = deliveries.filter(d => typeof d.lat !== 'number' || typeof d.lng !== 'number');

  if (withoutCoords.length > 0) {
    warnings.push(`${withoutCoords.length} entrega(s) possuem endereço sem coordenadas geográficas confirmadas. Foram agrupadas por CEP e bairro sem coordenadas inventadas.`);
  }

  // Nearest-Neighbor sequencing optimization (proximity heuristic, not global optimum)
  const unvisited = [...withCoords];
  const orderedGeocoded: DeliveryItem[] = [];

  if (unvisited.length > 0) {
    let currentLat = unvisited[0].lat!;
    let currentLng = unvisited[0].lng!;

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const d = unvisited[i];
        const dist = calculateDistanceKm(currentLat, currentLng, d.lat!, d.lng!);
        const priorityBonus = d.prioridade === 'urgente' ? 0.6 : d.prioridade === 'alta' ? 0.8 : 1.0;
        const effectiveDist = dist * priorityBonus;

        if (effectiveDist < minDistance) {
          minDistance = effectiveDist;
          nearestIndex = i;
        }
      }

      const [selected] = unvisited.splice(nearestIndex, 1);
      orderedGeocoded.push(selected);
      currentLat = selected.lat!;
      currentLng = selected.lng!;
    }
  }

  // Cluster non-geocoded deliveries by CEP and bairro
  withoutCoords.sort((a, b) => {
    const cepA = (a.cep || '').slice(0, 5);
    const cepB = (b.cep || '').slice(0, 5);
    if (cepA !== cepB) return cepA.localeCompare(cepB);
    return (a.bairro || '').localeCompare(b.bairro || '');
  });

  const orderedDeliveries = [...orderedGeocoded, ...withoutCoords];

  // Calculate cumulative route distance & duration on geocoded segments
  let totalKm = 0;
  for (let i = 0; i < orderedGeocoded.length - 1; i++) {
    const a = orderedGeocoded[i];
    const b = orderedGeocoded[i + 1];
    totalKm += calculateDistanceKm(a.lat!, a.lng!, b.lat!, b.lng!);
  }

  // Road factor correction (~1.3x Euclidean/Haversine)
  const estimatedRoadKm = Number((totalKm * 1.3).toFixed(1));
  // 3 minutes per km + 10 minutes service time per stop
  const estimatedDurationMin = Math.round(estimatedRoadKm * 3 + orderedDeliveries.length * 10);

  const suggestedStops: RouteStop[] = orderedDeliveries.map((d, index) => ({
    ordem: index + 1,
    deliveryId: d.id,
    codigoRastreio: d.codigoRastreio,
    destinatario: d.destinatario,
    telefone: d.telefone,
    enderecoCompleto: `${d.endereco}, ${d.numero}${d.complemento ? ' - ' + d.complemento : ''}`,
    bairro: d.bairro,
    cidade: d.cidade,
    cep: d.cep,
    lat: d.lat,
    lng: d.lng,
    volumes: d.volumes,
    pesoKg: d.pesoKg,
    prioridade: d.prioridade,
    janelaHorario: d.janelaHorarioInicio && d.janelaHorarioFim ? `${d.janelaHorarioInicio} - ${d.janelaHorarioFim}` : undefined,
    instrucoes: d.instrucoes,
    status: 'aguardando'
  }));

  res.json({
    vehicle,
    totalDeliveries: deliveries.length,
    totalVolumes,
    totalWeightKg,
    capacityExceeded,
    warnings,
    estimatedDistanceKm: estimatedRoadKm,
    estimatedDurationMin,
    suggestedStops
  });
});

// List company routes
apiRouter.get('/routes', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = req.user!.role === 'master_owner' && req.query.companyId
    ? (req.query.companyId as string)
    : getEffectiveCompanyId(req);

  let list = db.routes.filter(r => r.companyId === companyId);

  // If logged-in user is a driver, only return routes assigned to them!
  if (req.user!.role === 'driver') {
    list = list.filter(r => r.motoristaId === req.user!.id);
  }

  list.sort((a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime());
  res.json({ routes: list });
});

// Get single route by ID
apiRouter.get('/routes/:id', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const route = db.routes.find(r => r.id === id);

  if (!route) {
    res.status(404).json({ error: 'Rota não encontrada' });
    return;
  }

  // Security: check company isolation and driver isolation
  if (req.user!.role !== 'master_owner') {
    if (route.companyId !== req.user!.companyId) {
      res.status(403).json({ error: 'Acesso negado a esta rota' });
      return;
    }
    if (req.user!.role === 'driver' && route.motoristaId !== req.user!.id) {
      res.status(403).json({ error: 'Acesso restrito ao motorista atribuído' });
      return;
    }
  }

  const vehicle = db.vehicles.find(v => v.id === route.veiculoId);
  res.json({ route, vehicle });
});

// Create new route in preparation
apiRouter.post('/routes', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const rawTitulo = req.body.titulo || req.body.nome;
  const titulo = rawTitulo ? String(rawTitulo).trim() : '';
  const veiculoId = req.body.veiculoId;
  const motoristaId = req.body.motoristaId;
  const stops = req.body.stops || req.body.sequenciaParadas || [];

  if (!titulo || !veiculoId || !Array.isArray(stops) || stops.length === 0) {
    res.status(400).json({ error: 'Título da rota, veículo e pelo menos uma parada são obrigatórios.' });
    return;
  }

  const vehicle = db.vehicles.find(v => v.id === veiculoId && v.companyId === companyId);
  if (!vehicle) {
    res.status(404).json({ error: 'Veículo não encontrado' });
    return;
  }

  let motoristaNome = 'A definir';
  let motoristaTelefone = '';
  if (motoristaId) {
    const drv = db.users.find(u => u.id === motoristaId);
    if (drv) {
      motoristaNome = drv.name;
      motoristaTelefone = drv.phone || '';
    }
  }

  const routeCount = db.routes.filter(r => r.companyId === companyId).length + 1;
  const codigoRota = `ROT-${new Date().getFullYear()}-${String(routeCount).padStart(3, '0')}`;

  const totalVolumes = stops.reduce((acc: number, s: RouteStop) => acc + (s.volumes || 1), 0);
  const totalPesoKg = stops.reduce((acc: number, s: RouteStop) => acc + (s.pesoKg || 1), 0);

  const cidades = Array.from(new Set(stops.map((s: RouteStop) => s.cidade).filter(Boolean)));
  const bairros = Array.from(new Set(stops.map((s: RouteStop) => s.bairro).filter(Boolean)));

  const now = new Date().toISOString();
  const newRoute: DeliveryRoute = {
    id: crypto.randomUUID(),
    companyId,
    codigoRota,
    titulo: String(titulo).trim(),
    versao: 1,
    status: 'em_preparacao',
    veiculoId: vehicle.id,
    veiculoPlaca: vehicle.placa,
    veiculoIdentificacao: vehicle.identificacao,
    motoristaId: motoristaId || '',
    motoristaNome,
    motoristaTelefone,
    roteiristaId: req.user!.id,
    roteiristaNome: req.user!.name,
    totalParadas: stops.length,
    totalVolumes,
    totalPesoKg,
    distanciaEstimadaKm: req.body.distanciaEstimadaKm || 15,
    tempoEstimadoMinutos: req.body.tempoEstimadoMinutos || 60,
    cidades,
    bairros,
    paradas: stops.map((s: RouteStop, idx: number) => ({ ...s, ordem: idx + 1, status: 'aguardando' })),
    criadaEm: now,
    historicoAlteracoes: [
      {
        versao: 1,
        alteradoPor: req.user!.name,
        dataHora: now,
        motivo: 'Criação inicial da rota'
      }
    ]
  };

  db.routes.push(newRoute);
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId,
    acao: 'CRIACAO_ROTA',
    detalhes: `Rota ${newRoute.codigoRota} (${newRoute.titulo}) criada em preparação com ${newRoute.totalParadas} paradas`,
    ip: req.ip
  });

  res.status(201).json({ message: 'Rota criada em preparação', route: newRoute });
});

// Update route (reorder stops, change vehicle/driver)
apiRouter.put('/routes/:id', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const { id } = req.params;

  const route = db.routes.find(r => r.id === id && (req.user!.role === 'master_owner' || r.companyId === companyId));
  if (!route) {
    res.status(404).json({ error: 'Rota não encontrada' });
    return;
  }

  const { titulo, veiculoId, motoristaId, stops, motivoAlteracao } = req.body;

  if (titulo) route.titulo = String(titulo).trim();

  if (veiculoId && veiculoId !== route.veiculoId) {
    const v = db.vehicles.find(vec => vec.id === veiculoId);
    if (v) {
      route.veiculoId = v.id;
      route.veiculoPlaca = v.placa;
      route.veiculoIdentificacao = v.identificacao;
    }
  }

  if (motoristaId && motoristaId !== route.motoristaId) {
    const drv = db.users.find(u => u.id === motoristaId);
    if (drv) {
      route.motoristaId = drv.id;
      route.motoristaNome = drv.name;
      route.motoristaTelefone = drv.phone || '';
    }
  }

  if (Array.isArray(stops)) {
    route.paradas = stops.map((s: RouteStop, idx: number) => ({ ...s, ordem: idx + 1 }));
    route.totalParadas = stops.length;
    route.totalVolumes = stops.reduce((acc: number, s: RouteStop) => acc + (s.volumes || 1), 0);
    route.totalPesoKg = stops.reduce((acc: number, s: RouteStop) => acc + (s.pesoKg || 1), 0);
  }

  // Increment version and record history
  route.versao += 1;
  route.historicoAlteracoes.push({
    versao: route.versao,
    alteradoPor: req.user!.name,
    dataHora: new Date().toISOString(),
    motivo: motivoAlteracao || 'Reorganização manual de paradas pelo roteirista'
  });

  db.save();
  res.json({ message: 'Rota atualizada com sucesso', route });
});

// Submit route to dispatcher review
apiRouter.post('/routes/:id/review', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const { id } = req.params;

  if (req.user!.role !== 'master_owner' && req.user!.role !== 'company_admin' && req.user!.role !== 'dispatcher') {
    res.status(403).json({ error: 'Apenas roteiristas ou administradores podem submeter rotas à revisão.' });
    return;
  }

  const route = db.routes.find(r => r.id === id && (req.user!.role === 'master_owner' || r.companyId === companyId));
  if (!route) {
    res.status(404).json({ error: 'Rota não encontrada' });
    return;
  }

  const now = new Date().toISOString();
  route.status = 'em_revisao';
  route.versao += 1;
  route.historicoAlteracoes.push({
    versao: route.versao,
    alteradoPor: req.user!.name,
    dataHora: now,
    motivo: req.body.motivo || 'Submissão formal da rota para revisão e validação do roteirista'
  });

  db.save();
  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId,
    acao: 'REVISAO_ROTA',
    detalhes: `Rota ${route.codigoRota} colocada em revisão pelo roteirista`,
    ip: req.ip
  });

  res.json({ message: 'Rota colocada em revisão com sucesso', route });
});

// Explicit confirmation to publish / release route to driver
apiRouter.post('/routes/:id/publish', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const { id } = req.params;

  // Authorization check: only master_owner, company_admin, or dispatcher can publish
  if (req.user!.role !== 'master_owner' && req.user!.role !== 'company_admin' && req.user!.role !== 'dispatcher') {
    res.status(403).json({ error: 'Apenas roteiristas ou administradores da empresa têm permissão para publicar rotas.' });
    return;
  }

  const route = db.routes.find(r => r.id === id && (req.user!.role === 'master_owner' || r.companyId === companyId));
  if (!route) {
    res.status(404).json({ error: 'Rota não encontrada' });
    return;
  }

  if (req.body.motoristaId) {
    route.motoristaId = req.body.motoristaId;
  }
  if (req.body.motoristaNome) {
    route.motoristaNome = req.body.motoristaNome;
  }
  if (!route.motoristaId && !route.motoristaNome) {
    res.status(400).json({ error: 'É necessário atribuir um motorista antes de publicar a rota.' });
    return;
  }

  const now = new Date().toISOString();
  route.status = 'publicada';
  route.publicadaEm = now;
  route.versao += 1;
  route.historicoAlteracoes.push({
    versao: route.versao,
    alteradoPor: req.user!.name,
    dataHora: now,
    motivo: 'Publicação oficial da rota para o entregador'
  });

  // Update underlying deliveries to 'planejada' and bind driver
  for (const stop of route.paradas) {
    const d = db.deliveries.find(del => del.id === stop.deliveryId);
    if (d) {
      d.status = 'planejada';
      d.routeId = route.id;
      d.sequencia = stop.ordem;
      d.motoristaId = route.motoristaId;
      d.motoristaNome = route.motoristaNome;
      d.veiculoId = route.veiculoId;
      d.veiculoPlaca = route.veiculoPlaca;
      d.atualizadoEm = now;
    }
  }

  // Update vehicle status
  const veh = db.vehicles.find(v => v.id === route.veiculoId);
  if (veh) {
    veh.statusOperacional = 'em_rota';
    veh.historicoViagensCount += 1;
  }

  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId,
    acao: 'PUBLICACAO_ROTA',
    detalhes: `Rota ${route.codigoRota} publicada para o motorista ${route.motoristaNome} com ${route.totalParadas} paradas`,
    ip: req.ip
  });

  res.json({ message: 'Rota publicada com sucesso! Agora disponível no painel do entregador.', route });
});

// Driver starts route execution
apiRouter.post('/routes/:id/start', authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const route = db.routes.find(r => r.id === id);

  if (!route) {
    res.status(404).json({ error: 'Rota não encontrada' });
    return;
  }

  // Authorization check
  if (req.user!.role === 'driver' && route.motoristaId !== req.user!.id) {
    res.status(403).json({ error: 'Você não é o motorista atribuído a esta rota' });
    return;
  }

  const now = new Date().toISOString();
  route.status = 'em_andamento';
  route.iniciadaEm = now;

  for (const stop of route.paradas) {
    const d = db.deliveries.find(del => del.id === stop.deliveryId);
    if (d && d.status === 'planejada') {
      d.status = 'em_rota';
      d.atualizadoEm = now;
    }
  }

  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId: route.companyId,
    acao: 'INICIO_ROTA',
    detalhes: `Motorista iniciou os deslocamentos da rota ${route.codigoRota}`,
    ip: req.ip
  });

  res.json({ message: 'Rota iniciada com sucesso. Bom trabalho e dirija com segurança!', route });
});

// Driver registers stop status (arrived, delivered, failed attempt, occurrence)
apiRouter.post('/routes/:id/stops/:stopIndex/status', authenticate, (req: AuthRequest, res: Response) => {
  const { id, stopIndex } = req.params;
  const idx = parseInt(stopIndex, 10);

  const route = db.routes.find(r => r.id === id);
  if (!route) {
    res.status(404).json({ error: 'Rota não encontrada' });
    return;
  }

  // Security: check company isolation and driver assignment
  if (req.user!.role !== 'master_owner') {
    if (route.companyId !== req.user!.companyId) {
      res.status(403).json({ error: 'Acesso negado a esta rota' });
      return;
    }
    if (req.user!.role === 'driver' && route.motoristaId && route.motoristaId !== req.user!.id) {
      res.status(403).json({ error: 'Você não é o motorista atribuído a esta rota' });
      return;
    }
    if (req.user!.role === 'operator') {
      res.status(403).json({ error: 'Operador predial não possui permissão para alterar paradas de rota de entrega' });
      return;
    }
  }

  if (idx < 0 || idx >= route.paradas.length) {
    res.status(400).json({ error: 'Índice de parada inválido' });
    return;
  }

  const stop = route.paradas[idx];
  const {
    status, // 'chegou' | 'entregue' | 'tentativa_falha'
    recebedorNome,
    recebedorDocumento,
    motivoFalha,
    observacao
  } = req.body;

  const now = new Date().toISOString();

  if (status === 'chegou') {
    stop.status = 'chegou';
    stop.horarioChegada = now;
  } else if (status === 'entregue') {
    stop.status = 'entregue';
    stop.horarioConclusao = now;
    stop.recebedorNome = recebedorNome || stop.destinatario;
    stop.recebedorDocumento = recebedorDocumento || 'Assinatura digital / Conferido no local';
    stop.observacaoEntregador = observacao || undefined;

    // Update delivery
    const d = db.deliveries.find(del => del.id === stop.deliveryId);
    if (d) {
      d.status = 'entregue';
      d.recebedorNome = stop.recebedorNome;
      d.recebedorDocumento = stop.recebedorDocumento;
      d.entregueEm = now;
      d.observacoes = observacao;
      d.atualizadoEm = now;
    }
  } else if (status === 'tentativa_falha') {
    stop.status = 'tentativa_falha';
    stop.horarioConclusao = now;
    stop.motivoFalha = motivoFalha || 'Destinatário ausente';
    stop.observacaoEntregador = observacao || undefined;

    const d = db.deliveries.find(del => del.id === stop.deliveryId);
    if (d) {
      d.status = 'tentativa_falha';
      d.tentativas += 1;
      d.motivoFalha = stop.motivoFalha;
      d.observacoes = observacao;
      d.atualizadoEm = now;
    }
  }

  // Check if all stops are done
  const allFinished = route.paradas.every(s => s.status === 'entregue' || s.status === 'tentativa_falha' || s.status === 'pulada');
  if (allFinished) {
    route.status = 'concluida';
    route.concluidaEm = now;

    // Release vehicle
    const v = db.vehicles.find(vec => vec.id === route.veiculoId);
    if (v) v.statusOperacional = 'disponivel';
  }

  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId: route.companyId,
    acao: 'STATUS_ENTREGA_MOTORISTA',
    detalhes: `Parada ${stop.ordem} (${stop.destinatario}) marcada como '${status}' pelo motorista`,
    ip: req.ip
  });

  res.json({ message: 'Status da parada registrado com sucesso', stop, route });
});

// Get active route for currently logged-in driver
apiRouter.get('/driver/active-route', authenticate, (req: AuthRequest, res: Response) => {
  // Find published or in_progress route for this driver
  const active = db.routes.find(r =>
    r.motoristaId === req.user!.id &&
    (r.status === 'publicada' || r.status === 'em_andamento')
  );

  if (!active) {
    res.json({ activeRoute: null });
    return;
  }

  const vehicle = db.vehicles.find(v => v.id === active.veiculoId);
  res.json({ activeRoute: active, vehicle });
});

// ==========================================
// 9. COMPANY USERS (DISPATCHERS, DRIVERS, ADMINS)
// ==========================================

// List users of company
apiRouter.get('/company/users', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = req.user!.role === 'master_owner' && req.query.companyId
    ? (req.query.companyId as string)
    : getEffectiveCompanyId(req);

  const users = db.users
    .filter(u => u.companyId === companyId)
    .map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      phone: u.phone,
      active: u.active,
      createdAt: u.createdAt
    }));

  res.json({ users });
});

// Register user for company (e.g. driver or dispatcher)
apiRouter.post('/company/users', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: 'Nome, e-mail, senha e perfil são obrigatórios.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const exists = db.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (exists) {
    res.status(409).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const newUser: User = {
    id: crypto.randomUUID(),
    email: cleanEmail,
    name: String(name).trim(),
    passwordHash: hash,
    salt,
    role,
    companyId,
    phone: phone ? String(phone).trim() : '',
    active: true,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId,
    acao: 'CRIACAO_USUARIO_EMPRESA',
    detalhes: `Usuário ${newUser.name} (${newUser.email}) cadastrado com perfil ${newUser.role}`,
    ip: req.ip
  });

  res.status(201).json({
    message: 'Usuário cadastrado com sucesso',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone
    }
  });
});

// ==========================================
// 10. CENTRAL FISCAL & EMISSÃO TRIBUTÁRIA
// ==========================================

// Get Fiscal Config for Company
apiRouter.get('/fiscal/config', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  let config = db.fiscalConfigs.find(f => f.companyId === companyId);
  if (!config) {
    const comp = db.companies.find(c => c.id === companyId) || db.companies[0];
    config = {
      id: crypto.randomUUID(),
      companyId,
      cnpj: comp?.cnpj || '00.000.000/0001-91',
      razaoSocial: comp?.razaoSocial || comp?.nomeFantasia || 'MoviLog Operações Logísticas Ltda',
      nomeFantasia: comp?.nomeFantasia || 'MoviLog',
      inscricaoEstadual: '111.222.333.444',
      inscricaoMunicipal: '999888-7',
      regimeTributario: 'simples_nacional',
      cnaePrincipal: '4930-2/02 - Transporte rodoviário de carga',
      enderecoFiscal: comp?.endereco || 'Av. Paulista, 1000 - Bela Vista',
      numero: '1000',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
      cep: '01310-100',
      ambiente: 'homologacao',
      serieNFe: 1,
      proximoNumeroNFe: 1,
      serieCTe: 1,
      proximoNumeroCTe: 1,
      serieMDFe: 1,
      proximoNumeroMDFe: 1,
      serieNFSe: 1,
      proximoNumeroNFSe: 1,
      certificadoStatus: 'valido',
      certificadoValidade: '2027-12-31T23:59:59.000Z',
      provedorIntegracao: 'simulador_homologacao',
      atualizadoEm: new Date().toISOString()
    };
    db.fiscalConfigs.push(config);
    db.save();
  }
  res.json({ config });
});

// Save or Update Fiscal Config
apiRouter.post('/fiscal/config', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const existingIndex = db.fiscalConfigs.findIndex(f => f.companyId === companyId);
  const now = new Date().toISOString();

  const payload = {
    ...req.body,
    companyId,
    atualizadoEm: now
  };

  if (existingIndex >= 0) {
    db.fiscalConfigs[existingIndex] = {
      ...db.fiscalConfigs[existingIndex],
      ...payload
    };
  } else {
    const newConfig: FiscalConfig = {
      id: crypto.randomUUID(),
      ...payload,
      serieNFe: Number(payload.serieNFe) || 1,
      proximoNumeroNFe: Number(payload.proximoNumeroNFe) || 1,
      serieCTe: Number(payload.serieCTe) || 1,
      proximoNumeroCTe: Number(payload.proximoNumeroCTe) || 1,
      serieMDFe: Number(payload.serieMDFe) || 1,
      proximoNumeroMDFe: Number(payload.proximoNumeroMDFe) || 1,
      serieNFSe: Number(payload.serieNFSe) || 1,
      proximoNumeroNFSe: Number(payload.proximoNumeroNFSe) || 1,
      certificadoStatus: payload.certificadoStatus || 'valido',
      provedorIntegracao: payload.provedorIntegracao || 'simulador_homologacao',
    };
    db.fiscalConfigs.push(newConfig);
  }
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId,
    acao: 'CONFIGURACAO_FISCAL',
    detalhes: `Parâmetros fiscais e tributários atualizados (Ambiente: ${payload.ambiente || 'homologacao'})`,
    ip: req.ip
  });

  const updated = db.fiscalConfigs.find(f => f.companyId === companyId);
  res.json({ message: 'Configurações fiscais salvas com sucesso', config: updated });
});

// List Fiscal Documents
apiRouter.get('/fiscal/documents', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = req.user!.role === 'master_owner' && req.query.companyId
    ? (req.query.companyId as string)
    : getEffectiveCompanyId(req);

  let docs = db.fiscalDocuments.filter(d => d.companyId === companyId);
  if (req.query.tipo) {
    docs = docs.filter(d => d.tipo === req.query.tipo);
  }
  if (req.query.status) {
    docs = docs.filter(d => d.status === req.query.status);
  }
  if (req.query.search) {
    const q = String(req.query.search).toLowerCase();
    docs = docs.filter(d =>
      d.chaveAcesso.toLowerCase().includes(q) ||
      d.destinatarioNome.toLowerCase().includes(q) ||
      String(d.numero).includes(q) ||
      d.destinatarioDocumento.includes(q)
    );
  }
  res.json({ documents: docs });
});

// Single Fiscal Document Detail
apiRouter.get('/fiscal/documents/:id', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = getEffectiveCompanyId(req);
  const doc = db.fiscalDocuments.find(d => d.id === id && (req.user!.role === 'master_owner' || d.companyId === companyId));
  if (!doc) {
    res.status(404).json({ error: 'Documento fiscal não encontrado' });
    return;
  }
  res.json({ document: doc });
});

// Emit Fiscal Document (NF-e, CT-e, MDF-e, NFS-e, NFC-e)
apiRouter.post('/fiscal/emit', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const config = db.fiscalConfigs.find(f => f.companyId === companyId);
  const company = db.companies.find(c => c.id === companyId) || db.companies[0];

  const {
    tipo, // 'nfe' | 'nfce' | 'nfse' | 'cte' | 'mdfe'
    destinatarioNome,
    destinatarioDocumento,
    destinatarioEndereco,
    destinatarioCidade,
    destinatarioUF,
    destinatarioCEP,
    naturezaOperacao,
    cfop,
    itens,
    valorTotalProdutos,
    valorFrete,
    valorSeguro,
    valorOutros,
    deliveryId,
    shipmentId
  } = req.body;

  if (!tipo || !destinatarioNome || !destinatarioDocumento) {
    res.status(400).json({ error: 'Tipo de documento, destinatário e CNPJ/CPF são obrigatórios' });
    return;
  }

  // Model numbers per Brazilian SEFAZ standards: 55 (NF-e), 65 (NFC-e), 57 (CT-e), 58 (MDF-e)
  const modeloMap: Record<string, string> = {
    nfe: '55',
    nfce: '65',
    cte: '57',
    mdfe: '58',
    nfse: '00'
  };
  const modelo = modeloMap[tipo] || '55';

  // Determine next number and series
  let serie = 1;
  let numero = 1;
  if (config) {
    if (tipo === 'nfe' || tipo === 'nfce') {
      serie = config.serieNFe || 1;
      numero = config.proximoNumeroNFe || 1;
      config.proximoNumeroNFe = numero + 1;
    } else if (tipo === 'cte') {
      serie = config.serieCTe || 1;
      numero = config.proximoNumeroCTe || 1;
      config.proximoNumeroCTe = numero + 1;
    } else if (tipo === 'mdfe') {
      serie = config.serieMDFe || 1;
      numero = config.proximoNumeroMDFe || 1;
      config.proximoNumeroMDFe = numero + 1;
    } else if (tipo === 'nfse') {
      serie = config.serieNFSe || 1;
      numero = config.proximoNumeroNFSe || 1;
      config.proximoNumeroNFSe = numero + 1;
    }
  }

  const now = new Date();
  const cUF = '35'; // SP code
  const emitCNPJ = config?.cnpj || company?.cnpj || '00.000.000/0001-91';
  const emitRazao = config?.razaoSocial || company?.razaoSocial || 'MoviLog Operações Logísticas Ltda';

  // Generate 44-digit official SEFAZ access key with Modulo 11 check digit
  const chaveAcesso = generateChaveAcessoNFe({
    cUF,
    anoMes: now.toISOString().slice(2, 4) + String(now.getMonth() + 1).padStart(2, '0'),
    cnpj: emitCNPJ,
    modelo,
    serie,
    numero,
    tpEmis: '1'
  });

  const protocoloAutorizacao = `135${now.getFullYear().toString().slice(-2)}${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  // Calculate taxes
  const totalProds = Number(valorTotalProdutos) || 100.0;
  const frete = Number(valorFrete) || 0;
  const seguro = Number(valorSeguro) || 0;
  const outros = Number(valorOutros) || 0;
  const total = totalProds + frete + seguro + outros;

  const baseCalculoICMS = tipo === 'nfse' ? 0 : totalProds;
  const valorICMS = tipo === 'nfse' ? 0 : Number((baseCalculoICMS * 0.12).toFixed(2));
  const baseCalculoISS = tipo === 'nfse' ? total : 0;
  const valorISS = tipo === 'nfse' ? Number((baseCalculoISS * 0.05).toFixed(2)) : 0;

  const fiscalItens = Array.isArray(itens) && itens.length > 0 ? itens : [
    {
      itemNumero: 1,
      descricao: `Serviço ou Carga Logística - Pedido ${numero}`,
      ncm: '84713012',
      cfop: cfop || (tipo === 'cte' ? '5353' : '5102'),
      quantidade: 1,
      unidadeMedida: 'UN',
      valorUnitario: totalProds,
      valorTotal: totalProds,
      aliquotaICMS: 12.0,
      valorICMS
    }
  ];

  // Build well-formed SEFAZ compliant XML string depending on document type
  let xmlConteudo = '';

  if (tipo === 'cte') {
    xmlConteudo = `<?xml version="1.0" encoding="UTF-8"?>
<cteProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/cte">
  <CTe xmlns="http://www.portalfiscal.inf.br/cte">
    <infCte Id="CTe${chaveAcesso}" versao="4.00">
      <ide>
        <cUF>${cUF}</cUF>
        <cCT>${chaveAcesso.slice(35, 43)}</cCT>
        <CFOP>${cfop || '5353'}</CFOP>
        <natOp>${naturezaOperacao || 'Prestação de Serviço de Transporte'}</natOp>
        <mod>57</mod>
        <serie>${serie}</serie>
        <nCT>${numero}</nCT>
        <dhEmi>${now.toISOString()}</dhEmi>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>${chaveAcesso.slice(-1)}</cDV>
        <tpAmb>${config?.ambiente === 'producao' ? '1' : '2'}</tpAmb>
        <tpCTe>0</tpCTe>
        <procEmi>0</procEmi>
        <verProc>MoviLog_v2.0</verProc>
      </ide>
      <emit>
        <CNPJ>${emitCNPJ.replace(/\D/g, '')}</CNPJ>
        <IE>${(config?.inscricaoEstadual || '111222333444').replace(/\D/g, '')}</IE>
        <xNome>${emitRazao}</xNome>
        <enderEmit>
          <xLgr>${config?.enderecoFiscal || 'Av. Paulista'}</xLgr>
          <nro>${config?.numero || '1000'}</nro>
          <xBairro>${config?.bairro || 'Bela Vista'}</xBairro>
          <cMun>3550308</cMun>
          <xMun>${config?.cidade || 'São Paulo'}</xMun>
          <CEP>${(config?.cep || '01310100').replace(/\D/g, '')}</CEP>
          <UF>${config?.uf || 'SP'}</UF>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>${destinatarioDocumento.replace(/\D/g, '')}</CNPJ>
        <xNome>${destinatarioNome}</xNome>
        <enderDest>
          <xLgr>${destinatarioEndereco || 'Rua do Cliente'}</xLgr>
          <nro>S/N</nro>
          <cMun>3550308</cMun>
          <xMun>${destinatarioCidade || 'São Paulo'}</xMun>
          <CEP>${(destinatarioCEP || '01000000').replace(/\D/g, '')}</CEP>
          <UF>${destinatarioUF || 'SP'}</UF>
        </enderDest>
      </dest>
      <vPrest>
        <vTPrest>${total.toFixed(2)}</vTPrest>
        <vRec>${total.toFixed(2)}</vRec>
      </vPrest>
      <imp>
        <ICMS>
          <ICMS00>
            <CST>00</CST>
            <vBC>${baseCalculoICMS.toFixed(2)}</vBC>
            <pICMS>12.00</pICMS>
            <vICMS>${valorICMS.toFixed(2)}</vICMS>
          </ICMS00>
        </ICMS>
      </imp>
    </infCte>
  </CTe>
  <protCTe versao="4.00">
    <infProt>
      <tpAmb>${config?.ambiente === 'producao' ? '1' : '2'}</tpAmb>
      <verAplic>MoviLog_v2.0</verAplic>
      <chCTe>${chaveAcesso}</chCTe>
      <dhRecbto>${now.toISOString()}</dhRecbto>
      <nProt>${protocoloAutorizacao}</nProt>
      <digVal>${crypto.randomBytes(16).toString('base64')}</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso do CT-e</xMotivo>
    </infProt>
  </protCTe>
</cteProc>`;
  } else if (tipo === 'mdfe') {
    xmlConteudo = `<?xml version="1.0" encoding="UTF-8"?>
<mdfeProc versao="3.00" xmlns="http://www.portalfiscal.inf.br/mdfe">
  <MDFe xmlns="http://www.portalfiscal.inf.br/mdfe">
    <infMDFe Id="MDFe${chaveAcesso}" versao="3.00">
      <ide>
        <cUF>${cUF}</cUF>
        <tpAmb>${config?.ambiente === 'producao' ? '1' : '2'}</tpAmb>
        <tpEmit>1</tpEmit>
        <mod>58</mod>
        <serie>${serie}</serie>
        <nMDF>${numero}</nMDF>
        <cMDF>${chaveAcesso.slice(35, 43)}</cMDF>
        <cDV>${chaveAcesso.slice(-1)}</cDV>
        <modal>1</modal>
        <dhEmi>${now.toISOString()}</dhEmi>
        <tpEmis>1</tpEmis>
        <procEmi>0</procEmi>
        <verProc>MoviLog_v2.0</verProc>
        <UFIni>${config?.uf || 'SP'}</UFIni>
        <UFFim>${destinatarioUF || 'SP'}</UFFim>
      </ide>
      <emit>
        <CNPJ>${emitCNPJ.replace(/\D/g, '')}</CNPJ>
        <IE>${(config?.inscricaoEstadual || '111222333444').replace(/\D/g, '')}</IE>
        <xNome>${emitRazao}</xNome>
        <enderEmit>
          <xLgr>${config?.enderecoFiscal || 'Av. Paulista'}</xLgr>
          <nro>${config?.numero || '1000'}</nro>
          <xBairro>${config?.bairro || 'Bela Vista'}</xBairro>
          <cMun>3550308</cMun>
          <xMun>${config?.cidade || 'São Paulo'}</xMun>
          <CEP>${(config?.cep || '01310100').replace(/\D/g, '')}</CEP>
          <UF>${config?.uf || 'SP'}</UF>
        </enderEmit>
      </emit>
      <tot>
        <qCTe>1</qCTe>
        <vCarga>${total.toFixed(2)}</vCarga>
        <cUnid>01</cUnid>
        <qCarga>1.0000</qCarga>
      </tot>
    </infMDFe>
  </MDFe>
  <protMDFe versao="3.00">
    <infProt>
      <tpAmb>${config?.ambiente === 'producao' ? '1' : '2'}</tpAmb>
      <verAplic>MoviLog_v2.0</verAplic>
      <chMDFe>${chaveAcesso}</chMDFe>
      <dhRecbto>${now.toISOString()}</dhRecbto>
      <nProt>${protocoloAutorizacao}</nProt>
      <digVal>${crypto.randomBytes(16).toString('base64')}</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso do MDF-e</xMotivo>
    </infProt>
  </protMDFe>
</mdfeProc>`;
  } else {
    xmlConteudo = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe${chaveAcesso}" versao="4.00">
      <ide>
        <cUF>${cUF}</cUF>
        <cNF>${chaveAcesso.slice(35, 43)}</cNF>
        <natOp>${naturezaOperacao || 'Venda ou Transporte de Mercadorias'}</natOp>
        <mod>${modelo}</mod>
        <serie>${serie}</serie>
        <nNF>${numero}</nNF>
        <dhEmi>${now.toISOString()}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>${chaveAcesso.slice(-1)}</cDV>
        <tpAmb>${config?.ambiente === 'producao' ? '1' : '2'}</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>MoviLog_v2.0</verProc>
      </ide>
      <emit>
        <CNPJ>${emitCNPJ.replace(/\D/g, '')}</CNPJ>
        <xNome>${emitRazao}</xNome>
        <enderEmit>
          <xLgr>${config?.enderecoFiscal || 'Av. Paulista'}</xLgr>
          <nro>${config?.numero || '1000'}</nro>
          <xBairro>${config?.bairro || 'Bela Vista'}</xBairro>
          <cMun>3550308</cMun>
          <xMun>${config?.cidade || 'São Paulo'}</xMun>
          <UF>${config?.uf || 'SP'}</UF>
          <CEP>${(config?.cep || '01310100').replace(/\D/g, '')}</CEP>
          <cPais>1058</cPais>
          <xPais>Brasil</xPais>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>${destinatarioDocumento.replace(/\D/g, '')}</CNPJ>
        <xNome>${destinatarioNome}</xNome>
        <enderDest>
          <xLgr>${destinatarioEndereco || 'Rua do Cliente'}</xLgr>
          <nro>S/N</nro>
          <cMun>3550308</cMun>
          <xMun>${destinatarioCidade || 'São Paulo'}</xMun>
          <UF>${destinatarioUF || 'SP'}</UF>
          <CEP>${(destinatarioCEP || '01000000').replace(/\D/g, '')}</CEP>
          <cPais>1058</cPais>
          <xPais>Brasil</xPais>
        </enderDest>
        <indIEDest>9</indIEDest>
      </dest>
      <total>
        <ICMSTot>
          <vBC>${baseCalculoICMS.toFixed(2)}</vBC>
          <vICMS>${valorICMS.toFixed(2)}</vICMS>
          <vProd>${totalProds.toFixed(2)}</vProd>
          <vFrete>${frete.toFixed(2)}</vFrete>
          <vSeg>${seguro.toFixed(2)}</vSeg>
          <vOutro>${outros.toFixed(2)}</vOutro>
          <vNF>${total.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>${config?.ambiente === 'producao' ? '1' : '2'}</tpAmb>
      <verAplic>MoviLog_v2.0</verAplic>
      <chNFe>${chaveAcesso}</chNFe>
      <dhRecbto>${now.toISOString()}</dhRecbto>
      <nProt>${protocoloAutorizacao}</nProt>
      <digVal>${crypto.randomBytes(16).toString('base64')}</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso do Documento Fiscal</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;
  }

  const doc: FiscalDocument = {
    id: crypto.randomUUID(),
    companyId,
    tipo,
    numero,
    serie,
    chaveAcesso,
    status: 'autorizado',
    dataEmissao: now.toISOString(),
    protocoloAutorizacao,
    ambiente: config?.ambiente || 'homologacao',
    emitenteCNPJ: emitCNPJ,
    emitenteRazao: emitRazao,
    emitenteUF: config?.uf || 'SP',
    destinatarioNome: String(destinatarioNome).trim(),
    destinatarioDocumento: String(destinatarioDocumento).trim(),
    destinatarioEndereco: destinatarioEndereco || '',
    destinatarioCidade: destinatarioCidade || 'São Paulo',
    destinatarioUF: destinatarioUF || 'SP',
    destinatarioCEP: destinatarioCEP || '',
    naturezaOperacao: naturezaOperacao || (tipo === 'cte' ? 'Prestação de Serviço de Transporte' : 'Venda de Mercadorias'),
    cfop: cfop || (tipo === 'cte' ? '5353' : '5102'),
    itens: fiscalItens,
    valorTotalProdutos: totalProds,
    valorFrete: frete,
    valorSeguro: seguro,
    valorOutros: outros,
    baseCalculoICMS,
    valorICMS,
    baseCalculoISS,
    valorISS,
    valorTotal: total,
    deliveryId: deliveryId || undefined,
    shipmentId: shipmentId || undefined,
    xmlConteudo,
    eventos: [
      {
        id: crypto.randomUUID(),
        tipo: 'autorizacao',
        dataHora: now.toISOString(),
        protocolo: protocoloAutorizacao,
        motivo: 'Documento fiscal transmitido e autorizado pelo motor SEFAZ homologação MoviLog',
        usuario: req.user!.name
      }
    ],
    criadoEm: now.toISOString()
  };

  db.fiscalDocuments.unshift(doc);

  // Link to delivery if present
  if (deliveryId) {
    const d = db.deliveries.find(del => del.id === deliveryId);
    if (d) {
      d.atualizadoEm = now.toISOString();
      d.observacoes = (d.observacoes ? `${d.observacoes} • ` : '') + `NF-e Chave: ${chaveAcesso.slice(0, 15)}...`;
    }
  }

  // Create financial revenue record automatically
  db.financialRecords.unshift({
    id: crypto.randomUUID(),
    companyId,
    tipo: 'receita',
    categoria: tipo === 'cte' ? 'frete' : 'outros',
    descricao: `Emissão ${tipo.toUpperCase()} Nº ${numero} - ${destinatarioNome}`,
    valor: total,
    dataCompetencia: now.toISOString().slice(0, 10),
    status: 'pago',
    fiscalDocId: doc.id,
    deliveryId: deliveryId || undefined,
    criadoEm: now.toISOString()
  });

  // Create operational notification
  db.notifications.unshift({
    id: crypto.randomUUID(),
    companyId,
    tipo: 'fiscal',
    titulo: `${tipo.toUpperCase()} Autorizada Nº ${numero}`,
    mensagem: `Documento fiscal para ${destinatarioNome} autorizado com sucesso. Chave: ${chaveAcesso.slice(0, 12)}...`,
    lida: false,
    prioridade: 'media',
    link: `/fiscal/${doc.id}`,
    dataHora: now.toISOString()
  });

  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId,
    acao: 'EMISSAO_FISCAL',
    detalhes: `${tipo.toUpperCase()} Nº ${numero} série ${serie} autorizada com valor R$ ${total.toFixed(2)}. Chave: ${chaveAcesso}`,
    ip: req.ip
  });

  res.status(201).json({
    message: `${tipo.toUpperCase()} emitida e autorizada com sucesso!`,
    document: doc
  });
});

// Cancel Fiscal Document
apiRouter.post('/fiscal/documents/:id/cancel', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { motivo } = req.body;
  const companyId = getEffectiveCompanyId(req);

  const doc = db.fiscalDocuments.find(d => d.id === id && (req.user!.role === 'master_owner' || d.companyId === companyId));
  if (!doc) {
    res.status(404).json({ error: 'Documento fiscal não encontrado' });
    return;
  }

  if (doc.status === 'cancelado') {
    res.status(400).json({ error: 'Este documento fiscal já se encontra cancelado.' });
    return;
  }

  if (!motivo || String(motivo).trim().length < 15) {
    res.status(400).json({ error: 'A justificativa de cancelamento fiscal exige no mínimo 15 caracteres conforme a norma do CONFAZ/SEFAZ.' });
    return;
  }

  const now = new Date().toISOString();
  doc.status = 'cancelado';
  doc.motivoCancelamento = String(motivo).trim();
  doc.eventos.push({
    id: crypto.randomUUID(),
    tipo: 'cancelamento',
    dataHora: now,
    protocolo: `135${Date.now().toString().slice(-9)}`,
    motivo: doc.motivoCancelamento,
    usuario: req.user!.name
  });

  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId: doc.companyId,
    acao: 'CANCELAMENTO_FISCAL',
    detalhes: `Cancelamento da ${doc.tipo.toUpperCase()} Nº ${doc.numero} registrado. Motivo: ${doc.motivoCancelamento}`,
    ip: req.ip
  });

  res.json({ message: 'Documento fiscal cancelado com sucesso', document: doc });
});

// Send Carta de Correção (CC-e)
apiRouter.post('/fiscal/documents/:id/correction', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { correcao } = req.body;
  const companyId = getEffectiveCompanyId(req);

  const doc = db.fiscalDocuments.find(d => d.id === id && (req.user!.role === 'master_owner' || d.companyId === companyId));
  if (!doc) {
    res.status(404).json({ error: 'Documento fiscal não encontrado' });
    return;
  }

  if (doc.status !== 'autorizado') {
    res.status(400).json({ error: 'Carta de Correção Eletrônica (CC-e) só pode ser emitida para documentos fiscais autorizados.' });
    return;
  }

  if (!correcao || String(correcao).trim().length < 15) {
    res.status(400).json({ error: 'O texto de correção exige no mínimo 15 caracteres (não altere valores, destinatário ou tributos essenciais).' });
    return;
  }

  const now = new Date().toISOString();
  doc.eventos.push({
    id: crypto.randomUUID(),
    tipo: 'carta_correcao',
    dataHora: now,
    protocolo: `135${Date.now().toString().slice(-9)}`,
    motivo: String(correcao).trim(),
    usuario: req.user!.name
  });

  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId: doc.companyId,
    acao: 'CCE_FISCAL',
    detalhes: `Carta de Correção registrada na ${doc.tipo.toUpperCase()} Nº ${doc.numero}`,
    ip: req.ip
  });

  res.json({ message: 'Carta de Correção Eletrônica (CC-e) registrada com sucesso', document: doc });
});

// ==========================================
// 11. FINANCEIRO & CUSTOS OPERACIONAIS
// ==========================================

// List Financial Records
apiRouter.get('/financial/records', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = req.user!.role === 'master_owner' && req.query.companyId
    ? (req.query.companyId as string)
    : getEffectiveCompanyId(req);

  let list = db.financialRecords.filter(r => r.companyId === companyId);
  if (req.query.tipo) {
    list = list.filter(r => r.tipo === req.query.tipo);
  }
  if (req.query.categoria) {
    list = list.filter(r => r.categoria === req.query.categoria);
  }
  res.json({ records: list });
});

// Create Financial Record
apiRouter.post('/financial/records', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const { tipo, categoria, descricao, valor, dataCompetencia, routeId, vehicleId, deliveryId, observacoes } = req.body;

  if (!tipo || !categoria || !descricao || !valor) {
    res.status(400).json({ error: 'Tipo, categoria, descrição e valor são obrigatórios.' });
    return;
  }

  const rec: FinancialRecord = {
    id: crypto.randomUUID(),
    companyId,
    tipo,
    categoria,
    descricao: String(descricao).trim(),
    valor: Number(valor) || 0,
    dataCompetencia: dataCompetencia || new Date().toISOString().slice(0, 10),
    status: 'pago',
    routeId: routeId || undefined,
    vehicleId: vehicleId || undefined,
    deliveryId: deliveryId || undefined,
    observacoes: observacoes ? String(observacoes).trim() : undefined,
    criadoEm: new Date().toISOString()
  };

  db.financialRecords.unshift(rec);
  db.save();

  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    companyId,
    acao: 'LANCAMENTO_FINANCEIRO',
    detalhes: `Lançamento ${tipo.toUpperCase()} (${categoria}): R$ ${rec.valor.toFixed(2)} - ${rec.descricao}`,
    ip: req.ip
  });

  res.status(201).json({ message: 'Lançamento financeiro registrado com sucesso', record: rec });
});

// Financial Consolidated Summary
apiRouter.get('/financial/summary', authenticate, checkSubscription, (req: AuthRequest, res: Response) => {
  const companyId = req.user!.role === 'master_owner' && req.query.companyId
    ? (req.query.companyId as string)
    : getEffectiveCompanyId(req);

  const records = db.financialRecords.filter(r => r.companyId === companyId);
  const totalReceitas = records.filter(r => r.tipo === 'receita').reduce((sum, r) => sum + r.valor, 0);
  const totalDespesas = records.filter(r => r.tipo === 'despesa').reduce((sum, r) => sum + r.valor, 0);
  const saldoOperacional = totalReceitas - totalDespesas;
  const margemPercentual = totalReceitas > 0 ? Math.round((saldoOperacional / totalReceitas) * 100) : 0;

  // Breakdown by category
  const categorias: Record<string, number> = {};
  records.forEach(r => {
    categorias[r.categoria] = (categorias[r.categoria] || 0) + r.valor;
  });

  res.json({
    totalReceitas,
    totalDespesas,
    saldoOperacional,
    margemPercentual,
    totalLancamentos: records.length,
    despesasPorCategoria: categorias
  });
});

// ==========================================
// 12. NOTIFICAÇÕES & ALERTAS OPERACIONAIS
// ==========================================

// List Notifications
apiRouter.get('/notifications', authenticate, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  const list = db.notifications.filter(n => !n.companyId || n.companyId === companyId || req.user!.role === 'master_owner');
  res.json({ notifications: list.slice(0, 50) });
});

// Mark Single Notification as Read
apiRouter.post('/notifications/:id/read', authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const n = db.notifications.find(notif => notif.id === id);
  if (n) {
    n.lida = true;
    db.save();
  }
  res.json({ success: true });
});

// Mark All Notifications as Read
apiRouter.post('/notifications/read-all', authenticate, (req: AuthRequest, res: Response) => {
  const companyId = getEffectiveCompanyId(req);
  db.notifications.forEach(n => {
    if (!n.companyId || n.companyId === companyId || req.user!.role === 'master_owner') {
      n.lida = true;
    }
  });
  db.save();
  res.json({ success: true, message: 'Todas as notificações marcadas como lidas' });
});

// ==========================================
// 13. RASTREAMENTO PÚBLICO E SEGURO (TOKEN / CÓDIGO)
// ==========================================
// Public endpoint for recipient tracking (no sensitive customer data leaked)
apiRouter.get('/tracking/public/:code', async (req: Request, res: Response) => {
  const { code } = req.params;
  if (!code || !String(code).trim()) {
    res.status(400).json({ error: 'Código de rastreamento é obrigatório.' });
    return;
  }
  const cleanCode = String(code).trim().toUpperCase();

  // Search in Deliveries
  const delivery = db.deliveries.find(d =>
    d.codigoRastreio.toUpperCase() === cleanCode ||
    (d.id && d.id.toUpperCase() === cleanCode)
  );

  if (delivery) {
    const comp = db.companies.find(c => c.id === delivery.companyId);
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(delivery.codigoRastreio, { width: 180, margin: 1 });
    } catch (e) {
      // ignore
    }

    res.json({
      tipo: 'entrega',
      codigoRastreio: delivery.codigoRastreio,
      transportadora: comp?.nomeFantasia || 'MoviLog Logística Inteligente',
      status: delivery.status,
      destinatarioResumido: delivery.destinatario ? `${delivery.destinatario.slice(0, 3)}***` : 'Destinatário',
      cidadeEstado: `${delivery.cidade || 'São Paulo'} / ${delivery.estado || 'SP'}`,
      volumes: delivery.volumes,
      pesoKg: delivery.pesoKg,
      prazoPrevisto: delivery.prazoEntrega,
      entregueEm: delivery.entregueEm || null,
      recebedor: delivery.recebedorNome ? `${delivery.recebedorNome.slice(0, 3)}***` : null,
      ocorrencia: delivery.motivoFalha || null,
      qrCodeUrl: qrDataUrl,
      etapas: [
        { label: 'Pedido Recebido', dataHora: delivery.criadoEm, concluido: true },
        { label: 'Em Separação e Conferência', dataHora: delivery.criadoEm, concluido: delivery.status !== 'pendente' },
        { label: 'Em Rota para Entrega', dataHora: delivery.status === 'em_rota' || delivery.status === 'entregue' ? delivery.atualizadoEm : null, concluido: delivery.status === 'em_rota' || delivery.status === 'entregue' },
        { label: 'Entregue ao Destinatário', dataHora: delivery.entregueEm || null, concluido: delivery.status === 'entregue' }
      ]
    });
    return;
  }

  // Search in Condo Packages
  const pkg = db.condoPackages.find(p =>
    p.codigoPacote.toUpperCase() === cleanCode ||
    p.id.toUpperCase() === cleanCode
  );

  if (pkg) {
    res.json({
      tipo: 'encomenda_portaria',
      codigoRastreio: pkg.codigoPacote,
      transportadora: pkg.transportadora,
      status: pkg.status,
      destinatarioResumido: `${pkg.destinatarioNome.slice(0, 3)}*** (${pkg.unidadeIdentificacao})`,
      cidadeEstado: 'Portaria & Guarita',
      recebidoEm: pkg.recebidoEm,
      retiradoEm: pkg.retiradoEm || null,
      etapas: [
        { label: 'Recebido na Portaria', dataHora: pkg.recebidoEm, concluido: true },
        { label: 'Morador Notificado', dataHora: pkg.notificadoEm || null, concluido: !!pkg.notificadoEm || pkg.status === 'retirado' },
        { label: 'Retirado com PIN', dataHora: pkg.retiradoEm || null, concluido: pkg.status === 'retirado' }
      ]
    });
    return;
  }

  // Search in Shipments
  const shipment = db.shipments.find(s =>
    s.codigoRastreio.toUpperCase() === cleanCode ||
    s.numeroExpedicao.toUpperCase() === cleanCode
  );

  if (shipment) {
    res.json({
      tipo: 'expedicao',
      codigoRastreio: shipment.codigoRastreio,
      transportadora: shipment.transportadora,
      status: shipment.status,
      destinatarioResumido: `${shipment.destinatario.slice(0, 3)}***`,
      cidadeEstado: shipment.cidade,
      volumes: shipment.volumes,
      dataCriacao: shipment.dataCriacao,
      dataEntrega: shipment.dataEntrega || null,
      etapas: [
        { label: 'Ordem de Expedição Criada', dataHora: shipment.dataCriacao, concluido: true },
        { label: 'Despachado / Em Trânsito', dataHora: shipment.dataDespacho || null, concluido: shipment.status === 'despachado' || shipment.status === 'entregue' },
        { label: 'Entregue com Sucesso', dataHora: shipment.dataEntrega || null, concluido: shipment.status === 'entregue' }
      ]
    });
    return;
  }

  res.status(404).json({ error: 'Nenhuma carga, entrega ou encomenda encontrada com o código informado.' });
});


