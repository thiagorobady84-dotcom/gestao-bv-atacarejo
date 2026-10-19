import React, { useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Package, 
  AlertOctagon, 
  ArrowUpRight, 
  ArrowDownRight, 
  RotateCcw,
  Sparkles,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Product, Movement, ReturnableContainer, ProductCategory } from '../types/inventory';
import { calculateInventoryStats, getDaysDifference } from '../services/storageService';

interface DashboardProps {
  products: Product[];
  movements: Movement[];
  returnables: ReturnableContainer[];
  onOpenScannerWithProduct?: (productId: string, defaultMode?: 'ENTRADA' | 'SAIDA' | 'PERDA_AVARIA') => void;
  onNavigateToTab: (tab: 'inventory' | 'returnables' | 'movements') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  products,
  movements,
  returnables,
  onOpenScannerWithProduct,
  onNavigateToTab
}) => {
  const [expiryFilter, setExpiryFilter] = useState<15 | 30 | 60>(30);
  const stats = calculateInventoryStats(products, movements);

  // Formatação de Moeda
  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Itens em estoque crítico
  const criticalProducts = products.filter(p => p.currentStock <= p.minStock);

  // Lotes próximos do vencimento
  const urgentLots = products
    .flatMap(p => 
      p.lots
        .filter(l => l.quantity > 0)
        .map(l => ({
          ...l,
          productName: p.name,
          category: p.category,
          unit: p.unit,
          daysLeft: getDaysDifference(l.expiryDate)
        }))
    )
    .filter(l => l.daysLeft <= expiryFilter)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Agrupamento por Categoria para gráfico de Rosca
  const categoryDistribution = products.reduce((acc, p) => {
    const cost = p.currentStock * p.costPrice;
    acc[p.category] = (acc[p.category] || 0) + cost;
    return acc;
  }, {} as Record<string, number>);

  const categoryEntries = Object.entries(categoryDistribution)
    .sort((a, b) => b[1] - a[1]);

  const categoryColors: Record<string, string> = {
    'Cervejas': '#f59e0b',     // Amber
    'Destilados': '#6366f1',   // Indigo
    'Refrigerantes': '#ef4444',// Red
    'Águas': '#06b6d4',        // Cyan
    'Vinhos': '#8b5cf6',       // Purple
    'Energéticos': '#10b981',  // Emerald
    'Gelo & Carvão': '#64748b',// Slate
  };

  // Totais para cálculo percentual do SVG Donut
  const totalCategoryCost = categoryEntries.reduce((sum, item) => sum + item[1], 0) || 1;
  let accumulatedAngle = 0;
  const donutSlices = categoryEntries.map(([category, value]) => {
    const percentage = value / totalCategoryCost;
    const strokeDasharray = `${percentage * 100} ${100 - percentage * 100}`;
    const strokeDashoffset = -accumulatedAngle;
    accumulatedAngle += percentage * 100;
    return {
      category,
      value,
      percentage: Math.round(percentage * 100),
      color: categoryColors[category] || '#94a3b8',
      strokeDasharray,
      strokeDashoffset
    };
  });

  // Resumo de movimentações recentes (últimas 5)
  const recentMovements = movements.slice(0, 5);

  // Vasilhames com necessidade de envio
  const returnablesNeedingAction = returnables.filter(r => r.emptyStock >= r.minEmptyThreshold);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Context */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Visão Operacional do Depósito
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Balanço em tempo real de produtos, validade de lotes e fluxo de vasilhames retornáveis.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Margem Bruta Estimada</span>
              <span className="text-base font-bold text-emerald-600 font-mono tabular-nums">
                +{formatMoney(stats.expectedProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Valor em Estoque */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Valor de Estoque</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatMoney(stats.totalCostValue)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>Potencial Venda:</span>
            <span className="font-semibold text-slate-700 font-mono tabular-nums">
              {formatMoney(stats.totalSaleValue)}
            </span>
          </div>
        </div>

        {/* KPI 2: Total de Volumes */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total de Volumes</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalUnits.toLocaleString('pt-BR')} <span className="text-sm font-normal text-slate-500">un/cx</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>SKUs Ativos:</span>
            <span className="font-semibold text-slate-700 font-mono tabular-nums">
              {stats.totalSkus} itens cadastrados
            </span>
          </div>
        </div>

        {/* KPI 3: Estoque Crítico */}
        <div className={`bg-white border rounded-xl p-5 shadow-2xs ${stats.criticalStockCount > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ponto de Reposição</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600 font-mono tabular-nums">
            {stats.criticalStockCount} <span className="text-sm font-normal text-slate-600">críticos</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>Abaixo do mínimo:</span>
            <button 
              onClick={() => onNavigateToTab('inventory')}
              className="text-red-700 hover:underline font-semibold"
            >
              Verificar itens &rarr;
            </button>
          </div>
        </div>

        {/* KPI 4: Perdas e Avarias do Mês */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avarias no Mês</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatMoney(stats.totalDamageCostMonth)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>Volumes descartados:</span>
            <span className="font-semibold text-rose-600 font-mono tabular-nums">
              {stats.totalDamageUnitsMonth} unidades
            </span>
          </div>
        </div>

      </div>

      {/* Grid: Gráfico de Rosca de Categorias + Alerta de Vasilhames */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico Donut de Categorias */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Distribuição de Capital por Categoria
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Proporção do valor de custo investido no estoque
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              Total: {formatMoney(stats.totalCostValue)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* SVG Donut */}
            <div className="relative w-44 h-44 shrink-0">
              <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="6"
                />
                {donutSlices.map((slice, i) => (
                  <circle
                    key={i}
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth="6"
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    className="transition-all duration-300"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xs text-slate-400 font-medium">Categorias</span>
                <span className="text-lg font-bold text-slate-800 font-mono">
                  {categoryEntries.length}
                </span>
              </div>
            </div>

            {/* Legenda com Valores */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-xs">
              {donutSlices.map(item => (
                <div 
                  key={item.category} 
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="font-medium text-slate-700 truncate">{item.category}</span>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <span className="font-bold text-slate-900">{item.percentage}%</span>
                    <span className="text-slate-400 block text-2xs">{formatMoney(item.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card Vasilhames Retornáveis & Balanço Rápido */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">Retornáveis</h2>
              </div>
              <button 
                onClick={() => onNavigateToTab('returnables')}
                className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
              >
                Gerenciar &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Monitoramento de garrafas 600ml, litrões e barris no pátio.
            </p>

            <div className="space-y-3">
              {returnables.map(r => {
                const total = r.fullStock + r.emptyStock;
                const emptyPct = total > 0 ? Math.round((r.emptyStock / total) * 100) : 0;
                const isNeedTruck = r.emptyStock >= r.minEmptyThreshold;

                return (
                  <div key={r.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800 truncate">{r.name}</span>
                      {isNeedTruck && (
                        <span className="text-2xs font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          Carga Pronta
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-mono">
                      <span>Cheios: <strong className="text-slate-900">{r.fullStock}</strong></span>
                      <span>Vazios no Pátio: <strong className={isNeedTruck ? 'text-amber-600' : 'text-slate-700'}>{r.emptyStock}</strong></span>
                    </div>

                    {/* Barra de Proporção Cheio vs Vazio */}
                    <div className="w-full h-1.5 bg-emerald-200 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-emerald-600 h-full" 
                        style={{ width: `${100 - emptyPct}%` }} 
                        title={`Cheios: ${100 - emptyPct}%`}
                      />
                      <div 
                        className="bg-amber-400 h-full" 
                        style={{ width: `${emptyPct}%` }} 
                        title={`Vazios: ${emptyPct}%`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Caução total em custódia:</span>
            <span className="font-bold text-slate-800 font-mono">
              {formatMoney(returnables.reduce((acc, r) => acc + (r.fullStock + r.emptyStock) * r.depositValue, 0))}
            </span>
          </div>
        </div>

      </div>

      {/* Grid: Alertas de Validade Próxima + Estoque Crítico de Reposição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Painel de Validades Próximas */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">Alerta de Validades</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Lotes com risco de perda por vencimento
              </p>
            </div>

            {/* Filtro 15, 30 e 60 dias (Segmented control) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setExpiryFilter(15)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  expiryFilter === 15 
                    ? 'bg-white text-slate-900 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                15 dias ({stats.nearExpiryCount15})
              </button>
              <button
                onClick={() => setExpiryFilter(30)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  expiryFilter === 30 
                    ? 'bg-white text-slate-900 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 dias ({stats.nearExpiryCount15 + stats.nearExpiryCount30})
              </button>
              <button
                onClick={() => setExpiryFilter(60)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  expiryFilter === 60 
                    ? 'bg-white text-slate-900 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                60 dias
              </button>
            </div>
          </div>

          {urgentLots.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Nenhum lote com vencimento nos próximos {expiryFilter} dias.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {urgentLots.map((lot, idx) => (
                <div 
                  key={`${lot.id}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-100 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{lot.productName}</h4>
                    <div className="flex items-center gap-2 text-2xs text-slate-500 mt-1">
                      <span>Lote: <strong className="font-mono text-slate-700">{lot.lotNumber}</strong></span>
                      <span>·</span>
                      <span>Validade: <strong className="font-mono">{new Date(lot.expiryDate).toLocaleDateString('pt-BR')}</strong></span>
                      <span>·</span>
                      <span>{lot.supplier}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-mono ${
                      lot.daysLeft <= 15 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {lot.daysLeft <= 0 ? 'VENCIDO' : `${lot.daysLeft} dias`}
                    </span>
                    <span className="block text-2xs text-slate-500 mt-1 font-mono">
                      Saldo: <strong>{lot.quantity}</strong> {lot.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Painel de Reposição Crítica */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h2 className="text-base font-bold text-slate-900">Itens Abaixo do Mínimo</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Produtos que necessitam pedido urgente aos fornecedores
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('inventory')}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
            >
              Ver todos ({criticalProducts.length})
            </button>
          </div>

          {criticalProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Todos os produtos estão com níveis de estoque regulares.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {criticalProducts.map(p => {
                const deficit = p.minStock - p.currentStock;
                return (
                  <div 
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50/30 hover:bg-red-50/60 transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>
                      <div className="flex items-center gap-2 text-2xs text-slate-500 mt-1">
                        <span>Local: <strong className="font-mono text-slate-700">{p.location.corridor}/{p.location.shelf}</strong></span>
                        <span>·</span>
                        <span>Mínimo: {p.minStock} {p.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-red-600 block">
                          {p.currentStock} {p.unit}
                        </span>
                        <span className="text-2xs text-red-500">
                          Faltam {deficit}
                        </span>
                      </div>

                      {onOpenScannerWithProduct && (
                        <button
                          onClick={() => onOpenScannerWithProduct(p.id, 'ENTRADA')}
                          className="px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shadow-2xs"
                        >
                          Repor
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Histórico Recente de Operações */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Últimas Operações Registradas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditoria em tempo real de entradas, saídas e registros de avarias
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('movements')}
            className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
          >
            Ver Histórico Completo &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-2">Operação</th>
                <th className="pb-2">Produto</th>
                <th className="pb-2">Quantidade</th>
                <th className="pb-2">Saldo Resultante</th>
                <th className="pb-2">Valor Total</th>
                <th className="pb-2">Responsável</th>
                <th className="pb-2 text-right">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentMovements.map(m => {
                const isEntrada = m.type === 'ENTRADA';
                const isSaida = m.type === 'SAIDA';
                const isPerda = m.type === 'PERDA_AVARIA';

                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 pr-2">
                      <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-2xs ${
                        isEntrada ? 'bg-emerald-50 text-emerald-700' :
                        isSaida ? 'bg-blue-50 text-blue-700' :
                        isPerda ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isEntrada && <ArrowDownRight className="w-3 h-3" />}
                        {isSaida && <ArrowUpRight className="w-3 h-3" />}
                        {isPerda && <AlertOctagon className="w-3 h-3" />}
                        {m.type}
                      </span>
                    </td>
                    <td className="py-2.5 font-medium text-slate-800 max-w-xs truncate pr-3">
                      {m.productName}
                    </td>
                    <td className="py-2.5 font-mono font-bold text-slate-900">
                      {isEntrada ? `+${m.quantity}` : isSaida ? `-${m.quantity}` : `-${m.quantity}`}
                    </td>
                    <td className="py-2.5 font-mono text-slate-600">
                      {m.newStock}
                    </td>
                    <td className="py-2.5 font-mono font-medium text-slate-800">
                      {formatMoney(m.totalValue)}
                    </td>
                    <td className="py-2.5 text-slate-600 truncate max-w-xs">
                      {m.responsibleUser}
                    </td>
                    <td className="py-2.5 text-right text-slate-400 font-mono text-2xs">
                      {new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
