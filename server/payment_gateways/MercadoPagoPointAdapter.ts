import { CommercialTerminal, TerminalTransactionStatus } from '../db';
import {
  PaymentGatewayAdapter,
  ConnectionTestResult,
  PaymentIntentOptions,
  PaymentIntentResult
} from './PaymentGatewayAdapter';

/**
 * Mercado Pago Point Cloud API Adapter
 * 
 * Documentação Oficial:
 * - Listar dispositivos: GET https://api.mercadopago.com/point/integration-api/v1/devices
 * - Criar intenção: POST https://api.mercadopago.com/point/integration-api/v1/devices/{device_id}/payment-intents
 * - Consultar intenção: GET https://api.mercadopago.com/point/integration-api/v1/payment-intents/{payment_intent_id}
 * - Cancelar intenção: DELETE https://api.mercadopago.com/point/integration-api/v1/devices/{device_id}/payment-intents/{payment_intent_id}
 * 
 * Modelos suportados: Point Smart, Point Pro 2, Point Air, Point Mini NFC
 */
export class MercadoPagoPointAdapter implements PaymentGatewayAdapter {
  readonly providerName = 'Mercado Pago Point (Cloud API)';
  readonly supportedModels = [
    'Point Smart (A910 / P2)',
    'Point Pro 2 (D195)',
    'Point Air',
    'Point Mini NFC (D150)'
  ];

  private readonly baseUrl = 'https://api.mercadopago.com/point/integration-api/v1';

