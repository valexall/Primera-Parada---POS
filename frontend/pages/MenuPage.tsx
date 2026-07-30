import React, { useState, useRef, useCallback } from 'react';
import {
  PlusIcon, PencilIcon, TrashIcon, SearchIcon, XIcon, SaveIcon,
  XCircleIcon, CheckCircleIcon, UtensilsCrossed, MicIcon, MicOffIcon,
  ImageIcon, Upload, Trash2Icon, ImageOffIcon, TagIcon,
} from 'lucide-react';
import { MenuItem, MenuCategory, MENU_CATEGORIES, CATEGORY_COLORS } from '../types';
import { menuService } from '../services/menuService';
import { useMenu } from '../context/MenuContext';
import { API_CONFIG } from '../constants/api';
import { CategoryTabs } from '../components/common/CategoryTabs';
import toast from 'react-hot-toast';

// ─── Constantes de validación (RF12) ────────────────────────────────────────
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// ─── Componente de zona de carga de imagen ───────────────────────────────────
interface ImageUploadZoneProps {
  currentImageUrl?: string | null;
  previewUrl: string | null;
  onFileSelected: (file: File) => void;
  onRemovePreview: () => void;
  onDeleteCurrent: () => void;
  imageError: string | null;
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  currentImageUrl,
  previewUrl,
  onFileSelected,
  onRemovePreview,
  onDeleteCurrent,
  imageError,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Solo se permiten imágenes JPG, PNG o WEBP';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `La imagen supera el tamaño máximo de ${MAX_SIZE_MB} MB`;
    }
    return null;
  };

  const handleFile = (file: File) => {
    const err = validate(file);
    if (err) {
      toast.error(err);
      return;
    }
    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const displayImage = previewUrl || currentImageUrl;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
        Imagen del plato
        <span className="ml-1 text-xs font-normal text-slate-400">(JPG, PNG, WEBP · máx. 2 MB)</span>
      </label>

      {displayImage ? (
        /* Vista previa / imagen actual */
        <div className="relative group rounded-xl overflow-hidden border-2 border-amber-200 dark:border-amber-700 bg-slate-50 dark:bg-slate-900">
          <img
            src={displayImage}
            alt="Vista previa"
            className="w-full h-40 object-cover"
          />
          {/* Badge: nuevo archivo vs imagen guardada */}
          {previewUrl && !currentImageUrl && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
              Nueva imagen
            </span>
          )}
          {previewUrl && currentImageUrl && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
              Reemplazará la actual
            </span>
          )}

          {/* Botones de acción sobre imagen */}
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-2 bg-white text-slate-800 text-sm font-bold rounded-lg hover:bg-amber-50 transition-colors flex items-center gap-1.5"
            >
              <Upload size={14} /> Cambiar
            </button>
            <button
              type="button"
              onClick={previewUrl ? onRemovePreview : onDeleteCurrent}
              className="px-3 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1.5"
            >
              <Trash2Icon size={14} /> {previewUrl ? 'Quitar' : 'Eliminar'}
            </button>
          </div>
        </div>
      ) : (
        /* Zona de drop vacía */
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-2 h-36 rounded-xl border-2 border-dashed cursor-pointer transition-all
            ${isDragging
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 scale-[1.01]'
              : 'border-slate-200 dark:border-slate-600 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-900/10'
            }
          `}
        >
          <div className={`p-3 rounded-full transition-colors ${isDragging ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-slate-100 dark:bg-slate-700'}`}>
            <ImageIcon size={22} className={isDragging ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">JPG, PNG, WEBP hasta 2 MB</p>
          </div>
        </div>
      )}

      {imageError && (
        <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
          <XCircleIcon size={12} /> {imageError}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Limpiar para que onChange vuelva a dispararse si se elige el mismo archivo
          e.target.value = '';
        }}
      />
    </div>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────
const MenuPage: React.FC = () => {
  const { menuItems, updateMenuItemLocal } = useMenu();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', category: 'Extras' as MenuCategory });

  // Estados de imagen (RF12)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [deleteCurrentImage, setDeleteCurrentImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Estados para grabación de audio con Groq
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Recordar último precio usado
  const [lastUsedPrice, setLastUsedPrice] = useState<string>('');

  // Precios rápidos comunes
  const quickPrices = ['10.00', '12.00', '15.00', '20.00'];

  // Limpiar preview al cerrar modal
  const resetImageState = useCallback(() => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setDeleteCurrentImage(false);
    setImageError(null);
  }, [imagePreviewUrl]);

  // Grabar audio y transcribir con Groq Whisper
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: unknown) {
      const err = error as { name?: string };
      if (err.name === 'NotAllowedError') {
        toast.error('Debes permitir el acceso al micrófono');
      } else {
        toast.error('No se pudo acceder al micrófono');
      }
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const data = new FormData();
      data.append('audio', audioBlob, 'audio.webm');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/transcription/audio`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data,
      });
      if (!response.ok) throw new Error('Error en la transcripción');
      const result = await response.json();
      setFormData(prev => ({ ...prev, name: result.data.text }));
    } catch {
      toast.error('Error al transcribir. Intenta de nuevo.');
    }
  };

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ name: item.name, price: item.price.toString(), category: (item.category ?? 'Extras') as MenuCategory });
    } else {
      setEditingId(null);
      setFormData({ name: '', price: lastUsedPrice || '', category: 'Extras' });
    }
    resetImageState();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', price: '', category: 'Extras' });
    setEditingId(null);
    resetImageState();
  };

  // Manejar selección de imagen
  const handleImageSelected = (file: File) => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    const url = URL.createObjectURL(file);
    setSelectedImageFile(file);
    setImagePreviewUrl(url);
    setDeleteCurrentImage(false);
    setImageError(null);
  };

  // Quitar imagen seleccionada (sin subir aún)
  const handleRemovePreview = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
  };

  // Marcar imagen actual para borrar al guardar
  const handleDeleteCurrentImage = () => {
    setDeleteCurrentImage(true);
    setSelectedImageFile(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    try {
      let savedItemId: string | null = editingId;

      if (editingId) {
        // Optimistic update de nombre/precio/categoría
        updateMenuItemLocal(editingId, { name: formData.name, price: parseFloat(formData.price), category: formData.category });

        const result = await menuService.updateMenuItem(editingId, {
          name: formData.name,
          price: parseFloat(formData.price),
          category: formData.category,
        });

        if (result) {
          toast.success('Plato actualizado exitosamente');
        } else {
          toast.error('Error al actualizar plato');
          return;
        }
      } else {
        const newItem = await menuService.createMenuItem({
          name: formData.name,
          price: parseFloat(formData.price),
          category: formData.category,
        });

        if (newItem) {
          toast.success('Plato agregado exitosamente');
          setLastUsedPrice(formData.price);
          savedItemId = newItem.id;
        } else {
          toast.error('Error al crear plato');
          return;
        }
      }

      // ── Gestión de imagen (RF12) ──────────────────────────────────────
      if (savedItemId) {
        if (selectedImageFile) {
          setIsUploadingImage(true);
          try {
            const updated = await menuService.uploadImage(savedItemId, selectedImageFile);
            if (updated) {
              updateMenuItemLocal(savedItemId, { image_url: updated.image_url });
              toast.success('Imagen guardada correctamente', { icon: '🖼️' });
            }
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : 'Error al subir imagen';
            toast.error(errMsg);
          } finally {
            setIsUploadingImage(false);
          }
        } else if (deleteCurrentImage) {
          setIsUploadingImage(true);
          try {
            const updated = await menuService.deleteImage(savedItemId);
            if (updated) {
              updateMenuItemLocal(savedItemId, { image_url: null });
              toast.success('Imagen eliminada', { icon: '🗑️' });
            }
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : 'Error al eliminar imagen';
            toast.error(errMsg);
          } finally {
            setIsUploadingImage(false);
          }
        }
      }
      // ─────────────────────────────────────────────────────────────────

      closeModal();
    } catch (error) {
      toast.error('Error al procesar la solicitud');
    }
  };

  const toggleVoiceInput = () => {
    if (isRecording) stopAudioRecording();
    else startAudioRecording();
  };

  const toggleAvailability = async (item: MenuItem) => {
    const newAvailability = !item.is_available;
    updateMenuItemLocal(item.id, { is_available: newAvailability });
    const result = await menuService.toggleAvailability(item.id, newAvailability);
    if (result) {
      toast.success(newAvailability ? `${item.name} marcado como disponible` : `${item.name} marcado como agotado`, {
        icon: newAvailability ? '✅' : '❌',
      });
    } else {
      updateMenuItemLocal(item.id, { is_available: item.is_available });
      toast.error('Error al actualizar disponibilidad');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este plato?')) return;
    const result = await menuService.deleteMenuItem(id);
    if (result) {
      toast.success('Plato eliminado exitosamente');
    } else {
      toast.error('Error al eliminar plato');
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Plato siendo editado (para la zona de imagen)
  const editingItem = editingId ? menuItems.find(m => m.id === editingId) : null;
  const currentImageUrl = deleteCurrentImage ? null : (editingItem?.image_url ?? null);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
            <UtensilsCrossed size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Gestión de Menú</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Administra los precios, platos e imágenes</p>
          </div>
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
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative max-w-md flex-1">
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
          {/* RF45 — Filtro por categoría */}
          <div className="mt-3">
            <CategoryTabs
              categories={['Todos', ...MENU_CATEGORIES]}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-16">Imagen</th>
                <th className="px-6 py-4">Nombre del Plato</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group">
                  {/* Thumbnail de imagen */}
                  <td className="px-6 py-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-600 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-600">
                        <ImageOffIcon size={16} className="text-slate-300 dark:text-slate-500" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                      {item.is_available === false && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">
                          AGOTADO
                        </span>
                      )}
                    </div>
                  </td>
                  {/* RF45 — Columna Categoría */}
                  <td className="px-6 py-4">
                    {(() => {
                      const cat = (item.category ?? 'Extras') as MenuCategory;
                      const colors = CATEGORY_COLORS[cat];
                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}>
                          <TagIcon size={10} />
                          {cat}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">S/. {item.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleAvailability(item)}
                        className={`p-2 rounded-lg transition-colors ${
                          item.is_available === false
                            ? 'text-red-400 dark:text-red-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                            : 'text-green-400 dark:text-green-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
                        }`}
                        title={item.is_available === false ? 'Marcar como disponible' : 'Marcar como agotado'}
                      >
                        {item.is_available === false ? <CheckCircleIcon size={18} /> : <XCircleIcon size={18} />}
                      </button>
                      <button
                        onClick={() => openModal(item)}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                        title="Editar plato e imagen"
                      >
                        <PencilIcon size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
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

      {/* ─── MODAL ─────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500"
            >
              <XIcon size={20} />
            </button>

            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              {editingId ? 'Editar Plato' : 'Crear Nuevo Plato'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                <div className="relative">
                  <input
                    autoFocus
                    type="text"
                    className="w-full p-3 pr-12 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ej: Lomo Saltado"
                  />
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse shadow-lg'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600'
                    }`}
                    title={isRecording ? 'Detener grabación' : 'Grabar y transcribir con Groq'}
                  >
                    {isRecording ? <MicOffIcon size={18} /> : <MicIcon size={18} />}
                  </button>
                </div>
                {isRecording && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 animate-pulse">
                    🎤 Grabando... Haz clic para terminar
                  </p>
                )}
              </div>

              {/* RF45 — Selector de Categoría */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <span className="flex items-center gap-1.5"><TagIcon size={14} /> Tipo de Plato</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MENU_CATEGORIES.map(cat => {
                    const colors = CATEGORY_COLORS[cat];
                    const isSelected = formData.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`py-2 px-3 rounded-xl text-sm font-bold border-2 transition-all ${
                          isSelected
                            ? `${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText} border-current scale-105 shadow-md`
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-amber-300'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Precio */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Precio (S/.)</label>
                <div className="mb-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-2">⚡ Precios rápidos:</span>
                  <div className="flex flex-wrap gap-2">
                    {quickPrices.map(price => (
                      <button
                        key={price}
                        type="button"
                        onClick={() => setFormData({ ...formData, price })}
                        className={`flex-1 min-w-[70px] px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${
                          formData.price === price
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/50 scale-105'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-2 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:border-amber-400 hover:scale-105'
                        }`}
                      >
                        S/. {price}
                      </button>
                    ))}
                  </div>
                  {lastUsedPrice && !quickPrices.includes(lastUsedPrice) && !editingId && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, price: lastUsedPrice })}
                      className={`w-full mt-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all border-2 ${
                        formData.price === lastUsedPrice
                          ? 'bg-green-500 text-white border-green-600 shadow-lg shadow-green-200 dark:shadow-green-900/50'
                          : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 border-dashed hover:bg-green-100 dark:hover:bg-green-900/40 hover:border-solid'
                      }`}
                    >
                      ⚡ Último usado: S/. {lastUsedPrice}
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="0.10"
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  required
                  placeholder="O escribe manualmente..."
                />
              </div>

              {/* ── Imagen (RF12) ── */}
              <ImageUploadZone
                currentImageUrl={currentImageUrl}
                previewUrl={imagePreviewUrl}
                onFileSelected={handleImageSelected}
                onRemovePreview={handleRemovePreview}
                onDeleteCurrent={handleDeleteCurrentImage}
                imageError={imageError}
              />

              {/* Botones */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImage}
                  className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-200 dark:shadow-amber-900/50 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isUploadingImage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Subiendo imagen...
                    </>
                  ) : (
                    <><SaveIcon size={18} /> Guardar</>
                  )}
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