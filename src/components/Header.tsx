import React from 'react';
import { 
  Scan, 
  FileSpreadsheet, 
  RotateCcw, 
  Database, 
  Boxes, 
  LayoutDashboard, 
  History, 
  Beer,
  RefreshCw
} from 'lucide-react';
import { Product, Movement, ReturnableContainer } from '../types/inventory';
import { exportInventoryToExcel } from '../services/exportService';

interface HeaderProps {
  activeTab: 'dashboard' | 'inventory' | 'returnables' | 'movements' | 'sql';
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'returnables' | 'movements' | 'sql') => void;
  onOpenScanner: () => void;
  products: Product[];
  returnables: ReturnableContainer[];
  movements: Movement[];
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenScanner,
  products,
  returnables,
  movements,
  onResetData
}) => {
  const handleExport = () => {
    exportInventoryToExcel(products, returnables, movements);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Beer className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                DepósitoFlow
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-medium">
                Logística & Bebidas
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'text-amber-600 bg-amber-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Painel</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'inventory'
                  ? 'text-amber-600 bg-amber-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Estoque & Lotes</span>
            </button>

            <button
              onClick={() => setActiveTab('returnables')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'returnables'
                  ? 'text-amber-600 bg-amber-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Vasilhames Retornáveis</span>
            </button>

            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'movements'
                  ? 'text-amber-600 bg-amber-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Movimentações</span>
            </button>

            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'sql'
                  ? 'text-amber-600 bg-amber-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Schema SQL</span>
            </button>
          </nav>

          {/* Zone 3: Actions (Export + Primary Bipar Scanner CTA) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExport}
              title="Exportar inventário completo para Excel (.xlsx)"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={onResetData}
              title="Restaurar dados padrão de teste"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenScanner}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs active:scale-95"
            >
              <Scan className="w-4 h-4 text-amber-400" />
              <span>Bipar Código</span>
            </button>
          </div>

        </div>

        {/* Mobile secondary navigation */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'dashboard' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600'
            }`}
          >
            Painel
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'inventory' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600'
            }`}
          >
            Estoque
          </button>
          <button
            onClick={() => setActiveTab('returnables')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'returnables' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600'
            }`}
          >
            Retornáveis
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'movements' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600'
            }`}
          >
            Histórico
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'sql' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600'
            }`}
          >
            SQL
          </button>
        </div>

      </div>
    </header>
  );
};
