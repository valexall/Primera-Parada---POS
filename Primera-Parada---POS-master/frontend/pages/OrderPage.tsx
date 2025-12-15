import React, { useEffect, useState } from 'react';
import { PlusIcon, MinusIcon, TrashIcon } from 'lucide-react';
import { MenuItem, OrderItem } from '../types';
import { menuService } from '../services/menuService';
import { orderService } from '../services/orderService';
const OrderPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
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
      setOrderItems(orderItems.map(item => item.menuItemId === menuItem.id ? {
        ...item,
        quantity: item.quantity + 1
      } : item));
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
        return newQuantity > 0 ? {
          ...item,
          quantity: newQuantity
        } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };
  const removeItem = (menuItemId: string) => {
    setOrderItems(orderItems.filter(item => item.menuItemId !== menuItemId));
  };
  const updateNotes = (menuItemId: string, notes: string) => {
    setOrderItems(orderItems.map(item => item.menuItemId === menuItemId ? {
      ...item,
      notes
    } : item));
  };
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };
  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      alert('Agrega al menos un elemento al pedido');
      return;
    }
    try {
      await orderService.create(orderItems);
      setOrderItems([]);
      alert('Pedido enviado exitosamente');
    } catch (error) {
      alert('Error al enviar el pedido');
    }
  };
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Menú Disponible
        </h2>
        <div className="space-y-3">
          {menuItems.map(item => <div key={item.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center hover:shadow-lg transition-shadow">
              <div>
                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                <p className="text-amber-600 font-medium">
                  S/. {item.price.toFixed(2)}
                </p>
              </div>
              <button onClick={() => addToOrder(item)} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center">
                <PlusIcon className="h-5 w-5 mr-1" />
                Agregar
              </button>
            </div>)}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Pedido Actual</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          {orderItems.length === 0 ? <p className="text-gray-500 text-center py-8">
              No hay elementos en el pedido
            </p> : <>
              <div className="space-y-4 mb-6">
                {orderItems.map(item => <div key={item.menuItemId} className="border-b pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {item.menuItemName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          S/. {item.price.toFixed(2)} × {item.quantity} = S/.
                          {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <button onClick={() => removeItem(item.menuItemId)} className="text-red-600 hover:text-red-800">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <button onClick={() => updateQuantity(item.menuItemId, -1)} className="p-1 bg-gray-200 rounded hover:bg-gray-300">
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="px-3 py-1 bg-gray-100 rounded">
                        {item.quantity}
                      </span>
                      <button onClick={() => updateQuantity(item.menuItemId, 1)} className="p-1 bg-gray-200 rounded hover:bg-gray-300">
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <input type="text" placeholder="Notas especiales..." value={item.notes || ''} onChange={e => updateNotes(item.menuItemId, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>)}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-800">
                    Total:
                  </span>
                  <span className="text-2xl font-bold text-amber-600">
                    S/. {calculateTotal().toFixed(2)}
                  </span>
                </div>
                <button onClick={handleSubmitOrder} className="w-full py-3 bg-amber-600 text-white rounded-md hover:bg-amber-700 font-semibold">
                  Enviar Pedido
                </button>
              </div>
            </>}
        </div>
      </div>
    </div>;
};
export default OrderPage;