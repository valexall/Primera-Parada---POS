import { Request, Response } from 'express';
import { chatbotService } from './chatbot.service';
import { ChatRequest } from './chatbot.types';

export class ChatbotController {
  /**
   * Procesa un mensaje del chatbot
   * POST /api/chatbot/ask
   */
  async ask(req: Request, res: Response) {
    try {
      const chatRequest: ChatRequest = req.body;

      // Validación básica
      if (!chatRequest.message || chatRequest.message.trim() === '') {
        return res.status(400).json({
          error: 'El mensaje no puede estar vacío',
        });
      }

      const response = await chatbotService.processMessage(chatRequest);

      res.json(response);
    } catch (error: any) {
      console.error('Error en ChatbotController.ask:', error);
      res.status(500).json({
        error: 'Error al procesar el mensaje',
        details: error.message,
      });
    }
  }

  /**
   * Genera sugerencias de menú basadas en el historial
   * GET /api/chatbot/menu-suggestions
   */
  async getMenuSuggestions(req: Request, res: Response) {
    try {
      const suggestions = await chatbotService.generateMenuSuggestions();

      res.json({
        suggestions,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error('Error en ChatbotController.getMenuSuggestions:', error);
      res.status(500).json({
        error: 'Error al generar sugerencias de menú',
        details: error.message,
      });
    }
  }

  /**
   * Health check del servicio de chatbot
   * GET /api/chatbot/health
   */
  async health(req: Request, res: Response) {
    try {
      const isConfigured = !!process.env.OPENAI_API_KEY;

      res.json({
        status: isConfigured ? 'ok' : 'warning',
        message: isConfigured
          ? 'Chatbot configurado correctamente'
          : 'API Key de OpenAI no configurada',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Error al verificar el estado del chatbot',
        details: error.message,
      });
    }
  }
}

export const chatbotController = new ChatbotController();
