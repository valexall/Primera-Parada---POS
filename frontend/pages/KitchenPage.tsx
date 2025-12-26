import React, { useEffect, useState, useCallback } from 'react';
import { ClockIcon, CheckCircleIcon, SoupIcon, BellIcon } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { orderService } from '../services/orderService';
import { supabaseClient } from '../services/supabaseClient';
import { SkeletonCard } from '../components/ui/Loader'; // <--- Skeletons

const KitchenPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'Todos'>('Todos');
  const [isLoading, setIsLoading] = useState(true); // Estado de carga inicial

  const loadOrders = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      if (filter === 'Todos') {
        const allOrders = await orderService.getByStatus();
        setOrders(allOrders);
      } else {
        const filteredOrders = await orderService.getByStatus(filter);
        setOrders(filteredOrders);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [filter]);

  // Carga inicial (muestra skeleton)
  useEffect(() => {
    loadOrders(true);
  }, [loadOrders]);

  // Realtime (actualización silenciosa)
  useEffect(() => {
    const channel = supabaseClient
      .channel('kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders(false);
      })
      .subscribe();
    return () => { supabaseClient.removeChannel(channel); };
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistic Update: Actualizar UI antes que el servidor
    setOrders(current => current.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    await orderService.updateStatus(orderId, newStatus);
    loadOrders(false);
  };

  const getCardStyle = (status: OrderStatus) => {
    switch (status) {
      case 'Pendiente': return 'bg-white dark:bg-slate-800 border-l-[6px] border-amber-500 shadow-md';
      case 'Listo': return 'bg-green-50 dark:bg-green-900/20 border-l-[6px] border-green-500 shadow-sm opacity-90';
      case 'Entregado': return 'bg-slate-100 dark:bg-slate-900 border-l-[6px] border-slate-300 dark:border-slate-700 opacity-60';
      default: return 'bg-white dark:bg-slate-800';
    }
  };

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <SoupIcon className="text-amber-500" /> Pantalla de Cocina
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gestión de pedidos en tiempo real</p>
        </div>
        
        <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl">
          {(['Todos', 'Pendiente', 'Listo', 'Entregado'] as const).map(status => (
            <button 
              key={status} 
              onClick={() => setFilter(status)} 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                filter === status ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* ESTADO DE CARGA: Skeletons */}
        {isLoading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {/* CONTENIDO REAL */}
        {!isLoading && orders.map(order => (
          <div key={order.id} className={`rounded-2xl p-5 transition-all relative animate-in fade-in zoom-in duration-300 ${getCardStyle(order.status)}`}>
            
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100/50 dark:border-slate-700/50">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="bg-slate-800 dark:bg-amber-600 text-white px-3 py-1 rounded-lg text-xl font-bold shadow-lg shadow-slate-300 dark:shadow-amber-900/50">
                    Mesa {order.tableNumber || '?'}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">#{order.id.slice(-4)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-2">
                  <ClockIcon size={14} />
                  {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
              {order.status === 'Pendiente' && <BellIcon className="text-amber-500 animate-pulse" />}
            </div>

            <div className="space-y-2 mb-6">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start p-2 rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex-1">
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-lg block leading-tight">
                      {item.menuItemName}
                    </span>
                    {item.notes && (
                      <span className="text-sm text-red-500 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/30 px-1 rounded block mt-1">
                         * {item.notes}
                      </span>
                    )}
                  </div>
                  <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold px-3 py-1 rounded-lg text-lg shadow-sm">
                    x{item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-auto">
              {order.status === 'Pendiente' && (
                <button 
                  onClick={() => handleStatusChange(order.id, 'Listo')}
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-transform active:scale-95"
                >
                  <CheckCircleIcon size={20} /> LISTO PARA SERVIR
                </button>
              )}
              {order.status === 'Listo' && (
                <button 
                  onClick={() => handleStatusChange(order.id, 'Entregado')}
                  className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 font-bold transition-transform active:scale-95"
                >
                  MARCAR ENTREGADO
                </button>
              )}
            </div>
          </div>
        ))}
        
        {!isLoading && orders.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <SoupIcon className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-xl font-medium">No hay pedidos pendientes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenPage;