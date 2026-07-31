import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { HourlySalesPattern } from '../../types';

interface SalesBarChartProps {
  data: HourlySalesPattern[];
}

const formatHour = (hour: number) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}${period}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl">
        <p className="text-slate-300 text-xs font-bold mb-2">{formatHour(Number(label))}</p>
        <p className="text-emerald-400 font-bold text-sm">
          S/. {Number(payload[0]?.value || 0).toFixed(2)}
        </p>
        <p className="text-blue-400 text-xs mt-1">
          {payload[0]?.payload?.orders_count} pedidos
        </p>
      </div>
    );
  }
  return null;
};

const SalesBarChart: React.FC<SalesBarChartProps> = ({ data }) => {
  const activeData = data.filter(h => h.orders_count > 0);

  if (activeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500">
        <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm font-medium">Sin ventas registradas en este período</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...activeData.map(h => h.revenue));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={activeData}
        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
        barCategoryGap="25%"
      >
        <defs>
          <linearGradient id="barGradientPeak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
            <stop offset="100%" stopColor="#ea580c" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="barGradientNormal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
            <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.4} vertical={false} />
        <XAxis
          dataKey="hour"
          tickFormatter={formatHour}
          tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `S/.${v}`}
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)', radius: 6 }} />
        <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {activeData.map((entry) => (
            <Cell
              key={`cell-${entry.hour}`}
              fill={entry.revenue === maxRevenue ? 'url(#barGradientPeak)' : 'url(#barGradientNormal)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SalesBarChart;
