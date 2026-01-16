import React, { useEffect, useState, useCallback } from 'react';
import { financeService } from '../services/financeService';
import { receiptService } from '../services/receiptService';
import { DailySummary, Expense, Sale, Receipt as ReceiptType } from '../types';
import { useCachedData } from '../hooks/useCachedData';
import { TrendingUpIcon, TrendingDownIcon, WalletIcon, CalendarIcon, SearchIcon, ArrowDownCircleIcon, EyeIcon, ReceiptIcon, UtensilsIcon, PackageIcon, ChevronLeftIcon, ChevronRightIcon, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../components/ui/Loader';
import Receipt from '../components/ui/Receipt';

const DashboardPage: React.FC = () => { 
  const { 
    data: summary, 
    isLoading: summaryLoading,
    refetch: refetchSummary 
  } = useCachedData({
    fetcher: () => financeService.getDailySummary(),
    cacheDuration: 30000  
  });
 
  const {
    data: expenses,
    isLoading: expensesLoading,
    refetch: refetchExpenses
  } = useCachedData({
    fetcher: () => financeService.getDailyExpenses(),
    cacheDuration: 30000
  });

  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: '' });
  const [history, setHistory] = useState<Sale[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [currentReceipt, setCurrentReceipt] = useState<ReceiptType | null>(null);
   
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(20);  
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const isLoading = summaryLoading || expensesLoading || historyLoading;

  useEffect(() => {
    loadHistory();
  }, []);
 

  const loadHistory = async () => {
    setHistoryLoading(true);
    try { 
      setCurrentPage(1);
      const historyData = await financeService.getSalesHistory(dateRange.start, dateRange.end, 1, limit);
      setHistory(historyData.data);
      setTotalPages(historyData.pagination.totalPages);
      setTotalRecords(historyData.pagination.total);
    } catch (error) {
      toast.error('Error al cargar el historial');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    try {
      const historyData = await financeService.getSalesHistory(dateRange.start, dateRange.end, newPage, limit);
      setHistory(historyData.data);
      setTotalPages(historyData.pagination.totalPages);
      setTotalRecords(historyData.pagination.total);
    } catch (error) {
      toast.error('Error al cambiar de página');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount || !newExpense.category) return;
    
    await toast.promise(
      financeService.createExpense({
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category as any
      }),
      {
        loading: 'Registrando...',
        success: 'Gasto registrado',
        error: 'Error al registrar'
      }
    );

    setNewExpense({ description: '', amount: '', category: '' });
     
    refetchSummary();
    refetchExpenses();
  };

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

  return (
    <div className="space-y-8 pb-12">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
          <TrendingUp size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Panel Financiero</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Resumen de movimientos y métricas</p>
        </div>
      </header>

      {/* 1. TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LOGICA DE SKELETON: Si está cargando O no hay resumen, muestra skeletons */}
        {isLoading || !summary ? (
            <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </>
        ) : (
            <>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUpIcon size={100} className="text-green-500" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Ventas Hoy</p>
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">S/. {summary.totalSales.toFixed(2)}</h3>
                  <div className="mt-4 flex gap-3 text-xs font-bold">
                    <span className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg border border-green-100 dark:border-green-800">Efec: {summary.breakdown.cash.toFixed(2)}</span>
                    <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg border border-purple-100 dark:border-purple-800">Yape: {summary.breakdown.yape.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                   <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingDownIcon size={100} className="text-red-500" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Gastos Hoy</p>
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">S/. {summary.totalExpenses.toFixed(2)}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">Operativos + Insumos</p>
                </div>

                <div className={`p-6 rounded-3xl shadow-lg border relative overflow-hidden ${summary.netIncome >= 0 ? 'bg-slate-900 text-white border-slate-800' : 'bg-red-600 text-white border-red-500'}`}>
                   <div className="absolute right-0 top-0 p-4 opacity-20">
                    <WalletIcon size={100} className="text-white" />
                  </div>
                  <p className="text-white/60 text-sm font-bold uppercase tracking-wider mb-2">Ganancia Neta</p>
                  <h3 className="text-4xl font-bold">S/. {summary.netIncome.toFixed(2)}</h3>
                  <p className="text-xs text-white/50 mt-2 font-medium">En caja real</p>
                </div>
            </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. REGISTRO DE GASTOS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
              <ArrowDownCircleIcon size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Registrar Salida</h3>
          </div>
          
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Descripción</label>
              <input 
                type="text" 
                placeholder="Ej: Compra de gas" 
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium text-slate-800 dark:text-slate-200"
                value={newExpense.description}
                onChange={e => setNewExpense({...newExpense, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Monto</label>
                <input 
                  type="number" step="0.10"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium text-slate-800 dark:text-slate-200"
                  value={newExpense.amount}
                  onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Categoría</label>
                <input 
                  list="categories"
                  type="text"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium text-slate-800 dark:text-slate-200"
                  value={newExpense.category}
                  onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                />
                <datalist id="categories">
                  <option value="Insumos" />
                  <option value="Personal" />
                  <option value="Servicios" />
                </datalist>
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition-transform active:scale-95">
              Registrar Gasto
            </button>
          </form>

          <div className="mt-8">
             <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3">Últimos movimientos hoy</h4>
             <ul className="space-y-2">
                {/* SKELETON PARA LA LISTA DE GASTOS */}
                {isLoading ? (
                    <div className="space-y-2">
                        <div className="h-12 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse"></div>
                        <div className="h-12 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse"></div>
                    </div>
                ) : (
                    <>
                        {expenses && expenses.map(exp => (
                        <li key={exp.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex justify-between items-center text-sm">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{exp.description}</span>
                            <span className="text-red-600 dark:text-red-400 font-bold">- S/. {Number(exp.amount).toFixed(2)}</span>
                        </li>
                        ))}
                        {(!expenses || expenses.length === 0) && <li className="text-slate-400 dark:text-slate-500 text-sm italic">Sin movimientos.</li>}
                    </>
                )}
             </ul>
          </div>
        </div>

        {/* 3. HISTORIAL */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CalendarIcon size={20} className="text-amber-500"/> Historial de Ventas
            </h3>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-xl mb-4 flex gap-2">
            <input 
              type="date" 
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
              className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200"
            />
            <input 
              type="date" 
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
              className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200"
            />
            <button onClick={loadHistory} className="px-3 bg-slate-800 dark:bg-amber-600 text-white rounded-lg hover:bg-slate-900 dark:hover:bg-amber-700 transition-colors">
              <SearchIcon size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            {/* SKELETON PARA LA TABLA */}
            {isLoading ? (
                <div className="space-y-4 p-4">
                    <div className="h-8 bg-slate-50 dark:bg-slate-900 rounded-lg animate-pulse w-full"></div>
                    <div className="h-8 bg-slate-50 dark:bg-slate-900 rounded-lg animate-pulse w-full"></div>
                    <div className="h-8 bg-slate-50 dark:bg-slate-900 rounded-lg animate-pulse w-full"></div>
                    <div className="h-8 bg-slate-50 dark:bg-slate-900 rounded-lg animate-pulse w-full"></div>
                </div>
            ) : (
                <table className="w-full text-sm text-left">
                <thead className="bg-white dark:bg-slate-800 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
                    <tr>
                    <th className="p-3 text-slate-400 dark:text-slate-500 font-bold uppercase text-xs">Fecha</th>
                    <th className="p-3 text-slate-400 dark:text-slate-500 font-bold uppercase text-xs">Detalle</th>
                    <th className="p-3 text-right text-slate-400 dark:text-slate-500 font-bold uppercase text-xs">Total</th>
                    <th className="p-3 text-center text-slate-400 dark:text-slate-500 font-bold uppercase text-xs">Acción</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                    {history.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                        <td className="p-3 align-top">
                        <div className="font-bold text-slate-700 dark:text-slate-300">{new Date(sale.created_at).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">{new Date(sale.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                        </td>
                        <td className="p-3 align-top">
                        <div className="flex items-center gap-2 mb-2">
                          {sale.orders?.order_type === 'Takeaway' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              <PackageIcon size={12} />
                              Para Llevar
                              {sale.orders?.customer_name && <span className="ml-1">- {sale.orders.customer_name}</span>}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <UtensilsIcon size={12} />
                              Mesa {sale.orders?.table_number || '?'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mb-2">
                            {sale.orders?.order_items?.map((i, idx) => (
                                <div key={idx} className="flex gap-1">
                                    <span className="font-bold text-slate-400">{i.quantity}x</span>
                                    <span>{i.menu_item_name}</span>
                                </div>
                            ))}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${sale.payment_method === 'Yape' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800' : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800'}`}>
                            {sale.payment_method}
                        </span>
                        </td>
                        <td className="p-3 align-top text-right font-bold text-slate-800 dark:text-slate-200 text-base">
                        S/. {Number(sale.total_amount).toFixed(2)}
                        </td>
                        <td className="p-3 align-top text-center">
                        <button
                            onClick={() => handleViewReceipt(sale.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm hover:shadow-md"
                            title="Ver recibo"
                        >
                            <ReceiptIcon size={14} />
                            <span className="hidden sm:inline">Ver Recibo</span>
                        </button>
                        </td>
                    </tr>
                    ))}
                    {history.length === 0 && (
                        <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-slate-500">
                            No se encontraron movimientos en este rango de fechas.
                            </td>
                        </tr>
                    )}
                </tbody>
                </table>
            )}
          </div>

          {/* Controles de paginación */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Mostrando <span className="font-bold text-slate-800 dark:text-slate-200">{history.length}</span> de{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{totalRecords}</span> registros
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeftIcon size={18} />
                </button>
                
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 px-3">
                  Página {currentPage} de {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Página siguiente"
                >
                  <ChevronRightIcon size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Recibo */}
      {currentReceipt && (
        <Receipt 
          receipt={currentReceipt} 
          onClose={() => setCurrentReceipt(null)} 
        />
      )}
    </div>
  );
};


export default DashboardPage;
