import React from 'react';
import { motion } from 'framer-motion';

interface CategoryTabsProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, selected, onSelect }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`
            relative px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors
            ${selected === cat ? 'text-white' : 'text-slate-600 bg-white hover:bg-slate-100 border border-slate-200'}
          `}
        >
          {selected === cat && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-slate-900 rounded-full"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">{cat}</span>
        </button>
      ))}
    </div>
  );
};