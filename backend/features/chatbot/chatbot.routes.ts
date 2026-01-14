import { Router } from 'express';
import { chatbotController } from './chatbot.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// POST /api/chatbot/ask - Enviar mensaje al chatbot
router.post('/ask', (req, res) => chatbotController.ask(req, res));

// GET /api/chatbot/menu-suggestions - Obtener sugerencias de menú
router.get('/menu-suggestions', (req, res) => chatbotController.getMenuSuggestions(req, res));

// GET /api/chatbot/health - Health check
router.get('/health', (req, res) => chatbotController.health(req, res));

export default router;
