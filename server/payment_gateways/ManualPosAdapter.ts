import { CommercialTerminal } from '../db';
import {
  PaymentGatewayAdapter,
  ConnectionTestResult,
  PaymentIntentOptions,
  PaymentIntentResult
} from './PaymentGatewayAdapter';

/**
 * POS Manual / Autônomo Adapter
 * 
 * Aplicável a maquininhas avulsas sem protocolo de automação comercial aberto
 * (ex: SumUp Top/Solo, PagSeguro Minizinha, maquininhas bancárias independentes).
 * 
 * Não alega integração automática fictícia:
 * - Informa ao operador que a cobrança deve ser digitada manualmente no teclado da maquininha
 * - Exige a confirmação e preenchimento dos dados de conciliação (NSU e Código de Autorização do comprovante impresso).
 */
export class ManualPosAdapter implements PaymentGatewayAdapter {
  readonly providerName = 'POS Manual / Autônomo (Sem Automação)';
  readonly supportedModels = [
    'SumUp Top / Solo',
    'PagSeguro Minizinha',
    'POS Bancário Standalone (Bradesco / Itaú / BB / Santander)',
    'Outras Maquininhas Avulsas'
  ];

  async testConnection(terminal: CommercialTerminal): Promise<ConnectionTestResult> {
    return {
      success: true,
      message: `Terminal autônomo cadastrado para operação manual. Não utiliza comunicação por rede direta.`,
      terminalStatus: 'online',
      details: {
        tipo: 'manual_operador',
        instrucao: 'Cobranças são digitadas no terminal e o operador valida o comprovante no PDV.'
      }
    };
  }

  async createPaymentIntent(
    terminal: CommercialTerminal,
    options: PaymentIntentOptions
  ): Promise<PaymentIntentResult> {
    const rate = options.paymentType === 'debito'
      ? (terminal.taxaDebitoPercentual || 1.90)
      : options.paymentType === 'pix'
        ? (terminal.taxaPixPercentual || 0.90)
        : (terminal.taxaCreditoPercentual || 3.50);

    const fee = Number(((options.amount * rate) / 100).toFixed(2));
    const net = Number((options.amount - fee).toFixed(2));

    return {
      success: true,
      status: 'pendente',
      feeAmount: fee,
      netAmount: net,
      message: `Digite o valor de R$ ${options.amount.toFixed(2)} no teclado da maquininha '${terminal.nome}'. Ao aprovar, informe o NSU e autorização do comprovante no PDV.`
    };
  }

  async getPaymentIntentStatus(
    terminal: CommercialTerminal,
    paymentIntentId: string
  ): Promise<PaymentIntentResult> {
    return {
      success: true,
      status: 'pendente',
      message: 'Aguardando validação manual do comprovante pelo operador no PDV.'
    };
  }

  async cancelPaymentIntent(
    terminal: CommercialTerminal,
    paymentIntentId: string
  ): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Operação manual cancelada pelo operador.'
    };
  }
}
