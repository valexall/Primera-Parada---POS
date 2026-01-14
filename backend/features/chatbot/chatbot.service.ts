import { supabase } from '../../config/supabase';
import Groq from 'groq-sdk';
import {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  MenuAnalysisData,
  MenuSuggestion,
} from './chatbot.types';

export class ChatbotService {
  private groq: Groq | null = null;
  private model: string = 'llama-3.3-70b-versatile';

  constructor() {
    const apiKey = process.env.GROQ_API_KEY || '';
    if (!apiKey) {
      console.warn('⚠️ GROQ_API_KEY no configurada. El chatbot no funcionará correctamente.');
    } else {
      this.groq = new Groq({ apiKey });
    }
  }

  /**
   * Procesa un mensaje del usuario y genera una respuesta
   */
  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const { message, conversationHistory = [], context = 'help' } = request;

      // Detectar si el mensaje es sobre recomendaciones de menú
      const isMenuQuestion = this.isMenuRecommendationQuery(message);

      // Construir mensajes para el modelo
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: this.getSystemPrompt(isMenuQuestion ? 'menu-analysis' : context),
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message,
        },
      ];

      // Si la pregunta es sobre menú o el contexto es análisis de menú, obtener datos
      if (isMenuQuestion || context === 'menu-analysis') {
        const menuData = await this.getMenuHistoryData();
        
        if (menuData.length > 0) {
          // Limitar a los últimos 30 registros para no exceder tokens
          const recentData = menuData.slice(0, 30);
          
          // Agregar datos al prompt del sistema
          messages[0].content += `\n\n📊 DATOS REALES DEL HISTORIAL DE VENTAS (últimos 30 días):\n${JSON.stringify(recentData, null, 2)}`;
          
          // También obtener estadísticas resumidas
          const stats = this.calculateMenuStats(menuData);
          messages[0].content += `\n\n📈 ESTADÍSTICAS RESUMIDAS:\n${JSON.stringify(stats, null, 2)}`;
        } else {
          messages[0].content += '\n\n⚠️ No hay datos históricos disponibles en la base de datos.';
        }
      }

      // Llamar a la API de Groq
      const response = await this.callGroq(messages);

      return {
        message: response,
        timestamp: new Date(),
        suggestions: (isMenuQuestion || context === 'menu-analysis') ? await this.generateQuickSuggestions() : undefined,
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
      if (!this.groq) {
        console.warn('Groq no configurado. No se pueden generar sugerencias.');
        return [];
      }

      const menuData = await this.getMenuHistoryData();

      if (menuData.length === 0) {
        console.log('No hay datos de historial de menú disponibles.');
        return [];
      }

      // Limitar datos para evitar tokens excesivos
      const limitedData = menuData.slice(0, 50);

      // Analizar datos con el modelo para generar sugerencias inteligentes
      const prompt = `
Analiza el siguiente historial de ventas de un restaurante y genera sugerencias de qué platos preparar mañana.
Considera:
- Día de la semana (hoy es ${new Date().toLocaleDateString('es-PE', { weekday: 'long' })})
- Patrones de ventas históricas
- Márgenes de ganancia
- Popularidad de los platos

Datos:
${JSON.stringify(limitedData, null, 2)}

Responde SOLO con un JSON array con este formato (sin texto adicional):
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
          content: 'Eres un asistente experto en análisis de datos de restaurantes. Respondes SOLO con JSON válido, sin texto adicional.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      const response = await this.callGroq(messages);

      // Parsear la respuesta JSON
      try {
        // Limpiar bloques de código markdown si el modelo los incluye (ej: ```json ... ```)
        let jsonString = response.replace(/```json\n?|\n?```/g, '').trim();
        
        // Eliminar cualquier texto antes del array JSON
        const arrayStart = jsonString.indexOf('[');
        const arrayEnd = jsonString.lastIndexOf(']');
        
        if (arrayStart !== -1 && arrayEnd !== -1) {
          jsonString = jsonString.substring(arrayStart, arrayEnd + 1);
        }

        const suggestions = JSON.parse(jsonString);
        
        // Validar estructura de las sugerencias
        if (Array.isArray(suggestions)) {
          return suggestions.filter(s => 
            s.itemName && 
            s.reason && 
            typeof s.confidence === 'number' &&
            s.historicalData
          );
        }
        
        return [];
      } catch (parseError) {
        console.error('Error al parsear sugerencias:', parseError);
        console.error('Respuesta recibida:', response);
        return [];
      }
    } catch (error) {
      console.error('Error en generateMenuSuggestions:', error);
      // No lanzar error, devolver array vacío
      return [];
    }
  }

  /**
   * Obtiene datos del historial de menú desde Supabase
   */
  private async getMenuHistoryData(): Promise<MenuAnalysisData[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Primero intentar obtener datos de menu_history
      const { data: historyData, error: historyError } = await supabase
        .from('menu_history')
        .select('*')
        .gte('snapshot_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: false })
        .limit(30);

      if (historyError) {
        console.error('Error al obtener menu_history:', historyError);
      }

      let processedData: MenuAnalysisData[] = [];
      
      // Procesar datos de menu_history si existen
      if (historyData && historyData.length > 0) {
        historyData.forEach((snapshot: any) => {
          const salesStats = snapshot.sales_stats || {};
          const snapshotDate = snapshot.snapshot_date;
          const dayOfWeek = new Date(snapshotDate).toLocaleDateString('es-PE', { weekday: 'long' });

          Object.entries(salesStats).forEach(([itemName, stats]: [string, any]) => {
            if (stats && stats.quantity_sold > 0) {
              processedData.push({
                itemName: itemName,
                date: snapshotDate,
                dayOfWeek: dayOfWeek,
                quantitySold: stats.quantity_sold || 0,
                revenue: stats.total_revenue || 0,
                costPerUnit: stats.avg_cost || 0,
                profitMargin: stats.profit_margin || 0,
              });
            }
          });
        });
      }

      // Si no hay datos en menu_history, consultar directamente order_items
      if (processedData.length === 0) {
        console.log('📊 No hay datos en menu_history, consultando order_items directamente...');
        
        const { data: orderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select('menu_item_name, price, quantity, created_at')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (orderItemsError) {
          console.error('Error al obtener order_items:', orderItemsError);
          return [];
        }

        if (orderItems && orderItems.length > 0) {
          // Agrupar por plato y fecha
          const groupedData = new Map<string, Map<string, {
            quantity: number;
            revenue: number;
          }>>();

          orderItems.forEach((item: any) => {
            const itemName = item.menu_item_name;
            const date = new Date(item.created_at).toISOString().split('T')[0];
            
            if (!groupedData.has(itemName)) {
              groupedData.set(itemName, new Map());
            }
            
            const itemDates = groupedData.get(itemName)!;
            if (!itemDates.has(date)) {
              itemDates.set(date, { quantity: 0, revenue: 0 });
            }
            
            const dateData = itemDates.get(date)!;
            dateData.quantity += item.quantity;
            dateData.revenue += item.price * item.quantity;
          });

          // Convertir a formato MenuAnalysisData
          groupedData.forEach((dates, itemName) => {
            dates.forEach((data, date) => {
              const dayOfWeek = new Date(date).toLocaleDateString('es-PE', { weekday: 'long' });
              processedData.push({
                itemName: itemName,
                date: date,
                dayOfWeek: dayOfWeek,
                quantitySold: data.quantity,
                revenue: data.revenue,
                costPerUnit: 0, // No disponible desde order_items
                profitMargin: 0.4, // Margen estimado del 40%
              });
            });
          });

          console.log(`✅ Datos obtenidos de order_items: ${processedData.length} registros`);
        }
      } else {
        console.log(`✅ Datos obtenidos de menu_history: ${processedData.length} registros`);
      }

      return processedData;
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
Eres un asistente del sistema POS "Primera Parada", un restaurante peruano.

IMPORTANTE - ESTILO DE RESPUESTA:
- Respuestas CORTAS y DIRECTAS (máximo 3-4 líneas)
- Usa NOMBRES EXACTOS de botones y páginas
- Guía paso a paso de forma práctica
- NO inventes nombres, usa solo los que están aquí

CONTEXTO PERÚ:
- Moneda: Soles (S/)
- Formato: Ve directo al grano

📍 MENÚ LATERAL REAL DEL SISTEMA (lado izquierdo):

**SECCIÓN: Operación**
1. 📋 **Menú del Día** 
   → Página: "Gestión de Menú"
   → Botón verde: "+ Agregar Item al Menú"
   → Aquí agregas, editas y eliminas platos

2. 📝 **Tomar Pedido**
   → Página: "Nuevo Pedido"
   → Seleccionas platos y creas órdenes
   → Eliges "Para comer aquí" o "Para llevar"

3. 👨‍🍳 **Cocina**
   → Página: "Panel de Cocina"
   → Ves órdenes pendientes
   → Botón: "Marcar Listo" para platos preparados

4. 💰 **Caja**
   → Página: "Caja / Cobros"
   → Cobras órdenes listas
   → Métodos: Efectivo o Yape
   → Botón: "Procesar Pago"

5. 🕐 **Historial**
   → Página: "Historial de Órdenes"
   → Ves todas las órdenes pasadas
   → Puedes reimprimir recibos

**SECCIÓN: Gerencia** (Solo Administrador)
6. 📊 **Finanzas**
   → Página: "Panel Financiero"
   → Resumen de ventas del día
   → Gráficos de ingresos y estadísticas

7. 📦 **Inventario**
   → Control de stock e insumos
   → Alertas de stock bajo

8. 👥 **Usuarios**
   → Registrar y gestionar empleados
   → Asignar roles

9. 📈 **Historial Menús**
   → Análisis de ventas por plato
   → Top de platos más vendidos
   → Tendencias históricas

🎯 CÓMO DAR INSTRUCCIONES:

CORRECTO ✅:
"Ve a 'Menú del Día' (menú lateral) y haz clic en '+ Agregar Item al Menú'"
"Abre 'Finanzas' en la sección Gerencia del menú lateral"
"En 'Caja', selecciona la orden y haz clic en 'Procesar Pago'"

INCORRECTO ❌:
"Ve a /menu" o "Abre Dashboard"
"Ve a la página de menú" (sé específico: 'Menú del Día')

💡 RESPUESTAS SEGÚN NECESIDAD:
- Ver ventas → "Finanzas" (sección Gerencia)
- Agregar plato → "Menú del Día" → botón verde
- Cobrar → "Caja" → "Procesar Pago"
- Ver historial → "Historial" o "Historial Menús" (por plato)

Sé específico, claro y usa los nombres exactos.
`;

    if (context === 'menu-analysis') {
      return `${basePrompt}

🎯 MODO: Análisis de Menú con Datos Reales

Eres experto en análisis de ventas. Tienes datos REALES del historial.

FORMATO DE RESPUESTA:
1. Recomendación directa (1-2 platos máximo)
2. Razón breve con números específicos
3. Opcional: 1 insight adicional

EJEMPLO:
"Recomiendo Lomo Saltado y Ceviche para mañana (martes).

El Lomo Saltado vendió 35 unidades los últimos martes (S/ 875), margen 60%.
El Ceviche vendió 28 unidades (S/ 560), margen 55%.

Los martes estos platos representan el 65% de tus ventas."

CONSIDERA:
- Día de la semana específico
- Ventas históricas de ese día
- Rentabilidad (margen)
- Tendencia reciente

RESPONDE EN MÁXIMO 4-5 LÍNEAS. Sé directo y práctico.
`;
    }

    return basePrompt;
  }

  /**
   * Realiza una llamada a la API de Groq (GRATIS y rápido)
   */
  private async callGroq(messages: ChatMessage[]): Promise<string> {
    try {
      if (!this.groq) {
        return 'Lo siento, el chatbot no está configurado correctamente. Por favor, contacta al administrador.';
      }

      // Convertir mensajes al formato compatible
      const groqMessages = messages.map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
        content: msg.content,
      }));

      // Llamar a Groq (API compatible con OpenAI)
      const completion = await this.groq.chat.completions.create({
        model: this.model,
        messages: groqMessages as any,
        temperature: 0.7,
        max_tokens: 400, // Reducido para respuestas más cortas
        top_p: 0.9,
      });

      const response = completion.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';
      return response;
    } catch (error) {
      console.error('Error al llamar a Groq:', error);

      // Respuesta de fallback
      if (error instanceof Error) {
        if (error.message.includes('API key') || error.message.includes('401')) {
          return 'Lo siento, hay un problema con la configuración de la API. Por favor, contacta al administrador.';
        }
        if (error.message.includes('quota') || error.message.includes('rate_limit')) {
          return 'Lo siento, se ha alcanzado el límite de uso de la API. Por favor, intenta más tarde.';
        }
      }

      return 'Lo siento, estoy experimentando problemas técnicos en este momento. Por favor, intenta de nuevo en unos momentos.';
    }
  }

  /**
   * Detecta si una pregunta es sobre recomendaciones de menú
   */
  private isMenuRecommendationQuery(message: string): boolean {
    const keywords = [
      'recomiend',
      'suger',
      'cocinar',
      'preparar',
      'mañana',
      'hoy',
      'plato',
      'comida',
      'menú',
      'vender',
      'popular',
      'rentable',
      'mejor',
      'qué hacer',
      'qué debo',
      'debería',
    ];

    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Calcula estadísticas resumidas del historial de menú
   */
  private calculateMenuStats(menuData: MenuAnalysisData[]): any {
    if (menuData.length === 0) return {};

    // Agrupar por plato
    const platosMap = new Map<string, {
      totalVentas: number;
      totalRevenue: number;
      totalCosto: number;
      dias: Set<string>;
    }>();

    menuData.forEach(item => {
      if (!platosMap.has(item.itemName)) {
        platosMap.set(item.itemName, {
          totalVentas: 0,
          totalRevenue: 0,
          totalCosto: 0,
          dias: new Set(),
        });
      }

      const plato = platosMap.get(item.itemName)!;
      plato.totalVentas += item.quantitySold;
      plato.totalRevenue += item.revenue;
      plato.totalCosto += item.costPerUnit * item.quantitySold;
      plato.dias.add(item.dayOfWeek);
    });

    // Convertir a array y calcular promedios
    const stats = Array.from(platosMap.entries()).map(([nombre, data]) => ({
      plato: nombre,
      ventasTotales: data.totalVentas,
      ventasPromedioPorDia: Math.round(data.totalVentas / data.dias.size),
      revenueTotal: Math.round(data.totalRevenue * 100) / 100,
      ganancia: Math.round((data.totalRevenue - data.totalCosto) * 100) / 100,
      margenGanancia: Math.round(((data.totalRevenue - data.totalCosto) / data.totalRevenue) * 100) + '%',
      diasDisponible: data.dias.size,
    }));

    // Ordenar por ventas totales
    stats.sort((a, b) => b.ventasTotales - a.ventasTotales);

    return {
      top5MasVendidos: stats.slice(0, 5),
      top5MasRentables: [...stats].sort((a, b) => b.ganancia - a.ganancia).slice(0, 5),
      totalPlatos: stats.length,
      diaActual: new Date().toLocaleDateString('es-PE', { weekday: 'long' }),
      fechaConsulta: new Date().toLocaleDateString('es-PE'),
    };
  }
}

export const chatbotService = new ChatbotService();