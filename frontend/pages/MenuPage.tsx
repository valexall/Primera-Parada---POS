import React, { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon, XIcon, SaveIcon } from 'lucide-react';
import { MenuItem } from '../types';
import { menuService } from '../services/menuService';
import toast from 'react-hot-toast';

const MenuPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '' });

  useEffect(() => { loadMenu(); }, []);

  const loadMenu = async () => {
    const items = await menuService.getAll();
    setMenuItems(items);
  };

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ name: item.name, price: item.price.toString() });
    } else {
      setEditingId(null);
      setFormData({ name: '', price: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    
    try {
      if (editingId) {
        await menuService.update(editingId, { name: formData.name, price: parseFloat(formData.price) });
        toast.success('Plato actualizado');
      } else {
        await menuService.create({ name: formData.name, price: parseFloat(formData.price) });
        toast.success('Plato creado');
      }
      setIsModalOpen(false);
      loadMenu();
    } catch (e) {
      toast.error('Error al guardar');
    }
  };

  const handleDelete = (id: string) => {
    // Alerta personalizada "In-App"
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-bold text-slate-800">¿Estás seguro?</p>
          <p className="text-sm text-slate-500">Eliminarás este plato permanentemente.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              await menuService.delete(id);
              toast.success('Plato eliminado');
              loadMenu();
            }}
            className="flex-1 px-3 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 shadow-md shadow-red-200"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    ), { 
      duration: 5000, 
      icon: '🗑️',
      style: { minWidth: '300px' } 
    });
  };

  const filteredItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Gestión de Menú</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Administra los precios y platos disponibles</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="px-5 py-2.5 bg-slate-900 dark:bg-amber-500 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-amber-600 font-bold flex items-center gap-2 shadow-lg shadow-slate-200 dark:shadow-amber-900/50 transition-transform active:scale-95"
        >
          <PlusIcon size={18} /> Nuevo Plato
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar plato..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nombre del Plato</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{item.name}</td>
                  <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">S/. {item.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(item)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors">
                        <PencilIcon size={18} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                        <TrashIcon size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500">
              No se encontraron resultados
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500"
            >
              <XIcon size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              {editingId ? 'Editar Plato' : 'Crear Nuevo Plato'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Precio (S/.)</label>
                <input 
                  type="number" 
                  step="0.10"
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  required
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-200 dark:shadow-amber-900/50 transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <SaveIcon size={18} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;