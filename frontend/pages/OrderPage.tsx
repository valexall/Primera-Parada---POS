import React, { useEffect, useState } from 'react';
import { PlusIcon, MinusIcon, TrashIcon, UtensilsIcon } from 'lucide-react';
import { MenuItem, OrderItem } from '../types';
import { menuService } from '../services/menuService';
import { orderService } from '../services/orderService';

const OrderPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>(''); // Estado para la mesa

  // Configuración de mesas (puedes mover esto a constantes o base de datos luego)
  const TABLES = ['1', '2', '3', '4', '5', '6', 'Barra 1', 'Barra 2', 'Delivery'];

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    const items = await menuService.getAll();
    setMenuItems(items);
  };

  const addToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(item => item.menuItemId === menuItem.id);
    if (existingItem) {
      setOrderItems(orderItems.map(item => 
        item.menuItemId === menuItem.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        price: menuItem.price,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setOrderItems(orderItems.map(item => {
      if (item.menuItemId === menuItemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (menuItemId: string) => {
    setOrderItems(orderItems.filter(item => item.menuItemId !== menuItemId));
  };

  const updateNotes = (menuItemId: string, notes: string) => {
    setOrderItems(orderItems.map(item => 
      item.menuItemId === menuItemId ? { ...item, notes } : item
    ));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      alert('⚠️ Agrega al menos un elemento al pedido');
      return;
    }
    if (!selectedTable) {
      alert('⚠️ Por favor selecciona una MESA antes de enviar');
      return;
    }

    try {
      // Enviamos items y número de mesa
      // NOTA: Asegúrate de haber actualizado orderService.create para aceptar el 2do parámetro
      await orderService.create(orderItems, selectedTable);
      
      // Resetear formulario
      setOrderItems([]);
      setSelectedTable('');
      alert(`✅ Pedido enviado exitosamente para Mesa ${selectedTable}`);
    } catch (error) {
      console.error(error);
      alert('❌ Error al enviar el pedido');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
      {/* --- COLUMNA IZQUIERDA: MENÚ --- */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <UtensilsIcon /> Menú Disponible
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {menuItems.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                <p className="text-amber-600 font-bold">
                  S/. {item.price.toFixed(2)}
                </p>
              </div>
              <button 
                onClick={() => addToOrder(item)}
                className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-semibold flex items-center transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                Agregar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* --- COLUMNA DERECHA: RESUMEN Y MESA --- */}
      <div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 sticky top-4 overflow-hidden">
          
          <div className="p-6 bg-gray-50 border-b">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Detalle del Pedido</h2>
            
            {/* SELECTOR DE MESAS */}
            <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">
              Seleccionar Mesa:
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {TABLES.map(table => (
                <button
                  key={table}
                  onClick={() => setSelectedTable(table)}
                  className={`py-2 px-1 text-sm font-bold rounded-md transition-all ${
                    selectedTable === table 
                      ? 'bg-amber-600 text-white shadow-md transform scale-105' 
                      : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {table}
                </button>
              ))}
            </div>
            {!selectedTable && <p className="text-xs text-red-500">* Debes seleccionar una mesa</p>}
          </div>

          <div className="p-6">
            {orderItems.length === 0 ? (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                <p>Tu bandeja está vacía</p>
                <p className="text-sm">Agrega platos del menú</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                  {orderItems.map(item => (
                    <div key={item.menuItemId} className="flex flex-col border-b pb-4 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 pr-4">
                          <h3 className="font-bold text-gray-800">{item.menuItemName}</h3>
                          <p className="text-sm text-gray-500">
                            S/. {item.price.toFixed(2)} c/u
                          </p>
                        </div>
                        <div className="font-bold text-gray-800">
                           S/. {(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                          <button 
                            onClick={() => updateQuantity(item.menuItemId, -1)}
                            className="p-1 bg-white rounded shadow-sm hover:text-red-600 disabled:opacity-50"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.menuItemId, 1)}
                            className="p-1 bg-white rounded shadow-sm hover:text-green-600"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => removeItem(item.menuItemId)}
                          className="text-red-400 hover:text-red-600 p-2"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>

                      <input 
                        type="text" 
                        placeholder="Nota: Sin cebolla, extra picante..." 
                        value={item.notes || ''}
                        onChange={(e) => updateNotes(item.menuItemId, e.target.value)}
                        className="mt-2 w-full text-sm p-2 border rounded bg-yellow-50 focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 bg-gray-50 -mx-6 px-6 -mb-6 py-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold text-gray-800">Total a Pagar:</span>
                    <span className="text-3xl font-bold text-amber-600">
                      S/. {calculateTotal().toFixed(2)}
                    </span>
                  </div>
                  <button 
                    onClick={handleSubmitOrder}
                    disabled={!selectedTable || orderItems.length === 0}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95 ${
                      !selectedTable || orderItems.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-amber-600 text-white hover:bg-amber-700'
                    }`}
                  >
                    {selectedTable ? `ENVIAR PEDIDO - MESA ${selectedTable}` : 'SELECCIONA UNA MESA'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;