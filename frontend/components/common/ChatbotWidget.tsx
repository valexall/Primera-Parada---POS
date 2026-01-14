import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Maximize2, 
  Minimize2, 
  Bot, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { chatbotService, ChatMessage, ChatResponse } from '../../services/chatbotService';
import { useAuth } from '../../context/AuthContext';

interface ChatbotWidgetProps {
  context?: 'help' | 'menu-analysis';
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ context = 'help' }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mensaje de bienvenida al abrir (Actualizado con el nombre Iris)
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content:
          context === 'menu-analysis'
            ? '¡Hola! 👋 Soy Iris, tu asistente de análisis de menú. Puedo ayudarte a revisar tu historial de ventas y sugerirte qué platos preparar. ¿En qué te ayudo hoy?'
            : '¡Hola! 👋 Soy Iris, tu asistente virtual. Estoy aquí para ayudarte a usar el sistema POS Primera-Parada. ¿Qué necesitas saber?',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);

      if (context === 'menu-analysis') {
        loadSuggestions();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, context]);

  // Solo mostrar el chatbot para administradores
  if (user?.role !== 'admin') {
    return null;
  }

  const loadSuggestions = async () => {
    try {
      const response = await chatbotService.sendMessage({
        message: 'Dame sugerencias rápidas',
        context: 'menu-analysis',
      });
      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Error al cargar sugerencias:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response: ChatResponse = await chatbotService.sendMessage({
        message: inputMessage,
        conversationHistory: messages,
        context,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(response.timestamp),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ ${error instanceof Error ? error.message : 'Lo siento, ocurrió un error al procesar tu mensaje.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Botón flotante (Estilo Amber para coincidir con el sistema) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-6 md:bottom-6 md:right-6 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl p-4 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all duration-300 z-50 group"
          aria-label="Hablar con Iris"
        >
          <MessageCircle size={24} className="group-hover:animate-pulse" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-slate-800">
            AI
          </span>
        </button>
      )}

      {/* Widget de chat */}
      <div
        className={`fixed bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col transition-all duration-300 border border-slate-200 dark:border-slate-700 overflow-hidden ${
          isOpen 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-10 pointer-events-none'
        } ${
          isExpanded ? 'inset-4 md:inset-10 w-auto h-auto' : 'bottom-20 right-6 md:bottom-6 md:right-6 w-[380px] h-[550px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-10rem)]'
        }`}
      >
        {/* Header - Identidad Iris */}
        <div className="bg-amber-500 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Bot size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Iris</h3>
              <p className="text-xs text-amber-50 opacity-90 font-medium">
                {context === 'menu-analysis' ? 'Análisis de Menú' : 'Soporte POS'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleExpand}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors text-white"
              aria-label={isExpanded ? 'Minimizar' : 'Expandir'}
            >
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors text-white"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Área de Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 no-scrollbar">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl shadow-sm text-sm ${
                  msg.role === 'user'
                    ? 'bg-amber-500 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.timestamp && (
                  <p
                    className={`text-[10px] mt-1.5 text-right font-medium ${
                      msg.role === 'user' ? 'text-amber-100' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-none border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-amber-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Iris está escribiendo...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias rápidas */}
        {suggestions.length > 0 && (
          <div className="px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shrink-0">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <Sparkles size={12} />
              <span>Sugerencias</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all text-left truncate max-w-full"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 rounded-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus-within:border-amber-500 dark:focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje a Iris..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="p-1.5 rounded-full bg-amber-500 text-white disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed hover:bg-amber-600 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};