import React, { useEffect, useState } from 'react';
import { ClockIcon, CheckCircleIcon } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { orderService } from '../services/orderService';
const KitchenPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'Todos'>('Todos');
  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [filter]);
  const loadOrders = async () => {
    if (filter === 'Todos') {
      const allOrders = await orderService.getByStatus();
      setOrders(allOrders);
    } else {
      const filteredOrders = await orderService.getByStatus(filter);
      setOrders(filteredOrders);
    }
  };
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await orderService.updateStatus(orderId, newStatus);
    loadOrders();
  };
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Listo':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Entregado':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Vista de Cocina</h2>
        <div className="flex gap-2">
          {(['Todos', 'Pendiente', 'Listo', 'Entregado'] as const).map(status => <button key={status} onClick={() => setFilter(status)} className={`px-4 py-2 rounded-md font-medium ${filter === status ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                {status}
              </button>)}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(order => <div key={order.id} className={`border-2 rounded-lg p-4 ${getStatusColor(order.status)}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">{order.id}</h3>
                <p className="text-sm flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {formatTime(order.timestamp)}
                </p>
              </div>
              <span className="px-3 py-1 bg-white rounded-full text-sm font-semibold">
                {order.status}
              </span>
            </div>
            <div className="space-y-2 mb-4">
              {order.items.map((item, index) => <div key={index} className="bg-white rounded p-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.menuItemName}</span>
                    <span className="text-gray-600">×{item.quantity}</span>
                  </div>
                  {item.notes && <p className="text-sm text-gray-600 mt-1">
                      Nota: {item.notes}
                    </p>}
                </div>)}
            </div>
            <div className="flex gap-2">
              {order.status === 'Pendiente' && <button onClick={() => handleStatusChange(order.id, 'Listo')} className="flex-1 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 mr-1" />
                  Marcar Listo
                </button>}
              {order.status === 'Listo' && <button onClick={() => handleStatusChange(order.id, 'Entregado')} className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
                  Marcar Entregado
                </button>}
            </div>
          </div>)}
      </div>
      {orders.length === 0 && <div className="text-center py-12 text-gray-500">
          No hay pedidos para mostrar
        </div>}
    </div>;
};
export default KitchenPage;