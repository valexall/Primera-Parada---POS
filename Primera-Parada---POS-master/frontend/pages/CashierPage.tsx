import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { orderService } from '../services/orderService';
import { financeService } from '../services/financeService';
import { DollarSignIcon, CreditCardIcon, FileTextIcon } from 'lucide-react';

const CashierPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Yape'>('Efectivo');
  const [needReceipt, setNeedReceipt] = useState(false);

  useEffect(() => {
    loadOrdersToPay();
  }, []);

  const loadOrdersToPay = async () => {
    // Filtramos solo las que están "Entregadas" (listas para cobrar)
    const allOrders = await orderService.getByStatus('Entregado'); 
    setOrders(allOrders);
  };

  const calculateTotal = (order: Order) => {
    return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleProcessPayment = async () => {
    if (!selectedOrder) return;

    if (window.confirm(`¿Confirmar pago de S/. ${calculateTotal(selectedOrder).toFixed(2)} por ${paymentMethod}?`)) {
      try {
        await financeService.createSale(
          selectedOrder.id,
          calculateTotal(selectedOrder),
          paymentMethod,
          needReceipt
        );
        alert('Pago registrado correctamente');
        setSelectedOrder(null);
        loadOrdersToPay(); // Recargar lista
      } catch (error) {
        alert('Error al registrar el pago');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Lista de Mesas por Cobrar */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Mesas por Cobrar</h2>
        <div className="space-y-3">
          {orders.length === 0 && <p className="text-gray-500">No hay mesas pendientes de cobro.</p>}
          {orders.map(order => (
            <div 
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedOrder?.id === order.id ? 'bg-amber-100 border-amber-500' : 'bg-white hover:bg-gray-50'}`}
            >
              <div className="flex justify-between font-bold">
                <span>{order.id}</span>
                <span>S/. {calculateTotal(order).toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {new Date(order.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel de Pago */}
      <div>
        {selectedOrder ? (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Procesar Pago</h3>
            
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h4 className="font-semibold mb-2">Detalle de Consumo:</h4>
              <ul className="text-sm space-y-1">
                {selectedOrder.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{item.quantity} x {item.menuItemName}</span>
                    <span>S/. {(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t flex justify-between font-bold text-lg text-amber-700">
                <span>Total a Pagar:</span>
                <span>S/. {calculateTotal(selectedOrder).toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block font-semibold mb-2">Método de Pago:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('Efectivo')}
                  className={`p-3 rounded border flex items-center justify-center gap-2 ${paymentMethod === 'Efectivo' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-white'}`}
                >
                  <DollarSignIcon size={20} /> Efectivo
                </button>
                <button
                  onClick={() => setPaymentMethod('Yape')}
                  className={`p-3 rounded border flex items-center justify-center gap-2 ${paymentMethod === 'Yape' ? 'bg-purple-100 border-purple-500 text-purple-800' : 'bg-white'}`}
                >
                  <CreditCardIcon size={20} /> Yape
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={needReceipt}
                  onChange={(e) => setNeedReceipt(e.target.checked)}
                  className="w-5 h-5 text-amber-600" 
                />
                <span className="flex items-center gap-2">
                  <FileTextIcon size={18} /> Emitir Boleta de Venta
                </span>
              </label>
            </div>

            <button
              onClick={handleProcessPayment}
              className="w-full py-4 bg-amber-600 text-white rounded-lg font-bold text-lg hover:bg-amber-700 shadow-md"
            >
              COBRAR Y CERRAR MESA
            </button>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-dashed border-2">
            Selecciona una mesa para cobrar
          </div>
        )}
      </div>
    </div>
  );
};

export default CashierPage;