import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  role: 'master_owner' | 'company_admin' | 'dispatcher' | 'driver' | 'operator' | 'concierge' | 'viewer';
  companyId: string | null;
  phone?: string;
  active: boolean;
  createdAt: string;
}

export interface Company {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj?: string;
  responsavel: string;
  email: string;
  telefone: string;
  endereco: string;
  segmento: string;
  quantidadeFuncionarios: number;
  tipoOperacao: 'logistica' | 'expedicao' | 'predial' | 'integrada';
  modulos: ('logistica' | 'roteirizacao' | 'frota' | 'predial')[];
  planoId: string;
  statusCadastro: 'ativo' | 'pendente' | 'suspenso' | 'encerrado';
  statusAssinatura: 'demo_ativa' | 'demo_expirada' | 'aguardando_pagamento' | 'pagamento_em_analise' | 'assinatura_ativa' | 'assinatura_vencida' | 'suspensa' | 'cancelada';
  demoStartDate?: string;
  demoEndDate?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  limites: {
    maxUsuarios: number;
    maxUnidades: number;
    maxOperacoesMes: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CommercialPlan {
  id: string;
  nome: string;
  tipo: 'demo' | 'essencial' | 'profissional' | 'empresarial' | 'personalizado';
  descricao: string;
  precoMensal: number;
  precoAnual: number;
  duracaoDias: number;
  modulosPermitidos: ('logistica' | 'predial')[];
  limites: {
    maxUsuarios: number;
    maxUnidades: number;
    maxOperacoesMes: number;
  };
  recursos: string[];
  destaque?: boolean;
  ativo: boolean;
}

export interface SystemConfig {
  nomePlataforma: string;
  whatsappComercial: string;
  mensagemWhatsappPadrao: string;
  diasDemonstracao: number;
  masterEmail: string;
  masterInitialized: boolean;
  modoManutencao: boolean;
}

export interface PaymentRequest {
  id: string;
  companyId: string;
  companyName: string;
  planoId: string;
  planoNome: string;
  valor: number;
  periodoMeses: number;
  metodoPagamento: string;
  comprovanteReferencia: string;
  comprovanteUrl?: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  solicitadoEm: string;
  aprovadoEm?: string;
  aprovadoPor?: string;
  observacoes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userName: string;
  companyId?: string | null;
  companyName?: string;
  acao: string;
  detalhes: string;
  ip?: string;
}

// Logistics Models
export interface LogisticsReceipt {
  id: string;
  companyId: string;
  numeroRecebimento: string;
  fornecedor: string;
  remetente: string;
  transportadora: string;
  destinatarioSetor: string;
  numeroNota?: string;
  quantidadeVolumes: number;
  pesoKg: number;
  descricao: string;
  lote?: string;
  avariasRegistradas: boolean;
  detalhesAvarias?: string;
  conferenteNome: string;
  status: 'conferido' | 'divergencia' | 'armazenado';
  codigoRastreioQR: string;
  dataHora: string;
}

export interface InventoryItem {
  id: string;
  companyId: string;
  sku: string;
  nome: string;
  categoria: string;
  quantidade: number;
  estoqueMinimo: number;
  unidadeMedida: string;
  setor: string;
  corredor: string;
  posicao: string;
  valorUnitario: number;
  ultimaMovimentacao: string;
}

export interface StockMovement {
  id: string;
  companyId: string;
  itemId: string;
  itemNome: string;
  sku: string;
  tipo: 'entrada' | 'saida' | 'transferencia' | 'ajuste';
  quantidade: number;
  saldoAnterior: number;
  saldoAtual: number;
  motivo: string;
  origem?: string;
  destino?: string;
  responsavelNome: string;
  dataHora: string;
}

export interface ShipmentOrder {
  id: string;
  companyId: string;
  numeroExpedicao: string;
  destinatario: string;
  enderecoEntrega: string;
  cidade: string;
  transportadora: string;
  entregadorNome?: string;
  placaVeiculo?: string;
  volumes: number;
  pesoKg: number;
  status: 'separacao' | 'conferido' | 'despachado' | 'entregue' | 'ocorrencia';
  codigoRastreio: string;
  responsavelDespacho: string;
  dataCriacao: string;
  dataDespacho?: string;
  dataEntrega?: string;
  comprovanteEntrega?: string;
  ocorrenciaTexto?: string;
}

// Condo & Gatekeeper Models
export interface CondoUnit {
  id: string;
  companyId: string;
  bloco: string;
  andar: string;
  numeroUnidade: string; // Ex: Apto 101, Sala 402
  responsavelPrincipal: string;
  email: string;
  telefone: string;
  moradores: { nome: string; parentesco: string; telefone: string }[];
  observacoes?: string;
  ativo: boolean;
}

export interface CondoPackage {
  id: string;
  companyId: string;
  codigoPacote: string; // Ex: LP-7294
  unitId: string;
  unidadeIdentificacao: string; // Ex: Bloco A - Apto 302
  destinatarioNome: string;
  transportadora: string;
  nomeEntregador?: string;
  descricaoConteudo: string;
  codigoRetiradaPin: string; // PIN de 4 a 6 dígitos
  status: 'aguardando_retirada' | 'notificado' | 'retirado' | 'devolvido' | 'em_ocorrencia';
  recebidoPorPorteiro: string;
  recebidoEm: string;
  entreguePorPorteiro?: string;
  notificadoEm?: string;
  retiradoEm?: string;
  retiradoPor?: string;
  documentoRetirada?: string;
  fotoComprovante?: string;
  observacoes?: string;
}

export interface CondoVisitor {
  id: string;
  companyId: string;
  nomeCompleto: string;
  documento: string; // RG ou CPF
  tipo: 'visitante' | 'prestador_servico' | 'entregador' | 'corretor';
  empresa?: string;
  unidadeDestino: string;
  moradorAutorizador: string;
  porteiroEntrada: string;
  dataHoraEntrada: string;
  dataHoraSaida?: string;
  status: 'no_local' | 'finalizado';
  observacoes?: string;
}

export interface DeliveryItem {
  id: string;
  companyId: string;
  codigoRastreio: string; // Ex: DLV-2026-001
  destinatario: string;
  cliente?: string;
  telefone: string;
  email?: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado?: string;
  cep: string;
  referencia?: string;
  instrucoes?: string;
  volumes: number;
  pesoKg: number;
  valorMercadoria?: number;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  prazoEntrega: string;
  janelaHorarioInicio?: string;
  janelaHorarioFim?: string;
  lat?: number;
  lng?: number;
  geocodificado: boolean;
  geocodificacaoStatus?: 'ok' | 'aproximado' | 'pendente' | 'falha';
  status: 'pendente' | 'planejada' | 'em_rota' | 'entregue' | 'tentativa_falha' | 'cancelada';
  routeId?: string;
  sequencia?: number;
  motoristaId?: string;
  motoristaNome?: string;
  veiculoId?: string;
  veiculoPlaca?: string;
  tentativas: number;
  motivoFalha?: string;
  recebedorNome?: string;
  recebedorDocumento?: string;
  comprovanteFoto?: string;
  entregueEm?: string;
  observacoes?: string;
  origemImportacao: 'manual' | 'planilha_csv' | 'planilha_excel' | 'expedicao_interna';
  criadoEm: string;
  atualizadoEm: string;
}

export interface Vehicle {
  id: string;
  companyId: string;
  placa: string;
  identificacao: string; // Ex: Fiorino Express 01
  categoria: 'moto' | 'fiorino' | 'van' | 'caminhao_leve' | 'caminhao_pesado' | 'utilitario';
  tipoPropriedade: 'proprio' | 'terceirizado' | 'agregado';
  capacidadeKg: number;
  capacidadeVolumes: number;
  motoristaVinculadoId?: string;
  motoristaVinculadoNome?: string;
  statusOperacional: 'disponivel' | 'em_rota' | 'manutencao' | 'inativo';
  tipoRastreamento: 'app_gps' | 'rastreador_externo' | 'manual';
  ultimaLocalizacao?: {
    lat: number;
    lng: number;
    velocidade?: number;
    precisao?: number;
    atualizadoEm: string;
    timestampDispositivo?: string;
    recebidoEm?: string;
    origem?: string;
    bateria?: number;
    status: 'online' | 'recente' | 'offline';
  };
  historicoViagensCount: number;
  criadoEm: string;
}

export interface RouteStop {
  ordem: number;
  deliveryId: string;
  codigoRastreio: string;
  destinatario: string;
  telefone: string;
  enderecoCompleto: string;
  bairro: string;
  cidade: string;
  cep: string;
  lat?: number;
  lng?: number;
  volumes: number;
  pesoKg: number;
  prioridade: string;
  janelaHorario?: string;
  instrucoes?: string;
  status: 'aguardando' | 'chegou' | 'entregue' | 'tentativa_falha' | 'pulada';
  horarioChegada?: string;
  horarioConclusao?: string;
  motivoFalha?: string;
  recebedorNome?: string;
  recebedorDocumento?: string;
  observacaoEntregador?: string;
}

export interface DeliveryRoute {
  id: string;
  companyId: string;
  codigoRota: string; // Ex: ROT-001
  titulo: string;
  versao: number;
  status: 'em_preparacao' | 'em_revisao' | 'publicada' | 'em_andamento' | 'concluida' | 'cancelada';
  veiculoId: string;
  veiculoPlaca: string;
  veiculoIdentificacao: string;
  motoristaId: string;
  motoristaNome: string;
  motoristaTelefone?: string;
  roteiristaId: string;
  roteiristaNome: string;
  totalParadas: number;
  totalVolumes: number;
  totalPesoKg: number;
  distanciaEstimadaKm: number;
  tempoEstimadoMinutos: number;
  distanciaRealKm?: number;
  tempoRealMinutos?: number;
  cidades: string[];
  bairros: string[];
  paradas: RouteStop[];
  criadaEm: string;
  publicadaEm?: string;
  iniciadaEm?: string;
  concluidaEm?: string;
  historicoAlteracoes: {
    versao: number;
    alteradoPor: string;
    dataHora: string;
    motivo: string;
  }[];
}

export interface DatabaseSchema {
  users: User[];
  companies: Company[];
  plans: CommercialPlan[];
  systemConfig: SystemConfig;
  payments: PaymentRequest[];
  auditLogs: AuditLog[];
  logisticsReceipts: LogisticsReceipt[];
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  shipments: ShipmentOrder[];
  deliveries: DeliveryItem[];
  vehicles: Vehicle[];
  routes: DeliveryRoute[];
  condoUnits: CondoUnit[];
  condoPackages: CondoPackage[];
  condoVisitors: CondoVisitor[];
}

// Default Seed Data
const defaultPlans: CommercialPlan[] = [
  {
    id: 'plan_demo',
    nome: 'Plano Demonstração',
    tipo: 'demo',
    descricao: 'Acesso temporário para conhecer todas as funcionalidades da plataforma.',
    precoMensal: 0,
    precoAnual: 0,
    duracaoDias: 7,
    modulosPermitidos: ['logistica', 'predial'],
    limites: {
      maxUsuarios: 3,
      maxUnidades: 20,
      maxOperacoesMes: 50
    },
    recursos: [
      'Avaliação completa de 7 dias',
      'Módulo de Logística e Expedição',
      'Módulo de Portaria e Encomendas',
      'Cadastro de até 3 operadores',
      'Rastreamento com QR Code',
      'Suporte para implantação assistida'
    ],
    destaque: false,
    ativo: true
  },
  {
    id: 'plan_essencial',
    nome: 'Plano Essencial',
    tipo: 'essencial',
    descricao: 'Ideal para condomínios pequenos ou operações locais de logística.',
    precoMensal: 249,
    precoAnual: 2490,
    duracaoDias: 30,
    modulosPermitidos: ['logistica', 'predial'],
    limites: {
      maxUsuarios: 5,
      maxUnidades: 80,
      maxOperacoesMes: 300
    },
    recursos: [
      'Recebimento e conferência de volumes',
      'Controle de portaria e encomendas com PIN',
      'Histórico de movimentações',
      'Etiquetas e comprovantes em QR Code',
      'Até 5 usuários ativos',
      'Relatórios essenciais em PDF/CSV'
    ],
    destaque: false,
    ativo: true
  },
  {
    id: 'plan_profissional',
    nome: 'Plano Profissional',
    tipo: 'profissional',
    descricao: 'Para médias empresas de logística, centros de distribuição e condomínios médios/grandes.',
    precoMensal: 490,
    precoAnual: 4900,
    duracaoDias: 30,
    modulosPermitidos: ['logistica', 'predial'],
    limites: {
      maxUsuarios: 20,
      maxUnidades: 350,
      maxOperacoesMes: 2000
    },
    recursos: [
      'Tudo do Essencial com limites ampliados',
      'Controle avançado de estoque e posições',
      'Expedição e despacho com rastreamento',
      'Disparo de notificações diretas no WhatsApp',
      'Gestão de visitantes e prestadores',
      'Indicadores operacionais e produtividade'
    ],
    destaque: true,
    ativo: true
  },
  {
    id: 'plan_empresarial',
    nome: 'Plano Empresarial',
    tipo: 'empresarial',
    descricao: 'Operações de alta complexidade com múltiplas unidades e auditoria completa.',
    precoMensal: 980,
    precoAnual: 9800,
    duracaoDias: 30,
    modulosPermitidos: ['logistica', 'predial'],
    limites: {
      maxUsuarios: 100,
      maxUnidades: 2000,
      maxOperacoesMes: 15000
    },
    recursos: [
      'Tudo do Profissional com multiunidades',
      'Controle unificado de galpões e condomínios',
      'Logs de auditoria e conformidade LGPD',
      'Módulos integrados sem restrição',
      'Exportação e relatórios analíticos de custos',
      'Suporte técnico e comercial prioritário'
    ],
    destaque: false,
    ativo: true
  },
  {
    id: 'plan_personalizado',
    nome: 'Plano Personalizado',
    tipo: 'personalizado',
    descricao: 'Solução sob medida para transportadoras de grande porte e administradoras prediais.',
    precoMensal: 0,
    precoAnual: 0,
    duracaoDias: 30,
    modulosPermitidos: ['logistica', 'predial'],
    limites: {
      maxUsuarios: 9999,
      maxUnidades: 99999,
      maxOperacoesMes: 999999
    },
    recursos: [
      'Volume operacional customizado',
      'Integrações personalizadas com ERP',
      'Gestão dedicada de implantação',
      'SLA de atendimento contratual',
      'Condições e preços definidos pelo Master'
    ],
    destaque: false,
    ativo: true
  }
];

const defaultSystemConfig: SystemConfig = {
  nomePlataforma: 'LogiPredial - Plataforma Integrada de Logística e Gestão Predial',
  whatsappComercial: '5511999999999',
  mensagemWhatsappPadrao: 'Olá! Tenho interesse em contratar o plano [NOME DO PLANO] da plataforma LogiPredial.\n\nEmpresa: [NOME DA EMPRESA]\nCNPJ, quando aplicável: [CNPJ]\nPlano selecionado: [PLANO]\nValor informado: [VALOR]\nPeríodo contratado: [PERÍODO]\n\nGostaria de receber as instruções para pagamento e ativação.',
  diasDemonstracao: 7,
  masterEmail: 'Alifermadeiro@hotmail.com',
  masterInitialized: false,
  modoManutencao: false
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all collections exist
        return {
          users: parsed.users || [],
          companies: parsed.companies || [],
          plans: parsed.plans && parsed.plans.length > 0 ? parsed.plans : defaultPlans,
          systemConfig: parsed.systemConfig || defaultSystemConfig,
          payments: parsed.payments || [],
          auditLogs: parsed.auditLogs || [],
          logisticsReceipts: parsed.logisticsReceipts || [],
          inventory: parsed.inventory || [],
          stockMovements: parsed.stockMovements || [],
          shipments: parsed.shipments || [],
          deliveries: parsed.deliveries || [],
          vehicles: parsed.vehicles || [],
          routes: parsed.routes || [],
          condoUnits: parsed.condoUnits || [],
          condoPackages: parsed.condoPackages || [],
          condoVisitors: parsed.condoVisitors || []
        };
      } catch (err) {
        console.error('Error loading db.json, fallback to defaults:', err);
      }
    }

