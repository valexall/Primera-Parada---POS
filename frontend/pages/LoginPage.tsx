import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  LockIcon, UserIcon, ArrowRightIcon, Eye, EyeOff,
  KeyRoundIcon, ArrowLeftIcon, CheckCircle2Icon, ShieldIcon
} from "lucide-react";
import { Loader } from "../components/ui/Loader";
import toast from "react-hot-toast";

type View = "login" | "forgot-email" | "forgot-question" | "reset-success";

const LoginPage: React.FC = () => {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;
      login(token, user);
      navigate("/");
      toast.success("Bienvenido, " + user.name);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Credenciales incorrectas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);
    try {
      const response = await api.get("/auth/security-question?email=" + encodeURIComponent(recoveryEmail));
      setSecurityQuestion(response.data.question);
      setView("forgot-question");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "No se encontro la cuenta o no tiene pregunta de seguridad");
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetWithQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) { toast.error("Las contrasenas no coinciden"); return; }
    if (newPassword.length < 6) { toast.error("La contrasena debe tener al menos 6 caracteres"); return; }
    setRecoveryLoading(true);
    try {
      await api.post("/auth/reset-with-question", { email: recoveryEmail, answer: securityAnswer, newPassword });
      setView("reset-success");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Respuesta incorrecta. Verifica e intenta de nuevo.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  const goToForgot = () => { setRecoveryEmail(email); setSecurityQuestion(""); setSecurityAnswer(""); setNewPassword(""); setConfirmNewPassword(""); setView("forgot-email"); };
  const goBack = () => { setView("login"); setSecurityQuestion(""); setSecurityAnswer(""); setNewPassword(""); setConfirmNewPassword(""); setRecoveryEmail(""); };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[2rem] shadow-2xl w-full max-w-sm border border-slate-100 dark:border-slate-700">

        {view === "login" && (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-amber-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/50 mb-4 transform -rotate-6">
                <span className="text-2xl font-bold">P</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Bienvenido</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sistema de Gestion - Primera Parada</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Correo</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-amber-500 transition-colors"><UserIcon size={18} /></span>
                  <input id="login-email" type="email" className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium text-slate-700 dark:text-slate-200" placeholder="usuario@primeraparada.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Contrasena</label>
                  <button type="button" onClick={goToForgot} className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline">Olvide mi clave</button>
                </div>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-amber-500 transition-colors"><LockIcon size={18} /></span>
                  <input id="login-password" type={showPassword ? "text" : "password"} className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium text-slate-700 dark:text-slate-200" placeholder="..." value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-amber-500 transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-slate-900 dark:bg-amber-500 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-slate-800 dark:hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-slate-200 dark:shadow-amber-900/50 disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? <Loader size={20} color="text-white" /> : <>INGRESAR <ArrowRightIcon size={18} /></>}
              </button>
            </form>
          </>
        )}

        {view === "forgot-email" && (
          <>
            <button onClick={goBack} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-6 group">
              <ArrowLeftIcon size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver
            </button>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4"><KeyRoundIcon size={24} /></div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Recuperar acceso</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Ingresa tu correo para ver tu pregunta de seguridad.</p>
            <form onSubmit={handleFetchQuestion} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Correo registrado</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-amber-500 transition-colors"><UserIcon size={18} /></span>
                  <input id="recovery-email" type="email" className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium text-slate-700 dark:text-slate-200" placeholder="usuario@primeraparada.com" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} required />
                </div>
              </div>
              <button type="submit" disabled={recoveryLoading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-200 dark:shadow-amber-900/50 disabled:opacity-70 disabled:cursor-not-allowed">
                {recoveryLoading ? <Loader size={20} color="text-white" /> : <>Continuar <ArrowRightIcon size={18} /></>}
              </button>
            </form>
          </>
        )}

        {view === "forgot-question" && (
          <>
            <button onClick={() => setView("forgot-email")} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-6 group">
              <ArrowLeftIcon size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver
            </button>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4"><ShieldIcon size={24} /></div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Verificacion de identidad</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Responde tu pregunta secreta y elige una nueva contrasena.</p>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-5">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-1">Tu pregunta de seguridad</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{securityQuestion}</p>
            </div>
            <form onSubmit={handleResetWithQuestion} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Tu respuesta</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-amber-500 transition-colors"><ShieldIcon size={16} /></span>
                  <input id="security-answer" type="text" className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium text-slate-700 dark:text-slate-200" placeholder="Escribe tu respuesta..." value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} required autoComplete="off" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Nueva contrasena</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-amber-500 transition-colors"><LockIcon size={16} /></span>
                  <input id="new-password" type={showNewPassword ? "text" : "password"} className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium text-slate-700 dark:text-slate-200" placeholder="Minimo 6 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-amber-500 transition-colors">{showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Confirmar contrasena</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-amber-500 transition-colors"><LockIcon size={16} /></span>
                  <input id="confirm-new-password" type="password" className={"w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium text-slate-700 dark:text-slate-200 " + (confirmNewPassword && newPassword !== confirmNewPassword ? "border-red-400 dark:border-red-500" : confirmNewPassword && newPassword === confirmNewPassword ? "border-emerald-400 dark:border-emerald-500" : "border-slate-200 dark:border-slate-600")} placeholder="Repite la contrasena" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
                </div>
                {confirmNewPassword && newPassword !== confirmNewPassword && (<p className="text-xs text-red-500 font-medium ml-1">Las contrasenas no coinciden</p>)}
              </div>
              <button type="submit" disabled={recoveryLoading || (!!confirmNewPassword && newPassword !== confirmNewPassword)} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-200 dark:shadow-amber-900/50 disabled:opacity-70 disabled:cursor-not-allowed mt-2">
                {recoveryLoading ? <Loader size={20} color="text-white" /> : <>Restablecer contrasena</>}
              </button>
            </form>
          </>
        )}

        {view === "reset-success" && (
          <div className="text-center py-2">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5"><CheckCircle2Icon size={32} className="text-emerald-500" /></div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Contrasena restablecida!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Tu contrasena ha sido actualizada. Ya puedes iniciar sesion con tu nueva clave.</p>
            <button onClick={goBack} className="w-full bg-slate-900 dark:bg-amber-500 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-slate-800 dark:hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg">
              <ArrowLeftIcon size={18} /> Ir al inicio de sesion
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoginPage;
