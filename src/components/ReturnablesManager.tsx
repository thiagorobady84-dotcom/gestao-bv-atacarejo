import React, { useState } from 'react';
import { 
  RotateCcw, 
  Truck, 
  Package, 
  Plus, 
  ArrowDownRight, 
  ArrowUpRight, 
  AlertOctagon, 
  Check, 
  Clock, 
  DollarSign,
  Boxes
} from 'lucide-react';
import { ReturnableContainer } from '../types/inventory';
import { loadReturnables, saveReturnables } from '../services/storageService';

interface ReturnablesManagerProps {
  returnables: ReturnableContainer[];
  onDataChanged: () => void;
}

export const ReturnablesManager: React.FC<ReturnablesManagerProps> = ({
  returnables,
  onDataChanged
}) => {
  const [selectedItem, setSelectedItem] = useState<ReturnableContainer | null>(null);
  const [modalAction, setModalAction] = useState<'RECEBER_CLIENTE' | 'ENVIO_FABRICA' | 'AVARIA_VASILHAME' | null>(null);
  const [quantity, setQuantity] = useState<number>(10);
  const [notes, setNotes] = useState('');
  const [operator, setOperator] = useState('Encarregado de Pátio');

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleOpenAction = (item: ReturnableContainer, action: 'RECEBER_CLIENTE' | 'ENVIO_FABRICA' | 'AVARIA_VASILHAME') => {
    setSelectedItem(item);
    setModalAction(action);
    setQuantity(action === 'ENVIO_FABRICA' ? Math.min(item.emptyStock, item.minEmptyThreshold) : 10);
    setNotes('');
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !modalAction) return;

    const currentReturnables = loadReturnables();
    const idx = currentReturnables.findIndex(r => r.id === selectedItem.id);
    if (idx === -1) return;

    const item = currentReturnables[idx];

    if (modalAction === 'RECEBER_CLIENTE') {
      item.emptyStock += quantity;
    } else if (modalAction === 'ENVIO_FABRICA') {
      if (item.emptyStock < quantity) {
        alert(`Saldo de vazios (${item.emptyStock}) insuficiente para envio de ${quantity} unidades.`);
        return;
      }
      item.emptyStock -= quantity;
      item.lastBreweryExchange = new Date().toISOString().slice(0, 10);
    } else if (modalAction === 'AVARIA_VASILHAME') {
      if (item.emptyStock < quantity) {
        alert('Quantidade de vasilhames quebrados excede o saldo de vazios.');
        return;
      }
      item.emptyStock -= quantity;
    }

    item.atualizado_em = new Date().toISOString() as any;
    currentReturnables[idx] = item;
    saveReturnables(currentReturnables);

    onDataChanged();
    setModalAction(null);
    setSelectedItem(null);
  };

  const totalDepositValue = returnables.reduce(
    (sum, r) => sum + (r.fullStock + r.emptyStock) * r.depositValue,
    0
  );

  const totalEmptyInYard = returnables.reduce((sum, r) => sum + r.emptyStock, 0);
  const totalFullInDepot = returnables.reduce((sum, r) => sum + r.fullStock, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner do Módulo */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-500" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Gestão de Vasilhames & Retornáveis
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Controle de fluxo de garrafas de 600ml, litrões, engradados e barris cheios vs. vazios no pátio.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-400 block font-sans text-2xs">Patrimônio em Caução</span>
              <span className="text-sm font-bold text-slate-900 font-mono">
                {formatMoney(totalDepositValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Cartões de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Vasilhames Cheios (Prontos p/ Venda)
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {totalFullInDepot.toLocaleString('pt-BR')} <span className="text-sm font-normal text-slate-500">volumes</span>
          </div>
          <span className="text-2xs text-emerald-600 font-medium mt-1 block">
            Disponíveis nos paletes internos do galpão
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Vasilhames Vazios no Pátio
          </span>
          <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums mt-1">
            {totalEmptyInYard.toLocaleString('pt-BR')} <span className="text-sm font-normal text-slate-500">cascos/caixas</span>
          </div>
          <span className="text-2xs text-amber-700 font-medium mt-1 block">
            Aguardando montagem de carga para retorno à cervejaria
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Tipos de Vasilhames Padronizados
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {returnables.length} <span className="text-sm font-normal text-slate-500">padrões</span>
          </div>
          <span className="text-2xs text-slate-500 mt-1 block">
            Ambev, Heineken, Chopp e Engradados 24
          </span>
        </div>
      </div>

      {/* Grid de Padrões de Vasilhames */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {returnables.map(item => {
          const totalStock = item.fullStock + item.emptyStock;
          const emptyPercent = totalStock > 0 ? Math.round((item.emptyStock / totalStock) * 100) : 0;
          const isTruckReady = item.emptyStock >= item.minEmptyThreshold;

          return (
            <div 
              key={item.id} 
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-2xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {item.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Capacidade: {item.capacity} · Caução: <strong className="font-mono">{formatMoney(item.depositValue)}</strong>
                    </p>
                  </div>

                  {isTruckReady && (
                    <span className="text-2xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-1 rounded-md shrink-0 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      Carga Pronta
                    </span>
                  )}
                </div>

                {/* Balanço Visual Cheio x Vazio */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600">
                      Cheios no Depósito: <strong className="text-slate-900">{item.fullStock}</strong>
                    </span>
                    <span className="text-slate-600">
                      Vazios no Pátio: <strong className={isTruckReady ? 'text-amber-700' : 'text-slate-900'}>{item.emptyStock}</strong>
                    </span>
                  </div>

                  {/* Barra comparativa */}
                  <div className="w-full h-2.5 bg-emerald-200 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-emerald-600 h-full transition-all" 
                      style={{ width: `${100 - emptyPercent}%` }} 
                      title={`Cheios: ${item.fullStock}`}
                    />
                    <div 
                      className="bg-amber-400 h-full transition-all" 
                      style={{ width: `${emptyPercent}%` }} 
                      title={`Vazios: ${item.emptyStock}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-2xs text-slate-400">
                    <span>Meta de Envio p/ Cervejaria: {item.minEmptyThreshold} un.</span>
                    <span>Total em Posse: {totalStock} un.</span>
                  </div>
                </div>

                {/* Última troca */}
                <div className="mt-3 flex items-center justify-between text-2xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Última remessa para cervejaria:
                  </span>
                  <span className="font-mono font-medium text-slate-700">
                    {item.lastBreweryExchange ? new Date(item.lastBreweryExchange).toLocaleDateString('pt-BR') : 'Nenhuma'}
                  </span>
                </div>
              </div>

              {/* Botões Operacionais */}
              <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleOpenAction(item, 'RECEBER_CLIENTE')}
                  className="py-1.5 px-2 text-2xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                  <span>Receber Casco</span>
                </button>

                <button
                  onClick={() => handleOpenAction(item, 'ENVIO_FABRICA')}
                  className="py-1.5 px-2 text-2xs font-bold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                >
                  <Truck className="w-3 h-3 text-amber-400" />
                  <span>Enviar Fábrica</span>
                </button>

                <button
                  onClick={() => handleOpenAction(item, 'AVARIA_VASILHAME')}
                  className="py-1.5 px-2 text-2xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-md hover:bg-rose-100 transition-colors flex items-center justify-center gap-1"
                >
                  <AlertOctagon className="w-3 h-3" />
                  <span>Quebra Casco</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal de Ação Operacional de Vasilhame */}
      {modalAction && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {modalAction === 'RECEBER_CLIENTE' && 'Receber Vasilhames de Cliente'}
                  {modalAction === 'ENVIO_FABRICA' && 'Remessa de Vasilhames para Cervejaria'}
                  {modalAction === 'AVARIA_VASILHAME' && 'Registrar Quebra / Descarte de Casco'}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedItem.name} ({selectedItem.code})
                </p>
              </div>
              <button 
                onClick={() => setModalAction(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmAction} className="p-5 space-y-4">
              
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Quantidade ({selectedItem.capacity})
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-2xs text-slate-500 mt-1 block">
                  {modalAction === 'ENVIO_FABRICA' && `Saldo disponível para envio: ${selectedItem.emptyStock} un.`}
                  {modalAction === 'RECEBER_CLIENTE' && 'Vasilhames recebidos entram no saldo de vazios do pátio.'}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Conferente / Responsável
                </label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Observações / Placa do Caminhão / Cliente
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Carreta Ambev Placa ABC-1234 ou Bar Central"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAction(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Confirmar Registro</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
