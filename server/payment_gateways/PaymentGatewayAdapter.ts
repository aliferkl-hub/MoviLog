import { CommercialTerminal, TerminalTransactionStatus } from '../db';

export interface PaymentIntentOptions {
  amount: number;
  paymentType: 'debito' | 'credito' | 'pix';
  installments?: number;
  externalReference: string;
  orderDescription?: string;
  printOnTerminal?: boolean;
}

export interface PaymentIntentResult {
  success: boolean;
  paymentIntentId?: string;
  status: TerminalTransactionStatus;
  nsu?: string;
  authorizationCode?: string;
  cardBrand?: string;
  lastFourDigits?: string;
  feeAmount?: number;
  netAmount?: number;
  message?: string;
  rawResponse?: any;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  terminalStatus?: 'online' | 'offline' | 'desconhecido';
  batteryLevel?: number;
  details?: any;
}

export interface PaymentGatewayAdapter {
  readonly providerName: string;
  readonly supportedModels: string[];

  testConnection(terminal: CommercialTerminal): Promise<ConnectionTestResult>;
  
  createPaymentIntent(
    terminal: CommercialTerminal,
    options: PaymentIntentOptions
  ): Promise<PaymentIntentResult>;

  getPaymentIntentStatus(
    terminal: CommercialTerminal,
    paymentIntentId: string
  ): Promise<PaymentIntentResult>;

  cancelPaymentIntent(
    terminal: CommercialTerminal,
    paymentIntentId: string
  ): Promise<{ success: boolean; message: string }>;
}
