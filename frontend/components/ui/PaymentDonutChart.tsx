import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { PaymentBreakdown } from '../../types';

interface PaymentDonutChartProps {
  data: PaymentBreakdown[];
}

const COLORS: Record<string, string> = {
  Efectivo: '#10b981',
  Yape:     '#8b5cf6',
  Otro:     '#64748b',
};

const FALLBACK_COLORS = ['#10b981', '#8b5cf6', '#f97316', '#3b82f6'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0].payload as PaymentBreakdown;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl">
        <p className="text-slate-300 text-xs font-bold mb-1">{entry.method}</p>
        <p className="font-bold text-sm" style={{ color: COLORS[entry.method] || FALLBACK_COLORS[0] }}>
          S/. {entry.total.toFixed(2)}
        </p>
        <p className="text-slate-400 text-xs mt-0.5">{entry.percentage.toFixed(1)}% · {entry.count} ventas</p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => (
  <div className="flex flex-wrap justify-center gap-4 mt-3">
    {payload?.map((entry: any, index: number) => {
      const item = entry.payload as PaymentBreakdown;
      return (
        <div key={index} className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.method}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            S/. {item.total.toFixed(2)} · {item.percentage.toFixed(1)}%
          </span>
        </div>
      );
    })}
  </div>
);

const PaymentDonutChart: React.FC<PaymentDonutChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500">
        <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        <p className="text-sm font-medium">Sin datos de pagos en este período</p>
      </div>
    );
  }

  const totalAmount = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              dataKey="total"
              strokeWidth={0}
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.method] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '-10px' }}>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</p>
          <p className="text-lg font-black text-slate-800 dark:text-slate-100">
            S/. {totalAmount.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentDonutChart;
