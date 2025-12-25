import React, { useEffect, useState, useMemo } from 'react';
import { PlusIcon, MinusIcon, Trash2Icon, ShoppingBagIcon, ChevronRightIcon } from 'lucide-react';
import { MenuItem, OrderItem } from '../types';
import { menuService } from '../services/menuService';
import { orderService } from '../services/orderService';
import { CategoryTabs } from '../components/common/CategoryTabs';
import toast, { Toaster } from 'react-hot-toast'; // UX Mejorada
import { motion, AnimatePresence } from 'framer-motion';

const OrderPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // CONFIGURACIÓN
  const TABLES = ['1', '2', '3', '4', '5', '6', 'Barra 1', 'Delivery'];
  
  // Simulamos categorías (Idealmente esto viene de la BD)
  // Ley de Miller: Agrupar para facilitar la memoria
  const CATEGORIES = ['Todos', 'Entradas', 'Fondos', 'Bebidas', 'Postres', 'Extras'];

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    const items = await menuService.getAll();
    // Aquí podrías asignar categorías aleatorias si no tienes en BD para probar el UI
    setMenuItems(items);
  };

  // Filtrado (Ley de Hick: Reducir opciones simplifica la decisión)
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Todos') return menuItems;
    // Como no tenemos campo categoría en BD aun, esto es un placeholder. 
    // En producción: return menuItems.filter(i => i.category === selectedCategory);
    return menuItems; 
  }, [selectedCategory, menuItems]);

  const addToOrder = (item: MenuItem) => {
    const existing = orderItems.find(i => i.menuItemId === item.id);
    if (existing) {
      updateQuantity(item.id, 1);
      toast.success(`+1 ${item.name}`, { icon: '🍲', position: 'bottom-center' });
    } else {
      setOrderItems([...orderItems, {
        menuItemId: item.id, menuItemName: item.name, price: item.price, quantity: 1
      }]);
      toast.success(`${item.name} agregado`, { icon: '✅', position: 'bottom-center' });
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
    try {
      await orderService.create(orderItems, selectedTable);
      setOrderItems([]);
      setSelectedTable('');
      toast.success('¡Pedido enviado a cocina!', { duration: 4000 });
    } catch (e) {
      toast.error('Error al enviar pedido');
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-6 overflow-hidden">
      <Toaster />
      
      {/* --- IZQUIERDA: CATÁLOGO (Scrollable) --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Nuevo Pedido</h1>
          <p className="text-slate-500 text-sm">Selecciona los platos para la orden</p>
        </header>

        {/* Categorías (Sticky) */}
        <div className="mb-4">
          <CategoryTabs 
            categories={CATEGORIES} 
            selected={selectedCategory} 
            onSelect={setSelectedCategory} 
          />
        </div>

        {/* Grid de Platos */}
        <div className="flex-1 overflow-y-auto pb-20 pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id} 
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => addToOrder(item)}
              >
                {/* Placeholder de imagen o icono */}
                <div className="h-24 bg-gradient-to-br from-orange-100 to-amber-50 rounded-xl mb-3 flex items-center justify-center text-3xl">
                  🍽️
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight mb-1">{item.name}</h3>
                    <p className="text-slate-400 text-xs">Descripción corta del plato...</p>
                  </div>
                  <span className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded-lg">
                    S/.{item.price}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* --- DERECHA: RESUMEN Y MESA (Panel Lateral) --- */}
      <div className="w-full lg:w-96 bg-white border-l border-slate-200 flex flex-col h-full shadow-2xl z-20 lg:shadow-none lg:relative absolute right-0 top-0 transition-transform duration-300 transform lg:translate-x-0 translate-x-full lg:flex hidden"> 
      {/* NOTA: Para móvil necesitaríamos un botón flotante que abra este panel (Sheet). 
          Por ahora lo mantengo como columna visible en desktop/tablet grande */}
        
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
            Mesa Seleccionada
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {TABLES.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTable(t)}
                className={`
                  flex-shrink-0 w-12 h-12 rounded-xl font-bold text-sm flex items-center justify-center transition-all
                  ${selectedTable === t 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-200 scale-110' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-300'}
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
                className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                  {item.quantity}x
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800">{item.menuItemName}</h4>
                  <div className="text-xs text-slate-500">S/. {item.price * item.quantity}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.menuItemId, -1)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                    <MinusIcon size={16}/>
                  </button>
                  <button onClick={() => updateQuantity(item.menuItemId, 1)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                    <PlusIcon size={16}/>
                  </button>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
            
            {orderItems.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                <ShoppingBagIcon size={48} className="mb-2 stroke-1"/>
                <p>Tu orden está vacía</p>
              </div>
            )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100">
          <div className="flex justify-between items-end mb-4">
            <span className="text-slate-500 font-medium">Total</span>
            <span className="text-3xl font-bold text-slate-900">S/.{calculateTotal().toFixed(2)}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!selectedTable || orderItems.length === 0}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Confirmar Orden <ChevronRightIcon size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;