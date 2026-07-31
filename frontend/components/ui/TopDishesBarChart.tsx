import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { TopSellingItem } from '../../types';

interface TopDishesBarChartProps {
  data: TopSellingItem[];
  maxItems?: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload as TopSellingItem;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl max-w-[200px]">
        <p className="text-slate-200 text-xs font-bold mb-2 leading-snug">{item.name}</p>
        <p className="text-amber-400 font-bold text-sm">S/. {item.total_revenue.toFixed(2)}</p>
        <p className="text-blue-400 text-xs mt-1">{item.total_quantity} unidades</p>
        <p className="text-slate-400 text-xs">{item.times_ordered} pedidos</p>
      </div>
    );
  }
  return null;
};

const CustomYAxisTick = ({ x, y, payload, data }: any) => {
  const index = data.findIndex((d: TopSellingItem) => d.name === payload.value);
  const medal = MEDALS[index] ?? null;
  const truncated = payload.value.length > 14 ? payload.value.slice(0, 14) + '…' : payload.value;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={4} textAnchor="end" fill="#94a3b8" fontSize={11} fontWeight={600}>
        {medal ? `${medal} ` : `#${index + 1} `}{truncated}
      </text>
    </g>
  );
};

const TopDishesBarChart: React.FC<TopDishesBarChartProps> = ({ data, maxItems = 8 }) => {
  const sliced = [...data]
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, maxItems)
    .reverse(); // Reverse so top item appears at top in horizontal chart

  if (sliced.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500">
        <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium">Sin datos de platos en este período</p>
      </div>
    );
  }

  const chartHeight = Math.max(200, sliced.length * 44);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={sliced}
        layout="vertical"
        margin={{ top: 5, right: 60, left: 140, bottom: 5 }}
        barCategoryGap="25%"
      >
        <defs>
          <linearGradient id="dishGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
            <stop offset="100%" stopColor="#f97316" stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} horizontal={false} />
        <XAxis
          type="number"
          dataKey="total_quantity"
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          label={{ value: 'Unidades vendidas', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 10 }}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={<CustomYAxisTick data={sliced} />}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)', radius: 4 }} />
        <Bar dataKey="total_quantity" radius={[0, 6, 6, 0]} fill="url(#dishGradient)" maxBarSize={32}>
          <LabelList
            dataKey="total_quantity"
            position="right"
            style={{ fill: '#f59e0b', fontSize: 11, fontWeight: 700 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any) => String(v)}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopDishesBarChart;
