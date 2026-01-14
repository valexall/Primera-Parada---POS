import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  EditIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  KeyIcon,
  SaveIcon,
  XIcon,
  UserPlusIcon 
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader } from '../components/ui/Loader';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moza';
  is_active: boolean;
  created_at: string;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'moza' as 'admin' | 'moza' });
  const [passwordForm, setPasswordForm] = useState({ userId: '', password: '', showModal: false });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users');
      setUsers(response.data);
    } catch (error: any) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ name: '', email: '', role: 'moza' });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      await api.put(`/auth/users/${editingUser.id}`, editForm);
      toast.success('Usuario actualizado correctamente');
      loadUsers();
      handleCancelEdit();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar usuario');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/auth/users/${userId}/status`, { is_active: !currentStatus });
      toast.success(`Usuario ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
      loadUsers();
    } catch (error: any) {
      toast.error('Error al cambiar estado del usuario');
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario "${userName}"?`)) return;

    try {
      await api.delete(`/auth/users/${userId}`);
      toast.success('Usuario eliminado correctamente');
      loadUsers();
    } catch (error: any) {
      toast.error('Error al eliminar usuario');
    }
  };

  const handleOpenPasswordModal = (userId: string) => {
    setPasswordForm({ userId, password: '', showModal: true });
  };

  const handleClosePasswordModal = () => {
    setPasswordForm({ userId: '', password: '', showModal: false });
  };

  const handleSavePassword = async () => {
    if (!passwordForm.password || passwordForm.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await api.put(`/auth/users/${passwordForm.userId}/password`, { password: passwordForm.password });
      toast.success('Contraseña actualizada correctamente');
      handleClosePasswordModal();
    } catch (error: any) {
      toast.error('Error al actualizar contraseña');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
            <UsersIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Administración de Usuarios</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Gestiona los usuarios del sistema</p>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Rol</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                  {editingUser?.id === user.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'admin' | 'moza' })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="moza">Mozo(a)</option>
                          <option value="admin">Administrador(a)</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          user.is_active 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {user.is_active ? <CheckCircleIcon size={14} /> : <XCircleIcon size={14} />}
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                            title="Guardar"
                          >
                            <SaveIcon size={16} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            title="Cancelar"
                          >
                            <XIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(user.created_at).toLocaleDateString('es-PE')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' 
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                          {user.role === 'admin' ? 'Administrador(a)' : 'Mozo(a)'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          user.is_active 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {user.is_active ? <CheckCircleIcon size={14} /> : <XCircleIcon size={14} />}
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            title="Editar"
                          >
                            <EditIcon size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenPasswordModal(user.id)}
                            className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                            title="Cambiar contraseña"
                          >
                            <KeyIcon size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.is_active
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                            }`}
                            title={user.is_active ? 'Desactivar' : 'Activar'}
                          >
                            {user.is_active ? <XCircleIcon size={16} /> : <CheckCircleIcon size={16} />}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.name)}
                            className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            title="Eliminar"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">No hay usuarios registrados</p>
          </div>
        )}
      </div>

      {/* Modal de cambio de contraseña */}
      {passwordForm.showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center">
                <KeyIcon size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Cambiar Contraseña</h3>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={passwordForm.password}
                onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSavePassword}
                className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
              >
                <SaveIcon size={18} />
                Guardar
              </button>
              <button
                onClick={handleClosePasswordModal}
                className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