  async testConnection(terminal: CommercialTerminal): Promise<ConnectionTestResult> {
    const token = terminal.credenciais?.mpAccessToken?.trim();
    const deviceId = terminal.identificadorProvedor?.trim();

    if (!token) {
      return {
        success: false,
        message: 'Credencial Mercado Pago ausente. Informe o Access Token (Produção ou Testes).',
        terminalStatus: 'offline'
      };
    }

    if (!deviceId) {
      return {
        success: false,
        message: 'Identificador do dispositivo (Device ID) não configurado.',
        terminalStatus: 'offline'
      };
    }

    // Se o token for um token de simulação / sandbox de demonstração local
    if (token.startsWith('TEST_DEMO_') || deviceId.startsWith('DEMO_')) {
      return {
        success: true,
        message: `Dispositivo de demonstração ${deviceId} conectado com sucesso (Modo Homologação/Sandbox MoviLog).`,
        terminalStatus: 'online',
        batteryLevel: 94,
        details: {
          deviceId,
          modo: 'simulado_sandbox',
          operadora: 'Wi-Fi / 4G Ativo',
          versaoFirmware: 'v3.18.2-MP-DEMO'
        }
      };
    }

    try {
      // Real API Call para Mercado Pago Point Devices API
      const response = await fetch(`${this.baseUrl}/devices/${encodeURIComponent(deviceId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          message: 'Access Token do Mercado Pago inválido ou sem permissão para a Point Integration API.',
          terminalStatus: 'offline',
          details: { httpStatus: response.status }
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          message: `Dispositivo '${deviceId}' não encontrado na conta Mercado Pago informada. Verifique o número serial/Device ID na tela da Point.`,
          terminalStatus: 'offline',
          details: { httpStatus: response.status }
        };
      }

      if (response.ok) {
        const data = await response.json();
        const posStatus = data.operating_mode === 'PDV' || data.status === 'open' ? 'online' : 'online';
        return {
          success: true,
          message: `Terminal Mercado Pago ${deviceId} conectado com sucesso e operacional.`,
          terminalStatus: posStatus,
          batteryLevel: data.battery_percentage || 85,
          details: data
        };
      }

      // Se a chamada falhar por outro status (ex: 500 ou rate-limit)
      const errText = await response.text();
      return {
        success: false,
        message: `Mercado Pago retornou status ${response.status}: ${errText.slice(0, 150)}`,
        terminalStatus: 'offline'
      };
    } catch (err: any) {
      // Fallback gracioso com diagnóstico claro de rede
      return {
        success: false,
        message: `Não foi possível conectar ao servidor Mercado Pago: ${err.message || 'Falha de rede'}. Verifique o acesso à internet.`,
        terminalStatus: 'offline',
        details: { error: err.message }
      };
    }
  }

  async createPaymentIntent(
    terminal: CommercialTerminal,
    options: PaymentIntentOptions
  ): Promise<PaymentIntentResult> {
    const token = terminal.credenciais?.mpAccessToken?.trim();
    const deviceId = terminal.identificadorProvedor?.trim();

    if (!token || !deviceId) {
      return {
        success: false,
        status: 'falha_comunicacao',
        message: 'Terminal não possui Access Token ou Device ID configurado.'
      };
    }

    // Modo simulação para testes e homologação guiada
    if (token.startsWith('TEST_DEMO_') || deviceId.startsWith('DEMO_') || process.env.NODE_ENV === 'test') {
      const mockIntentId = `mp_intent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const mockNsu = Math.floor(100000 + Math.random() * 900000).toString();
      const mockAuth = Math.floor(100000 + Math.random() * 900000).toString();
      const cardBrands = ['Mastercard', 'Visa', 'Elo'];
      const brand = cardBrands[Math.floor(Math.random() * cardBrands.length)];
      
      const rate = options.paymentType === 'debito' 
        ? (terminal.taxaDebitoPercentual || 1.99)
        : options.paymentType === 'pix'
          ? (terminal.taxaPixPercentual || 0.99)
          : (terminal.taxaCreditoPercentual || 3.99);

      const fee = Number(((options.amount * rate) / 100).toFixed(2));
      const net = Number((options.amount - fee).toFixed(2));

      return {
        success: true,
        paymentIntentId: mockIntentId,
        status: 'aprovado',
        nsu: mockNsu,
        authorizationCode: mockAuth,
        cardBrand: brand,
        lastFourDigits: '4242',
        feeAmount: fee,
        netAmount: net,
        message: `Pagamento de R$ ${options.amount.toFixed(2)} aprovado no terminal ${deviceId}.`,
        rawResponse: {
          mode: 'sandbox_simulation',
          deviceId,
          external_reference: options.externalReference,
          amount: options.amount
        }
      };
    }

    try {
      // Amount em centavos para a Point Integration API
      const amountInCents = Math.round(options.amount * 100);

      const payload = {
        amount: amountInCents,
        description: options.orderDescription || `Venda MoviLog Ref #${options.externalReference}`,
        additional_info: {
          external_reference: options.externalReference,
          print_on_terminal: options.printOnTerminal !== false
        }
      };

      const response = await fetch(`${this.baseUrl}/devices/${encodeURIComponent(deviceId)}/payment-intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        return {
          success: false,
          status: 'falha_comunicacao',
          message: errorData.message || `Erro Mercado Pago ${response.status}`,
          rawResponse: errorData
        };
      }

      const data = await response.json();
      const intentStatus = this.mapMpStatusToTerminalStatus(data.status);

      return {
        success: true,
        paymentIntentId: data.id,
        status: intentStatus,
        message: 'Cobrança enviada para o terminal Mercado Pago com sucesso. Aguardando aprovação pelo cliente.',
        rawResponse: data
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'falha_comunicacao',
        message: `Erro ao enviar cobrança para o terminal: ${err.message}`
      };
    }
  }

  async getPaymentIntentStatus(
    terminal: CommercialTerminal,
    paymentIntentId: string
  ): Promise<PaymentIntentResult> {
    const token = terminal.credenciais?.mpAccessToken?.trim();

    if (!token) {
      return {
        success: false,
        status: 'falha_comunicacao',
        message: 'Access Token não configurado.'
      };
    }

    // Modo simulação para testes
    if (token.startsWith('TEST_DEMO_') || paymentIntentId.startsWith('mp_intent_')) {
      const mockNsu = Math.floor(100000 + Math.random() * 900000).toString();
      const mockAuth = Math.floor(100000 + Math.random() * 900000).toString();
      return {
        success: true,
        paymentIntentId,
        status: 'aprovado',
        nsu: mockNsu,
        authorizationCode: mockAuth,
        cardBrand: 'Mastercard',
        lastFourDigits: '4242',
        message: 'Transação confirmada na maquininha.'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/payment-intents/${encodeURIComponent(paymentIntentId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return {
          success: false,
          status: 'falha_comunicacao',
          message: `Erro na consulta Mercado Pago: ${response.statusText}`
        };
      }

      const data = await response.json();
      const status = this.mapMpStatusToTerminalStatus(data.status);
      const paymentInfo = data.payment || {};

      return {
        success: true,
        paymentIntentId: data.id,
        status,
        nsu: paymentInfo.id ? String(paymentInfo.id) : undefined,
        authorizationCode: paymentInfo.authorization_code,
        cardBrand: paymentInfo.payment_method_id,
        lastFourDigits: paymentInfo.card?.last_four_digits,
        message: data.status === 'PROCESSED' ? 'Pagamento aprovado na maquininha.' : `Status atual: ${data.status}`,
        rawResponse: data
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'falha_comunicacao',
        message: `Falha ao consultar status: ${err.message}`
      };
    }
  }

  async cancelPaymentIntent(
    terminal: CommercialTerminal,
    paymentIntentId: string
  ): Promise<{ success: boolean; message: string }> {
    const token = terminal.credenciais?.mpAccessToken?.trim();
    const deviceId = terminal.identificadorProvedor?.trim();

    if (!token || !deviceId) {
      return { success: false, message: 'Dados do terminal incompletos.' };
    }

    if (token.startsWith('TEST_DEMO_') || paymentIntentId.startsWith('mp_intent_')) {
      return { success: true, message: 'Cobrança no terminal cancelada com sucesso.' };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/devices/${encodeURIComponent(deviceId)}/payment-intents/${encodeURIComponent(paymentIntentId)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok || response.status === 204) {
        return { success: true, message: 'Operação cancelada na maquininha.' };
      }

      const err = await response.text();
      return { success: false, message: `Não foi possível cancelar: ${err.slice(0, 100)}` };
    } catch (err: any) {
      return { success: false, message: `Erro ao cancelar: ${err.message}` };
    }
  }

  private mapMpStatusToTerminalStatus(mpStatus: string): TerminalTransactionStatus {
    switch (mpStatus?.toUpperCase()) {
      case 'OPEN':
      case 'WAITING':
        return 'pendente';
      case 'PROCESSING':
      case 'ON_TERMINAL':
        return 'processando';
      case 'PROCESSED':
      case 'APPROVED':
        return 'aprovado';
      case 'REJECTED':
      case 'FAILED':
        return 'recusado';
      case 'CANCELED':
      case 'CANCELLED':
        return 'cancelado';
      case 'REFUNDED':
        return 'estornado';
      default:
        return 'pendente';
    }
  }
}
