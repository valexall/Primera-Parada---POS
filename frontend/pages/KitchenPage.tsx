import React, { useEffect, useState, useCallback } from 'react';
import { ClockIcon, CheckCircleIcon, SoupIcon, BellIcon, EditIcon, UtensilsIcon, PackageIcon, XIcon, AlertTriangleIcon } from 'lucide-react';
import { Order, OrderStatus, OrderItem } from '../types';
import { orderService } from '../services/orderService';
import { supabaseClient } from '../services/supabaseClient';
import { SkeletonCard } from '../components/ui/Loader';
import EditOrderModal from '../components/ui/EditOrderModal';
import toast from 'react-hot-toast';

const KitchenPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'Todos'>('Todos');
  const [isLoading, setIsLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

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

  const handleUpdateOrder = async (orderId: string, items: OrderItem[]) => {
    try {
      await orderService.updateItems(orderId, items);
      await loadOrders(false);
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      // Optimistic Update: Remover de la UI antes que el servidor
      setOrders(current => current.filter(o => o.id !== orderId));
      setDeletingOrderId(null);
      
      await orderService.delete(orderId);
      
      toast.success('Pedido cancelado exitosamente', {
        icon: '🗑️',
        duration: 2000,
      });
      
      await loadOrders(false);
    } catch (error: any) {
      // Revertir en caso de error
      await loadOrders(false);
      toast.error(error.response?.data?.error || 'Error al cancelar el pedido');
    }
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
                  {order.orderType === 'Dine-In' ? (
                    <>
                      <span className="bg-slate-800 dark:bg-amber-600 text-white px-3 py-1 rounded-lg text-xl font-bold shadow-lg shadow-slate-300 dark:shadow-amber-900/50 flex items-center gap-2">
                        <UtensilsIcon size={18} />
                        Mesa {order.tableNumber || '?'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded-lg text-xl font-bold shadow-lg shadow-blue-300 dark:shadow-blue-900/50 flex items-center gap-2">
                        <PackageIcon size={18} />
                        Para Llevar
                      </span>
                      {order.customerName && (
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {order.customerName}
                        </span>
                      )}
                    </>
                  )}
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
                <>
                  <button 
                    onClick={() => setDeletingOrderId(order.id)}
                    className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-200 dark:shadow-red-900/50 transition-transform active:scale-95"
                    title="Cancelar pedido"
                  >
                    <XIcon size={18} />
                  </button>
                  <button 
                    onClick={() => setEditingOrder(order)}
                    className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-transform active:scale-95"
                    title="Editar pedido"
                  >
                    <EditIcon size={18} />
                  </button>
                  <button 
                    onClick={() => handleStatusChange(order.id, 'Listo')}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 dark:shadow-green-900/50 transition-transform active:scale-95"
                  >
                    <CheckCircleIcon size={20} /> LISTO PARA SERVIR
                  </button>
                </>
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

      {/* Modal de Edición */}
      <EditOrderModal
        order={editingOrder!}
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        onSave={handleUpdateOrder}
      />

      {/* Modal de Confirmación de Eliminación */}
      {deletingOrderId && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
              <AlertTriangleIcon size={32} className="text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 text-center">
              ¿Cancelar este pedido?
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
              Esta acción no se puede deshacer. El pedido será eliminado permanentemente.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingOrderId(null)}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                No, mantener
              </button>
              <button
                onClick={() => handleDeleteOrder(deletingOrderId)}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200 dark:shadow-red-900/50"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenPage;