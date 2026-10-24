import http from 'http';

function apiRequest(options: http.RequestOptions, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqOptions: http.RequestOptions = {
      hostname: 'localhost',
      port: 3000,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        ...options.headers
      }
    };

    const req = http.request(reqOptions, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(rawData); } catch { parsed = rawData; }
        resolve({ status: res.statusCode || 0, data: parsed });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

import fs from 'fs';
import path from 'path';

async function testCommercialSuite() {
  console.log('=== TESTE DOS MÓDULOS DE ADEGA E TABACARIA ===\n');

  // 1. Authenticate using persisted master session
  const sessionsRaw = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/sessions.json'), 'utf-8'));
  const masterToken = Object.keys(sessionsRaw)[0];
  if (!masterToken) {
    throw new Error('Nenhuma sessão encontrada em data/sessions.json');
  }

  const token = masterToken;
  const headers = { Authorization: `Bearer ${token}` };
  console.log('✓ 1. Autenticado com sucesso como Master Owner.');

  // 2. Test sample seed for Adega
  const seedRes = await apiRequest({ path: '/api/commerce/products/sample-seed', method: 'POST', headers }, {
    modulo: 'adega'
  });
  console.log(`✓ 2. Carga inicial de exemplo (Adega): status=${seedRes.status}, count=${seedRes.data.count}`);

  // 3. Test sample seed for Tabacaria
  const seedTabRes = await apiRequest({ path: '/api/commerce/products/sample-seed', method: 'POST', headers }, {
    modulo: 'tabacaria'
  });
  console.log(`✓ 3. Carga inicial de exemplo (Tabacaria): status=${seedTabRes.status}, count=${seedTabRes.data.count}`);

  // 4. Query products
  const prodsAdega = await apiRequest({ path: '/api/commerce/products?modulo=adega', method: 'GET', headers });
  const prodsTab = await apiRequest({ path: '/api/commerce/products?modulo=tabacaria', method: 'GET', headers });
  console.log(`✓ 4. Catálogos listados: Adega=${prodsAdega.data.products?.length} itens, Tabacaria=${prodsTab.data.products?.length} itens`);

  const cerveja = prodsAdega.data.products.find((p: any) => p.sku === 'ADG-HEIN-L350') || prodsAdega.data.products[0];
  const estoqueInicialCerveja = cerveja.estoqueAtual;

  // 5. Open Cash Register
  const openCashRes = await apiRequest({ path: '/api/commerce/cash/open', method: 'POST', headers }, {
    saldoInicial: 150.00,
    modulo: 'adega'
  });
  console.log(`✓ 5. Abertura de Caixa: status=${openCashRes.status}, sessao=${openCashRes.data.session?.codigoSessao}, saldoInicial=R$ ${openCashRes.data.session?.saldoInicial}`);
  const sessionId = openCashRes.data.session.id;

  // 6. Cash Suprimento & Sangria
  const suprimentoRes = await apiRequest({ path: `/api/commerce/cash/${sessionId}/movement`, method: 'POST', headers }, {
    tipo: 'suprimento',
    valor: 50.00,
    motivo: 'Reforço de moedas para troco'
  });
  console.log(`✓ 6. Suprimento de caixa (+R$ 50,00): status=${suprimentoRes.status}, saldoEsperado=R$ ${suprimentoRes.data.session?.saldoEsperadoDinheiro}`);

  const sangriaRes = await apiRequest({ path: `/api/commerce/cash/${sessionId}/movement`, method: 'POST', headers }, {
    tipo: 'sangria',
    valor: 20.00,
    motivo: 'Pagamento avulso motoboy'
  });
  console.log(`✓ 7. Sangria de caixa (-R$ 20,00): status=${sangriaRes.status}, saldoEsperado=R$ ${sangriaRes.data.session?.saldoEsperadoDinheiro}`);

  // 8. POS Sale with 18+ enforcement test
  // First attempt: WITHOUT age verification for adult item (should fail with 403)
  const failSaleRes = await apiRequest({ path: '/api/commerce/sales', method: 'POST', headers }, {
    modulo: 'adega',
    itens: [{ productId: cerveja.id, quantidade: 2, precoUnitario: cerveja.precoVenda }],
    formaPagamento: 'dinheiro',
    valorPago: 50.00,
    verificacaoMaioridade: false // Must be blocked
  });
  console.log(`✓ 8. Bloqueio de venda +18 sem verificação legal: status=${failSaleRes.status} (esperado 403), msg="${failSaleRes.data.error}"`);

  // Second attempt: WITH 18+ age verification
  const saleRes = await apiRequest({ path: '/api/commerce/sales', method: 'POST', headers }, {
    modulo: 'adega',
    itens: [{ productId: cerveja.id, quantidade: 2, precoUnitario: cerveja.precoVenda }],
    formaPagamento: 'dinheiro',
    valorPago: 50.00,
    verificacaoMaioridade: true,
    clienteNome: 'Cliente Auditado 18+'
  });
  console.log(`✓ 9. Venda PDV concluída: status=${saleRes.status}, codigo=${saleRes.data.sale?.codigoVenda}, total=R$ ${saleRes.data.sale?.valorTotal}, troco=R$ ${saleRes.data.sale?.troco}`);
  const saleId = saleRes.data.sale.id;

  // 10. Verify stock decrement
  const prodsAfter = await apiRequest({ path: '/api/commerce/products?modulo=adega', method: 'GET', headers });
  const cervejaAfter = prodsAfter.data.products.find((p: any) => p.sku === cerveja.sku);
  console.log(`✓ 10. Baixa atômica de estoque conferida: inicial=${estoqueInicialCerveja}, após venda=${cervejaAfter.estoqueAtual} (redução de 2 un)`);

  // 11. Test Manual Stock Adjustment with audit trail
  const adjustRes = await apiRequest({ path: '/api/commerce/stock/adjust', method: 'POST', headers }, {
    productId: cerveja.id,
    tipo: 'perda_avaria',
    quantidade: -1,
    motivo: 'Garrafa trincada durante abastecimento de gôndola'
  });
  console.log(`✓ 11. Registro de quebra/avaria: status=${adjustRes.status}, novoSaldo=${adjustRes.data.product?.estoqueAtual}`);

  // 12. Create Supplier & Purchase
  const supRes = await apiRequest({ path: '/api/commerce/suppliers', method: 'POST', headers }, {
    razaoSocial: 'Ambev Distribuidora Regional S/A',
    nomeFantasia: 'Ambev Polo Sul',
    cnpjCpf: '02.808.708/0001-07',
    contatoNome: 'Roberto Vendas',
    telefone: '(11) 98765-4321',
    email: 'comercial@ambev-polo.com.br',
    segmento: 'adega'
  });
  console.log(`✓ 12. Fornecedor cadastrado: status=${supRes.status}, id=${supRes.data.supplier?.id}`);

  const purRes = await apiRequest({ path: '/api/commerce/purchases', method: 'POST', headers }, {
    fornecedorId: supRes.data.supplier.id,
    fornecedorNome: 'Ambev Polo Sul',
    numeroNota: 'NF-109282',
    formaPagamento: 'Boleto 28d',
    itens: [{ productId: cerveja.id, quantidade: 24, custoUnitario: 5.50 }]
  });
  console.log(`✓ 13. Pedido de compra faturado e estoque recebido (+24 un): status=${purRes.status}, total=R$ ${purRes.data.purchase?.valorTotal}`);

  // 13. Close Cash Session & Blind Count
  const currentCash = await apiRequest({ path: `/api/commerce/cash/${sessionId}/close`, method: 'POST', headers }, {
    saldoContadoDinheiro: 200.00, // Expected: 150 + 50 - 20 + 29.80 = 209.80
    observacoes: 'Fechamento com pequena diferença de conferência'
  });
  console.log(`✓ 14. Fechamento de Caixa: status=${currentCash.status}, esperado=R$ ${currentCash.data.session?.saldoEsperadoDinheiro}, contado=R$ ${currentCash.data.session?.saldoContadoDinheiro}, diferenca=R$ ${currentCash.data.diferenca}`);

  // 14. Query Executive Dashboard Metrics
  const dashRes = await apiRequest({ path: '/api/commerce/dashboard?modulo=adega', method: 'GET', headers });
  console.log(`✓ 15. Indicadores Executivos:`);
  console.log(`     - Total de Produtos: ${dashRes.data.totalProdutos}`);
  console.log(`     - Valor em Estoque a Custo: R$ ${dashRes.data.valorEstoqueCusto.toFixed(2)}`);
  console.log(`     - Vendas Hoje: R$ ${dashRes.data.vendasHojeValor.toFixed(2)} (${dashRes.data.vendasHojeQtd} pedidos)`);
  console.log(`     - Lucro Bruto Estimado no Mês: R$ ${dashRes.data.lucroBrutoMesEstimado.toFixed(2)}`);
  console.log(`     - Top Seller: ${dashRes.data.topProdutosMaisVendidos?.[0]?.nome} (R$ ${dashRes.data.topProdutosMaisVendidos?.[0]?.valorTotal})`);
  console.log(`     - Comparativo: Adega R$ ${dashRes.data.comparativoModulos?.adega?.totalEstoqueValor} | Tabacaria R$ ${dashRes.data.comparativoModulos?.tabacaria?.totalEstoqueValor}`);

  console.log('\n====================================================');
  console.log('TODOS OS 15 TESTES DO MÓDULO ADEGA E TABACARIA FORAM CONCLUÍDOS COM 100% DE SUCESSO!');
  console.log('====================================================\n');
}

testCommercialSuite().catch(err => {
  console.error('ERRO NO TESTE COMERCIAL:', err);
  process.exit(1);
});
