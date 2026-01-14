import { Router } from 'express';
import { transcriptionController, uploadMiddleware } from './transcription.controller';

const router = Router();

/**
 * POST /api/transcription/audio
 * Transcribe audio a texto usando Groq Whisper
 */
router.post('/audio', uploadMiddleware, (req, res) => {
  transcriptionController.transcribeAudio(req, res);
});

export default router;
