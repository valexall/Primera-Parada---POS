import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LockIcon, UserIcon, ArrowRightIcon, Eye, EyeOff } from 'lucide-react';
import { Loader } from '../components/ui/Loader';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      login(token, user);
      navigate('/');
      toast.success(`Bienvenido, ${user.name}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Credenciales incorrectas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[2rem] shadow-2xl w-full max-w-sm border border-slate-100 dark:border-slate-700">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/50 mb-4 transform -rotate-6">
            <span className="text-2xl font-bold">P</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Bienvenido</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sistema de Gestión - Primera Parada</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Correo</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500 group-focus-within:text-amber-500 transition-colors">
                <UserIcon size={18} />
              </span>
              <input
                type="email"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium text-slate-700 dark:text-slate-200"
                placeholder="usuario@primeraparada.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Contraseña</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500 group-focus-within:text-amber-500 transition-colors">
                <LockIcon size={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium text-slate-700 dark:text-slate-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-amber-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 dark:bg-amber-500 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-slate-800 dark:hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-slate-200 dark:shadow-amber-900/50 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader size={20} color="text-white" /> : <>INGRESAR <ArrowRightIcon size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;