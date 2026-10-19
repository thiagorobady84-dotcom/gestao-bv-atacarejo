import { Product, Movement, ReturnableContainer, InventoryStats, MovementType, DamageReason, ProductLot } from '../types/inventory';
import { INITIAL_PRODUCTS, INITIAL_RETURNABLES, INITIAL_MOVEMENTS } from '../data/mockData';

const STORAGE_KEYS = {
  PRODUCTS: 'deposito_flow_products_v1',
  RETURNABLES: 'deposito_flow_returnables_v1',
  MOVEMENTS: 'deposito_flow_movements_v1',
};

export const getDaysDifference = (targetDateStr: string): number => {
  const target = new Date(targetDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const loadProducts = (): Product[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading products from storage:', e);
    return INITIAL_PRODUCTS;
  }
};

export const saveProducts = (products: Product[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products:', e);
  }
};

export const loadReturnables = (): ReturnableContainer[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RETURNABLES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.RETURNABLES, JSON.stringify(INITIAL_RETURNABLES));
      return INITIAL_RETURNABLES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading returnables:', e);
    return INITIAL_RETURNABLES;
  }
};

export const saveReturnables = (returnables: ReturnableContainer[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.RETURNABLES, JSON.stringify(returnables));
  } catch (e) {
    console.error('Error saving returnables:', e);
  }
};

export const loadMovements = (): Movement[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
      return INITIAL_MOVEMENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading movements:', e);
    return INITIAL_MOVEMENTS;
  }
};

export const saveMovements = (movements: Movement[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  } catch (e) {
    console.error('Error saving movements:', e);
  }
};

export interface ProcessMovementParams {
  productId: string;
  type: MovementType;
  quantity: number;
  lotNumber?: string;
  expiryDate?: string;
  costPrice?: number;
  salePrice?: number;
  reason?: DamageReason | string;
  supplierOrClient?: string;
  responsibleUser: string;
  notes?: string;
}

export const processStockMovement = (params: ProcessMovementParams): { success: boolean; movement?: Movement; error?: string } => {
  const products = loadProducts();
  const index = products.findIndex(p => p.id === params.productId);
  if (index === -1) {
    return { success: false, error: 'Produto não encontrado no sistema.' };
  }

  const product = products[index];
  const prevStock = product.currentStock;
  let newStock = prevStock;

  if (params.type === 'ENTRADA') {
    newStock = prevStock + params.quantity;
    
    // Atualizar ou adicionar lote
    if (params.lotNumber && params.expiryDate) {
      const existingLot = product.lots.find(l => l.lotNumber === params.lotNumber);
      if (existingLot) {
        existingLot.quantity += params.quantity;
        if (params.costPrice) existingLot.costPrice = params.costPrice;
      } else {
        const newLot: ProductLot = {
          id: `lot-${Date.now()}`,
          productId: product.id,
          lotNumber: params.lotNumber,
          expiryDate: params.expiryDate,
          quantity: params.quantity,
          costPrice: params.costPrice || product.costPrice,
          supplier: params.supplierOrClient,
          createdAt: new Date().toISOString()
        };
        product.lots.push(newLot);
      }
    }
    if (params.costPrice) product.costPrice = params.costPrice;
    if (params.salePrice) product.salePrice = params.salePrice;

    // Se for vasilhame retornável, incrementa vasilhame cheio
    if (product.isReturnable && product.returnableTypeId) {
      updateReturnableStock(product.returnableTypeId, params.quantity, 0);
    }

  } else if (params.type === 'SAIDA') {
    if (prevStock < params.quantity) {
      return { success: false, error: `Saldo insuficiente! Estoque atual: ${prevStock} ${product.unit}. Solicitado: ${params.quantity}.` };
    }
    newStock = prevStock - params.quantity;

    // Consumo do lote mais antigo (FIFO)
    let remainingToDeduct = params.quantity;
    // Ordenar lotes por validade mais próxima
    product.lots.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    for (const lot of product.lots) {
      if (remainingToDeduct <= 0) break;
      if (lot.quantity > 0) {
        const deduct = Math.min(lot.quantity, remainingToDeduct);
        lot.quantity -= deduct;
        remainingToDeduct -= deduct;
      }
    }

    // Se for vasilhame retornável, diminui cheio
    if (product.isReturnable && product.returnableTypeId) {
      updateReturnableStock(product.returnableTypeId, -params.quantity, 0);
    }

  } else if (params.type === 'PERDA_AVARIA') {
    if (prevStock < params.quantity) {
      return { success: false, error: `Quantidade de avaria (${params.quantity}) maior que o saldo em estoque (${prevStock}).` };
    }
    newStock = prevStock - params.quantity;

    // Abate de lote
    if (params.lotNumber) {
      const lot = product.lots.find(l => l.lotNumber === params.lotNumber);
      if (lot) lot.quantity = Math.max(0, lot.quantity - params.quantity);
    } else if (product.lots.length > 0) {
      product.lots[0].quantity = Math.max(0, product.lots[0].quantity - params.quantity);
    }

    // Se for garrafa de vidro quebrada, o vasilhame não volta
  } else if (params.type === 'AJUSTE_INVENTARIO') {
    newStock = params.quantity; // No ajuste, define o valor exato contado
  }

  product.currentStock = newStock;
  product.updatedAt = new Date().toISOString();
  products[index] = product;
  saveProducts(products);

  // Criar registro no log de movimentações
  const unitPrice = params.type === 'SAIDA' ? product.salePrice : product.costPrice;
  const movement: Movement = {
    id: `mov-${Date.now()}`,
    productId: product.id,
    productName: product.name,
    barcode: product.barcode,
    type: params.type,
    quantity: params.quantity,
    previousStock: prevStock,
    newStock: newStock,
    lotNumber: params.lotNumber,
    unitPrice: unitPrice,
    totalValue: params.quantity * unitPrice,
    reason: params.reason,
    supplierOrClient: params.supplierOrClient,
    responsibleUser: params.responsibleUser || 'Operador Logístico',
    timestamp: new Date().toISOString(),
    notes: params.notes
  };

  const movements = loadMovements();
  movements.unshift(movement);
  saveMovements(movements);

  return { success: true, movement };
};

export const updateReturnableStock = (returnableId: string, deltaFull: number, deltaEmpty: number) => {
  const returnables = loadReturnables();
  const item = returnables.find(r => r.id === returnableId);
  if (!item) return;

  item.fullStock = Math.max(0, item.fullStock + deltaFull);
  item.emptyStock = Math.max(0, item.emptyStock + deltaEmpty);
  saveReturnables(returnables);
};

export const calculateInventoryStats = (products: Product[], movements: Movement[]): InventoryStats => {
  let totalCostValue = 0;
  let totalSaleValue = 0;
  let totalUnits = 0;
  let criticalStockCount = 0;
  let nearExpiryCount15 = 0;
  let nearExpiryCount30 = 0;
  let nearExpiryCount60 = 0;

  products.forEach(p => {
    totalCostValue += p.currentStock * p.costPrice;
    totalSaleValue += p.currentStock * p.salePrice;
    totalUnits += p.currentStock;

    if (p.currentStock <= p.minStock) {
      criticalStockCount++;
    }

    // Avaliar lotes com saldo
    p.lots.forEach(lot => {
      if (lot.quantity > 0) {
        const days = getDaysDifference(lot.expiryDate);
        if (days <= 15) {
          nearExpiryCount15 += lot.quantity;
        } else if (days <= 30) {
          nearExpiryCount30 += lot.quantity;
        } else if (days <= 60) {
          nearExpiryCount60 += lot.quantity;
        }
      }
    });
  });

  // Perdas do mês atual
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let totalDamageUnitsMonth = 0;
  let totalDamageCostMonth = 0;

  movements.forEach(m => {
    if (m.type === 'PERDA_AVARIA') {
      const d = new Date(m.timestamp);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        totalDamageUnitsMonth += m.quantity;
        totalDamageCostMonth += m.totalValue;
      }
    }
  });

  return {
    totalCostValue,
    totalSaleValue,
    expectedProfit: totalSaleValue - totalCostValue,
    totalUnits,
    totalSkus: products.length,
    criticalStockCount,
    nearExpiryCount15,
    nearExpiryCount30,
    nearExpiryCount60,
    totalDamageUnitsMonth,
    totalDamageCostMonth
  };
};

export const resetInventoryToDefaults = () => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(STORAGE_KEYS.RETURNABLES, JSON.stringify(INITIAL_RETURNABLES));
  localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
};
