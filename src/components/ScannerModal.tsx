import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  CameraOff, 
  Keyboard, 
  Search, 
  Check, 
  AlertTriangle, 
  ArrowDownRight, 
  ArrowUpRight, 
  AlertOctagon, 
  Volume2, 
  VolumeX, 
  Barcode, 
  Sparkles,
  Info
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Product, MovementType, DamageReason } from '../types/inventory';
import { processStockMovement } from '../services/storageService';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialProductId?: string;
  defaultMode?: MovementType;
  onMovementProcessed: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  initialProductId,
  defaultMode = 'ENTRADA',
  onMovementProcessed,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [operationMode, setOperationMode] = useState<MovementType>(defaultMode);
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Campos do formulário de Entrada
  const [quantity, setQuantity] = useState<number>(1);
  const [lotNumber, setLotNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [supplierOrClient, setSupplierOrClient] = useState('');
  const [damageReason, setDamageReason] = useState<DamageReason>('Quebra no manuseio');
  const [notes, setNotes] = useState('');
  const [operatorName, setOperatorName] = useState('Operador Logístico (Turno A)');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'reader-barcode-viewport';

  // Áudio Sintetizador para Beep de Bipador
  const playBeep = (isSuccess: boolean = true) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSuccess ? 1800 : 350, audioCtx.currentTime);
      if (isSuccess) {
        osc.frequency.exponentialRampToValueAtTime(2400, audioCtx.currentTime + 0.08);
      }
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      // AudioContext not allowed or blocked
    }
  };

  // Carregar produto inicial se fornecido
  useEffect(() => {
    if (initialProductId) {
      const found = products.find(p => p.id === initialProductId);
      if (found) {
        handleSelectProduct(found);
      }
    }
    if (defaultMode) {
      setOperationMode(defaultMode);
    }
  }, [initialProductId, defaultMode, products]);

  // Limpar câmera ao fechar
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setFeedbackMessage(null);
    }
  }, [isOpen]);

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setCostPrice(p.costPrice);
    setQuantity(1);
    // Sugestão de lote padrão com data atual
    const today = new Date();
    const dStr = today.toISOString().slice(2, 10).replace(/-/g, '');
    setLotNumber(`L-${dStr}`);

    // Data de validade padrão: 6 meses para frente
    const defaultExp = new Date();
    defaultExp.setMonth(defaultExp.getMonth() + 6);
    setExpiryDate(defaultExp.toISOString().slice(0, 10));

    playBeep(true);
  };

  const handleBarcodeFound = (barcode: string) => {
    const clean = barcode.trim();
    const found = products.find(p => p.barcode === clean || p.sku.toLowerCase() === clean.toLowerCase());
    if (found) {
      handleSelectProduct(found);
      setFeedbackMessage({ text: `Produto identificado: ${found.name}`, type: 'success' });
    } else {
      playBeep(false);
      setFeedbackMessage({ 
        text: `Código "${clean}" não cadastrado. Cadastre no módulo de estoque.`, 
        type: 'error' 
      });
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);

    try {
      const scanner = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.777778
        },
        (decodedText) => {
          handleBarcodeFound(decodedText);
        },
        () => {
          // Frame sem leitura
        }
      );
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError('Permissão de câmera negada ou câmera não disponível neste dispositivo.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isCameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping camera:', e);
      }
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeFound(manualCode);
    setManualCode('');
  };

  const handleProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (quantity <= 0) {
      setFeedbackMessage({ text: 'A quantidade deve ser maior que zero.', type: 'error' });
      return;
    }

    const res = processStockMovement({
      productId: selectedProduct.id,
      type: operationMode,
      quantity,
      lotNumber: operationMode === 'ENTRADA' ? lotNumber : undefined,
      expiryDate: operationMode === 'ENTRADA' ? expiryDate : undefined,
      costPrice: operationMode === 'ENTRADA' ? costPrice : undefined,
      reason: operationMode === 'PERDA_AVARIA' ? damageReason : undefined,
      supplierOrClient,
      responsibleUser: operatorName,
      notes
    });

    if (res.success) {
      playBeep(true);
      setFeedbackMessage({ 
        text: `Sucesso! Movimentação de ${operationMode} (${quantity} ${selectedProduct.unit}) registrada.`, 
        type: 'success' 
      });
      onMovementProcessed();
      // Atualiza produto selecionado com novo saldo
      const updated = products.find(p => p.id === selectedProduct.id);
      if (updated) {
        setSelectedProduct({ ...updated, currentStock: res.movement?.newStock ?? updated.currentStock });
      }
      // Reset campos
      setNotes('');
    } else {
      playBeep(false);
      setFeedbackMessage({ text: res.error || 'Erro ao processar movimentação.', type: 'error' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl border border-slate-200 overflow-hidden">
        
        {/* Header do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Bipador & Baixa Rápida de Estoque
              </h3>
              <p className="text-xs text-slate-500">
                Leitura contínua por câmera, leitor óptico USB ou conferência manual
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Silenciar som do leitor' : 'Ativar som de bip'}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mensagem de Feedback Flutuante */}
        {feedbackMessage && (
          <div className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between ${
            feedbackMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' 
              : 'bg-red-50 text-red-800 border-b border-red-100'
          }`}>
            <span>{feedbackMessage.text}</span>
            <button onClick={() => setFeedbackMessage(null)} className="text-slate-500 hover:text-slate-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="p-6 space-y-6">
          
          {/* SEÇÃO 1: CÂMERA & ENTRADA DE CÓDIGO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Visualizador de Câmera */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                    Câmera do Dispositivo
                  </span>
                  {isCameraActive ? (
                    <button
                      onClick={stopCamera}
                      className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <CameraOff className="w-3 h-3" /> Desativar
                    </button>
                  ) : (
                    <button
                      onClick={startCamera}
                      className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
                    >
                      <Camera className="w-3 h-3" /> Ligar Câmera
                    </button>
                  )}
                </div>

                <div 
                  id={scannerContainerId} 
                  className={`w-full h-44 rounded-lg overflow-hidden flex items-center justify-center transition-all ${
                    isCameraActive ? 'bg-black' : 'bg-slate-200/60 border border-dashed border-slate-300'
                  }`}
                >
                  {!isCameraActive && (
                    <div className="text-center p-4">
                      <Barcode className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">
                        Câmera desligada para economizar bateria
                      </p>
                      <button
                        onClick={startCamera}
                        className="mt-2.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        Iniciar Leitor de Câmera
                      </button>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <p className="text-2xs text-red-600 mt-2 font-medium">
                    {cameraError}
                  </p>
                )}
              </div>

              <p className="text-2xs text-slate-400 mt-2 text-center">
                Aponte para o código de barras EAN-13 ou DUN-14 da caixa
              </p>
            </div>

            {/* Leitor Manual / Simulador Rápido */}
            <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <Keyboard className="w-3.5 h-3.5 text-slate-500" />
                  Bipador USB ou Digitação
                </span>

                <form onSubmit={handleManualSearch} className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Bipar ou digitar EAN-13 / SKU..."
                    className="flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Bipar
                  </button>
                </form>

                {/* Simulador rápido com botões de teste instantâneo */}
                <div>
                  <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Bipagem Rápida de Teste (Atalhos):
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                    {products.slice(0, 6).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleBarcodeFound(p.barcode)}
                        className={`p-1.5 text-left text-2xs rounded border transition-colors truncate ${
                          selectedProduct?.id === p.id 
                            ? 'border-amber-500 bg-amber-50 font-bold text-amber-900' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="block truncate font-semibold">{p.name}</span>
                        <span className="font-mono text-slate-400">{p.barcode}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-2xs text-slate-400">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Compatível com leitores óticos sem fio e USB (bip envia Enter automático).</span>
              </div>
            </div>

          </div>

          {/* SEÇÃO 2: DETALHES DO PRODUTO IDENTIFICADO */}
          {selectedProduct ? (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70">
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-2xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-wider">
                    {selectedProduct.category}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {selectedProduct.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    SKU: {selectedProduct.sku} · EAN: {selectedProduct.barcode} · Unidade: {selectedProduct.unit}
                  </p>
                </div>

                <div className="text-right font-mono bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-2xs text-slate-400 block font-sans">Saldo Atual</span>
                  <span className={`text-base font-bold ${
                    selectedProduct.currentStock <= selectedProduct.minStock ? 'text-red-600' : 'text-slate-900'
                  }`}>
                    {selectedProduct.currentStock} {selectedProduct.unit}
                  </span>
                  <span className="text-2xs text-slate-400 block">
                    Local: {selectedProduct.location.corridor} ({selectedProduct.location.shelf})
                  </span>
                </div>
              </div>

              {/* SELEÇÃO DO MODO DE OPERAÇÃO */}
              <div className="mt-4">
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Tipo de Operação:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOperationMode('ENTRADA')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      operationMode === 'ENTRADA'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Modo Entrada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOperationMode('SAIDA')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      operationMode === 'SAIDA'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Modo Saída / Venda</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOperationMode('PERDA_AVARIA')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      operationMode === 'PERDA_AVARIA'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Ajuste / Avaria</span>
                  </button>
                </div>
              </div>

              {/* FORMULÁRIO ESPECÍFICO CONFORME O MODO */}
              <form onSubmit={handleProcessSubmit} className="mt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Quantidade */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Quantidade ({selectedProduct.unit})
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  {/* Campos do Modo ENTRADA */}
                  {operationMode === 'ENTRADA' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Nº do Lote Recebido
                        </label>
                        <input
                          type="text"
                          value={lotNumber}
                          onChange={(e) => setLotNumber(e.target.value)}
                          placeholder="Ex: L-2410"
                          className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Data de Validade
                        </label>
                        <input
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Campos do Modo SAÍDA */}
                  {operationMode === 'SAIDA' && (
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Destino / Pedido / Cliente
                      </label>
                      <input
                        type="text"
                        value={supplierOrClient}
                        onChange={(e) => setSupplierOrClient(e.target.value)}
                        placeholder="Ex: Bar Estrela (Ped #1901) ou Rota Norte"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Campos do Modo PERDA / AVARIA */}
                  {operationMode === 'PERDA_AVARIA' && (
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-rose-700 block mb-1">
                        Motivo Específico da Avaria
                      </label>
                      <select
                        value={damageReason}
                        onChange={(e) => setDamageReason(e.target.value as DamageReason)}
                        className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="Quebra no manuseio">Quebra no manuseio</option>
                        <option value="Garrafa estourada por pressão">Garrafa estourada por pressão</option>
                        <option value="Vazamento ou lacre violado">Vazamento ou lacre violado</option>
                        <option value="Avaria no transporte/palete">Avaria no transporte/palete</option>
                        <option value="Produto vencido descartado">Produto vencido descartado</option>
                        <option value="Outro motivo">Outro motivo</option>
                      </select>
                    </div>
                  )}

                </div>

                {/* Linha 2: Fornecedor (Entrada) ou Observações */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {operationMode === 'ENTRADA' ? (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Fornecedor / Número da NF
                      </label>
                      <input
                        type="text"
                        value={supplierOrClient}
                        onChange={(e) => setSupplierOrClient(e.target.value)}
                        placeholder="Ex: Ambev Fabril Jundiaí - NF 44810"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  ) : null}

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Conferente / Responsável
                    </label>
                    <input
                      type="text"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Botão de confirmação */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Trocar Produto
                  </button>

                  <button
                    type="submit"
                    className={`px-5 py-2 text-xs font-bold text-white rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 ${
                      operationMode === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-700' :
                      operationMode === 'SAIDA' ? 'bg-blue-600 hover:bg-blue-700' :
                      'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirmar {operationMode === 'ENTRADA' ? 'Recebimento' : operationMode === 'SAIDA' ? 'Baixa' : 'Avaria'}</span>
                  </button>
                </div>

              </form>

            </div>
          ) : (
            <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 font-medium">
                Nenhum produto selecionado. Bipe um código com a câmera ou use o leitor manual acima.
              </p>
            </div>
          )}

        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-3 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between text-2xs text-slate-500">
          <span>DepósitoFlow Barcode Engine v1.0</span>
          <span>EAN-13 · DUN-14 · QR-Code</span>
        </div>

      </div>
    </div>
  );
};
