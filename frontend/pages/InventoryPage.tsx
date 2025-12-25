import React, { useEffect, useState } from 'react';
import { inventoryService } from '../services/inventoryService';
import { Supply } from '../types';
import { PackageIcon, AlertTriangleIcon, PlusIcon, ShoppingCartIcon, CheckCircle2Icon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const InventoryPage: React.FC = () => {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  
  const [newSupply, setNewSupply] = useState({ name: '', unit: 'kg', min_stock: '' });
  const [purchase, setPurchase] = useState({ supplyId: '', quantity: '', cost: '' });

  useEffect(() => { loadInventory(); }, []);

  const loadInventory = async () => {
    const data = await inventoryService.getAll();
    setSupplies(data);
  };

  const handleCreateSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    await inventoryService.create({ name: newSupply.name, unit: newSupply.unit, min_stock: Number(newSupply.min_stock) });
    setShowAddModal(false);
    setNewSupply({ name: '', unit: 'kg', min_stock: '' });
    loadInventory();
    toast.success('Insumo creado');
  };

  const handleRegisterPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!purchase.supplyId) return;
    await inventoryService.registerPurchase({ supplyId: purchase.supplyId, quantity: Number(purchase.quantity), cost: Number(purchase.cost) });
    setShowPurchaseModal(false);
    setPurchase({ supplyId: '', quantity: '', cost: '' });
    loadInventory();
    toast.success('Compra registrada y stock actualizado');
  };

  return (
    <div className="space-y-8">
      <Toaster />
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventario</h2>
          <p className="text-slate-500 text-sm">Control de insumos y stock</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold flex items-center gap-2 shadow-sm">
            <PlusIcon size={18}/> Nuevo Item
          </button>
          <button onClick={() => setShowPurchaseModal(true)} className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold flex items-center gap-2 shadow-lg shadow-amber-200">
            <ShoppingCartIcon size={18}/> Registrar Compra
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider">
            <tr>
              <th className="p-5">Insumo</th>
              <th className="p-5 text-center">Stock</th>
              <th className="p-5 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {supplies.map(supply => (
              <tr key={supply.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-5">
                  <div className="font-bold text-slate-700">{supply.name}</div>
                  <div className="text-xs text-slate-400">Unidad: {supply.unit}</div>
                </td>
                <td className="p-5 text-center">
                  <span className="text-lg font-bold text-slate-800">{supply.current_stock}</span>
                </td>
                <td className="p-5 text-center">
                  {supply.current_stock <= supply.min_stock ? (
                    <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100">
                      <AlertTriangleIcon size={12} className="mr-1"/> Stock Bajo
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-100">
                      <CheckCircle2Icon size={12} className="mr-1"/> OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modales simplificados (mismo estilo que MenuPage) */}
      {(showAddModal || showPurchaseModal) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
             <h3 className="text-xl font-bold text-slate-800 mb-4">{showAddModal ? 'Nuevo Insumo' : 'Registrar Compra'}</h3>
             
             {showAddModal && (
               <form onSubmit={handleCreateSupply} className="space-y-4">
                 <input placeholder="Nombre" className="w-full p-3 bg-slate-50 border rounded-xl" value={newSupply.name} onChange={e => setNewSupply({...newSupply, name: e.target.value})} required />
                 <div className="flex gap-2">
                   <select className="p-3 bg-slate-50 border rounded-xl" value={newSupply.unit} onChange={e => setNewSupply({...newSupply, unit: e.target.value})}>
                     <option value="kg">kg</option><option value="lt">lt</option><option value="unid">unid</option>
                   </select>
                   <input type="number" placeholder="Min Stock" className="flex-1 p-3 bg-slate-50 border rounded-xl" value={newSupply.min_stock} onChange={e => setNewSupply({...newSupply, min_stock: e.target.value})} required />
                 </div>
                 <div className="flex gap-2 pt-2">
                   <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
                   <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl">Guardar</button>
                 </div>
               </form>
             )}

             {showPurchaseModal && (
               <form onSubmit={handleRegisterPurchase} className="space-y-4">
                 <select className="w-full p-3 bg-slate-50 border rounded-xl" value={purchase.supplyId} onChange={e => setPurchase({...purchase, supplyId: e.target.value})} required>
                   <option value="">Seleccionar Insumo...</option>
                   {supplies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
                 <div className="flex gap-2">
                   <input type="number" step="0.01" placeholder="Cantidad" className="flex-1 p-3 bg-slate-50 border rounded-xl" value={purchase.quantity} onChange={e => setPurchase({...purchase, quantity: e.target.value})} required />
                   <input type="number" step="0.10" placeholder="Costo S/." className="flex-1 p-3 bg-slate-50 border rounded-xl" value={purchase.cost} onChange={e => setPurchase({...purchase, cost: e.target.value})} required />
                 </div>
                 <div className="flex gap-2 pt-2">
                   <button type="button" onClick={() => setShowPurchaseModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
                   <button type="submit" className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl">Registrar</button>
                 </div>
               </form>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;