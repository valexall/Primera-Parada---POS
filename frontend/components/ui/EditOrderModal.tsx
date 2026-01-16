import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, PlusIcon, MinusIcon, Trash2Icon, SaveIcon, PackagePlusIcon } from 'lucide-react';
import { Order, OrderItem, MenuItem } from '../../types';
import { useMenu } from '../../context/MenuContext';
import toast from 'react-hot-toast';

interface EditOrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderId: string, items: OrderItem[]) => Promise<void>;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, isOpen, onClose, onSave }) => {
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
 
  const { menuItems } = useMenu();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditedItems([...order.items]);
       
    }
  }, [isOpen, order]);
 

  const updateQuantity = (menuItemId: string, delta: number) => {
    setEditedItems(curr => 
      curr.map(item => {
        if (item.menuItemId === menuItemId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeItem = (menuItemId: string) => {
    if (editedItems.length === 1) {
      toast.error('No puedes eliminar todos los items. Cancela el pedido en su lugar.');
      return;
    }
    setEditedItems(curr => curr.filter(item => item.menuItemId !== menuItemId));
    toast.success('Item eliminado', { icon: '🗑️', duration: 2000 });
  };

  const addMenuItem = (menuItem: MenuItem) => {
    const existing = editedItems.find(i => i.menuItemId === menuItem.id);
    if (existing) {
      updateQuantity(menuItem.id, 1);
      toast.success(`+1 ${menuItem.name}`, { icon: '➕', duration: 2000 });
    } else {
      setEditedItems([...editedItems, {
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        itemStatus: 'Pendiente'  
      }]);
      toast.success(`${menuItem.name} agregado`, { icon: '✅', duration: 2000 });
    }
    setShowAddMenu(false);
  };

  const handleSave = async () => {
    if (editedItems.length === 0) {
      toast.error('Debe haber al menos un item');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(order.id, editedItems);
      toast.success('¡Pedido actualizado exitosamente!', { icon: '✅', duration: 3000 });
      onClose();
    } catch (error) {
      toast.error('Error al actualizar el pedido');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotal = () => {
    return editedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const hasChanges = () => {
    if (editedItems.length !== order.items.length) return true;
    
    return editedItems.some((editedItem, index) => {
      const originalItem = order.items.find(i => i.menuItemId === editedItem.menuItemId);
      return !originalItem || originalItem.quantity !== editedItem.quantity;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <XIcon size={24} />
                </button>
                
                <h2 className="text-2xl font-bold mb-1">Editar Pedido</h2>
                <p className="text-blue-100 text-sm">
                  Mesa {order.tableNumber} • #{order.id.slice(-6)}
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-3 mb-4">
                  <AnimatePresence>
                    {editedItems.map((item, index) => (
                      <motion.div
                        key={item.menuItemId}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl border border-slate-200 dark:border-slate-600"
                      >
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100">
                            {item.menuItemName}
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            S/. {item.price} c/u
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-600">
                          <button
                            onClick={() => updateQuantity(item.menuItemId, -1)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                          >
                            <MinusIcon size={18} />
                          </button>
                          <span className="w-8 text-center font-bold text-slate-800 dark:text-slate-100">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.menuItemId, 1)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                          >
                            <PlusIcon size={18} />
                          </button>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => removeItem(item.menuItemId)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-colors"
                        >
                          <Trash2Icon size={20} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Add Item Button */}
                {!showAddMenu ? (
                  <button
                    onClick={() => setShowAddMenu(true)}
                    className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <PackagePlusIcon size={20} />
                    Agregar Item
                  </button>
                ) : (
                  <div className="border-2 border-blue-500 rounded-2xl p-4 bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">Selecciona un plato</h3>
                      <button
                        onClick={() => setShowAddMenu(false)}
                        className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                      >
                        <XIcon size={20} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {menuItems.map(menuItem => (
                        <button
                          key={menuItem.id}
                          onClick={() => addMenuItem(menuItem)}
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left"
                        >
                          <div className="font-medium text-sm text-slate-800 dark:text-slate-100 mb-1">
                            {menuItem.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            S/. {menuItem.price}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Total</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    S/. {calculateTotal().toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges() || isSaving}
                    className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/50"
                  >
                    {isSaving ? (
                      'Guardando...'
                    ) : (
                      <>
                        <SaveIcon size={20} />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditOrderModal;

