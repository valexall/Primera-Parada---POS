import React, { useEffect, useState } from 'react';
import { financeService } from '../services/financeService';
import { DailySummary, Expense } from '../types';
import { TrendingUpIcon, TrendingDownIcon, WalletIcon } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Formulario de gastos
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Insumos' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const summaryData = await financeService.getDailySummary();
    const expensesData = await financeService.getDailyExpenses();
    setSummary(summaryData);
    setExpenses(expensesData);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;

    await financeService.createExpense({
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category as any
    });

    setNewExpense({ description: '', amount: '', category: 'Insumos' });
    loadData(); // Recargar datos
  };

  if (!summary) return <div>Cargando finanzas...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Cierre de Caja Diario</h2>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm font-medium">Ventas Totales</p>
              <h3 className="text-3xl font-bold text-gray-800">S/. {summary.totalSales.toFixed(2)}</h3>
            </div>
            <TrendingUpIcon className="text-green-500 h-8 w-8" />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span className="mr-2">💵 Efec: {summary.breakdown.cash.toFixed(2)}</span>
            <span className="text-purple-600">📱 Yape: {summary.breakdown.yape.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm font-medium">Gastos Operativos</p>
              <h3 className="text-3xl font-bold text-gray-800">S/. {summary.totalExpenses.toFixed(2)}</h3>
            </div>
            <TrendingDownIcon className="text-red-500 h-8 w-8" />
          </div>
          <p className="mt-4 text-sm text-gray-500">Luz, Agua, Personal, Compras</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm font-medium">Ganancia Neta</p>
              <h3 className={`text-3xl font-bold ${summary.netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                S/. {summary.netIncome.toFixed(2)}
              </h3>
            </div>
            <WalletIcon className="text-blue-600 h-8 w-8" />
          </div>
          <p className="mt-4 text-sm text-gray-500">Dinero real en bolsillo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de Registro de Gastos */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Registrar Salida de Dinero</h3>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <input 
                type="text" 
                placeholder="Ej: Pago jornal moza, Compra de gas..." 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500"
                value={newExpense.description}
                onChange={e => setNewExpense({...newExpense, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Monto (S/.)</label>
                <input 
                  type="number" 
                  step="0.10"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500"
                  value={newExpense.amount}
                  onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <select 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500"
                  value={newExpense.category}
                  onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                >
                  <option value="Insumos">Compras / Insumos</option>
                  <option value="Personal">Pago Personal</option>
                  <option value="Servicios">Servicios (Luz/Agua)</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium">
              Registrar Gasto
            </button>
          </form>
        </div>

        {/* Lista de Gastos Recientes */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Gastos del Día</h3>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium">
                <tr>
                  <th className="p-2">Hora</th>
                  <th className="p-2">Descripción</th>
                  <th className="p-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.map(exp => (
                  <tr key={exp.id}>
                    <td className="p-2 text-gray-500">
                      {new Date(exp.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="p-2">
                      <span className="block text-gray-800">{exp.description}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">{exp.category}</span>
                    </td>
                    <td className="p-2 text-right font-medium text-red-600">
                      - S/. {Number(exp.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-gray-400">No hay gastos registrados hoy.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;