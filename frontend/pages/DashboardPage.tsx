import React, { useEffect, useState } from 'react';
import { financeService } from '../services/financeService';
import { DailySummary, Expense, Sale } from '../types';
import { TrendingUpIcon, TrendingDownIcon, WalletIcon, CalendarIcon, SearchIcon } from 'lucide-react';

const DashboardPage: React.FC = () => {
  // Estados para el Resumen de HOY
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Estados para el formulario de Gastos
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: '' });

  // Estados para el HISTORIAL
  const [history, setHistory] = useState<Sale[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0], // Hoy
    end: new Date().toISOString().split('T')[0]   // Hoy
  });

  useEffect(() => {
    loadTodayData();
    loadHistory();
  }, []);

  const loadTodayData = async () => {
    try {
      const summaryData = await financeService.getDailySummary();
      const expensesData = await financeService.getDailyExpenses();
      setSummary(summaryData);
      setExpenses(expensesData);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    }
  };

  const loadHistory = async () => {
    try {
      const historyData = await financeService.getSalesHistory(dateRange.start, dateRange.end);
      setHistory(historyData);
    } catch (error) {
      console.error("Error cargando historial:", error);
    }
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
    loadTodayData(); // Recargar datos de hoy
  };

  if (!summary) return <div className="p-8 text-center text-gray-500">Cargando finanzas...</div>;

  return (
    <div className="space-y-8 pb-10">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Panel Financiero (Hoy)</h2>

      {/* 1. TARJETAS DE RESUMEN (HOY) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm font-medium">Ventas de Hoy</p>
              <h3 className="text-3xl font-bold text-gray-800">S/. {summary.totalSales.toFixed(2)}</h3>
            </div>
            <TrendingUpIcon className="text-green-500 h-8 w-8" />
          </div>
          <div className="mt-4 text-sm text-gray-600 flex gap-4">
            <span>💵 Efec: {summary.breakdown.cash.toFixed(2)}</span>
            <span className="text-purple-600">📱 Yape: {summary.breakdown.yape.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm font-medium">Gastos de Hoy</p>
              <h3 className="text-3xl font-bold text-gray-800">S/. {summary.totalExpenses.toFixed(2)}</h3>
            </div>
            <TrendingDownIcon className="text-red-500 h-8 w-8" />
          </div>
          <p className="mt-4 text-xs text-gray-400">Incluye compras de insumos y servicios</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm font-medium">Ganancia Neta (Hoy)</p>
              <h3 className={`text-3xl font-bold ${summary.netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                S/. {summary.netIncome.toFixed(2)}
              </h3>
            </div>
            <WalletIcon className="text-blue-600 h-8 w-8" />
          </div>
          <p className="mt-4 text-xs text-gray-400">Ventas - Gastos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. REGISTRO DE GASTOS (CATEGORIA LIBRE) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Registrar Salida de Dinero</h3>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <input
                type="text"
                placeholder="Ej: Pago personal extra..."
                className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500"
                value={newExpense.description}
                onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Monto (S/.)</label>
                <input
                  type="number" step="0.10"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500"
                  value={newExpense.amount}
                  onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                {/* CAMBIO: Input con datalist para sugerencias pero permite escribir libremente */}
                <input
                  list="categories"
                  type="text"
                  placeholder="Escribe o selecciona..."
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500"
                  value={newExpense.category}
                  onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                />
                <datalist id="categories">
                  <option value="Insumos" />
                  <option value="Personal" />
                  <option value="Servicios" />
                  <option value="Mantenimiento" />
                  <option value="Alquiler" />
                </datalist>
              </div>
            </div>
            <button type="submit" className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium">
              Registrar Gasto
            </button>
          </form>

          {/* Lista rápida de gastos de hoy */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-500 mb-2">Gastos registrados hoy:</h4>
            <ul className="divide-y text-sm">
              {expenses.map(exp => (
                <li key={exp.id} className="py-2 flex justify-between">
                  <span>{exp.description} <span className="text-xs bg-gray-100 px-1 rounded">{exp.category}</span></span>
                  <span className="text-red-600 font-bold">- S/. {Number(exp.amount).toFixed(2)}</span>
                </li>
              ))}
              {expenses.length === 0 && <li className="text-gray-400 italic">Sin gastos hoy.</li>}
            </ul>
          </div>
        </div>

        {/* 3. HISTORIAL DE VENTAS (NUEVO) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <CalendarIcon size={20} /> Historial de Ventas
            </h3>
          </div>

          {/* Filtros */}
          <div className="bg-gray-50 p-3 rounded mb-4 flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500">Desde</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full p-1 border rounded"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500">Hasta</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full p-1 border rounded"
              />
            </div>
            <button
              onClick={loadHistory}
              className="px-3 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 h-full flex items-center"
            >
              <SearchIcon size={16} />
            </button>
          </div>

          {/* Tabla de Historial */}
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-2">Fecha/Hora</th>
                  <th className="p-2">Detalle Consumo</th> {/* NUEVA COLUMNA */}
                  <th className="p-2">Pago</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    {/* 1. FECHA */}
                    <td className="p-2">
                      <div className="font-medium">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* 2. PLATOS (NUEVO) */}
                    <td className="p-2">
                      <div className="text-xs text-gray-700">
                        {sale.orders?.order_items?.map((item, idx) => (
                          <span key={idx} className="block">
                            • {item.quantity}x {item.menu_item_name}
                          </span>
                        ))}
                        {!sale.orders?.order_items && <span className="italic text-gray-400">Sin detalle</span>}
                      </div>
                    </td>

                    {/* 3. PAGO (CORREGIDO: usa payment_method) */}
                    <td className="p-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs border ${sale.payment_method === 'Yape'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : 'bg-green-100 text-green-800 border-green-200'
                          }`}
                      >
                        {/* Aquí usamos sale.payment_method en lugar de paymentMethod */}
                        {sale.payment_method || 'Desconocido'}
                      </span>
                    </td>

                    {/* 4. TOTAL (CORREGIDO: usa total_amount) */}
                    <td className="p-2 text-right font-bold text-gray-800">
                      S/. {Number(sale.total_amount).toFixed(2)}
                    </td>
                  </tr>
                ))}

                {history.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-400">
                      No se encontraron ventas en este rango.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Footer con totales */}
              <tfoot className="bg-amber-50 font-bold">
                <tr>
                  <td colSpan={3} className="p-2 text-right">Total en Rango:</td>
                  <td className="p-2 text-right text-amber-800">
                    S/. {history.reduce((sum, s) => sum + Number(s.total_amount), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;