import { Product, Movement, ReturnableContainer } from '../types/inventory';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    sku: 'CERV-AMB-600',
    barcode: '7891991000826',
    name: 'Cerveja Brahma Chopp Garrafa 600ml (Retornável)',
    category: 'Cervejas',
    unit: 'Caixa c/ 24',
    costPrice: 118.00,
    salePrice: 165.00,
    currentStock: 140, // 140 caixas
    minStock: 40,
    maxStock: 300,
    isReturnable: true,
    returnableTypeId: 'ret-600ml',
    location: { corridor: 'Rua A', shelf: 'P-01', pallet: 'PAL-04' },
    lots: [
      {
        id: 'lot-001-a',
        productId: 'prod-001',
        lotNumber: 'L-24101A',
        expiryDate: '2026-11-02', // Vence em ~15 dias
        quantity: 35,
        costPrice: 118.00,
        supplier: 'Ambev Fabril CDD',
        createdAt: '2026-08-10'
      },
      {
        id: 'lot-001-b',
        productId: 'prod-001',
        lotNumber: 'L-24115B',
        expiryDate: '2026-12-18', // Vence em ~60 dias
        quantity: 105,
        costPrice: 118.00,
        supplier: 'Ambev Fabril CDD',
        createdAt: '2026-09-15'
      }
    ],
    updatedAt: '2026-10-18T14:30:00Z'
  },
  {
    id: 'prod-002',
    sku: 'CERV-HEIN-350',
    barcode: '7896045506049',
    name: 'Cerveja Heineken Puro Malte Sleek Lata 350ml',
    category: 'Cervejas',
    unit: 'Pack c/ 6',
    costPrice: 28.50,
    salePrice: 38.90,
    currentStock: 12, // Estoque crítico! (min: 30)
    minStock: 30,
    maxStock: 250,
    location: { corridor: 'Rua A', shelf: 'P-02', pallet: 'PAL-08' },
    lots: [
      {
        id: 'lot-002-a',
        productId: 'prod-002',
        lotNumber: 'HNK-9921',
        expiryDate: '2026-11-12', // Vence em ~25 dias (alerta 30 dias)
        quantity: 12,
        costPrice: 28.50,
        supplier: 'Distribuidora Heineken Brasil',
        createdAt: '2026-07-20'
      }
    ],
    updatedAt: '2026-10-18T10:15:00Z'
  },
  {
    id: 'prod-003',
    sku: 'CERV-SPAT-LIT',
    barcode: '7891991015639',
    name: 'Cerveja Spaten Munich Helles Litrão 1000ml (Retornável)',
    category: 'Cervejas',
    unit: 'Caixa c/ 12',
    costPrice: 78.00,
    salePrice: 112.00,
    currentStock: 85,
    minStock: 25,
    maxStock: 200,
    isReturnable: true,
    returnableTypeId: 'ret-litrao',
    location: { corridor: 'Rua A', shelf: 'P-03', pallet: 'PAL-11' },
    lots: [
      {
        id: 'lot-003-a',
        productId: 'prod-003',
        lotNumber: 'SPT-8812',
        expiryDate: '2027-02-28',
        quantity: 85,
        costPrice: 78.00,
        supplier: 'Ambev Regional',
        createdAt: '2026-09-01'
      }
    ],
    updatedAt: '2026-10-17T18:00:00Z'
  },
  {
    id: 'prod-004',
    sku: 'DEST-RED-1L',
    barcode: '5000267014005',
    name: 'Whisky Johnnie Walker Red Label 1000ml',
    category: 'Destilados',
    unit: 'Caixa c/ 12',
    costPrice: 780.00,
    salePrice: 1068.00,
    currentStock: 18,
    minStock: 10,
    maxStock: 60,
    location: { corridor: 'Rua B (Gaiola)', shelf: 'P-01', pallet: 'PAL-SEG01' },
    lots: [
      {
        id: 'lot-004-a',
        productId: 'prod-004',
        lotNumber: 'JW-RED-009',
        expiryDate: '2030-12-31',
        quantity: 18,
        costPrice: 780.00,
        supplier: 'Diageo Brasil',
        createdAt: '2026-06-15'
      }
    ],
    updatedAt: '2026-10-16T11:20:00Z'
  },
  {
    id: 'prod-005',
    sku: 'DEST-GIN-TANQ',
    barcode: '5000281015309',
    name: 'Gin Tanqueray London Dry 750ml',
    category: 'Destilados',
    unit: 'Caixa c/ 12',
    costPrice: 840.00,
    salePrice: 1248.00,
    currentStock: 8, // Estoque Crítico!
    minStock: 12,
    maxStock: 50,
    location: { corridor: 'Rua B (Gaiola)', shelf: 'P-02', pallet: 'PAL-SEG02' },
    lots: [
      {
        id: 'lot-005-a',
        productId: 'prod-005',
        lotNumber: 'TNQ-552',
        expiryDate: '2030-12-31',
        quantity: 8,
        costPrice: 840.00,
        supplier: 'Diageo Brasil',
        createdAt: '2026-08-01'
      }
    ],
    updatedAt: '2026-10-18T09:00:00Z'
  },
  {
    id: 'prod-006',
    sku: 'REFR-COCA-2L',
    barcode: '7894900010015',
    name: 'Refrigerante Coca-Cola Original Pet 2 Litros',
    category: 'Refrigerantes',
    unit: 'Fardo c/ 12',
    costPrice: 82.00,
    salePrice: 114.00,
    currentStock: 220,
    minStock: 50,
    maxStock: 450,
    location: { corridor: 'Rua C', shelf: 'P-01', pallet: 'PAL-15' },
    lots: [
      {
        id: 'lot-006-a',
        productId: 'prod-006',
        lotNumber: 'CC-9901',
        expiryDate: '2026-11-05', // Vence em ~18 dias
        quantity: 40,
        costPrice: 82.00,
        supplier: 'FEMSA Coca-Cola',
        createdAt: '2026-07-10'
      },
      {
        id: 'lot-006-b',
        productId: 'prod-006',
        lotNumber: 'CC-9944',
        expiryDate: '2027-01-15',
        quantity: 180,
        costPrice: 82.00,
        supplier: 'FEMSA Coca-Cola',
        createdAt: '2026-09-20'
      }
    ],
    updatedAt: '2026-10-18T13:45:00Z'
  },
  {
    id: 'prod-007',
    sku: 'REFR-GUAR-2L',
    barcode: '7891991001342',
    name: 'Refrigerante Guaraná Antarctica Pet 2 Litros',
    category: 'Refrigerantes',
    unit: 'Fardo c/ 12',
    costPrice: 66.00,
    salePrice: 95.00,
    currentStock: 160,
    minStock: 40,
    maxStock: 350,
    location: { corridor: 'Rua C', shelf: 'P-02', pallet: 'PAL-18' },
    lots: [
      {
        id: 'lot-007-a',
        productId: 'prod-007',
        lotNumber: 'GUA-4402',
        expiryDate: '2027-01-20',
        quantity: 160,
        costPrice: 66.00,
        supplier: 'Ambev Não-Alcoólicos',
        createdAt: '2026-09-10'
      }
    ],
    updatedAt: '2026-10-15T16:00:00Z'
  },
  {
    id: 'prod-008',
    sku: 'ENERG-RDB-250',
    barcode: '9002490100070',
    name: 'Energético Red Bull Energy Drink Lata 250ml',
    category: 'Energéticos',
    unit: 'Caixa c/ 24',
    costPrice: 154.00,
    salePrice: 216.00,
    currentStock: 45,
    minStock: 20,
    maxStock: 150,
    location: { corridor: 'Rua D', shelf: 'P-01', pallet: 'PAL-22' },
    lots: [
      {
        id: 'lot-008-a',
        productId: 'prod-008',
        lotNumber: 'RB-2026-A',
        expiryDate: '2027-05-30',
        quantity: 45,
        costPrice: 154.00,
        supplier: 'Red Bull Brasil',
        createdAt: '2026-08-25'
      }
    ],
    updatedAt: '2026-10-18T11:00:00Z'
  },
  {
    id: 'prod-009',
    sku: 'ENERG-MNST-473',
    barcode: '70847012475',
    name: 'Energético Monster Energy Green Lata 473ml',
    category: 'Energéticos',
    unit: 'Pack c/ 6',
    costPrice: 42.00,
    salePrice: 59.90,
    currentStock: 7, // Crítico!
    minStock: 15,
    maxStock: 80,
    location: { corridor: 'Rua D', shelf: 'P-02', pallet: 'PAL-23' },
    lots: [
      {
        id: 'lot-009-a',
        productId: 'prod-009',
        lotNumber: 'MNST-003',
        expiryDate: '2026-11-28', // Alerta 40 dias
        quantity: 7,
        costPrice: 42.00,
        supplier: 'Monster Beverage',
        createdAt: '2026-07-15'
      }
    ],
    updatedAt: '2026-10-17T08:20:00Z'
  },
  {
    id: 'prod-010',
    sku: 'AGUA-MIN-SEM500',
    barcode: '7896052600013',
    name: 'Água Mineral Crystal Sem Gás Pet 500ml',
    category: 'Águas',
    unit: 'Fardo c/ 12',
    costPrice: 14.50,
    salePrice: 24.00,
    currentStock: 310,
    minStock: 60,
    maxStock: 600,
    location: { corridor: 'Rua E', shelf: 'P-01', pallet: 'PAL-30' },
    lots: [
      {
        id: 'lot-010-a',
        productId: 'prod-010',
        lotNumber: 'AG-8832',
        expiryDate: '2027-08-15',
        quantity: 310,
        costPrice: 14.50,
        supplier: 'Fonte Cristalina',
        createdAt: '2026-09-01'
      }
    ],
    updatedAt: '2026-10-18T15:00:00Z'
  },
  {
    id: 'prod-011',
    sku: 'VINHO-CASIL-750',
    barcode: '7804320087114',
    name: 'Vinho Tinto Chileno Casillero del Diablo Cabernet 750ml',
    category: 'Vinhos',
    unit: 'Caixa c/ 6',
    costPrice: 240.00,
    salePrice: 354.00,
    currentStock: 22,
    minStock: 10,
    maxStock: 80,
    location: { corridor: 'Rua B', shelf: 'P-04', pallet: 'PAL-SEG05' },
    lots: [
      {
        id: 'lot-011-a',
        productId: 'prod-011',
        lotNumber: 'V-CS-2024',
        expiryDate: '2029-12-31',
        quantity: 22,
        costPrice: 240.00,
        supplier: 'Concha y Toro Brasil',
        createdAt: '2026-06-10'
      }
    ],
    updatedAt: '2026-10-14T10:00:00Z'
  },
  {
    id: 'prod-012',
    sku: 'GELO-CUB-5KG',
    barcode: '7898912345678',
    name: 'Gelo Filtrado em Cubos Pacote 5kg',
    category: 'Gelo & Carvão',
    unit: 'Saco 5kg',
    costPrice: 4.80,
    salePrice: 10.00,
    currentStock: 85,
    minStock: 30,
    maxStock: 250,
    location: { corridor: 'Câmara Fria 01', shelf: 'Piso', pallet: 'PAL-FRIO1' },
    lots: [
      {
        id: 'lot-012-a',
        productId: 'prod-012',
        lotNumber: 'GL-1810',
        expiryDate: '2027-04-18',
        quantity: 85,
        costPrice: 4.80,
        supplier: 'Gelo Polar Norte',
        createdAt: '2026-10-18'
      }
    ],
    updatedAt: '2026-10-18T16:00:00Z'
  },
  {
    id: 'prod-013',
    sku: 'CARV-VEG-25KG',
    barcode: '7898923456789',
    name: 'Carvão Vegetal Especial Para Churrasco 2.5kg',
    category: 'Gelo & Carvão',
    unit: 'Saco 2.5kg' as any,
    costPrice: 8.50,
    salePrice: 16.90,
    currentStock: 65,
    minStock: 20,
    maxStock: 200,
    location: { corridor: 'Pátio Externo', shelf: 'Piso A', pallet: 'PAL-EXT01' },
    lots: [
      {
        id: 'lot-013-a',
        productId: 'prod-013',
        lotNumber: 'CRV-0926',
        expiryDate: '2031-12-31',
        quantity: 65,
        costPrice: 8.50,
        supplier: 'Carvão Brasa Nobre',
        createdAt: '2026-09-05'
      }
    ],
    updatedAt: '2026-10-12T14:00:00Z'
  }
];

