import React, { useState } from 'react';
import { XIcon, LockIcon, Eye, EyeOff, ShieldCheckIcon } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader } from './Loader';

interface ChangePasswordModalProps {
  onClose: () => void;
}

const getStrength = (password: string): { level: number; label: string; color: string } => {
  if (password.length === 0) return { level: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Débil', color: 'bg-red-500' };
  if (score <= 3) return { level: 2, label: 'Media', color: 'bg-amber-500' };
  return { level: 3, label: 'Fuerte', color: 'bg-emerald-500' };
};

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false });
  const [isLoading, setIsLoading] = useState(false);

  const strength = getStrength(form.newPassword);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleShow = (field: 'current' | 'newPw' | 'confirm') => {
    setShow(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.newPassword === form.currentPassword) {
      toast.error('La nueva contraseña no puede ser igual a la actual');
      return;
    }

    setIsLoading(true);
    try {
      await api.put('/auth/me/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('¡Contraseña actualizada exitosamente!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Cambiar Contraseña</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Actualiza tu clave de acceso</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Contraseña actual */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">
              Contraseña Actual
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500 group-focus-within:text-amber-500 transition-colors">
                <LockIcon size={16} />
              </span>
              <input
                type={show.current ? 'text' : 'password'}
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-medium text-slate-700 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={() => toggleShow('current')}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-amber-500 transition-colors"
              >
                {show.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">
              Nueva Contraseña
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500 group-focus-within:text-amber-500 transition-colors">
                <LockIcon size={16} />
              </span>
              <input
                type={show.newPw ? 'text' : 'password'}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-medium text-slate-700 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={() => toggleShow('newPw')}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-amber-500 transition-colors"
              >
                {show.newPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Indicador de fortaleza */}
            {form.newPassword.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength.level ? strength.color : 'bg-slate-200 dark:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-semibold ${
                  strength.level === 1 ? 'text-red-500' :
                  strength.level === 2 ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  Contraseña {strength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500 group-focus-within:text-amber-500 transition-colors">
                <LockIcon size={16} />
              </span>
              <input
                type={show.confirm ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Repite la nueva contraseña"
                className={`w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 ${
                  form.confirmPassword && form.newPassword !== form.confirmPassword
                    ? 'border-red-400 dark:border-red-500'
                    : form.confirmPassword && form.newPassword === form.confirmPassword
                    ? 'border-emerald-400 dark:border-emerald-500'
                    : 'border-slate-200 dark:border-slate-600'
                }`}
              />
              <button
                type="button"
                onClick={() => toggleShow('confirm')}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-amber-500 transition-colors"
              >
                {show.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-xs text-red-500 font-medium ml-1 mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-semibold text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || (!!form.confirmPassword && form.newPassword !== form.confirmPassword)}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-amber-200 dark:shadow-amber-900/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader size={18} color="text-white" /> : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
