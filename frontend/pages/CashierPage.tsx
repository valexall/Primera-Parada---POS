import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { orderService } from '../services/orderService';
import { financeService } from '../services/financeService';
import { DollarSignIcon, CreditCardIcon, ReceiptIcon, ArrowLeftIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../components/ui/Loader';

const CashierPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Yape'>('Efectivo');
  const [needReceipt, setNeedReceipt] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // NUEVO ESTADO: Controla si mostramos el panel de cobro en móvil
  const [showMobilePayment, setShowMobilePayment] = useState(false);

  useEffect(() => {
    loadOrdersToPay();
    
    // Limpiar todos los toasts cuando el componente se desmonte
    return () => {
      toast.dismiss();
    };
  }, []);

  const loadOrdersToPay = async () => {
    setLoading(true);
    try {
      const allOrders = await orderService.getByStatus('Entregado');
      setOrders(allOrders);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowMobilePayment(true); // En móvil, pasamos a la vista de pago
  };

  const calculateTotal = (order: Order) => {
    return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleProcessPayment = () => {
    if (!selectedOrder) return;

    const total = calculateTotal(selectedOrder).toFixed(2);

    toast((t) => (
      <div className="flex flex-col gap-4 w-full max-w-md mx-auto p-2">
        <div className="text-center px-2">
          <p className="font-bold text-slate-800 text-lg sm:text-xl mb-2">Confirmar Cobro</p>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            ¿Cobrar <span className="font-bold text-slate-900 text-lg">S/. {total}</span> con{' '}
            <span className="font-bold text-amber-600">{paymentMethod}</span>?
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-700 rounded-xl text-base font-bold hover:bg-slate-200 active:scale-95 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              executePayment();
            }}
            className="flex-1 px-6 py-3.5 bg-green-500 text-white rounded-xl text-base font-bold hover:bg-green-600 shadow-lg shadow-green-200 active:scale-95 transition-all"
          >
            Sí, Cobrar
          </button>
        </div>
      </div>
    ), { 
      duration: Infinity,
      position: 'top-center',
      style: {
        background: 'white',
        padding: '1rem',
        borderRadius: '1rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        minWidth: '90vw',
        maxWidth: '500px',
      }
    });
  };

  const executePayment = async () => {
    if (!selectedOrder) return;

    // Limpiar cualquier toast previo
    toast.dismiss();
    
    let toastId: string | undefined;
    
    try {
      toastId = toast.loading('Procesando transacción...', {
        style: {
          padding: '1rem 1.5rem',
          fontSize: '1rem',
        }
      });
      
      await financeService.createSale(
        selectedOrder.id,
        calculateTotal(selectedOrder),
        paymentMethod,
        needReceipt
      );
      
      // Cerrar el toast de loading y mostrar éxito
      toast.dismiss(toastId);
      toast.success('¡Pago registrado exitosamente! 💰', {
        duration: 2000,
        style: {
          padding: '1rem 1.5rem',
          fontSize: '1rem',
        }
      });
      
      // Limpiar estado inmediatamente
      setSelectedOrder(null);
      setShowMobilePayment(false);
      
      // Recargar órdenes
      await loadOrdersToPay();
      
    } catch (error) {
      // Cerrar el toast de loading y mostrar error
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
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-6 relative">
      
      {/* --- COLUMNA IZQUIERDA: LISTA DE MESAS --- 
          Lógica CSS: Si estamos en modo pago móvil, ocultamos esta columna (hidden), 
          pero en desktop (md:flex) siempre se muestra.
      */}
      <div className={`flex-1 overflow-hidden flex-col ${showMobilePayment ? 'hidden md:flex' : 'flex'}`}>
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-slate-800">Caja / Cobros</h1>
          <p className="text-slate-500 text-sm">Mesas con pedidos entregados pendientes de pago</p>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-20 md:pb-0">
          {loading && <SkeletonCard />}
          
          {!loading && orders.length === 0 && (
            <div className="h-40 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
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
                  ? 'bg-amber-50 border-amber-500 shadow-md ring-1 ring-amber-500' 
                  : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm'}
              `}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`px-3 py-1 rounded-lg text-sm font-bold ${selectedOrder?.id === order.id ? 'bg-amber-500 text-white' : 'bg-slate-800 text-white'}`}>
                  Mesa {order.tableNumber || '?'}
                </span>
                <span className="text-xs text-slate-400 font-mono">#{order.id.slice(-4)}</span>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-xs text-slate-500">
                  {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className="text-xl font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
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
      <div className={`md:w-96 bg-white rounded-3xl md:shadow-xl md:border border-slate-100 flex-col overflow-hidden shrink-0 ${showMobilePayment ? 'flex w-full h-full fixed inset-0 z-50 md:static md:h-auto rounded-none md:rounded-3xl' : 'hidden md:flex'}`}>
        {selectedOrder ? (
          <>
            <div className="p-5 sm:p-6 bg-slate-900 text-white relative">
              {/* Botón Volver (Solo Móvil) */}
              <button 
                onClick={() => setShowMobilePayment(false)}
                className="md:hidden absolute top-5 left-4 p-2.5 bg-slate-800 rounded-xl hover:bg-slate-700 active:scale-95 transition-all"
              >
                <ArrowLeftIcon size={22} className="text-white"/>
              </button>

              <div className="pl-14 md:pl-0">
                <h2 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total a Cobrar</h2>
                <div className="text-3xl sm:text-4xl font-bold">S/. {calculateTotal(selectedOrder).toFixed(2)}</div>
                <div className="text-sm text-slate-400 mt-2">Mesa {selectedOrder.tableNumber} • {selectedOrder.items.length} items</div>
              </div>
            </div>

            <div className="p-5 sm:p-6 flex-1 overflow-y-auto">
              <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase">Detalle</h3>
              <ul className="space-y-3 mb-6">
                {selectedOrder.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between text-sm items-center border-b border-slate-50 pb-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-500 w-5">{item.quantity}x</span>
                      <span className="text-slate-700 font-medium">{item.menuItemName}</span>
                    </div>
                    <span className="text-slate-900 font-bold">S/. {(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase">Método de Pago</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('Efectivo')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'Efectivo' ? 'bg-green-50 border-green-500 text-green-700 ring-2 ring-green-500 ring-offset-2 font-bold scale-105' : 'border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95'}`}
                >
                  <DollarSignIcon size={28} /> 
                  <span className="text-sm sm:text-base font-bold">Efectivo</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('Yape')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'Yape' ? 'bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-500 ring-offset-2 font-bold scale-105' : 'border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95'}`}
                >
                  <CreditCardIcon size={28} /> 
                  <span className="text-sm sm:text-base font-bold">Yape</span>
                </button>
              </div>

              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors mb-4">
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 ${needReceipt ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300'}`}>
                  {needReceipt && <ReceiptIcon size={16} />}
                </div>
                <input type="checkbox" checked={needReceipt} onChange={(e) => setNeedReceipt(e.target.checked)} className="hidden" />
                <span className="text-sm sm:text-base font-medium text-slate-700">Emitir Boleta / Recibo</span>
              </label>
            </div>

            <div className="p-5 sm:p-6 border-t border-slate-100 bg-white">
              <button
                onClick={handleProcessPayment}
                className="w-full py-4 sm:py-5 bg-amber-500 text-white rounded-xl font-bold text-base sm:text-lg hover:bg-amber-600 shadow-xl shadow-amber-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <DollarSignIcon size={24} /> CONFIRMAR PAGO
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <DollarSignIcon size={32} />
            </div>
            <p className="font-medium">Selecciona una mesa<br/>para procesar el cobro</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashierPage;