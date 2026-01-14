import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon, XIcon, SaveIcon, XCircleIcon, CheckCircleIcon, UtensilsCrossed, MicIcon, MicOffIcon } from 'lucide-react';
import { MenuItem } from '../types';
import { menuService } from '../services/menuService';
import { useMenu } from '../context/MenuContext';
import toast from 'react-hot-toast';

const MenuPage: React.FC = () => {
  // ⚡ USAR CONTEXT EN LUGAR DE LOCAL STATE
  const { menuItems, updateMenuItemLocal } = useMenu();
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '' });
  
  // Estados para reconocimiento de voz
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false); // Si el navegador lo soporta
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Si está habilitado para el usuario
  const [voiceErrorCount, setVoiceErrorCount] = useState(0); // Contador de errores
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const hasProcessedResultRef = useRef(false); // Evitar duplicados
  
  // Estados para grabación de audio (alternativa a Web Speech API)
  const [isRecording, setIsRecording] = useState(false);
  const [useAudioRecording, setUseAudioRecording] = useState(false); // Cambiar a grabación directa
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Recordar último precio usado
  const [lastUsedPrice, setLastUsedPrice] = useState<string>('');
  
  // Precios rápidos comunes
  const quickPrices = ['10.00', '12.00', '15.00', '20.00'];

  // ❌ ELIMINADO: useEffect(() => { loadMenu(); }, []);
  // ❌ ELIMINADO: const loadMenu = async () => { ... };
  
  // Inicializar reconocimiento de voz
  useEffect(() => {
    // Verificar si el navegador soporta Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'es-ES'; // Español
      
      recognition.onstart = () => {
        setIsListening(true);
        hasProcessedResultRef.current = false;
      };
      
      recognition.onresult = (event: any) => {
        // Evitar procesar múltiples veces el mismo resultado
        if (hasProcessedResultRef.current) return;
        
        const transcript = event.results[0][0].transcript;
        setFormData(prev => ({ ...prev, name: transcript }));
        setIsListening(false);
        setVoiceErrorCount(0);
        hasProcessedResultRef.current = true; // Marcar como procesado
      };
      
      recognition.onerror = (event: any) => {
        // Si es error de network, cambiar silenciosamente al modo alternativo
        if (event.error === 'network') {
          setVoiceEnabled(false);
          setUseAudioRecording(true);
          setIsListening(false);
          return;
        }
        
        // Para otros errores, cambiar después de 2 intentos
        setVoiceErrorCount(prev => {
          const newCount = prev + 1;
          
          if (newCount >= 2) {
            setVoiceEnabled(false);
            setUseAudioRecording(true);
          }
          
          return newCount;
        });
        
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      setVoiceSupported(false);
      setUseAudioRecording(true);
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignorar errores al limpiar
        }
      }
    };
  }, []);
  
  // Nueva función: Grabar audio y transcribir con Groq Whisper
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Configurar MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // Detener todos los tracks de audio
        stream.getTracks().forEach(track => track.stop());
        
        // Crear blob del audio grabado
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Enviar al backend para transcripción
        await transcribeAudio(audioBlob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
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
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      
      const response = await fetch('http://localhost:3001/api/transcription/audio', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Error en la transcripción');
      }
      
      const result = await response.json();
      const text = result.data.text;
      
      setFormData(prev => ({ ...prev, name: text }));
      
    } catch (error: any) {
      toast.error('Error al transcribir. Intenta de nuevo.');
    }
  };
  
  const toggleVoiceInput = () => {
    if (useAudioRecording) {
      // Usar grabación de audio
      if (isRecording) {
        stopAudioRecording();
      } else {
        startAudioRecording();
      }
    } else {
      // Usar Web Speech API (Google)
      toggleVoiceRecognition();
    }
  };
  
  const toggleVoiceRecognition = async () => {
    if (!recognitionRef.current || !voiceSupported) {
      toast.error('Tu navegador no soporta reconocimiento de voz', { duration: 3000 });
      return;
    }
    
    if (isListening) {
      recognitionRef.current.abort();
      setIsListening(false);
      return;
    }
    
    // Verificar permisos del micrófono primero
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      // Ahora iniciar el reconocimiento
      try {
        hasProcessedResultRef.current = false; // Reset antes de iniciar
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error: any) {
        if (error.message?.includes('already started')) {
          recognitionRef.current.abort();
          setTimeout(() => {
            recognitionRef.current?.start();
            setIsListening(true);
          }, 100);
        }
      }
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Debes permitir el acceso al micrófono', { duration: 4000 });
      } else if (error.name === 'NotFoundError') {
        toast.error('No se encontró ningún micrófono', { duration: 4000 });
      } else {
        toast.error('Error al acceder al micrófono');
      }
      setIsListening(false);
    }
  };

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ name: item.name, price: item.price.toString() });
    } else {
      setEditingId(null);
      // Usar último precio si existe, sino vacío
      setFormData({ name: '', price: lastUsedPrice || '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    
    try {
      if (editingId) {
        // Optimistic update
        updateMenuItemLocal(editingId, { name: formData.name, price: parseFloat(formData.price) });
        
        await menuService.update(editingId, { name: formData.name, price: parseFloat(formData.price) });
        toast.success('Plato actualizado');
      } else {
        await menuService.create({ name: formData.name, price: parseFloat(formData.price) });
        toast.success('Plato creado');
        // Guardar último precio usado
        setLastUsedPrice(formData.price);
        // ✅ No se necesita loadMenu() - Realtime lo manejará
      }
      setIsModalOpen(false);
    } catch (e) {
      toast.error('Error al guardar');
    }
  };

  const handleDelete = (id: string) => {
    // Alerta personalizada "In-App"
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-bold text-slate-800">¿Estás seguro?</p>
          <p className="text-sm text-slate-500">Eliminarás este plato permanentemente.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              await menuService.delete(id);
              toast.success('Plato eliminado');
              // ✅ No se necesita loadMenu() - Realtime lo manejará
            }}
            className="flex-1 px-3 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 shadow-md shadow-red-200"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    ), { 
      duration: 5000, 
      icon: '🗑️',
      style: { minWidth: '300px' } 
    });
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    const newAvailability = !item.is_available;
    
    // Optimistic update
    updateMenuItemLocal(item.id, { is_available: newAvailability });
    
    const result = await menuService.toggleAvailability(item.id, newAvailability);
    
    if (result) {
      toast.success(newAvailability ? `${item.name} marcado como disponible` : `${item.name} marcado como agotado`, {
        icon: newAvailability ? '✅' : '❌'
      });
      // ✅ No se necesita loadMenu() - Realtime lo manejará
    } else {
      // Revertir si falla
      updateMenuItemLocal(item.id, { is_available: item.is_available });
      toast.error('Error al actualizar disponibilidad');
    }
  };

  const filteredItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
            <UtensilsCrossed size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Gestión de Menú</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Administra los precios y platos disponibles</p>
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
          <div className="relative max-w-md">
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nombre del Plato</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                      {item.is_available === false && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">
                          AGOTADO
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">S/. {item.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleToggleAvailability(item)}
                        className={`p-2 rounded-lg transition-colors ${
                          item.is_available === false
                            ? 'text-red-400 dark:text-red-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                            : 'text-green-400 dark:text-green-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
                        }`}
                        title={item.is_available === false ? 'Marcar como disponible' : 'Marcar como agotado'}
                      >
                        {item.is_available === false ? <CheckCircleIcon size={18} /> : <XCircleIcon size={18} />}
                      </button>
                      <button onClick={() => openModal(item)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors">
                        <PencilIcon size={18} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
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

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500"
            >
              <XIcon size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              {editingId ? 'Editar Plato' : 'Crear Nuevo Plato'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                <div className="relative">
                  <input 
                    autoFocus
                    type="text" 
                    className={`w-full p-3 ${(voiceSupported && voiceEnabled) || useAudioRecording ? 'pr-12' : 'pr-4'} border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200`}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Ej: Lomo Saltado"
                  />
                  {((voiceSupported && voiceEnabled) || useAudioRecording) && (
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                        isListening || isRecording
                          ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600'
                      }`}
                      title={isListening || isRecording ? 'Detener grabación' : (useAudioRecording ? 'Grabar y transcribir con Groq' : 'Dictar con voz')}
                    >
                      {isListening || isRecording ? <MicOffIcon size={18} /> : <MicIcon size={18} />}
                    </button>
                  )}
                </div>
                {(isListening || isRecording) && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 animate-pulse">
                    🎤 {isRecording ? 'Grabando... Haz clic para terminar' : 'Escuchando...'}
                  </p>
                )}
                {voiceSupported && !voiceEnabled && !useAudioRecording && (
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceEnabled(true);
                      setVoiceErrorCount(0);
                      toast.success('Reconocimiento de voz reactivado');
                    }}
                    className="text-xs text-amber-600 dark:text-amber-400 mt-1 hover:underline"
                  >
                    🔄 Reactivar reconocimiento de voz
                  </button>
                )}
                {!voiceSupported && !useAudioRecording && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    💡 Tu navegador no soporta dictado por voz
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Precio (S/.)</label>
                
                {/* Botones de precio rápido - MÁS PROMINENTES */}
                <div className="mb-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-2">⚡ Precios rápidos:</span>
                  <div className="flex flex-wrap gap-2">
                    {quickPrices.map(price => (
                      <button
                        key={price}
                        type="button"
                        onClick={() => setFormData({...formData, price})}
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
                      onClick={() => setFormData({...formData, price: lastUsedPrice})}
                      className={`w-full mt-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all border-2 ${
                        formData.price === lastUsedPrice
                          ? 'bg-green-500 text-white border-green-600 shadow-lg shadow-green-200 dark:shadow-green-900/50'
                          : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 border-dashed hover:bg-green-100 dark:hover:bg-green-900/40 hover:border-solid'
                      }`}
                      title="Último precio usado"
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
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  required
                  placeholder="O escribe manualmente..."
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-200 dark:shadow-amber-900/50 transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <SaveIcon size={18} /> Guardar
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