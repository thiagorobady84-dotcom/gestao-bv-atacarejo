import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  FileSpreadsheet, 
  ArrowDownRight, 
  ArrowUpRight, 
  AlertOctagon, 
  AlertTriangle,
  RotateCcw,
  Edit2,
  MapPin,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { Product, ProductCategory, UnitOfMeasure } from '../types/inventory';
import { getDaysDifference } from '../services/storageService';
import { exportInventoryToCSV, exportInventoryToExcel } from '../services/exportService';

interface ProductListProps {
  products: Product[];
  onOpenProductModal: (product?: Product) => void;
  onOpenScannerWithProduct: (productId: string, mode: 'ENTRADA' | 'SAIDA' | 'PERDA_AVARIA') => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onOpenProductModal,
  onOpenScannerWithProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'CRITICAL' | 'NORMAL' | 'EXCESS'>('ALL');
  const [returnableOnly, setReturnableOnly] = useState(false);
  const [expandedLotsProductId, setExpandedLotsProductId] = useState<string | null>(null);

  const categories: ProductCategory[] = [
    'Cervejas',
    'Destilados',
    'Refrigerantes',
    'Águas',
    'Vinhos',
    'Energéticos',
    'Gelo & Carvão'
  ];

  const filteredProducts = products.filter(p => {
    // Busca textual
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.barcode.includes(term) ||
      p.location.corridor.toLowerCase().includes(term) ||
      p.location.pallet.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    // Filtro por Categoria
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;

    // Filtro Retornáveis
    if (returnableOnly && !p.isReturnable) return false;

    // Filtro por Status
    if (stockStatusFilter === 'CRITICAL' && p.currentStock > p.minStock) return false;
    if (stockStatusFilter === 'NORMAL' && (p.currentStock <= p.minStock || p.currentStock >= p.maxStock)) return false;
    if (stockStatusFilter === 'EXCESS' && p.currentStock < p.maxStock) return false;

    return true;
  });

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-4">
      
      {/* Barra de Filtros e Ações de Topo */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Campo de Busca Rápida */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, SKU, EAN-13 ou localização..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportInventoryToCSV(products)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => onOpenProductModal()}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Novo Produto</span>
            </button>
          </div>

        </div>

