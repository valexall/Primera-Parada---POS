import { supabase } from '../../config/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  MenuAnalysisData,
  MenuSuggestion,
} from './chatbot.types';

export class ChatbotService {
  private geminiApiKey: string;
  private geminiModel: string = 'gemini-pro';

  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    if (!this.geminiApiKey) {
      console.warn('⚠️ GEMINI_API_KEY no configurada. El chatbot no funcionará correctamente.');
    }
  }

  /**
   * Procesa un mensaje del usuario y genera una respuesta
   */
  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const { message, conversationHistory = [], context = 'help' } = request;

      // Construir mensajes para OpenAI
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: this.getSystemPrompt(context),
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message,
        },
      ];

      // Si el contexto es análisis de menú, obtener datos relevantes
      if (context === 'menu-analysis') {
        const menuData = await this.getMenuHistoryData();
        messages[0].content += `\n\nDatos del historial de menú:\n${JSON.stringify(menuData, null, 2)}`;
      }

      // Llamar a la API de Gemini
      const response = await this.callGemini(messages);

      return {
        message: response,
        timestamp: new Date(),
        suggestions: context === 'menu-analysis' ? await this.generateQuickSuggestions() : undefined,
      };
    } catch (error) {
      console.error('Error en ChatbotService.processMessage:', error);
      throw new Error('Error al procesar el mensaje del chatbot');
    }
  }

  /**
   * Genera sugerencias de menú basadas en el historial de ventas
   */
  async generateMenuSuggestions(): Promise<MenuSuggestion[]> {
    try {
      const menuData = await this.getMenuHistoryData();

      if (menuData.length === 0) {
        return [];
      }

      // Analizar datos con OpenAI para generar sugerencias inteligentes
      const prompt = `
Analiza el siguiente historial de ventas de un restaurante y genera sugerencias de qué platos preparar mañana.
Considera:
- Día de la semana (hoy es ${new Date().toLocaleDateString('es-PE', { weekday: 'long' })})
- Patrones de ventas históricas
- Márgenes de ganancia
- Popularidad de los platos

Datos:
${JSON.stringify(menuData, null, 2)}

Responde SOLO con un JSON array con este formato:
[
  {
    "itemName": "nombre del plato",
    "reason": "razón de la sugerencia",
    "confidence": 0.85,
    "historicalData": {
      "avgSales": 25,
      "bestDay": "lunes",
      "profitMargin": 0.65
    }
  }
]
`;

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: 'Eres un asistente experto en análisis de datos de restaurantes. Respondes SOLO con JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      const response = await this.callGemini(messages);

      // Parsear la respuesta JSON
      try {
        const suggestions = JSON.parse(response);
        return suggestions;
      } catch (parseError) {
        console.error('Error al parsear sugerencias:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error en generateMenuSuggestions:', error);
      throw new Error('Error al generar sugerencias de menú');
    }
  }

  /**
   * Obtiene datos del historial de menú desde Supabase
   */
  private async getMenuHistoryData(): Promise<MenuAnalysisData[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('menu_history')
        .select('*')
        .gte('date', thirtyDaysAgo.toISOString())
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        itemName: item.item_name,
        date: item.date,
        dayOfWeek: new Date(item.date).toLocaleDateString('es-PE', { weekday: 'long' }),
        quantitySold: item.quantity_sold || 0,
        revenue: item.revenue || 0,
        costPerUnit: item.cost_per_unit || 0,
        profitMargin: item.profit_margin || 0,
      }));
    } catch (error) {
      console.error('Error al obtener historial de menú:', error);
      return [];
    }
  }

  /**
   * Genera sugerencias rápidas para mostrar en el chat
   */
  private async generateQuickSuggestions(): Promise<string[]> {
    return [
      '📊 ¿Qué platos han vendido mejor esta semana?',
      '📈 ¿Qué días tengo más ventas?',
      '💰 ¿Cuáles son los platos más rentables?',
      '📅 ¿Qué debo cocinar mañana?',
      '🔍 Analiza las tendencias del mes',
    ];
  }

  /**
   * Obtiene el prompt del sistema según el contexto
   */
  private getSystemPrompt(context: 'help' | 'menu-analysis'): string {
    const basePrompt = `
Eres un asistente inteligente para el sistema POS "Primera-Parada", un restaurante peruano.

Tu función es ayudar a los usuarios con:
- Cómo usar el sistema
- Navegar entre páginas
- Realizar acciones comunes
- Resolver problemas

Contexto del sistema:
- Sistema de punto de venta para restaurante
- Páginas: Dashboard, Menú, Órdenes, Cocina, Caja, Inventario, Historial
- Los usuarios pueden ser: Administrador, Cajero, o Cocinero

Responde de forma concisa, amigable y en español.
`;

    if (context === 'menu-analysis') {
      return `${basePrompt}

MODO ESPECIAL: Análisis de Menú
Además de ayuda general, puedes analizar el historial de ventas y sugerir qué platos preparar.
Considera:
- Patrones de ventas por día de la semana
- Temporadas y fechas especiales
- Rentabilidad de cada plato
- Tendencias recientes

Proporciona análisis claros y accionables.
`;
    }

    return basePrompt;
  }

  /**
   * Realiza una llamada a la API de Google Gemini usando el SDK oficial
   */
  private async callGemini(messages: ChatMessage[]): Promise<string> {
    try {
      // Inicializar el SDK de Google Generative AI
      const genAI = new GoogleGenerativeAI(this.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: this.geminiModel });

      // System prompt
      const systemPrompt = messages.find((msg) => msg.role === 'system')?.content || '';

      // Construir el historial de conversación (sin el último mensaje y sin system)
      const history = messages
        .filter((msg) => msg.role !== 'system')
        .slice(0, -1)
        .map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        }));

      // El último mensaje del usuario
      const userMessage = messages[messages.length - 1].content;

      // Combinar system prompt con el mensaje del usuario
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\n${userMessage}` 
        : userMessage;

      // Iniciar chat con historial (si existe y es válido)
      const chat = model.startChat({
        history: history.length > 0 && history[0].role === 'user' ? history : [],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      });

      // Enviar mensaje
      const result = await chat.sendMessage(fullPrompt);
      const response = result.response;
      const text = response.text();

      return text || 'Lo siento, no pude generar una respuesta.';
    } catch (error) {
      console.error('Error al llamar a Gemini:', error);

      // Respuesta de fallback cuando Gemini no está disponible
      return `Lo siento, estoy experimentando problemas técnicos en este momento. Por favor, intenta:
- Verificar la consola del servidor para más detalles
- Asegurarte de que la API Key de Gemini está configurada correctamente
- Intentar de nuevo en unos momentos`;
    }
  }
}

export const chatbotService = new ChatbotService();
