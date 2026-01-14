import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  context?: 'help' | 'menu-analysis';
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  timestamp: Date;
}

export interface MenuSuggestion {
  itemName: string;
  reason: string;
  confidence: number;
  historicalData: {
    avgSales: number;
    bestDay: string;
    profitMargin: number;
  };
}

export const chatbotService = {
  /**
   * Envía un mensaje al chatbot
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await api.post('/chatbot/ask', request);
      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje al chatbot:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? ((error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al comunicarse con el chatbot')
        : 'Error al comunicarse con el chatbot';
      throw new Error(errorMessage);
    }
  },

  /**
   * Obtiene sugerencias de menú basadas en el historial
   */
  async getMenuSuggestions(): Promise<MenuSuggestion[]> {
    try {
      const response = await api.get('/chatbot/menu-suggestions');
      return response.data.suggestions || [];
    } catch (error) {
      console.error('Error al obtener sugerencias de menú:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? ((error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al obtener sugerencias de menú')
        : 'Error al obtener sugerencias de menú';
      throw new Error(errorMessage);
    }
  },

  /**
   * Verifica el estado del servicio de chatbot
   */
  async checkHealth(): Promise<{ status: string; message: string }> {
    try {
      const response = await api.get('/chatbot/health');
      return response.data;
    } catch (error) {
      console.error('Error al verificar salud del chatbot:', error);
      return {
        status: 'error',
        message: 'No se pudo conectar con el servicio de chatbot',
      };
    }
  },
};
