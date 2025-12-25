import React, { useEffect, useState } from 'react';
import { financeService } from '../services/financeService';
import { DailySummary, Expense, Sale } from '../types';
import { TrendingUpIcon, TrendingDownIcon, WalletIcon, CalendarIcon, SearchIcon, ArrowDownCircleIcon } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: '' });
  const [history, setHistory] = useState<Sale[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadTodayData();
    loadHistory();
  }, []);

  const loadTodayData = async () => {
    const summaryData = await financeService.getDailySummary();
    const expensesData = await financeService.getDailyExpenses();
    setSummary(summaryData);
    setExpenses(expensesData);
  };

  const loadHistory = async () => {
    const historyData = await financeService.getSalesHistory(dateRange.start, dateRange.end);
    setHistory(historyData);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount || !newExpense.category) return;
    await financeService.createExpense({
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category as any
    });
    setNewExpense({ description: '', amount: '', category: '' });
    loadTodayData();
  };

  if (!summary) return <div>Cargando...</div>;

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Panel Financiero</h1>
        <p className="text-slate-500 text-sm">Resumen de movimientos y métricas</p>
      </header>

      {/* 1. TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUpIcon size={100} className="text-green-500" />
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Ventas Hoy</p>
          <h3 className="text-3xl font-bold text-slate-800">S/. {summary.totalSales.toFixed(2)}</h3>
          <div className="mt-4 flex gap-3 text-xs font-bold">
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg border border-green-100">Efec: {summary.breakdown.cash.toFixed(2)}</span>
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">Yape: {summary.breakdown.yape.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDownIcon size={100} className="text-red-500" />
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Gastos Hoy</p>
          <h3 className="text-3xl font-bold text-slate-800">S/. {summary.totalExpenses.toFixed(2)}</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">Operativos + Insumos</p>
        </div>

        <div className={`p-6 rounded-3xl shadow-lg border relative overflow-hidden ${summary.netIncome >= 0 ? 'bg-slate-900 text-white border-slate-800' : 'bg-red-600 text-white border-red-500'}`}>
           <div className="absolute right-0 top-0 p-4 opacity-20">
            <WalletIcon size={100} className="text-white" />
          </div>
          <p className="text-white/60 text-sm font-bold uppercase tracking-wider mb-2">Ganancia Neta</p>
          <h3 className="text-4xl font-bold">S/. {summary.netIncome.toFixed(2)}</h3>
          <p className="text-xs text-white/50 mt-2 font-medium">En caja real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. REGISTRO DE GASTOS */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <ArrowDownCircleIcon size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Registrar Salida</h3>
          </div>
          
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Descripción</label>
              <input 
                type="text" 
                placeholder="Ej: Compra de gas" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium"
                value={newExpense.description}
                onChange={e => setNewExpense({...newExpense, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Monto</label>
                <input 
                  type="number" step="0.10"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium"
                  value={newExpense.amount}
                  onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Categoría</label>
                <input 
                  list="categories"
                  type="text"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium"
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
             <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Últimos movimientos hoy</h4>
             <ul className="space-y-2">
                {expenses.map(exp => (
                  <li key={exp.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-700">{exp.description}</span>
                    <span className="text-red-600 font-bold">- S/. {Number(exp.amount).toFixed(2)}</span>
                  </li>
                ))}
                {expenses.length === 0 && <li className="text-slate-400 text-sm italic">Sin movimientos.</li>}
             </ul>
          </div>
        </div>

        {/* 3. HISTORIAL */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon size={20} className="text-amber-500"/> Historial de Ventas
            </h3>
          </div>
          
          <div className="bg-slate-50 p-2 rounded-xl mb-4 flex gap-2">
            <input 
              type="date" 
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
              className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-amber-500"
            />
            <input 
              type="date" 
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
              className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-amber-500"
            />
            <button onClick={loadHistory} className="px-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors">
              <SearchIcon size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="bg-white sticky top-0 z-10 border-b border-slate-100">
                <tr>
                  <th className="p-3 text-slate-400 font-bold uppercase text-xs">Fecha</th>
                  <th className="p-3 text-slate-400 font-bold uppercase text-xs">Detalle</th>
                  <th className="p-3 text-right text-slate-400 font-bold uppercase text-xs">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-700">{new Date(sale.created_at).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-400">{new Date(sale.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="p-3">
                       <div className="text-xs text-slate-600 space-y-1">
                          {sale.orders?.order_items?.map((i, idx) => (
                             <div key={idx}>• {i.quantity} {i.menu_item_name}</div>
                          ))}
                       </div>
                       <span className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${sale.payment_method === 'Yape' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                         {sale.payment_method}
                       </span>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-800">
                      S/. {Number(sale.total_amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;