        {/* Linha de Filtros por Categoria e Status */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          
          {/* Segmented de Categorias */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas Categorias
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block mx-1" />

          {/* Filtro de Status de Estoque */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-700"
          >
            <option value="ALL">Todos os Níveis</option>
            <option value="CRITICAL">⚠️ Abaixo do Mínimo (Crítico)</option>
            <option value="NORMAL">✅ Nível Regular</option>
            <option value="EXCESS">📦 Acima do Máximo (Excesso)</option>
          </select>

          {/* Toggle de Retornáveis */}
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={returnableOnly}
              onChange={(e) => setReturnableOnly(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span className="flex items-center gap-1">
              <RotateCcw className="w-3 h-3 text-amber-600" />
              Apenas Retornáveis
            </span>
          </label>

        </div>

      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs text-slate-500 font-medium">
            Mostrando <strong className="text-slate-900 font-mono">{filteredProducts.length}</strong> de <strong className="text-slate-900 font-mono">{products.length}</strong> produtos
          </div>
          <div className="text-2xs text-slate-400">
            Valores tabulares calculados em tempo real
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-2xs">
                <th className="py-3 px-4">Identificação / EAN</th>
                <th className="py-3 px-4">Produto & Categoria</th>
                <th className="py-3 px-4">Localização Depósito</th>
                <th className="py-3 px-4 text-right">Preço Custo / Venda</th>
                <th className="py-3 px-4 text-center">Nível de Estoque</th>
                <th className="py-3 px-4">Lotes & Validade</th>
                <th className="py-3 px-4 text-center">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum produto encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isCritical = p.currentStock <= p.minStock;
                  const isExcess = p.currentStock >= p.maxStock;
                  const stockPercentage = Math.min(100, Math.round((p.currentStock / p.maxStock) * 100));
                  
                  // Lote mais urgente
                  const sortedLots = [...p.lots].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
                  const nearestLot = sortedLots[0];
                  const nearestDays = nearestLot ? getDaysDifference(nearestLot.expiryDate) : null;
                  const isExpanded = expandedLotsProductId === p.id;

                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Identificação SKU + EAN */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 block">
                            {p.sku}
                          </span>
                          <span className="font-mono text-2xs text-slate-500 block mt-0.5">
                            {p.barcode}
                          </span>
                        </td>

                        {/* Nome do Produto */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-slate-900">
                            {p.name}
                          </div>
                          <div className="flex items-center gap-2 text-2xs text-slate-500 mt-1">
                            <span className="font-medium text-slate-600">{p.category}</span>
                            <span>·</span>
                            <span className="font-mono">{p.unit}</span>
                            {p.isReturnable && (
                              <>
                                <span>·</span>
                                <span className="text-amber-700 font-semibold flex items-center gap-0.5">
                                  <RotateCcw className="w-2.5 h-2.5" /> Retornável
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Localização Física */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{p.location.corridor}</span>
                          </div>
                          <div className="text-2xs text-slate-400 font-mono mt-0.5 pl-5">
                            {p.location.shelf} · {p.location.pallet}
                          </div>
                        </td>

                        {/* Preço Custo / Venda */}
                        <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                          <div className="text-slate-900 font-semibold">
                            {formatMoney(p.salePrice)}
                          </div>
                          <div className="text-2xs text-slate-400">
                            Custo: {formatMoney(p.costPrice)}
                          </div>
                        </td>

                        {/* Nível de Estoque */}
                        <td className="py-3 px-4 text-center whitespace-nowrap min-w-36">
                          <div className="flex items-center justify-between font-mono text-xs mb-1">
                            <span className={`font-bold ${
                              isCritical ? 'text-red-600' : isExcess ? 'text-blue-600' : 'text-slate-900'
                            }`}>
                              {p.currentStock} {p.unit}
                            </span>
                            <span className="text-2xs text-slate-400">
                              Mín: {p.minStock}
                            </span>
                          </div>
                          {/* Mini Barra de Progresso */}
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                isCritical ? 'bg-red-500' : isExcess ? 'bg-blue-500' : 'bg-emerald-500'
                              }`} 
                              style={{ width: `${Math.max(8, stockPercentage)}%` }} 
                            />
                          </div>
                        </td>

                        {/* Lotes & Validade */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {nearestLot ? (
                            <div>
                              <div className="flex items-center gap-1.5 font-mono text-xs">
                                <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${
                                  nearestDays! <= 15 ? 'bg-red-100 text-red-700' :
                                  nearestDays! <= 30 ? 'bg-amber-100 text-amber-800' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {nearestDays! <= 0 ? 'Vencido' : `${nearestDays}d`}
                                </span>
                                <span className="text-slate-700 font-medium">{new Date(nearestLot.expiryDate).toLocaleDateString('pt-BR')}</span>
                              </div>
                              <button
                                onClick={() => setExpandedLotsProductId(isExpanded ? null : p.id)}
                                className="text-2xs text-amber-700 hover:underline mt-0.5 block font-mono"
                              >
                                {p.lots.length} lote(s) cadastrado(s)
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-2xs">Sem lotes ativos</span>
                          )}
                        </td>

                        {/* Ações Rápidas */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onOpenScannerWithProduct(p.id, 'ENTRADA')}
                              title="Bipar Entrada / Reposição"
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                            >
                              <ArrowDownRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onOpenScannerWithProduct(p.id, 'SAIDA')}
                              title="Bipar Saída / Venda"
                              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onOpenScannerWithProduct(p.id, 'PERDA_AVARIA')}
                              title="Registrar Quebra / Avaria"
                              className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <AlertOctagon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onOpenProductModal(p)}
                              title="Editar Produto"
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>

                      {/* Linha expansível para detalhamento de todos os lotes */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-y border-slate-200">
                          <td colSpan={7} className="px-6 py-3">
                            <div className="space-y-1.5">
                              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block">
                                Detalhamento dos Lotes de {p.name}:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {p.lots.map(l => (
                                  <div key={l.id} className="p-2 bg-white rounded border border-slate-200 text-2xs font-mono">
                                    <div className="flex justify-between font-bold text-slate-800">
                                      <span>Lote: {l.lotNumber}</span>
                                      <span className="text-slate-600">{l.quantity} {p.unit}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 mt-1">
                                      <span>Vence: {new Date(l.expiryDate).toLocaleDateString('pt-BR')}</span>
                                      <span>Custo: {formatMoney(l.costPrice)}</span>
                                    </div>
                                    {l.supplier && (
                                      <div className="text-slate-400 mt-0.5 truncate">
                                        Origem: {l.supplier}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
