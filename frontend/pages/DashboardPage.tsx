import React, { useEffect, useState, useCallback } from 'react';
import { financeService } from '../services/financeService';
import { receiptService } from '../services/receiptService';
import { DailySummary, Expense, Sale, Receipt as ReceiptType } from '../types';
import { useCachedData } from '../hooks/useCachedData';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Search,
  ArrowDownCircle,
  Eye,
  Receipt as ReceiptIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../components/ui/Loader';
import Receipt from '../components/ui/Receipt';

type HistoryTab = 'ventas' | 'gastos';

const DashboardPage: React.FC = () => {
  // --- Summary & Daily Expenses ---
  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary
  } = useCachedData<DailySummary>({
    fetcher: () => financeService.getDailySummary(),
    cacheDuration: 30000
  });

  const {
    data: dailyExpenses,
    isLoading: dailyExpensesLoading,
    refetch: refetchExpenses
  } = useCachedData<Expense[]>({
    fetcher: () => financeService.getDailyExpenses(),
    cacheDuration: 30000
  });

  // --- New Expense Form State ---
  const [newExpense, setNewExpense] = useState<{
    description: string;
    amount: string;
  }>({
    description: '',
    amount: ''
  });

  // --- History Tab & Date Filters ---
  const [activeTab, setActiveTab] = useState<HistoryTab>('ventas');
  const [dateRange, setDateRange] = useState({
    start: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }),
    end: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
  });

  // --- Sales History State ---
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [salesPage, setSalesPage] = useState(1);
  const [salesTotalPages, setSalesTotalPages] = useState(1);
  const [salesTotalRecords, setSalesTotalRecords] = useState(0);
  const [salesLoading, setSalesLoading] = useState(false);

  // --- Expenses History State ---
  const [expensesHistory, setExpensesHistory] = useState<Expense[]>([]);
  const [expensesPage, setExpensesPage] = useState(1);
  const [expensesTotalPages, setExpensesTotalPages] = useState(1);
  const [expensesTotalRecords, setExpensesTotalRecords] = useState(0);
  const [expensesHistoryLoading, setExpensesHistoryLoading] = useState(false);

  // --- Receipt Modal State ---
  const [currentReceipt, setCurrentReceipt] = useState<ReceiptType | null>(null);

  const limit = 20;
  const isLoading = summaryLoading || dailyExpensesLoading;

  // --- Load Sales History ---
  const loadSalesHistory = useCallback(async (page = 1) => {
    setSalesLoading(true);
    try {
      setSalesPage(page);
      const data = await financeService.getSalesHistory(
        dateRange.start,
        dateRange.end,
        page,
        limit
      );
      setSalesHistory(data.data);
      setSalesTotalPages(data.pagination.totalPages || 1);
      setSalesTotalRecords(data.pagination.total || 0);
    } catch {
      toast.error('Error al cargar el historial de ventas');
    } finally {
      setSalesLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  // --- Load Expenses History ---
  const loadExpensesHistory = useCallback(async (page = 1) => {
    setExpensesHistoryLoading(true);
    try {
      setExpensesPage(page);
      const data = await financeService.getExpensesHistory(
        dateRange.start,
        dateRange.end,
        page,
        limit
      );
      setExpensesHistory(data.data);
      setExpensesTotalPages(data.pagination.totalPages || 1);
      setExpensesTotalRecords(data.pagination.total || 0);
    } catch {
      toast.error('Error al cargar el historial de gastos');
    } finally {
      setExpensesHistoryLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  // --- Effects ---
  useEffect(() => {
    if (activeTab === 'ventas') {
      loadSalesHistory(1);
    } else {
      loadExpensesHistory(1);
    }
  }, [activeTab, loadSalesHistory, loadExpensesHistory]);

  const handleSearchHistory = () => {
    if (activeTab === 'ventas') {
      loadSalesHistory(1);
    } else {
      loadExpensesHistory(1);
    }
  };

  // --- Create Expense Handler ---
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description.trim() || !newExpense.amount) return;

    const amountNum = parseFloat(newExpense.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Monto inválido');
      return;
    }

    await toast.promise(
      financeService.createExpense({
        description: newExpense.description.trim(),
        amount: amountNum,
        category: 'General'
      }),
      {
        loading: 'Registrando salida...',
        success: 'Salida registrada',
        error: 'Error al registrar'
      }
    );

    setNewExpense({ description: '', amount: '' });
    refetchSummary();
    refetchExpenses();
    if (activeTab === 'gastos') {
      loadExpensesHistory(1);
    }
  };

  // --- View Receipt Modal ---
  const handleViewReceipt = async (saleId: string) => {
    const loadingToast = toast.loading('Cargando recibo...');
    try {
      const receipt = await receiptService.getReceipt(saleId);
      setCurrentReceipt(receipt);
      toast.dismiss(loadingToast);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Error al cargar el recibo');
      console.error('Error al cargar recibo:', error);
    }
  };

  // --- Subtotal calculation for Today's Expenses ---
  const todayExpensesTotal = (dailyExpenses || []).reduce(
    (acc, exp) => acc + Number(exp.amount),
    0
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 px-2 sm:px-0">
      {/* --- HEADER --- */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center shadow-sm">
            <TrendingUp size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Panel Financiero
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Métricas del día, registro de salidas y arqueo histórico
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            refetchSummary();
            refetchExpenses();
            handleSearchHistory();
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm self-start sm:self-center"
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </header>

      {/* --- 1. KPI CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading || !summary ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* KPI 1: Ventas Hoy */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Ingresos Hoy
                </span>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <TrendingUp size={20} />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">
                S/. {summary.totalSales.toFixed(2)}
              </h3>
              <div className="mt-4 flex gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-800">
                  Efec: S/. {summary.breakdown.cash.toFixed(2)}
                </span>
                <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg border border-purple-100 dark:border-purple-800">
                  Yape: S/. {summary.breakdown.yape.toFixed(2)}
                </span>
              </div>
            </div>

            {/* KPI 2: Gastos Hoy */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Gastos Hoy
                </span>
                <div className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                  <TrendingDown size={20} />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">
                S/. {summary.totalExpenses.toFixed(2)}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 font-medium">
                Insumos, personal y operativos del día
              </p>
            </div>

            {/* KPI 3: Ganancia Neta */}
            <div
              className={`p-6 rounded-3xl shadow-md border relative overflow-hidden flex flex-col justify-between transition-colors ${
                summary.netIncome >= 0
                  ? 'bg-slate-900 text-white border-slate-800 dark:bg-slate-800 dark:border-slate-700'
                  : 'bg-red-600 text-white border-red-500'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
                  Ganancia Neta Hoy
                </span>
                <div className="p-2 bg-white/10 text-white rounded-xl">
                  <Wallet size={20} />
                </div>
              </div>
              <h3 className="text-3xl font-black">
                S/. {summary.netIncome.toFixed(2)}
              </h3>
              <p className="text-xs text-white/60 mt-4 font-medium">
                Balance en caja real del día
              </p>
            </div>
          </>
        )}
      </div>

      {/* --- 2. MAIN WORKSPACE: WIDGET DE GASTOS HOY --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* WIDGET REGISTRAR SALIDA (4 columnas en PC) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                <ArrowDownCircle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Registrar Salida
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Gasto operativo de hoy
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-4">
            {/* Descripción */}
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 block mb-1">
                Descripción
              </label>
              <input
                type="text"
                placeholder="Ej: Compra de verduras y gas"
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm font-medium text-slate-800 dark:text-slate-200"
                value={newExpense.description}
                onChange={e =>
                  setNewExpense({ ...newExpense, description: e.target.value })
                }
                required
              />
            </div>

            {/* Monto */}
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 block mb-1">
                Monto (S/.)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                  S/.
                </span>
                <input
                  type="number"
                  step="0.10"
                  min="0.10"
                  placeholder="0.00"
                  className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm font-bold text-slate-800 dark:text-slate-200"
                  value={newExpense.amount}
                  onChange={e =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
            >
              Registrar Gasto de Hoy
            </button>
          </form>

          {/* LISTA COMPACTA DE GASTOS HOY */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                Salidas registradas hoy
              </h4>
              <span className="text-xs font-bold px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md">
                Hoy: S/. {todayExpensesTotal.toFixed(2)}
              </span>
            </div>

            {/* Scroll de máx ~5 ítems (max-h-52) */}
            <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {dailyExpensesLoading ? (
                <div className="space-y-2 py-2">
                  <div className="h-10 bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />
                </div>
              ) : dailyExpenses && dailyExpenses.length > 0 ? (
                dailyExpenses.map(exp => (
                  <div
                    key={exp.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-sm"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm truncate">
                        {exp.description}
                      </p>
                    </div>
                    <span className="text-red-600 dark:text-red-400 font-mono font-bold shrink-0 text-sm">
                      - S/. {Number(exp.amount).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                  Sin salidas registradas hoy.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- 3. SECCIÓN HISTÓRICO CON PESTAÑAS (7 columnas en PC) --- */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col min-h-[580px]">
          {/* Cabecera del Histórico con Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-blue-500" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Historial Financiero
              </h3>
            </div>

            {/* Pestañas: Ventas vs Gastos */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('ventas')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'ventas'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                📈 Ingresos (Ventas)
              </button>
              <button
                onClick={() => setActiveTab('gastos')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'gastos'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                📉 Salidas (Gastos)
              </button>
            </div>
          </div>

          {/* Barra de Búsqueda de Fechas */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-2xl mb-4 flex flex-wrap items-center gap-2 border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <input
                type="date"
                value={dateRange.start}
                onChange={e =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400 text-xs">→</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={e =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearchHistory}
              className="px-4 py-2 bg-slate-800 dark:bg-blue-600 text-white rounded-xl hover:bg-slate-900 dark:hover:bg-blue-700 transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <Search size={14} />
              Filtrar
            </button>
          </div>

          {/* --- CONTENIDO PESTAÑA 1: HISTORIAL DE VENTAS --- */}
          {activeTab === 'ventas' && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="overflow-x-auto custom-scrollbar">
                {salesLoading ? (
                  <div className="space-y-3 py-4">
                    <div className="h-10 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse" />
                    <div className="h-10 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse" />
                    <div className="h-10 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse" />
                  </div>
                ) : salesHistory.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Detalle</th>
                        <th className="py-2.5 px-3">Método</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3 text-center">Recibo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 text-xs">
                      {salesHistory.map(sale => (
                        <tr
                          key={sale.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <p className="font-semibold text-slate-700 dark:text-slate-200">
                              {new Date(sale.created_at).toLocaleDateString(
                                'es-PE',
                                { day: '2-digit', month: 'short' }
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(sale.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {sale.orders?.customer_name || 'Consumo general'}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              Mesa {sale.orders?.table_number || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                sale.payment_method === 'Yape'
                                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                  : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              {sale.payment_method}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                            S/. {Number(sale.total_amount).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleViewReceipt(sale.id)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300 transition-colors inline-flex"
                              title="Ver Recibo"
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                    Sin ventas registradas en el período.
                  </div>
                )}
              </div>

              {/* PAGINACIÓN VENTAS */}
              {salesTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4 mt-4 text-xs text-slate-500">
                  <span>
                    Total: {salesTotalRecords} registros (Página {salesPage} de{' '}
                    {salesTotalPages})
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => loadSalesHistory(salesPage - 1)}
                      disabled={salesPage <= 1}
                      className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => loadSalesHistory(salesPage + 1)}
                      disabled={salesPage >= salesTotalPages}
                      className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- CONTENIDO PESTAÑA 2: HISTORIAL DE GASTOS --- */}
          {activeTab === 'gastos' && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="overflow-x-auto custom-scrollbar">
                {expensesHistoryLoading ? (
                  <div className="space-y-3 py-4">
                    <div className="h-10 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse" />
                    <div className="h-10 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse" />
                    <div className="h-10 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse" />
                  </div>
                ) : expensesHistory.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Descripción</th>
                        <th className="py-2.5 px-3 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 text-xs">
                      {expensesHistory.map(exp => {
                        const dateStr = exp.date || exp.created_at;
                        return (
                          <tr
                            key={exp.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                          >
                            <td className="py-3 px-3">
                              <p className="font-semibold text-slate-700 dark:text-slate-200">
                                {dateStr
                                  ? new Date(dateStr).toLocaleDateString(
                                      'es-PE',
                                      { day: '2-digit', month: 'short' }
                                    )
                                  : '—'}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {dateStr
                                  ? new Date(dateStr).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : ''}
                              </p>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-medium text-slate-800 dark:text-slate-200">
                                {exp.description}
                              </p>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-red-600 dark:text-red-400">
                              - S/. {Number(exp.amount).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                    Sin gastos en el período seleccionado.
                  </div>
                )}
              </div>

              {/* PAGINACIÓN GASTOS */}
              {expensesTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4 mt-4 text-xs text-slate-500">
                  <span>
                    Total: {expensesTotalRecords} gastos (Página {expensesPage} de{' '}
                    {expensesTotalPages})
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => loadExpensesHistory(expensesPage - 1)}
                      disabled={expensesPage <= 1}
                      className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => loadExpensesHistory(expensesPage + 1)}
                      disabled={expensesPage >= expensesTotalPages}
                      className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- RECEIPT MODAL --- */}
      {currentReceipt && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setCurrentReceipt(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200 dark:border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ReceiptIcon size={18} className="text-emerald-500" /> Detalle de Recibo
              </h3>
              <button
                onClick={() => setCurrentReceipt(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                Cerrar
              </button>
            </div>

            <Receipt
              receipt={currentReceipt}
              onClose={() => setCurrentReceipt(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