    const initial: DatabaseSchema = {
      users: [],
      companies: [],
      plans: defaultPlans,
      systemConfig: defaultSystemConfig,
      payments: [],
      auditLogs: [],
      logisticsReceipts: [],
      inventory: [],
      stockMovements: [],
      shipments: [],
      deliveries: [],
      vehicles: [],
      routes: [],
      condoUnits: [],
      condoPackages: [],
      condoVisitors: []
    };
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema): void {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public save(): void {
    this.saveData(this.data);
  }

  public get users() { return this.data.users; }
  public get companies() { return this.data.companies; }
  public get plans() { return this.data.plans; }
  public get systemConfig() { return this.data.systemConfig; }
  public get payments() { return this.data.payments; }
  public get auditLogs() { return this.data.auditLogs; }
  public get logisticsReceipts() { return this.data.logisticsReceipts; }
  public get inventory() { return this.data.inventory; }
  public get stockMovements() { return this.data.stockMovements; }
  public get shipments() { return this.data.shipments; }
  public get deliveries() { return this.data.deliveries; }
  public get vehicles() { return this.data.vehicles; }
  public get routes() { return this.data.routes; }
  public get condoUnits() { return this.data.condoUnits; }
  public get condoPackages() { return this.data.condoPackages; }
  public get condoVisitors() { return this.data.condoVisitors; }

  public logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const entry: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...log
    };
    this.data.auditLogs.unshift(entry);
    // Keep max 2000 logs
    if (this.data.auditLogs.length > 2000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 2000);
    }
    this.save();
  }
}

