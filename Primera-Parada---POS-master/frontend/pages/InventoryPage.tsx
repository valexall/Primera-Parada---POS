import React, { useEffect, useState } from 'react';
import { inventoryService } from '../services/inventoryService';
import { Supply } from '../types';
import { PackageIcon, AlertTriangleIcon, PlusIcon, ShoppingCartIcon } from 'lucide-react';

const InventoryPage: React.FC = () => {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  
  // Estados para formularios
  const [newSupply, setNewSupply] = useState({ name: '', unit: 'kg', min_stock: '' });
  const [purchase, setPurchase] = useState({ supplyId: '', quantity: '', cost: '' });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    const data = await inventoryService.getAll();
    setSupplies(data);
  };

  const handleCreateSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    await inventoryService.create({
      name: newSupply.name,
      unit: newSupply.unit,
      min_stock: Number(newSupply.min_stock)
    });
    setShowAddModal(false);
    setNewSupply({ name: '', unit: 'kg', min_stock: '' });
    loadInventory();
  };

  const handleRegisterPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!purchase.supplyId) return;
    
    await inventoryService.registerPurchase({
      supplyId: purchase.supplyId,
      quantity: Number(purchase.quantity),
      cost: Number(purchase.cost)
    });
    setShowPurchaseModal(false);
    setPurchase({ supplyId: '', quantity: '', cost: '' });
    loadInventory();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Inventario de Insumos</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowAddModal(true)} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            <PlusIcon size={18} className="mr-2"/> Nuevo Insumo
          </button>
          <button onClick={() => setShowPurchaseModal(true)} className="flex items-center px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">
            <ShoppingCartIcon size={18} className="mr-2"/> Registrar Compra
          </button>
        </div>
      </div>

      {/* Tabla de Inventario */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-amber-50">
            <tr>
              <th className="p-4 font-semibold text-gray-700">Insumo</th>
              <th className="p-4 font-semibold text-gray-700 text-center">Stock Actual</th>
              <th className="p-4 font-semibold text-gray-700 text-center">Unidad</th>
              <th className="p-4 font-semibold text-gray-700 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {supplies.map(supply => (
              <tr key={supply.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{supply.name}</td>
                <td className="p-4 text-center text-lg font-bold">
                  {supply.current_stock}
                </td>
                <td className="p-4 text-center text-gray-500">{supply.unit}</td>
                <td className="p-4 text-center">
                  {supply.current_stock <= supply.min_stock ? (
                    <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                      <AlertTriangleIcon size={12} className="mr-1"/> Stock Bajo
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                      <PackageIcon size={12} className="mr-1"/> OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Insumo (Simplificado) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Crear Nuevo Insumo</h3>
            <form onSubmit={handleCreateSupply} className="space-y-4">
              <input 
                placeholder="Nombre (ej. Arroz, Pollo)" 
                className="w-full border p-2 rounded"
                value={newSupply.name}
                onChange={e => setNewSupply({...newSupply, name: e.target.value})}
                required
              />
              <div className="flex gap-4">
                <select 
                  className="border p-2 rounded w-1/2"
                  value={newSupply.unit}
                  onChange={e => setNewSupply({...newSupply, unit: e.target.value})}
                >
                  <option value="kg">Kilogramos (kg)</option>
                  <option value="lt">Litros (lt)</option>
                  <option value="unid">Unidades</option>
                  <option value="paq">Paquete</option>
                </select>
                <input 
                  type="number" 
                  placeholder="Stock Mínimo" 
                  className="w-1/2 border p-2 rounded"
                  value={newSupply.min_stock}
                  onChange={e => setNewSupply({...newSupply, min_stock: e.target.value})}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Compra */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Registrar Compra</h3>
            <form onSubmit={handleRegisterPurchase} className="space-y-4">
              <select 
                className="w-full border p-2 rounded"
                value={purchase.supplyId}
                onChange={e => setPurchase({...purchase, supplyId: e.target.value})}
                required
              >
                <option value="">Seleccionar Insumo...</option>
                {supplies.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
              </select>
              <div className="flex gap-4">
                <input 
                  type="number" step="0.01"
                  placeholder="Cantidad Comprada" 
                  className="w-1/2 border p-2 rounded"
                  value={purchase.quantity}
                  onChange={e => setPurchase({...purchase, quantity: e.target.value})}
                  required
                />
                <input 
                  type="number" step="0.10"
                  placeholder="Costo Total (S/.)" 
                  className="w-1/2 border p-2 rounded"
                  value={purchase.cost}
                  onChange={e => setPurchase({...purchase, cost: e.target.value})}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowPurchaseModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Confirmar Compra</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;