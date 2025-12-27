import React, { useEffect, useState, useMemo } from 'react';
import { PlusIcon, MinusIcon, Trash2Icon, ShoppingBagIcon, ChevronRightIcon, XIcon, ChevronDownIcon, UtensilsIcon, PackageIcon, ZapIcon } from 'lucide-react';
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
  const [orderType, setOrderType] = useState<'Dine-In' | 'Takeaway'>('Dine-In');
  const [customerName, setCustomerName] = useState<string>('');
  
  // ESTADO NUEVO: Controlar la vista del carrito en celular
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para item personalizado
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [addToMenu, setAddToMenu] = useState(false);

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

  const handleAddCustomItem = async () => {
    if (!customItemName.trim()) {
      return toast.error('Ingresa el nombre del plato');
    }
    
    const price = parseFloat(customItemPrice);
    if (isNaN(price) || price <= 0) {
      return toast.error('Ingresa un precio válido');
    }

    try {
      let menuItemId = `CUSTOM-${Date.now()}`;
      
      // Si se marcó "Agregar al menú", crear el item en menu_items
      if (addToMenu) {
        const newMenuItem = await menuService.create({
          name: customItemName,
          price: price
        });
        
        if (!newMenuItem) {
          throw new Error('No se pudo crear el item en el menú');
        }
        
        menuItemId = newMenuItem.id;
        await loadMenu(); // Recargar el menú para mostrar el nuevo item
        toast.success(`${customItemName} agregado al menú permanentemente`, { 
          icon: '📋',
          position: 'bottom-center',
          style: { borderRadius: '20px', background: '#333', color: '#fff'}
        });
      }
      
      // Agregar al pedido actual
      setOrderItems([...orderItems, {
        menuItemId: menuItemId,
        menuItemName: customItemName,
        price: price,
        quantity: 1
      }]);

      toast.success(`${customItemName} agregado al pedido`, { 
        icon: '⚡', 
        position: 'bottom-center', 
        style: { borderRadius: '20px', background: '#333', color: '#fff'} 
      });

      // Limpiar y cerrar modal
      setCustomItemName('');
      setCustomItemPrice('');
      setAddToMenu(false);
      setShowCustomItemModal(false);
    } catch (error) {
      toast.error('Error al crear el item');
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    if (orderType === 'Dine-In' && !selectedTable) {
      return toast.error('Selecciona una mesa primero');
    }
    
    setIsSubmitting(true);

    // Usamos toast.promise para mejor UX
    await toast.promise(
      orderService.create(orderItems, selectedTable, orderType, customerName),
      {
        loading: 'Enviando a cocina...',
        success: () => {
          setOrderItems([]);
          setSelectedTable('');
          setCustomerName('');
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
            Tipo de Orden
          </label>
          {/* Botón cerrar solo visible en móvil dentro del sheet */}
          <button onClick={() => setShowMobileCart(false)} className="lg:hidden text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
            <ChevronDownIcon />
          </button>
        </div>

        {/* Selector de Tipo de Orden */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => {
              setOrderType('Dine-In');
              setCustomerName('');
            }}
            className={`p-3 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
              orderType === 'Dine-In'
                ? 'bg-orange-600 text-white shadow-lg scale-105'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-300'
            }`}
          >
            <UtensilsIcon size={20} />
            Para Comer
          </button>
          <button
            onClick={() => {
              setOrderType('Takeaway');
              setSelectedTable('');
            }}
            className={`p-3 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
              orderType === 'Takeaway'
                ? 'bg-orange-600 text-white shadow-lg scale-105'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-300'
            }`}
          >
            <PackageIcon size={20} />
            Para Llevar
          </button>
        </div>

        {/* Selector de Mesa (Dine-In) */}
        {orderType === 'Dine-In' && (
          <>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Mesa Seleccionada
            </label>
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
          </>
        )}

        {/* Input de Nombre del Cliente (Takeaway) */}
        {orderType === 'Takeaway' && (
          <>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Nombre del Cliente <span className="text-slate-400 dark:text-slate-500 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ej: Juan Pérez (opcional)"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:border-orange-500 focus:outline-none transition-colors"
            />
          </>
        )}
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
          disabled={(orderType === 'Dine-In' && !selectedTable) || orderItems.length === 0 || isSubmitting}
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
            {/* Botón de Item Personalizado */}
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer group"
              onClick={() => setShowCustomItemModal(true)}
            >
              <div className="h-24 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-3 flex items-center justify-center">
                <ZapIcon size={40} className="text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-blue-700 dark:text-blue-300 leading-tight mb-1">
                  Item Rápido
                </h3>
                <p className="text-blue-600 dark:text-blue-400 text-xs">
                  Agregar plato personalizado
                </p>
              </div>
            </motion.div>

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

      {/* --- MODAL: ITEM RÁPIDO PERSONALIZADO --- */}
      <AnimatePresence>
        {showCustomItemModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCustomItemModal(false);
                setCustomItemName('');
                setCustomItemPrice('');
                setAddToMenu(false);
              }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md"
              >
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ZapIcon size={24} className="text-blue-500" />
                    Item Rápido
                  </h3>
                  <button 
                    onClick={() => {
                      setShowCustomItemModal(false);
                      setCustomItemName('');
                      setCustomItemPrice('');
                      setAddToMenu(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Nombre del plato
                    </label>
                    <input 
                      type="text"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      placeholder="Ej: Pizza especial, Jugo de naranja..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Precio (S/.)
                    </label>
                    <input 
                      type="number"
                      value={customItemPrice}
                      onChange={(e) => setCustomItemPrice(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <input 
                      type="checkbox"
                      id="addToMenu"
                      checked={addToMenu}
                      onChange={(e) => setAddToMenu(e.target.checked)}
                      className="w-5 h-5 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                    />
                    <label 
                      htmlFor="addToMenu" 
                      className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer flex-1"
                    >
                      📋 Agregar al menú permanentemente
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Este plato aparecerá en el menú para futuros pedidos
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => {
                      setShowCustomItemModal(false);
                      setCustomItemName('');
                      setCustomItemPrice('');
                      setAddToMenu(false);
                    }}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAddCustomItem}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/30"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default OrderPage;