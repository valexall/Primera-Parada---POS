import React, { useState, useEffect, useMemo } from 'react';
import { API_CONFIG } from '../constants/api';
import { MENU_CATEGORIES, CATEGORY_COLORS, MenuCategory, MenuItem } from '../types';

// ─── Emojis por categoría como placeholder ───────────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  Entradas:  '🥗',
  Segundos:  '🍲',
  Frituras:  '🍟',
  Bebidas:   '🥤',
  Postres:   '🍮',
  Extras:    '✨',
};

// ─── Badge de categoría ───────────────────────────────────────────────────────
const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const colors = CATEGORY_COLORS[category as MenuCategory];
  if (!colors) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold
        ${colors.bg} ${colors.text}`}
    >
      {CATEGORY_EMOJI[category] ?? '🍽️'} {category}
    </span>
  );
};

// ─── Skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-orange-100 animate-pulse">
    <div className="h-40 bg-orange-100" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-orange-100 rounded-full w-3/4" />
      <div className="h-3 bg-orange-50 rounded-full w-1/3" />
      <div className="h-6 bg-orange-100 rounded-full w-1/2 mt-2" />
    </div>
  </div>
);

// ─── Tarjeta de plato ─────────────────────────────────────────────────────────
const MenuCard: React.FC<{ item: MenuItem }> = ({ item }) => {
  const cat = item.category ?? 'Extras';

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-orange-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      {/* Imagen o placeholder */}
      {item.image_url ? (
        <div className="h-44 overflow-hidden">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div
          className="h-44 flex items-center justify-center text-6xl"
          style={{ background: 'linear-gradient(135deg, #fff7ed, #fef3c7)' }}
        >
          {CATEGORY_EMOJI[cat] ?? '🍽️'}
        </div>
      )}

      {/* Contenido */}
      <div className="p-4">
        <CategoryBadge category={cat} />
        <h3 className="mt-2 font-black text-slate-800 text-base leading-tight line-clamp-2">
          {item.name}
        </h3>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Precio</p>
            <p className="text-2xl font-black text-amber-600">
              S/. {item.price.toFixed(2)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-md shadow-amber-200 group-hover:bg-amber-600 transition-colors">
            <span className="text-white font-bold text-lg">✓</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
const PublicMenuPage: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [search, setSearch] = useState('');

  // Fecha formateada
  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Fetch sin token — acceso público
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_CONFIG.BASE_URL}/menu/public`);
        if (!res.ok) throw new Error('Error al cargar el menú');
        const data: MenuItem[] = await res.json();
        setItems(data);
      } catch (err) {
        setError('No pudimos cargar el menú. Intenta nuevamente.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Categorías que tienen al menos un plato en el menú actual
  const presentCategories = useMemo(() => {
    const cats = new Set(items.map(i => i.category).filter(Boolean));
    return MENU_CATEGORIES.filter(c => cats.has(c));
  }, [items]);

  // Filtrado por categoría y búsqueda
  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchCat = selectedCategory === 'Todos' || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, search]);

  // Agrupar por categoría para vista por secciones
  const grouped = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    filtered.forEach(item => {
      const cat = item.category ?? 'Extras';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filtered]);

  // Mostrar agrupado solo cuando no hay filtro ni búsqueda
  const showGrouped = selectedCategory === 'Todos' && !search;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #fffbf0 0%, #fff7ed 50%, #fef3c7 100%)' }}>

      {/* ── HERO HEADER ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 100%)' }}>
        {/* Decoración de fondo */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-yellow-300 -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-orange-200 translate-y-24 -translate-x-24" />
        </div>

        <div className="relative z-10 text-center py-10 px-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg">
            <span className="text-4xl">🍽️</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1">
            Primera Parada
          </h1>
          <p className="text-amber-200 font-semibold text-lg mb-4">Menú del Día</p>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white text-sm font-medium capitalize">{today}</span>
          </div>
        </div>

        {/* Wave inferior */}
        <div className="relative h-8">
          <svg viewBox="0 0 1440 32" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0,32L1440,0L1440,32L0,32Z" fill="#fffbf0" />
          </svg>
        </div>
      </header>

      {/* ── BARRA DE CONTROLES ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-amber-50/90 backdrop-blur-md border-b border-amber-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-3">
          {/* Buscador */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 text-lg select-none">🔍</span>
            <input
              id="public-menu-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar un plato..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-amber-200 bg-white/80 text-slate-700 font-medium placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
            />
          </div>

          {/* Filtros de categoría */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {['Todos', ...presentCategories].map(cat => (
              <button
                key={cat}
                id={`public-filter-${cat.toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-200 scale-105'
                    : 'bg-white text-slate-600 border border-amber-200 hover:border-amber-400 hover:bg-amber-50'
                }`}
              >
                {cat === 'Todos' ? '🍽️ Todos' : `${CATEGORY_EMOJI[cat] ?? ''} ${cat}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ───────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Estado de carga */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😞</div>
            <p className="text-slate-600 font-semibold text-lg">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Sin resultados */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🤷</div>
            <p className="text-slate-500 font-medium text-lg">No encontramos platos con ese criterio</p>
            <button
              onClick={() => { setSearch(''); setSelectedCategory('Todos'); }}
              className="mt-4 px-5 py-2 bg-amber-100 text-amber-700 rounded-xl font-bold hover:bg-amber-200 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {/* Vista agrupada por categoría */}
        {!loading && !error && showGrouped && Object.keys(grouped).length > 0 && (
          <div className="space-y-12">
            {MENU_CATEGORIES.filter(cat => grouped[cat]?.length > 0).map(cat => (
              <section key={cat}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shadow-sm border border-amber-200">
                    {CATEGORY_EMOJI[cat] ?? '🍽️'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">{cat}</h2>
                    <p className="text-xs text-slate-400 font-medium">{grouped[cat].length} platos disponibles</p>
                  </div>
                  <div className="flex-1 h-px bg-amber-200 ml-2" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {grouped[cat].map(item => (
                    <MenuCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Vista plana (con filtro o búsqueda activa) */}
        {!loading && !error && !showGrouped && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(item => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="mt-16 py-10 text-center border-t border-amber-200 bg-white/50">
        <div className="text-4xl mb-3">🏠</div>
        <p className="text-slate-700 font-black text-lg">Primera Parada</p>
        <p className="text-slate-400 text-sm mt-1">
          Precios en soles (S/.) · Solo platos disponibles del día
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Menú actualizado en tiempo real
        </div>
      </footer>
    </div>
  );
};

export default PublicMenuPage;
