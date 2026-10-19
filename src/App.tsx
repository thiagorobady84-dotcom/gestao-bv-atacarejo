/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ProductList } from './components/ProductList';
import { ReturnablesManager } from './components/ReturnablesManager';
import { MovementsLog } from './components/MovementsLog';
import { ScannerModal } from './components/ScannerModal';
import { ProductFormModal } from './components/ProductFormModal';
import { SqlSchemaViewerModal } from './components/SqlSchemaViewerModal';
import { 
  loadProducts, 
  loadReturnables, 
  loadMovements, 
  resetInventoryToDefaults 
} from './services/storageService';
import { Product, ReturnableContainer, Movement, MovementType } from './types/inventory';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'returnables' | 'movements' | 'sql'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [returnables, setReturnables] = useState<ReturnableContainer[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  // Modais
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerProductId, setScannerProductId] = useState<string | undefined>(undefined);
  const [scannerDefaultMode, setScannerDefaultMode] = useState<MovementType>('ENTRADA');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Carregar dados na montagem
  const refreshAllData = () => {
    setProducts(loadProducts());
    setReturnables(loadReturnables());
    setMovements(loadMovements());
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleOpenScanner = (productId?: string, mode: MovementType = 'ENTRADA') => {
    setScannerProductId(productId);
    setScannerDefaultMode(mode);
    setIsScannerOpen(true);
  };

  const handleOpenProductModal = (product?: Product) => {
    setProductToEdit(product || null);
    setIsProductModalOpen(true);
  };

  const handleResetData = () => {
    if (window.confirm('Deseja restaurar o estoque inicial padrão com produtos e lotes demonstrativos?')) {
      resetInventoryToDefaults();
      refreshAllData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans">
      
      {/* Barra de Navegação Superior (Top Bar Contract) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScanner={() => handleOpenScanner()}
        products={products}
        returnables={returnables}
        movements={movements}
        onResetData={handleResetData}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'dashboard' && (
          <Dashboard
            products={products}
            movements={movements}
            returnables={returnables}
            onOpenScannerWithProduct={(id, mode) => handleOpenScanner(id, mode || 'ENTRADA')}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'inventory' && (
          <ProductList
            products={products}
            onOpenProductModal={handleOpenProductModal}
            onOpenScannerWithProduct={(id, mode) => handleOpenScanner(id, mode)}
          />
        )}

        {activeTab === 'returnables' && (
          <ReturnablesManager
            returnables={returnables}
            onDataChanged={refreshAllData}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsLog
            movements={movements}
            products={products}
            returnables={returnables}
          />
        )}

        {activeTab === 'sql' && (
          <SqlSchemaViewerModal />
        )}

      </main>

      {/* Rodapé Clean */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">DepósitoFlow</span>
            <span>·</span>
            <span>Sistema Especializado de Estoque para Depósito e Distribuidora de Bebidas</span>
          </div>
          <div className="text-2xs text-slate-400 font-mono">
            EAN-13 · DUN-14 · Shelf-Life FIFO · Relatórios XLSX/CSV
          </div>
        </div>
      </footer>

      {/* Modal de Bipador & Câmera */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        initialProductId={scannerProductId}
        defaultMode={scannerDefaultMode}
        onMovementProcessed={refreshAllData}
      />

      {/* Modal de Cadastro / Edição de Produto */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={productToEdit}
        onSaved={refreshAllData}
      />

    </div>
  );
}
