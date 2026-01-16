import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ClockIcon, CheckCircleIcon, SoupIcon, BellIcon, EditIcon, UtensilsIcon, PackageIcon, XIcon, AlertTriangleIcon, BarChart3Icon, TrendingUpIcon, Check, ChefHat } from 'lucide-react';
import { Order, OrderStatus, OrderItem } from '../types';
import { orderService } from '../services/orderService';
import { menuService } from '../services/menuService';
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
  const [dailyStats, setDailyStats] = useState<{ name: string; quantity: number }[]>([]);
  const [showStats, setShowStats] = useState(false); 
  const lastLocalUpdateRef = useRef<{ orderId: string; timestamp: number } | null>(null);

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
 
  useEffect(() => {
    loadOrders(true);
    loadDailyStats();
  }, [loadOrders]);
 
  useEffect(() => {
    const channel = supabaseClient
      .channel('kitchen-orders')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders' 
      }, async (payload) => {
        try { 
          const newOrder = await orderService.getById(payload.new.id);
           
          const shouldDisplay = filter === 'Todos' || newOrder.status === filter;
          
          if (shouldDisplay) {
            setOrders(current => { 
              const exists = current.some(o => o.id === newOrder.id);
              if (exists) return current;
              return [newOrder, ...current];
            });
          } 
          if (newOrder.status === 'Entregado') {
            loadDailyStats();
          }
        } catch (error) {
          console.error('Error handling INSERT event:', error);
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders' 
      }, async (payload) => {
        try {
          const updatedData = payload.new;
          const previousStatus = payload.old.status;
          
          setOrders(current => {
            const existingOrder = current.find(o => o.id === updatedData.id);
            const shouldDisplay = filter === 'Todos' || updatedData.status === filter;
            
            if (existingOrder) {
              if (shouldDisplay) { 
                return current.map(o => 
                  o.id === updatedData.id 
                    ? { 
                        ...o,
                        status: updatedData.status,
                        tableNumber: updatedData.table_number,
                        orderType: updatedData.order_type || 'Dine-In',
                        customerName: updatedData.customer_name,
                        timestamp: updatedData.timestamp
                      }
                    : o
                );
              } else { 
                return current.filter(o => o.id !== updatedData.id);
              }
            } else if (shouldDisplay) { 
              orderService.getById(updatedData.id).then(fullOrder => {
                setOrders(curr => [fullOrder, ...curr]);
              }).catch(err => console.error('Error fetching updated order:', err));
            }
            
            return current;
          }); 
          if (updatedData.status === 'Entregado' && previousStatus !== 'Entregado') {
            loadDailyStats();
          }
        } catch (error) {
          console.error('Error handling UPDATE event:', error);
        }
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'orders' 
      }, (payload) => {
        const deletedId = payload.old.id;
        setOrders(current => current.filter(o => o.id !== deletedId));
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'order_items' 
      }, async (payload) => {
        try { 
          const orderId = payload.new?.order_id || payload.old?.order_id;
          
          if (!orderId) return;
           
          if (lastLocalUpdateRef.current && 
              lastLocalUpdateRef.current.orderId === orderId && 
              Date.now() - lastLocalUpdateRef.current.timestamp < 1000) {
            return;
          }
          
          const fullOrder = await orderService.getById(orderId);
          const shouldDisplay = filter === 'Todos' || fullOrder.status === filter;
          
          setOrders(current => {
            const exists = current.some(o => o.id === orderId);
            
            if (exists && shouldDisplay) {
              return current.map(o => o.id === orderId ? fullOrder : o);
            } else if (exists && !shouldDisplay) {
              return current.filter(o => o.id !== orderId);
            } else if (!exists && shouldDisplay) {
              return [fullOrder, ...current];
            }
            
            return current;
          });
        } catch (error) {
          console.error('Error handling order_items change:', error);
        }
      })
      .subscribe();
      
    return () => { 
      supabaseClient.removeChannel(channel); 
    };
  }, [filter]);  

  const loadDailyStats = async () => {
    try {
      const stats = await menuService.getDailyStats();
      setDailyStats(stats);
    } catch (error) {
      console.error('Error loading daily stats:', error);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
  
    setOrders(current => current.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    try {
      await orderService.updateStatus(orderId, newStatus); 
    } catch (error) { 
      console.error('Error updating status:', error);
      await loadOrders(false);
    }
  };

  const handleItemStatusChange = async (orderId: string, itemId: string, currentStatus: string) => {
     
    if (currentStatus !== 'Pendiente') return;

    const newStatus = 'Listo';
 
    setOrders(current => current.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          items: order.items.map(item => 
            item.id === itemId ? { ...item, itemStatus: newStatus } : item
          )
        };
      }
      return order;
    }));

    try { 
      if (!itemId || itemId === 'undefined') {
        toast.error('Espera un momento, el plato se está sincronizando...');
        return;
      }
      
      await orderService.updateItemStatus(orderId, itemId, newStatus);
      
      toast.success('Plato marcado como listo', {
        icon: '✅',
        duration: 1500,
      });
       
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error('Error al actualizar el plato'); 
      await loadOrders(false);
    }
  };

  const handleUpdateOrder = async (orderId: string, items: OrderItem[]) => { 
    lastLocalUpdateRef.current = { orderId, timestamp: Date.now() }; 
    setOrders(current => current.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          items: items,
          total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };
      }
      return order;
    }));

    try {
      await orderService.updateItems(orderId, items);
       
      const updatedOrder = await orderService.getById(orderId);
      setOrders(current => current.map(order => 
        order.id === orderId ? updatedOrder : order
      ));
       
      setTimeout(() => lastLocalUpdateRef.current = null, 1000);
    } catch (error) {
      console.error('Error updating order items:', error);
      toast.error('Error al actualizar el pedido');
      lastLocalUpdateRef.current = null;
    
      await loadOrders(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try { 
      setOrders(current => current.filter(o => o.id !== orderId));
      setDeletingOrderId(null);
      
      await orderService.delete(orderId); 
      
      toast.success('Pedido cancelado exitosamente', {
        icon: '🗑️',
        duration: 2000,
      });
    } catch (error: any) { 
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
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center">
            <ChefHat size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Pantalla de Cocina</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Gestión de pedidos en tiempo real</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {/* Botón de Estadísticas */}
          <button
            onClick={() => setShowStats(!showStats)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              showStats 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            <BarChart3Icon size={18} />
            {showStats ? 'Ocultar' : 'Ver'} Estadísticas
          </button>

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
      </div>

      {/* Panel de Estadísticas */}
      {showStats && (
        <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <TrendingUpIcon className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Estadísticas del Día
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Platos vendidos (órdenes entregadas)
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {dailyStats.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Total de platos
              </div>
            </div>
          </div>

          {dailyStats.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <BarChart3Icon className="mx-auto mb-2 opacity-30" size={40} />
              <p className="text-sm">No hay ventas registradas aún hoy</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {dailyStats.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-blue-100 dark:border-blue-800 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {stat.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Plato #{idx + 1}
                      </p>
                    </div>
                    <div className="ml-3 text-right">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stat.quantity}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        unid.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
              {order.items.map((item, index) => {
                const isReady = item.itemStatus === 'Listo';
                const isPending = !item.itemStatus || item.itemStatus === 'Pendiente';
                
                return (
                  <div 
                    key={item.id || `${item.menuItemId}-${index}`} 
                    className={`flex justify-between items-center p-3 rounded-lg transition-all ${
                      isReady 
                        ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-600' 
                        : isPending && !item.id
                        ? 'bg-yellow-50/50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 opacity-70'
                        : 'bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (isPending && item.id) {
                        handleItemStatusChange(order.id, item.id, item.itemStatus || 'Pendiente');
                      } else if (isPending && !item.id) {
                        toast.error('Espera un momento, el plato se está sincronizando...', { duration: 2000 });
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Checkbox/Indicador de estado */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isReady 
                          ? 'bg-green-500 text-white' 
                          : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}>
                        {isReady && <Check size={16} strokeWidth={3} />}
                      </div>
                      
                      <div className="flex-1">
                        <span className={`font-bold text-lg block leading-tight transition-all ${
                          isReady 
                            ? 'text-green-700 dark:text-green-300 line-through' 
                            : 'text-slate-700 dark:text-slate-200'
                        }`}>
                          {item.menuItemName}
                        </span>
                        {item.notes && (
                          <span className="text-sm text-red-500 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/30 px-1 rounded block mt-1">
                            * {item.notes}
                          </span>
                        )}
                        {isReady && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1 block">
                            ✓ Listo para servir
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <span className={`font-bold px-3 py-1 rounded-lg text-lg shadow-sm ${
                      isReady 
                        ? 'bg-green-200 dark:bg-green-800 border border-green-300 dark:border-green-600 text-green-700 dark:text-green-200'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}>
                      x{item.quantity}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-auto">
              {/* Botón de editar: visible para Pendiente, Listo y Entregado */}
              {(order.status === 'Pendiente' || order.status === 'Listo' || order.status === 'Entregado') && (
                <button 
                  onClick={() => setEditingOrder(order)}
                  className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-transform active:scale-95"
                  title="Editar pedido"
                >
                  <EditIcon size={18} />
                </button>
              )}

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
