import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  RefreshCwIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DollarSignIcon,
  ShoppingBagIcon,
  TargetIcon,
  TrendingUpIcon,
  BarChart3Icon,
  ClockIcon,
  CalendarDaysIcon
} from 'lucide-react';
import { menuHistoryService } from '../services/menuHistoryService';
import {
  MenuHistorySnapshot,
  TopSellingItem,
  RevenueTrend,
  CategoryPerformance,
  HourlySalesPattern,
  PaymentBreakdown
} from '../types';
import toast from 'react-hot-toast';
import SalesBarChart from '../components/ui/SalesBarChart';
import PaymentDonutChart from '../components/ui/PaymentDonutChart';
import TopDishesBarChart from '../components/ui/TopDishesBarChart';
import RevenueTrendChart from '../components/ui/RevenueTrendChart';

/* ─── Helpers ─── */
const fmt = (n: number) => `S/. ${Number(n).toFixed(2)}`;

const fmtDate = (s: string) => {
  const [y, m, d] = s.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
};

const fmtHour = (h: number | null) => {
  if (h === null) return '—';
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
};

/* ─── Date presets ─── */
type Preset = '7d' | '30d' | 'custom';

const getPresetDates = (preset: Preset): { start: string; end: string } => {
  const today = new Date();
  const end = today.toISOString().split('T')[0];
  if (preset === '7d') {
    const s = new Date(today); s.setDate(today.getDate() - 6);
    return { start: s.toISOString().split('T')[0], end };
  }
  if (preset === '30d') {
    const s = new Date(today); s.setDate(today.getDate() - 29);
    return { start: s.toISOString().split('T')[0], end };
  }
  return { start: '', end: '' };
};

/* ─── Component ─── */
const MenuHistoryPage: React.FC = () => {
  // State
  const [tab, setTab] = useState<'resumen' | 'historial'>('resumen');
  const [preset, setPreset] = useState<Preset>('7d');
  const [startDate, setStartDate] = useState(getPresetDates('7d').start);
  const [endDate, setEndDate] = useState(getPresetDates('7d').end);
  const [generateDate, setGenerateDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Data
  const [snapshots, setSnapshots] = useState<MenuHistorySnapshot[]>([]);
  const [topItems, setTopItems] = useState<TopSellingItem[]>([]);
  const [trends, setTrends] = useState<RevenueTrend[]>([]);
  const [categories, setCategories] = useState<CategoryPerformance[]>([]);
  const [hourly, setHourly] = useState<HourlySalesPattern[]>([]);
  const [payments, setPayments] = useState<PaymentBreakdown[]>([]);

  // Loading
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingCharts, setLoadingCharts] = useState(false);

  useEffect(() => {
    loadAll();
  }, [startDate, endDate]);

  const loadAll = async () => {
    setLoadingHistory(true);
    setLoadingCharts(true);

    const params = { startDate: startDate || undefined, endDate: endDate || undefined };

    const [snapsResult, topResult, trendsResult, catResult, hourResult, payResult] = await Promise.all([
      menuHistoryService.getSnapshots({ limit: 30, ...params }),
      menuHistoryService.getTopSellingItems({ ...params, limit: 8 }),
      menuHistoryService.getRevenueTrends(params),
      menuHistoryService.getCategoryPerformance(params),
      menuHistoryService.getHourlySalesPattern(params),
      menuHistoryService.getPaymentMethodBreakdown(params),
    ]);

    if (snapsResult) setSnapshots(snapsResult.data);
    setTopItems(topResult);
    setTrends(trendsResult);
    setCategories(catResult);
    setHourly(hourResult);
    setPayments(payResult);
    setLoadingHistory(false);
    setLoadingCharts(false);
  };

  const handlePreset = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') {
      const { start, end } = getPresetDates(p);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleGenerateSnapshot = async () => {
    const today = new Date();
    const local = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const date = generateDate || local;
    toast.loading('Generando snapshot...', { id: 'gen' });
    const result = await menuHistoryService.generateSnapshot(date);
    if (result) {
      toast.success('Snapshot generado', { id: 'gen' });
      setGenerateDate('');
      loadAll();
    } else {
      toast.error('Error al generar snapshot', { id: 'gen' });
    }
  };

  // Derived KPIs
  const totalRevenue = trends.reduce((s, t) => s + t.total_revenue, 0);
  const totalOrders  = trends.reduce((s, t) => s + t.total_orders, 0);
  const avgTicket    = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const peakHour     = hourly.reduce<HourlySalesPattern | null>(
    (p, h) => (!p || h.revenue > p.revenue ? h : p), null
  );

  return (
    <div className="max-w-5xl mx-auto pb-16 px-2 sm:px-0">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reportes</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">Ventas diarias e indicadores del restaurante</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={generateDate}
            onChange={e => setGenerateDate(e.target.value)}
            className="text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleGenerateSnapshot}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <PlusIcon size={15} />
            {generateDate ? 'Generar' : 'Hoy'}
          </button>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(['7d', '30d', 'custom'] as Preset[]).map(p => (
          <button
            key={p}
            onClick={() => handlePreset(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              preset === p
                ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {p === '7d' ? 'Últimos 7 días' : p === '30d' ? 'Últimos 30 días' : 'Personalizado'}
          </button>
        ))}

        {preset === 'custom' && (
          <>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="text-sm px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-slate-400 text-sm">→</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="text-sm px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </>
        )}

        <button
          onClick={loadAll}
          className="ml-auto p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          title="Actualizar"
        >
          <RefreshCwIcon size={16} />
        </button>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-700">
        {([['resumen', 'Resumen'], ['historial', 'Historial']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TAB: RESUMEN
      ══════════════════════════════════════════ */}
      {tab === 'resumen' && (
        <div className="space-y-6">
          {loadingCharts ? (
            <div className="py-24 flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Calculando...</span>
            </div>
          ) : (
            <>
              {/* ── KPIs ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <DollarSignIcon size={18} className="text-emerald-500 mb-3" />
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{fmt(totalRevenue)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ingresos totales</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <ShoppingBagIcon size={18} className="text-blue-500 mb-3" />
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalOrders}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pedidos</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <TargetIcon size={18} className="text-violet-500 mb-3" />
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{fmt(avgTicket)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ticket promedio</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <ClockIcon size={18} className="text-orange-500 mb-3" />
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{peakHour ? fmtHour(peakHour.hour) : '—'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hora pico</p>
                </div>
              </div>

              {/* ── Tendencia de ingresos ── */}
              {trends.length >= 2 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <TrendingUpIcon size={16} className="text-emerald-500" />
                    Ingresos por día
                  </p>
                  <RevenueTrendChart data={trends} />
                </div>
              )}

              {/* ── Top platos + Ventas por hora ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <BarChart3Icon size={16} className="text-amber-500" />
                    Platos más vendidos
                  </p>
                  <TopDishesBarChart data={topItems} maxItems={6} />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <ClockIcon size={16} className="text-blue-500" />
                    Ventas por hora
                  </p>
                  <SalesBarChart data={hourly} />
                </div>
              </div>

              {/* ── Métodos de pago + Categorías ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2">
                    💳 Métodos de pago
                  </p>
                  <PaymentDonutChart data={payments} />
                </div>

                {categories.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">📦 Categorías</p>
                    <div className="space-y-3">
                      {categories.map((cat, i) => (
                        <div key={cat.category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '} {cat.category}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">
                              {fmt(cat.total_revenue)} · {cat.percentage_of_total.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${cat.percentage_of_total}%`,
                                background: `hsl(${220 - i * 35}, 65%, 55%)`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: HISTORIAL
      ══════════════════════════════════════════ */}
      {tab === 'historial' && (
        <div>
          {loadingHistory ? (
            <div className="py-24 flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          ) : snapshots.length === 0 ? (
            <div className="py-20 text-center">
              <CalendarDaysIcon size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Sin registros para este período</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Genera un snapshot para empezar a registrar ventas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {snapshots.map(snap => {
                const rev = Number(snap.total_revenue) || 0;
                const ticket = snap.total_orders > 0 ? rev / snap.total_orders : 0;
                const isOpen = expandedId === snap.id;

                return (
                  <div
                    key={snap.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                  >
                    {/* Row */}
                    <button
                      onClick={() => setExpandedId(isOpen ? null : snap.id)}
                      className="w-full flex items-center px-5 py-4 gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                          {fmtDate(snap.snapshot_date)}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {snap.total_orders} pedidos · {fmtHour(snap.peak_hour)} pico
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{fmt(rev)}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">ticket {fmt(ticket)}</p>
                      </div>
                      <div className="text-slate-400 dark:text-slate-500 shrink-0">
                        {isOpen ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
                      </div>
                    </button>

                    {/* Expanded — sólo platos del día */}
                    {isOpen && (
                      <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-4 bg-slate-50 dark:bg-slate-900/30">
                        {snap.sales_stats.length === 0 ? (
                          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Sin datos de platos</p>
                        ) : (
                          <>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                              Platos del día
                            </p>
                            <div className="space-y-2">
                              {[...snap.sales_stats]
                                .sort((a, b) => b.quantity_sold - a.quantity_sold)
                                .slice(0, 6)
                                .map((item, i) => {
                                  const pct = rev > 0 ? (item.revenue / rev) * 100 : 0;
                                  return (
                                    <div key={item.menu_item_id} className="flex items-center gap-3">
                                      <span className="text-sm w-5 text-center shrink-0">
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-slate-300 dark:text-slate-600 text-xs font-mono">{i + 1}</span>}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{item.name}</span>
                                          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                                            ×{item.quantity_sold} · {fmt(item.revenue)}
                                          </span>
                                        </div>
                                        <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full">
                                          <div
                                            className="h-full bg-amber-400 rounded-full"
                                            style={{ width: `${pct}%` }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MenuHistoryPage;
