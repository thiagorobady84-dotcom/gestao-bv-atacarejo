import * as XLSX from 'xlsx';
import { Product, Movement, ReturnableContainer } from '../types/inventory';
import { getDaysDifference } from './storageService';

export const exportInventoryToExcel = (
  products: Product[],
  returnables: ReturnableContainer[],
  movements: Movement[]
) => {
  const wb = XLSX.utils.book_new();

  // 1. Aba de Produtos (Inventário)
  const productsData = products.map(p => {
    const totalCost = p.currentStock * p.costPrice;
    const totalSale = p.currentStock * p.salePrice;
    let status = 'Normal';
    if (p.currentStock <= 0) status = 'Zerado';
    else if (p.currentStock <= p.minStock) status = 'Crítico / Repor';
    else if (p.currentStock >= p.maxStock) status = 'Excesso';

    return {
      'SKU': p.sku,
      'Código de Barras (EAN)': p.barcode,
      'Nome do Produto': p.name,
      'Categoria': p.category,
      'Unidade': p.unit,
      'Preço Custo (R$)': p.costPrice,
      'Preço Venda (R$)': p.salePrice,
      'Estoque Atual': p.currentStock,
      'Estoque Mínimo': p.minStock,
      'Estoque Máximo': p.maxStock,
      'Localização Depósito': `${p.location.corridor} / ${p.location.shelf} / ${p.location.pallet}`,
      'Valor Total Custo (R$)': totalCost,
      'Valor Total Venda (R$)': totalSale,
      'Margem Bruta Esperada (R$)': totalSale - totalCost,
      'Situação': status,
      'Retornável?': p.isReturnable ? 'Sim' : 'Não'
    };
  });

  const wsProducts = XLSX.utils.json_to_sheet(productsData);
  
  // Largura automática das colunas
  wsProducts['!cols'] = [
    { wch: 15 }, // SKU
    { wch: 18 }, // EAN
    { wch: 45 }, // Nome
    { wch: 18 }, // Categoria
    { wch: 14 }, // Unidade
    { wch: 16 }, // Preço Custo
    { wch: 16 }, // Preço Venda
    { wch: 14 }, // Estoque Atual
    { wch: 14 }, // Mínimo
    { wch: 14 }, // Máximo
    { wch: 25 }, // Localização
    { wch: 20 }, // Total Custo
    { wch: 20 }, // Total Venda
    { wch: 22 }, // Margem
    { wch: 16 }, // Situação
    { wch: 12 }, // Retornável
  ];

  XLSX.utils.book_append_sheet(wb, wsProducts, 'Inventário Atual');

  // 2. Aba de Lotes e Validades
  const lotsData: any[] = [];
  products.forEach(p => {
    p.lots.forEach(lot => {
      const days = getDaysDifference(lot.expiryDate);
      let alert = 'Normal';
      if (days < 0) alert = 'VENCIDO';
      else if (days <= 15) alert = 'URGENTE (<= 15 dias)';
      else if (days <= 30) alert = 'ATENÇÃO (<= 30 dias)';
      else if (days <= 60) alert = 'MONITORAR (<= 60 dias)';

      lotsData.push({
        'Produto': p.name,
        'SKU': p.sku,
        'Código de Barras': p.barcode,
        'Nº do Lote': lot.lotNumber,
        'Data de Validade': lot.expiryDate,
        'Dias até Vencer': days,
        'Status Validade': alert,
        'Quantidade no Lote': lot.quantity,
        'Custo Unitário (R$)': lot.costPrice,
        'Capital em Risco (R$)': lot.quantity * lot.costPrice,
        'Fornecedor / Origem': lot.supplier || 'Não informado'
      });
    });
  });

  const wsLots = XLSX.utils.json_to_sheet(lotsData);
  wsLots['!cols'] = [
    { wch: 42 },
    { wch: 15 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, wsLots, 'Lotes e Validades');

  // 3. Aba de Vasilhames Retornáveis
  const returnablesData = returnables.map(r => ({
    'Código': r.code,
    'Nome do Vasilhame': r.name,
    'Capacidade / Padrão': r.capacity,
    'Saldo Cheio no Depósito': r.fullStock,
    'Saldo Vazio no Pátio': r.emptyStock,
    'Total em Posse': r.fullStock + r.emptyStock,
    'Ponto de Reposição/Envio': r.minEmptyThreshold,
    'Valor Caução Unitário (R$)': r.depositValue,
    'Patrimônio Caução (R$)': (r.fullStock + r.emptyStock) * r.depositValue,
    'Última Remessa Cervejaria': r.lastBreweryExchange || 'N/A'
  }));

  const wsReturnables = XLSX.utils.json_to_sheet(returnablesData);
  wsReturnables['!cols'] = [
    { wch: 16 },
    { wch: 35 },
    { wch: 24 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
    { wch: 24 },
    { wch: 22 },
    { wch: 24 },
    { wch: 24 }
  ];
  XLSX.utils.book_append_sheet(wb, wsReturnables, 'Vasilhames Retornáveis');

  // 4. Aba de Histórico de Movimentações (Auditoria)
  const movementsData = movements.map(m => ({
    'Data e Hora': new Date(m.timestamp).toLocaleString('pt-BR'),
    'Tipo Operação': m.type,
    'Produto': m.productName,
    'EAN-13': m.barcode,
    'Quantidade': m.quantity,
    'Estoque Anterior': m.previousStock,
    'Estoque Final': m.newStock,
    'Valor Unitário (R$)': m.unitPrice,
    'Valor Total (R$)': m.totalValue,
    'Motivo / Avaria': m.reason || '-',
    'Parceiro / Fornecedor / Cliente': m.supplierOrClient || '-',
    'Operador Responsável': m.responsibleUser,
    'Observações': m.notes || '-'
  }));

  const wsMovements = XLSX.utils.json_to_sheet(movementsData);
  wsMovements['!cols'] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 40 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 28 },
    { wch: 30 },
    { wch: 24 },
    { wch: 40 }
  ];
  XLSX.utils.book_append_sheet(wb, wsMovements, 'Log de Movimentações');

  // Gera o arquivo e inicia download
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `relatorio_estoque_distribuidora_${dateStr}.xlsx`);
};

export const exportInventoryToCSV = (products: Product[]) => {
  const headers = [
    'SKU',
    'Codigo_Barras',
    'Nome_Produto',
    'Categoria',
    'Unidade',
    'Preco_Custo',
    'Preco_Venda',
    'Estoque_Atual',
    'Estoque_Minimo',
    'Estoque_Maximo',
    'Rua',
    'Prateleira',
    'Palete',
    'Valor_Total_Custo',
    'Valor_Total_Venda',
    'Status'
  ];

  const rows = products.map(p => {
    const totalCost = (p.currentStock * p.costPrice).toFixed(2);
    const totalSale = (p.currentStock * p.salePrice).toFixed(2);
    const status = p.currentStock <= p.minStock ? 'CRITICO' : 'NORMAL';

    return [
      `"${p.sku}"`,
      `"${p.barcode}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.unit}"`,
      p.costPrice.toFixed(2),
      p.salePrice.toFixed(2),
      p.currentStock,
      p.minStock,
      p.maxStock,
      `"${p.location.corridor}"`,
      `"${p.location.shelf}"`,
      `"${p.location.pallet}"`,
      totalCost,
      totalSale,
      `"${status}"`
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `inventario_distribuidora_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
