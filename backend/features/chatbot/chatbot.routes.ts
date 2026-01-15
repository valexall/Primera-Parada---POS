import { Router } from 'express';
import { chatbotController } from './chatbot.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = Router();

router.use(verifyToken);

router.post('/ask', (req, res) => chatbotController.ask(req, res));

router.get('/menu-suggestions', (req, res) => chatbotController.getMenuSuggestions(req, res));

router.get('/health', (req, res) => chatbotController.health(req, res));

export default router;
