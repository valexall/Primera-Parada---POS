import React, { useEffect, useState, useMemo } from 'react';
import { PlusIcon, MinusIcon, Trash2Icon, ShoppingBagIcon, ChevronRightIcon, XIcon, ChevronDownIcon } from 'lucide-react';
import { MenuItem, OrderItem } from '../types';
import { menuService } from '../services/menuService';
import { orderService } from '../services/orderService';
import { CategoryTabs } from '../components/common/CategoryTabs';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const OrderPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  
  // ESTADO NUEVO: Controlar la vista del carrito en celular
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const TABLES = ['1', '2', '3', '4', '5', '6', 'Barra 1', 'Delivery'];
  const CATEGORIES = ['Todos', 'Entradas', 'Fondos', 'Bebidas', 'Postres', 'Extras'];

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    const items = await menuService.getAll();
    setMenuItems(items);
  };

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Todos') return menuItems;
    // Filtro simulado (ajusta según tu BD)
    return menuItems; 
  }, [selectedCategory, menuItems]);

  const addToOrder = (item: MenuItem) => {
    const existing = orderItems.find(i => i.menuItemId === item.id);
    if (existing) {
      updateQuantity(item.id, 1);
      toast.success(`+1 ${item.name}`, { icon: '🍲', position: 'bottom-center', style: { borderRadius: '20px', background: '#333', color: '#fff'} });
    } else {
      setOrderItems([...orderItems, {
        menuItemId: item.id, menuItemName: item.name, price: item.price, quantity: 1
      }]);
      toast.success(`${item.name} agregado`, { icon: '✅', position: 'bottom-center', style: { borderRadius: '20px', background: '#333', color: '#fff'} });
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setOrderItems(curr => curr.map(item => {
      if (item.menuItemId === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const calculateTotal = () => orderItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  const handleSubmit = async () => {
    if (!selectedTable) return toast.error('Selecciona una mesa primero');
    
    setIsSubmitting(true);

    // Usamos toast.promise para mejor UX
    await toast.promise(
      orderService.create(orderItems, selectedTable),
      {
        loading: 'Enviando a cocina...',
        success: () => {
          setOrderItems([]);
          setSelectedTable('');
          setShowMobileCart(false); // Cerrar carrito móvil si está abierto
          setIsSubmitting(false);
          return '¡Pedido enviado correctamente!';
        },
        error: (err) => {
          setIsSubmitting(false);
          return 'Error al enviar pedido';
        }
      }
    );
  };

  // --- COMPONENTE INTERNO: CONTENIDO DEL TICKET ---
  // (Extraído para reusarlo en Desktop y Móvil sin duplicar código lógico)
  const CartContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Mesa Seleccionada
          </label>
          {/* Botón cerrar solo visible en móvil dentro del sheet */}
          <button onClick={() => setShowMobileCart(false)} className="lg:hidden text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
            <ChevronDownIcon />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar touch-pan-x">
          {TABLES.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTable(t)}
              className={`
                flex-shrink-0 w-12 h-12 rounded-xl font-bold text-sm flex items-center justify-center transition-all
                ${selectedTable === t 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/50 scale-110' 
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-300 dark:hover:border-orange-600'}
              `}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
          {orderItems.map(item => (
            <motion.div 
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              key={item.menuItemId} 
              className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs">
                {item.quantity}x
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.menuItemName}</h4>
                <div className="text-xs text-slate-500 dark:text-slate-400">S/. {item.price * item.quantity}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQuantity(item.menuItemId, -1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                  <MinusIcon size={16}/>
                </button>
                <button onClick={() => updateQuantity(item.menuItemId, 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                  <PlusIcon size={16}/>
                </button>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
          
          {orderItems.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 opacity-50">
              <ShoppingBagIcon size={48} className="mb-2 stroke-1"/>
              <p>Tu orden está vacía</p>
            </div>
          )}
      </div>

      <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-end mb-4">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Total</span>
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">S/.{calculateTotal().toFixed(2)}</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!selectedTable || orderItems.length === 0 || isSubmitting}
          className={`w-full bg-slate-900 dark:bg-amber-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2 ${isSubmitting ? 'cursor-wait' : ''}`}
        >
          {isSubmitting ? 'Enviando...' : <>Confirmar Orden <ChevronRightIcon size={20} /></>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-6 overflow-hidden relative">
      
      {/* --- IZQUIERDA: CATÁLOGO (Scrollable) --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="mb-4 shrink-0">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Nuevo Pedido</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Selecciona los platos para la orden</p>
        </header>

        {/* Categorías (Sticky) */}
        <div className="mb-4 shrink-0">
          <CategoryTabs 
            categories={CATEGORIES} 
            selected={selectedCategory} 
            onSelect={setSelectedCategory} 
          />
        </div>

        {/* Grid de Platos */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-0 pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id} 
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => addToOrder(item)}
              >
                <div className="h-24 bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 rounded-xl mb-3 flex items-center justify-center text-3xl">
                  🍽️
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1">{item.name}</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">Descripción corta...</p>
                  </div>
                  <span className="bg-slate-900 dark:bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded-lg">
                    S/.{item.price}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* --- DERECHA: RESUMEN (DESKTOP) --- */}
      <div className="hidden lg:flex w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex-col h-full shadow-2xl z-20 relative">
         <CartContent />
      </div>

      {/* --- MOVIL: BOTÓN FLOTANTE "VER PEDIDO" --- */}
      {orderItems.length > 0 && !showMobileCart && (
        <motion.div 
          initial={{ y: 100 }} animate={{ y: 0 }}
          className="lg:hidden fixed bottom-24 right-4 z-40"
        >
          <button 
            onClick={() => setShowMobileCart(true)}
            className="bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl shadow-slate-900/40 font-bold flex items-center gap-3"
          >
            <div className="bg-orange-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
              {orderItems.length}
            </div>
            Ver Pedido
            <span className="opacity-60 text-sm ml-2">S/.{calculateTotal().toFixed(2)}</span>
          </button>
        </motion.div>
      )}

      {/* --- MOVIL: SHEET / MODAL DEL CARRITO --- */}
      <AnimatePresence>
        {showMobileCart && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowMobileCart(false)}
              className="lg:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 h-[85vh] bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <CartContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default OrderPage;