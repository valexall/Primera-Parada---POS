import { Request, Response } from 'express';
import { chatbotService } from './chatbot.service';
import { ChatRequest } from './chatbot.types';

export class ChatbotController {

  async ask(req: Request, res: Response) {
    try {
      const chatRequest: ChatRequest = req.body;

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

  async health(req: Request, res: Response) {
    try {
      const isConfigured = !!process.env.GROQ_API_KEY;

      res.json({
        status: isConfigured ? 'ok' : 'warning',
        message: isConfigured
          ? 'Chatbot configurado correctamente con Groq'
          : 'API Key de Groq no configurada',
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
