import React, { useEffect, useState, useCallback } from 'react';
import { ClockIcon, CheckCircleIcon, SoupIcon } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { orderService } from '../services/orderService';
import { supabaseClient } from '../services/supabaseClient';

const KitchenPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'Todos'>('Todos');

  // Función memorizada para cargar órdenes
  const loadOrders = useCallback(async () => {
    try {
      if (filter === 'Todos') {
        const allOrders = await orderService.getByStatus();
        setOrders(allOrders);
      } else {
        const filteredOrders = await orderService.getByStatus(filter);
        setOrders(filteredOrders);
      }
    } catch (error) {
      console.error("Error cargando cocina:", error);
    }
  }, [filter]);

  // Carga inicial y al cambiar filtro
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Realtime: Suscripción a cambios en la tabla 'orders'
  useEffect(() => {
    const channel = supabaseClient
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Cambio en tiempo real detectado:', payload);
          loadOrders(); // Recargar lista automáticamente
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // Actualización optimista (opcional) o esperar al realtime
    await orderService.updateStatus(orderId, newStatus);
    // El realtime se encargará de refrescar, pero podemos llamar loadOrders por si acaso
    loadOrders();
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Pendiente': return 'bg-white border-l-4 border-yellow-400 shadow-md';
      case 'Listo': return 'bg-white border-l-4 border-green-500 shadow-md opacity-90';
      case 'Entregado': return 'bg-gray-100 border-l-4 border-gray-400 opacity-60 grayscale';
      default: return 'bg-white';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular tiempo transcurrido (opcional visual)
  const getTimeElapsed = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    return minutes;
  };

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <SoupIcon className="text-amber-600" /> 
          Monitor de Cocina
          <span className="text-xs font-normal bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse">
            ● En Vivo
          </span>
        </h2>
        
        <div className="flex bg-gray-200 p-1 rounded-lg">
          {(['Todos', 'Pendiente', 'Listo', 'Entregado'] as const).map(status => (
            <button 
              key={status} 
              onClick={() => setFilter(status)} 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === status 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map(order => (
          <div key={order.id} className={`rounded-lg p-5 transition-all ${getStatusColor(order.status)}`}>
            
            {/* CABECERA DE LA TARJETA */}
            <div className="flex justify-between items-start mb-4 border-b pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {/* NÚMERO DE MESA GRANDE */}
                  <span className="bg-gray-900 text-white px-3 py-1 rounded text-lg font-bold">
                    Mesa {order.tableNumber || '?'}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">#{order.id.slice(-4)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatTime(order.timestamp)}
                  </span>
                  <span className="text-xs font-semibold text-orange-600">
                     ({getTimeElapsed(order.timestamp)} min)
                  </span>
                </div>
              </div>
              
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                order.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'Listo' ? 'bg-green-100 text-green-800' :
                'bg-gray-200 text-gray-600'
              }`}>
                {order.status}
              </span>
            </div>
            
            {/* LISTA DE PLATOS */}
            <div className="space-y-3 mb-6">
              {order.items.map((item, index) => (
                <div key={index} className="flex flex-col bg-gray-50 p-2 rounded border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-lg">
                      {item.menuItemName}
                    </span>
                    <span className="bg-gray-200 text-gray-800 font-bold px-2 py-0.5 rounded text-sm">
                      x{item.quantity}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-sm text-red-600 italic mt-1 bg-red-50 p-1 rounded">
                      ⚠️ Nota: {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex gap-2 mt-auto">
              {order.status === 'Pendiente' && (
                <button 
                  onClick={() => handleStatusChange(order.id, 'Listo')}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center justify-center shadow-md transition-transform active:scale-95"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  MARCAR LISTO
                </button>
              )}
              {order.status === 'Listo' && (
                <button 
                  onClick={() => handleStatusChange(order.id, 'Entregado')}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition-transform active:scale-95"
                >
                  MARCAR ENTREGADO
                </button>
              )}
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed">
            <SoupIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-medium">No hay pedidos pendientes</p>
            <p className="text-sm">La cocina está tranquila...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenPage;