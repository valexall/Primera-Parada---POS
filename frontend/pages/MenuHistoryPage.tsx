import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  TrendingUpIcon, 
  DollarSignIcon,
  BarChart3, 
  ShoppingBagIcon,
  BarChart3Icon,
  FileTextIcon,
  PlusIcon,
  RefreshCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  TrendingDownIcon,
  ClockIcon,
  PieChartIcon,
  TargetIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from 'lucide-react';
import { menuHistoryService } from '../services/menuHistoryService';
import { 
  MenuHistorySnapshot, 
  TopSellingItem, 
  RevenueTrend,
  CategoryPerformance,
  HourlySalesPattern,
  DayComparison
} from '../types';
import toast from 'react-hot-toast';

const MenuHistoryPage: React.FC = () => {
  const [snapshots, setSnapshots] = useState<MenuHistorySnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<MenuHistorySnapshot | null>(null);
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);
  const [revenueTrends, setRevenueTrends] = useState<RevenueTrend[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);
  const [hourlySalesPattern, setHourlySalesPattern] = useState<HourlySalesPattern[]>([]);
  const [dayComparison, setDayComparison] = useState<DayComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'detail' | 'analytics'>('list');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Generate snapshot date
  const [generateDate, setGenerateDate] = useState('');

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
    const [topItems, trends, categories, hourlyPattern] = await Promise.all([
      menuHistoryService.getTopSellingItems({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 10
      }),
      menuHistoryService.getRevenueTrends({
        startDate: startDate || undefined,
        endDate: endDate || undefined
      }),
      menuHistoryService.getCategoryPerformance({
        startDate: startDate || undefined,
        endDate: endDate || undefined
      }),
      menuHistoryService.getHourlySalesPattern({
        startDate: startDate || undefined,
        endDate: endDate || undefined
      })
    ]);
    
    setTopSellingItems(topItems);
    setRevenueTrends(trends);
    setCategoryPerformance(categories);
    setHourlySalesPattern(hourlyPattern);
  };

  const handleGenerateSnapshot = async () => {
    // Get local date in YYYY-MM-DD format
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dateToGenerate = generateDate || localDate;
    
    toast.loading(`Generando snapshot para ${formatDate(dateToGenerate)}...`, { id: 'generate' });
    const result = await menuHistoryService.generateSnapshot(dateToGenerate);
    
    if (result) {
      toast.success('Snapshot generado exitosamente', { id: 'generate' });
      setGenerateDate(''); // Clear the input
      loadSnapshots();
    } else {
      toast.error('Error al generar snapshot', { id: 'generate' });
    }
  };

  const handleViewSnapshot = async (snapshot: MenuHistorySnapshot) => {
    setSelectedSnapshot(snapshot);
    setView('detail');
    
    // Load comparison data
    const comparison = await menuHistoryService.compareSnapshots(snapshot.snapshot_date);
    setDayComparison(comparison);
  };

  const formatDate = (dateString: string) => {
    // Parse date as local to avoid timezone issues
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-PE', {
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
    <div className="pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Historial de Menús
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Análisis y estadísticas para Business Intelligence
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${
              view === 'list'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FileTextIcon size={16} className="inline mr-2" />
            Historial
          </button>
          <button
            onClick={() => setView('analytics')}
            className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${
              view === 'analytics'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <BarChart3Icon size={16} className="inline mr-2" />
            Analytics
          </button>
          
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl">
            <CalendarIcon size={16} className="text-slate-600 dark:text-slate-400" />
            <input
              type="date"
              value={generateDate}
              onChange={(e) => setGenerateDate(e.target.value)}
              placeholder="Fecha snapshot"
              className="bg-transparent border-none outline-none text-slate-700 dark:text-slate-200 text-sm font-medium"
            />
          </div>
          
          <button
            onClick={handleGenerateSnapshot}
            className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-md transition-all text-sm flex items-center gap-2"
          >
            <PlusIcon size={16} />
            {generateDate ? 'Generar Snapshot' : 'Snapshot de Hoy'}
          </button>
        </div>
      </div>

      {/* Filters */}
      {view !== 'detail' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200"
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
        <div>
          {view === 'list' && (
          <>
            {/* Snapshots List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando...</p>
                </div>
              ) : snapshots.length === 0 ? (
                <div className="p-12 text-center">
                  <CalendarIcon size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">No hay snapshots disponibles</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
                    {startDate || endDate 
                      ? 'No hay datos para el rango de fechas seleccionado. Prueba limpiando los filtros.'
                      : 'Genera un snapshot para comenzar a analizar las ventas'
                    }
                  </p>
                  {(startDate || endDate) && (
                    <button
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 shadow-md transition-all text-sm"
                    >
                      Limpiar Filtros
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Summary Stats Above Table */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">
                          Total Período
                        </p>
                        <p className="text-xl font-black text-green-600 dark:text-green-400">
                          {formatCurrency(snapshots.reduce((sum, s) => sum + (Number(s.total_revenue) || 0), 0))}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">
                          Pedidos
                        </p>
                        <p className="text-xl font-black text-blue-600 dark:text-blue-400">
                          {snapshots.reduce((sum, s) => sum + (Number(s.total_orders) || 0), 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">
                          Promedio/Día
                        </p>
                        <p className="text-xl font-black text-purple-600 dark:text-purple-400">
                          {formatCurrency(snapshots.length > 0 
                            ? snapshots.reduce((sum, s) => sum + (Number(s.total_revenue) || 0), 0) / snapshots.length 
                            : 0
                          )}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">
                          Mejor Día
                        </p>
                        <p className="text-xl font-black text-orange-600 dark:text-orange-400">
                          {formatCurrency(snapshots.length > 0 ? Math.max(...snapshots.map(s => Number(s.total_revenue) || 0)) : 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Fecha</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Ingresos</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Pedidos</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Items Vendidos</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Hora Pico</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Desempeño</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {snapshots.map((snapshot, index) => {
                        const snapshotRevenue = Number(snapshot.total_revenue) || 0;
                        
                        // Compare with previous snapshot (if exists)
                        let performancePercent = 0;
                        let isAboveAverage = false;
                        let canCompare = false;
                        
                        if (index < snapshots.length - 1) {
                          const prevRevenue = Number(snapshots[index + 1].total_revenue) || 0;
                          
                          // Only compare if previous day had sales
                          if (prevRevenue > 0) {
                            performancePercent = ((snapshotRevenue - prevRevenue) / prevRevenue) * 100;
                            isAboveAverage = performancePercent > 0;
                            canCompare = true;
                          } else if (snapshotRevenue > 0) {
                            // Current day has sales but previous didn't - show as positive growth
                            canCompare = false; // Don't show comparison with zero
                          }
                        }
                        
                        return (
                        <tr 
                          key={snapshot.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer"
                          onClick={() => handleViewSnapshot(snapshot)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <CalendarIcon size={16} className="text-blue-500" />
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {formatDate(snapshot.snapshot_date)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(snapshotRevenue)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                              {snapshot.total_orders}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                            {snapshot.total_items_sold}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                            {formatHour(snapshot.peak_hour)}
                          </td>
                          <td className="px-6 py-4">
                            {canCompare ? (
                              <div className="flex items-center gap-2">
                                {isAboveAverage ? (
                                  <TrendingUpIcon size={16} className="text-green-500" />
                                ) : (
                                  <TrendingDownIcon size={16} className="text-red-500" />
                                )}
                                <span className={`text-xs font-bold ${
                                  isAboveAverage ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {isAboveAverage ? '+' : ''}{performancePercent.toFixed(1)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                                Sin comparación
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewSnapshot(snapshot);
                              }}
                              className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm transition-colors"
                            >
                              Ver Detalles →
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeftIcon size={20} />
                </button>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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
              className="flex items-center gap-2 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm transition-colors"
            >
              <ChevronLeftIcon size={18} />
              Volver al historial
            </button>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSignIcon size={20} className="text-green-500" />
                    <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">Ingresos Totales</span>
                  </div>
                  {dayComparison && (
                    <span className={`text-xs font-bold flex items-center gap-1 ${
                      dayComparison.revenue_change >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {dayComparison.revenue_change >= 0 ? <ArrowUpIcon size={12} /> : <ArrowDownIcon size={12} />}
                      {Math.abs(dayComparison.revenue_change_percent).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(selectedSnapshot.total_revenue)}
                </p>
                {dayComparison && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    vs día anterior: {formatCurrency(Math.abs(dayComparison.revenue_change))}
                  </p>
                )}
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShoppingBagIcon size={20} className="text-blue-500" />
                    <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">Pedidos</span>
                  </div>
                  {dayComparison && (
                    <span className={`text-xs font-bold flex items-center gap-1 ${
                      dayComparison.orders_change >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {dayComparison.orders_change >= 0 ? <ArrowUpIcon size={12} /> : <ArrowDownIcon size={12} />}
                      {Math.abs(dayComparison.orders_change_percent).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {selectedSnapshot.total_orders}
                </p>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  🍽️ {selectedSnapshot.dine_in_orders} • 📦 {selectedSnapshot.takeaway_orders}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUpIcon size={20} className="text-purple-500" />
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">Ticket Promedio</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(selectedSnapshot.avg_order_value || 0)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {selectedSnapshot.total_items_sold} items vendidos
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon size={20} className="text-orange-500" />
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">Hora Pico</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {formatHour(selectedSnapshot.peak_hour)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Mayor actividad del día
                </p>
              </div>
            </div>

            {/* Sales Stats Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  Estadísticas de Ventas por Plato
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Plato</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Precio</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Cantidad Vendida</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Ingresos</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Veces Ordenado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {selectedSnapshot.sales_stats
                      .sort((a, b) => b.quantity_sold - a.quantity_sold)
                      .map((stat, index) => (
                        <tr key={stat.menu_item_id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {index < 3 && (
                                <span className="text-lg">
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
            {/* KPIs Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSignIcon size={24} />
                  <span className="text-sm font-bold uppercase opacity-90">Ingresos Totales</span>
                </div>
                <p className="text-3xl font-black">
                  {formatCurrency(revenueTrends.reduce((sum, t) => sum + t.total_revenue, 0))}
                </p>
                <p className="text-sm opacity-80 mt-1">
                  {revenueTrends.length} días analizados
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBagIcon size={24} />
                  <span className="text-sm font-bold uppercase opacity-90">Pedidos Totales</span>
                </div>
                <p className="text-3xl font-black">
                  {revenueTrends.reduce((sum, t) => sum + t.total_orders, 0)}
                </p>
                <p className="text-sm opacity-80 mt-1">
                  Promedio: {revenueTrends.length > 0 ? Math.round(revenueTrends.reduce((sum, t) => sum + t.total_orders, 0) / revenueTrends.length) : 0}/día
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <TargetIcon size={24} />
                  <span className="text-sm font-bold uppercase opacity-90">Ticket Promedio</span>
                </div>
                <p className="text-3xl font-black">
                  {formatCurrency(revenueTrends.length > 0 
                    ? revenueTrends.reduce((sum, t) => sum + t.avg_order_value, 0) / revenueTrends.length 
                    : 0)}
                </p>
                <p className="text-sm opacity-80 mt-1">
                  General del período
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUpIcon size={24} />
                  <span className="text-sm font-bold uppercase opacity-90">Items Vendidos</span>
                </div>
                <p className="text-3xl font-black">
                  {topSellingItems.reduce((sum, item) => sum + item.total_quantity, 0)}
                </p>
                <p className="text-sm opacity-80 mt-1">
                  Todos los productos
                </p>
              </div>
            </div>

            {/* Category Performance */}
            {categoryPerformance.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <PieChartIcon size={24} className="text-purple-500" />
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        Rendimiento por Categorías
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Análisis de ventas por tipo de producto
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryPerformance.map((category, index) => (
                      <div 
                        key={category.category}
                        className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                            {category.category}
                          </h3>
                          <span className="text-2xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 mb-1">Cantidad</p>
                            <p className="font-bold text-slate-800 dark:text-slate-100">
                              {category.total_quantity} unidades
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 mb-1">Ingresos</p>
                            <p className="font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(category.total_revenue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 mb-1">Precio Prom.</p>
                            <p className="font-mono text-slate-700 dark:text-slate-200">
                              {formatCurrency(category.avg_price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 mb-1">% del Total</p>
                            <p className="font-bold text-blue-600 dark:text-blue-400">
                              {category.percentage_of_total.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all"
                            style={{ width: `${category.percentage_of_total}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Hourly Sales Pattern */}
            {hourlySalesPattern.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <ClockIcon size={24} className="text-blue-500" />
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        Patrón de Ventas por Hora
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Distribución de pedidos durante el día
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {hourlySalesPattern
                      .filter(h => h.orders_count > 0)
                      .sort((a, b) => a.hour - b.hour)
                      .map((hourData) => {
                        const maxOrders = Math.max(...hourlySalesPattern.map(h => h.orders_count));
                        const intensity = (hourData.orders_count / maxOrders) * 100;
                        const isHighActivity = intensity > 70;
                        
                        return (
                          <div 
                            key={hourData.hour}
                            className={`rounded-xl p-3 border-2 transition-all ${
                              isHighActivity
                                ? 'bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 border-orange-500 shadow-md'
                                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="text-center">
                              <p className={`text-xs font-bold mb-1 ${
                                isHighActivity ? 'text-orange-700 dark:text-orange-300' : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                {formatHour(hourData.hour)}
                              </p>
                              <p className={`text-lg font-black ${
                                isHighActivity ? 'text-orange-600 dark:text-orange-400' : 'text-slate-800 dark:text-slate-100'
                              }`}>
                                {hourData.orders_count}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                {formatCurrency(hourData.revenue)}
                              </p>
                              {isHighActivity && (
                                <span className="text-xs">🔥</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
            {/* Top Selling Items */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  🏆 Top 10 Platos Más Vendidos
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Análisis agregado del período seleccionado
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Ranking</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Plato</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Cantidad Total</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Ingresos Totales</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Veces Ordenado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {topSellingItems.map((item, index) => (
                      <tr key={item.menu_item_id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-lg">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                          {item.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                            {item.total_quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(item.total_revenue)}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
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
