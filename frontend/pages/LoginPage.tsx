import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LockIcon, UserIcon, ArrowRightIcon, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      login(token, user);
      navigate('/'); 
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciales incorrectas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl w-full max-w-sm border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-amber-200 mb-4 transform -rotate-6">
            <span className="text-2xl font-bold">P</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Bienvenido</h1>
          <p className="text-slate-500 text-sm mt-1">Sistema de Gestión - Primera Parada</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium flex items-center animate-pulse">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Correo</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-amber-500 transition-colors">
                <UserIcon size={18} />
              </span>
              <input
                type="email"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium text-slate-700"
                placeholder="usuario@primeraparada.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Contraseña</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-amber-500 transition-colors">
                <LockIcon size={18} />
              </span>
              <input
                type="password"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium text-slate-700"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <>INGRESAR <ArrowRightIcon size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;