export const db = new Database();

// Password hashing helper using native crypto
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, generatedSalt, 64).toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculatedHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(calculatedHash, 'hex'));
}

// Persistent session token mapping to user ID
const SESSIONS_FILE = path.resolve(DATA_DIR, 'sessions.json');

function loadSessions(): Map<string, { userId: string; expiresAt: number }> {
  const map = new Map<string, { userId: string; expiresAt: number }>();
  if (fs.existsSync(SESSIONS_FILE)) {
    try {
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const obj = JSON.parse(raw);
      for (const [k, v] of Object.entries(obj)) {
        map.set(k, v as { userId: string; expiresAt: number });
      }
    } catch (e) {
      // ignore
    }
  }
  return map;
}

function saveSessions(map: Map<string, { userId: string; expiresAt: number }>): void {
  try {
    const obj: Record<string, { userId: string; expiresAt: number }> = {};
    for (const [k, v] of map.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

const sessions = loadSessions();

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  sessions.set(token, { userId, expiresAt });
  saveSessions(sessions);
  return token;
}

export function getSessionUser(token: string): User | null {
  if (!token) return null;
  let session = sessions.get(token);
  if (!session) {
    const diskSessions = loadSessions();
    session = diskSessions.get(token);
    if (session) {
      sessions.set(token, session);
    }
  }
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    saveSessions(sessions);
    return null;
  }
  const user = db.users.find(u => u.id === session.userId && u.active);
  return user || null;
}

export function destroySession(token: string): void {
  sessions.delete(token);
  saveSessions(sessions);
}
