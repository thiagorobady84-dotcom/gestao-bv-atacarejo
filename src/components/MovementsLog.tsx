import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ArrowDownRight, 
  ArrowUpRight, 
  AlertOctagon, 
  FileSpreadsheet, 
  User, 
  Calendar,
  Layers
} from 'lucide-react';
import { Movement, MovementType } from '../types/inventory';
import { exportInventoryToExcel } from '../services/exportService';
import { Product, ReturnableContainer } from '../types/inventory';

interface MovementsLogProps {
  movements: Movement[];
  products: Product[];
  returnables: ReturnableContainer[];
}

export const MovementsLog: React.FC<MovementsLogProps> = ({
  movements,
  products,
  returnables
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | MovementType>('ALL');

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const filteredMovements = movements.filter(m => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      m.productName.toLowerCase().includes(term) ||
      m.barcode.includes(term) ||
      m.responsibleUser.toLowerCase().includes(term) ||
      (m.supplierOrClient && m.supplierOrClient.toLowerCase().includes(term)) ||
      (m.reason && m.reason.toLowerCase().includes(term));

    if (!matchesSearch) return false;
    if (typeFilter !== 'ALL' && m.type !== typeFilter) return false;

    return true;
  });

  return (
    <div className="space-y-4">
      
      {/* Top Banner & Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Log Auditável de Movimentações
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rastreabilidade completa de todas as entradas, baixas, vendas e registros de avarias
            </p>
          </div>

          <button
            onClick={() => exportInventoryToExcel(products, returnables, movements)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Baixar Histórico em Excel</span>
          </button>
        </div>

        {/* Linha de Busca e Tipos de Movimentação */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por produto, EAN, responsável, motivo ou NF..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
            />
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto text-xs">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                typeFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({movements.length})
            </button>
            <button
              onClick={() => setTypeFilter('ENTRADA')}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                typeFilter === 'ENTRADA'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setTypeFilter('SAIDA')}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                typeFilter === 'SAIDA'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Saídas
            </button>
            <button
              onClick={() => setTypeFilter('PERDA_AVARIA')}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                typeFilter === 'PERDA_AVARIA'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Perdas / Avarias
            </button>
          </div>
        </div>
      </div>

      {/* Tabela do Log */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-2xs">
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Operação</th>
                <th className="py-3 px-4">Produto & EAN</th>
                <th className="py-3 px-4 text-center">Quantidade</th>
                <th className="py-3 px-4 text-center">Saldo (Antes &rarr; Depois)</th>
                <th className="py-3 px-4 text-right">Valor Financeiro</th>
                <th className="py-3 px-4">Origem / Destino / Motivo</th>
                <th className="py-3 px-4">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhuma movimentação encontrada com os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map(m => {
                  const isEntrada = m.type === 'ENTRADA';
                  const isSaida = m.type === 'SAIDA';
                  const isPerda = m.type === 'PERDA_AVARIA';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Data / Hora */}
                      <td className="py-3 px-4 font-mono text-2xs whitespace-nowrap text-slate-500">
                        <span className="block font-semibold text-slate-700">
                          {new Date(m.timestamp).toLocaleDateString('pt-BR')}
                        </span>
                        <span>
                          {new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-2xs ${
                          isEntrada ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          isSaida ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          isPerda ? 'bg-rose-50 text-rose-700 border border-rose-200' : 
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {isEntrada && <ArrowDownRight className="w-3 h-3" />}
                          {isSaida && <ArrowUpRight className="w-3 h-3" />}
                          {isPerda && <AlertOctagon className="w-3 h-3" />}
                          {m.type}
                        </span>
                      </td>

                      {/* Produto */}
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-bold text-slate-900 block truncate">
                          {m.productName}
                        </span>
                        <span className="font-mono text-2xs text-slate-400 block mt-0.5">
                          EAN: {m.barcode} {m.lotNumber ? `· Lote: ${m.lotNumber}` : ''}
                        </span>
                      </td>

                      {/* Quantidade */}
                      <td className="py-3 px-4 text-center font-mono font-bold whitespace-nowrap">
                        <span className={isEntrada ? 'text-emerald-700' : isSaida ? 'text-blue-700' : 'text-rose-700'}>
                          {isEntrada ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
                      </td>

                      {/* Saldo Antes e Depois */}
                      <td className="py-3 px-4 text-center font-mono text-slate-600 whitespace-nowrap text-2xs">
                        {m.previousStock} &rarr; <strong className="text-slate-900 text-xs">{m.newStock}</strong>
                      </td>

                      {/* Valor Total */}
                      <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">
                          {formatMoney(m.totalValue)}
                        </span>
                        <span className="text-2xs text-slate-400 block">
                          Unit: {formatMoney(m.unitPrice)}
                        </span>
                      </td>

                      {/* Motivo ou Parceiro */}
                      <td className="py-3 px-4 max-w-xs text-2xs">
                        {m.reason ? (
                          <span className="font-semibold text-rose-700 block">
                            Avaria: {m.reason}
                          </span>
                        ) : m.supplierOrClient ? (
                          <span className="text-slate-800 block truncate">
                            {m.supplierOrClient}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                        {m.notes && (
                          <span className="text-slate-400 block truncate italic mt-0.5">
                            "{m.notes}"
                          </span>
                        )}
                      </td>

                      {/* Usuário Responsável */}
                      <td className="py-3 px-4 whitespace-nowrap text-2xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-32">{m.responsibleUser}</span>
                        </div>
                      </td>

                    </tr>
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
