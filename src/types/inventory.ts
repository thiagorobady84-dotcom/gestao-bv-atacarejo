export type ProductCategory = 
  | 'Cervejas'
  | 'Destilados'
  | 'Refrigerantes'
  | 'Águas'
  | 'Vinhos'
  | 'Energéticos'
  | 'Gelo & Carvão';

export type UnitOfMeasure = 
  | 'Unidade' 
  | 'Fardo c/ 12' 
  | 'Pack c/ 6' 
  | 'Caixa c/ 24'
  | 'Caixa c/ 12'
  | 'Caixa c/ 6'
  | 'Barril 30L'
  | 'Barril 50L'
  | 'Saco 5kg'
  | 'Saco 10kg'
  | 'Saco 2.5kg';

export interface ProductLot {
  id: string;
  productId: string;
  lotNumber: string;
  expiryDate: string; // YYYY-MM-DD
  quantity: number;
  costPrice: number;
  supplier?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string; // EAN-13 / DUN-14
  name: string;
  category: ProductCategory;
  unit: UnitOfMeasure;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  lots: ProductLot[];
  location: {
    corridor: string; // Rua
    shelf: string;    // Prateleira
    pallet: string;   // Palete / Posição
  };
  isReturnable?: boolean;
  returnableTypeId?: string;
  imageUrl?: string;
  updatedAt: string;
}

export type MovementType = 'ENTRADA' | 'SAIDA' | 'PERDA_AVARIA' | 'AJUSTE_INVENTARIO';

export type DamageReason = 
  | 'Quebra no manuseio' 
  | 'Garrafa estourada por pressão' 
  | 'Vazamento ou lacre violado' 
  | 'Avaria no transporte/palete' 
  | 'Produto vencido descartado'
  | 'Outro motivo';

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  lotNumber?: string;
  unitPrice: number;
  totalValue: number;
  reason?: DamageReason | string;
  supplierOrClient?: string;
  responsibleUser: string;
  timestamp: string;
  notes?: string;
}

export interface ReturnableContainer {
  id: string;
  name: string;
  code: string;
  capacity: string; // ex: 600ml, 1000ml, 24 garrafas, 50L
  fullStock: number;   // Vasilhames cheios no estoque
  emptyStock: number;  // Vasilhames vazios no galpão
  depositValue: number; // Valor de caução por unidade em R$
  minEmptyThreshold: number; // Ponto de acúmulo para enviar à cervejaria
  lastBreweryExchange?: string;
  atualizado_em?: string;
}

export interface ReturnableMovement {
  id: string;
  containerId: string;
  containerName: string;
  type: 'RECEBIMENTO_CLIENTE' | 'ENTREGA_CLIENTE' | 'ENVIO_CERVEJARIA' | 'RETORNO_CERVEJARIA' | 'AVARIA_VASILHAME';
  quantityEmpty: number;
  quantityFull: number;
  responsibleUser: string;
  timestamp: string;
  notes?: string;
}

export interface InventoryStats {
  totalCostValue: number;
  totalSaleValue: number;
  expectedProfit: number;
  totalUnits: number;
  totalSkus: number;
  criticalStockCount: number;
  nearExpiryCount15: number;
  nearExpiryCount30: number;
  nearExpiryCount60: number;
  totalDamageUnitsMonth: number;
  totalDamageCostMonth: number;
}