export const INITIAL_RETURNABLES: ReturnableContainer[] = [
  {
    id: 'ret-600ml',
    name: 'Garrafa 600ml Padrão Cervejaria (Caixa c/ 24)',
    code: 'VAS-600ML',
    capacity: '600ml (Cx 24 garrafas)',
    fullStock: 140, // 140 caixas cheias
    emptyStock: 74, // 74 caixas de garrafas vazias no pátio
    depositValue: 35.00, // Caução da caixa + garrafas
    minEmptyThreshold: 60, // Limite para chamar carreta da Ambev/Heineken
    lastBreweryExchange: '2026-10-10'
  },
  {
    id: 'ret-litrao',
    name: 'Garrafa Litrão 1000ml Padrão Ambev (Caixa c/ 12)',
    code: 'VAS-LITRAO',
    capacity: '1000ml (Cx 12 garrafas)',
    fullStock: 85,
    emptyStock: 48,
    depositValue: 28.00,
    minEmptyThreshold: 50,
    lastBreweryExchange: '2026-10-12'
  },
  {
    id: 'ret-barril50',
    name: 'Barril Inox de Chopp 50 Litros',
    code: 'VAS-BAR50L',
    capacity: '50 Litros',
    fullStock: 22,
    emptyStock: 14,
    depositValue: 350.00,
    minEmptyThreshold: 15,
    lastBreweryExchange: '2026-10-05'
  },
  {
    id: 'ret-caixa-plastica',
    name: 'Engradado Plástico Vazio para Vasilhames',
    code: 'VAS-ENG24',
    capacity: '24 Cavidades',
    fullStock: 225,
    emptyStock: 95,
    depositValue: 18.00,
    minEmptyThreshold: 80,
    lastBreweryExchange: '2026-10-14'
  }
];

