import React, { useEffect, useState } from 'react';
import { HistoryIcon, CalendarIcon, FilterIcon, PackageIcon, UtensilsIcon, SearchIcon, XIcon, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { orderService } from '../services/orderService';
import { SkeletonCard } from '../components/ui/Loader';

const HistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Estados de paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await orderService.getHistory(
        page,
        limit,
        startDate || undefined,
        endDate || undefined,
        statusFilter !== 'all' ? statusFilter : undefined
      );
      setOrders(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setPage(1); // Resetear a página 1 al aplicar nuevos filtros
    if (page === 1) {
      loadHistory(); // Si ya estamos en página 1, recargar manualmente
    }
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setPage(1);
  };

  const calculateTotal = (order: Order): number => {
    return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getStatusStyle = (status: OrderStatus): string => {
    switch (status) {
      case 'Pendiente': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
      case 'En Preparación': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'Listo': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'Entregado': return 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center">
            <History size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Órdenes</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Consulta órdenes de días anteriores</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FilterIcon size={20} className="text-slate-600 dark:text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Fecha Inicio */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <CalendarIcon size={16} className="inline mr-1" />
              Fecha inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-colors"
            />
          </div>

          {/* Fecha Fin */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <CalendarIcon size={16} className="inline mr-1" />
              Fecha fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-colors"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-colors"
            >
              <option value="all">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Preparación">En Preparación</option>
              <option value="Listo">Listo</option>
              <option value="Entregado">Entregado</option>
            </select>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={handleApplyFilters}
            className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <SearchIcon size={18} />
            Buscar
          </button>
          <button
            onClick={handleClearFilters}
            className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
          >
            <XIcon size={18} />
            Limpiar
          </button>
        </div>
      </div>

      {/* Lista de órdenes */}
      <div className="space-y-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <HistoryIcon size={64} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
              No se encontraron órdenes en el historial
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              {/* Header de la orden */}
              <div
                className="p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Tipo de orden */}
                    {order.orderType === 'Dine-In' ? (
                      <span className="bg-slate-800 dark:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                        <UtensilsIcon size={16} />
                        Mesa {order.tableNumber || '?'}
                      </span>
                    ) : (
                      <span className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                        <PackageIcon size={16} />
                        Para Llevar
                      </span>
                    )}

                    {/* ID y fecha */}
                    <div>
                      <p className="text-sm font-mono text-slate-600 dark:text-slate-400">
                        #{order.id}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {new Date(order.timestamp).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Estado */}
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${getStatusStyle(order.status)}`}>
                      {order.status}
                    </span>

                    {/* Total */}
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                      <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        S/. {calculateTotal(order).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Nombre del cliente (si existe) */}
                {order.customerName && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-semibold">Cliente:</span> {order.customerName}
                    </p>
                  </div>
                )}
              </div>

              {/* Detalles expandibles */}
              {expandedOrderId === order.id && (
                <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-5">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                    Detalle de items ({order.items.length})
                  </h3>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-bold">
                            {item.quantity}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {item.menuItemName}
                            </p>
                            {item.notes && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                Nota: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            S/. {item.price.toFixed(2)} c/u
                          </p>
                          <p className="font-bold text-slate-800 dark:text-slate-100">
                            S/. {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Controles de Paginación */}
      {!loading && orders.length > 0 && (
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            {/* Botón Anterior */}
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
              Anterior
            </button>

            {/* Información de página */}
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Página {page} de {totalPages}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {totalRecords} registro{totalRecords !== 1 ? 's' : ''} en total
              </p>
            </div>

            {/* Botón Siguiente */}
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
