import React, { useState } from 'react';
import { UserPlusIcon, SaveIcon, UserIcon, MailIcon, LockIcon } from 'lucide-react';
import api from '../services/api';

const RegisterUserPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'waiter' });
  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; msg: string }>({ type: '', msg: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: '', msg: '' });
    try {
      await api.post('/auth/register', formData);
      setStatus({ type: 'success', msg: `Usuario ${formData.name} creado correctamente.` });
      setFormData({ name: '', email: '', password: '', role: 'waiter' });
    } catch (error: any) {
      setStatus({ type: 'error', msg: error.response?.data?.error || 'Error al registrar.' });
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100">
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
            <UserPlusIcon size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Nuevo Usuario</h2>
            <p className="text-slate-500 text-sm">Registrar acceso para personal</p>
          </div>
        </div>

        {status.msg && (
          <div className={`p-4 mb-6 rounded-xl text-sm font-bold flex items-center gap-2 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {status.type === 'success' ? '✅' : '⚠️'} {status.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">Nombre</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" required className="w-full pl-11 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium" placeholder="Ej. Maria Perez" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">Email</label>
            <div className="relative">
              <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="email" required className="w-full pl-11 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium" placeholder="correo@ejemplo.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">Contraseña</label>
            <div className="relative">
              <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="password" required className="w-full pl-11 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium" placeholder="••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">Rol</label>
            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
              <option value="waiter">Moza / Personal</option>
              <option value="admin">Administrador / Dueña</option>
            </select>
          </div>

          <button type="submit" className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-transform active:scale-95 flex items-center justify-center gap-2 mt-4">
            <SaveIcon size={18} /> Guardar Usuario
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterUserPage;