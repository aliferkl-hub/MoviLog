import { CommercialTerminal, TerminalProvider } from '../db';
import { PaymentGatewayAdapter } from './PaymentGatewayAdapter';
import { MercadoPagoPointAdapter } from './MercadoPagoPointAdapter';
import { StoneConnectAdapter } from './StoneConnectAdapter';
import { SmartPosTefAdapter } from './SmartPosTefAdapter';
import { ManualPosAdapter } from './ManualPosAdapter';

export class GatewayFactory {
  private static mpAdapter = new MercadoPagoPointAdapter();
  private static stoneAdapter = new StoneConnectAdapter();
  private static tefAdapter = new SmartPosTefAdapter();
  private static manualAdapter = new ManualPosAdapter();

  static getAdapter(provider: TerminalProvider): PaymentGatewayAdapter {
    switch (provider) {
      case 'mercadopago_point':
        return this.mpAdapter;
      case 'stone_connect':
      case 'pagar_me':
        return this.stoneAdapter;
      case 'smartpos_tef':
        return this.tefAdapter;
      case 'pos_manual':
      default:
        return this.manualAdapter;
    }
  }

  /**
   * Sanitiza o terminal para respostas do frontend, garantindo que
   * segredos como tokens, chaves privadas e senhas NUNCA sejam enviados ao cliente.
   */
  static sanitizeTerminal(terminal: CommercialTerminal): CommercialTerminal {
    const copy: any = { ...terminal };
    const creds = terminal.credenciais;

    let hasCredentials = false;
    let maskedToken: string | undefined;

    if (creds?.mpAccessToken) {
      hasCredentials = true;
      const t = creds.mpAccessToken.trim();
      maskedToken = t.length > 8 
        ? `${t.substring(0, 4)}***${t.substring(t.length - 4)}` 
        : '***';
    } else if (creds?.stonePartnerKey) {
      hasCredentials = true;
      const k = creds.stonePartnerKey.trim();
      maskedToken = k.length > 8
        ? `${k.substring(0, 4)}***${k.substring(k.length - 4)}`
        : '***';
    } else if (creds?.tefApiKey || creds?.tefHost) {
      hasCredentials = true;
      maskedToken = creds.tefHost ? `Host: ${creds.tefHost}:${creds.tefPort || 60906}` : '***';
    }

    copy.hasCredentials = hasCredentials;
    copy.maskedToken = maskedToken;
    delete copy.credenciais; // remove segredos brutos

    return copy;
  }
}
