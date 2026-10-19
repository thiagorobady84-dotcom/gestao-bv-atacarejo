import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Barcode, MapPin, DollarSign, Package } from 'lucide-react';
import { Product, ProductCategory, UnitOfMeasure, ProductLot } from '../types/inventory';
import { loadProducts, saveProducts } from '../services/storageService';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSaved: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSaved
}) => {
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Cervejas');
  const [unit, setUnit] = useState<UnitOfMeasure>('Caixa c/ 24');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(20);
  const [maxStock, setMaxStock] = useState<number>(200);
  
  // Localização
  const [corridor, setCorridor] = useState('Rua A');
  const [shelf, setShelf] = useState('P-01');
  const [pallet, setPallet] = useState('PAL-01');

  // Lote Inicial (para novos produtos)
  const [initialLotNumber, setInitialLotNumber] = useState('');
  const [initialExpiryDate, setInitialExpiryDate] = useState('');

  // Retornável
  const [isReturnable, setIsReturnable] = useState(false);
  const [returnableTypeId, setReturnableTypeId] = useState('ret-600ml');

  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku);
      setBarcode(productToEdit.barcode);
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setUnit(productToEdit.unit);
      setCostPrice(productToEdit.costPrice);
      setSalePrice(productToEdit.salePrice);
      setCurrentStock(productToEdit.currentStock);
      setMinStock(productToEdit.minStock);
      setMaxStock(productToEdit.maxStock);
      setCorridor(productToEdit.location.corridor);
      setShelf(productToEdit.location.shelf);
      setPallet(productToEdit.location.pallet);
      setIsReturnable(!!productToEdit.isReturnable);
      setReturnableTypeId(productToEdit.returnableTypeId || 'ret-600ml');
    } else {
      // Defaults para novo produto
      setSku(`BEB-${Date.now().toString().slice(-4)}`);
      setBarcode(`789${Math.floor(1000000000 + Math.random() * 9000000000)}`);
      setName('');
      setCategory('Cervejas');
      setUnit('Caixa c/ 24');
      setCostPrice(50.0);
      setSalePrice(75.0);
      setCurrentStock(50);
      setMinStock(20);
      setMaxStock(250);
      setCorridor('Rua A');
      setShelf('P-01');
      setPallet('PAL-01');
      setInitialLotNumber(`L-${new Date().toISOString().slice(2, 7).replace('-', '')}`);
      
      const defExp = new Date();
      defExp.setMonth(defExp.getMonth() + 6);
      setInitialExpiryDate(defExp.toISOString().slice(0, 10));
      setIsReturnable(false);
    }
  }, [productToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const products = loadProducts();

    if (productToEdit) {
      // Atualização
      const index = products.findIndex(p => p.id === productToEdit.id);
      if (index !== -1) {
        products[index] = {
          ...products[index],
          sku,
          barcode,
          name,
          category,
          unit,
          costPrice,
          salePrice,
          currentStock,
          minStock,
          maxStock,
          location: { corridor, shelf, pallet },
          isReturnable,
          returnableTypeId: isReturnable ? returnableTypeId : undefined,
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      // Criação de novo produto
      const newLot: ProductLot = {
        id: `lot-${Date.now()}`,
        productId: `prod-${Date.now()}`,
        lotNumber: initialLotNumber || 'L-001',
        expiryDate: initialExpiryDate || new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
        quantity: currentStock,
        costPrice: costPrice,
        supplier: 'Cadastro Inicial',
        createdAt: new Date().toISOString()
      };

      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        sku,
        barcode,
        name,
        category,
        unit,
        costPrice,
        salePrice,
        currentStock,
        minStock,
        maxStock,
        lots: currentStock > 0 ? [newLot] : [],
        location: { corridor, shelf, pallet },
        isReturnable,
        returnableTypeId: isReturnable ? returnableTypeId : undefined,
        updatedAt: new Date().toISOString()
      };

      products.unshift(newProduct);
    }

    saveProducts(products);
    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Package className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {productToEdit ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <p className="text-xs text-slate-500">
                Especificações cadastrais, logística e parâmetros de shelf-life
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Linha 1: Identificadores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                SKU / Código Interno
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Código de Barras (EAN-13 / DUN-14)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
                <Barcode className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Linha 2: Nome */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Nome Completo do Produto
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cerveja Corona Extra Long Neck 330ml"
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          {/* Linha 3: Categoria e Unidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="Cervejas">Cervejas</option>
                <option value="Destilados">Destilados</option>
                <option value="Refrigerantes">Refrigerantes</option>
                <option value="Águas">Águas</option>
                <option value="Vinhos">Vinhos</option>
                <option value="Energéticos">Energéticos</option>
                <option value="Gelo & Carvão">Gelo & Carvão</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Unidade de Medida Logística
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitOfMeasure)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="Caixa c/ 24">Caixa c/ 24</option>
                <option value="Caixa c/ 12">Caixa c/ 12</option>
                <option value="Pack c/ 6">Pack c/ 6</option>
                <option value="Fardo c/ 12">Fardo c/ 12</option>
                <option value="Unidade">Unidade avulsa</option>
                <option value="Barril 50L">Barril 50L</option>
                <option value="Barril 30L">Barril 30L</option>
                <option value="Saco 5kg">Saco 5kg</option>
              </select>
            </div>
          </div>

          {/* Linha 4: Preço de Custo e Venda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Preço de Custo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Preço de Venda Sugerido (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-xs font-mono font-bold text-emerald-700 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Linha 5: Parâmetros de Estoque */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Estoque Inicial
              </label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Estoque Mínimo (Alerta)
              </label>
              <input
                type="number"
                min="1"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-xs font-mono border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Estoque Máximo (Teto)
              </label>
              <input
                type="number"
                min="1"
                value={maxStock}
                onChange={(e) => setMaxStock(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Linha 6: Localização no Galpão */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              Endereçamento Físico no Depósito
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <input
                  type="text"
                  value={corridor}
                  onChange={(e) => setCorridor(e.target.value)}
                  placeholder="Rua (Ex: Rua A)"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                  placeholder="Prateleira (Ex: P-02)"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={pallet}
                  onChange={(e) => setPallet(e.target.value)}
                  placeholder="Palete (Ex: PAL-08)"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Linha 7: Lote e Validade Inicial (se for novo produto) */}
          {!productToEdit && currentStock > 0 && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
              <div>
                <label className="text-xs font-semibold text-amber-900 block mb-1">
                  Nº Lote de Entrada Inicial
                </label>
                <input
                  type="text"
                  value={initialLotNumber}
                  onChange={(e) => setInitialLotNumber(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-amber-300 rounded-md bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-amber-900 block mb-1">
                  Data de Validade do Lote
                </label>
                <input
                  type="date"
                  value={initialExpiryDate}
                  onChange={(e) => setInitialExpiryDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-amber-300 rounded-md bg-white"
                />
              </div>
            </div>
          )}

          {/* Linha 8: Vasilhame Retornável */}
          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
            <div>
              <label className="text-xs font-bold text-slate-800 block cursor-pointer">
                Produto utiliza vasilhame / garrafa retornável?
              </label>
              <p className="text-2xs text-slate-500">
                Ativa controle de saldo de cascos vazios x cheios no pátio
              </p>
            </div>
            <input
              type="checkbox"
              checked={isReturnable}
              onChange={(e) => setIsReturnable(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
            />
          </div>

          {/* Footer Ações */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>Salvar Produto</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
