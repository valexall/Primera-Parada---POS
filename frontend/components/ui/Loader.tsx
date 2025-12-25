import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  size?: number;
  color?: string;
  text?: string;
}

// 1. Spinner giratorio para botones
export const Loader: React.FC<LoaderProps> = ({ 
  size = 20, 
  color = 'text-white', 
  text 
}) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className={`animate-spin ${color}`} size={size} />
      {text && <span className="font-medium">{text}</span>}
    </div>
  );
};

// 2. Skeleton Card (Simula una tarjeta de pedido cargando)
export const SkeletonCard: React.FC = () => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 animate-pulse h-64 flex flex-col justify-between">
    <div>
      <div className="flex justify-between mb-4">
        <div className="h-8 bg-slate-100 rounded-lg w-1/3"></div>
        <div className="h-6 bg-slate-100 rounded-md w-1/4"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-100 rounded w-3/4"></div>
        <div className="h-4 bg-slate-100 rounded w-1/2"></div>
        <div className="h-4 bg-slate-100 rounded w-2/3"></div>
      </div>
    </div>
    <div className="h-12 bg-slate-100 rounded-xl w-full mt-4"></div>
  </div>
);