export const INITIAL_MOVEMENTS: Movement[] = [
  {
    id: 'mov-101',
    productId: 'prod-001',
    productName: 'Cerveja Brahma Chopp Garrafa 600ml (Retornável)',
    barcode: '7891991000826',
    type: 'ENTRADA',
    quantity: 60,
    previousStock: 80,
    newStock: 140,
    lotNumber: 'L-24115B',
    unitPrice: 118.00,
    totalValue: 7080.00,
    supplierOrClient: 'Ambev Fabril CDD Jundiaí (NF 45892)',
    responsibleUser: 'Carlos Silveira (Conferente)',
    timestamp: '2026-10-18T14:30:00Z',
    notes: 'Recebimento de carga de reposição com laudo de qualidade aprovado.'
  },
  {
    id: 'mov-102',
    productId: 'prod-002',
    productName: 'Cerveja Heineken Puro Malte Sleek Lata 350ml',
    barcode: '7896045506049',
    type: 'SAIDA',
    quantity: 18,
    previousStock: 30,
    newStock: 12,
    lotNumber: 'HNK-9921',
    unitPrice: 38.90,
    totalValue: 700.20,
    supplierOrClient: 'Bar e Restaurante Estrela Dourada (Ped #1894)',
    responsibleUser: 'Marcos Almeida (Expedição)',
    timestamp: '2026-10-18T10:15:00Z',
    notes: 'Saída expedida para rota de entregas zona norte.'
  },
  {
    id: 'mov-103',
    productId: 'prod-001',
    productName: 'Cerveja Brahma Chopp Garrafa 600ml (Retornável)',
    barcode: '7891991000826',
    type: 'PERDA_AVARIA',
    quantity: 2,
    previousStock: 142,
    newStock: 140,
    lotNumber: 'L-24101A',
    unitPrice: 118.00,
    totalValue: 236.00,
    reason: 'Garrafa estourada por pressão',
    supplierOrClient: 'Setor de Armazenamento - Palete 04',
    responsibleUser: 'Lucas Mendes (Operador Empilhadeira)',
    timestamp: '2026-10-18T08:45:00Z',
    notes: 'Dois engradados sofreram impacto na movimentação interna e estouraram garrafas.'
  },
  {
    id: 'mov-104',
    productId: 'prod-006',
    productName: 'Refrigerante Coca-Cola Original Pet 2 Litros',
    barcode: '7894900010015',
    type: 'SAIDA',
    quantity: 50,
    previousStock: 270,
    newStock: 220,
    lotNumber: 'CC-9944',
    unitPrice: 114.00,
    totalValue: 5700.00,
    supplierOrClient: 'Rede Mercadinho São José (Ped #1892)',
    responsibleUser: 'Marcos Almeida (Expedição)',
    timestamp: '2026-10-17T17:10:00Z',
    notes: 'Carregamento de caminhão de distribuição.'
  },
  {
    id: 'mov-105',
    productId: 'prod-009',
    productName: 'Energético Monster Energy Green Lata 473ml',
    barcode: '70847012475',
    type: 'PERDA_AVARIA',
    quantity: 1,
    previousStock: 8,
    newStock: 7,
    lotNumber: 'MNST-003',
    unitPrice: 42.00,
    totalValue: 42.00,
    reason: 'Vazamento ou lacre violado',
    supplierOrClient: 'Conferência de Prateleira D-02',
    responsibleUser: 'Carlos Silveira (Conferente)',
    timestamp: '2026-10-17T08:20:00Z',
    notes: 'Lata furada no fardo lacrado, descartada de acordo com o protocolo sanitário.'
  }
];
