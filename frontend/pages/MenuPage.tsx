import React, { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { MenuItem } from '../types';
import { menuService } from '../services/menuService';
const MenuPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: ''
  });
  useEffect(() => {
    loadMenu();
  }, []);
  const loadMenu = async () => {
    const items = await menuService.getAll();
    setMenuItems(items);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    if (editingId) {
      await menuService.update(editingId, {
        name: formData.name,
        price: parseFloat(formData.price)
      });
      setEditingId(null);
    } else {
      await menuService.create({
        name: formData.name,
        price: parseFloat(formData.price)
      });
      setIsAdding(false);
    }
    setFormData({
      name: '',
      price: ''
    });
    loadMenu();
  };
  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      price: item.price.toString()
    });
    setIsAdding(true);
  };
  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este elemento?')) {
      const success = await menuService.delete(id);
      if (success) {
        loadMenu();
      }
    }
  };
  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '',
      price: ''
    });
  };
  return <div>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-gray-800">Menú del Día</h2>
      {!isAdding && <button onClick={() => setIsAdding(true)} className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700">
        <PlusIcon className="mr-2 h-5 w-5" />
        Agregar Plato
      </button>}
    </div>
    {isAdding && <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-4">
        {editingId ? 'Editar Plato' : 'Nuevo Plato'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Plato
          </label>
          <input type="text" value={formData.name} onChange={e => setFormData({
            ...formData,
            name: e.target.value
          })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio (S/.)
          </label>
          <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({
            ...formData,
            price: e.target.value
          })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500" required />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700">
            {editingId ? 'Actualizar' : 'Agregar'}
          </button>
          <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
            Cancelar
          </button>
        </div>
      </form>
    </div>}
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-amber-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Plato
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Precio
            </th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {menuItems.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                No hay platos registrados en el menú
              </td>
            </tr>
          ) : (
            menuItems.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  S/. {item.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-amber-600 hover:text-amber-800 mr-3"
                    title="Editar"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>;
};
export default MenuPage;