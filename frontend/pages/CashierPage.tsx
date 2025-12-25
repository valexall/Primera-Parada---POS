import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { orderService } from '../services/orderService';
import { financeService } from '../services/financeService';
import { DollarSignIcon, CreditCardIcon, FileTextIcon, ReceiptIcon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const CashierPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Yape'>('Efectivo');
  const [needReceipt, setNeedReceipt] = useState(false);

  useEffect(() => {
    loadOrdersToPay();
  }, []);

  const loadOrdersToPay = async () => {
    const allOrders = await orderService.getByStatus('Entregado'); 
    setOrders(allOrders);
  };

  const calculateTotal = (order: Order) => {
    return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleProcessPayment = async () => {
    if (!selectedOrder) return;

    if (window.confirm(`¿Cobrar S/. ${calculateTotal(selectedOrder).toFixed(2)}?`)) {
      try {
        await financeService.createSale(
          selectedOrder.id,
          calculateTotal(selectedOrder),
          paymentMethod,
          needReceipt
        );
        toast.success('¡Cobro registrado!');
        setSelectedOrder(null);
        loadOrdersToPay();
      } catch (error) {
        toast.error('Error al registrar pago');
      }
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-6">
      <Toaster />
      
      {/* --- COLUMNA IZQUIERDA: LISTA DE MESAS --- */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-slate-800">Caja / Cobros</h1>
          <p className="text-slate-500 text-sm">Mesas con pedidos entregados pendientes de pago</p>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {orders.length === 0 && (
            <div className="h-40 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              No hay mesas por cobrar
            </div>
          )}
          {orders.map(order => (
            <div 
              key={order.id}
              onClick={() => setSelectedOrder(order)}
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

      {/* --- COLUMNA DERECHA: PROCESAR PAGO --- */}
      <div className="md:w-96 bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col overflow-hidden">
        {selectedOrder ? (
          <>
            <div className="p-6 bg-slate-900 text-white">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total a Cobrar</h2>
              <div className="text-4xl font-bold">S/. {calculateTotal(selectedOrder).toFixed(2)}</div>
              <div className="text-sm text-slate-400 mt-2">Mesa {selectedOrder.tableNumber} • {selectedOrder.items.length} items</div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase">Detalle</h3>
              <ul className="space-y-3 mb-6">
                {selectedOrder.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between text-sm items-center border-b border-slate-50 pb-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-500 w-4">{item.quantity}x</span>
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
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${paymentMethod === 'Efectivo' ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500 font-bold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  <DollarSignIcon size={24} /> Efectivo
                </button>
                <button
                  onClick={() => setPaymentMethod('Yape')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${paymentMethod === 'Yape' ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500 font-bold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  <CreditCardIcon size={24} /> Yape
                </button>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors mb-4">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${needReceipt ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300'}`}>
                  {needReceipt && <ReceiptIcon size={14} />}
                </div>
                <input type="checkbox" checked={needReceipt} onChange={(e) => setNeedReceipt(e.target.checked)} className="hidden" />
                <span className="text-sm font-medium text-slate-700">Emitir Boleta / Recibo</span>
              </label>
            </div>

            <div className="p-6 border-t border-slate-100">
              <button
                onClick={handleProcessPayment}
                className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-lg hover:bg-amber-600 shadow-lg shadow-amber-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <DollarSignIcon size={20} /> CONFIRMAR PAGO
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