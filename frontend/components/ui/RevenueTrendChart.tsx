import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { RevenueTrend } from '../../types';

interface RevenueTrendChartProps {
  data: RevenueTrend[];
}

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload as RevenueTrend;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl">
        <p className="text-slate-400 text-xs font-bold mb-2">{formatDate(label)}</p>
        <p className="text-emerald-400 font-bold text-sm">
          S/. {Number(item.total_revenue).toFixed(2)}
        </p>
        <p className="text-blue-400 text-xs mt-1">{item.total_orders} pedidos</p>
        <p className="text-purple-400 text-xs">Ticket prom: S/. {Number(item.avg_order_value).toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

const CustomDot = (props: any) => {
  const { cx, cy } = props;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#10b981"
      stroke="#065f46"
      strokeWidth={2}
    />
  );
};

const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500">
        <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <p className="text-sm font-medium">Genera snapshots para ver la tendencia de ingresos</p>
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500">
        <p className="text-sm font-medium">Se necesitan al menos 2 snapshots para mostrar la tendencia</p>
      </div>
    );
  }

  const avgRevenue = data.reduce((sum, d) => sum + d.total_revenue, 0) / data.length;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.4} vertical={false} />
        <XAxis
          dataKey="snapshot_date"
          tickFormatter={formatDate}
          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v) => `S/.${v}`}
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={avgRevenue}
          stroke="#f59e0b"
          strokeDasharray="6 3"
          strokeWidth={1.5}
          label={{ value: 'Prom', fill: '#f59e0b', fontSize: 10, position: 'right' }}
        />
        <Area
          type="monotone"
          dataKey="total_revenue"
          stroke="#10b981"
          strokeWidth={2.5}
          fill="url(#areaGradient)"
          dot={<CustomDot />}
          activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueTrendChart;
