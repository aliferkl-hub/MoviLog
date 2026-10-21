export interface User {
  id: string;
  email: string;
  name: string;
  role: 'master_owner' | 'company_admin' | 'dispatcher' | 'driver' | 'operator' | 'concierge' | 'viewer';
  companyId: string | null;
  phone?: string;
}

export interface CompanyLimits {
  maxUsuarios: number;
  maxUnidades: number;
  maxOperacoesMes: number;
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
  limites: CompanyLimits;
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
  limites: CompanyLimits;
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
  ocorrenciaTexto?: string;
}

export interface CondoUnit {
  id: string;
  companyId: string;
  bloco: string;
  andar: string;
  numeroUnidade: string;
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
  codigoPacote: string;
  unitId: string;
  unidadeIdentificacao: string;
  destinatarioNome: string;
  transportadora: string;
  nomeEntregador?: string;
  descricaoConteudo: string;
  codigoRetiradaPin: string;
  codigoRastreio?: string;
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
  documento: string;
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

export interface MasterStats {
  totalCompanies: number;
  demoActive: number;
  demoExpired: number;
  pendingPayments: number;
  activeSubs: number;
  totalVerifiedRevenue: number;
  totalUsers: number;
  totalReceipts: number;
  totalPackages: number;
  totalVisitors: number;
  totalDeliveries?: number;
  totalVehicles?: number;
  totalRoutes?: number;
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
  identificacao: string;
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
  codigoRota: string;
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

export interface TimelineDataPoint {
  date: string;
  label: string;
  current: number;
  previous: number;
}

export interface StatusBreakdownItem {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface DashboardMetrics {
  period: 'day' | 'week' | 'month';
  totalPeriod: number;
  previousPeriodTotal: number;
  percentageChange: number;
  awaitingPickup: number;
  delivered: number;
  pending: number;
  completionRate: number;
  avgPickupTimeFormatted: string;
  avgPickupMinutes: number;
  timelineData: TimelineDataPoint[];
  statusBreakdown: StatusBreakdownItem[];
  operationalPerformance: {
    totalProcessed: number;
    deliveredCount: number;
    completionPercentage: number;
    avgPickupTimeFormatted: string;
    awaitingPickupCount: number;
  };
  activityEvolution: {
    currentTotal: number;
    previousTotal: number;
    growthPercentage: number;
    trend: 'up' | 'down';
    timeline: TimelineDataPoint[];
  };
  totalDatabasePackages: number;
}
