import QRCode from 'qrcode';

/**
 * BACEN EMVCo Standard BR Code / PIX Payload Generator
 * Conforme Manual de Padrões para Iniciação do PIX — Banco Central do Brasil
 */

function formatField(id: string, value: string): string {
  const len = Buffer.byteLength(value, 'utf-8').toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function crc16Ccitt(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

export interface BacenPixParams {
  chave: string;
  nomeBeneficiario: string;
  cidadeBeneficiario: string;
  valor: number;
  txid: string;
  descricao?: string;
}

export function generateBacenPixPayload(params: BacenPixParams): string {
  const chave = params.chave.trim();
  // Strip accents and limit length per BACEN spec
  const nome = params.nomeBeneficiario
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .slice(0, 25);
  const cidade = params.cidadeBeneficiario
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .slice(0, 15);
  const valorStr = params.valor.toFixed(2);
  const txid = (params.txid || '***').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***';

  // 00: Payload Format Indicator = 01
  let payload = formatField('00', '01');

  // 26: Merchant Account Information
  // 00: GUI br.gov.bcb.pix
  // 01: Chave Pix
  // 02: Descrição (opcional)
  let mai = formatField('00', 'br.gov.bcb.pix') + formatField('01', chave);
  if (params.descricao) {
    const desc = params.descricao
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .slice(0, 40);
    mai += formatField('02', desc);
  }
  payload += formatField('26', mai);

  // 52: Merchant Category Code = 0000 (Geral)
  payload += formatField('52', '0000');

  // 53: Transaction Currency = 986 (BRL)
  payload += formatField('53', '986');

  // 54: Transaction Amount
  payload += formatField('54', valorStr);

  // 58: Country Code = BR
  payload += formatField('58', 'BR');

  // 59: Merchant Name
  payload += formatField('59', nome);

  // 60: Merchant City
  payload += formatField('60', cidade);

  // 62: Additional Data Field Template (txid)
  const addData = formatField('05', txid);
  payload += formatField('62', addData);

  // 63: CRC16 Checksum
  const toCrc = payload + '6304';
  const crc = crc16Ccitt(toCrc);
  return toCrc + crc;
}

export async function createPixChargeQrCode(params: BacenPixParams): Promise<{
  copiaECola: string;
  qrCodeDataUrl: string;
}> {
  const copiaECola = generateBacenPixPayload(params);
  const qrCodeDataUrl = await QRCode.toDataURL(copiaECola, {
    width: 320,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'M'
  });

  return { copiaECola, qrCodeDataUrl };
}

export function getPixProviderStatus(): {
  configurado: boolean;
  provedorNome?: string;
  mensagem: string;
} {
  if (process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    return {
      configurado: true,
      provedorNome: 'Mercado Pago Checkout/PIX',
      mensagem: 'Provedor Mercado Pago configurado para conciliação em tempo real.'
    };
  }
  if (process.env.EFI_CLIENT_ID && process.env.EFI_CLIENT_SECRET) {
    return {
      configurado: true,
      provedorNome: 'Efí (Gerencianet) PIX',
      mensagem: 'Provedor Efí configurado para conciliação bancária direta.'
    };
  }
  if (process.env.PIX_API_TOKEN) {
    return {
      configurado: true,
      provedorNome: 'Gateway PIX Custom',
      mensagem: 'Gateway de pagamentos PIX configurado via API Token.'
    };
  }

  return {
    configurado: false,
    mensagem: 'Nenhum provedor de webhook bancário direto configurado no ambiente (ex: MERCADO_PAGO_ACCESS_TOKEN ou EFI_CLIENT_ID). O QR Code e o Copia e Cola utilizam o padrão BR Code regulamentado pelo BACEN com a chave cadastrada da empresa. O operador confere a notificação bancária e confirma com registro auditável.'
  };
}
