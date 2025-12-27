import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  TrendingUpIcon, 
  DollarSignIcon, 
  ShoppingBagIcon,
  BarChart3Icon,
  FileTextIcon,
  PlusIcon,
  RefreshCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon
} from 'lucide-react';
import { menuHistoryService } from '../services/menuHistoryService';
import { MenuHistorySnapshot, TopSellingItem, RevenueTrend } from '../types';
import toast from 'react-hot-toast';

const MenuHistoryPage: React.FC = () => {
  const [snapshots, setSnapshots] = useState<MenuHistorySnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<MenuHistorySnapshot | null>(null);
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);
  const [revenueTrends, setRevenueTrends] = useState<RevenueTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'detail' | 'analytics'>('list');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadSnapshots();
  }, [currentPage, startDate, endDate]);

  useEffect(() => {
    if (view === 'analytics') {
      loadAnalytics();
    }
  }, [view, startDate, endDate]);

  const loadSnapshots = async () => {
    setLoading(true);
    const result = await menuHistoryService.getSnapshots({
      page: currentPage,
      limit: 10,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });
    
    if (result) {
      setSnapshots(result.data);
      setTotalPages(result.pagination.totalPages);
    }
    setLoading(false);
  };

  const loadAnalytics = async () => {
    const [topItems, trends] = await Promise.all([
      menuHistoryService.getTopSellingItems({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 10
      }),
      menuHistoryService.getRevenueTrends({
        startDate: startDate || undefined,
        endDate: endDate || undefined
      })
    ]);
    
    setTopSellingItems(topItems);
    setRevenueTrends(trends);
  };

  const handleGenerateSnapshot = async () => {
    toast.loading('Generando snapshot del día...', { id: 'generate' });
    const result = await menuHistoryService.generateSnapshot();
    
    if (result) {
      toast.success('Snapshot generado exitosamente', { id: 'generate' });
      loadSnapshots();
    } else {
      toast.error('Error al generar snapshot', { id: 'generate' });
    }
  };

  const handleViewSnapshot = async (snapshot: MenuHistorySnapshot) => {
    setSelectedSnapshot(snapshot);
    setView('detail');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `S/. ${amount.toFixed(2)}`;
  };

  const formatHour = (hour: number | null) => {
    if (hour === null) return 'N/A';
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 mb-2">
              📊 Historial de Menús
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Análisis y estadísticas para Business Intelligence
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                view === 'list'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <FileTextIcon size={18} className="inline mr-2" />
              Historial
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                view === 'analytics'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <BarChart3Icon size={18} className="inline mr-2" />
              Analytics
            </button>
            <button
              onClick={handleGenerateSnapshot}
              className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-200 dark:shadow-green-900 transition-all"
            >
              <PlusIcon size={18} className="inline mr-2" />
              Generar Snapshot Hoy
            </button>
          </div>
        </div>

        {/* Filters */}
        {view !== 'detail' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 mb-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                />
              </div>
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={view === 'analytics' ? loadAnalytics : loadSnapshots}
                className="px-4 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 shadow-md transition-all"
              >
                <RefreshCwIcon size={18} className="inline mr-2" />
                Actualizar
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {view === 'list' && (
          <>
            {/* Snapshots List */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-400">Cargando...</p>
                </div>
              ) : snapshots.length === 0 ? (
                <div className="p-12 text-center">
                  <CalendarIcon size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">No hay snapshots disponibles</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="px-6 py-4 text-left">Fecha</th>
                        <th className="px-6 py-4 text-left">Ingresos</th>
                        <th className="px-6 py-4 text-left">Pedidos</th>
                        <th className="px-6 py-4 text-left">Items Vendidos</th>
                        <th className="px-6 py-4 text-left">Hora Pico</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {snapshots.map(snapshot => (
                        <tr 
                          key={snapshot.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          onClick={() => handleViewSnapshot(snapshot)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <CalendarIcon size={18} className="text-blue-500" />
                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                {formatDate(snapshot.snapshot_date)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(snapshot.total_revenue)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-bold">
                              {snapshot.total_orders}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                            {snapshot.total_items_sold}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                            {formatHour(snapshot.peak_hour)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewSnapshot(snapshot);
                              }}
                              className="text-blue-500 hover:text-blue-600 font-bold"
                            >
                              Ver Detalles →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white dark:bg-slate-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeftIcon size={20} />
                </button>
                <span className="text-slate-700 dark:text-slate-300 font-bold">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white dark:bg-slate-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <ChevronRightIcon size={20} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Detail View */}
        {view === 'detail' && selectedSnapshot && (
          <div className="space-y-6">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-bold"
            >
              <ChevronLeftIcon size={20} />
              Volver al historial
            </button>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSignIcon size={24} className="text-green-500" />
                  <span className="text-slate-600 dark:text-slate-400 text-sm">Ingresos Totales</span>
                </div>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100">
                  {formatCurrency(selectedSnapshot.total_revenue)}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingBagIcon size={24} className="text-blue-500" />
                  <span className="text-slate-600 dark:text-slate-400 text-sm">Pedidos</span>
                </div>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100">
                  {selectedSnapshot.total_orders}
                </p>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  🍽️ {selectedSnapshot.dine_in_orders} • 📦 {selectedSnapshot.takeaway_orders}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUpIcon size={24} className="text-purple-500" />
                  <span className="text-slate-600 dark:text-slate-400 text-sm">Ticket Promedio</span>
                </div>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100">
                  {formatCurrency(selectedSnapshot.avg_order_value || 0)}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <CalendarIcon size={24} className="text-orange-500" />
                  <span className="text-slate-600 dark:text-slate-400 text-sm">Hora Pico</span>
                </div>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100">
                  {formatHour(selectedSnapshot.peak_hour)}
                </p>
              </div>
            </div>

            {/* Sales Stats Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  Estadísticas de Ventas por Plato
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-4 text-left">Plato</th>
                      <th className="px-6 py-4 text-left">Precio</th>
                      <th className="px-6 py-4 text-left">Cantidad Vendida</th>
                      <th className="px-6 py-4 text-left">Ingresos</th>
                      <th className="px-6 py-4 text-left">Veces Ordenado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {selectedSnapshot.sales_stats
                      .sort((a, b) => b.quantity_sold - a.quantity_sold)
                      .map((stat, index) => (
                        <tr key={stat.menu_item_id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {index < 3 && (
                                <span className="text-xl">
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                </span>
                              )}
                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                {stat.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">
                            {formatCurrency(stat.price)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-bold">
                              {stat.quantity_sold}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(stat.revenue)}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                            {stat.times_ordered}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics View */}
        {view === 'analytics' && (
          <div className="space-y-6">
            {/* Top Selling Items */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  🏆 Top 10 Platos Más Vendidos
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Análisis agregado del período seleccionado
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-4 text-left">Ranking</th>
                      <th className="px-6 py-4 text-left">Plato</th>
                      <th className="px-6 py-4 text-left">Cantidad Total</th>
                      <th className="px-6 py-4 text-left">Ingresos Totales</th>
                      <th className="px-6 py-4 text-left">Veces Ordenado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {topSellingItems.map((item, index) => (
                      <tr key={item.menu_item_id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                        <td className="px-6 py-4">
                          <span className="text-2xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                          {item.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-bold">
                            {item.total_quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(item.total_revenue)}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {item.times_ordered}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Revenue Trends */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-6">
                📈 Tendencias de Ingresos
              </h2>
              <div className="space-y-4">
                {revenueTrends.map(trend => (
                  <div 
                    key={trend.snapshot_date}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <CalendarIcon size={20} className="text-blue-500" />
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {formatDate(trend.snapshot_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Ingresos</p>
                        <p className="font-mono font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(trend.total_revenue)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Pedidos</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200">
                          {trend.total_orders}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Ticket Prom.</p>
                        <p className="font-mono text-slate-600 dark:text-slate-300">
                          {formatCurrency(trend.avg_order_value)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuHistoryPage;
