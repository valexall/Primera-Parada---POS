import React, { useEffect, useState, useCallback } from 'react';
import { Order, Receipt as ReceiptType, SelectedItem } from '../types';
import { orderService } from '../services/orderService';
import { financeService } from '../services/financeService';
import { receiptService } from '../services/receiptService';
import { supabaseClient } from '../services/supabaseClient';
import { DollarSignIcon, CreditCardIcon, ReceiptIcon, ArrowLeftIcon, CheckCircle2Icon, CircleIcon, UtensilsIcon, PackageIcon, AlertCircleIcon, XIcon, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../components/ui/Loader';
import Receipt from '../components/ui/Receipt';

const CashierPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Yape'>('Efectivo');
  const [needReceipt, setNeedReceipt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentReceipt, setCurrentReceipt] = useState<ReceiptType | null>(null);
   
  const [showMobilePayment, setShowMobilePayment] = useState(false);
   
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [isPartialPayment, setIsPartialPayment] = useState(false);
   
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);

  const loadOrdersToPay = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const allOrders = await orderService.getByStatus('Entregado');
      setOrders(allOrders);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);
 
  useEffect(() => {
    loadOrdersToPay(true);
     
    return () => {
      toast.dismiss();
    };
  }, [loadOrdersToPay]);
 
  useEffect(() => {
    const channel = supabaseClient
      .channel('cashier-orders')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders'
      }, async (payload) => {
        try {
          const updatedData = payload.new;
          const oldStatus = payload.old.status;
           
          if (updatedData.status === 'Entregado' && oldStatus !== 'Entregado') {
            const fullOrder = await orderService.getById(updatedData.id);
            setOrders(current => { 
              const exists = current.some(o => o.id === fullOrder.id);
              if (exists) return current;
              return [fullOrder, ...current];
            });
          } 
          else if (updatedData.status !== 'Entregado' && oldStatus === 'Entregado') {
            setOrders(current => current.filter(o => o.id !== updatedData.id));
             
            if (selectedOrder?.id === updatedData.id) {
              setSelectedOrder(null);
              setShowMobilePayment(false);
            }
          }
        } catch (error) {
          console.error('Error handling realtime update in cashier:', error);
        }
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [selectedOrder]);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowMobilePayment(true);  
    setSelectedItems(new Map());
    setIsPartialPayment(false);
  };

  const calculateTotal = (order: Order) => {
    return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateSelectedTotal = () => {
    if (!selectedOrder || !isPartialPayment) {
      return selectedOrder ? calculateTotal(selectedOrder) : 0;
    }

    let total = 0;
    selectedOrder.items.forEach(item => {
      const selectedQty = selectedItems.get(item.menuItemId) || 0;
      if (selectedQty > 0) {
        total += item.price * selectedQty;
      }
    });
    return total;
  };

  const toggleItemSelection = (menuItemId: string, maxQuantity: number) => {
    setSelectedItems(prev => {
      const newMap = new Map(prev);
      const currentQty = newMap.get(menuItemId) || 0;
      
      if (currentQty === 0) { 
        newMap.set(menuItemId, 1);
      } else if (currentQty < maxQuantity) { 
        newMap.set(menuItemId, currentQty + 1);
      } else { 
        newMap.delete(menuItemId);
      }
      
      return newMap;
    });
  };

  const hasSelectedItems = () => {
    return Array.from(selectedItems.values()).some(qty => qty > 0);
  };

  const handleProcessPayment = () => {
    if (!selectedOrder) return;
 
    if (isPartialPayment && !hasSelectedItems()) {
      toast.error('Selecciona al menos un item para cobrar', {
        duration: 3000,
        style: {
          padding: '1rem 1.5rem',
          fontSize: '1rem',
        }
      });
      return;
    }
 
    setShowPaymentConfirmation(true);
  };

  const executePayment = async () => {
    if (!selectedOrder) return;
 
    toast.dismiss();
    
    let toastId: string | undefined;
    
    try {
      toastId = toast.loading('Procesando transacción...', {
        style: {
          padding: '1rem 1.5rem',
          fontSize: '1rem',
        }
      });
      
      let sale;
      
      if (isPartialPayment && hasSelectedItems()) { 
        const selectedItemsArray: SelectedItem[] = [];
        selectedItems.forEach((quantity, menuItemId) => {
          if (quantity > 0) {
            selectedItemsArray.push({ menuItemId, quantity });
          }
        });
 
        sale = await financeService.createPartialSale({
          orderId: selectedOrder.id,
          paymentMethod,
          isReceiptIssued: needReceipt,
          selectedItems: selectedItemsArray
        });
      } else { 
        sale = await financeService.createSale(
          selectedOrder.id,
          calculateTotal(selectedOrder),
          paymentMethod,
          needReceipt
        );
      }
       
      toast.dismiss(toastId);
       
      if (needReceipt && sale.id) {
        try {
          const receipt = await receiptService.getReceipt(sale.id);
          setCurrentReceipt(receipt);
          toast.success('¡Pago registrado! Imprimiendo recibo... 🧾', {
            duration: 2000,
            style: {
              padding: '1rem 1.5rem',
              fontSize: '1rem',
            }
          });
        } catch (error) {
          console.error('Error al obtener recibo:', error);
          toast.success('¡Pago registrado! (Error al generar recibo)', {
            duration: 2000,
            style: {
              padding: '1rem 1.5rem',
              fontSize: '1rem',
            }
          });
        }
      } else {
        const message = isPartialPayment 
          ? '¡Pago parcial registrado! 💰' 
          : '¡Pago registrado exitosamente! 💰';
        toast.success(message, {
          duration: 2000,
          style: {
            padding: '1rem 1.5rem',
            fontSize: '1rem',
          }
        });
      }
       
      setSelectedOrder(null);
      setShowMobilePayment(false);
      setNeedReceipt(false);
      setSelectedItems(new Map());
      setIsPartialPayment(false);
      
      // Recargar órdenes
      await loadOrdersToPay();
      
    } catch (error) { 
      if (toastId) {
        toast.dismiss(toastId);
      }
      toast.error('Error al registrar el pago', {
        duration: 3000,
        style: {
          padding: '1rem 1.5rem',
          fontSize: '1rem',
        }
      });
      console.error('Error en executePayment:', error);
    }
  };

  return (
    <>
      <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-6 relative">
      
      {/* --- COLUMNA IZQUIERDA: LISTA DE MESAS --- 
          Lógica CSS: Si estamos en modo pago móvil, ocultamos esta columna (hidden), 
          pero en desktop (md:flex) siempre se muestra.
      */}
      <div className={`flex-1 overflow-hidden flex-col ${showMobilePayment ? 'hidden md:flex' : 'flex'}`}>
        <header className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Caja / Cobros</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Mesas con pedidos entregados pendientes de pago</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-20 md:pb-0">
          {loading && <SkeletonCard />}
          
          {!loading && orders.length === 0 && (
            <div className="h-40 flex items-center justify-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              No hay mesas por cobrar
            </div>
          )}

          {!loading && orders.map(order => (
            <div 
              key={order.id}
              onClick={() => handleSelectOrder(order)}
              className={`
                group p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden
                ${selectedOrder?.id === order.id 
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 shadow-md ring-1 ring-amber-500' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-sm'}
              `}
            >
              <div className="flex justify-between items-center mb-2">
                {order.orderType === 'Dine-In' ? (
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 ${selectedOrder?.id === order.id ? 'bg-amber-500 text-white' : 'bg-slate-800 dark:bg-amber-600 text-white'}`}>
                    <UtensilsIcon size={16} />
                    Mesa {order.tableNumber || '?'}
                  </span>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 ${selectedOrder?.id === order.id ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'}`}>
                      <PackageIcon size={16} />
                      Para Llevar
                    </span>
                    {order.customerName && (
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                        {order.customerName}
                      </span>
                    )}
                  </div>
                )}
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">#{order.id.slice(-4)}</span>
              </div>
              
              {/* Vista previa de items */}
              <div className="my-3 space-y-1.5 border-t border-slate-200 dark:border-slate-700 pt-3">
                {order.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${selectedOrder?.id === order.id ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                        {item.quantity}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                        {item.menuItemName}
                      </span>
                    </div>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold ml-2 flex-shrink-0">
                      S/. {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 italic pt-1">
                    +{order.items.length - 3} item{order.items.length - 3 !== 1 ? 's' : ''} más...
                  </div>
                )}
              </div>

              <div className="flex justify-between items-end">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 transition-colors">
                  S/. {calculateTotal(order).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- COLUMNA DERECHA: PROCESAR PAGO --- 
          Lógica CSS: Si NO estamos en modo pago móvil, ocultamos esta columna en móvil (hidden),
          pero si showMobilePayment es true, la mostramos (flex). En desktop siempre visible (md:flex).
      */}
      <div className={`md:w-96 bg-white dark:bg-slate-800 rounded-3xl md:shadow-xl md:border border-slate-100 dark:border-slate-700 flex-col overflow-hidden shrink-0 ${showMobilePayment ? 'flex w-full h-full fixed inset-0 z-50 md:static md:h-auto rounded-none md:rounded-3xl' : 'hidden md:flex'}`}>
        {selectedOrder ? (
          <>
            <div className="p-5 sm:p-6 bg-slate-900 dark:bg-amber-700 text-white relative">
              {/* Botón Volver (Solo Móvil) */}
              <button 
                onClick={() => setShowMobilePayment(false)}
                className="md:hidden absolute top-5 left-4 p-2.5 bg-slate-800 dark:bg-amber-600 rounded-xl hover:bg-slate-700 dark:hover:bg-amber-800 active:scale-95 transition-all"
              >
                <ArrowLeftIcon size={22} className="text-white"/>
              </button>

              <div className="pl-14 md:pl-0">
                <h2 className="text-xs sm:text-sm font-bold text-slate-400 dark:text-amber-100 uppercase tracking-wider mb-1">
                  {isPartialPayment ? 'Total Seleccionado' : 'Total a Cobrar'}
                </h2>
                <div className="text-3xl sm:text-4xl font-bold">S/. {calculateSelectedTotal().toFixed(2)}</div>
                <div className="text-sm text-slate-400 dark:text-amber-100 mt-2 flex items-center gap-2">
                  {selectedOrder.orderType === 'Dine-In' ? (
                    <>
                      <UtensilsIcon size={16} />
                      Mesa {selectedOrder.tableNumber}
                    </>
                  ) : (
                    <>
                      <PackageIcon size={16} />
                      Para Llevar {selectedOrder.customerName && `- ${selectedOrder.customerName}`}
                    </>
                  )}
                  <span>•</span>
                  <span>
                    {isPartialPayment 
                      ? `${Array.from(selectedItems.values()).reduce((a, b) => a + b, 0)} items seleccionados` 
                      : `${selectedOrder.items.length} items`}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 flex-1 overflow-y-auto">
              {/* Toggle para Pago Parcial */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isPartialPayment} 
                    onChange={(e) => {
                      setIsPartialPayment(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedItems(new Map());
                      }
                    }} 
                    className="w-5 h-5 accent-blue-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Cobro Por Separado</span>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Selecciona items individuales para cobrar</p>
                  </div>
                </label>
              </div>

              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 text-sm uppercase">Detalle</h3>
              <ul className="space-y-3 mb-6">
                {selectedOrder.items.map((item, idx) => {
                  const selectedQty = selectedItems.get(item.menuItemId) || 0;
                  const isSelected = selectedQty > 0;
                  
                  return (
                    <li 
                      key={idx} 
                      className={`flex justify-between text-sm items-center border-b pb-2 last:border-0 transition-all ${
                        isPartialPayment 
                          ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded-lg -mx-2' 
                          : ''
                      } ${
                        isSelected 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                          : 'border-slate-50 dark:border-slate-700'
                      }`}
                      onClick={() => isPartialPayment && toggleItemSelection(item.menuItemId, item.quantity)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {isPartialPayment && (
                          <div className="shrink-0">
                            {isSelected ? (
                              <CheckCircle2Icon size={20} className="text-green-600" />
                            ) : (
                              <CircleIcon size={20} className="text-slate-300" />
                            )}
                          </div>
                        )}
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-500 dark:text-slate-400">
                              {isPartialPayment && isSelected ? `${selectedQty}/` : ''}{item.quantity}x
                            </span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{item.menuItemName}</span>
                          </div>
                          {isPartialPayment && isSelected && selectedQty < item.quantity && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                              Toca para seleccionar más
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`font-bold ${isSelected ? 'text-green-700 dark:text-green-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        S/. {isPartialPayment && isSelected 
                          ? (item.price * selectedQty).toFixed(2) 
                          : (item.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 text-sm uppercase">Método de Pago</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('Efectivo')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'Efectivo' ? 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400 ring-2 ring-green-500 ring-offset-2 font-bold scale-105' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95'}`}
                >
                  <DollarSignIcon size={28} /> 
                  <span className="text-sm sm:text-base font-bold">Efectivo</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('Yape')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'Yape' ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-400 ring-2 ring-purple-500 ring-offset-2 font-bold scale-105' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95'}`}
                >
                  <CreditCardIcon size={28} /> 
                  <span className="text-sm sm:text-base font-bold">Yape</span>
                </button>
              </div>

              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors mb-4">
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 ${needReceipt ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                  {needReceipt && <ReceiptIcon size={16} />}
                </div>
                <input type="checkbox" checked={needReceipt} onChange={(e) => setNeedReceipt(e.target.checked)} className="hidden" />
                <span className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300">Emitir Boleta / Recibo</span>
              </label>
            </div>

            <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
              <button
                onClick={handleProcessPayment}
                className="w-full py-4 sm:py-5 bg-amber-500 text-white rounded-xl font-bold text-base sm:text-lg hover:bg-amber-600 shadow-xl shadow-amber-200 dark:shadow-amber-900/50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <DollarSignIcon size={24} /> CONFIRMAR PAGO
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <DollarSignIcon size={32} />
            </div>
            <p className="font-medium">Selecciona una mesa<br/>para procesar el cobro</p>
          </div>
        )}
      </div>
    </div>

    {/* Modal de Recibo */}
    {currentReceipt && (
      <Receipt 
        receipt={currentReceipt} 
        onClose={() => setCurrentReceipt(null)} 
      />
    )}

    {/* Modal de Confirmación de Pago */}
    {showPaymentConfirmation && selectedOrder && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div 
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icono y Encabezado */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <AlertCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Confirmar Pago {isPartialPayment ? 'Parcial' : 'Completo'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                ¿Deseas confirmar el pago de esta orden?
              </p>
            </div>
          </div>

          {/* Detalles del Pago */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Total a cobrar:</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                S/. {calculateSelectedTotal().toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Método de pago:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {paymentMethod}
              </span>
            </div>
            {isPartialPayment && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Items seleccionados:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {Array.from(selectedItems.values()).reduce((a, b) => a + b, 0)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Emitir recibo:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {needReceipt ? 'Sí' : 'No'}
              </span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowPaymentConfirmation(false)}
              className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setShowPaymentConfirmation(false);
                executePayment();
              }}
              className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 shadow-lg shadow-green-200 dark:shadow-green-900/50 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2Icon size={20} />
              Confirmar
            </button>
          </div>

          {/* Botón de Cerrar */}
          <button
            onClick={() => setShowPaymentConfirmation(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <XIcon size={20} />
          </button>
        </div>
      </div>
    )}
  </>
  );
};


export default CashierPage;
