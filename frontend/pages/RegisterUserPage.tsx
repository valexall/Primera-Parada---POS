import React, { useState } from 'react';
import { UserPlusIcon, SaveIcon } from 'lucide-react';
import api from '../services/api';

const RegisterUserPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'waiter' // Por defecto 'waiter' (Moza)
  });

  // CORRECCIÓN AQUÍ: msg debe ser de tipo 'string', no ''
  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; msg: string }>({ 
    type: '', 
    msg: '' 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: '', msg: '' });

    try {
      await api.post('/auth/register', formData);
      // Ahora TypeScript aceptará este string dinámico
      setStatus({ type: 'success', msg: `Usuario ${formData.name} creado correctamente.` });
      
      // Limpiar formulario
      setFormData({ name: '', email: '', password: '', role: 'waiter' });
    } catch (error: any) {
      console.error(error);
      setStatus({ 
        type: 'error', 
        msg: error.response?.data?.error || 'Error al registrar el usuario.' 
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="flex items-center mb-6 text-amber-600">
          <UserPlusIcon className="w-8 h-8 mr-3" />
          <h2 className="text-2xl font-bold">Registrar Nuevo Personal</h2>
        </div>

        {status.msg && (
          <div className={`p-4 mb-4 rounded-md ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {status.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input
              type="text"
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="Ej. Maria Perez"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="usuario@primeraparada.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Temporal</label>
            <input
              type="password"
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="••••••"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol / Cargo</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="waiter">Moza (Personal de Servicio)</option>
              <option value="admin">Dueña (Administrador)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              * El Administrador tiene acceso total. La Moza solo accede a Pedidos y Caja.
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              <SaveIcon className="w-5 h-5 mr-2" />
              Crear Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterUserPage;